import { ImageOverlayRenderer } from "@/core/renderers/ImageOverlayRenderer";
import { zhCN } from "@/locale";
import type { ImageEditorState, ImageTooltipState } from "@/types";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, textsOf, callsOf, methodNamesOf } from "../../helpers/canvasInspect";

/**
 * ImageOverlayRenderer 的几何计算完全由常量决定（图片 64px、间距 8px、每行 4 张、
 * 上传区 60px），因此测试里直接把这套布局数字写死，一旦源码改动会立刻暴露。
 */
const IMG = 64;
const PAD = 8;
const GAP = 8;
const PER_ROW = 4;
const ROW_H = IMG + GAP; // 72
const TOOLTIP_W = PER_ROW * IMG + (PER_ROW - 1) * GAP + PAD * 2 + 4 + 4; // 304
const UPLOAD_H = 60;

type LoaderArg = ConstructorParameters<typeof ImageOverlayRenderer>[2];

function makeLoader(options: { cached?: boolean; loading?: boolean } = {}) {
  const image = { width: IMG, height: IMG } as unknown as HTMLImageElement;
  const cached = options.cached ?? true;
  const loading = options.loading ?? false;
  return {
    image,
    get: jest.fn(() => (cached ? image : null)),
    isLoading: jest.fn(() => loading),
    load: jest.fn(),
    collectVisible: jest.fn(),
  };
}

function setup(loaderOptions: { cached?: boolean; loading?: boolean } = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const loader = makeLoader(loaderOptions);
  const renderer = new ImageOverlayRenderer(
    ctx as unknown as CanvasRenderingContext2D,
    theme,
    loader as unknown as LoaderArg,
  );
  return { renderer, ctx, sets, theme, loader };
}

function tooltipState(overrides: Partial<ImageTooltipState> = {}): ImageTooltipState {
  return {
    cell: { rowIndex: 0, columnIndex: 0 },
    x: 10,
    y: 20,
    images: ["a.png", "b.png", "c.png", "d.png"],
    hoveredIndex: -1,
    scrollTop: 0,
    maxRows: 2,
    showAbove: false,
    ...overrides,
  };
}

function editorState(overrides: Partial<ImageEditorState> = {}): ImageEditorState {
  return {
    cell: { rowIndex: 0, columnIndex: 0 },
    x: 10,
    y: 20,
    images: ["a.png", "b.png", "c.png", "d.png"],
    hoveredIndex: -1,
    scrollTop: 0,
    maxRows: 2,
    showAbove: false,
    isDragging: false,
    pendingImages: [],
    isSingleImage: false,
    ...overrides,
  };
}

function manyImages(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `i${i}.png`);
}

function pending(count: number): Array<{ file: File; preview: string }> {
  return Array.from({ length: count }, (_, i) => ({
    file: { name: `f${i}` } as File,
    preview: `p${i}.png`,
  }));
}

describe("ImageOverlayRenderer", () => {
  describe("setContext / setTheme / setLocale", () => {
    it("setContext 后绘制到新的上下文", () => {
      const { renderer, ctx } = setup();
      const other = createTrackedContext();

      renderer.setContext(other.ctx as unknown as CanvasRenderingContext2D);
      renderer.renderImageTooltip(tooltipState());

      expect(other.ctx.calls.length).toBeGreaterThan(0);
      expect(ctx.calls).toHaveLength(0);
    });

    it("setTheme 后使用新主题配色", () => {
      const { renderer, sets } = setup();
      const next = createMockTheme();
      next.colors.tooltip.background = "#111111";

      renderer.setTheme(next);
      renderer.renderImageTooltip(tooltipState());

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#111111" });
    });

    it("setLocale 后上传区文案随之切换", () => {
      const { renderer, ctx } = setup();

      renderer.setLocale({
        ...zhCN,
        image: { ...zhCN.image, uploadIdle: "DROP HERE" },
      });
      renderer.renderImageEditor(editorState());

      expect(textsOf(ctx)).toContain("DROP HERE");
    });

    it("未传 locale 时默认使用 zhCN", () => {
      const { ctx, theme, loader } = setup();
      const renderer = new ImageOverlayRenderer(
        ctx as unknown as CanvasRenderingContext2D,
        theme,
        loader as unknown as LoaderArg,
      );

      renderer.renderImageEditor(editorState());

      expect(textsOf(ctx)).toContain(zhCN.image.uploadIdle);
    });
  });

  describe("renderImageTooltip - 面板与布局", () => {
    it("面板宽度按 4 列 + 滚动条预留计算", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageTooltip(tooltipState());

      expect(callsOf(ctx, "roundRect")[0]).toEqual([10, 20, TOOLTIP_W, 152, 6]);
    });

    it("可见高度随 maxRows 变化", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageTooltip(tooltipState({ maxRows: 1 }));

      // 1 * 72 + 16 - 8 = 80
      expect(callsOf(ctx, "roundRect")[0]).toEqual([10, 20, TOOLTIP_W, 80, 6]);
    });

    it("整个绘制过程被 save/restore 包裹", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageTooltip(tooltipState());

      const names = methodNamesOf(ctx);
      expect(names[0]).toBe("save");
      expect(names[names.length - 1]).toBe("restore");
    });

    it("面板启用裁剪与主题阴影", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderImageTooltip(tooltipState());

      expect(methodNamesOf(ctx)).toContain("clip");
      expect(sets).toContainEqual({ prop: "shadowColor", value: theme.colors.shadow.color });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.tooltip.background });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.dropdown.border });
    });

    it("按每行 4 张的网格摆放图片", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageTooltip(tooltipState());

      const draws = callsOf(ctx, "drawImage");
      expect(draws).toHaveLength(4);
      // 第 1 张：(x+PAD, y+PAD)
      expect(draws[0]!.slice(1)).toEqual([18, 28, IMG, IMG]);
      // 第 2 张：横向 +72
      expect(draws[1]!.slice(1)).toEqual([18 + ROW_H, 28, IMG, IMG]);
      // 第 4 张：横向 +3*72
      expect(draws[3]!.slice(1)).toEqual([18 + 3 * ROW_H, 28, IMG, IMG]);
    });

    it("第 5 张图片换行到第二行", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageTooltip(tooltipState({ images: manyImages(5) }));

      const draws = callsOf(ctx, "drawImage");
      expect(draws[4]!.slice(1)).toEqual([18, 28 + ROW_H, IMG, IMG]);
    });

    it("scrollTop 决定起始行与 tile 的 Y 偏移", () => {
      const { renderer, ctx, loader } = setup();

      renderer.renderImageTooltip(tooltipState({ images: manyImages(12), scrollTop: ROW_H }));

      const draws = callsOf(ctx, "drawImage");
      // startRow 1、maxRows 2 → 渲染第 2、3 行共 8 张
      expect(draws).toHaveLength(8);
      expect(loader.collectVisible).toHaveBeenCalledWith("i4.png");
      expect(draws[0]!.slice(1)).toEqual([18, 28, IMG, IMG]);
    });

    it("空字符串图片被跳过", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageTooltip(tooltipState({ images: ["a.png", "", "c.png"] }));

      expect(callsOf(ctx, "drawImage")).toHaveLength(2);
    });
  });

  describe("renderImageTooltip - 图片状态", () => {
    it("已缓存的图片直接绘制并登记为可见", () => {
      const { renderer, loader } = setup();

      renderer.renderImageTooltip(tooltipState());

      expect(loader.collectVisible).toHaveBeenCalledTimes(4);
      expect(loader.load).not.toHaveBeenCalled();
    });

    it("未缓存的图片绘制占位符并请求加载", () => {
      const { renderer, ctx, sets, theme, loader } = setup({ cached: false });

      renderer.renderImageTooltip(tooltipState({ images: ["a.png"] }));

      expect(callsOf(ctx, "drawImage")).toHaveLength(0);
      expect(callsOf(ctx, "fillRect")[0]).toEqual([18, 28, IMG, IMG]);
      expect(callsOf(ctx, "strokeRect")[0]).toEqual([18, 28, IMG, IMG]);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.image.placeholderBg });
      expect(loader.load).toHaveBeenCalledWith("a.png", IMG);
    });

    it("加载中的图片不会重复触发 load", () => {
      const { renderer, loader } = setup({ cached: false, loading: true });

      renderer.renderImageTooltip(tooltipState({ images: ["a.png"] }));

      expect(loader.load).not.toHaveBeenCalled();
    });

    it("悬停的图片绘制高亮边框", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderImageTooltip(tooltipState({ hoveredIndex: 1 }));

      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.image.hoverBorder });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 2 });
      // 第 2 张 x=18+72=90, y=28 → 外扩 1px
      expect(callsOf(ctx, "strokeRect")).toContainEqual([89, 27, IMG + 2, IMG + 2]);
    });

    it("没有悬停项时不绘制高亮", () => {
      const { renderer, sets, theme } = setup();

      renderer.renderImageTooltip(tooltipState({ hoveredIndex: -1 }));

      expect(sets).not.toContainEqual({ prop: "strokeStyle", value: theme.colors.image.hoverBorder });
    });

    it("tooltip 中的图片不绘制删除按钮", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageTooltip(tooltipState({ hoveredIndex: 0 }));

      expect(callsOf(ctx, "arc")).toHaveLength(0);
    });
  });

  describe("renderImageTooltip - 滚动条", () => {
    it("内容超出可见高度时绘制滚动条", () => {
      const { renderer, ctx, sets, theme } = setup();

      // 12 张 → 3 行 → contentHeight 208 > 136
      renderer.renderImageTooltip(tooltipState({ images: manyImages(12) }));

      expect(sets).toContainEqual({ prop: "globalAlpha", value: theme.colors.scrollbar.opacity });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.scrollbar.track });
      // 轨道：x + 304 - 8 - 4, y + 8, 4, 152-16
      expect(callsOf(ctx, "fillRect")).toContainEqual([10 + 292, 28, 4, 136]);
    });

    it("内容未超出时不绘制滚动条", () => {
      const { renderer, sets } = setup();

      renderer.renderImageTooltip(tooltipState());

      expect(sets.filter((s) => s.prop === "globalAlpha")).toHaveLength(0);
    });

    it("滚动条滑块高度按可见比例计算", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageTooltip(tooltipState({ images: manyImages(12) }));

      const rects = callsOf(ctx, "fillRect").filter((c) => c[0] === 10 + 292);
      expect(rects).toHaveLength(2);
      expect(rects[0]![3]).toBe(136); // 轨道高度
      expect(rects[1]![3]).toBeCloseTo((152 / 208) * 136, 5);
    });
  });

  describe("renderImageEditor - 面板与上传区", () => {
    it("面板高度等于上传区加上图片区", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState());

      // 60 + (2*72 + 16 - 8) = 60 + 152 = 212
      expect(callsOf(ctx, "roundRect")[0]).toEqual([10, 20, TOOLTIP_W, UPLOAD_H + 152, 6]);
    });

    it("图片区高度随 maxRows 变化", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState({ maxRows: 1 }));

      // 60 + (72 + 8) = 140
      expect(callsOf(ctx, "roundRect")[0]).toEqual([10, 20, TOOLTIP_W, 140, 6]);
    });

    it("上传区使用占位背景与虚线边框", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderImageEditor(editorState());

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.image.placeholderBg });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.dropdown.border });
      expect(callsOf(ctx, "setLineDash")).toEqual([[4, 4], []]);
      expect(callsOf(ctx, "fillRect")[0]).toEqual([18, 28, TOOLTIP_W - PAD * 2, UPLOAD_H - PAD * 2]);
      expect(callsOf(ctx, "strokeRect")[0]).toEqual([18, 28, TOOLTIP_W - PAD * 2, UPLOAD_H - PAD * 2]);
    });

    it("拖拽中切换为高亮配色", () => {
      const { renderer, sets, theme } = setup();

      renderer.renderImageEditor(editorState({ isDragging: true }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.dropdown.selectedBg });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.checkbox.checkedBg });
    });

    it("上传区文案随拖拽状态切换", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState());
      expect(textsOf(ctx)).toContain(zhCN.image.uploadIdle);

      const second = setup();
      second.renderer.renderImageEditor(editorState({ isDragging: true }));
      expect(textsOf(second.ctx)).toContain(zhCN.image.uploadDragging);
    });

    it("上传区文案居中绘制", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState());

      expect(callsOf(ctx, "fillText")).toContainEqual([
        zhCN.image.uploadIdle,
        10 + TOOLTIP_W / 2,
        20 + UPLOAD_H / 2,
        undefined,
      ]);
    });

    it("上传区使用主题字体与居中基线", () => {
      const { renderer, sets, theme } = setup();

      renderer.renderImageEditor(editorState());

      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
      expect(sets).toContainEqual({ prop: "textAlign", value: "center" });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
    });
  });

  describe("renderImageEditor - 图片区", () => {
    it("图片区按上传区下沿偏移并裁剪", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState());

      expect(callsOf(ctx, "rect")[0]).toEqual([10, 20 + UPLOAD_H, TOOLTIP_W, 152]);
      expect(methodNamesOf(ctx)).toContain("clip");
    });

    it("图片从上传区下方开始摆放", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState());

      const draws = callsOf(ctx, "drawImage");
      expect(draws[0]!.slice(1)).toEqual([18, 20 + UPLOAD_H + PAD, IMG, IMG]);
    });

    it("待上传图片的 preview 会被追加到列表末尾", () => {
      const { renderer, ctx, loader } = setup();

      renderer.renderImageEditor(
        editorState({ images: ["a.png"], pendingImages: pending(1) }),
      );

      expect(loader.collectVisible).toHaveBeenCalledWith("a.png");
      // 第 2 张是 pending 的 preview
      expect(callsOf(ctx, "drawImage")[1]!.slice(1)).toEqual([18 + ROW_H, 88, IMG, IMG]);
    });

    it("待上传图片绘制半透明遮罩与上传中文案", () => {
      const { renderer, ctx, sets } = setup();

      renderer.renderImageEditor(editorState({ images: [], pendingImages: pending(1) }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgba(0, 0, 0, 0.5)" });
      // 遮罩：(x, y + 64 - 20, 64, 20)
      expect(callsOf(ctx, "fillRect")).toContainEqual([18, 88 + IMG - 20, IMG, 20]);
      expect(textsOf(ctx)).toContain(zhCN.image.uploading);
    });

    it("待上传图片的文案使用小一号字体", () => {
      const { renderer, sets, theme } = setup();

      renderer.renderImageEditor(editorState({ images: [], pendingImages: pending(1) }));

      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size - 2}px ${theme.font.family}`,
      });
    });

    it("悬停的已上传图片绘制删除按钮", () => {
      const { renderer, ctx, sets } = setup();

      renderer.renderImageEditor(editorState({ hoveredIndex: 0 }));

      // deleteBtnX = 18 + 64 - 8 - 2 = 72；deleteBtnY = 88 + 8 + 2 = 98
      expect(callsOf(ctx, "arc")).toContainEqual([72, 98, 8, 0, Math.PI * 2]);
      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgba(0, 0, 0, 0.6)" });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: "#ffffff" });
    });

    it("待上传图片即使悬停也不绘制删除按钮", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(
        editorState({ images: [], pendingImages: pending(1), hoveredIndex: 0 }),
      );

      expect(callsOf(ctx, "arc")).toHaveLength(0);
    });

    it("未悬停时不绘制删除按钮", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState({ hoveredIndex: -1 }));

      expect(callsOf(ctx, "arc")).toHaveLength(0);
    });

    it("images 与 pendingImages 缺省时按空数组处理", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor({
        ...editorState(),
        images: undefined,
        pendingImages: undefined,
      } as unknown as ImageEditorState);

      expect(callsOf(ctx, "drawImage")).toHaveLength(0);
      expect(textsOf(ctx)).toContain(zhCN.image.uploadIdle);
    });

    it("空字符串图片被跳过", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState({ images: ["a.png", "", "c.png"] }));

      expect(callsOf(ctx, "drawImage")).toHaveLength(2);
    });

    it("第 5 张图片换行到第二行", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState({ images: manyImages(5) }));

      const draws = callsOf(ctx, "drawImage");
      expect(draws[4]!.slice(1)).toEqual([18, 20 + UPLOAD_H + PAD + ROW_H, IMG, IMG]);
    });

    it("scrollTop 决定起始行", () => {
      const { renderer, loader } = setup();

      renderer.renderImageEditor(editorState({ images: manyImages(12), scrollTop: ROW_H }));

      // startRow 1、maxRows 2 → 渲染 i4..i11
      expect(loader.collectVisible).toHaveBeenCalledWith("i4.png");
      expect(loader.collectVisible).toHaveBeenCalledTimes(8);
    });
  });

  describe("renderImageEditor - 滚动条", () => {
    it("内容超出图片区高度时绘制滚动条", () => {
      const { renderer, ctx, sets, theme } = setup();

      renderer.renderImageEditor(editorState({ images: manyImages(12) }));

      expect(sets).toContainEqual({ prop: "globalAlpha", value: theme.colors.scrollbar.opacity });
      // 轨道：editor.x + 304 - 8 - 4, imagesY + 8, 4, 136
      expect(callsOf(ctx, "fillRect")).toContainEqual([302, 88, 4, 136]);
    });

    it("内容未超出时不绘制滚动条", () => {
      const { renderer, sets } = setup();

      renderer.renderImageEditor(editorState());

      expect(sets.filter((s) => s.prop === "globalAlpha")).toHaveLength(0);
    });

    it("滚动条滑块高度与内容比例相关", () => {
      const { renderer, ctx } = setup();

      renderer.renderImageEditor(editorState({ images: manyImages(12) }));

      const rects = callsOf(ctx, "fillRect").filter((c) => c[0] === 302);
      expect(rects).toHaveLength(2);
      expect(rects[0]![3]).toBe(136);
      expect(rects[1]![3]).toBeCloseTo((136 / 208) * 136, 5);
    });
  });
});
