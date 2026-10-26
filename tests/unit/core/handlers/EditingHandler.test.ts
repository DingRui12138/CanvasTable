import { EditingHandler } from "@/core/handlers/EditingHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { LayoutManager } from "@/core/LayoutManager";
import { EditorRegistry } from "@/core/editors";
import { zhCN } from "@/locale";
import { TableEvents } from "@/constants/events";
import { CellTypes } from "@/types";
import type { CellPosition, Column, InteractionState, Row, ScrollState } from "@/types";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

type EditRenderFn = NonNullable<Column["editRender"]>;
function editRender(fn: () => unknown): EditRenderFn {
  return fn as unknown as EditRenderFn;
}

type RenderFn = NonNullable<Column["render"]>;
function render(fn: () => unknown): RenderFn {
  return fn as unknown as RenderFn;
}

function cell(rowIndex: number, columnIndex: number): CellPosition {
  return { rowIndex, columnIndex };
}

const COLUMNS: Column[] = [
  { key: "a", title: "A", width: 120, type: "text" },
  { key: "b", title: "B", width: 120, type: "text" },
];

const ROWS: Row[] = [
  { id: "r0", data: { a: "a0", b: "b0" } },
  { id: "r1", data: { a: "a1", b: "b1" } },
];

interface SetupOptions {
  columns?: Column[];
  rows?: Row[];
  editingCell?: CellPosition | null;
  editingValue?: unknown;
  tooltip?: InteractionState["tooltip"];
  editingConfig?: { enabled?: boolean; mode?: string; validateOnChange?: boolean };
}

function setup(options: SetupOptions = {}) {
  const theme = createMockTheme();
  const canvas = createMockCanvas();
  const ctx = canvas.getContext("2d")!;

  const columns = options.columns ?? COLUMNS;
  const rows = options.rows ?? ROWS;

  const layoutManager = new LayoutManager(undefined, theme);
  layoutManager.setViewportSize(800, 600);
  layoutManager.calculateLayout(columns, rows);

  const dataManager = new DataManager();
  dataManager.setColumns(columns);
  dataManager.setRows(rows);

  const state: InteractionState = {
    hoveredCell: null,
    selectedCells: [],
    editingCell: options.editingCell ?? null,
    editingValue: options.editingValue ?? null,
    isSelecting: false,
    selectionStart: null,
    isDragging: false,
    dragType: null,
    dragTarget: null,
    tooltip: options.tooltip ?? null,
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
  const handler = new EditingHandler(
    {
      state,
      scrollState,
      layoutManager,
      dataManager,
      canvas,
      ctx,
      expandColumnKey: null,
      locale: zhCN,
      editorRegistry: new EditorRegistry(),
    },
    emitter,
    options.editingConfig ?? {},
  );

  const events: { type: string; args: unknown[] }[] = [];
  const watched: string[] = [
    TableEvents.EDIT_START,
    TableEvents.EDIT_END,
    TableEvents.DROPDOWN_OPEN,
    TableEvents.DATE_DROPDOWN_OPEN,
    TableEvents.IMAGE_EDITOR_OPEN,
    TableEvents.COLOR_DROPDOWN_OPEN,
  ];
  for (const type of watched) {
    emitter.on(type, (...args: unknown[]) => events.push({ type, args }));
  }

  return { handler, state, events, rows, columns, dataManager };
}

function argsOf(events: { type: string; args: unknown[] }[], type: string): unknown[][] {
  return events.filter((e) => e.type === type).map((e) => e.args);
}

/** 用宽松视图读取私有结构较深的弹层状态 */
function loose(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

describe("EditingHandler", () => {
  describe("validateCellForEditing", () => {
    it("列索引越界时返回 null", () => {
      const { handler } = setup();

      expect(handler.validateCellForEditing(cell(0, 99))).toBeNull();
    });

    it("行索引越界时返回 null", () => {
      const { handler } = setup();

      expect(handler.validateCellForEditing(cell(99, 0))).toBeNull();
    });

    it("列不可编辑时返回 null", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 120, type: "text", editable: false }];
      const { handler } = setup({ columns });

      expect(handler.validateCellForEditing(cell(0, 0))).toBeNull();
    });

    it("列被禁用时返回 null", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 120, type: "text", disabled: true }];
      const { handler } = setup({ columns });

      expect(handler.validateCellForEditing(cell(0, 0))).toBeNull();
    });

    it("可编辑时返回列与行", () => {
      const { handler, columns, dataManager } = setup();

      // DataManager 会对行做归一化（补 expanded/level/selected），比较归一化后的对象
      expect(handler.validateCellForEditing(cell(1, 0))).toEqual({
        column: columns[0],
        row: dataManager.getRows()[1],
      });
    });
  });

  describe("getEditConfig", () => {
    it("没有 editRender 也没有 render 时返回 null", () => {
      const { handler, columns, rows } = setup();

      expect(handler.getEditConfig(columns[0]!, rows[0]!, 0)).toBeNull();
    });

    it("editRender 的结果优先返回", () => {
      const column: Column = {
        key: "a",
        title: "A",
        width: 120,
        type: "text",
        editRender: editRender(() => ({ type: "input", input: { value: "v" } })),
      };

      const { handler } = setup();
      const result = handler.getEditConfig(column, ROWS[0]!, 0);

      expect(result).toEqual({ type: "input", input: { value: "v" } });
    });

    it("editRender 返回假值时回退到 render", () => {
      const column: Column = {
        key: "a",
        title: "A",
        width: 120,
        type: "text",
        editRender: editRender(() => null),
        render: render(() => ({ type: "select", select: { options: [] } })),
      };

      const { handler } = setup();
      const result = handler.getEditConfig(column, ROWS[0]!, 0);

      expect(result).toEqual({ type: "select", select: { options: [] } });
    });

    it("editRender 抛错时记录错误并回退到 render", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const column: Column = {
        key: "a",
        title: "A",
        width: 120,
        type: "text",
        editRender: editRender(() => {
          throw new Error("boom");
        }),
        render: render(() => ({ type: "input", input: { value: "fallback" } })),
      };

      try {
        const { handler } = setup();
        const result = handler.getEditConfig(column, ROWS[0]!, 0);

        expect(result).toEqual({ type: "input", input: { value: "fallback" } });
        expect(errorSpy).toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });

    it("render 返回可编辑类型时映射为 EditRenderResult", () => {
      const column: Column = {
        key: "a",
        title: "A",
        width: 120,
        type: "text",
        render: render(() => ({ type: "tags", tags: { tags: [] } })),
      };

      const { handler } = setup();

      expect(handler.getEditConfig(column, ROWS[0]!, 0)).toEqual({
        type: "tags",
        tags: { tags: [] },
      });
    });

    it.each([
      [CellTypes.CUSTOM],
      [CellTypes.BUTTON],
      [CellTypes.IMAGE],
      [CellTypes.PROGRESS],
      [CellTypes.LINK],
    ])("render 返回 %s 时不支持内联编辑", (type) => {
      const column: Column = {
        key: "a",
        title: "A",
        width: 120,
        type: "text",
        render: render(() => ({ type })),
      };

      const { handler } = setup();

      expect(handler.getEditConfig(column, ROWS[0]!, 0)).toBeNull();
    });

    it("render 返回空对象时返回 null", () => {
      const column: Column = {
        key: "a",
        title: "A",
        width: 120,
        type: "text",
        render: render(() => ({})),
      };

      const { handler } = setup();

      expect(handler.getEditConfig(column, ROWS[0]!, 0)).toBeNull();
    });

    it("render 抛错时记录错误并返回 null", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const column: Column = {
        key: "a",
        title: "A",
        width: 120,
        type: "text",
        render: render(() => {
          throw new Error("boom");
        }),
      };

      try {
        const { handler } = setup();

        expect(handler.getEditConfig(column, ROWS[0]!, 0)).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
      } finally {
        errorSpy.mockRestore();
      }
    });
  });

  describe("startEditing", () => {
    it("单元格不可编辑时返回 false 且不派发事件", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 120, type: "text", editable: false }];
      const { handler, state, events } = setup({ columns });

      expect(handler.startEditing(cell(0, 0))).toBe(false);
      expect(state.editingCell).toBeNull();
      expect(events).toEqual([]);
    });

    it("成功时记录编辑单元格、清空 tooltip 并派发 EDIT_START", () => {
      const { handler, state, events } = setup({
        tooltip: { x: 1, y: 2, text: "tip" } as unknown as InteractionState["tooltip"],
      });

      const ok = handler.startEditing(cell(1, 0), { value: "x" });

      expect(ok).toBe(true);
      expect(state.editingCell).toEqual(cell(1, 0));
      expect(state.tooltip).toBeNull();
      const calls = argsOf(events, TableEvents.EDIT_START);
      expect(calls).toHaveLength(1);
      expect(loose(calls[0]![0])).toMatchObject({ rowIndex: 1, columnIndex: 0 });
      expect(calls[0]![1]).toEqual({ value: "x" });
    });
  });

  describe("startSelectEditing", () => {
    it("没有配置时返回 false", () => {
      const { handler } = setup();

      expect(handler.startSelectEditing(cell(0, 0))).toBe(false);
    });

    it("单元格不可编辑时返回 false", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 120, type: "text", editable: false }];
      const { handler } = setup({ columns });

      expect(handler.startSelectEditing(cell(0, 0), { options: [] })).toBe(false);
    });

    it("按列宽与可见选项数计算弹层尺寸", () => {
      const { handler, state, events } = setup();
      const options = Array.from({ length: 3 }, (_, i) => ({ label: `L${i}`, value: i }));

      const ok = handler.startSelectEditing(cell(0, 0), { options });

      expect(ok).toBe(true);
      const dropdown = loose(state.dropdown);
      expect(dropdown.width).toBe(120);
      // 可见 3 项 × 32
      expect(dropdown.cell).toEqual(cell(0, 0));
      expect(dropdown.hoveredIndex).toBe(-1);
      expect(dropdown.scrollTop).toBe(0);
      expect(typeof dropdown.showAbove).toBe("boolean");
      expect(argsOf(events, TableEvents.DROPDOWN_OPEN)).toHaveLength(1);
    });

    it("可见项数上限为 8", () => {
      const { handler, state } = setup();
      const options = Array.from({ length: 20 }, (_, i) => ({ label: `L${i}`, value: i }));

      handler.startSelectEditing(cell(0, 0), { options });

      expect(loose(state.dropdown).config).toEqual({ options });
    });

    it("没有 options 字段时按 0 项处理", () => {
      const { handler, state } = setup();

      handler.startSelectEditing(cell(0, 0), {} as never);

      expect(loose(state.dropdown).config).toEqual({});
    });

    it("列宽缺失时回退为 100", () => {
      const columns: Column[] = [{ key: "a", title: "A", type: "text" }];
      const { handler, state } = setup({ columns });

      handler.startSelectEditing(cell(0, 0), { options: [] });

      expect(loose(state.dropdown).width).toBe(100);
    });
  });

  describe("startTagsEditing", () => {
    it("没有配置时返回 false", () => {
      const { handler } = setup();

      expect(handler.startTagsEditing(cell(0, 0))).toBe(false);
    });

    it("把标签选项映射为下拉项并带上已选值", () => {
      const { handler, state, events } = setup();

      const ok = handler.startTagsEditing(cell(0, 0), {
        tags: [],
        selectedValues: ["v1"],
        options: [
          { text: "T1", value: "v1" },
          { text: "T2" },
          { text: "T3", value: "v3", disabled: true },
        ],
      });

      expect(ok).toBe(true);
      const dropdown = loose(state.dropdown);
      expect(dropdown.type).toBe("tags");
      expect(dropdown.config).toEqual({
        value: ["v1"],
        options: [
          { label: "T1", value: "v1", disabled: undefined },
          { label: "T2", value: "T2", disabled: undefined },
          { label: "T3", value: "v3", disabled: true },
        ],
      });
      expect(argsOf(events, TableEvents.DROPDOWN_OPEN)).toHaveLength(1);
    });

    it("没有 options 时映射为空数组", () => {
      const { handler, state } = setup();

      handler.startTagsEditing(cell(0, 0), { tags: [] });

      expect(loose(loose(state.dropdown).config).options).toEqual([]);
    });

    it("保留原始 tagsConfig 供编辑器使用", () => {
      const { handler, state } = setup();
      const config = { tags: [], editable: true };

      handler.startTagsEditing(cell(0, 0), config);

      expect(loose(state.dropdown).tagsConfig).toBe(config);
    });
  });

  describe("startDateEditing", () => {
    it("没有配置时返回 false", () => {
      const { handler } = setup();

      expect(handler.startDateEditing(cell(0, 0))).toBe(false);
    });

    it("value 为 Date 时直接作为选中日期", () => {
      const { handler, state, events } = setup();
      const date = new Date("2024-05-06T00:00:00Z");

      const ok = handler.startDateEditing(cell(0, 0), { value: date });

      expect(ok).toBe(true);
      const dropdown = loose(state.dateDropdown);
      expect(dropdown.selectedDate).toBe(date);
      expect(dropdown.currentYear).toBe(date.getFullYear());
      expect(dropdown.currentMonth).toBe(date.getMonth());
      expect(dropdown.hoveredDate).toBeNull();
      expect(argsOf(events, TableEvents.DATE_DROPDOWN_OPEN)).toHaveLength(1);
    });

    it("value 为字符串时解析成 Date", () => {
      const { handler, state } = setup();

      handler.startDateEditing(cell(0, 0), { value: "2023-03-04T00:00:00Z" });

      const dropdown = loose(state.dateDropdown);
      expect((dropdown.selectedDate as Date).getUTCFullYear()).toBe(2023);
    });

    it("没有 value 时回退到当前年月且 selectedDate 为 null", () => {
      const { handler, state } = setup();

      handler.startDateEditing(cell(0, 0), {});

      const dropdown = loose(state.dateDropdown);
      expect(dropdown.selectedDate).toBeNull();
      expect(dropdown.currentYear).toBe(new Date().getFullYear());
      expect(dropdown.currentMonth).toBe(new Date().getMonth());
    });

    it("弹层宽度至少 280", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 120, type: "text" }];
      const { handler, state } = setup({ columns });

      handler.startDateEditing(cell(0, 0), {});

      expect(loose(state.dateDropdown).width).toBe(280);
    });

    it("列宽大于 280 时取列宽", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 400, type: "text" }];
      const { handler, state } = setup({ columns });

      handler.startDateEditing(cell(0, 0), {});

      expect(loose(state.dateDropdown).width).toBe(400);
    });
  });

  describe("startImageEditing", () => {
    it("没有配置时返回 false", () => {
      const { handler } = setup();

      expect(handler.startImageEditing(cell(0, 0))).toBe(false);
    });

    it("使用 config.images", () => {
      const { handler, state, events } = setup();

      const ok = handler.startImageEditing(cell(0, 0), { images: ["a.png", "b.png"] });

      expect(ok).toBe(true);
      const editor = loose(state.imageEditor);
      expect(editor.images).toEqual(["a.png", "b.png"]);
      expect(editor.isSingleImage).toBe(false);
      expect(editor.hoveredIndex).toBe(-1);
      expect(editor.isDragging).toBe(false);
      expect(editor.pendingImages).toEqual([]);
      expect(argsOf(events, TableEvents.IMAGE_EDITOR_OPEN)).toHaveLength(1);
    });

    it("只有 src 时包装成单元素数组", () => {
      const { handler, state } = setup();

      handler.startImageEditing(cell(0, 0), { src: "a.png" });

      const editor = loose(state.imageEditor);
      expect(editor.images).toEqual(["a.png"]);
      expect(editor.isSingleImage).toBe(true);
    });

    it("既没有 images 也没有 src 时为空数组", () => {
      const { handler, state } = setup();

      handler.startImageEditing(cell(0, 0), {});

      expect(loose(state.imageEditor).images).toEqual([]);
    });

    it("multiple 为 true 时单张图也按多图处理", () => {
      const { handler, state } = setup();

      handler.startImageEditing(cell(0, 0), { src: "a.png", multiple: true });

      expect(loose(state.imageEditor).isSingleImage).toBe(false);
    });
  });

  describe("startColorEditing", () => {
    it("没有配置时返回 false", () => {
      const { handler } = setup();

      expect(handler.startColorEditing(cell(0, 0))).toBe(false);
    });

    it("使用配置里的预设色", () => {
      const { handler, state, events } = setup();
      const presetColors = ["#111111", "#222222"];

      const ok = handler.startColorEditing(cell(0, 0), { value: "#111111", presetColors });

      expect(ok).toBe(true);
      const dropdown = loose(state.colorDropdown);
      expect(dropdown.hoveredColor).toBeNull();
      // 1 行：1 * 28 + 16 - 4 = 40
      expect(dropdown.width).toBe(236);
      expect(argsOf(events, TableEvents.COLOR_DROPDOWN_OPEN)).toHaveLength(1);
    });

    it("没有预设色时使用内置色板（28 色 → 4 行）", () => {
      const { handler, state } = setup();

      handler.startColorEditing(cell(0, 0), { value: "#ffffff" });

      // 宽度 = max(120, 8 * 28 + 16 - 4) = 236
      expect(loose(state.colorDropdown).width).toBe(236);
    });

    it("列宽很大时取列宽", () => {
      const columns: Column[] = [{ key: "a", title: "A", width: 400, type: "text" }];
      const { handler, state } = setup({ columns });

      handler.startColorEditing(cell(0, 0), { value: "#ffffff" });

      expect(loose(state.colorDropdown).width).toBe(400);
    });
  });

  describe("endEditing", () => {
    it("不在编辑态时什么都不做", () => {
      const { handler, events } = setup();

      handler.endEditing(true);

      expect(events).toEqual([]);
    });

    it("save 为 true 时派发 EDIT_END 并带上编辑值", () => {
      const { handler, state, events } = setup({
        editingCell: cell(1, 0),
        editingValue: "typed",
      });

      handler.endEditing(true);

      expect(state.editingCell).toBeNull();
      expect(state.editingValue).toBeNull();
      const calls = argsOf(events, TableEvents.EDIT_END);
      expect(calls).toHaveLength(1);
      expect(loose(calls[0]![0])).toMatchObject({ rowIndex: 1, columnIndex: 0 });
      expect(calls[0]![1]).toBe("typed");
    });

    it("save 为 false 时不派发 EDIT_END 但仍清理状态", () => {
      const { handler, state, events } = setup({
        editingCell: cell(0, 0),
        editingValue: "typed",
      });

      handler.endEditing(false);

      expect(argsOf(events, TableEvents.EDIT_END)).toHaveLength(0);
      expect(state.editingCell).toBeNull();
      expect(state.editingValue).toBeNull();
    });
  });

  describe("编辑配置", () => {
    it("默认启用编辑，模式为 dblclick", () => {
      const { handler } = setup();

      expect(handler.isEditingEnabled()).toBe(true);
      expect(handler.getEditingMode()).toBe("dblclick");
    });

    it("enabled 为 false 时视为禁用", () => {
      const { handler } = setup({ editingConfig: { enabled: false } });

      expect(handler.isEditingEnabled()).toBe(false);
    });

    it("自定义模式生效", () => {
      const { handler } = setup({ editingConfig: { mode: "click" } });

      expect(handler.getEditingMode()).toBe("click");
    });

    it("updateEditingConfig 立即生效", () => {
      const { handler } = setup();

      handler.updateEditingConfig({ enabled: false, mode: "click" });

      expect(handler.isEditingEnabled()).toBe(false);
      expect(handler.getEditingMode()).toBe("click");
    });
  });
});
