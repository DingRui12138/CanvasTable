import { createMockCanvasContext } from './mockFactories';

export type RecordedCall = { method: string; args: unknown[] };
export type PropSet = { prop: string; value: unknown };

export type TrackedContext = CanvasRenderingContext2D & {
  calls: RecordedCall[];
  resetCalls: () => void;
};

/**
 * Canvas 上会被渲染器频繁赋值、但无法通过 calls 观察的样式属性。
 * 用访问器拦截赋值，便于断言"用了哪个颜色 / 线宽 / 字体"。
 */
const TRACKED_PROPS = [
  'fillStyle',
  'strokeStyle',
  'lineWidth',
  'font',
  'textAlign',
  'textBaseline',
  'globalAlpha',
  'shadowColor',
  'shadowBlur',
  'shadowOffsetX',
  'shadowOffsetY',
  'lineCap',
  'lineJoin',
] as const;

/**
 * 创建带样式赋值追踪的 mock canvas context。
 * `ctx.calls` 记录方法调用，`sets` 记录样式属性赋值（按时间顺序）。
 */
export function createTrackedContext(): { ctx: TrackedContext; sets: PropSet[] } {
  const ctx = createMockCanvasContext() as TrackedContext;
  const sets: PropSet[] = [];

  for (const prop of TRACKED_PROPS) {
    let current: unknown = (ctx as unknown as Record<string, unknown>)[prop];
    Object.defineProperty(ctx, prop, {
      configurable: true,
      get: () => current,
      set: (value: unknown) => {
        current = value;
        sets.push({ prop, value });
      },
    });
  }

  return { ctx, sets };
}

/** 按调用顺序取出所有 fillText 的文本 */
export function textsOf(ctx: TrackedContext): string[] {
  return ctx.calls.filter((c) => c.method === 'fillText').map((c) => String(c.args[0]));
}

/** 取出指定方法的全部参数列表 */
export function callsOf(ctx: TrackedContext, method: string): unknown[][] {
  return ctx.calls.filter((c) => c.method === method).map((c) => c.args);
}

/** 取出按顺序调用的方法名 */
export function methodNamesOf(ctx: TrackedContext): string[] {
  return ctx.calls.map((c) => c.method);
}
