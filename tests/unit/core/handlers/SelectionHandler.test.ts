import { SelectionHandler } from "@/core/handlers/SelectionHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { LayoutManager } from "@/core/LayoutManager";
import { EditorRegistry } from "@/core/editors";
import { zhCN } from "@/locale";
import { TableEvents } from "@/constants/events";
import type { CellPosition, CellRange, Column, InteractionState, Row, ScrollState } from "@/types";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

function cell(rowIndex: number, columnIndex: number): CellPosition {
  return { rowIndex, columnIndex };
}

function range(start: [number, number], end: [number, number]): CellRange {
  return { start: cell(start[0], start[1]), end: cell(end[0], end[1]) };
}

interface SetupOptions {
  columns?: Column[];
  rows?: Row[];
  selectedCells?: CellRange[];
  selectionStart?: CellPosition | null;
  viewport?: [number, number];
  skipLayout?: boolean;
}

function setup(options: SetupOptions = {}) {
  const theme = createMockTheme();
  const canvas = createMockCanvas();
  const ctx = canvas.getContext("2d")!;

  const columns: Column[] =
    options.columns ??
    [
      { key: "a", title: "A", width: 100, type: "text" },
      { key: "b", title: "B", width: 100, type: "text" },
      { key: "c", title: "C", width: 100, type: "text" },
    ];
  const rows: Row[] =
    options.rows ??
    [
      { id: "r0", data: { a: "a0", b: "b0", c: "c0" } },
      { id: "r1", data: { a: "a1", b: "b1", c: "c1" } },
      { id: "r2", data: { a: "a2", b: "b2", c: "c2" } },
    ];

  const layoutManager = new LayoutManager(undefined, theme);
  const [vw, vh] = options.viewport ?? [800, 600];
  layoutManager.setViewportSize(vw, vh);
  if (!options.skipLayout) {
    layoutManager.calculateLayout(columns, rows);
  }

  const dataManager = new DataManager();
  dataManager.setColumns(columns);
  dataManager.setRows(rows);

  const state: InteractionState = {
    hoveredCell: null,
    selectedCells: options.selectedCells ?? [],
    editingCell: null,
    editingValue: null,
    isSelecting: false,
    selectionStart: options.selectionStart ?? null,
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
  const handler = new SelectionHandler(
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
  );

  const selectionChanges: CellRange[][] = [];
  const scrolls: [number, number][] = [];
  emitter.on(TableEvents.SELECTION_CHANGE, (payload) => selectionChanges.push(payload));
  emitter.on(TableEvents.SCROLL, (left, top) => scrolls.push([left, top]));

  return { handler, state, scrollState, emitter, layoutManager, dataManager, selectionChanges, scrolls };
}

describe("SelectionHandler", () => {
  describe("单选", () => {
    it("把选中区收敛为单个单元格", () => {
      const { handler, state } = setup();

      handler.handleSingleSelection(cell(1, 2));

      expect(state.selectedCells).toEqual([range([1, 2], [1, 2])]);
    });

    it("覆盖已有的多个选区", () => {
      const { handler, state } = setup({
        selectedCells: [range([0, 0], [0, 0]), range([2, 2], [2, 2])],
      });

      handler.handleSingleSelection(cell(1, 1));

      expect(state.selectedCells).toEqual([range([1, 1], [1, 1])]);
    });

    it("派发 SELECTION_CHANGE 且传的是副本", () => {
      const { handler, state, selectionChanges } = setup();

      handler.handleSingleSelection(cell(1, 1));

      expect(selectionChanges).toHaveLength(1);
      expect(selectionChanges[0]).toEqual([range([1, 1], [1, 1])]);
      expect(selectionChanges[0]).not.toBe(state.selectedCells);
    });
  });

  describe("区域选择", () => {
    it("没有 selectionStart 时退化为单选", () => {
      const { handler, state, selectionChanges } = setup({ selectionStart: null });

      handler.handleRangeSelection(cell(2, 1));

      expect(state.selectedCells).toEqual([range([2, 1], [2, 1])]);
      expect(selectionChanges).toHaveLength(1);
    });

    it("以 selectionStart 为起点构造区间", () => {
      const { handler, state } = setup({ selectionStart: cell(0, 0) });

      handler.handleRangeSelection(cell(2, 1));

      expect(state.selectedCells).toEqual([range([0, 0], [2, 1])]);
    });

    it("反向拖动时保留 start/end 顺序由归一化负责", () => {
      const { handler, state } = setup({ selectionStart: cell(2, 2) });

      handler.handleRangeSelection(cell(0, 0));

      expect(state.selectedCells).toEqual([range([2, 2], [0, 0])]);
    });
  });

  describe("切换选择（ctrl/cmd+click）", () => {
    it("未选中时追加选区", () => {
      const { handler, state } = setup();

      handler.handleToggleSelection(cell(1, 1));

      expect(state.selectedCells).toEqual([range([1, 1], [1, 1])]);
    });

    it("已选中时移除该选区", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 1], [1, 1])] });

      handler.handleToggleSelection(cell(1, 1));

      expect(state.selectedCells).toEqual([]);
    });

    it("命中已有区间内部也会被移除", () => {
      const { handler, state } = setup({ selectedCells: [range([0, 0], [2, 2])] });

      handler.handleToggleSelection(cell(1, 1));

      expect(state.selectedCells).toEqual([]);
    });

    it("行号小于区间上界时不命中", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 1], [1, 1])] });

      handler.handleToggleSelection(cell(0, 1));

      expect(state.selectedCells).toHaveLength(2);
    });

    it("行号大于区间下界时不命中", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 1], [1, 1])] });

      handler.handleToggleSelection(cell(2, 1));

      expect(state.selectedCells).toHaveLength(2);
    });

    it("列号小于区间左界时不命中", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 1], [1, 1])] });

      handler.handleToggleSelection(cell(1, 0));

      expect(state.selectedCells).toHaveLength(2);
    });

    it("列号大于区间右界时不命中", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 1], [1, 1])] });

      handler.handleToggleSelection(cell(1, 2));

      expect(state.selectedCells).toHaveLength(2);
    });

    it("多选区时只移除命中的那一个", () => {
      const { handler, state } = setup({
        selectedCells: [range([0, 0], [0, 0]), range([2, 2], [2, 2])],
      });

      handler.handleToggleSelection(cell(2, 2));

      expect(state.selectedCells).toEqual([range([0, 0], [0, 0])]);
    });

    it("每次都派发 SELECTION_CHANGE", () => {
      const { handler, selectionChanges } = setup();

      handler.handleToggleSelection(cell(1, 1));
      handler.handleToggleSelection(cell(1, 1));

      expect(selectionChanges).toHaveLength(2);
    });
  });

  describe("全选", () => {
    it("选中从左上到右下的整块区域", () => {
      const { handler, state } = setup();

      handler.selectAll();

      expect(state.selectedCells).toEqual([range([0, 0], [2, 2])]);
    });

    it("没有数据行时不做任何事", () => {
      const { handler, state, selectionChanges } = setup({ rows: [] });

      handler.selectAll();

      expect(state.selectedCells).toEqual([]);
      expect(selectionChanges).toEqual([]);
    });

    it("没有叶子列时不做任何事", () => {
      const { handler, state, selectionChanges } = setup({ columns: [], skipLayout: true });

      handler.selectAll();

      expect(state.selectedCells).toEqual([]);
      expect(selectionChanges).toEqual([]);
    });
  });

  describe("清空选择", () => {
    it("清空并派发事件", () => {
      const { handler, state, selectionChanges } = setup({
        selectedCells: [range([0, 0], [2, 2])],
      });

      handler.clearSelection();

      expect(state.selectedCells).toEqual([]);
      expect(selectionChanges).toEqual([[]]);
    });
  });

  describe("移动选择", () => {
    it("没有选区时直接返回", () => {
      const { handler, state, selectionChanges } = setup();

      handler.moveSelection(1, 1);

      expect(state.selectedCells).toEqual([]);
      expect(selectionChanges).toEqual([]);
    });

    it("按增量移动选区起点", () => {
      const { handler, state } = setup({ selectedCells: [range([1, 1], [2, 2])] });

      handler.moveSelection(1, 1);

      expect(state.selectedCells).toEqual([range([2, 2], [2, 2])]);
    });

    it("上界被 clamp 到 0", () => {
      const { handler, state } = setup({ selectedCells: [range([0, 0], [0, 0])] });

      handler.moveSelection(-5, -5);

      expect(state.selectedCells).toEqual([range([0, 0], [0, 0])]);
    });

    it("下界被 clamp 到最后一行/列", () => {
      const { handler, state } = setup({ selectedCells: [range([0, 0], [0, 0])] });

      handler.moveSelection(99, 99);

      expect(state.selectedCells).toEqual([range([2, 2], [2, 2])]);
    });

    it("目标单元格已在视口内时不派发 SCROLL", () => {
      const { handler, scrolls } = setup({ selectedCells: [range([0, 0], [0, 0])] });

      handler.moveSelection(1, 1);

      expect(scrolls).toEqual([]);
    });

    it("目标单元格在视口外时派发 SCROLL 并更新滚动位置", () => {
      const manyColumns: Column[] = Array.from({ length: 20 }, (_, i) => ({
        key: `c${i}`,
        title: `C${i}`,
        width: 100,
        type: "text" as const,
      }));
      const manyRows: Row[] = Array.from({ length: 100 }, (_, i) => ({
        id: `r${i}`,
        data: {},
      }));
      const { handler, layoutManager, scrollState, scrolls } = setup({
        columns: manyColumns,
        rows: manyRows,
        selectedCells: [range([0, 0], [0, 0])],
      });
      const expectedTop = layoutManager.getScrollOffsetForRow(50);
      const expectedLeft = layoutManager.getScrollOffsetForColumn(10);

      handler.moveSelection(50, 10);

      expect(expectedTop).toBeGreaterThan(0);
      expect(expectedLeft).toBeGreaterThan(0);
      expect(scrolls).toEqual([[expectedLeft, expectedTop]]);
      expect(scrollState.scrollLeft).toBe(expectedLeft);
      expect(scrollState.scrollTop).toBe(expectedTop);
    });
  });

  describe("区间归一化", () => {
    it("正向区间原样返回", () => {
      const { handler } = setup();

      expect(handler.getNormalizedRange(range([0, 1], [2, 3]))).toEqual({
        minRow: 0,
        maxRow: 2,
        minCol: 1,
        maxCol: 3,
      });
    });

    it("反向区间会交换上下界", () => {
      const { handler } = setup();

      expect(handler.getNormalizedRange(range([2, 3], [0, 1]))).toEqual({
        minRow: 0,
        maxRow: 2,
        minCol: 1,
        maxCol: 3,
      });
    });
  });

  describe("命中判断", () => {
    it("落在区间内为真", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [2, 2])] });

      expect(handler.isCellSelected(cell(1, 1))).toBe(true);
      expect(handler.isCellSelected(cell(0, 0))).toBe(true);
      expect(handler.isCellSelected(cell(2, 2))).toBe(true);
    });

    it("落在区间外为假", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [1, 1])] });

      expect(handler.isCellSelected(cell(2, 2))).toBe(false);
    });

    it("没有选区时恒为假", () => {
      const { handler } = setup();

      expect(handler.isCellSelected(cell(0, 0))).toBe(false);
    });

    it("任意一个区间命中即为真", () => {
      const { handler } = setup({
        selectedCells: [range([0, 0], [0, 0]), range([2, 2], [2, 2])],
      });

      expect(handler.isCellSelected(cell(2, 2))).toBe(true);
    });
  });

  describe("展开为单元格列表", () => {
    it("把区间展平为按行优先的坐标", () => {
      const { handler } = setup({ selectedCells: [range([0, 1], [1, 2])] });

      expect(handler.getSelectedCells()).toEqual([
        cell(0, 1),
        cell(0, 2),
        cell(1, 1),
        cell(1, 2),
      ]);
    });

    it("多个区间依次展平", () => {
      const { handler } = setup({
        selectedCells: [range([0, 0], [0, 0]), range([1, 1], [1, 1])],
      });

      expect(handler.getSelectedCells()).toEqual([cell(0, 0), cell(1, 1)]);
    });

    it("没有选区时返回空数组", () => {
      const { handler } = setup();

      expect(handler.getSelectedCells()).toEqual([]);
    });
  });
});
