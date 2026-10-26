import { HeaderHandler } from "@/core/handlers/HeaderHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import type { LayoutManager } from "@/core/LayoutManager";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { EditorRegistry } from "@/core/editors";
import { TableEvents } from "@/constants/events";
import { zhCN } from "@/locale";
import type {
  Column,
  FilterConfig,
  HeaderCell,
  InteractionState,
  LayoutInfo,
  Row,
  ScrollState,
  SortConfig,
} from "@/types";
import { createMockCanvas } from "../../helpers/mockFactories";

/**
 * HeaderHandler 与 LayoutManager 的交互面很宽（十余个方法），且分支高度依赖
 * 固定列 / 滚动位置 / 叶子列索引。这里用桩对象精确控制每个方法的返回值，
 * 比构造真实布局更可控，也能覆盖固定列等难以复现的路径。
 */
function makeLayout(options: {
  columns: Column[];
  leafColumns: Column[];
  totalWidth?: number;
  headerHeight?: number;
  viewportWidth?: number;
  leftFixedWidth?: number;
  rightFixedWidth?: number;
  headerCell?: HeaderCell | null;
  resizeColIndex?: number;
  leafViewportPos?: { x: number; y: number; width: number; height: number } | null;
  cellPosition?: { x: number; y: number; width: number; height: number };
}) {
  const info: LayoutInfo = {
    totalWidth: options.totalWidth ?? 300,
    totalHeight: 100,
    viewportWidth: options.viewportWidth ?? 800,
    viewportHeight: 600,
    headerHeight: options.headerHeight ?? 36,
    rowHeight: 32,
    columnWidths: options.leafColumns.map((c) => c.width ?? 100),
    rowOffsets: [],
    columnOffsets: [],
  };

  const mocks = {
    getLayoutInfo: jest.fn(() => info),
    getRightFixedWidth: jest.fn(() => options.rightFixedWidth ?? 0),
    getLeftFixedWidth: jest.fn(() => options.leftFixedWidth ?? 0),
    getViewportWidth: jest.fn(() => options.viewportWidth ?? 800),
    getHeaderCellAtPosition: jest.fn(() => options.headerCell ?? null),
    isResizeHandleAtPosition: jest.fn(() => options.resizeColIndex ?? -1),
    getLeafColumn: jest.fn((i: number) => options.leafColumns[i]),
    getLeafHeaderCellViewportPosition: jest.fn(() =>
      // 显式区分「未传」与「传 null」，null 表示拿不到位置
      options.leafViewportPos !== undefined
        ? options.leafViewportPos
        : { x: 0, y: 0, width: 100, height: 36 },
    ),
    getCellPosition: jest.fn(() => options.cellPosition ?? { x: 50, y: 0, width: 100, height: 36 }),
    getColumns: jest.fn(() => options.columns),
    getColumnByKey: jest.fn((key: string) => options.columns.find((c) => c.key === key)),
    getColumnWidth: jest.fn((c: Column) => c.width ?? 100),
    getColumnWidthByIndex: jest.fn((i: number) => options.leafColumns[i]?.width ?? 100),
    getLeafColumnIndex: jest.fn((c: Column) => options.leafColumns.indexOf(c)),
  };

  return { layout: mocks as unknown as LayoutManager, mocks };
}

interface SetupOptions {
  columns?: Column[];
  leafColumns?: Column[];
  rows?: Row[];
  sortConfig?: SortConfig[];
  filterConfig?: FilterConfig[];
  scrollLeft?: number;
  headerCell?: HeaderCell | null;
  resizeColIndex?: number;
  leafViewportPos?: { x: number; y: number; width: number; height: number } | null;
  cellPosition?: { x: number; y: number; width: number; height: number };
  leftFixedWidth?: number;
  rightFixedWidth?: number;
  viewportWidth?: number;
  totalWidth?: number;
}

function setup(options: SetupOptions = {}) {
  const columns = options.columns ?? [
    { key: "a", title: "A", width: 100, type: "text" },
    { key: "b", title: "B", width: 120, type: "number" },
    { key: "c", title: "C", width: 80, type: "checkbox" },
  ];
  const leafColumns = options.leafColumns ?? columns;
  const rows: Row[] = options.rows ?? [{ id: "r1", data: { a: "x", b: 1, c: true } }];

  const { layout, mocks } = makeLayout({
    columns,
    leafColumns,
    headerCell: options.headerCell,
    resizeColIndex: options.resizeColIndex,
    leafViewportPos: options.leafViewportPos,
    cellPosition: options.cellPosition,
    leftFixedWidth: options.leftFixedWidth,
    rightFixedWidth: options.rightFixedWidth,
    viewportWidth: options.viewportWidth,
    totalWidth: options.totalWidth,
  });

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
    scrollLeft: options.scrollLeft ?? 0,
    scrollTop: 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
    isScrolling: false,
  };

  const emitter = new EventEmitter<InteractionEvents>();
  const sortConfig = options.sortConfig ?? [];
  const filterConfig = options.filterConfig ?? [];
  const canvas = createMockCanvas();

  const handler = new HeaderHandler(
    {
      state,
      scrollState,
      layoutManager: layout,
      dataManager,
      canvas,
      ctx: createMockCanvas().getContext("2d")!,
      expandColumnKey: null,
      locale: zhCN,
      editorRegistry: new EditorRegistry(),
    },
    emitter,
    sortConfig,
    filterConfig,
  );

  return { handler, state, emitter, mocks, canvas, sortConfig, filterConfig, columns, leafColumns, rows };
}

function at(clientX: number, clientY: number, shiftKey = false): MouseEvent {
  return { clientX, clientY, shiftKey } as unknown as MouseEvent;
}

function headerCell(column: Column, overrides: Partial<HeaderCell> = {}): HeaderCell {
  return {
    column,
    x: 0,
    y: 0,
    width: 100,
    height: 36,
    rowIndex: 0,
    colIndex: 0,
    colspan: 1,
    rowspan: 1,
    isLeaf: true,
    ...overrides,
  };
}

/** 通过私有方法直接驱动 toggleSort（公共入口的命中区域永远命中上下箭头，见下方说明） */
function callToggleSort(handler: HeaderHandler, column: Column, e: MouseEvent): void {
  (
    handler as unknown as { toggleSort: (column: Column, e: MouseEvent) => void }
  ).toggleSort(column, e);
}

const colA: Column = { key: "a", title: "A", width: 100, type: "text" };
const colB: Column = { key: "b", title: "B", width: 120, type: "number" };

describe("HeaderHandler", () => {
  describe("handleHeaderHover", () => {
    it("非固定列使用 x - scrollLeft 计算视口坐标", () => {
      const { handler, canvas } = setup({ scrollLeft: 40 });

      // cellViewportX = 100 - 40 = 60 → dragHandleX = 68，范围 [68, 78]
      handler.handleHeaderHover(headerCell(colA, { x: 100 }), 70, 18);
      expect(canvas.style.cursor).toBe("grab");

      // sortIconX = 60 + 100 - 18 = 142 → 容器 [134, 150]
      handler.handleHeaderHover(headerCell(colA, { x: 100 }), 140, 18);
      expect(canvas.style.cursor).toBe("pointer");

      handler.handleHeaderHover(headerCell(colA, { x: 100 }), 60, 18);
      expect(canvas.style.cursor).toBe("default");
    });

    it("悬停在拖拽手柄上时光标为 grab", () => {
      const { handler, canvas } = setup();

      handler.handleHeaderHover(headerCell(colA), 12, 18);

      expect(canvas.style.cursor).toBe("grab");
    });

    it("悬停在排序区域时光标为 pointer", () => {
      const { handler, canvas } = setup();

      // sortIconX = 0 + 100 - 8 - 10 = 82 → 容器 [74, 90]
      handler.handleHeaderHover(headerCell(colA), 80, 18);

      expect(canvas.style.cursor).toBe("pointer");
    });

    it("悬停在普通区域时光标为 default", () => {
      const { handler, canvas } = setup();

      handler.handleHeaderHover(headerCell(colA), 50, 18);

      expect(canvas.style.cursor).toBe("default");
    });

    it("可筛选列悬停在筛选图标上时光标为 pointer", () => {
      const column: Column = { ...colA, filterable: true };
      const { handler, canvas } = setup({ columns: [column], leafColumns: [column] });

      // filterIconX = 100 - 8 - 10 = 82
      handler.handleHeaderHover(headerCell(column), 82, 18);

      expect(canvas.style.cursor).toBe("pointer");
    });

    it("reorderable 为 false 时拖拽手柄不生效", () => {
      const column: Column = { ...colA, reorderable: false };
      const { handler, canvas } = setup({ columns: [column], leafColumns: [column] });

      handler.handleHeaderHover(headerCell(column), 12, 18);

      expect(canvas.style.cursor).toBe("default");
    });

    it("固定左列直接使用 headerCell.x，不受 scrollLeft 影响", () => {
      const column: Column = { ...colA, fixed: "left" };
      const { handler, canvas } = setup({ columns: [column], leafColumns: [column], scrollLeft: 500 });

      // cellViewportX = 20 → dragHandleX = 28
      handler.handleHeaderHover(headerCell(column, { x: 20 }), 30, 18);

      expect(canvas.style.cursor).toBe("grab");
    });

    it("固定右列按右固定宽度换算偏移", () => {
      const column: Column = { ...colA, fixed: "right" };
      const { handler, canvas, mocks } = setup({
        columns: [column],
        leafColumns: [column],
        rightFixedWidth: 100,
        viewportWidth: 800,
        totalWidth: 300,
      });

      // startX = 700，offsetX = 700 - 200 = 500 → cellViewportX = 500 → dragHandleX = 508
      handler.handleHeaderHover(headerCell(column, { x: 0 }), 512, 18);

      expect(mocks.getRightFixedWidth).toHaveBeenCalled();
      expect(canvas.style.cursor).toBe("grab");
    });

    it("非叶子表头不参与排序/筛选命中判定", () => {
      const parent: Column = {
        key: "p",
        title: "P",
        children: [{ key: "c1", title: "C1", width: 60, type: "text" }],
      };
      const { handler, canvas } = setup({ columns: [parent], leafColumns: [parent.children![0]!] });

      handler.handleHeaderHover(headerCell(parent, { isLeaf: false }), 82, 18);

      expect(canvas.style.cursor).toBe("default");
    });

    it("hoveredHeaderColumnKey 变化时派发 HEADER_HOVER", () => {
      const { handler, state, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.HEADER_HOVER, spy);

      handler.handleHeaderHover(headerCell(colA), 50, 18);

      expect(state.hoveredHeaderColumnKey).toBe("a");
      expect(spy).toHaveBeenCalledWith("a");
    });

    it("hoveredHeaderColumnKey 未变化时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.hoveredHeaderColumnKey = "a";
      const spy = jest.fn();
      emitter.on(TableEvents.HEADER_HOVER, spy);

      handler.handleHeaderHover(headerCell(colA), 50, 18);

      expect(spy).not.toHaveBeenCalled();
    });

    it("悬停表头时清空单元格 hover 与 tooltip", () => {
      const { handler, state } = setup();
      state.hoveredCell = { rowIndex: 1, columnIndex: 1 };
      state.tooltip = { cell: { rowIndex: 0, columnIndex: 0 }, x: 0, y: 0, content: { type: "text", text: "t" } };

      handler.handleHeaderHover(headerCell(colA), 50, 18);

      expect(state.hoveredCell).toBeNull();
      expect(state.tooltip).toBeNull();
    });
  });

  describe("handleHeaderMouseDown", () => {
    it("未命中任何表头单元格时返回 false", () => {
      const { handler } = setup({ headerCell: null });

      expect(handler.handleHeaderMouseDown(0, at(12, 18))).toBe(false);
    });

    it("reorderable 为 false 的列不启动拖拽", () => {
      const column: Column = { ...colA, reorderable: false };
      const { handler } = setup({
        columns: [column],
        leafColumns: [column],
        headerCell: headerCell(column),
      });

      expect(handler.handleHeaderMouseDown(0, at(12, 18))).toBe(false);
    });

    it("落在列宽调整手柄上时返回 false", () => {
      const { handler } = setup({ headerCell: headerCell(colA), resizeColIndex: 0 });

      expect(handler.handleHeaderMouseDown(0, at(12, 18))).toBe(false);
    });

    it("叶子表头未落在拖拽手柄上时返回 false（交给 click 处理）", () => {
      const { handler } = setup({ headerCell: headerCell(colA) });

      expect(handler.handleHeaderMouseDown(0, at(50, 18))).toBe(false);
    });

    it("非叶子表头未落在拖拽手柄上时返回 false", () => {
      const parent: Column = {
        key: "p",
        title: "P",
        children: [{ key: "c1", title: "C1", width: 60, type: "text" }],
      };
      const { handler } = setup({
        columns: [parent],
        leafColumns: [parent.children![0]!],
        headerCell: headerCell(parent, { isLeaf: false }),
      });

      expect(handler.handleHeaderMouseDown(0, at(50, 18))).toBe(false);
    });

    it("在拖拽手柄上按下时初始化 columnReorderState", () => {
      const { handler, state } = setup({ headerCell: headerCell(colA) });

      expect(handler.handleHeaderMouseDown(0, at(12, 18))).toBe(true);
      expect(state.columnReorderState).toMatchObject({
        dragColumnIndex: 0,
        dragColumnKey: "a",
        dragStartX: 12,
        currentX: 12,
        targetColumnIndex: 0,
        isParentColumn: false,
        isFixedColumn: false,
      });
      expect(state.columnReorderState!.siblingColumns).toHaveLength(3);
    });

    it("固定列会标记 isFixedColumn", () => {
      const column: Column = { ...colA, fixed: "left" };
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        headerCell: headerCell(column),
      });

      handler.handleHeaderMouseDown(0, at(12, 18));

      expect(state.columnReorderState!.isFixedColumn).toBe(true);
    });

    it("父列拖拽时定位到第一个叶子列", () => {
      const c1: Column = { key: "c1", title: "C1", width: 60, type: "text" };
      const c2: Column = { key: "c2", title: "C2", width: 60, type: "text" };
      const parent: Column = { key: "p", title: "P", children: [c1, c2] };
      const { handler, state } = setup({
        columns: [parent],
        leafColumns: [c1, c2],
        headerCell: headerCell(parent, { isLeaf: false }),
      });

      handler.handleHeaderMouseDown(0, at(12, 18));

      expect(state.columnReorderState).toMatchObject({
        dragColumnKey: "p",
        dragColumnIndex: 0,
        isParentColumn: true,
      });
    });

    it("父列拖拽时叶子列索引为 -1 会回退到传入的 columnIndex", () => {
      const c1: Column = { key: "c1", title: "C1", width: 60, type: "text" };
      const parent: Column = { key: "p", title: "P", children: [c1] };
      const { handler, state } = setup({
        columns: [parent],
        // leafColumns 不含 c1 → getLeafColumnIndex 返回 -1
        leafColumns: [],
        headerCell: headerCell(parent, { isLeaf: false }),
      });

      handler.handleHeaderMouseDown(3, at(12, 18));

      expect(state.columnReorderState!.dragColumnIndex).toBe(3);
    });

    it("固定右列在按下时按右固定宽度换算", () => {
      const column: Column = { ...colA, fixed: "right" };
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        rightFixedWidth: 100,
        viewportWidth: 800,
        totalWidth: 300,
        headerCell: headerCell(column, { x: 0 }),
      });

      // cellViewportX = 500 → dragHandleX = 508，范围 [508, 518]
      expect(handler.handleHeaderMouseDown(0, at(12, 18))).toBe(false);
      expect(handler.handleHeaderMouseDown(0, at(512, 18))).toBe(true);
      expect(state.columnReorderState!.dragStartX).toBe(512);
    });
  });

  describe("handleHeaderClick", () => {
    it("列不存在时直接返回", () => {
      const { handler, emitter } = setup({ leafColumns: [] });
      const spy = jest.fn();
      emitter.on(TableEvents.HEADER_CLICK, spy);

      handler.handleHeaderClick(0, at(80, 18));

      expect(spy).not.toHaveBeenCalled();
    });

    it("始终先派发 HEADER_CLICK", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.HEADER_CLICK, spy);

      handler.handleHeaderClick(0, at(80, 18));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![1]).toBe(0);
    });

    it("拿不到表头视口位置时提前返回", () => {
      const { handler, emitter } = setup({ leafViewportPos: null });
      const sortSpy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, sortSpy);

      handler.handleHeaderClick(0, at(80, 10));

      expect(sortSpy).not.toHaveBeenCalled();
    });

    it("点击筛选图标打开筛选下拉框", () => {
      const column: Column = { ...colA, filterable: true };
      const { handler, state } = setup({ columns: [column], leafColumns: [column] });

      // filterIconX = 100 - 8 - 10 = 82
      handler.handleHeaderClick(0, at(82, 18));

      expect(state.filterDropdown).not.toBeNull();
      expect(state.filterDropdown!.mode).toBe("search");
    });

    it("sortable 为 false 时不改变排序", () => {
      const column: Column = { ...colA, sortable: false };
      const { handler, emitter } = setup({ columns: [column], leafColumns: [column] });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.handleHeaderClick(0, at(80, 10));

      expect(spy).not.toHaveBeenCalled();
    });

    it("点击排序容器之外不改变排序", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.handleHeaderClick(0, at(10, 18));

      expect(spy).not.toHaveBeenCalled();
    });

    it("点击上箭头设置为升序", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      // sortIconX = 82，容器 [74,90]；upArrowTop = 7，upArrowBottom = 20
      handler.handleHeaderClick(0, at(80, 10));

      expect(spy.mock.calls[0]![0]).toEqual([{ column: "a", direction: "asc" }]);
    });

    it("点击下箭头设置为降序", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.handleHeaderClick(0, at(80, 26));

      expect(spy.mock.calls[0]![0]).toEqual([{ column: "a", direction: "desc" }]);
    });
  });

  // 注意：setSortDirection / toggleSort 会「重新赋值」this.sortConfig，
  // 因此断言必须基于 SORT_CHANGE 的载荷（handler 内部会浅拷贝后派发），
  // 而不是 setup 时捕获的数组引用。
  describe("setSortDirection（经由点击排序箭头）", () => {
    it("重复点击同一方向且未按 shift 时清空排序", () => {
      const { handler, emitter } = setup({
        sortConfig: [{ column: "a", direction: "asc" }],
      });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.handleHeaderClick(0, at(80, 10));

      expect(spy.mock.calls[0]![0]).toEqual([]);
    });

    it("重复点击同一方向且按住 shift 时移除该列", () => {
      const { handler, emitter } = setup({
        sortConfig: [
          { column: "b", direction: "desc" },
          { column: "a", direction: "asc" },
        ],
      });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.handleHeaderClick(0, at(80, 10, true));

      expect(spy.mock.calls[0]![0]).toEqual([{ column: "b", direction: "desc" }]);
    });

    it("按住 shift 且列已存在时更新方向", () => {
      const { handler, emitter } = setup({
        sortConfig: [{ column: "a", direction: "desc" }],
      });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.handleHeaderClick(0, at(80, 10, true));

      expect(spy.mock.calls[0]![0]).toEqual([{ column: "a", direction: "asc" }]);
    });

    it("按住 shift 且列不存在时追加到排序列表", () => {
      const { handler, emitter } = setup({
        sortConfig: [{ column: "b", direction: "desc" }],
      });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.handleHeaderClick(0, at(80, 10, true));

      expect(spy.mock.calls[0]![0]).toEqual([
        { column: "b", direction: "desc" },
        { column: "a", direction: "asc" },
      ]);
    });

    it("未按 shift 时替换整个排序列表", () => {
      const { handler, emitter } = setup({
        sortConfig: [{ column: "b", direction: "desc" }],
      });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.handleHeaderClick(0, at(80, 26));

      expect(spy.mock.calls[0]![0]).toEqual([{ column: "a", direction: "desc" }]);
    });
  });

  describe("toggleSort", () => {
    // 命中区域常量（gap=2、hitAreaPadding=4）使得上箭头命中区 [y-7, y+2] 与
    // 下箭头命中区 [y-2, y+7] 始终重叠，公共入口永远无法走到 toggleSort 分支，
    // 因此这里直接驱动该方法以覆盖 asc → desc → none 的完整状态机。
    it("首次点击进入升序", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      callToggleSort(handler, colA, at(0, 0));

      expect(spy.mock.calls[0]![0]).toEqual([{ column: "a", direction: "asc" }]);
    });

    it("升序 → 降序", () => {
      const { handler, emitter } = setup({ sortConfig: [{ column: "a", direction: "asc" }] });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      callToggleSort(handler, colA, at(0, 0));

      expect(spy.mock.calls[0]![0]).toEqual([{ column: "a", direction: "desc" }]);
    });

    it("降序 → 取消排序", () => {
      const { handler, emitter } = setup({ sortConfig: [{ column: "a", direction: "desc" }] });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      callToggleSort(handler, colA, at(0, 0));

      expect(spy.mock.calls[0]![0]).toEqual([]);
    });

    it("按 shift 时升序 → 降序（原地更新）", () => {
      const { handler, emitter } = setup({ sortConfig: [{ column: "a", direction: "asc" }] });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      callToggleSort(handler, colA, at(0, 0, true));

      expect(spy.mock.calls[0]![0]).toEqual([{ column: "a", direction: "desc" }]);
    });

    it("按 shift 时降序 → 移除该列", () => {
      const { handler, emitter } = setup({ sortConfig: [{ column: "a", direction: "desc" }] });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      callToggleSort(handler, colA, at(0, 0, true));

      expect(spy.mock.calls[0]![0]).toEqual([]);
    });

    it("按 shift 且列不存在时追加升序", () => {
      const { handler, emitter } = setup({ sortConfig: [{ column: "b", direction: "desc" }] });
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      callToggleSort(handler, colA, at(0, 0, true));

      expect(spy.mock.calls[0]![0]).toEqual([
        { column: "b", direction: "desc" },
        { column: "a", direction: "asc" },
      ]);
    });

    it("派发 SORT_CHANGE 时传递排序配置的副本", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      callToggleSort(handler, colA, at(0, 0));
      // 篡改上一次派发的载荷
      (spy.mock.calls[0]![0] as SortConfig[]).push({ column: "zzz", direction: "desc" });

      callToggleSort(handler, colB, at(0, 0, true));

      // 内部状态未被污染
      expect((spy.mock.calls[1]![0] as SortConfig[]).map((s) => s.column)).toEqual(["a", "b"]);
    });
  });

  describe("openFilterDropdown", () => {
    it("列类型不支持筛选时直接返回", () => {
      const column: Column = { key: "img", title: "IMG", width: 100, type: "image" };
      const { handler, state } = setup({ columns: [column], leafColumns: [column] });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown).toBeNull();
    });

    it("filter.disabled 时直接返回", () => {
      const column: Column = { ...colA, filter: { type: "text", disabled: true } };
      const { handler, state } = setup({ columns: [column], leafColumns: [column] });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown).toBeNull();
    });

    it("text 类型使用 search 模式", () => {
      const { handler, state, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, spy);

      handler.openFilterDropdown(colA, 0);

      expect(state.filterDropdown).toMatchObject({
        columnKey: "a",
        mode: "search",
        x: 50,
        y: 36,
        width: 200,
        searchText: "",
        hoveredIndex: -1,
        searchValue: "",
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("非固定列按 scrollLeft 换算 x 坐标", () => {
      const { handler, state } = setup({ scrollLeft: 20 });

      handler.openFilterDropdown(colA, 0);

      expect(state.filterDropdown!.x).toBe(30);
    });

    it("固定左列的 x 不受 scrollLeft 影响", () => {
      const column: Column = { ...colA, fixed: "left" };
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        scrollLeft: 20,
      });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown!.x).toBe(50);
    });

    it("固定右列的 x 同样不受 scrollLeft 影响", () => {
      const column: Column = { ...colA, fixed: "right" };
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        scrollLeft: 20,
      });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown!.x).toBe(50);
    });

    it("search 模式会回填已有筛选值", () => {
      const { handler, state } = setup({
        filterConfig: [{ column: "a", operator: "contains", value: "hello" }],
      });

      handler.openFilterDropdown(colA, 0);

      expect(state.filterDropdown!.searchValue).toBe("hello");
    });

    it("number 类型使用 range 模式并回填已有区间", () => {
      const { handler, state } = setup({
        filterConfig: [{ column: "b", operator: "between", value: { min: 10, max: 20 } }],
      });

      handler.openFilterDropdown(colB, 1);

      expect(state.filterDropdown).toMatchObject({
        columnKey: "b",
        mode: "range",
        width: 200,
        minValue: 10,
        maxValue: 20,
      });
    });

    it("range 模式无已有筛选时使用空字符串", () => {
      const { handler, state } = setup();

      handler.openFilterDropdown(colB, 1);

      expect(state.filterDropdown).toMatchObject({ mode: "range", minValue: "", maxValue: "" });
    });

    it("select 模式使用 column.filter.options 并标记选中项", () => {
      const column: Column = {
        ...colA,
        type: "select",
        filter: { type: "enum", options: [{ label: "X", value: "x" }, { label: "Y", value: "y" }] },
      };
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        filterConfig: [{ column: "a", operator: "in", value: ["x"] }],
      });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown).toMatchObject({ mode: "select" });
      expect(state.filterDropdown!.options).toEqual([
        { label: "X", value: "x", checked: true },
        { label: "Y", value: "y", checked: false },
      ]);
      expect(state.filterDropdown!.isLoading).toBe(false);
    });

    it("select 模式取不到选项但有数据时标记 isLoading", () => {
      const column: Column = { ...colA, type: "select", filter: { type: "enum", mode: "select" } };
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        rows: [{ id: "r1", data: {} }],
      });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown!.options).toEqual([]);
      expect(state.filterDropdown!.isLoading).toBe(true);
    });

    it("date 类型使用 dateRange 模式并回填日期区间", () => {
      const column: Column = { ...colA, type: "date" };
      const start = new Date(2026, 0, 1);
      const end = new Date(2026, 0, 31);
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        filterConfig: [{ column: "a", operator: "between", value: { start, end } }],
      });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown).toMatchObject({
        mode: "dateRange",
        width: 240,
        startDate: start,
        endDate: end,
      });
    });

    it("dateRange 模式无已有筛选时使用 null", () => {
      const column: Column = { ...colA, type: "date" };
      const { handler, state } = setup({ columns: [column], leafColumns: [column] });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown!.startDate).toBeNull();
      expect(state.filterDropdown!.endDate).toBeNull();
    });

    it("checkbox 类型使用 boolean 模式并回填布尔值", () => {
      const column: Column = { ...colA, type: "checkbox" };
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        filterConfig: [{ column: "a", operator: "eq", value: "true" }],
      });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown).toMatchObject({
        mode: "boolean",
        width: 160,
        boolValue: "true",
      });
    });

    it("boolean 模式无已有筛选时默认为 all", () => {
      const column: Column = { ...colA, type: "checkbox" };
      const { handler, state } = setup({ columns: [column], leafColumns: [column] });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown!.boolValue).toBe("all");
    });

    it("列宽大于最小宽度时使用列宽", () => {
      const column: Column = { ...colA, width: 300 };
      const { handler, state } = setup({
        columns: [column],
        leafColumns: [column],
        cellPosition: { x: 0, y: 0, width: 300, height: 36 },
      });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown!.width).toBe(300);
    });

    it("filter.mode 显式指定时优先使用", () => {
      const column: Column = { ...colA, type: "text", filter: { type: "enum", mode: "boolean" } };
      const { handler, state } = setup({ columns: [column], leafColumns: [column] });

      handler.openFilterDropdown(column, 0);

      expect(state.filterDropdown!.mode).toBe("boolean");
    });
  });

  describe("calculateSiblingColumns", () => {
    it("平铺非固定列按累计宽度计算边界", () => {
      const { handler } = setup();

      const siblings = handler.calculateSiblingColumns(colA);

      expect(siblings).toEqual([
        { key: "a", left: 0, right: 100, center: 50, width: 100, leafCount: 1, firstLeafIndex: 0, fixed: false },
        { key: "b", left: 100, right: 220, center: 160, width: 120, leafCount: 1, firstLeafIndex: 1, fixed: false },
        { key: "c", left: 220, right: 300, center: 260, width: 80, leafCount: 1, firstLeafIndex: 2, fixed: false },
      ]);
    });

    it("横向滚动会整体左移", () => {
      const { handler } = setup({ scrollLeft: 20 });

      const siblings = handler.calculateSiblingColumns(colA);

      expect(siblings.map((s) => s.left)).toEqual([-20, 80, 200]);
    });

    it("排除 reorderable 为 false 的列但保留其占位宽度", () => {
      const columns: Column[] = [
        { key: "a", title: "A", width: 100, type: "text" },
        { key: "b", title: "B", width: 120, type: "text", reorderable: false },
        { key: "c", title: "C", width: 80, type: "text" },
      ];
      const { handler } = setup({ columns, leafColumns: columns });

      const siblings = handler.calculateSiblingColumns(columns[0]!);

      expect(siblings.map((s) => s.key)).toEqual(["a", "c"]);
      expect(siblings[1]!.left).toBe(220);
    });

    it("只返回 fixed 属性相同的同级列", () => {
      const columns: Column[] = [
        { key: "a", title: "A", width: 100, type: "text" },
        { key: "b", title: "B", width: 120, type: "text", fixed: "left" },
      ];
      const { handler } = setup({ columns, leafColumns: columns });

      const siblings = handler.calculateSiblingColumns(columns[0]!);

      expect(siblings.map((s) => s.key)).toEqual(["a"]);
      expect(siblings[0]!.fixed).toBe(false);
    });

    it("固定左列按左侧固定列累计宽度计算", () => {
      const columns: Column[] = [
        { key: "l1", title: "L1", width: 50, type: "text", fixed: "left" },
        { key: "l2", title: "L2", width: 60, type: "text", fixed: "left" },
      ];
      const { handler } = setup({ columns, leafColumns: columns, leftFixedWidth: 110 });

      const siblings = handler.calculateSiblingColumns(columns[0]!);

      expect(siblings.map((s) => s.left)).toEqual([0, 50]);
      expect(siblings.map((s) => s.fixed)).toEqual(["left", "left"]);
    });

    it("固定右列从视口右侧开始累计", () => {
      const columns: Column[] = [
        { key: "r1", title: "R1", width: 70, type: "text", fixed: "right" },
        { key: "r2", title: "R2", width: 30, type: "text", fixed: "right" },
      ];
      const { handler } = setup({
        columns,
        leafColumns: columns,
        rightFixedWidth: 100,
        viewportWidth: 800,
      });

      const siblings = handler.calculateSiblingColumns(columns[0]!);

      // 700 + 0 = 700，再 +70 = 770
      expect(siblings.map((s) => s.left)).toEqual([700, 770]);
      expect(siblings[1]!.right).toBe(800);
    });

    it("有 parentKey 时使用父列的子列作为同级集合", () => {
      const c1: Column = { key: "c1", title: "C1", width: 60, type: "text", parentKey: "p" };
      const c2: Column = { key: "c2", title: "C2", width: 60, type: "text", parentKey: "p" };
      const parent: Column = { key: "p", title: "P", children: [c1, c2] };
      const { handler } = setup({ columns: [parent], leafColumns: [c1, c2] });

      const siblings = handler.calculateSiblingColumns(c1);

      expect(siblings.map((s) => s.key)).toEqual(["c1", "c2"]);
      expect(siblings[0]!.left).toBe(0);
      expect(siblings[1]!.left).toBe(60);
    });

    it("父列参与同级计算时统计叶子列数量", () => {
      const c1: Column = { key: "c1", title: "C1", width: 60, type: "text" };
      const c2: Column = { key: "c2", title: "C2", width: 60, type: "text" };
      const parent: Column = { key: "p", title: "P", children: [c1, c2] };
      const solo: Column = { key: "s", title: "S", width: 40, type: "text" };
      const { handler } = setup({
        columns: [parent, solo],
        leafColumns: [c1, c2, solo],
      });

      const siblings = handler.calculateSiblingColumns(solo);

      expect(siblings).toHaveLength(2);
      expect(siblings[0]).toMatchObject({ key: "p", leafCount: 2, firstLeafIndex: 0, width: 100 });
      // solo 前有两个叶子列各 60 → left = 120
      expect(siblings[1]).toMatchObject({ key: "s", leafCount: 1, firstLeafIndex: 2, left: 120 });
    });

    it("firstLeaf 不在叶子列列表中时跳过该列", () => {
      const orphan: Column = { key: "orphan", title: "Orphan", width: 100, type: "text" };
      const normal: Column = { key: "n", title: "N", width: 100, type: "text" };
      const { handler } = setup({
        columns: [orphan, normal],
        // orphan 不在 leafColumns 中 → getLeafColumnIndex 返回 -1
        leafColumns: [normal],
      });

      const siblings = handler.calculateSiblingColumns(normal);

      expect(siblings.map((s) => s.key)).toEqual(["n"]);
      expect(siblings[0]!.firstLeafIndex).toBe(0);
    });

    it("父列没有 children 时退化为单叶子", () => {
      const parent: Column = { key: "p", title: "P", width: 100, type: "text" };
      const { handler } = setup({ columns: [parent], leafColumns: [parent] });

      const siblings = handler.calculateSiblingColumns(parent);

      expect(siblings[0]).toMatchObject({ leafCount: 1, firstLeafIndex: 0 });
    });
  });

  describe("updateSortConfig / updateFilterConfig", () => {
    it("updateSortConfig 会替换排序配置引用", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.SORT_CHANGE, spy);

      handler.updateSortConfig([{ column: "a", direction: "asc" }]);
      // 新配置中 a 已是 asc，再次点击升序会清空排序（默认空配置下则会变成 asc）
      handler.handleHeaderClick(0, at(80, 10));

      expect(spy.mock.calls[0]![0]).toEqual([]);
    });

    it("updateFilterConfig 会替换筛选配置引用", () => {
      const { handler, state } = setup();

      handler.updateFilterConfig([{ column: "a", operator: "contains", value: "world" }]);
      handler.openFilterDropdown(colA, 0);

      expect(state.filterDropdown!.searchValue).toBe("world");
    });
  });
});
