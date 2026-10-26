import { DragHandler } from "@/core/handlers/DragHandler";
import type { SiblingColumnInfo } from "@/core/handlers/DragHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import type { LayoutManager } from "@/core/LayoutManager";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { EditorRegistry } from "@/core/editors";
import { TableEvents } from "@/constants/events";
import { zhCN } from "@/locale";
import type { Column, InteractionState, Row, ScrollState } from "@/types";
import { createMockCanvas } from "../../helpers/mockFactories";

/**
 * DragHandler 与 LayoutManager 的交互集中在「列宽查询 + 列索引换算」上。
 * 用桩对象精确控制每个方法的返回值，比构造真实布局更可控，也能覆盖
 * 左右固定列这类依赖视口宽度的路径。
 */
function makeLayout(options: {
  columns: Column[];
  leafColumns: Column[];
  viewportWidth?: number;
  leftFixedWidth?: number;
  rightFixedWidth?: number;
}) {
  const widthOf = (c: Column | undefined) => (c ? (c.width ?? 100) : 100);

  const mocks = {
    getLeafColumn: jest.fn((i: number) => options.leafColumns[i]),
    getLeafColumns: jest.fn(() => options.leafColumns),
    getColumns: jest.fn(() => options.columns),
    getColumnByKey: jest.fn((key: string) => options.columns.find((c) => c.key === key)),
    getColumnWidth: jest.fn((c: Column) => widthOf(c)),
    getColumnWidthByIndex: jest.fn((i: number) => widthOf(options.leafColumns[i])),
    getLeafColumnIndex: jest.fn((c: Column) => options.leafColumns.indexOf(c)),
    getLeftFixedWidth: jest.fn(() => options.leftFixedWidth ?? 0),
    getRightFixedWidth: jest.fn(() => options.rightFixedWidth ?? 0),
    getViewportWidth: jest.fn(() => options.viewportWidth ?? 800),
    getCellViewportY: jest.fn(() => 0),
    setColumnWidth: jest.fn(),
  };

  return { layout: mocks as unknown as LayoutManager, mocks };
}

const COLUMNS: Column[] = [
  { key: "a", title: "A", width: 100, type: "text" },
  { key: "b", title: "B", width: 120, type: "text" },
  { key: "c", title: "C", width: 80, type: "text" },
];

interface SetupOptions {
  columns?: Column[];
  leafColumns?: Column[];
  scrollLeft?: number;
  viewportWidth?: number;
  leftFixedWidth?: number;
  rightFixedWidth?: number;
  isDragging?: boolean;
  dragType?: InteractionState["dragType"];
  reorderState?: InteractionState["columnReorderState"];
}

function setup(options: SetupOptions = {}) {
  const columns = options.columns ?? COLUMNS;
  const leafColumns = options.leafColumns ?? columns;

  const { layout, mocks } = makeLayout({
    columns,
    leafColumns,
    viewportWidth: options.viewportWidth,
    leftFixedWidth: options.leftFixedWidth,
    rightFixedWidth: options.rightFixedWidth,
  });

  const rows: Row[] = [{ id: "r1", data: { a: "x", b: "y", c: "z" } }];
  const dataManager = new DataManager();
  dataManager.setColumns(columns);
  dataManager.setRows(rows);

  const state: InteractionState = {
    hoveredCell: null,
    selectedCells: [],
    editingCell: null,
    editingValue: null,
    isSelecting: false,
    selectionStart: null,
    isDragging: options.isDragging ?? false,
    dragType: options.dragType ?? null,
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
    columnReorderState: options.reorderState,
  };

  const scrollState: ScrollState = {
    scrollLeft: options.scrollLeft ?? 0,
    scrollTop: 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
    isScrolling: false,
  };

  const canvas = createMockCanvas();
  const emitter = new EventEmitter<InteractionEvents>();
  const handler = new DragHandler(
    {
      state,
      scrollState,
      layoutManager: layout,
      dataManager,
      canvas,
      ctx: canvas.getContext("2d")!,
      expandColumnKey: null,
      locale: zhCN,
      editorRegistry: new EditorRegistry(),
    },
    emitter,
  );

  return { handler, state, scrollState, emitter, mocks, columns };
}

/** 构造一个鼠标事件；DragHandler 只读取 clientX */
function at(clientX: number): MouseEvent {
  return { clientX, clientY: 0 } as MouseEvent;
}

/** 手工构造的同级列信息，用于精确控制交换判定 */
function siblings(): SiblingColumnInfo[] {
  return [
    {
      key: "a",
      left: 0,
      right: 100,
      center: 50,
      width: 100,
      leafCount: 1,
      firstLeafIndex: 0,
      fixed: false,
    },
    {
      key: "b",
      left: 100,
      right: 220,
      center: 160,
      width: 120,
      leafCount: 1,
      firstLeafIndex: 1,
      fixed: false,
    },
    {
      key: "c",
      left: 220,
      right: 300,
      center: 260,
      width: 80,
      leafCount: 1,
      firstLeafIndex: 2,
      fixed: false,
    },
  ];
}

function reorderState(overrides: Partial<NonNullable<InteractionState["columnReorderState"]>> = {}) {
  return {
    dragColumnIndex: 0,
    dragColumnKey: "a",
    dragStartX: 0,
    currentX: 0,
    targetColumnIndex: 0,
    siblingColumns: siblings(),
    dragSiblingIndex: 0,
    ...overrides,
  };
}

describe("DragHandler", () => {
  describe("handleColumnResizeDrag - 守卫条件", () => {
    it("未处于拖拽状态时返回 false", () => {
      const { handler, mocks } = setup();

      expect(handler.handleColumnResizeDrag(at(200))).toBe(false);
      expect(mocks.setColumnWidth).not.toHaveBeenCalled();
    });

    it("拖拽类型不是 column-resize 时返回 false", () => {
      const { handler, mocks } = setup({ isDragging: true, dragType: "column-reorder" });

      expect(handler.handleColumnResizeDrag(at(200))).toBe(false);
      expect(mocks.setColumnWidth).not.toHaveBeenCalled();
    });

    it("按索引取不到列时返回 false", () => {
      const { handler, state } = setup();
      handler.startColumnResize(99, 100, 100);

      expect(handler.handleColumnResizeDrag(at(200))).toBe(false);
      expect(state.isDragging).toBe(true);
    });
  });

  describe("handleColumnResizeDrag - 宽度换算", () => {
    it("向右拖拽按位移增加列宽并派发 COLUMN_RESIZE", () => {
      const { handler, emitter, mocks, columns } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_RESIZE, spy);

      handler.startColumnResize(1, 100, 120);
      const result = handler.handleColumnResizeDrag(at(150));

      expect(result).toBe(true);
      // deltaX = 50 → 120 + 50 = 170
      expect(mocks.setColumnWidth).toHaveBeenCalledWith("b", 170);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]).toBe(columns[1]);
      expect(spy.mock.calls[0]![1]).toBe(170);
    });

    it("向左拖拽按位移减少列宽", () => {
      const { handler, mocks } = setup();
      handler.startColumnResize(1, 100, 120);

      handler.handleColumnResizeDrag(at(60));

      // deltaX = -40 → 120 - 40 = 80
      expect(mocks.setColumnWidth).toHaveBeenCalledWith("b", 80);
    });

    it("列宽不会小于 50", () => {
      const { handler, mocks } = setup();
      handler.startColumnResize(0, 100, 60);

      handler.handleColumnResizeDrag(at(0));

      // deltaX = -100 → max(50, -40) = 50
      expect(mocks.setColumnWidth).toHaveBeenCalledWith("a", 50);
    });

    it("右固定列的位移方向取反", () => {
      const columns: Column[] = [
        { key: "n", title: "N", width: 100, type: "text" },
        { key: "r", title: "R", width: 80, type: "text", fixed: "right" },
      ];
      const { handler, mocks } = setup({ columns });
      handler.startColumnResize(1, 100, 80);

      handler.handleColumnResizeDrag(at(120));

      // deltaX = 20 → 取反 -20 → max(50, 60) = 60
      expect(mocks.setColumnWidth).toHaveBeenCalledWith("r", 60);
    });

    it("左固定列不取反位移方向", () => {
      const columns: Column[] = [
        { key: "l", title: "L", width: 80, type: "text", fixed: "left" },
        { key: "n", title: "N", width: 100, type: "text" },
      ];
      const { handler, mocks } = setup({ columns });
      handler.startColumnResize(0, 100, 80);

      handler.handleColumnResizeDrag(at(130));

      expect(mocks.setColumnWidth).toHaveBeenCalledWith("l", 110);
    });
  });

  describe("列宽拖拽状态机", () => {
    it("startColumnResize 写入状态", () => {
      const { handler, state } = setup();

      handler.startColumnResize(2, 340, 80);

      expect(state.isDragging).toBe(true);
      expect(state.dragType).toBe("column-resize");
      expect(handler.getResizeColumnIndex()).toBe(2);
      expect(handler.isResizing()).toBe(true);
      expect(handler.isReordering()).toBe(false);
    });

    it("endColumnResize 复位状态", () => {
      const { handler, state } = setup();
      handler.startColumnResize(1, 100, 120);

      handler.endColumnResize();

      expect(state.isDragging).toBe(false);
      expect(state.dragType).toBeNull();
      expect(handler.getResizeColumnIndex()).toBe(-1);
      expect(handler.isResizing()).toBe(false);
    });

    it("isResizing 在拖拽类型不匹配时为 false", () => {
      const { handler } = setup({ isDragging: true, dragType: "column-reorder" });

      expect(handler.isResizing()).toBe(false);
      expect(handler.isReordering()).toBe(true);
    });

    it("isReordering 未处于拖拽时为 false", () => {
      const { handler } = setup();

      expect(handler.isReordering()).toBe(false);
    });
  });

  describe("calculateSiblingColumns - 顶层列", () => {
    it("只返回 fixed 属性相同且可重排的列", () => {
      const columns: Column[] = [
        { key: "a", title: "A", width: 100, type: "text" },
        { key: "b", title: "B", width: 120, type: "text" },
        { key: "c", title: "C", width: 80, type: "text", reorderable: false },
        { key: "d", title: "D", width: 90, type: "text", fixed: "right" },
      ];
      const { handler } = setup({ columns });

      const result = handler.calculateSiblingColumns(columns[0]!);

      expect(result.map((s) => s.key)).toEqual(["a", "b"]);
      expect(result[0]).toMatchObject({ left: 0, right: 100, center: 50, width: 100, leafCount: 1 });
      expect(result[1]).toMatchObject({
        left: 100,
        right: 220,
        center: 160,
        width: 120,
        leafCount: 1,
        firstLeafIndex: 1,
      });
    });

    it("普通列的计算会减去水平滚动量", () => {
      const { handler } = setup({ scrollLeft: 30 });

      const result = handler.calculateSiblingColumns(COLUMNS[0]!);

      expect(result[0]).toMatchObject({ key: "a", left: -30, right: 70 });
      expect(result[1]).toMatchObject({ key: "b", left: 70, right: 190 });
    });

    it("普通列从左侧固定列宽度之后开始累加", () => {
      const columns: Column[] = [
        { key: "l", title: "L", width: 60, type: "text", fixed: "left" },
        { key: "n", title: "N", width: 100, type: "text" },
      ];
      const { handler } = setup({ columns, leftFixedWidth: 60 });

      const result = handler.calculateSiblingColumns(columns[1]!);

      expect(result[0]).toMatchObject({ key: "n", left: 60, right: 160 });
    });

    it("左固定列从 0 开始按叶子列宽度累加", () => {
      const columns: Column[] = [
        { key: "l1", title: "L1", width: 60, type: "text", fixed: "left" },
        { key: "l2", title: "L2", width: 40, type: "text", fixed: "left" },
        { key: "n", title: "N", width: 100, type: "text" },
      ];
      const { handler } = setup({ columns, leftFixedWidth: 100 });

      const result = handler.calculateSiblingColumns(columns[1]!);

      expect(result.map((s) => s.key)).toEqual(["l1", "l2"]);
      expect(result[0]).toMatchObject({ key: "l1", left: 0, right: 60 });
      expect(result[1]).toMatchObject({ key: "l2", left: 60, right: 100 });
    });

    it("左固定列累加时忽略非左固定的前置叶子列", () => {
      const n: Column = { key: "n", title: "N", width: 100, type: "text" };
      const l: Column = { key: "l", title: "L", width: 60, type: "text", fixed: "left" };
      const { handler } = setup({ columns: [n, l], leafColumns: [n, l], leftFixedWidth: 60 });

      const result = handler.calculateSiblingColumns(l);

      expect(result.map((s) => s.key)).toEqual(["l"]);
      expect(result[0]).toMatchObject({ left: 0, right: 60 });
    });

    it("左固定列累加时跳过取不到的叶子列", () => {
      const l1: Column = { key: "l1", title: "L1", width: 60, type: "text", fixed: "left" };
      const l2: Column = { key: "l2", title: "L2", width: 40, type: "text", fixed: "left" };
      const { handler, mocks } = setup({
        columns: [l1, l2],
        leafColumns: [l1, l2],
        leftFixedWidth: 100,
      });
      // 模拟某一级叶子列暂时取不到（覆盖可选链的兜底分支）
      mocks.getLeafColumn.mockImplementation((i: number) => (i === 0 ? undefined : [l1, l2][i]));

      const result = handler.calculateSiblingColumns(l2);

      expect(result.map((s) => s.key)).toEqual(["l1", "l2"]);
      // l1 取不到 → 累加时被跳过，因此 l2 的 left 仍是 0
      expect(result[1]).toMatchObject({ key: "l2", left: 0 });
    });

    it("右固定列从视口右侧边界起算", () => {
      const columns: Column[] = [
        { key: "n", title: "N", width: 100, type: "text" },
        { key: "r1", title: "R1", width: 50, type: "text", fixed: "right" },
        { key: "r2", title: "R2", width: 70, type: "text", fixed: "right" },
      ];
      const { handler } = setup({
        columns,
        viewportWidth: 800,
        rightFixedWidth: 120,
      });

      const result = handler.calculateSiblingColumns(columns[1]!);

      expect(result.map((s) => s.key)).toEqual(["r1", "r2"]);
      expect(result[0]).toMatchObject({ key: "r1", left: 680, right: 730 });
      expect(result[1]).toMatchObject({ key: "r2", left: 730, right: 800 });
    });

    it("fixed 缺省时归一化为 false", () => {
      const { handler } = setup();

      const result = handler.calculateSiblingColumns(COLUMNS[0]!);

      expect(result.every((s) => s.fixed === false)).toBe(true);
    });

    it("叶子列索引为 -1 的列被跳过", () => {
      const columns: Column[] = [
        { key: "a", title: "A", width: 100, type: "text" },
        { key: "ghost", title: "G", width: 100, type: "text" },
      ];
      const { handler } = setup({ columns, leafColumns: [columns[0]!] });

      const result = handler.calculateSiblingColumns(columns[0]!);

      expect(result.map((s) => s.key)).toEqual(["a"]);
    });
  });

  describe("calculateSiblingColumns - 父列", () => {
    it("有 parentKey 时使用父列的 children 作为同级列表", () => {
      const c1: Column = { key: "c1", title: "C1", width: 50, type: "text", parentKey: "p" };
      const c2: Column = { key: "c2", title: "C2", width: 50, type: "text", parentKey: "p" };
      const parent: Column = { key: "p", title: "P", children: [c1, c2] };
      const columns = [parent];
      const { handler } = setup({ columns, leafColumns: [c1, c2] });

      const result = handler.calculateSiblingColumns(c1);

      expect(result.map((s) => s.key)).toEqual(["c1", "c2"]);
      expect(result[0]).toMatchObject({ left: 0, right: 50, center: 25 });
      expect(result[1]).toMatchObject({ left: 50, right: 100 });
    });

    it("父列不存在时返回空数组", () => {
      const orphan: Column = { key: "o", title: "O", width: 50, type: "text", parentKey: "missing" };
      const { handler } = setup({ columns: [orphan] });

      expect(handler.calculateSiblingColumns(orphan)).toEqual([]);
    });

    it("父列没有 children 时返回空数组", () => {
      const parent: Column = { key: "p", title: "P" };
      const child: Column = { key: "c", title: "C", width: 50, type: "text", parentKey: "p" };
      const { handler } = setup({ columns: [parent, child], leafColumns: [child] });

      expect(handler.calculateSiblingColumns(child)).toEqual([]);
    });

    it("leafCount 递归统计多层级子叶数量", () => {
      const g1: Column = { key: "g1", title: "G1", width: 30, type: "text", parentKey: "g" };
      const g2: Column = { key: "g2", title: "G2", width: 30, type: "text", parentKey: "g" };
      const g: Column = { key: "g", title: "G", children: [g1, g2], parentKey: "p" };
      const c2: Column = { key: "c2", title: "C2", width: 40, type: "text", parentKey: "p" };
      const p: Column = { key: "p", title: "P", width: 100, children: [g, c2] };
      const x: Column = { key: "x", title: "X", width: 10, type: "text" };
      const columns = [x, p];
      const { handler } = setup({ columns, leafColumns: [x, g1, g2, c2] });

      const result = handler.calculateSiblingColumns(x);

      expect(result.map((s) => s.key)).toEqual(["x", "p"]);
      expect(result[0]).toMatchObject({ leafCount: 1, firstLeafIndex: 0 });
      // p 下挂 g(g1,g2) + c2 = 3 个叶子列，首个叶子列是 g1（索引 1）
      expect(result[1]).toMatchObject({ leafCount: 3, firstLeafIndex: 1, left: 10, right: 110 });
    });
  });

  describe("handleColumnReorderDrag - 守卫与降级", () => {
    it("没有 columnReorderState 时返回 false", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_REORDER_DRAG, spy);

      expect(handler.handleColumnReorderDrag(150)).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it("同级列为空时只派发拖拽事件并返回 true", () => {
      const { handler, emitter, state } = setup({
        reorderState: reorderState({ siblingColumns: [] }),
      });
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_REORDER_DRAG, spy);

      expect(handler.handleColumnReorderDrag(150)).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(state.columnReorderState!.currentX).toBe(150);
    });

    it("同级列为 undefined 时同样降级处理", () => {
      const { handler, emitter } = setup({
        reorderState: reorderState({ siblingColumns: undefined }),
      });
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_REORDER_DRAG, spy);

      expect(handler.handleColumnReorderDrag(150)).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("距上次交换不足 50ms 时进入防抖，不交换", () => {
      const { handler, emitter, state } = setup({
        reorderState: reorderState({ lastSwapTime: Date.now() - 10 }),
      });
      const dragSpy = jest.fn();
      const swapSpy = jest.fn();
      emitter.on(TableEvents.COLUMN_REORDER_DRAG, dragSpy);
      emitter.on(TableEvents.COLUMN_SWAP, swapSpy);

      expect(handler.handleColumnReorderDrag(180)).toBe(true);
      expect(swapSpy).not.toHaveBeenCalled();
      expect(dragSpy).toHaveBeenCalledTimes(1);
      // 防抖分支提前返回，targetColumnIndex 保持原值
      expect(state.columnReorderState!.targetColumnIndex).toBe(0);
    });

    it("距上次交换超过 50ms 时正常参与交换判定", () => {
      const { handler, emitter } = setup({
        reorderState: reorderState({ lastSwapTime: Date.now() - 500 }),
      });
      const swapSpy = jest.fn();
      emitter.on(TableEvents.COLUMN_SWAP, swapSpy);

      handler.handleColumnReorderDrag(180);

      expect(swapSpy).toHaveBeenCalledWith("a", "b");
    });

    it("鼠标不在任何同级列上时清空 lastSwapTargetKey 并回落到被拖拽列", () => {
      const { handler, emitter, state } = setup({
        reorderState: reorderState({
          dragSiblingIndex: 1,
          lastSwapTargetKey: "b",
        }),
      });
      const swapSpy = jest.fn();
      emitter.on(TableEvents.COLUMN_SWAP, swapSpy);

      handler.handleColumnReorderDrag(500);

      expect(swapSpy).not.toHaveBeenCalled();
      expect(state.columnReorderState!.lastSwapTargetKey).toBeUndefined();
      // 回落到被拖拽列 b 的 firstLeafIndex
      expect(state.columnReorderState!.targetColumnIndex).toBe(1);
    });
  });

  describe("handleColumnReorderDrag - 交换判定", () => {
    it("向右方向越过目标中线时交换", () => {
      const { handler, emitter, state } = setup({ reorderState: reorderState() });
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_SWAP, spy);

      handler.handleColumnReorderDrag(180);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("a", "b");
      expect(state.columnReorderState!.lastSwapTime).toBeGreaterThan(0);
      expect(state.columnReorderState!.lastSwapTargetKey).toBeUndefined();
      expect(state.columnReorderState!.targetColumnIndex).toBe(1);
    });

    it("向右方向未越过目标中线时不交换", () => {
      const { handler, emitter, state } = setup({ reorderState: reorderState() });
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_SWAP, spy);

      handler.handleColumnReorderDrag(130);

      expect(spy).not.toHaveBeenCalled();
      expect(state.columnReorderState!.lastSwapTime).toBeUndefined();
      expect(state.columnReorderState!.targetColumnIndex).toBe(1);
    });

    it("向左方向越过目标中线时交换", () => {
      const { handler, emitter } = setup({
        reorderState: reorderState({ dragSiblingIndex: 2, dragColumnKey: "c" }),
      });
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_SWAP, spy);

      handler.handleColumnReorderDrag(40);

      expect(spy).toHaveBeenCalledWith("c", "a");
    });

    it("向左方向未越过目标中线时不交换", () => {
      const { handler, emitter } = setup({
        reorderState: reorderState({ dragSiblingIndex: 2, dragColumnKey: "c" }),
      });
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_SWAP, spy);

      handler.handleColumnReorderDrag(60);

      expect(spy).not.toHaveBeenCalled();
    });

    it("目标列与上次交换目标相同时不重复交换", () => {
      const { handler, emitter, state } = setup({
        reorderState: reorderState({ lastSwapTargetKey: "b" }),
      });
      const swapSpy = jest.fn();
      const dragSpy = jest.fn();
      emitter.on(TableEvents.COLUMN_SWAP, swapSpy);
      emitter.on(TableEvents.COLUMN_REORDER_DRAG, dragSpy);

      handler.handleColumnReorderDrag(180);

      expect(swapSpy).not.toHaveBeenCalled();
      expect(dragSpy).toHaveBeenCalledTimes(1);
      expect(state.columnReorderState!.lastSwapTargetKey).toBe("b");
    });

    it("鼠标回到被拖拽列时清空 lastSwapTargetKey", () => {
      const { handler, state } = setup({
        reorderState: reorderState({ dragSiblingIndex: 1, lastSwapTargetKey: "b" }),
      });

      handler.handleColumnReorderDrag(150);

      expect(state.columnReorderState!.lastSwapTargetKey).toBeUndefined();
      expect(state.columnReorderState!.targetColumnIndex).toBe(1);
    });

    it("交换后按新布局重算同级列并更新索引", () => {
      const { handler, state } = setup({ reorderState: reorderState() });

      handler.handleColumnReorderDrag(180);

      const rs = state.columnReorderState!;
      // 交换后重新计算 a 的同级列，a 仍排第 0
      expect(rs.siblingColumns!.map((s) => s.key)).toEqual(["a", "b", "c"]);
      expect(rs.dragSiblingIndex).toBe(0);
      expect(rs.dragColumnIndex).toBe(0);
    });

    it("交换后新布局里找不到被拖拽列时保留原索引", () => {
      const { handler, state, mocks } = setup({ reorderState: reorderState() });
      // 让被拖拽列指向一个父列不存在的列 → calculateSiblingColumns 返回空
      mocks.getColumnByKey.mockImplementation((key: string) =>
        key === "a"
          ? ({ key: "a", title: "A", width: 100, type: "text", parentKey: "missing" } as Column)
          : undefined,
      );

      handler.handleColumnReorderDrag(180);

      const rs = state.columnReorderState!;
      expect(rs.siblingColumns).toEqual([]);
      // findIndex 返回 -1 → 回退为原 dragSiblingIndex
      expect(rs.dragSiblingIndex).toBe(0);
      // 新的同级列里取不到被拖拽列 → dragColumnIndex 保持原值
      expect(rs.dragColumnIndex).toBe(0);
      expect(rs.targetColumnIndex).toBe(1);
    });

    it("交换后拿不到被拖拽列时完全跳过重算", () => {
      const { handler, state, mocks } = setup({ reorderState: reorderState() });
      mocks.getColumnByKey.mockReturnValue(undefined);

      handler.handleColumnReorderDrag(180);

      const rs = state.columnReorderState!;
      // siblingColumns 未被替换，仍是原来那批
      expect(rs.siblingColumns!.map((s) => s.key)).toEqual(["a", "b", "c"]);
      expect(rs.dragSiblingIndex).toBe(0);
      expect(rs.dragColumnIndex).toBe(0);
    });

    it("每次拖拽都会派发 COLUMN_REORDER_DRAG", () => {
      const { handler, emitter } = setup({ reorderState: reorderState() });
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_REORDER_DRAG, spy);

      handler.handleColumnReorderDrag(130);
      handler.handleColumnReorderDrag(180);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("拖拽过程中持续写入 currentX", () => {
      const { handler, state } = setup({ reorderState: reorderState() });

      handler.handleColumnReorderDrag(137);

      expect(state.columnReorderState!.currentX).toBe(137);
    });

    it("被拖拽列索引越界时跳过交换但仍更新目标列", () => {
      const { handler, emitter, state } = setup({
        reorderState: reorderState({ dragSiblingIndex: 9 }),
      });
      const spy = jest.fn();
      emitter.on(TableEvents.COLUMN_SWAP, spy);

      handler.handleColumnReorderDrag(180);

      expect(spy).not.toHaveBeenCalled();
      // 目标列仍按鼠标所在的 b 计算
      expect(state.columnReorderState!.targetColumnIndex).toBe(1);
    });

    it("被拖拽列索引越界且鼠标不在任何同级列上时保持目标列不变", () => {
      const { handler, state } = setup({
        reorderState: reorderState({ dragSiblingIndex: 9, targetColumnIndex: 7 }),
      });

      handler.handleColumnReorderDrag(500);

      expect(state.columnReorderState!.targetColumnIndex).toBe(7);
    });
  });

  describe("endColumnReorder", () => {
    it("没有 columnReorderState 时返回 null", () => {
      const { handler } = setup();

      expect(handler.endColumnReorder()).toBeNull();
    });

    it("拖拽列与目标列不同时返回索引对", () => {
      const { handler, state } = setup({
        isDragging: true,
        dragType: "column-reorder",
        reorderState: reorderState({ dragColumnIndex: 0, targetColumnIndex: 2 }),
      });

      expect(handler.endColumnReorder()).toEqual({ dragColumnIndex: 0, targetColumnIndex: 2 });
      expect(state.isDragging).toBe(false);
      expect(state.dragType).toBeNull();
      expect(state.columnReorderState).toBeUndefined();
    });

    it("拖拽列与目标列相同时返回 null", () => {
      const { handler, state } = setup({
        isDragging: true,
        dragType: "column-reorder",
        reorderState: reorderState({ dragColumnIndex: 1, targetColumnIndex: 1 }),
      });

      expect(handler.endColumnReorder()).toBeNull();
      expect(state.columnReorderState).toBeUndefined();
    });

    it("目标列索引为负时返回 null", () => {
      const { handler, state } = setup({
        isDragging: true,
        dragType: "column-reorder",
        reorderState: reorderState({ dragColumnIndex: 0, targetColumnIndex: -1 }),
      });

      expect(handler.endColumnReorder()).toBeNull();
      expect(state.columnReorderState).toBeUndefined();
    });

    it("结束后复位拖拽状态", () => {
      const { handler, state } = setup({
        isDragging: true,
        dragType: "column-reorder",
        reorderState: reorderState({ dragColumnIndex: 0, targetColumnIndex: 2 }),
      });

      handler.endColumnReorder();

      expect(state.isDragging).toBe(false);
      expect(state.dragType).toBeNull();
      expect(handler.isReordering()).toBe(false);
    });
  });
});
