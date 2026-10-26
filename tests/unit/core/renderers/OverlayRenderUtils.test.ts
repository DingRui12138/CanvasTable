import {
  resetShadow,
  applyThemeShadow,
  drawOverlayPanel,
  renderOverlayVerticalScrollbar,
} from "@/core/renderers/OverlayRenderUtils";
import type { TableTheme } from "@/types";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, callsOf, methodNamesOf } from "../../helpers/canvasInspect";

type PanelOptions = Parameters<typeof drawOverlayPanel>[2];

function panel(overrides: Partial<PanelOptions> = {}): PanelOptions {
  return {
    x: 10,
    y: 20,
    width: 100,
    height: 60,
    fillStyle: "#ffffff",
    ...overrides,
  };
}

/** 取出按顺序设置的阴影相关属性 */
function shadowSets(sets: { prop: string; value: unknown }[]) {
  return sets.filter((s) => s.prop.startsWith("shadow"));
}

describe("OverlayRenderUtils", () => {
  let theme: TableTheme;

  beforeEach(() => {
    theme = createMockTheme();
  });

  describe("resetShadow", () => {
    it("把阴影四个属性全部归零", () => {
      const { ctx, sets } = createTrackedContext();

      resetShadow(ctx);

      expect(sets).toEqual([
        { prop: "shadowColor", value: "transparent" },
        { prop: "shadowBlur", value: 0 },
        { prop: "shadowOffsetX", value: 0 },
        { prop: "shadowOffsetY", value: 0 },
      ]);
    });

    it("可以从非零阴影状态恢复", () => {
      const { ctx } = createTrackedContext();
      ctx.shadowColor = "red";
      ctx.shadowBlur = 12;

      resetShadow(ctx);

      expect(ctx.shadowColor).toBe("transparent");
      expect(ctx.shadowBlur).toBe(0);
    });
  });

  describe("applyThemeShadow", () => {
    it("从主题读取阴影四个属性", () => {
      const { ctx, sets } = createTrackedContext();

      applyThemeShadow(ctx, theme);

      expect(sets).toEqual([
        { prop: "shadowColor", value: theme.colors.shadow.color },
        { prop: "shadowBlur", value: theme.colors.shadow.blur },
        { prop: "shadowOffsetX", value: theme.colors.shadow.offsetX },
        { prop: "shadowOffsetY", value: theme.colors.shadow.offsetY },
      ]);
    });

    it("使用传入主题而不是内置默认值", () => {
      const { ctx } = createTrackedContext();
      const custom: TableTheme = {
        ...theme,
        colors: {
          ...theme.colors,
          shadow: { color: "rgba(1, 2, 3, 0.5)", blur: 8, offsetX: 2, offsetY: -3 },
        },
      };

      applyThemeShadow(ctx, custom);

      expect(ctx.shadowColor).toBe("rgba(1, 2, 3, 0.5)");
      expect(ctx.shadowBlur).toBe(8);
      expect(ctx.shadowOffsetX).toBe(2);
      expect(ctx.shadowOffsetY).toBe(-3);
    });
  });

  describe("drawOverlayPanel", () => {
    it("默认圆角半径为 6", () => {
      const { ctx } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel());

      expect(callsOf(ctx, "roundRect")[0]).toEqual([10, 20, 100, 60, 6]);
    });

    it("显式半径覆盖默认值", () => {
      const { ctx } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ radius: 0 }));

      expect(callsOf(ctx, "roundRect")[0]).toEqual([10, 20, 100, 60, 0]);
    });

    it("用 fillStyle 填充圆角面板", () => {
      const { ctx, sets } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ fillStyle: "#abcdef" }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#abcdef" });
      expect(methodNamesOf(ctx)).toEqual(["beginPath", "roundRect", "fill"]);
    });

    it("不传 shadow 时完全不触碰阴影属性", () => {
      const { ctx, sets } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel());

      expect(shadowSets(sets)).toEqual([]);
    });

    it("shadow 为 true 时先上阴影、填充后立刻复位", () => {
      const { ctx, sets } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ shadow: true }));

      expect(shadowSets(sets)).toEqual([
        { prop: "shadowColor", value: theme.colors.shadow.color },
        { prop: "shadowBlur", value: theme.colors.shadow.blur },
        { prop: "shadowOffsetX", value: theme.colors.shadow.offsetX },
        { prop: "shadowOffsetY", value: theme.colors.shadow.offsetY },
        { prop: "shadowColor", value: "transparent" },
        { prop: "shadowBlur", value: 0 },
        { prop: "shadowOffsetX", value: 0 },
        { prop: "shadowOffsetY", value: 0 },
      ]);
    });

    it("阴影在填充之前设置、在填充之后复位", () => {
      const { ctx, sets } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ shadow: true }));

      const seq = sets.map((s) => `${s.prop}=${String(s.value)}`);
      const applyIdx = seq.indexOf(`shadowColor=${theme.colors.shadow.color}`);
      const fillIdx = seq.indexOf("fillStyle=#ffffff");
      const resetIdx = seq.indexOf("shadowColor=transparent");

      expect(applyIdx).toBeLessThan(fillIdx);
      expect(resetIdx).toBeGreaterThan(fillIdx);
    });

    it("shadow 为 false 时不启用阴影", () => {
      const { ctx, sets } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ shadow: false }));

      expect(shadowSets(sets)).toEqual([]);
    });

    it("clip 为 true 时在面板路径上裁剪", () => {
      const { ctx } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ clip: true }));

      expect(methodNamesOf(ctx)).toEqual([
        "beginPath",
        "roundRect",
        "fill",
        "beginPath",
        "roundRect",
        "clip",
      ]);
      expect(callsOf(ctx, "clip")).toHaveLength(1);
    });

    it("裁剪路径复用同一套坐标与圆角", () => {
      const { ctx } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ clip: true, radius: 4 }));

      expect(callsOf(ctx, "roundRect")).toEqual([
        [10, 20, 100, 60, 4],
        [10, 20, 100, 60, 4],
      ]);
    });

    it("不传 clip 时不裁剪", () => {
      const { ctx } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel());

      expect(callsOf(ctx, "clip")).toHaveLength(0);
    });

    it("strokeStyle 存在时描边，线宽固定 1", () => {
      const { ctx, sets } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ strokeStyle: "#ff0000" }));

      expect(sets).toContainEqual({ prop: "strokeStyle", value: "#ff0000" });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
      expect(methodNamesOf(ctx)).toEqual([
        "beginPath",
        "roundRect",
        "fill",
        "beginPath",
        "roundRect",
        "stroke",
      ]);
    });

    it("不传 strokeStyle 时不描边", () => {
      const { ctx, sets } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel());

      expect(callsOf(ctx, "stroke")).toHaveLength(0);
      expect(sets).not.toContainEqual({ prop: "lineWidth", value: 1 });
    });

    it("shadow + clip + stroke 同时开启时共用同一套路径坐标", () => {
      const { ctx } = createTrackedContext();

      drawOverlayPanel(ctx, theme, panel({ shadow: true, clip: true, strokeStyle: "#000" }));

      expect(callsOf(ctx, "roundRect")).toEqual([
        [10, 20, 100, 60, 6],
        [10, 20, 100, 60, 6],
        [10, 20, 100, 60, 6],
      ]);
      expect(callsOf(ctx, "beginPath")).toHaveLength(3);
      expect(callsOf(ctx, "fill")).toHaveLength(1);
      expect(callsOf(ctx, "clip")).toHaveLength(1);
      expect(callsOf(ctx, "stroke")).toHaveLength(1);
    });
  });

  describe("renderOverlayVerticalScrollbar", () => {
    // createMockTheme 的 scrollbar.opacity 恰好是 1，与「恢复原值」的期望值撞车，
    // 这里换成有区分度的透明度，才能真正确认用的是主题值而不是硬编码。
    const OPACITY = 0.42;
    let sbTheme: TableTheme;

    beforeEach(() => {
      sbTheme = {
        ...theme,
        colors: {
          ...theme.colors,
          scrollbar: { ...theme.colors.scrollbar, opacity: OPACITY },
        },
      };
    });

    const draw = (ctx: ReturnType<typeof createTrackedContext>["ctx"]) =>
      renderOverlayVerticalScrollbar(ctx, sbTheme, 300, 40, 8, 200, 60, 80);

    it("用主题透明度绘制", () => {
      const { ctx, sets } = createTrackedContext();

      draw(ctx);

      expect(sets).toContainEqual({ prop: "globalAlpha", value: OPACITY });
    });

    it("画完滑轨与滑块后恢复原始透明度", () => {
      const { ctx, sets } = createTrackedContext();

      draw(ctx);

      const alphas = sets.filter((s) => s.prop === "globalAlpha").map((s) => s.value);
      expect(alphas).toEqual([OPACITY, 1]);
    });

    it("恢复的是调用前的透明度而不是硬编码 1", () => {
      const { ctx, sets } = createTrackedContext();
      ctx.globalAlpha = 0.5;
      const before = sets.length;

      draw(ctx);

      const alphas = sets
        .slice(before)
        .filter((s) => s.prop === "globalAlpha")
        .map((s) => s.value);
      expect(alphas).toEqual([OPACITY, 0.5]);
      expect(ctx.globalAlpha).toBe(0.5);
    });

    it("先画滑轨再画滑块", () => {
      const { ctx, sets } = createTrackedContext();

      draw(ctx);

      const fills = sets.filter((s) => s.prop === "fillStyle").map((s) => s.value);
      expect(fills).toEqual([theme.colors.scrollbar.track, theme.colors.scrollbar.thumb]);
      expect(callsOf(ctx, "fillRect")).toEqual([
        [300, 40, 8, 200],
        [300, 60, 8, 80],
      ]);
    });

    it("滑轨与滑块宽度一致", () => {
      const { ctx } = createTrackedContext();

      draw(ctx);

      const rects = callsOf(ctx, "fillRect");
      expect(rects[0]![2]).toBe(rects[1]![2]);
    });
  });
});
