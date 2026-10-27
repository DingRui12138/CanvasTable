import { ControlClickHandler } from "@/core/handlers/ControlClickHandler";
import { ButtonAnimationHandler } from "@/core/handlers/ButtonAnimationHandler";
import type { EditingHandler } from "@/core/handlers/EditingHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import type { LayoutManager } from "@/core/LayoutManager";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { EditorRegistry } from "@/core/editors";
import { TableEvents } from "@/constants/events";
import { zhCN } from "@/locale";
import type {
  CellPosition,
  Column,
  InteractionState,
  LayoutInfo,
  Row,
  ScrollState,
} from "@/types";
import { createMockCanvas } from "../../helpers/mockFactories";
import { createTrackedContext } from "../../helpers/canvasInspect";

/**
 * ControlClickHandler 完全依赖「单元格几何 + 鼠标视口坐标」来做命中判定。
 * 因此这里用桩对象固定 getCellPosition / getCellViewportY，再配合
 * canvas.getBoundingClientRect() 返回 (0,0)，让 clientX/clientY 就等于视口坐标。
 */
function makeLayout(options: {
  cellPosition: { x: number; y: number; width: number; height: number };
  cellViewportY: number;
  leafColumns: Column[];
}) {
  const info: LayoutInfo = {
    totalWidth: 400,
    totalHeight: 100,
    viewportWidth: 800,
    viewportHeight: 600,
    headerHeight: 36,
    rowHeight: options.cellPosition.height,
    columnWidths: options.leafColumns.map((c) => c.width ?? 100),
    rowOffsets: [],
    columnOffsets: [],
  };

  const mocks = {
    getLayoutInfo: jest.fn(() => info),
    getLeafColumns: jest.fn(() => options.leafColumns),
    getLeafColumn: jest.fn((i: number) => options.leafColumns[i]),
    getColumns: jest.fn(() => options.leafColumns),
    getColumnByKey: jest.fn((key: string) => options.leafColumns.find((c) => c.key === key)),
    getColumnWidth: jest.fn((c: Column) => c.width ?? 100),
    getColumnWidthByIndex: jest.fn((i: number) => options.leafColumns[i]?.width ?? 100),
    getLeafColumnIndex: jest.fn((c: Column) => options.leafColumns.indexOf(c)),
    getLeftFixedWidth: jest.fn(() => 0),
    getRightFixedWidth: jest.fn(() => 0),
    getViewportWidth: jest.fn(() => 800),
    getCellPosition: jest.fn(() => options.cellPosition),
    getCellViewportY: jest.fn(() => options.cellViewportY),
  };

  return { layout: mocks as unknown as LayoutManager, mocks };
}

const DEFAULT_CELL = { x: 0, y: 0, width: 200, height: 40 };

interface SetupOptions {
  cellPosition?: { x: number; y: number; width: number; height: number };
  cellViewportY?: number;
  scrollLeft?: number;
  scrollTop?: number;
  leafColumns?: Column[];
  canEdit?: boolean;
}

function setup(options: SetupOptions = {}) {
  const column: Column = { key: "c", title: "C", width: 200, type: "progress" };
  const leafColumns = options.leafColumns ?? [column];
  const rows: Row[] = [{ id: "r0", data: { c: 0 } }];

  const { layout, mocks } = makeLayout({
    cellPosition: options.cellPosition ?? DEFAULT_CELL,
    cellViewportY: options.cellViewportY ?? 0,
    leafColumns,
  });

  const dataManager = new DataManager();
  dataManager.setColumns(leafColumns);
  dataManager.setRows(rows);

  const { ctx, sets } = createTrackedContext();

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
    scrollTop: options.scrollTop ?? 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
    isScrolling: false,
  };

  const registry = new EditorRegistry();
  const canEdit = options.canEdit ?? true;
  jest
    .spyOn(registry, "getStrategy")
    .mockImplementation(
      () =>
        ({ canEdit: () => canEdit }) as unknown as ReturnType<EditorRegistry["getStrategy"]>,
    );

  const emitter = new EventEmitter<InteractionEvents>();
  const context = {
    state,
    scrollState,
    layoutManager: layout,
    dataManager,
    canvas: createMockCanvas(),
    ctx: ctx as unknown as CanvasRenderingContext2D,
    expandColumnKey: null,
    locale: zhCN,
    editorRegistry: registry,
  };
  const buttonAnimationHandler = new ButtonAnimationHandler(context, emitter);
  const editingHandler = { startColorEditing: jest.fn() } as unknown as EditingHandler;
  const handler = new ControlClickHandler(context, emitter, editingHandler, buttonAnimationHandler);

  return { handler, state, emitter, mocks, sets, ctx, registry, column, rows };
}

/** mock canvas 的 getBoundingClientRect 返回 (0,0)，故 clientX/clientY 即视口坐标 */
function at(clientX: number, clientY: number): MouseEvent {
  return { clientX, clientY } as MouseEvent;
}

const CELL: CellPosition = { rowIndex: 0, columnIndex: 0 };

function progressConfig(overrides: Record<string, unknown> = {}) {
  return { value: 0, interactive: true, ...overrides };
}

function ratingConfig(overrides: Record<string, unknown> = {}) {
  return { value: 0, ...overrides };
}

describe("ControlClickHandler", () => {
  describe("handleProgressClick - 守卫条件", () => {
    it("interactive 为假时直接返回 false", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      const ok = handler.handleProgressClick(CELL, at(80, 20), { value: 50 }, undefined, undefined);

      expect(ok).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it("canEdit 为假时返回 false", () => {
      const { handler, emitter, column, rows } = setup({ canEdit: false });
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      const ok = handler.handleProgressClick(CELL, at(80, 20), progressConfig(), column, rows[0]);

      expect(ok).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it("未传 row/column 时跳过 canEdit 检查", () => {
      const { handler, emitter } = setup({ canEdit: false });
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      const ok = handler.handleProgressClick(CELL, at(80, 20), progressConfig(), undefined, undefined);

      expect(ok).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleProgressClick - line 形状", () => {
    it("按点击位置换算百分比并派发 PROGRESS_CHANGE", () => {
      const { handler, emitter, column, rows } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // barX = 8, barWidth = 200 - 16 - 40 = 144, barY = (40-10)/2 = 15
      const ok = handler.handleProgressClick(CELL, at(80, 20), progressConfig(), column, rows[0]);

      expect(ok).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      const info = spy.mock.calls[0]![0] as { rowIndex: number; columnIndex: number };
      expect(info.rowIndex).toBe(0);
      expect(info.columnIndex).toBe(0);
      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("precision 参与取值精度", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // relativeX = 48 → 48/144*100 = 33.333... → toFixed(2) = 33.33
      handler.handleProgressClick(CELL, at(56, 20), progressConfig({ precision: 2 }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(33.33);
    });

    it("点击在进度条左侧之外返回 false", () => {
      const { handler } = setup();

      expect(
        handler.handleProgressClick(CELL, at(0, 20), progressConfig(), undefined, undefined),
      ).toBe(false);
    });

    it("点击在进度条右侧之外返回 false", () => {
      const { handler } = setup();

      // relativeX = 145 > barWidth 144
      expect(
        handler.handleProgressClick(CELL, at(153, 20), progressConfig(), undefined, undefined),
      ).toBe(false);
    });

    it("点击在进度条上方之外返回 false", () => {
      const { handler } = setup();

      expect(
        handler.handleProgressClick(CELL, at(80, 0), progressConfig(), undefined, undefined),
      ).toBe(false);
    });

    it("点击在进度条下方之外返回 false", () => {
      const { handler } = setup();

      // relativeY = 30 - 15 = 15 > barHeight 10
      expect(
        handler.handleProgressClick(CELL, at(80, 30), progressConfig(), undefined, undefined),
      ).toBe(false);
    });

    it("size=small 时进度条高度为 6", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // barY = (40-6)/2 = 17 → clickY 20 → relativeY 3
      const ok = handler.handleProgressClick(
        CELL,
        at(80, 20),
        progressConfig({ size: "small" }),
        undefined,
        undefined,
      );

      expect(ok).toBe(true);
      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("size=large 时进度条高度为 16", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // barY = (40-16)/2 = 12 → clickY 20 → relativeY 8
      handler.handleProgressClick(CELL, at(80, 20), progressConfig({ size: "large" }), undefined, undefined);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("config.height 覆盖默认高度", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // barY = (40-20)/2 = 10 → clickY 20 → relativeY 10 命中
      handler.handleProgressClick(CELL, at(80, 20), progressConfig({ height: 20 }), undefined, undefined);

      expect(spy).toHaveBeenCalledTimes(1);
      // clickY 5 → relativeY -5 不命中
      spy.mockClear();
      handler.handleProgressClick(CELL, at(80, 5), progressConfig({ height: 20 }), undefined, undefined);
      expect(spy).not.toHaveBeenCalled();
    });

    it("showText 为 false 时不预留文本宽度", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // barWidth = 200 - 16 = 184 → relativeX 92 → 50%
      handler.handleProgressClick(CELL, at(100, 20), progressConfig({ showText: false }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("textPosition 不是 right 时不预留文本宽度", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      handler.handleProgressClick(CELL, at(100, 20), progressConfig({ textPosition: "left" }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("config.width 覆盖进度条宽度", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // barWidth = 100 → relativeX 50 → 50%
      handler.handleProgressClick(CELL, at(58, 20), progressConfig({ width: 100 }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("非固定列的视口 X 会减去水平滚动量", () => {
      const { handler, emitter } = setup({ scrollLeft: 20 });
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // cellViewportX = 0 - 20 = -20 → barX = -12 → relativeX 72 需要 clickX 60
      handler.handleProgressClick(CELL, at(60, 20), progressConfig(), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("固定列的视口 X 不随滚动变化", () => {
      const fixed: Column = { key: "c", title: "C", width: 200, type: "progress", fixed: "left" };
      const { handler, emitter } = setup({ scrollLeft: 20, leafColumns: [fixed] });
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // 传入固定列 → cellViewportX = cellPos.x = 0（不减滚动）→ barX = 8
      // 因此 relativeX 72 需要 clickX 80；若按非固定列算则会得到 64%
      handler.handleProgressClick(CELL, at(80, 20), progressConfig(), fixed, undefined);

      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("进度条在单元格内垂直居中", () => {
      const { handler, emitter } = setup({ cellPosition: { x: 0, y: 0, width: 200, height: 60 } });
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // barY = (60-10)/2 = 25 → clickY 30 → relativeY 5 命中
      handler.handleProgressClick(CELL, at(80, 30), progressConfig(), undefined, undefined);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("未知 shape 时不做任何命中判定", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      const ok = handler.handleProgressClick(
        CELL,
        at(80, 20),
        progressConfig({ shape: "unknown" }),
        undefined,
        undefined,
      );

      expect(ok).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("handleProgressClick - circle 形状", () => {
    it("正上方为 0%、顺时针增大", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // 圆心 (100,20)，半径 13 → 正上方 (100,7)
      handler.handleProgressClick(CELL, at(100, 7), progressConfig({ shape: "circle" }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(0);
    });

    it("右侧为 25%", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      handler.handleProgressClick(CELL, at(113, 20), progressConfig({ shape: "circle" }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(25);
    });

    it("正下方为 50%", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      handler.handleProgressClick(CELL, at(100, 33), progressConfig({ shape: "circle" }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("左侧为 75%", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      handler.handleProgressClick(CELL, at(87, 20), progressConfig({ shape: "circle" }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(75);
    });

    it("负角度会被归一化到 0~2π", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // raw angle = -135° → 调整后 -45° → +2π → 87.5% → 四舍五入 88
      handler.handleProgressClick(
        CELL,
        at(100 - 13 * Math.SQRT1_2, 20 - 13 * Math.SQRT1_2),
        progressConfig({ shape: "circle" }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(88);
    });

    it("圆环之外的点击返回 false", () => {
      const { handler } = setup();

      // 距离 30 远超环宽 [9,17]
      expect(
        handler.handleProgressClick(CELL, at(130, 20), progressConfig({ shape: "circle" }), undefined, undefined),
      ).toBe(false);
    });

    it("圆心处的点击返回 false", () => {
      const { handler } = setup();

      expect(
        handler.handleProgressClick(CELL, at(100, 20), progressConfig({ shape: "circle" }), undefined, undefined),
      ).toBe(false);
    });

    it("size=small 时直径按 0.6 缩放", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // diameter 24, strokeWidth 3, radius 10.5 → 右侧 (110.5, 20)
      handler.handleProgressClick(
        CELL,
        at(110.5, 20),
        progressConfig({ shape: "circle", size: "small" }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(25);
    });

    it("size=large 时直径按 0.9 缩放", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // diameter 36, strokeWidth 4, radius 16 → 右侧 (116, 20)
      handler.handleProgressClick(
        CELL,
        at(116, 20),
        progressConfig({ shape: "circle", size: "large" }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(25);
    });

    it("config.width 覆盖直径", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // diameter 20, strokeWidth 2, radius 9 → 右侧 (109, 20)
      handler.handleProgressClick(
        CELL,
        at(109, 20),
        progressConfig({ shape: "circle", width: 20 }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(25);
    });

    it("config.strokeWidth 覆盖环宽", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // diameter 30, strokeWidth 10, radius 10 → 右侧 (110, 20)
      handler.handleProgressClick(
        CELL,
        at(110, 20),
        progressConfig({ shape: "circle", strokeWidth: 10 }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(25);
    });

    it("precision 对圆环同样生效", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // 角度 π/6 → 33.3333% → toFixed(1) = 33.3
      const dx = 13 * Math.cos(Math.PI / 6);
      const dy = 13 * Math.sin(Math.PI / 6);
      handler.handleProgressClick(
        CELL,
        at(100 + dx, 20 + dy),
        progressConfig({ shape: "circle", precision: 1 }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(33.3);
    });
  });

  describe("handleProgressClick - dashboard 形状", () => {
    it("135° 起点为 0%", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // 圆心 (100,22)，半径 15 → 135° 方向 (100-15/√2, 22+15/√2)
      const r = 15 * Math.SQRT1_2;
      handler.handleProgressClick(
        CELL,
        at(100 - r, 22 + r),
        progressConfig({ shape: "dashboard" }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(0);
    });

    it("正上方为 50%", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      handler.handleProgressClick(CELL, at(100, 7), progressConfig({ shape: "dashboard" }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(50);
    });

    it("45° 终点为 100%", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      const r = 15 * Math.SQRT1_2;
      handler.handleProgressClick(
        CELL,
        at(100 + r, 22 + r),
        progressConfig({ shape: "dashboard" }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(100);
    });

    it("底部缺口区域的点击返回 false", () => {
      const { handler } = setup();

      // 90° 方向（正下方）落在 270° 之外
      expect(
        handler.handleProgressClick(CELL, at(100, 37), progressConfig({ shape: "dashboard" }), undefined, undefined),
      ).toBe(false);
    });

    it("负角度同样会被归一化", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // raw -135° → 归一化后 offset 90° → 1/3 → 33
      const r = 15 * Math.SQRT1_2;
      handler.handleProgressClick(
        CELL,
        at(100 - r, 22 - r),
        progressConfig({ shape: "dashboard" }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(33);
    });

    it("size=small 时按 0.7 缩放并保留 5% 垂直偏移", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // diameter 28, strokeWidth 3, radius 12.5
      const r = 12.5 * Math.SQRT1_2;
      handler.handleProgressClick(
        CELL,
        at(100 - r, 22 + r),
        progressConfig({ shape: "dashboard", size: "small" }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(0);
    });

    it("size=large 时按 0.95 缩放", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.PROGRESS_CHANGE, spy);

      // diameter 38, strokeWidth 5, radius 16.5
      const r = 16.5 * Math.SQRT1_2;
      handler.handleProgressClick(
        CELL,
        at(100 - r, 22 + r),
        progressConfig({ shape: "dashboard", size: "large" }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(0);
    });

    it("圆环之外的点击返回 false", () => {
      const { handler } = setup();

      expect(
        handler.handleProgressClick(CELL, at(100, 90), progressConfig({ shape: "dashboard" }), undefined, undefined),
      ).toBe(false);
    });
  });

  describe("handleRatingClick", () => {
    it("点击第 3 颗星设为 3 分", () => {
      const { handler, emitter, column, rows } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      // startX 60，星宽 16 → 第 3 颗 [92,108]
      const ok = handler.handleRatingClick(CELL, at(100, 20), ratingConfig(), column, rows[0]);

      expect(ok).toBe(true);
      expect(spy.mock.calls[0]![1]).toBe(3);
    });

    it("再次点击当前分值会重置为 0", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      handler.handleRatingClick(CELL, at(100, 20), ratingConfig({ value: 3 }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(0);
    });

    it("value 缺省时按 0 处理", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      handler.handleRatingClick(
        CELL,
        at(100, 20),
        ratingConfig({ value: undefined }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(3);
    });

    it("allowHalf 时左半边取 x.5", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      // 第 3 颗 [92,108]，左半边 < 100
      handler.handleRatingClick(
        CELL,
        at(95, 20),
        ratingConfig({ allowHalf: true }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(2.5);
    });

    it("allowHalf 时右半边取整分", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      handler.handleRatingClick(
        CELL,
        at(105, 20),
        ratingConfig({ allowHalf: true }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(3);
    });

    it("allowHalf 时点击当前半星会重置为 0", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      handler.handleRatingClick(
        CELL,
        at(95, 20),
        ratingConfig({ allowHalf: true, value: 2.5 }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(0);
    });

    it("Y 坐标在星星上方时返回 false", () => {
      const { handler } = setup();

      // startY = 12，relativeY 5 < 12
      expect(handler.handleRatingClick(CELL, at(100, 5), ratingConfig(), undefined, undefined)).toBe(false);
    });

    it("Y 坐标在星星下方时返回 false", () => {
      const { handler } = setup();

      // relativeY 35 > 12 + 16
      expect(handler.handleRatingClick(CELL, at(100, 35), ratingConfig(), undefined, undefined)).toBe(false);
    });

    it("点击在星星区域左侧返回 false", () => {
      const { handler } = setup();

      expect(handler.handleRatingClick(CELL, at(50, 20), ratingConfig(), undefined, undefined)).toBe(false);
    });

    it("点击在星星区域右侧返回 false", () => {
      const { handler } = setup();

      expect(handler.handleRatingClick(CELL, at(150, 20), ratingConfig(), undefined, undefined)).toBe(false);
    });

    it("canEdit 为假时返回 false", () => {
      const { handler, emitter, column, rows } = setup({ canEdit: false });
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      const ok = handler.handleRatingClick(CELL, at(100, 20), ratingConfig(), column, rows[0]);

      expect(ok).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it("未传 row/column 时跳过 canEdit 检查", () => {
      const { handler, emitter } = setup({ canEdit: false });
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      const ok = handler.handleRatingClick(CELL, at(100, 20), ratingConfig(), undefined, undefined);

      expect(ok).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("max 自定义时重新计算星星布局", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      // max 3 → totalWidth 48 → startX 76；第 2 颗 [92,108]
      handler.handleRatingClick(CELL, at(100, 20), ratingConfig({ max: 3 }), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(2);
    });

    it("starSize 自定义时重新计算星星布局", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      // starSize 20 → totalWidth 100 → startX 50；第 3 颗 [90,110]，startY 10
      handler.handleRatingClick(
        CELL,
        at(100, 20),
        ratingConfig({ starSize: 20 }),
        undefined,
        undefined,
      );

      expect(spy.mock.calls[0]![1]).toBe(3);
    });

    it("非固定列的视口 X 会减去水平滚动量", () => {
      const { handler, emitter } = setup({ scrollLeft: 20 });
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      // cellViewportX = -20 → relativeX = clickX + 20；命中第 3 颗需要 clickX 80
      handler.handleRatingClick(CELL, at(80, 20), ratingConfig(), undefined, undefined);

      expect(spy.mock.calls[0]![1]).toBe(3);
    });

    it("relativeY 会减去 scrollTop", () => {
      const { handler, emitter } = setup({ scrollTop: 10 });
      const spy = jest.fn();
      emitter.on(TableEvents.RATING_CHANGE, spy);

      // cellViewportY = -10 → relativeY = clickY + 10；clickY 10 → 20 命中
      handler.handleRatingClick(CELL, at(100, 10), ratingConfig(), undefined, undefined);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleExpandIconClick", () => {
    it("level 为 0 时命中 [8,20] 区间", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.EXPAND, spy);
      const row: Row = { id: "r0", data: {} };

      expect(handler.handleExpandIconClick(CELL, at(10, 20), row)).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]).toBe(row);
      expect(spy.mock.calls[0]![1]).toBe(0);
      expect(spy.mock.calls[0]![2]).toBe(true);
    });

    it("已展开的行传入 false", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.EXPAND, spy);
      const row: Row = { id: "r0", data: {}, expanded: true };

      handler.handleExpandIconClick(CELL, at(10, 20), row);

      expect(spy.mock.calls[0]![2]).toBe(false);
    });

    it("level 越大缩进越多", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.EXPAND, spy);
      const row: Row = { id: "r0", data: {}, level: 2 };

      // iconX = 8 + 2*16 = 40，iconEndX = 52
      expect(handler.handleExpandIconClick(CELL, at(45, 20), row)).toBe(true);
      expect(handler.handleExpandIconClick(CELL, at(30, 20), row)).toBe(false);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("命中区间的两个端点都算命中", () => {
      const { handler } = setup();
      const row: Row = { id: "r0", data: {} };

      expect(handler.handleExpandIconClick(CELL, at(8, 20), row)).toBe(true);
      expect(handler.handleExpandIconClick(CELL, at(20, 20), row)).toBe(true);
      expect(handler.handleExpandIconClick(CELL, at(21, 20), row)).toBe(false);
      expect(handler.handleExpandIconClick(CELL, at(7, 20), row)).toBe(false);
    });

    it("level 缺省按 0 处理", () => {
      const { handler } = setup();
      const row: Row = { id: "r0", data: {} };

      expect(handler.handleExpandIconClick(CELL, at(10, 20), row)).toBe(true);
    });

    it("取不到列时按普通列（减滚动量）计算", () => {
      const { handler } = setup({ leafColumns: [], scrollLeft: 100 });

      // column undefined → cellViewportX = 0 - 100 = -100 → relativeX = clickX + 100
      expect(handler.handleExpandIconClick(CELL, at(-90, 20), { id: "r0", data: {} })).toBe(true);
    });
  });

  describe("getClickedRadioOption", () => {
    const twoOptions = [
      { label: "A", value: 1 },
      { label: "B", value: 2 },
    ];

    it("命中单选项圆圈时返回该选项", () => {
      const { handler } = setup();

      // A：圆圈 [8,24]，文字 [28,35]
      expect(handler.getClickedRadioOption(CELL, at(10, 20), twoOptions)).toBe(twoOptions[0]);
    });

    it("命中选项文字时同样返回该选项", () => {
      const { handler } = setup();

      expect(handler.getClickedRadioOption(CELL, at(30, 20), twoOptions)).toBe(twoOptions[0]);
    });

    it("命中第二个选项", () => {
      const { handler } = setup();

      // B：currentX 43 → 圆圈 [43,59]
      expect(handler.getClickedRadioOption(CELL, at(50, 20), twoOptions)).toBe(twoOptions[1]);
    });

    it("命中第二个选项的文字区域", () => {
      const { handler } = setup();

      // B 文字 [63,70]
      expect(handler.getClickedRadioOption(CELL, at(65, 20), twoOptions)).toBe(twoOptions[1]);
    });

    it("文字区域的 Y 容差比圆圈更宽", () => {
      const { handler } = setup();

      // radioY 12 / centerY 20：Y=11 超出圆圈但在文字容差 [10,30] 内
      expect(handler.getClickedRadioOption(CELL, at(30, 11), twoOptions)).toBe(twoOptions[0]);
      expect(handler.getClickedRadioOption(CELL, at(30, 29), twoOptions)).toBe(twoOptions[0]);
    });

    it("Y 超出所有容差时返回 null", () => {
      const { handler } = setup();

      expect(handler.getClickedRadioOption(CELL, at(30, 31), twoOptions)).toBeNull();
      expect(handler.getClickedRadioOption(CELL, at(30, 9), twoOptions)).toBeNull();
    });

    it("X 未命中任何选项时返回 null", () => {
      const { handler } = setup();

      expect(handler.getClickedRadioOption(CELL, at(200, 20), twoOptions)).toBeNull();
    });

    it("空选项列表返回 null", () => {
      const { handler } = setup();

      expect(handler.getClickedRadioOption(CELL, at(10, 20), [])).toBeNull();
    });

    it("超出可用宽度的选项会被跳过", () => {
      const { handler } = setup({ cellPosition: { x: 0, y: 0, width: 100, height: 40 } });
      const wide = [
        { label: "AAAAAAAA", value: 1 },
        { label: "BBBBBBBB", value: 2 },
      ];

      // maxX = 92；B 的 currentX 92 → 92 + 84 - 8 = 168 > 92 → break
      expect(handler.getClickedRadioOption(CELL, at(90, 20), wide)).toBeNull();
    });

    it("禁用选项也会被返回（函数本身不检查 disabled）", () => {
      const { handler } = setup();
      const disabled = [{ label: "A", value: 1, disabled: true }];

      expect(handler.getClickedRadioOption(CELL, at(10, 20), disabled)).toBe(disabled[0]);
    });

    it("测量文字前会设置统一的 14px 字体", () => {
      const { handler, sets } = setup();

      handler.getClickedRadioOption(CELL, at(10, 20), twoOptions);

      expect(sets).toContainEqual({
        prop: "font",
        value: "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      });
    });

    it("非固定列的视口 X 会减去水平滚动量", () => {
      const { handler } = setup({ scrollLeft: 30 });

      // cellViewportX = -30 → relativeX = clickX + 30；clickX 0 → 30 命中 A 文字
      expect(handler.getClickedRadioOption(CELL, at(0, 20), twoOptions)).toBe(twoOptions[0]);
    });

    it("relativeY 基于 getCellViewportY", () => {
      const { handler } = setup({ cellViewportY: 100 });

      // relativeY = clickY - 100 → clickY 120 → 20 命中
      expect(handler.getClickedRadioOption(CELL, at(10, 120), twoOptions)).toBe(twoOptions[0]);
      expect(handler.getClickedRadioOption(CELL, at(10, 0), twoOptions)).toBeNull();
    });
  });
});
