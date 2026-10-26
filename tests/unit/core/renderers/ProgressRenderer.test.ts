import { ProgressRenderer } from "@/core/renderers/ProgressRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import type { Column, ProgressConfig, ProgressColorStop, Row } from "@/types";
import { zhCN } from "@/locale";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, callsOf, textsOf, methodNamesOf } from "../../helpers/canvasInspect";

function build(overrides: Partial<CellRendererContext> = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const column: Column = { key: "p", title: "P", width: 200, type: "progress" };
  const row: Row = { id: "r0", data: {} };

  const context = {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    theme,
    locale: zhCN,
    layoutManager: {} as CellRendererContext["layoutManager"],
    x: 0,
    y: 0,
    width: 200,
    height: 32,
    column,
    row,
    rowIndex: 0,
    colIndex: 0,
    value: { value: 50 } as ProgressConfig,
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;

  return { renderer: new ProgressRenderer(), context, ctx, sets, theme };
}

/** 取出最后一次设置的 fillStyle（文字色会覆盖进度色） */
function lastFillStyle(sets: { prop: string; value: unknown }[]): unknown {
  const fills = sets.filter((s) => s.prop === "fillStyle");
  return fills[fills.length - 1]?.value;
}

/** 取出所有 roundRect 的宽高（第 3、4 个参数） */
function rectSizes(ctx: ReturnType<typeof build>["ctx"]): [number, number][] {
  return callsOf(ctx, "roundRect").map((a) => [a[2] as number, a[3] as number]);
}

describe("ProgressRenderer", () => {
  it("type 为 progress", () => {
    expect(new ProgressRenderer().type).toBe("progress");
  });

  it("返回 progress 类型和原始 config", () => {
    const config: ProgressConfig = { value: 30 };
    const { renderer, context } = build({ value: config });

    expect(renderer.render(context)).toEqual({ type: "progress", config });
  });

  describe("形状分发", () => {
    it("默认按 line 形状绘制", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      // line 用 roundRect，circle/dashboard 用 arc
      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
      expect(callsOf(ctx, "arc")).toHaveLength(0);
    });

    it("shape=line 走线型", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "line" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
    });

    it("shape=circle 走圆环", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "circle" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toHaveLength(0);
      expect(callsOf(ctx, "arc")).toHaveLength(2);
    });

    it("shape=dashboard 走仪表盘", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "dashboard" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toHaveLength(0);
      expect(callsOf(ctx, "arc")).toHaveLength(2);
    });

    it("未知 shape 时不绘制任何内容", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "bogus" } as unknown as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toEqual([]);
      expect(callsOf(ctx, "arc")).toEqual([]);
      expect(textsOf(ctx)).toEqual([]);
    });
  });

  describe("线型：轨道与进度条", () => {
    it("按单元格尺寸计算轨道位置（右置文本预留 40px）", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      // barWidth = 200 - 16 - 40 = 144；barY = (32 - 10) / 2 = 11；radius = 5
      expect(callsOf(ctx, "roundRect")[0]).toEqual([8, 11, 144, 10, 5]);
    });

    it("进度条宽度与进度成正比", () => {
      const { renderer, context, ctx } = build({
        value: { value: 25 } as ProgressConfig,
      });

      renderer.render(context);

      // 0.25 * 144 = 36
      expect(callsOf(ctx, "roundRect")[1]).toEqual([8, 11, 36, 10, 5]);
    });

    it("进度条最小宽度不小于圆角直径", () => {
      const { renderer, context, ctx } = build({
        value: { value: 2 } as ProgressConfig,
      });

      renderer.render(context);

      // 0.02 * 144 = 2.88 < radius * 2 = 10
      expect(callsOf(ctx, "roundRect")[1]![2]).toBe(10);
    });

    it("进度为 0 时不画进度条", () => {
      const { renderer, context, ctx } = build({ value: { value: 0 } as ProgressConfig });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toHaveLength(1);
    });

    it("超过 100 时按 100 处理", () => {
      const { renderer, context, ctx } = build({ value: { value: 150 } as ProgressConfig });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")[1]![2]).toBe(144);
      expect(textsOf(ctx)[0]).toBe("100%");
    });

    it("小于 0 时按 0 处理且不画进度条", () => {
      const { renderer, context, ctx } = build({ value: { value: -20 } as ProgressConfig });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toHaveLength(1);
      expect(textsOf(ctx)[0]).toBe("0%");
    });

    it("trackColor / borderRadius / height / width 均可覆盖", () => {
      const { renderer, context, ctx, sets } = build({
        value: {
          value: 50,
          trackColor: "#abcdef",
          borderRadius: 0,
          height: 20,
          width: 100,
        } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#abcdef" });
      // barY = (32 - 20) / 2 = 6
      expect(callsOf(ctx, "roundRect")[0]).toEqual([8, 6, 100, 20, 0]);
    });
  });

  describe("线型：尺寸预设", () => {
    it("size=small 时条高 6", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, size: "small" } as ProgressConfig,
      });

      renderer.render(context);

      expect(rectSizes(ctx)[0]![1]).toBe(6);
    });

    it("size=large 时条高 16", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, size: "large" } as ProgressConfig,
      });

      renderer.render(context);

      expect(rectSizes(ctx)[0]![1]).toBe(16);
    });

    it("size=medium 时条高 10", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, size: "medium" } as ProgressConfig,
      });

      renderer.render(context);

      expect(rectSizes(ctx)[0]![1]).toBe(10);
    });
  });

  describe("线型：文本", () => {
    it("默认显示四舍五入的整数百分比", () => {
      const { renderer, context, ctx } = build({ value: { value: 45.6 } as ProgressConfig });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("46%");
    });

    it("precision 控制小数位数", () => {
      const { renderer, context, ctx } = build({
        value: { value: 45.62, precision: 1 } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("45.6%");
    });

    it("format 优先于内置格式化", () => {
      const format = jest.fn((v: number) => `${v}/100`);
      const { renderer, context, ctx } = build({
        value: { value: 30, format } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("30/100");
      expect(format).toHaveBeenCalledWith(30);
    });

    it("format 收到的是 clamp 之后的值", () => {
      const format = jest.fn((v: number) => String(v));
      const { renderer, context } = build({
        value: { value: 250, format } as ProgressConfig,
      });

      renderer.render(context);

      expect(format).toHaveBeenCalledWith(100);
    });

    it("showText=false 时不绘制文本", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, showText: false } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([]);
    });

    it("textPosition=right 时文本在进度条右侧并左对齐", () => {
      const { renderer, context, ctx, sets } = build({
        value: { value: 50, textPosition: "right" } as ProgressConfig,
      });

      renderer.render(context);

      // barX + barWidth + 8 = 8 + 144 + 8 = 160
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(160);
      expect(callsOf(ctx, "fillText")[0]![2]).toBe(16);
      expect(sets).toContainEqual({ prop: "textAlign", value: "left" });
    });

    it("textPosition=inside 时文本居中于进度条，且不预留右侧空间", () => {
      const { renderer, context, ctx, sets } = build({
        value: { value: 50, textPosition: "inside" } as ProgressConfig,
      });

      renderer.render(context);

      // 未预留 40px → barWidth = 184；barX + barWidth / 2 = 8 + 92 = 100
      expect(callsOf(ctx, "roundRect")[0]![2]).toBe(184);
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(100);
      expect(sets).toContainEqual({ prop: "textAlign", value: "center" });
    });

    it("textPosition=inside 且条高较小时字号被夹到 10", () => {
      const { renderer, context, sets } = build({
        value: { value: 50, textPosition: "inside", height: 6 } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "font", value: `10px ${context.theme.font.family}` });
    });

    it("textPosition=inside 且条高较大时字号取主题字号上限", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: 50, textPosition: "inside", height: 40 } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
    });

    it("size=small 的右置文本字号为 11", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: 50, size: "small" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "font", value: `11px ${theme.font.family}` });
    });

    it("size=large 的右置文本字号为 14", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: 50, size: "large" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "font", value: `14px ${theme.font.family}` });
    });

    it("textColor 覆盖默认文本色", () => {
      const { renderer, context, sets } = build({
        value: { value: 50, textColor: "#ff0000" } as ProgressConfig,
      });

      renderer.render(context);

      expect(lastFillStyle(sets)).toBe("#ff0000");
    });

    it("save / restore 成对出现", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      const names = methodNamesOf(ctx);
      expect(names[0]).toBe("save");
      expect(names[names.length - 1]).toBe("restore");
    });
  });

  describe("圆环", () => {
    it("按 size 计算默认直径与线宽", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "circle" } as ProgressConfig,
      });

      renderer.render(context);

      // medium: floor(32 * 0.75) = 24；strokeWidth = max(2, round(2.88)) = 3；radius = 10.5
      expect(callsOf(ctx, "arc")[0]).toEqual([100, 16, 10.5, 0, Math.PI * 2]);
    });

    it("轨道与进度分别描边", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "circle" } as ProgressConfig,
      });

      renderer.render(context);

      const arcs = callsOf(ctx, "arc");
      expect(arcs).toHaveLength(2);
      // 从 12 点方向顺时针扫过半圈
      expect(arcs[1]).toEqual([100, 16, 10.5, -Math.PI / 2, Math.PI / 2]);
      expect(callsOf(ctx, "stroke")).toHaveLength(2);
    });

    it("进度为 0 时只画轨道", () => {
      const { renderer, context, ctx } = build({
        value: { value: 0, shape: "circle" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")).toHaveLength(1);
    });

    it("size=small 时直径为 19、线宽 2", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "circle", size: "small" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")[0]).toEqual([100, 16, 8.5, 0, Math.PI * 2]);
      expect(rectSizes(ctx)).toEqual([]);
    });

    it("size=large 时直径为 28、线宽 3", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "circle", size: "large" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")[0]).toEqual([100, 16, 12.5, 0, Math.PI * 2]);
    });

    it("config.width / strokeWidth / strokeLinecap 可覆盖", () => {
      const { renderer, context, ctx, sets } = build({
        value: {
          value: 50,
          shape: "circle",
          width: 40,
          strokeWidth: 4,
          strokeLinecap: "butt",
        } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")[0]).toEqual([100, 16, 18, 0, Math.PI * 2]);
      expect(sets).toContainEqual({ prop: "lineWidth", value: 4 });
      expect(sets).toContainEqual({ prop: "lineCap", value: "butt" });
    });

    it("文本居中于圆心并用加粗字体", () => {
      const { renderer, context, ctx, sets, theme } = build({
        value: { value: 50, shape: "circle" } as ProgressConfig,
      });

      renderer.render(context);

      // fontSize = max(8, round(24 * 0.32)) = 8
      expect(callsOf(ctx, "fillText")[0]).toEqual(["50%", 100, 16, undefined]);
      expect(sets).toContainEqual({ prop: "font", value: `bold 8px ${theme.font.family}` });
      expect(sets).toContainEqual({ prop: "textAlign", value: "center" });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
    });

    it("showText=false 时不绘制文本", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "circle", showText: false } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([]);
    });

    it("trackColor 覆盖轨道色", () => {
      const { renderer, context, sets } = build({
        value: { value: 50, shape: "circle", trackColor: "#00ff00" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "strokeStyle", value: "#00ff00" });
    });

    it("precision 控制小数位数", () => {
      const { renderer, context, ctx } = build({
        value: { value: 45.62, shape: "circle", precision: 1 } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("45.6%");
    });

    it("format 优先于内置格式化", () => {
      const format = jest.fn((v: number) => `~${v}`);
      const { renderer, context, ctx } = build({
        value: { value: 40, shape: "circle", format } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("~40");
      expect(format).toHaveBeenCalledWith(40);
    });
  });

  describe("仪表盘", () => {
    it("轨道从 135° 扫过 270°", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "dashboard" } as ProgressConfig,
      });

      renderer.render(context);

      // medium: floor(32 * 0.85) = 27；strokeWidth = max(2, round(2.7)) = 3；radius = 12
      // centerY = 16 + 32 * 0.05 = 17.6
      // 注：共享 mock 的 arc 只记录前 5 个参数，第 6 个 counterclockwise 不入账
      const startAngle = Math.PI * 0.75;
      const totalAngle = Math.PI * 1.5;
      expect(callsOf(ctx, "arc")[0]).toEqual([100, 17.6, 12, startAngle, startAngle + totalAngle]);
    });

    it("进度弧按比例扫过", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "dashboard" } as ProgressConfig,
      });

      renderer.render(context);

      const startAngle = Math.PI * 0.75;
      const totalAngle = Math.PI * 1.5;
      expect(callsOf(ctx, "arc")[1]).toEqual([
        100,
        17.6,
        12,
        startAngle,
        startAngle + 0.5 * totalAngle,
      ]);
    });

    it("进度为 0 时只画轨道", () => {
      const { renderer, context, ctx } = build({
        value: { value: 0, shape: "dashboard" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")).toHaveLength(1);
    });

    it("size=small 时直径为 22", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "dashboard", size: "small" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")[0]![2]).toBe(10);
    });

    it("size=large 时直径为 30", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "dashboard", size: "large" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")[0]![2]).toBe(13.5);
    });

    it("文本居中于圆心", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "dashboard" } as ProgressConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![1]).toBe(100);
      expect(callsOf(ctx, "fillText")[0]![2]).toBe(17.6);
    });

    it("showText=false 时不绘制文本", () => {
      const { renderer, context, ctx } = build({
        value: { value: 50, shape: "dashboard", showText: false } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([]);
    });

    it("strokeLinecap 覆盖默认线帽", () => {
      const { renderer, context, sets } = build({
        value: { value: 50, shape: "dashboard", strokeLinecap: "square" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "lineCap", value: "square" });
    });

    it("precision 控制小数位数", () => {
      const { renderer, context, ctx } = build({
        value: { value: 33.333, shape: "dashboard", precision: 2 } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("33.33%");
    });

    it("format 优先于内置格式化", () => {
      const format = jest.fn((v: number) => `${v} 分`);
      const { renderer, context, ctx } = build({
        value: { value: 60, shape: "dashboard", format } as ProgressConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("60 分");
      expect(format).toHaveBeenCalledWith(60);
    });
  });

  describe("进度色", () => {
    it("默认取 progress.default", () => {
      const { renderer, context, sets, theme } = build();

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.progress.default });
    });

    it("status=success 取 progress.success", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: 50, status: "success" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.progress.success });
    });

    it("status=warning 取 progress.warning", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: 50, status: "warning" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.progress.warning });
    });

    it("status=error 取 progress.error", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: 50, status: "error" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.progress.error });
    });

    it("status 优先于 color", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: 50, status: "success", color: "#123456" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.progress.success });
      expect(sets).not.toContainEqual({ prop: "fillStyle", value: "#123456" });
    });

    it("color 为字符串时直接使用", () => {
      const { renderer, context, sets } = build({
        value: { value: 50, color: "#123456" } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#123456" });
    });

    it("color 为函数时按 clamp 后的值计算", () => {
      const color = jest.fn((v: number) => `rgb(${v}, 0, 0)`);
      const { renderer, context, sets } = build({
        value: { value: 150, color } as ProgressConfig,
      });

      renderer.render(context);

      expect(color).toHaveBeenCalledWith(100);
      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgb(100, 0, 0)" });
    });

    it("color 为区间：低于最低档取最低档颜色", () => {
      const stops: ProgressColorStop[] = [
        { value: 30, color: "#ff0000" },
        { value: 70, color: "#ffff00" },
        { value: 100, color: "#00ff00" },
      ];
      const { renderer, context, sets } = build({
        value: { value: 10, color: stops } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#ff0000" });
    });

    it("color 为区间：高于最高档取最高档颜色", () => {
      const stops: ProgressColorStop[] = [
        { value: 30, color: "#ff0000" },
        { value: 70, color: "#ffff00" },
        { value: 100, color: "#00ff00" },
      ];
      const { renderer, context, sets } = build({
        value: { value: 100, color: stops } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#00ff00" });
    });

    it("color 为区间：中间值做线性插值", () => {
      const stops: ProgressColorStop[] = [
        { value: 0, color: "#000000" },
        { value: 100, color: "#ffffff" },
      ];
      const { renderer, context, sets } = build({
        value: { value: 50, color: stops } as ProgressConfig,
      });

      renderer.render(context);

      // r = g = b = round(0 + 255 * 0.5) = 128
      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgb(128, 128, 128)" });
    });

    it("color 为区间：乱序区间会先排序", () => {
      const stops: ProgressColorStop[] = [
        { value: 100, color: "#ffffff" },
        { value: 0, color: "#000000" },
      ];
      const { renderer, context, sets } = build({
        value: { value: 50, color: stops } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgb(128, 128, 128)" });
    });

    it("color 为空数组时回退到默认色", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: 50, color: [] } as ProgressConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.progress.default });
    });

    it("插值中遇到非法 hex 时按黑色处理", () => {
      const stops: ProgressColorStop[] = [
        { value: 0, color: "not-a-color" },
        { value: 100, color: "#ffffff" },
      ];
      const { renderer, context, sets } = build({
        value: { value: 50, color: stops } as ProgressConfig,
      });

      renderer.render(context);

      // rgb1 = {0,0,0}，rgb2 = {255,255,255} → 128
      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgb(128, 128, 128)" });
    });
  });
});
