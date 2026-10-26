/**
 * DropdownPositionCalculator 单元测试
 *
 * 该类是所有下拉浮层（select / tags / date / color / buttons / filter / image tooltip）
 * 的统一坐标计算器，负责三件事：
 *   1. X 轴：按锚点类型定位 + 视口边界收敛
 *   2. Y 轴：按锚点类型取基准线 + 空间检测决定向上/向下展开
 *   3. 滚动过程中实时重算并允许上下翻转
 *
 * 本套件用桩对象替换 LayoutManager，直接锁定坐标算术。
 */
import { DropdownPositionCalculator } from "@/core/DropdownPositionCalculator";
import type { DropdownAnchorType } from "@/core/DropdownPositionCalculator";
import type { LayoutManager } from "@/core/LayoutManager";
import type { Column, ScrollState } from "@/types";
import { createMockCanvas } from "../helpers/mockFactories";

interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutStub {
  getCellPosition: jest.Mock;
  getCellViewportY: jest.Mock;
  getLeafColumns: jest.Mock;
  getColumns: jest.Mock;
  getLayoutInfo: jest.Mock;
}

interface LayoutOptions {
  rect?: CellRect;
  viewportY?: number;
  leafColumns?: Column[];
  columns?: Column[];
  headerHeight?: number;
}

function createLayout(options: LayoutOptions = {}): LayoutStub {
  const rect = options.rect ?? { x: 100, y: 200, width: 120, height: 32 };
  return {
    getCellPosition: jest.fn(() => ({ ...rect })),
    getCellViewportY: jest.fn(() => options.viewportY ?? 100),
    getLeafColumns: jest.fn(() => options.leafColumns ?? []),
    getColumns: jest.fn(() => options.columns ?? []),
    getLayoutInfo: jest.fn(() => ({ headerHeight: options.headerHeight ?? 36 })),
  };
}

interface CalculatorOptions extends LayoutOptions {
  scrollLeft?: number;
  scrollTop?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

function createCalculator(options: CalculatorOptions = {}) {
  const layout = createLayout(options);
  const canvas = createMockCanvas();
  canvas.width = options.canvasWidth ?? 800;
  canvas.height = options.canvasHeight ?? 600;

  const scrollState: ScrollState = {
    scrollLeft: options.scrollLeft ?? 0,
    scrollTop: options.scrollTop ?? 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
    isScrolling: false,
  };

  const calculator = new DropdownPositionCalculator(
    layout as unknown as LayoutManager,
    scrollState,
    canvas,
  );

  return { calculator, layout, canvas, scrollState };
}

const COLUMN_A: Column = { key: "a", title: "A", width: 100 };
const COLUMN_B: Column = { key: "b", title: "B", width: 150 };

afterEach(() => {
  jest.restoreAllMocks();
});

describe("DropdownPositionCalculator 逻辑画布尺寸", () => {
  it("devicePixelRatio 为 1 时直接采用 canvas 宽高作为边界", () => {
    const { calculator } = createCalculator({ canvasWidth: 800, canvasHeight: 600 });
    // rect.x=100, 无 column → cellWidth 兜底 100 → cellRight=200，可见
    const result = calculator.calculate({ width: 200, height: 300 });
    expect(result.x).toBe(100);
    expect(result.y).toBe(4);
    expect(result.showAbove).toBe(false);
  });

  it("devicePixelRatio 为 2 时按 CSS 像素折算边界（右溢出贴边）", () => {
    const original = Object.getOwnPropertyDescriptor(window, "devicePixelRatio");
    Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
    try {
      const { calculator } = createCalculator({
        canvasWidth: 1600,
        canvasHeight: 1200,
        rect: { x: 700, y: 200, width: 100, height: 32 },
      });
      // 逻辑宽 = 1600 / 2 = 800；rect.x=700 可见，200 宽右溢出 → 800-200-8=592
      const result = calculator.calculate({ width: 200, height: 300 });
      expect(result.x).toBe(592);
    } finally {
      if (original) Object.defineProperty(window, "devicePixelRatio", original);
      else delete (window as unknown as { devicePixelRatio?: number }).devicePixelRatio;
    }
  });
});

describe("DropdownPositionCalculator.calculate X 轴定位", () => {
  it("默认锚点取单元格视口 X（减去 scrollLeft）", () => {
    const { calculator, layout } = createCalculator({ scrollLeft: 40 });
    const result = calculator.calculate({ width: 200, height: 300 });
    expect(layout.getCellPosition).toHaveBeenCalledWith(0, 0);
    // 100 - 40 = 60
    expect(result.x).toBe(60);
  });

  it("fixed 列不扣除横向滚动量", () => {
    const { calculator } = createCalculator({
      scrollLeft: 40,
      leafColumns: [{ ...COLUMN_A, fixed: "left" }],
    });
    const result = calculator.calculate({
      width: 200,
      height: 300,
      column: { ...COLUMN_A, fixed: "left" },
    });
    expect(result.x).toBe(100);
  });

  it("anchorType=button 时在单元格视口 X 上叠加 buttonRelativeX", () => {
    const { calculator } = createCalculator();
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "button",
      buttonRelativeX: 20,
    });
    expect(result.x).toBe(120);
  });

  it("anchorType=button 但未提供 buttonRelativeX 时退回单元格视口 X", () => {
    const { calculator } = createCalculator();
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "button",
    });
    expect(result.x).toBe(100);
  });

  it("anchorType=header 时累加列宽定位列头（非 fixed 扣滚动量）", () => {
    const columns: Column[] = [COLUMN_A, COLUMN_B, { key: "c", title: "C", width: 90 }];
    const { calculator, layout } = createCalculator({ columns, scrollLeft: 30 });
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "header",
      columnKey: "b",
      column: COLUMN_B,
    });
    expect(layout.getColumns).toHaveBeenCalled();
    // a 宽 100 → 累计 100；命中 b → 100 - 30 = 70
    expect(result.x).toBe(70);
  });

  it("anchorType=header 命中 fixed 列时不扣滚动量", () => {
    const columns: Column[] = [COLUMN_A, { ...COLUMN_B, fixed: "left" }];
    const { calculator } = createCalculator({ columns, scrollLeft: 30 });
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "header",
      columnKey: "b",
      column: { ...COLUMN_B, fixed: "left" },
    });
    expect(result.x).toBe(100);
  });

  it("anchorType=header 时列宽缺省按 100 累加", () => {
    const columns: Column[] = [{ key: "a", title: "A" }, { key: "b", title: "B" }];
    const { calculator } = createCalculator({ columns });
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "header",
      columnKey: "b",
      column: { key: "b", title: "B" },
    });
    expect(result.x).toBe(100);
  });

  it("anchorType=header 未命中列 key 时基准为 0，再被左边界推到 8", () => {
    const { calculator } = createCalculator({ columns: [COLUMN_A] });
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "header",
      columnKey: "missing",
      column: COLUMN_A,
    });
    expect(result.x).toBe(8);
  });

  it("anchorType=header 未提供 column 时同样落到 0 再贴左边界", () => {
    const { calculator } = createCalculator();
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "header",
      columnKey: "a",
    });
    expect(result.x).toBe(8);
  });

  it("单元格完全滚出视口时不做边界收敛，跟随单元格", () => {
    const { calculator } = createCalculator({
      rect: { x: -200, y: 200, width: 120, height: 32 },
    });
    const result = calculator.calculate({ width: 200, height: 300 });
    expect(result.x).toBe(-200);
  });

  it("下拉右溢出时贴右边界", () => {
    const { calculator } = createCalculator({
      rect: { x: 700, y: 200, width: 100, height: 32 },
    });
    const result = calculator.calculate({ width: 200, height: 300 });
    expect(result.x).toBe(592);
  });

  it("下拉左溢出时贴左边界", () => {
    const { calculator } = createCalculator({
      rect: { x: 2, y: 200, width: 100, height: 32 },
    });
    const result = calculator.calculate({ width: 200, height: 300 });
    expect(result.x).toBe(8);
  });

  it("下拉宽于画布时水平居中", () => {
    const { calculator } = createCalculator();
    const result = calculator.calculate({ width: 900, height: 300 });
    expect(result.x).toBe(-50);
  });

  it("column 未声明 width 时按 100 参与可见性判断", () => {
    const { calculator } = createCalculator();
    // 无 width → cellWidth 100 → cellRight=200 → 可见 → x 保持 100
    const result = calculator.calculate({
      width: 200,
      height: 300,
      column: { key: "a", title: "A" },
    });
    expect(result.x).toBe(100);
  });

  it("无 cell 时回退到 columnIndex 指定的列", () => {
    const { calculator, layout } = createCalculator();
    calculator.calculate({ width: 200, height: 300, columnIndex: 2 });
    expect(layout.getCellPosition).toHaveBeenCalledWith(0, 2);
  });

  it("无 cell 且无 columnIndex 时回退到第 0 列第 0 行", () => {
    const { calculator, layout } = createCalculator();
    calculator.calculate({ width: 200, height: 300 });
    expect(layout.getCellPosition).toHaveBeenCalledWith(0, 0);
  });

  it("提供 cell 时按其行列取位置与视口 Y", () => {
    const { calculator, layout } = createCalculator({ leafColumns: [COLUMN_A, COLUMN_B] });
    calculator.calculate({ width: 200, height: 300, cell: { rowIndex: 5, columnIndex: 1 } });
    expect(layout.getCellPosition).toHaveBeenCalledWith(5, 1);
    expect(layout.getCellViewportY).toHaveBeenCalledWith(5, 0);
  });

  it("通过 cell 推导列配置（取 leafColumns）", () => {
    const { calculator } = createCalculator({
      leafColumns: [COLUMN_A, { ...COLUMN_B, fixed: "left" }],
      scrollLeft: 30,
    });
    // 命中 fixed 列 → 不扣滚动量 → x = 100
    const result = calculator.calculate({
      width: 200,
      height: 300,
      cell: { rowIndex: 1, columnIndex: 1 },
    });
    expect(result.x).toBe(100);
  });
});

describe("DropdownPositionCalculator.calculate Y 轴锚点", () => {
  it("anchorType=cell（默认）锚定单元格底边", () => {
    const { calculator } = createCalculator({ viewportY: 100 });
    const result = calculator.calculate({ width: 200, height: 300, anchorType: "cell" });
    // 100 + 32 = 132；y = 132 + 4
    expect(result.anchorViewportY).toBe(132);
    expect(result.cellViewportY).toBe(100);
    expect(result.y).toBe(136);
    expect(result.showAbove).toBe(false);
  });

  it("anchorType=cell-top 锚定单元格顶边", () => {
    const { calculator } = createCalculator({ viewportY: 100 });
    const result = calculator.calculate({ width: 200, height: 300, anchorType: "cell-top" });
    expect(result.anchorViewportY).toBe(100);
    expect(result.y).toBe(104);
  });

  it("anchorType=button 锚定按钮底边", () => {
    const { calculator } = createCalculator({ viewportY: 100 });
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "button",
      buttonY: 6,
      buttonHeight: 20,
    });
    expect(result.anchorViewportY).toBe(126);
  });

  it("anchorType=header 锚定表头高度，cellViewportY 归零", () => {
    const { calculator } = createCalculator({ headerHeight: 48 });
    const result = calculator.calculate({ width: 200, height: 300, anchorType: "header" });
    expect(result.anchorViewportY).toBe(48);
    expect(result.cellViewportY).toBe(0);
    expect(result.y).toBe(52);
  });

  it("anchorType=custom 直接采用 customAnchorY", () => {
    const { calculator } = createCalculator();
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "custom",
      customAnchorY: 250,
    });
    expect(result.anchorViewportY).toBe(250);
    expect(result.cellViewportY).toBe(250);
    expect(result.y).toBe(254);
  });

  it("anchorType 未声明时锚点为 0", () => {
    const { calculator } = createCalculator();
    const result = calculator.calculate({ width: 200, height: 300 });
    expect(result.anchorViewportY).toBe(0);
    expect(result.cellViewportY).toBe(0);
    expect(result.y).toBe(4);
  });

  it("未知 anchorType 走 default 分支", () => {
    const { calculator } = createCalculator();
    const result = calculator.calculate({
      width: 200,
      height: 300,
      anchorType: "nope" as DropdownAnchorType,
    });
    expect(result.anchorViewportY).toBe(0);
    expect(result.y).toBe(4);
  });
});

describe("DropdownPositionCalculator.calculate 空间检测", () => {
  it("下方放得下时不翻转", () => {
    const { calculator } = createCalculator({ viewportY: 100 });
    const result = calculator.calculate({ width: 200, height: 300, anchorType: "cell" });
    expect(result.showAbove).toBe(false);
    expect(result.y).toBe(136);
  });

  it("下方放不下但上方放得下时翻转到上方", () => {
    const { calculator } = createCalculator({ viewportY: 500 });
    const result = calculator.calculate({ width: 200, height: 100, anchorType: "cell" });
    // anchorY = 500 + 32 = 532 → y=536 → 636 > 600 → aboveY = 532-4-100 = 428
    expect(result.showAbove).toBe(true);
    expect(result.y).toBe(428);
  });

  it("上下都放不下时保持向下展开（不越界翻转）", () => {
    const { calculator } = createCalculator({ viewportY: 100 });
    const result = calculator.calculate({ width: 200, height: 500, anchorType: "cell" });
    // y=136 → 636 > 600 → aboveY = 132-4-500 = -372 < 0 → 保持
    expect(result.showAbove).toBe(false);
    expect(result.y).toBe(136);
  });

  it("gap 可自定义", () => {
    const { calculator } = createCalculator({ viewportY: 100 });
    const result = calculator.calculate({ width: 200, height: 300, anchorType: "cell", gap: 20 });
    expect(result.y).toBe(152);
  });
});

describe("DropdownPositionCalculator.updateY 滚动重算", () => {
  it("当前向上且空间充足时保持向上", () => {
    const { calculator } = createCalculator({ viewportY: 468 });
    const result = calculator.updateY(
      { cell: { rowIndex: 0, columnIndex: 0 }, anchorType: "cell" },
      true,
      100,
    );
    // anchorY = 468 + 32 = 500 → y = 500 - 4 - 100 = 396
    expect(result.y).toBe(396);
    expect(result.showAbove).toBe(true);
    expect(result.cellViewportY).toBe(468);
  });

  it("当前向上但顶部越界、下方够用时翻转为向下", () => {
    const { calculator } = createCalculator({ viewportY: 18 });
    const result = calculator.updateY(
      { cell: { rowIndex: 0, columnIndex: 0 }, anchorType: "cell" },
      true,
      100,
    );
    // anchorY = 50 → y = 50-4-100 = -54 < 0 → 下方 50+4+100=154 <= 600 → y=54, showAbove=false
    expect(result.y).toBe(54);
    expect(result.showAbove).toBe(false);
  });

  it("当前向上但顶部越界、下方也不够时维持原状", () => {
    const { calculator } = createCalculator({ viewportY: 18 });
    const result = calculator.updateY(
      { cell: { rowIndex: 0, columnIndex: 0 }, anchorType: "cell" },
      true,
      700,
    );
    // anchorY = 50 → y = -654 < 0；下方 50+4+700=754 > 600 → 不翻转
    expect(result.y).toBe(-654);
    expect(result.showAbove).toBe(true);
  });

  it("当前向下且空间充足时保持向下", () => {
    const { calculator } = createCalculator({ viewportY: 68 });
    const result = calculator.updateY(
      { cell: { rowIndex: 0, columnIndex: 0 }, anchorType: "cell" },
      false,
      300,
    );
    // anchorY = 100 → y = 104 → 404 <= 600
    expect(result.y).toBe(104);
    expect(result.showAbove).toBe(false);
  });

  it("当前向下但底部越界、上方够用时翻转为向上", () => {
    const { calculator } = createCalculator({ viewportY: 468 });
    const result = calculator.updateY(
      { cell: { rowIndex: 0, columnIndex: 0 }, anchorType: "cell" },
      false,
      200,
    );
    // anchorY = 500 → y = 504 → 704 > 600 → aboveY = 296 >= 0
    expect(result.y).toBe(296);
    expect(result.showAbove).toBe(true);
  });

  it("当前向下但底部越界、上方也不够时维持向下", () => {
    const { calculator } = createCalculator({ viewportY: 68 });
    const result = calculator.updateY(
      { cell: { rowIndex: 0, columnIndex: 0 }, anchorType: "cell" },
      false,
      600,
    );
    // anchorY = 100 → y = 104 → 704 > 600 → aboveY = 100-4-600 = -504 < 0
    expect(result.y).toBe(104);
    expect(result.showAbove).toBe(false);
  });

  it("gap 参数可覆盖默认值", () => {
    const { calculator } = createCalculator({ viewportY: 68 });
    const result = calculator.updateY(
      { cell: { rowIndex: 0, columnIndex: 0 }, anchorType: "cell" },
      false,
      300,
      10,
    );
    expect(result.y).toBe(110);
  });

  it("无 cell 时回退到第 0 行并按 scrollTop 计算视口 Y", () => {
    const { calculator, layout } = createCalculator({ scrollTop: 120 });
    const result = calculator.updateY({ columnIndex: 1, anchorType: "cell" }, false, 100);
    expect(layout.getCellViewportY).toHaveBeenCalledWith(0, 120);
    expect(result.cellViewportY).toBe(100);
  });
});

describe("DropdownPositionCalculator.updateX 横向滚动重算", () => {
  it("等价于 calculate 的 X 计算（含右边界收敛）", () => {
    const { calculator } = createCalculator({
      rect: { x: 700, y: 200, width: 100, height: 32 },
    });
    expect(calculator.updateX({ cell: { rowIndex: 0, columnIndex: 0 } }, 200)).toBe(592);
  });

  it("跟随单元格滚出视口", () => {
    const { calculator } = createCalculator({
      rect: { x: -200, y: 200, width: 120, height: 32 },
    });
    expect(calculator.updateX({ cell: { rowIndex: 0, columnIndex: 0 } }, 200)).toBe(-200);
  });
});

describe("DropdownPositionCalculator.isCellInViewport", () => {
  it("完整落在表头下方与画布底部之间时返回 true", () => {
    const { calculator, layout } = createCalculator({ viewportY: 100 });
    expect(calculator.isCellInViewport({ cell: { rowIndex: 0, columnIndex: 0 } })).toBe(true);
    expect(layout.getLayoutInfo).toHaveBeenCalled();
  });

  it("单元格顶部被表头遮挡时返回 false", () => {
    const { calculator } = createCalculator({ viewportY: 20 });
    expect(calculator.isCellInViewport({ cell: { rowIndex: 0, columnIndex: 0 } })).toBe(false);
  });

  it("单元格底部超出画布时返回 false", () => {
    const { calculator } = createCalculator({ viewportY: 590 });
    expect(calculator.isCellInViewport({ cell: { rowIndex: 0, columnIndex: 0 } })).toBe(false);
  });
});
