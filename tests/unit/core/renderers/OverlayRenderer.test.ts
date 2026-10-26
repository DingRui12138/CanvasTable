import { OverlayRenderer } from "@/core/renderers/OverlayRenderer";
import { LayoutManager } from "@/core/LayoutManager";
import { zhCN, enUS } from "@/locale";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, textsOf, callsOf, methodNamesOf } from "../../helpers/canvasInspect";
import type {
  ColorPickerDropdownState,
  ContextMenuState,
  DateDropdownState,
  HeaderContextMenuState,
  LayoutInfo,
  ScrollbarState,
  TableTheme,
  TagItem,
  TooltipState,
} from "@/types";

const createCtx = createTrackedContext;
const texts = textsOf;

/**
 * OverlayRenderer 只通过 getLayoutInfo() 读取布局，因此用桩对象即可精确控制
 * headerHeight / totalHeight / totalWidth，避免依赖 LayoutManager 的内部算法。
 */
function stubLayout(info: Partial<LayoutInfo> = {}): LayoutManager {
  const full: LayoutInfo = {
    totalWidth: 1000,
    totalHeight: 1000,
    viewportWidth: 800,
    viewportHeight: 600,
    headerHeight: 36,
    rowHeight: 32,
    columnWidths: [],
    rowOffsets: [],
    columnOffsets: [],
    ...info,
  };
  return { getLayoutInfo: () => full } as unknown as LayoutManager;
}

/** 可控尺寸的 canvas（OverlayRenderer 用 canvas.width / dpr 得到视口尺寸） */
function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = createMockCanvas();
  Object.defineProperty(canvas, "width", { value: width, writable: true, configurable: true });
  Object.defineProperty(canvas, "height", { value: height, writable: true, configurable: true });
  return canvas;
}

function setup(
  options: {
    dpr?: number;
    layout?: Partial<LayoutInfo>;
    canvasSize?: [number, number];
    theme?: TableTheme;
  } = {},
) {
  const { ctx, sets } = createCtx();
  const theme = options.theme ?? createMockTheme();
  const canvas = makeCanvas(...(options.canvasSize ?? [800, 600]));
  const layoutManager = stubLayout(options.layout);
  const renderer = new OverlayRenderer(canvas, ctx, theme, layoutManager, options.dpr ?? 1, zhCN);
  return { renderer, ctx, sets, theme, canvas, layoutManager };
}

const emptyScrollbarState: ScrollbarState = {
  verticalHovered: false,
  horizontalHovered: false,
  verticalDragging: false,
  horizontalDragging: false,
  dragStartY: 0,
  dragStartScrollTop: 0,
  dragStartX: 0,
  dragStartScrollLeft: 0,
};

function scrollbarState(overrides: Partial<ScrollbarState> = {}): ScrollbarState {
  return { ...emptyScrollbarState, ...overrides };
}

function colorDropdown(overrides: Partial<ColorPickerDropdownState> = {}): ColorPickerDropdownState {
  return {
    cell: { rowIndex: 0, columnIndex: 0 },
    config: { value: "#1890ff" },
    x: 100,
    y: 100,
    width: 236,
    hoveredColor: null,
    ...overrides,
  };
}

function tooltip(overrides: Partial<TooltipState> = {}): TooltipState {
  return {
    cell: { rowIndex: 0, columnIndex: 0 },
    x: 100,
    y: 300,
    content: { type: "text", text: "Hi" },
    ...overrides,
  };
}

function contextMenu(overrides: Partial<ContextMenuState> = {}): ContextMenuState {
  return {
    x: 50,
    y: 60,
    row: { id: "r1", data: {} },
    hoveredIndex: -1,
    items: [
      { key: "a", text: "Item A" },
      { key: "b", text: "Item B", danger: true },
    ],
    ...overrides,
  };
}

function headerContextMenu(overrides: Partial<HeaderContextMenuState> = {}): HeaderContextMenuState {
  return {
    x: 30,
    y: 40,
    columnKey: "name",
    columnIndex: 0,
    hoveredIndex: -1,
    ...overrides,
  };
}

function dateDropdown(overrides: Partial<DateDropdownState> = {}): DateDropdownState {
  return {
    cell: { rowIndex: 0, columnIndex: 0 },
    config: { value: "" },
    x: 100,
    y: 100,
    width: 280,
    currentYear: 2000,
    currentMonth: 0,
    selectedDate: null,
    hoveredDate: null,
    ...overrides,
  };
}

describe("OverlayRenderer", () => {
  describe("构造与 setter", () => {
    it("默认使用中文 locale", () => {
      const { renderer, ctx } = setup();

      renderer.renderHeaderContextMenu(headerContextMenu());

      expect(texts(ctx)).toEqual([zhCN.contextMenu.hideColumn]);
    });

    it("未传 locale 时默认使用 zhCN", () => {
      const { ctx } = createCtx();
      const theme = createMockTheme();
      const canvas = makeCanvas(800, 600);
      const renderer = new OverlayRenderer(canvas, ctx, theme, stubLayout(), 1);

      renderer.renderHeaderContextMenu(headerContextMenu());

      expect(texts(ctx)).toEqual([zhCN.contextMenu.hideColumn]);
    });

    it("setLocale 可以切换文案", () => {
      const { renderer, ctx } = setup();
      renderer.setLocale(enUS);

      renderer.renderHeaderContextMenu(headerContextMenu());

      expect(texts(ctx)).toEqual([enUS.contextMenu.hideColumn]);
    });

    it("setCanvas 会同时切换绘制目标与视口尺寸来源", () => {
      const { renderer, ctx } = setup();
      const nextCtx = createCtx();
      const nextCanvas = makeCanvas(200, 200);

      renderer.setCanvas(nextCanvas, nextCtx.ctx);
      renderer.renderScrollbars(0, 0, 0, 100, scrollbarState());

      expect(ctx.calls).toHaveLength(0);
      expect(nextCtx.ctx.calls.length).toBeGreaterThan(0);
      // 视口宽度变成 200，竖直滚动条 thumbX = 200 - 10 = 190
      expect(callsOf(nextCtx.ctx, "roundRect")[0]![0]).toBe(190);
    });

    it("setTheme 会影响绘制颜色", () => {
      const { renderer, ctx, sets, theme } = setup();

      theme.colors.dropdown.background = "#123456";
      renderer.setTheme(theme);
      renderer.renderColorDropdown(colorDropdown({ config: { value: "#000" } }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#123456" });
    });

    it("setDpr 会影响视口尺寸换算", () => {
      const { renderer, ctx } = setup();

      renderer.setDpr(2);
      // canvas 800x600，dpr=2 → 视口 400x300 → thumbX = 400 - 10 = 390
      renderer.renderScrollbars(0, 0, 0, 100, scrollbarState());

      expect(callsOf(ctx, "roundRect")[0]![0]).toBe(390);
    });

    it("未设置水印配置时 renderWatermark 不做任何绘制", () => {
      const { renderer, ctx } = setup();

      renderer.renderWatermark();

      expect(ctx.calls).toHaveLength(0);
    });
  });

  describe("renderColorDropdown", () => {
    it("使用自定义预设颜色，并按 8 列网格绘制", () => {
      const { renderer, ctx } = setup();
      const colors = ["#111111", "#222222", "#333333"];

      renderer.renderColorDropdown(colorDropdown({ config: { value: "#111111", presetColors: colors } }));

      // rows = ceil(3/8) = 1 → height = 8*2 + 1*(24+4) - 4 = 40
      expect(callsOf(ctx, "roundRect")[0]).toEqual([100, 100, 236, 40, 6]);
      // 三个色块
      const rects = callsOf(ctx, "fillRect");
      expect(rects).toHaveLength(3);
      expect(rects[0]).toEqual([108, 108, 24, 24]);
      expect(rects[1]).toEqual([136, 108, 24, 24]);
      expect(rects[2]).toEqual([164, 108, 24, 24]);
    });

    it("未传 presetColors 时回退到 28 个默认颜色（4 行）", () => {
      const { renderer, ctx } = setup();

      renderer.renderColorDropdown(colorDropdown());

      // rows = ceil(28/8) = 4 → height = 16 + 4*28 - 4 = 124
      expect(callsOf(ctx, "roundRect")[0]).toEqual([100, 100, 236, 124, 6]);
      expect(callsOf(ctx, "fillRect")).toHaveLength(28);
    });

    it("hoveredColor 的色块使用高亮描边并外扩 1px", () => {
      const { renderer, ctx, sets } = setup();
      const colors = ["#111111", "#222222"];

      renderer.renderColorDropdown(
        colorDropdown({ config: { value: "#111111", presetColors: colors }, hoveredColor: "#222222" }),
      );

      const strokes = callsOf(ctx, "strokeRect");
      // 第 1 个（索引 1）是 hovered → 外扩 1px，尺寸 +2
      expect(strokes[1]).toEqual([136 - 1, 108 - 1, 26, 26]);
      expect(sets).toContainEqual({ prop: "strokeStyle", value: "#1890ff" });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 2 });
    });

    it("非 hovered 色块使用灰色 1px 描边", () => {
      const { renderer, ctx, sets } = setup();

      renderer.renderColorDropdown(
        colorDropdown({ config: { value: "#111111", presetColors: ["#111111"] }, hoveredColor: null }),
      );

      expect(callsOf(ctx, "strokeRect")[0]).toEqual([108, 108, 24, 24]);
      expect(sets).toContainEqual({ prop: "strokeStyle", value: "#d9d9d9" });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
    });

    it("第 9 个颜色换行到第二行", () => {
      const { renderer, ctx } = setup();
      const colors = Array.from({ length: 9 }, (_, i) => `#00000${i}`);

      renderer.renderColorDropdown(colorDropdown({ config: { value: "#000000", presetColors: colors } }));

      // rows = ceil(9/8) = 2 → height = 16 + 2*28 - 4 = 68
      expect(callsOf(ctx, "roundRect")[0]).toEqual([100, 100, 236, 68, 6]);
      // 第 9 个（索引 8）col=0 row=1
      expect(callsOf(ctx, "fillRect")[8]).toEqual([108, 136, 24, 24]);
    });

    it("使用主题的下拉框边框色描边", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderColorDropdown(colorDropdown());

      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.dropdown.border });
    });
  });

  describe("renderTooltip - text 模式", () => {
    it("短文本只有一行，高度为 padding*2 + lineHeight", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ content: { type: "text", text: "Hi" } }));

      // 宽度 clamp 到最小值 140，tooltipX = 100 + (300-140)/2 = 180
      // 高度 = 16 + 1*20 = 36 → tooltipY = 300 - 36 - 8 = 256
      expect(callsOf(ctx, "roundRect")[0]).toEqual([180, 256, 140, 36, 6]);
      expect(texts(ctx)).toEqual(["Hi"]);
    });

    it("长文本按可用宽度折行", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ content: { type: "text", text: "a".repeat(45) } }));

      // contentWidth = min(45*7+16, 300) = 300 → maxWidth = 300
      // 每行容量 floor((300-16)/7) = 40 字符 → 45 字符折成 2 行
      expect(texts(ctx)).toEqual(["a".repeat(40), "a".repeat(5)]);
      // 高度 = 16 + 2*20 = 56
      expect(callsOf(ctx, "roundRect")[0]![3]).toBe(56);
    });

    it("tooltip 超出视口左边界时钳制到 4", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ x: -500, content: { type: "text", text: "Hi" } }));

      expect(callsOf(ctx, "roundRect")[0]![0]).toBe(4);
    });

    it("tooltip 超出视口右边界时钳制到 viewportWidth - width - 4", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ x: 700, content: { type: "text", text: "Hi" } }));

      // 800 - 140 - 4 = 656
      expect(callsOf(ctx, "roundRect")[0]![0]).toBe(656);
    });

    it("cellWidth 决定可用宽度，窄单元格会让内容折行", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ width: 60, content: { type: "text", text: "abcdefghij" } }));

      // availableWidth = 60 → maxWidth = max(140, min(51, 60)) = 140
      // 但 tooltipWidth = max(140, min(51, 60)) = 140
      expect(callsOf(ctx, "roundRect")[0]![2]).toBe(140);
      expect(texts(ctx).length).toBeGreaterThan(0);
    });

    it("绘制面板时在 save/restore 之间应用主题阴影", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderTooltip(tooltip());

      expect(sets).toContainEqual({ prop: "shadowColor", value: theme.colors.shadow.color });
      expect(sets).toContainEqual({ prop: "shadowBlur", value: theme.colors.shadow.blur });
      expect(sets).toContainEqual({ prop: "shadowOffsetX", value: theme.colors.shadow.offsetX });
      expect(sets).toContainEqual({ prop: "shadowOffsetY", value: theme.colors.shadow.offsetY });
      // 阴影只赋值一次，并由 save/restore 成对包裹，避免污染后续绘制
      expect(sets.filter((s) => s.prop === "shadowColor")).toHaveLength(1);
      const names = methodNamesOf(ctx);
      expect(names.filter((n) => n === "save")).toHaveLength(1);
      expect(names.filter((n) => n === "restore")).toHaveLength(1);
    });

    it("文本颜色使用主题 tooltip.text", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderTooltip(tooltip());

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.tooltip.text });
    });

    it("空文本不产生任何文本行，高度仅剩上下 padding", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ content: { type: "text", text: "" } }));

      expect(callsOf(ctx, "roundRect")[0]![3]).toBe(16);
      expect(texts(ctx)).toEqual([]);
    });

    it("未知 content 类型时只绘制空面板", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(
        tooltip({ content: { type: "unknown" } as unknown as TooltipState["content"] }),
      );

      // 既不是 text 也不是 tags → 高度 = padding*2 = 16
      expect(callsOf(ctx, "roundRect")[0]).toEqual([180, 276, 140, 16, 6]);
      expect(texts(ctx)).toEqual([]);
    });
  });

  describe("renderTooltip - tags 模式", () => {
    const tags: TagItem[] = [{ text: "A" }, { text: "B" }];

    it("同一行的标签依次排列并绘制背景", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ width: 200, content: { type: "tags", tags } }));

      // tagWidth = 7 + 4*2 = 15；两个标签不换行
      // 高度 = 16 + 1*(13+8) = 37
      expect(callsOf(ctx, "roundRect")[0]![3]).toBe(37);
      // 面板 1 次 + 标签 2 次
      expect(callsOf(ctx, "roundRect")).toHaveLength(3);
      // tooltipX = 100 + (200-140)/2 = 130；tooltipY = 300 - 37 - 8 = 255
      expect(callsOf(ctx, "roundRect")[1]).toEqual([138, 263, 15, 21, 4]);
      expect(callsOf(ctx, "roundRect")[2]).toEqual([157, 263, 15, 21, 4]);
      expect(texts(ctx)).toEqual(["A", "B"]);
    });

    it("可用宽度不足时标签换行并增加高度", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ width: 40, content: { type: "tags", tags } }));

      // 两个标签各占一行 → 高度 = 16 + 2*21 + 1*4 = 62
      expect(callsOf(ctx, "roundRect")[0]![3]).toBe(62);
      expect(callsOf(ctx, "roundRect")).toHaveLength(3);
      // 两行的 tagY 分别为 tooltipY+8 和 tooltipY+8+25
      const rects = callsOf(ctx, "roundRect");
      expect(Number(rects[2]![1]) - Number(rects[1]![1])).toBe(25);
    });

    it("标签使用自定义 bgColor / color", () => {
      const { renderer, ctx, sets } = setup();

      renderer.renderTooltip(
        tooltip({
          width: 200,
          content: { type: "tags", tags: [{ text: "A", bgColor: "#eeeeee", color: "#ff0000" }] },
        }),
      );

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#eeeeee" });
      expect(sets).toContainEqual({ prop: "fillStyle", value: "#ff0000" });
    });

    it("标签未指定颜色时回退到主题默认值", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderTooltip(tooltip({ width: 200, content: { type: "tags", tags } }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.tagColors.default });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
    });

    it("空标签数组只绘制面板", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ width: 200, content: { type: "tags", tags: [] } }));

      expect(callsOf(ctx, "roundRect")).toHaveLength(1);
      expect(texts(ctx)).toEqual([]);
    });

    it("首个标签就超出可用宽度时不会产生空行", () => {
      const { renderer, ctx } = setup();

      renderer.renderTooltip(tooltip({ width: 30, content: { type: "tags", tags: [{ text: "A" }] } }));

      // 面板 + 1 个标签，换行时 currentTagLine 为空所以不会 push 空数组
      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
      expect(texts(ctx)).toEqual(["A"]);
    });

    it("主题缺少默认标签色/文字色时回退到内置兜底色", () => {
      const theme = createMockTheme();
      // 模拟主题只提供部分颜色
      (theme.colors.tagColors as { default?: string }).default = "";
      (theme.colors as unknown as { cellText?: string }).cellText = undefined;
      const { renderer, ctx, sets } = setup({ theme });

      renderer.renderTooltip(tooltip({ width: 200, content: { type: "tags", tags: [{ text: "A" }] } }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#f0f0f0" });
      expect(sets).toContainEqual({ prop: "fillStyle", value: "#333" });
      expect(texts(ctx)).toEqual(["A"]);
    });
  });

  describe("renderScrollbars", () => {
    it("maxScrollTop 为 0 时不绘制竖直滚动条", () => {
      const { renderer, ctx } = setup();

      renderer.renderScrollbars(0, 0, 0, 0, scrollbarState());

      expect(ctx.calls).toHaveLength(0);
    });

    it("竖直滚动条位置与最小高度钳制", () => {
      const { renderer, ctx } = setup({ layout: { totalHeight: 100000 } });

      renderer.renderScrollbars(0, 0, 0, 1000, scrollbarState());

      // thumbHeight = max(30, (600/100000)*564) = 30；thumbX = 800-10 = 790
      expect(callsOf(ctx, "roundRect")[0]).toEqual([790, 36, 8, 30, 4]);
    });

    it("竖直滚动条随 scrollTop 移动", () => {
      const { renderer, ctx } = setup({ layout: { totalHeight: 100000 } });

      renderer.renderScrollbars(0, 500, 0, 1000, scrollbarState());

      // trackHeight = 564, thumbHeight = 30 → thumbY = 36 + 0.5*(564-30) = 303
      expect(callsOf(ctx, "roundRect")[0]![1]).toBe(303);
    });

    it("水平滚动条位置与最小宽度钳制", () => {
      const { renderer, ctx } = setup({ layout: { totalWidth: 100000 } });

      renderer.renderScrollbars(1000, 0, 1000, 0, scrollbarState());

      // thumbWidth = 30；thumbX = 1*(800-30) = 770；thumbY = 600-10 = 590
      expect(callsOf(ctx, "roundRect")[0]).toEqual([770, 590, 30, 8, 4]);
    });

    it("同时存在两个方向时绘制两条滚动条", () => {
      const { renderer, ctx } = setup({ layout: { totalHeight: 100000, totalWidth: 100000 } });

      renderer.renderScrollbars(0, 0, 1000, 1000, scrollbarState());

      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
    });

    it.each([
      ["拖拽中", scrollbarState({ verticalDragging: true }), "thumbActive"],
      ["悬停中", scrollbarState({ verticalHovered: true }), "thumbHover"],
      ["默认", scrollbarState(), "thumb"],
    ])("竖直滚动条在%s使用对应颜色", (_label, state, colorKey) => {
      const { renderer, ctx, sets, theme } = setup({ layout: { totalHeight: 100000 } });

      renderer.renderScrollbars(0, 0, 0, 1000, state as ScrollbarState);

      expect(sets).toContainEqual({
        prop: "fillStyle",
        value: theme.colors.scrollbar[colorKey as keyof typeof theme.colors.scrollbar],
      });
    });

    it.each([
      ["拖拽中", scrollbarState({ horizontalDragging: true }), "thumbActive"],
      ["悬停中", scrollbarState({ horizontalHovered: true }), "thumbHover"],
      ["默认", scrollbarState(), "thumb"],
    ])("水平滚动条在%s使用对应颜色", (_label, state, colorKey) => {
      const { renderer, ctx, sets, theme } = setup({ layout: { totalWidth: 100000 } });

      renderer.renderScrollbars(0, 0, 1000, 0, state as ScrollbarState);

      expect(sets).toContainEqual({
        prop: "fillStyle",
        value: theme.colors.scrollbar[colorKey as keyof typeof theme.colors.scrollbar],
      });
    });

    it("竖直拖拽优先级高于悬停", () => {
      const { renderer, ctx, sets, theme } = setup({ layout: { totalHeight: 100000 } });

      renderer.renderScrollbars(0, 0, 0, 1000, scrollbarState({ verticalDragging: true, verticalHovered: true }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.scrollbar.thumbActive });
      expect(sets).not.toContainEqual({ prop: "fillStyle", value: theme.colors.scrollbar.thumbHover });
    });

    it("绘制后恢复 globalAlpha", () => {
      const { renderer, ctx, sets, theme } = setup({ layout: { totalHeight: 100000 } });

      renderer.renderScrollbars(0, 0, 0, 1000, scrollbarState());

      expect(sets).toContainEqual({ prop: "globalAlpha", value: theme.colors.scrollbar.opacity });
      // 末尾必须还原成初始值 1
      expect(sets[sets.length - 1]).toEqual({ prop: "globalAlpha", value: 1 });
    });

    it("与真实 LayoutManager 协作时能正确计算滚动条", () => {
      const { ctx } = createCtx();
      const theme = createMockTheme();
      const canvas = makeCanvas(800, 600);
      const layoutManager = new LayoutManager(undefined, theme);
      layoutManager.setViewportSize(800, 600);
      layoutManager.calculateLayout(
        [
          { key: "a", title: "A", width: 100, type: "text" },
          { key: "b", title: "B", width: 100, type: "text" },
        ],
        Array.from({ length: 100 }, (_, i) => ({ id: `r${i}`, data: { a: i, b: i } })),
      );
      const renderer = new OverlayRenderer(canvas, ctx, theme, layoutManager, 1, zhCN);

      renderer.renderScrollbars(0, 0, 0, 1000, scrollbarState());

      const info = layoutManager.getLayoutInfo();
      const trackHeight = 600 - info.headerHeight;
      const expectedThumbHeight = Math.max(30, (600 / info.totalHeight) * trackHeight);
      expect(callsOf(ctx, "roundRect")[0]).toEqual([790, info.headerHeight, 8, expectedThumbHeight, 4]);
    });
  });

  describe("getScrollbarBounds", () => {
    it("两个方向都无滚动时返回 null", () => {
      const { renderer } = setup();

      const bounds = renderer.getScrollbarBounds(0, 0, 0, 0);

      expect(bounds).toEqual({ vertical: null, horizontal: null });
    });

    it("返回竖直滚动条边界（宽度为 scrollbarWidth - 2）", () => {
      const { renderer } = setup({ layout: { totalHeight: 100000 } });

      const bounds = renderer.getScrollbarBounds(0, 500, 0, 1000);

      expect(bounds.vertical).toEqual({ x: 790, y: 303, width: 8, height: 30 });
      expect(bounds.horizontal).toBeNull();
    });

    it("返回水平滚动条边界", () => {
      const { renderer } = setup({ layout: { totalWidth: 100000 } });

      const bounds = renderer.getScrollbarBounds(1000, 0, 1000, 0);

      expect(bounds.horizontal).toEqual({ x: 770, y: 590, width: 30, height: 8 });
      expect(bounds.vertical).toBeNull();
    });

    it("与 renderScrollbars 使用同一套几何计算", () => {
      const { renderer, ctx } = setup({ layout: { totalHeight: 100000, totalWidth: 100000 } });

      const bounds = renderer.getScrollbarBounds(500, 500, 1000, 1000);
      renderer.renderScrollbars(500, 500, 1000, 1000, scrollbarState());

      const rects = callsOf(ctx, "roundRect");
      expect(rects[0]).toEqual([bounds.vertical!.x, bounds.vertical!.y, bounds.vertical!.width, bounds.vertical!.height, 4]);
      expect(rects[1]).toEqual([bounds.horizontal!.x, bounds.horizontal!.y, bounds.horizontal!.width, bounds.horizontal!.height, 4]);
    });
  });

  describe("renderWatermark", () => {
    it("enabled 为 false 时不绘制", () => {
      const { renderer, ctx } = setup();

      renderer.setWatermarkConfig({ enabled: false, content: "Confidential" });
      renderer.renderWatermark();

      expect(ctx.calls).toHaveLength(0);
    });

    it("content 为空字符串时不绘制", () => {
      const { renderer, ctx } = setup();

      renderer.setWatermarkConfig({ content: "" });
      renderer.renderWatermark();

      expect(ctx.calls).toHaveLength(0);
    });

    it("setWatermarkConfig(null) 可以关闭水印", () => {
      const { renderer, ctx } = setup();

      renderer.setWatermarkConfig({ content: "X" });
      renderer.setWatermarkConfig(null);
      renderer.renderWatermark();

      expect(ctx.calls).toHaveLength(0);
    });

    it("使用默认参数平铺水印", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.setWatermarkConfig({ content: "Watermark" });
      renderer.renderWatermark();

      // textWidth = 9*7 = 63；cellWidth = 163；cellHeight = 16+100 = 116
      // cols = ceil(800/163)+2 = 7；rows = ceil(600/116)+2 = 8
      // row ∈ [-1, 8] (10) × col ∈ [-1, 7] (9) = 90
      expect(callsOf(ctx, "fillText")).toHaveLength(90);
      expect(callsOf(ctx, "translate")).toHaveLength(90);
      expect(callsOf(ctx, "rotate")).toHaveLength(90);
      expect(sets).toContainEqual({ prop: "globalAlpha", value: theme.colors.watermark.opacity });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.watermark.color });
      expect(sets).toContainEqual({ prop: "textAlign", value: "center" });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
    });

    it("自定义参数会覆盖主题默认值", () => {
      const { renderer, ctx, sets } = setup();

      renderer.setWatermarkConfig({
        content: "AB",
        fontSize: 20,
        fontFamily: "serif",
        color: "#ff0000",
        opacity: 0.5,
        rotation: 0,
        gapX: 100,
        gapY: 100,
      });
      renderer.renderWatermark();

      expect(sets).toContainEqual({ prop: "globalAlpha", value: 0.5 });
      expect(sets).toContainEqual({ prop: "fillStyle", value: "#ff0000" });
      expect(sets).toContainEqual({ prop: "font", value: "20px serif" });
      // cellWidth = 14+100 = 114；cellHeight = 20+100 = 120
      // cols = ceil(800/114)+2 = 10 → col ∈ [-1,10] (12)
      // rows = ceil(600/120)+2 = 7 → row ∈ [-1,7] (9) → 12*9 = 108
      expect(callsOf(ctx, "fillText")).toHaveLength(108);
    });

    it("默认 content 为 Watermark", () => {
      const { renderer, ctx } = setup();

      renderer.setWatermarkConfig({});
      renderer.renderWatermark();

      expect(texts(ctx)[0]).toBe("Watermark");
    });

    it("奇数行会水平错开半格", () => {
      const { renderer, ctx } = setup();

      renderer.setWatermarkConfig({ content: "A", fontSize: 16, gapX: 100, gapY: 100 });
      renderer.renderWatermark();

      const translates = callsOf(ctx, "translate");
      // cellWidth = 7+100 = 107 → 奇数行（row=-1）偏移 53.5
      expect(translates[0]).toEqual([-107 + 53.5, -116]);
      // 每行 12 列（col ∈ [-1,10]），index 12 即 row=0 / col=-1，无偏移
      expect(translates[12]).toEqual([-107, 0]);
    });
  });

  describe("renderContextMenu", () => {
    it("绘制菜单面板与全部菜单项", () => {
      const { renderer, ctx } = setup();

      renderer.renderContextMenu(contextMenu());

      // drawMenuPanel：fill 用 roundRect + stroke 用 roundRect
      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
      expect(callsOf(ctx, "roundRect")[0]).toEqual([50, 60, 140, 64, 6]);
      expect(callsOf(ctx, "stroke")).toHaveLength(1);
      expect(texts(ctx)).toEqual(["Item A", "Item B"]);
      // 文本坐标 x + 12，itemY + 16
      expect(callsOf(ctx, "fillText")[0]).toEqual(["Item A", 62, 76, undefined]);
      expect(callsOf(ctx, "fillText")[1]).toEqual(["Item B", 62, 108, undefined]);
    });

    it("hoveredIndex 对应项绘制悬停背景", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderContextMenu(contextMenu({ hoveredIndex: 1 }));

      expect(callsOf(ctx, "fillRect")).toEqual([[50, 92, 140, 32]]);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.dropdown.hoverBg });
    });

    it("hoveredIndex 为 -1 时不绘制悬停背景", () => {
      const { renderer, ctx } = setup();

      renderer.renderContextMenu(contextMenu({ hoveredIndex: -1 }));

      expect(callsOf(ctx, "fillRect")).toHaveLength(0);
    });

    it("danger 项使用红色文本", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderContextMenu(contextMenu());

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#f56c6c" });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.dropdown.text });
    });

    it("菜单面板应用并重置阴影", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderContextMenu(contextMenu());

      expect(sets).toContainEqual({ prop: "shadowColor", value: theme.colors.shadow.color });
      expect(sets).toContainEqual({ prop: "shadowColor", value: "transparent" });
    });

    it("空菜单项列表只绘制面板", () => {
      const { renderer, ctx } = setup();

      renderer.renderContextMenu(contextMenu({ items: [] }));

      expect(texts(ctx)).toEqual([]);
      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
    });
  });

  describe("renderHeaderContextMenu", () => {
    it("绘制固定的「隐藏列」菜单项", () => {
      const { renderer, ctx } = setup();

      renderer.renderHeaderContextMenu(headerContextMenu());

      expect(callsOf(ctx, "roundRect")[0]).toEqual([30, 40, 120, 32, 6]);
      expect(texts(ctx)).toEqual([zhCN.contextMenu.hideColumn]);
      expect(callsOf(ctx, "fillText")[0]).toEqual([zhCN.contextMenu.hideColumn, 42, 56, undefined]);
    });

    it("hoveredIndex 为 0 时绘制悬停背景", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderHeaderContextMenu(headerContextMenu({ hoveredIndex: 0 }));

      expect(callsOf(ctx, "fillRect")).toEqual([[30, 40, 120, 32]]);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.dropdown.hoverBg });
    });

    it("hoveredIndex 不为 0 时不绘制悬停背景", () => {
      const { renderer, ctx } = setup();

      renderer.renderHeaderContextMenu(headerContextMenu({ hoveredIndex: 1 }));

      expect(callsOf(ctx, "fillRect")).toHaveLength(0);
    });
  });

  describe("renderDateDropdown", () => {
    it("绘制月份标题、星期表头与当月全部日期", () => {
      const { renderer, ctx } = setup();

      renderer.renderDateDropdown(dateDropdown());

      // dropdownHeight = 40 + 28 + 6*28 + 16 = 252
      expect(callsOf(ctx, "roundRect")[0]).toEqual([100, 100, 280, 252, 6]);
      // 2000 年 1 月 → 「2000年 1月」
      expect(texts(ctx)[0]).toBe("2000年 1月");
      // 7 个星期表头
      expect(texts(ctx).slice(1, 8)).toEqual(zhCN.calendar.weekdays);
      // 31 天
      const days = texts(ctx).slice(8);
      expect(days).toHaveLength(31);
      expect(days[0]).toBe("1");
      expect(days[30]).toBe("31");
    });

    it("月份超出 locale 数组时回退为数字", () => {
      const { renderer, ctx } = setup();

      renderer.renderDateDropdown(dateDropdown({ currentMonth: 99 }));

      // 月份名本身已含「月」后缀，越界时回退为纯数字
      expect(texts(ctx)[0]).toBe("2000年 100");
    });

    it("使用加粗字体绘制标题并居中", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderDateDropdown(dateDropdown());

      expect(sets).toContainEqual({
        prop: "font",
        value: `bold ${theme.font.size}px ${theme.font.family}`,
      });
      expect(sets).toContainEqual({ prop: "textAlign", value: "center" });
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(100 + 280 / 2);
    });

    it("左右箭头使用占位符颜色", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderDateDropdown(dateDropdown());

      // 每个箭头 3 个点 + closePath + fill
      expect(callsOf(ctx, "moveTo")).toHaveLength(2);
      expect(callsOf(ctx, "lineTo")).toHaveLength(4);
      expect(callsOf(ctx, "closePath")).toHaveLength(2);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
      // leftArrowX = 120, rightArrowX = 360, arrowY = 120
      expect(callsOf(ctx, "moveTo")[0]).toEqual([126, 114]);
      expect(callsOf(ctx, "moveTo")[1]).toEqual([354, 114]);
    });

    it("选中日期绘制实心圆并使用白色文字", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderDateDropdown(dateDropdown({ selectedDate: new Date(2000, 0, 15) }));

      expect(callsOf(ctx, "arc")).toHaveLength(1);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.checkbox.checkedBg });
      expect(sets).toContainEqual({ prop: "fillStyle", value: "#ffffff" });
    });

    it("悬停日期绘制悬停圆并使用常规文字颜色", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderDateDropdown(dateDropdown({ hoveredDate: new Date(2000, 0, 20) }));

      expect(callsOf(ctx, "arc")).toHaveLength(1);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.dropdown.hoverBg });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.dropdown.text });
    });

    it("同时存在选中与悬停时绘制两个圆", () => {
      const { renderer, ctx } = setup();

      renderer.renderDateDropdown(
        dateDropdown({ selectedDate: new Date(2000, 0, 15), hoveredDate: new Date(2000, 0, 20) }),
      );

      expect(callsOf(ctx, "arc")).toHaveLength(2);
    });

    it("当天日期绘制高亮圆", () => {
      const { renderer, ctx, sets, theme } = setup();
      const now = new Date();

      renderer.renderDateDropdown(
        dateDropdown({ currentYear: now.getFullYear(), currentMonth: now.getMonth() }),
      );

      expect(callsOf(ctx, "arc")).toHaveLength(1);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.checkbox.checkedBg });
      expect(sets).toContainEqual({ prop: "fillStyle", value: "#ffffff" });
    });

    it("选中优先级高于当天", () => {
      const { renderer, ctx } = setup();
      const now = new Date();

      renderer.renderDateDropdown(
        dateDropdown({
          currentYear: now.getFullYear(),
          currentMonth: now.getMonth(),
          selectedDate: now,
          hoveredDate: now,
        }),
      );

      // 选中分支命中后不会再走悬停/当天分支
      expect(callsOf(ctx, "arc")).toHaveLength(1);
    });

    it("日期格按星期偏移排列", () => {
      const { renderer, ctx } = setup();

      renderer.renderDateDropdown(dateDropdown({ width: 280 }));

      // dayWidth = (280-16)/7 = 37.714285714285715
      const dayWidth = (280 - 16) / 7;
      // 2000-01-01 是周六 → startWeekday = 6 → index = 6 → row 0, col 6
      const firstDay = callsOf(ctx, "fillText")[8]!;
      expect(firstDay[1]).toBeCloseTo(100 + 8 + 6 * dayWidth + dayWidth / 2, 6);
      expect(firstDay[2]).toBeCloseTo(100 + 40 + 28 + 0 * 28 + 14, 6);
    });

    it("面板外框使用主题边框色描边", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderDateDropdown(dateDropdown());

      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.dropdown.border });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
      // drawOverlayPanel 1 次 + 结尾描边 1 次
      expect(callsOf(ctx, "roundRect")).toHaveLength(3);
      expect(callsOf(ctx, "stroke")).toHaveLength(2);
    });

    it("setLocale 后使用英文月份与星期", () => {
      const { renderer, ctx } = setup();

      renderer.setLocale(enUS);
      renderer.renderDateDropdown(dateDropdown());

      expect(texts(ctx)[0]).toBe("January 2000");
      expect(texts(ctx).slice(1, 8)).toEqual(enUS.calendar.weekdays);
    });

    it("save/restore 成对出现", () => {
      const { renderer, ctx } = setup();

      renderer.renderDateDropdown(dateDropdown());

      expect(callsOf(ctx, "save")).toHaveLength(1);
      expect(callsOf(ctx, "restore")).toHaveLength(1);
    });
  });
});
