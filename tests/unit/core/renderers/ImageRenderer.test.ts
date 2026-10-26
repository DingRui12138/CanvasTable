import { ImageRenderer } from '@/core/renderers/ImageRenderer';
import { LayoutManager } from '@/core/LayoutManager';
import { zhCN } from '@/locale';
import { createMockCanvasContext, createMockTheme } from '../../helpers/mockFactories';
import { createTrackedContext, callsOf, textsOf } from '../../helpers/canvasInspect';
import type { CellRendererContext, ImageRuntime } from '@/core/renderers/CellRenderer';
import type { Column, Row } from '@/types';

describe('ImageRenderer', () => {
  type InspectableCanvasContext = CanvasRenderingContext2D & {
    calls: { method: string; args: unknown[] }[];
  };
  type TestCellRendererContext = CellRendererContext & { ctx: InspectableCanvasContext };

  const theme = createMockTheme();
  const layoutManager = new LayoutManager(undefined, theme);
  const column: Column = { key: 'photos', title: 'Photos', type: 'image', width: 80 };
  const row: Row = { id: 'row-1', data: {} };

  function createContext(
    overrides: Partial<Omit<CellRendererContext, 'ctx'>> = {},
  ): TestCellRendererContext {
    const ctx = createMockCanvasContext() as InspectableCanvasContext;

    return {
      ctx,
      theme,
      layoutManager,
      x: 0,
      y: 0,
      width: 80,
      height: 104,
      column,
      row,
      rowIndex: 0,
      colIndex: 0,
      value: {
        images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'],
        width: 32,
        height: 32,
        gap: 4,
        showMoreCount: true,
      },
      isDisabled: false,
      isHovered: false,
      isSelected: false,
      dpr: 1,
      locale: zhCN,
      ...overrides,
    };
  }

  it('uses taller cells to render multiple image rows', () => {
    const renderer = new ImageRenderer();
    const context = createContext();

    renderer.render(context);

    const imageTileRects = context.ctx.calls.filter(
      (call): call is { method: string; args: [number, number, number, number] } =>
        call.method === 'rect' && call.args[2] === 32 && call.args[3] === 32,
    );
    const imageTileYPositions = new Set(imageTileRects.map((call) => call.args[1]));

    expect(imageTileYPositions.size).toBeGreaterThan(1);
  });

  it('keeps image tile size fixed when row-height scaling is disabled', () => {
    const renderer = new ImageRenderer();
    const context = createContext({
      width: 96,
      height: 104,
      value: {
        images: ['a.png', 'b.png', 'c.png', 'd.png'],
        width: 64,
        height: 64,
        gap: 4,
        scaleWithRowHeight: false,
      },
    });

    renderer.render(context);

    const imageTileRects = context.ctx.calls.filter(
      (call): call is { method: string; args: [number, number, number, number] } =>
        call.method === 'rect' &&
        typeof call.args[2] === 'number' &&
        typeof call.args[3] === 'number' &&
        call.args[2] > 0 &&
        call.args[3] > 0,
    );

    expect(imageTileRects.some((call) => call.args[2] === 24 && call.args[3] === 24)).toBe(true);
    expect(imageTileRects.some((call) => call.args[2] === 64 || call.args[3] === 64)).toBe(false);
  });

  it('does not reserve a more-count tile when all images fit', () => {
    const renderer = new ImageRenderer();
    const context = createContext({
      width: 116,
      height: 40,
      value: {
        images: ['a.png', 'b.png', 'c.png'],
        width: 32,
        height: 32,
        gap: 4,
        showMoreCount: true,
      },
    });

    renderer.render(context);

    const moreCountTexts = context.ctx.calls.filter(
      (call) => call.method === 'fillText' && typeof call.args[0] === 'string' && call.args[0].startsWith('+'),
    );

    expect(moreCountTexts).toHaveLength(0);
  });

  // ────────────────────────────────────────────────────────────────
  // 以下为第四轮补充：图片链路的加载 / 懒加载 / 失败 / 悬停 / 自适应
  // ────────────────────────────────────────────────────────────────

  /** 100×50 的“宽”图，用于验证 contain / cover 的两条分支 */
  const WIDE = { width: 100, height: 50 } as unknown as HTMLImageElement;
  /** 50×100 的“高”图 */
  const TALL = { width: 50, height: 100 } as unknown as HTMLImageElement;

  type RuntimeStub = ImageRuntime & {
    get: jest.Mock;
    isLoading: jest.Mock;
    isFailed: jest.Mock;
    load: jest.Mock;
    collectVisible: jest.Mock;
    isInLazyLoadRange: jest.Mock;
  };

  /**
   * 构造 ImageRuntime 桩。
   * cached / loading / failed 都是 src 白名单，未列入的返回 false。
   */
  function runtime(
    opts: {
      cached?: string[];
      loading?: string[];
      failed?: string[];
      inLazyRange?: boolean;
      image?: HTMLImageElement;
    } = {},
  ): RuntimeStub {
    const cached = new Set(opts.cached ?? []);
    const loading = new Set(opts.loading ?? []);
    const failed = new Set(opts.failed ?? []);
    const image = opts.image ?? WIDE;

    return {
      get: jest.fn((src: string) => (cached.has(src) ? image : null)),
      isLoading: jest.fn((src: string) => loading.has(src)),
      isFailed: jest.fn((src: string) => failed.has(src)),
      load: jest.fn(),
      collectVisible: jest.fn(),
      isInLazyLoadRange: jest.fn(() => opts.inLazyRange ?? true),
    } as unknown as RuntimeStub;
  }

  /** 单图上下文 */
  function single(overrides: Partial<Omit<CellRendererContext, 'ctx'>> = {}) {
    const { ctx, sets } = createTrackedContext();
    const context = {
      ...createContext(),
      ctx: ctx as unknown as CanvasRenderingContext2D,
      width: 80,
      height: 104,
      value: { src: 'a.png', width: 32, height: 32 },
      ...overrides,
    } as CellRendererContext;

    return { renderer: new ImageRenderer(), context, ctx, sets };
  }

  /** 多图上下文（带属性追踪） */
  function multi(overrides: Partial<Omit<CellRendererContext, 'ctx'>> = {}) {
    const { ctx, sets } = createTrackedContext();
    const context = {
      ...createContext(),
      ctx: ctx as unknown as CanvasRenderingContext2D,
      ...overrides,
    } as CellRendererContext;

    return { renderer: new ImageRenderer(), context, ctx, sets };
  }

  describe('基本约定', () => {
    it('type 为 image', () => {
      expect(new ImageRenderer().type).toBe('image');
    });

    it('多图模式返回原始 config', () => {
      const { renderer, context } = multi();
      const result = renderer.render(context);

      expect(result.type).toBe('image');
      expect(result.config).toBe(context.value);
    });

    it('images 为空数组时退回单图逻辑', () => {
      const { renderer, context, ctx } = multi({
        value: { images: [], width: 32, height: 32 },
      });

      const result = renderer.render(context);

      expect(result).toEqual({ type: 'image', config: { images: [], width: 32, height: 32 } });
      // 没有 src，不画任何东西
      expect(callsOf(ctx, 'drawImage')).toHaveLength(0);
      expect(callsOf(ctx, 'fill')).toHaveLength(0);
    });

    it('单图缺少 src 时直接返回且不绘制', () => {
      const { renderer, context, ctx } = single({ value: { width: 32 } });

      const result = renderer.render(context);

      expect(result).toEqual({ type: 'image', config: { width: 32 } });
      expect(callsOf(ctx, 'fill')).toHaveLength(0);
    });
  });

  describe('单图 - 尺寸与圆角', () => {
    it('默认按单元格居中并画直角占位块', () => {
      const { renderer, context, ctx, sets } = single();

      renderer.render(context);

      expect(callsOf(ctx, 'rect')).toContainEqual([24, 36, 32, 32]);
      expect(callsOf(ctx, 'roundRect')).toHaveLength(0);
      expect(sets).toContainEqual({ prop: 'fillStyle', value: theme.colors.image.placeholderBg });
    });

    it('borderRadius 大于 0 时改用 roundRect', () => {
      const { renderer, context, ctx } = single({
        value: { src: 'a.png', width: 32, height: 32, borderRadius: 8 },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'roundRect')).toContainEqual([24, 36, 32, 32, 8]);
      // 槽位路径全部走 roundRect（内置占位图标仍是无条件用 rect 画的方框）
      expect(callsOf(ctx, 'rect').filter((c) => c[2] === 32 && c[3] === 32)).toHaveLength(0);
    });

    it('circle 时圆角取短边一半', () => {
      const { renderer, context, ctx } = single({
        value: { src: 'a.png', width: 32, height: 32, circle: true },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'roundRect')).toContainEqual([24, 36, 32, 32, 16]);
    });

    it('circle 优先于显式 borderRadius', () => {
      const { renderer, context, ctx } = single({
        value: { src: 'a.png', width: 32, height: 32, circle: true, borderRadius: 3 },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'roundRect')[0]![4]).toBe(16);
    });

    it('图片尺寸被单元格可用高度限制', () => {
      // 单元格 40 高 → maxImgSize = min(80,40) - 8 = 32
      const { renderer, context, ctx } = single({
        width: 80,
        height: 40,
        value: { src: 'a.png', width: 64, height: 64 },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'rect')).toContainEqual([24, 4, 32, 32]);
    });

    it('scaleWithRowHeight 为 false 时按标准行高封顶', () => {
      // maxHeight = min(104, 32) = 32 → maxImgSize = 32 - 8 = 24
      const { renderer, context, ctx } = single({
        value: { src: 'a.png', width: 64, height: 64, scaleWithRowHeight: false },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'rect')).toContainEqual([28, 40, 24, 24]);
    });
  });

  describe('单图 - 懒加载门控', () => {
    it('不在懒加载范围时只画占位块，不请求图片', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context, ctx } = single({ imageRuntime: rt });

      renderer.render(context);

      expect(rt.isInLazyLoadRange).toHaveBeenCalledWith(0, 200);
      expect(rt.load).not.toHaveBeenCalled();
      expect(rt.collectVisible).not.toHaveBeenCalled();
      expect(callsOf(ctx, 'drawImage')).toHaveLength(0);
    });

    it('lazy 为 false 时跳过门控直接加载', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, lazy: false },
      });

      renderer.render(context);

      expect(rt.isInLazyLoadRange).not.toHaveBeenCalled();
      expect(rt.load).toHaveBeenCalledWith('a.png', 32);
    });

    it('自定义 lazyThreshold 会传给宿主', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, lazyThreshold: 50 },
      });

      renderer.render(context);

      expect(rt.isInLazyLoadRange).toHaveBeenCalledWith(0, 50);
    });

    it('rowIndex 为 undefined 时不做门控', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context } = single({ imageRuntime: rt, rowIndex: undefined });

      renderer.render(context);

      expect(rt.isInLazyLoadRange).not.toHaveBeenCalled();
      expect(rt.load).toHaveBeenCalled();
    });

    it('rowIndex 为负数时不做门控', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context } = single({ imageRuntime: rt, rowIndex: -1 });

      renderer.render(context);

      expect(rt.isInLazyLoadRange).not.toHaveBeenCalled();
    });

    it('没有 imageRuntime 时不做门控也不会崩', () => {
      const { renderer, context, ctx } = single({ imageRuntime: undefined });

      renderer.render(context);

      expect(callsOf(ctx, 'fill').length).toBeGreaterThan(0);
    });

    it('不在范围内但处于悬停态时仍画悬停边框', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context, sets } = single({ imageRuntime: rt, isHovered: true });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'strokeStyle', value: theme.colors.image.hoverBorder });
      expect(sets).toContainEqual({ prop: 'lineWidth', value: 2 });
    });

    it('hoverable 为 false 时即使悬停也不画边框', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context, sets } = single({
        imageRuntime: rt,
        isHovered: true,
        value: { src: 'a.png', width: 32, height: 32, hoverable: false },
      });

      renderer.render(context);

      expect(sets).not.toContainEqual({ prop: 'lineWidth', value: 2 });
    });
  });

  describe('单图 - 加载状态', () => {
    it('已缓存时裁剪并绘制图片，同时标记可见', () => {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, ctx } = single({ imageRuntime: rt });

      renderer.render(context);

      expect(callsOf(ctx, 'clip')).toHaveLength(1);
      expect(callsOf(ctx, 'save')).toHaveLength(1);
      expect(callsOf(ctx, 'restore')).toHaveLength(1);
      expect(callsOf(ctx, 'drawImage')).toHaveLength(1);
      expect(rt.collectVisible).toHaveBeenCalledWith('a.png');
      expect(rt.load).not.toHaveBeenCalled();
    });

    it('未缓存且未在加载中时发起加载', () => {
      const rt = runtime();
      const { renderer, context } = single({ imageRuntime: rt });

      renderer.render(context);

      expect(rt.collectVisible).toHaveBeenCalledWith('a.png');
      expect(rt.load).toHaveBeenCalledWith('a.png', 32);
    });

    it('已在加载中时不再重复发起请求', () => {
      const rt = runtime({ loading: ['a.png'] });
      const { renderer, context, ctx } = single({ imageRuntime: rt });

      renderer.render(context);

      expect(rt.load).not.toHaveBeenCalled();
      expect(rt.collectVisible).toHaveBeenCalledWith('a.png');
      expect(callsOf(ctx, 'drawImage')).toHaveLength(0);
    });

    it('加载失败时改画错误占位', () => {
      const rt = runtime({ failed: ['a.png'] });
      const { renderer, context, ctx, sets } = single({ imageRuntime: rt });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'fillStyle', value: theme.colors.image.errorBg });
      expect(sets).toContainEqual({ prop: 'strokeStyle', value: theme.colors.image.errorBorder });
      expect(callsOf(ctx, 'drawImage')).toHaveLength(0);
    });
  });

  describe('单图 - fit 自适应', () => {
    function drawn() {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, ctx } = single({ imageRuntime: rt });
      renderer.render(context);
      return callsOf(ctx, 'drawImage')[0] as [unknown, number, number, number, number];
    }

    it('默认 cover：宽图按高度铺满并水平溢出', () => {
      // 图 100×50 (2.0) / 容器 32×32 (1.0) → h=32, w=64, x=24+(32-64)/2=8
      expect(drawn()).toEqual([WIDE, 8, 36, 64, 32]);
    });

    it('fit=cover 且图更窄时按宽度铺满', () => {
      const rt = runtime({ cached: ['a.png'], image: TALL });
      const { renderer, context, ctx } = single({ imageRuntime: rt });
      renderer.render(context);

      // 图 50×100 (0.5) / 容器 1.0 → w=32, h=64, y=36+(32-64)/2=20
      expect(callsOf(ctx, 'drawImage')[0]).toEqual([TALL, 24, 20, 32, 64]);
    });

    it('fit=contain：宽图完整放入并垂直居中', () => {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, fit: 'contain' },
      });
      renderer.render(context);

      // w=32, h=16, y=36+(32-16)/2=44
      expect(callsOf(ctx, 'drawImage')[0]).toEqual([WIDE, 24, 44, 32, 16]);
    });

    it('fit=contain：高图完整放入并水平居中', () => {
      const rt = runtime({ cached: ['a.png'], image: TALL });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, fit: 'contain' },
      });
      renderer.render(context);

      // w=16, h=32, x=24+(32-16)/2=32
      expect(callsOf(ctx, 'drawImage')[0]).toEqual([TALL, 32, 36, 16, 32]);
    });

    it('fit=fill：拉伸铺满整个容器', () => {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, fit: 'fill' },
      });
      renderer.render(context);

      expect(callsOf(ctx, 'drawImage')[0]).toEqual([WIDE, 24, 36, 32, 32]);
    });

    it('fit=none：按原始像素尺寸居中绘制', () => {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, fit: 'none' },
      });
      renderer.render(context);

      // x=24+(32-100)/2=-10, y=36+(32-50)/2=27
      expect(callsOf(ctx, 'drawImage')[0]).toEqual([WIDE, -10, 27, 100, 50]);
    });
  });

  describe('单图 - 自定义占位图', () => {
    it('占位图已缓存时直接绘制它并提前返回', () => {
      const rt = runtime({ cached: ['ph.png'] });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, placeholder: 'ph.png' },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'drawImage')[0]).toEqual([WIDE, 8, 36, 64, 32]);
      // 只请求了真实图片，占位图直接命中缓存
      expect(rt.load).toHaveBeenCalledTimes(1);
      expect(rt.load).toHaveBeenCalledWith('a.png', 32);
    });

    it('占位图未缓存时发起加载', () => {
      const rt = runtime();
      const { renderer, context } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, placeholder: 'ph.png' },
      });

      renderer.render(context);

      expect(rt.load).toHaveBeenCalledWith('ph.png', 32);
    });

    it('占位图加载中时不重复请求', () => {
      const rt = runtime({ loading: ['ph.png'] });
      const { renderer, context } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, placeholder: 'ph.png' },
      });

      renderer.render(context);

      // 真实图片照常发起请求，只有占位图被跳过
      expect(rt.load).toHaveBeenCalledTimes(1);
      expect(rt.load).toHaveBeenCalledWith('a.png', 32);
    });

    it('配置了占位图但没有 runtime 时退回内置占位图标', () => {
      const { renderer, context, sets } = single({
        imageRuntime: undefined,
        value: { src: 'a.png', width: 32, height: 32, placeholder: 'ph.png' },
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'strokeStyle', value: theme.colors.placeholderText });
      expect(sets).toContainEqual({ prop: 'lineWidth', value: 1.5 });
    });

    it('内置占位图标会还原线宽与颜色', () => {
      const { renderer, context, sets } = single({ imageRuntime: runtime() });

      renderer.render(context);

      const strokeStyles = sets.filter((s) => s.prop === 'strokeStyle').map((s) => s.value);
      expect(strokeStyles.at(-1)).toBe('#000000');
    });
  });

  describe('单图 - 自定义错误图', () => {
    it('错误图已缓存时绘制它', () => {
      const rt = runtime({ failed: ['a.png'], cached: ['err.png'] });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, errorImage: 'err.png' },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'drawImage')).toHaveLength(1);
      expect(rt.load).not.toHaveBeenCalled();
    });

    it('错误图未缓存且未失败时发起加载', () => {
      const rt = runtime({ failed: ['a.png'] });
      const { renderer, context } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, errorImage: 'err.png' },
      });

      renderer.render(context);

      expect(rt.load).toHaveBeenCalledWith('err.png', 32);
    });

    it('错误图自身也失败时不再请求', () => {
      const rt = runtime({ failed: ['a.png', 'err.png'] });
      const { renderer, context } = single({
        imageRuntime: rt,
        value: { src: 'a.png', width: 32, height: 32, errorImage: 'err.png' },
      });

      renderer.render(context);

      expect(rt.load).not.toHaveBeenCalled();
    });
  });

  describe('单图 - 悬停', () => {
    it('悬停时画两层边框并恢复样式', () => {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, ctx, sets } = single({ imageRuntime: rt, isHovered: true });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'strokeStyle', value: theme.colors.image.hoverBorder });
      expect(sets).toContainEqual({ prop: 'lineWidth', value: 2 });
      expect(sets).toContainEqual({ prop: 'shadowColor', value: theme.colors.image.hoverShadow });
      expect(sets).toContainEqual({ prop: 'shadowBlur', value: 4 });
      expect(callsOf(ctx, 'save')).toHaveLength(2);
      expect(callsOf(ctx, 'restore')).toHaveLength(2);
    });

    it('非悬停时不画边框', () => {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, sets } = single({ imageRuntime: rt, isHovered: false });

      renderer.render(context);

      expect(sets).not.toContainEqual({ prop: 'lineWidth', value: 2 });
    });
  });

  describe('多图 - 更多数量角标', () => {
    it('溢出时按 maxVisible 显示并补 +N', () => {
      const { renderer, context, ctx } = multi();

      renderer.render(context);

      // 2 列 × 2 行 = 4 槽位；需要 +N 时让出 1 个 → 显示 3 张，剩 2
      expect(textsOf(ctx)).toContain('+2');
    });

    it('+N 角标居中绘制并还原对齐方式', () => {
      const { renderer, context, ctx } = multi();

      renderer.render(context);

      const more = callsOf(ctx, 'fillText').find((c) => c[0] === '+2')!;
      expect(more[1]).toBe(58);
      expect(more[2]).toBe(70);
    });

    it('showMoreCount 为 false 时不显示角标但仍截断', () => {
      const { renderer, context, ctx } = multi({
        value: {
          images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'],
          width: 32,
          height: 32,
          gap: 4,
          showMoreCount: false,
        },
      });

      renderer.render(context);

      expect(textsOf(ctx).filter((t) => t.startsWith('+'))).toHaveLength(0);
    });

    it('maxVisible 可以进一步限制可见数量', () => {
      const { renderer, context, ctx } = multi({
        value: {
          images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'],
          width: 32,
          height: 32,
          gap: 4,
          maxVisible: 2,
        },
      });

      renderer.render(context);

      expect(textsOf(ctx)).toContain('+3');
    });

    it('未悬停的角标使用普通背景色', () => {
      const { renderer, context, sets } = multi();

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'fillStyle', value: theme.colors.moreCount.background });
    });

    it('悬停索引指向角标时使用悬停色', () => {
      const { renderer, context, sets } = multi({ isHovered: true, hoveredImageIndex: 3 });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'fillStyle', value: theme.colors.image.hoverBorder });
    });

    it('hoverable 为 false 时角标不响应悬停', () => {
      const { renderer, context, sets } = multi({
        isHovered: true,
        hoveredImageIndex: 3,
        value: {
          images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'],
          width: 32,
          height: 32,
          gap: 4,
          hoverable: false,
        },
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'fillStyle', value: theme.colors.moreCount.background });
    });
  });

  describe('多图 - 逐张渲染', () => {
    it('每张图都画占位背景块', () => {
      const { renderer, context, ctx } = multi();

      renderer.render(context);

      // 每个槽位会画两次同尺寸矩形（格子底色 + 占位层底色），
      // 所以这里按「坐标去重」统计槽位数量：3 张图 + 1 个角标
      const positions = new Set(
        callsOf(ctx, 'rect')
          .filter((c) => c[2] === 32 && c[3] === 32)
          .map((c) => `${String(c[0])},${String(c[1])}`),
      );
      expect(positions.size).toBe(4);
    });

    it('悬停索引指向某张图时只给那张画边框', () => {
      const rt = runtime({ cached: ['a.png', 'b.png', 'c.png'] });
      const { renderer, context, ctx } = multi({
        imageRuntime: rt,
        isHovered: true,
        hoveredImageIndex: 1,
      });

      renderer.render(context);

      expect(callsOf(ctx, 'drawImage')).toHaveLength(3);
      // 悬停边框是两层描边（实线 + 阴影层），只有被悬停的那一张会画
      expect(callsOf(ctx, 'stroke')).toHaveLength(2);
    });

    it('图片按行列铺开后换行', () => {
      const rt = runtime({ cached: ['a.png', 'b.png', 'c.png'] });
      const { renderer, context, ctx } = multi({ imageRuntime: rt });

      renderer.render(context);

      const xs = callsOf(ctx, 'drawImage').map((c) => c[1]);
      // 第一行 8 与 44，第二行回到 8
      expect(xs[0]).not.toBe(xs[1]);
      expect(xs[2]).toBe(xs[0]);
    });

    it('gap 缺省为 4', () => {
      const rt = runtime({ cached: ['a.png', 'b.png', 'c.png'] });
      const { renderer, context, ctx } = multi({
        imageRuntime: rt,
        value: { images: ['a.png', 'b.png', 'c.png'], width: 32, height: 32 },
      });

      renderer.render(context);

      const xs = callsOf(ctx, 'drawImage').map((c) => Number(c[1]));
      expect(xs[1]! - xs[0]!).toBe(36);
    });

    it('borderRadius 同时作用于图片块与角标', () => {
      const { renderer, context, ctx } = multi({
        value: {
          images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'],
          width: 32,
          height: 32,
          gap: 4,
          borderRadius: 6,
        },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'rect').filter((c) => c[2] === 32 && c[3] === 32)).toHaveLength(0);
      expect(callsOf(ctx, 'roundRect').every((c) => c[4] === 6)).toBe(true);
    });

    it('circle 时角标也用圆形', () => {
      const { renderer, context, ctx } = multi({
        value: {
          images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'],
          width: 32,
          height: 32,
          gap: 4,
          circle: true,
        },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'roundRect').every((c) => c[4] === 16)).toBe(true);
    });

    it('不在懒加载范围时全部画占位且不请求', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context, ctx } = multi({ imageRuntime: rt });

      renderer.render(context);

      expect(rt.load).not.toHaveBeenCalled();
      expect(callsOf(ctx, 'drawImage')).toHaveLength(0);
    });

    it('单张图片失败时只影响那一张', () => {
      const rt = runtime({ failed: ['b.png'], cached: ['a.png', 'c.png'] });
      const { renderer, context, ctx, sets } = multi({ imageRuntime: rt });

      renderer.render(context);

      expect(callsOf(ctx, 'drawImage')).toHaveLength(2);
      expect(sets).toContainEqual({ prop: 'fillStyle', value: theme.colors.image.errorBg });
    });

    it('未缓存的图片逐个发起加载', () => {
      const rt = runtime();
      const { renderer, context } = multi({ imageRuntime: rt });

      renderer.render(context);

      expect(rt.load.mock.calls.map((c) => c[0])).toEqual(['a.png', 'b.png', 'c.png']);
    });

    it('加载中的图片不重复请求', () => {
      const rt = runtime({ loading: ['a.png', 'b.png'] });
      const { renderer, context } = multi({ imageRuntime: rt });

      renderer.render(context);

      expect(rt.load).toHaveBeenCalledTimes(1);
      expect(rt.load).toHaveBeenCalledWith('c.png', 32);
    });

    it('内容宽度收窄后起始 X 由居中决定，且恒不小于 padding', () => {
      const rt = runtime({ cached: ['a.png', 'b.png'] });
      const { renderer, context, ctx } = multi({
        imageRuntime: rt,
        width: 40,
        value: { images: ['a.png', 'b.png'], width: 32, height: 32, gap: 4 },
      });

      renderer.render(context);

      // 可用宽 32 → 每行只放 1 张；contentWidth = 32，startX = (40 - 32) / 2 = 4
      // 两行 y 分别为 18 与 18 + 32 + 4 = 54
      //
      // 注：源码里的 `Math.max(x + padding, startX)` 实际不可达 —— imagesPerRow 由
      // availableWidth 反推，因此恒有 contentWidth <= availableWidth，
      // 也就恒有 startX >= x + padding。这里只是把该不变量固化下来。
      const positions = callsOf(ctx, 'rect')
        .filter((c) => c[2] === 32 && c[3] === 32)
        .map((c) => [c[0], c[1]]);

      expect(positions).toContainEqual([4, 18]);
      expect(positions).toContainEqual([4, 54]);
      expect(positions.every(([x]) => (x as number) >= 4)).toBe(true);
    });
  });

  /**
   * borderRadius > 0 时所有路径都要改用 roundRect（而不是 rect）。
   * 这几条分支在默认直角配置下永远不会被走到。
   */
  describe('圆角变体', () => {
    const R = 8;
    const rounded = (extra: Record<string, unknown> = {}) => ({
      src: 'a.png',
      width: 32,
      height: 32,
      borderRadius: R,
      ...extra,
    });
    const MULTI = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'];

    it('已缓存的单图用 roundRect 裁剪', () => {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, ctx } = single({ imageRuntime: rt, value: rounded() });

      renderer.render(context);

      expect(callsOf(ctx, 'clip')).toHaveLength(1);
      expect(callsOf(ctx, 'roundRect')).toContainEqual([24, 36, 32, 32, R]);
      expect(callsOf(ctx, 'drawImage')).toHaveLength(1);
    });

    it('已缓存的多图逐张用 roundRect 裁剪', () => {
      const rt = runtime({ cached: ['a.png', 'b.png', 'c.png'] });
      const { renderer, context, ctx } = multi({
        imageRuntime: rt,
        value: { images: MULTI, width: 32, height: 32, gap: 4, borderRadius: R },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'clip')).toHaveLength(3);
      // 槽位 + 角标全部用同一圆角
      expect(callsOf(ctx, 'roundRect').every((c) => c[4] === R)).toBe(true);
    });

    it('缓存的占位图也用 roundRect 裁剪', () => {
      const rt = runtime({ cached: ['ph.png'] });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        value: rounded({ placeholder: 'ph.png' }),
      });

      renderer.render(context);

      expect(callsOf(ctx, 'drawImage')).toHaveLength(1);
      expect(callsOf(ctx, 'roundRect')).toContainEqual([24, 36, 32, 32, R]);
    });

    it('缓存的错误图也用 roundRect 裁剪', () => {
      const rt = runtime({ failed: ['a.png'], cached: ['err.png'] });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        value: rounded({ errorImage: 'err.png' }),
      });

      renderer.render(context);

      expect(callsOf(ctx, 'drawImage')).toHaveLength(1);
      expect(callsOf(ctx, 'roundRect')).toContainEqual([24, 36, 32, 32, R]);
    });

    it('没有错误图时的错误占位块用 roundRect', () => {
      const rt = runtime({ failed: ['a.png'] });
      const { renderer, context, ctx, sets } = single({ imageRuntime: rt, value: rounded() });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'fillStyle', value: theme.colors.image.errorBg });
      expect(callsOf(ctx, 'roundRect')).toContainEqual([24, 36, 32, 32, R]);
    });

    it('悬停边框的两层描边都用 roundRect', () => {
      const rt = runtime({ cached: ['a.png'] });
      const { renderer, context, ctx } = single({
        imageRuntime: rt,
        isHovered: true,
        value: rounded(),
      });

      renderer.render(context);

      // 占位底色 1 次 + 裁剪路径 1 次 + 悬停实线 1 次 + 悬停阴影层 1 次
      expect(callsOf(ctx, 'roundRect').filter((c) => c[4] === R)).toHaveLength(4);
    });

    it('懒加载范围外的多图悬停也用 roundRect', () => {
      const rt = runtime({ inLazyRange: false });
      const { renderer, context, ctx } = multi({
        imageRuntime: rt,
        isHovered: true,
        hoveredImageIndex: 0,
        value: { images: MULTI, width: 32, height: 32, gap: 4, borderRadius: R },
      });

      renderer.render(context);

      // 占位层 + 悬停两层，都作用在第 0 张上
      expect(callsOf(ctx, 'drawImage')).toHaveLength(0);
      expect(callsOf(ctx, 'roundRect').filter((c) => c[4] === R).length).toBeGreaterThan(2);
    });

    it('失败的多图被悬停时也画边框', () => {
      const rt = runtime({ failed: ['a.png'] });
      const { renderer, context, sets } = multi({
        imageRuntime: rt,
        isHovered: true,
        hoveredImageIndex: 0,
        value: { images: MULTI, width: 32, height: 32, gap: 4, borderRadius: R },
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: 'fillStyle', value: theme.colors.image.errorBg });
      expect(sets).toContainEqual({ prop: 'lineWidth', value: 2 });
    });
  });

  describe('默认尺寸', () => {
    it('单图未指定 width/height 时回退到 32×32', () => {
      const { renderer, context, ctx } = single({ value: { src: 'a.png' } });

      renderer.render(context);

      // 单元格 80×104 → maxImgSize 72，仍取默认 32
      expect(callsOf(ctx, 'rect')).toContainEqual([24, 36, 32, 32]);
    });

    it('多图未指定 width/height 时回退到 32×32', () => {
      const rt = runtime({ cached: ['a.png', 'b.png'] });
      const { renderer, context, ctx } = multi({
        imageRuntime: rt,
        value: { images: ['a.png', 'b.png'] },
      });

      renderer.render(context);

      expect(callsOf(ctx, 'drawImage')).toHaveLength(2);
      expect(callsOf(ctx, 'rect').filter((c) => c[2] === 32 && c[3] === 32).length).toBeGreaterThan(
        0,
      );
    });
  });
});
