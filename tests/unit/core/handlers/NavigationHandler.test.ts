import { NavigationHandler } from "@/core/handlers/NavigationHandler";
import { SelectionHandler } from "@/core/handlers/SelectionHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { LayoutManager } from "@/core/LayoutManager";
import { EditorRegistry } from "@/core/editors";
import { zhCN } from "@/locale";
import { TableEvents } from "@/constants/events";
import type {
  CellPosition,
  CellRange,
  CellType,
  Column,
  InteractionState,
  Row,
  ScrollState,
} from "@/types";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

const TEXT_COLUMNS: Column[] = [
  { key: "a", title: "A", width: 100, type: "text" },
  { key: "b", title: "B", width: 100, type: "text" },
  { key: "c", title: "C", width: 100, type: "text" },
];

const BASE_ROWS: Row[] = [
  { id: "r0", data: { a: "a0", b: "b0", c: "c0" } },
  { id: "r1", data: { a: "a1", b: "b1", c: "c1" } },
  { id: "r2", data: { a: "a2", b: "b2", c: "c2" } },
];

function cell(rowIndex: number, columnIndex: number): CellPosition {
  return { rowIndex, columnIndex };
}

function range(start: [number, number], end: [number, number]): CellRange {
  return { start: cell(start[0], start[1]), end: cell(end[0], end[1]) };
}

function key(k: string): KeyboardEvent {
  return new KeyboardEvent("keydown", { key: k, cancelable: true });
}

/** editRender 声明为非空返回，这里放宽签名以便测试假值 / 未知类型等分支 */
type EditRenderFn = NonNullable<Column["editRender"]>;
function editRender(fn: () => unknown): EditRenderFn {
  return fn as unknown as EditRenderFn;
}

interface SetupOptions {
  columns?: Column[];
  rows?: Row[];
  selectedCells?: CellRange[];
  editingConfig?: { enabled?: boolean; mode?: string; validateOnChange?: boolean };
  editingCell?: CellPosition | null;
  viewport?: [number, number];
}

function setup(options: SetupOptions = {}) {
  const theme = createMockTheme();
  const canvas = createMockCanvas();
  const ctx = canvas.getContext("2d")!;

  const columns = options.columns ?? TEXT_COLUMNS;
  const rows = options.rows ?? BASE_ROWS;

  const layoutManager = new LayoutManager(undefined, theme);
  const [vw, vh] = options.viewport ?? [800, 600];
  layoutManager.setViewportSize(vw, vh);
  layoutManager.calculateLayout(columns, rows);

  const dataManager = new DataManager();
  dataManager.setColumns(columns);
  dataManager.setRows(rows);

  const state: InteractionState = {
    hoveredCell: null,
    selectedCells: options.selectedCells ?? [],
    editingCell: options.editingCell ?? null,
    editingValue: null,
    isSelecting: false,
    selectionStart: null,
    isDragging: false,
    dragType: null,
    dragTarget: null,
    tooltip: null,
    dropdown: null,
    filterDropdown: null,
    dateDropdown: null,
    colorDropdown: null,
    buttonsDropdown: null,
    imageTooltip: null,
    imageEditor: null,
    contextMenu: null,
    headerContextMenu: null,
    switchAnimations: new Map(),
    buttonHoverStates: new Map(),
  };

  const scrollState: ScrollState = {
    scrollLeft: 0,
    scrollTop: 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
    isScrolling: false,
  };

  const emitter = new EventEmitter<InteractionEvents>();
  const handlerContext = {
    state,
    scrollState,
    layoutManager,
    dataManager,
    canvas,
    ctx,
    expandColumnKey: null,
    locale: zhCN,
    editorRegistry: new EditorRegistry(),
  };

  const selectionHandler = new SelectionHandler(handlerContext, emitter);
  const handler = new NavigationHandler(
    handlerContext,
    emitter,
    selectionHandler,
    options.editingConfig ?? {},
  );

  const events: { type: string; args: unknown[] }[] = [];
  const watched: string[] = [
    TableEvents.SWITCH_CHANGE,
    TableEvents.EXPAND,
    TableEvents.SCROLL,
  ];
  for (const type of watched) {
    emitter.on(type, (...args: unknown[]) => events.push({ type, args }));
  }

  return { handler, state, scrollState, layoutManager, events, selectionHandler, dataManager };
}

function argsOf(events: { type: string; args: unknown[] }[], type: string): unknown[][] {
  return events.filter((e) => e.type === type).map((e) => e.args);
}

describe("NavigationHandler", () => {
  describe("方向键导航", () => {
    it("会阻止默认滚动行为", () => {
      const { handler } = setup();
      const event = key("ArrowDown");

      handler.handleArrowNavigation(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it("没有选区时从 (0,0) 出发", () => {
      const { handler, state } = setup();

      handler.handleArrowNavigation(key("ArrowDown"));

      expect(state.selectedCells).toEqual([range([1, 0], [1, 0])]);
    });

    it("ArrowUp 向上移动一行", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 1], [1, 1])] });

      handler.handleArrowNavigation(key("ArrowUp"));

      expect(state.selectedCells).toEqual([range([0, 1], [0, 1])]);
    });

    it("ArrowUp 在第一行时保持在 0", () => {
      const { handler, state } = setup({ selectedCells: [range([0, 1], [0, 1])] });

      handler.handleArrowNavigation(key("ArrowUp"));

      expect(state.selectedCells).toEqual([range([0, 1], [0, 1])]);
    });

    it("ArrowDown 在最后一行时被夹住", () => {
      const { handler, state } = setup({ selectedCells: [range([2, 1], [2, 1])] });

      handler.handleArrowNavigation(key("ArrowDown"));

      expect(state.selectedCells).toEqual([range([2, 1], [2, 1])]);
    });

    it("ArrowLeft 向左移动一列", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 2], [1, 2])] });

      handler.handleArrowNavigation(key("ArrowLeft"));

      expect(state.selectedCells).toEqual([range([1, 1], [1, 1])]);
    });

    it("ArrowLeft 在第一列时保持在 0", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 0], [1, 0])] });

      handler.handleArrowNavigation(key("ArrowLeft"));

      expect(state.selectedCells).toEqual([range([1, 0], [1, 0])]);
    });

    it("ArrowRight 在最后一列时被夹住", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 2], [1, 2])] });

      handler.handleArrowNavigation(key("ArrowRight"));

      expect(state.selectedCells).toEqual([range([1, 2], [1, 2])]);
    });

    it("向上/向左时以选区起点为基准", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 0], [2, 1])] });

      handler.handleArrowNavigation(key("ArrowUp"));

      expect(state.selectedCells).toEqual([range([0, 0], [0, 0])]);
    });

    it("向下/向右时以选区终点为基准", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 0], [2, 1])] });

      handler.handleArrowNavigation(key("ArrowRight"));

      expect(state.selectedCells).toEqual([range([2, 2], [2, 2])]);
    });

    it("向下时以选区终点行号为基准", () => {
      const { handler, state } = setup({ selectedCells: [range([0, 0], [1, 0])] });

      handler.handleArrowNavigation(key("ArrowDown"));

      expect(state.selectedCells).toEqual([range([2, 0], [2, 0])]);
    });

    it("未识别的按键不会移动选区", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 1], [1, 1])] });

      handler.handleArrowNavigation(key("PageDown"));

      expect(state.selectedCells).toEqual([range([1, 1], [1, 1])]);
    });

    it("下移一行时目标仍在视口内，不派发 SCROLL", () => {
      const manyRows: Row[] = Array.from({ length: 100 }, (_, i) => ({ id: `r${i}`, data: {} }));
      const { handler, scrollState, events } = setup({
        rows: manyRows,
        selectedCells: [range([0, 0], [0, 0])],
      });

      handler.handleArrowNavigation(key("ArrowDown"));

      expect(argsOf(events, TableEvents.SCROLL)).toHaveLength(0);
      expect(scrollState.scrollTop).toBe(0);
    });

    it("目标单元格在视口外时派发 SCROLL", () => {
      const manyRows: Row[] = Array.from({ length: 100 }, (_, i) => ({ id: `r${i}`, data: {} }));
      const { handler, layoutManager, scrollState, events } = setup({
        rows: manyRows,
        selectedCells: [range([90, 0], [90, 0])],
      });
      const expectedTop = layoutManager.getScrollOffsetForRow(91);

      handler.handleArrowNavigation(key("ArrowDown"));

      expect(expectedTop).toBeGreaterThan(0);
      expect(argsOf(events, TableEvents.SCROLL)).toEqual([[0, expectedTop]]);
      expect(scrollState.scrollTop).toBe(expectedTop);
    });
  });

  describe("回车键", () => {
    it("没有选区时返回 null 且不阻止默认行为", () => {
      const { handler } = setup();
      const event = key("Enter");

      const result = handler.handleEnterKey(event);

      expect(result).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    });

    it("有选区时阻止默认行为", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 0])] });
      const event = key("Enter");

      handler.handleEnterKey(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it("editingConfig.enabled 为 false 时只切换展开", () => {
      const rows: Row[] = [{ id: "r0", data: { a: "a0" }, children: [{ id: "c", data: {} }] }];
      const { handler, events, dataManager } = setup({
        rows,
        selectedCells: [range([0, 0], [0, 0])],
        editingConfig: { enabled: false },
      });

      const result = handler.handleEnterKey(key("Enter"));

      expect(result).toBeNull();
      // DataManager 会归一化行（补 expanded/level/selected），按归一化后的对象比较
      expect(argsOf(events, TableEvents.EXPAND)).toEqual([[dataManager.getRows()[0], 0, true]]);
    });

    it("updateEditingConfig 之后行为随之变化", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 0])] });

      handler.updateEditingConfig({ enabled: false });

      expect(handler.handleEnterKey(key("Enter"))).toBeNull();
    });
  });

  describe("回车键：交互控件", () => {
    it("checkbox 列只切换行展开，不进入编辑", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 100, type: "checkbox" }];
      const rows: Row[] = [
        { id: "r0", data: { a: true }, children: [{ id: "c", data: {} }], expanded: true },
      ];
      const { handler, events, dataManager } = setup({ columns, rows, selectedCells: [range([0, 0], [0, 0])] });

      const result = handler.handleEnterKey(key("Enter"));

      expect(result).toBeNull();
      expect(argsOf(events, TableEvents.EXPAND)).toEqual([[dataManager.getRows()[0], 0, false]]);
    });

    it("radio 列同样只切换展开", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 100, type: "radio" }];
      const rows: Row[] = [{ id: "r0", data: { a: "x" }, children: [{ id: "c", data: {} }] }];
      const { handler, events } = setup({ columns, rows, selectedCells: [range([0, 0], [0, 0])] });

      handler.handleEnterKey(key("Enter"));

      expect(argsOf(events, TableEvents.EXPAND)).toHaveLength(1);
    });

    it("button 列同样只切换展开", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 100, type: "button" }];
      const rows: Row[] = [{ id: "r0", data: { a: "go" }, children: [{ id: "c", data: {} }] }];
      const { handler, events } = setup({ columns, rows, selectedCells: [range([0, 0], [0, 0])] });

      handler.handleEnterKey(key("Enter"));

      expect(argsOf(events, TableEvents.EXPAND)).toHaveLength(1);
    });

    it("switch 列在可编辑时派发 SWITCH_CHANGE 并取反当前值", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 100, type: "switch" }];
      const rows: Row[] = [{ id: "r0", data: { a: true } }];
      const { handler, events } = setup({ columns, rows, selectedCells: [range([0, 0], [0, 0])] });

      const result = handler.handleEnterKey(key("Enter"));

      expect(result).toBeNull();
      const calls = argsOf(events, TableEvents.SWITCH_CHANGE);
      expect(calls).toHaveLength(1);
      expect(calls[0]![1]).toBe(false);
    });

    it("switch 列不可编辑时不派发 SWITCH_CHANGE", () => {
      const columns: Column[] = [
        { key: "a", title: "A", width: 100, type: "switch", editable: false },
      ];
      const rows: Row[] = [{ id: "r0", data: { a: true } }];
      const { handler, events } = setup({ columns, rows, selectedCells: [range([0, 0], [0, 0])] });

      const result = handler.handleEnterKey(key("Enter"));

      expect(result).toBeNull();
      expect(argsOf(events, TableEvents.SWITCH_CHANGE)).toHaveLength(0);
    });
  });

  describe("回车键：可编辑性判断", () => {
    it("editable 为 false 时不进入编辑", () => {
      const columns: Column[] = [
        { key: "a", title: "A", width: 100, type: "text", editable: false },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toBeNull();
    });

    it("disabled 为 true 时不进入编辑", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 100, type: "text", disabled: true }];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toBeNull();
    });

    it("input.readonly 为 true 时不进入编辑", () => {
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "text",
          render: () => ({ input: { readonly: true } }),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toBeNull();
    });

    it("选区指向不存在的行列时返回 null", () => {
      const { handler } = setup({ selectedCells: [range([99, 99], [99, 99])] });

      expect(handler.handleEnterKey(key("Enter"))).toBeNull();
    });
  });

  describe("回车键：编辑配置推导", () => {
    it("普通文本列回退为 input 类型", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "input", config: undefined });
    });

    it("select 列返回 select 配置", () => {
      const selectConfig = { options: [{ label: "A", value: "a" }], value: "a" };
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "select",
          render: () => ({ select: selectConfig }),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "select", config: selectConfig });
    });

    it("可编辑 tag 列返回 tags 配置", () => {
      const tagsConfig = { tags: [], editable: true };
      const columns: Column[] = [
        { key: "a", title: "A", width: 100, type: "tag", render: () => ({ tags: tagsConfig }) },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "tags", config: tagsConfig });
    });

    it("不可编辑 tag 列回退为 input", () => {
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "tag",
          render: () => ({ tags: { tags: [], editable: false } }),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "input", config: undefined });
    });

    it("date 列返回 date 配置", () => {
      const dateConfig = { value: "2026-01-01" };
      const columns: Column[] = [
        { key: "a", title: "A", width: 100, type: "date", render: () => ({ date: dateConfig }) },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "date", config: dateConfig });
    });

    it("image 列返回 image 配置", () => {
      const imageConfig = { src: "a.png" };
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "image",
          editable: true,
          render: () => ({ image: imageConfig }),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "image", config: imageConfig });
    });

    it("editRender 优先于内置推导", () => {
      const inputConfig = { value: "v" };
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "text",
          editRender: editRender(() => ({ type: "input", input: inputConfig })),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "input", config: inputConfig });
    });

    const editRenderCases: [CellType, string, unknown][] = [
      ["select", "select", { options: [] }],
      ["tag", "tags", { tags: [] }],
      ["date", "date", { value: "2026-01-01" }],
      ["checkbox", "checkbox", { checked: true }],
      ["radio", "radio", { options: [] }],
      ["switch", "switch", { checked: false }],
    ];

    it.each(editRenderCases)("editRender 返回 %s 时按同名键取配置", (type, configKey, config) => {
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "text",
          editRender: editRender(() => ({ type, [configKey]: config })),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type, config });
    });

    it("editRender 返回未知类型时 config 为 undefined", () => {
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "text",
          editRender: editRender(() => ({ type: "custom", custom: { x: 1 } })),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "custom", config: undefined });
    });

    it("editRender 返回假值时不生效，回退到内置推导", () => {
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "text",
          editRender: editRender(() => null),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "input", config: undefined });
    });

    it("editRender 抛错时记录错误并回退到内置推导", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const columns: Column[] = [
        {
          key: "a",
          title: "A",
          width: 100,
          type: "text",
          editRender: editRender(() => {
            throw new Error("boom");
          }),
        },
      ];
      const { handler } = setup({ columns, selectedCells: [range([0, 0], [0, 0])] });

      try {
        expect(handler.handleEnterKey(key("Enter"))).toEqual({ type: "input", config: undefined });
        expect(errorSpy).toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  });

  describe("行展开", () => {
    it("没有子行时不派发 EXPAND", () => {
      const { handler, events } = setup({ selectedCells: [range([0, 0], [0, 0])] });

      handler.handleEnterKey(key("Enter"));

      expect(argsOf(events, TableEvents.EXPAND)).toHaveLength(0);
    });

    it("子行为空数组时不派发 EXPAND", () => {
      const rows: Row[] = [{ id: "r0", data: {}, children: [] }];
      const { handler, events } = setup({ rows, selectedCells: [range([0, 0], [0, 0])] });

      handler.handleEnterKey(key("Enter"));

      expect(argsOf(events, TableEvents.EXPAND)).toHaveLength(0);
    });

    it("有子行且未展开时请求展开", () => {
      const rows: Row[] = [{ id: "r0", data: {}, children: [{ id: "c", data: {} }] }];
      const { handler, events, dataManager } = setup({
        rows,
        selectedCells: [range([0, 0], [0, 0])],
        editingConfig: { enabled: false },
      });

      handler.handleEnterKey(key("Enter"));

      expect(argsOf(events, TableEvents.EXPAND)).toEqual([[dataManager.getRows()[0], 0, true]]);
    });

    it("有子行且已展开时请求折叠", () => {
      const rows: Row[] = [
        { id: "r0", data: {}, children: [{ id: "c", data: {} }], expanded: true },
      ];
      const { handler, events, dataManager } = setup({
        rows,
        selectedCells: [range([0, 0], [0, 0])],
        editingConfig: { enabled: false },
      });

      handler.handleEnterKey(key("Enter"));

      expect(argsOf(events, TableEvents.EXPAND)).toEqual([[dataManager.getRows()[0], 0, false]]);
    });
  });

  describe("编辑态按键", () => {
    it("不在编辑态时返回 false", () => {
      const { handler } = setup();

      expect(handler.handleEditingKeyDown(key("Enter"))).toBe(false);
    });

    it("Enter 返回 true 表示结束编辑", () => {
      const { handler } = setup({ editingCell: cell(0, 0) });
      const event = key("Enter");

      expect(handler.handleEditingKeyDown(event)).toBe(true);
      expect(event.defaultPrevented).toBe(false);
    });

    it("Escape 返回 true 表示取消编辑", () => {
      const { handler } = setup({ editingCell: cell(0, 0) });

      expect(handler.handleEditingKeyDown(key("Escape"))).toBe(true);
    });

    it("Tab 阻止默认行为并返回 true", () => {
      const { handler } = setup({ editingCell: cell(0, 0) });
      const event = key("Tab");

      expect(handler.handleEditingKeyDown(event)).toBe(true);
      expect(event.defaultPrevented).toBe(true);
    });

    it("其他按键返回 false", () => {
      const { handler } = setup({ editingCell: cell(0, 0) });

      expect(handler.handleEditingKeyDown(key("a"))).toBe(false);
    });
  });

  describe("scrollToCell", () => {
    it("目标已在当前位置时不派发 SCROLL", () => {
      const { handler, events } = setup();

      handler.scrollToCell(cell(1, 1));

      expect(argsOf(events, TableEvents.SCROLL)).toHaveLength(0);
    });

    it("目标在视口外时更新滚动位置并派发 SCROLL", () => {
      const manyRows: Row[] = Array.from({ length: 100 }, (_, i) => ({ id: `r${i}`, data: {} }));
      const { handler, layoutManager, scrollState, events } = setup({ rows: manyRows });
      const expectedTop = layoutManager.getScrollOffsetForRow(80);

      handler.scrollToCell(cell(80, 0));

      expect(expectedTop).toBeGreaterThan(0);
      expect(scrollState.scrollTop).toBe(expectedTop);
      expect(argsOf(events, TableEvents.SCROLL)).toEqual([[0, expectedTop]]);
    });
  });
});
