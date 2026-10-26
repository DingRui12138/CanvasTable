import { ColorRenderer } from "@/core/renderers/ColorRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import type { ColorPickerConfig, Column, Row } from "@/types";
import { zhCN } from "@/locale";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, callsOf, textsOf, methodNamesOf } from "../../helpers/canvasInspect";

function build(overrides: Partial<CellRendererContext> = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const column: Column = { key: "c", title: "C", width: 100, type: "color" };
  const row: Row = { id: "r0", data: {} };

  const context = {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    theme,
    locale: zhCN,
    layoutManager: {} as CellRendererContext["layoutManager"],
    x: 0,
    y: 0,
    width: 100,
    height: 32,
    column,
    row,
    rowIndex: 0,
    colIndex: 0,
    value: { value: "#1890ff" } as ColorPickerConfig,
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;

  return { renderer: new ColorRenderer(), context, ctx, sets, theme };
}

/** colorBoxSize = min(32 - 16, 24) = 16；x=0/w=100 → 起点 (42, 8) */
const BOX_X = 42;
const BOX_Y = 8;
const BOX_SIZE = 16;

/** 取出最后一次设置的 fillStyle（文字色会覆盖方块底色） */
function lastFillStyle(sets: { prop: string; value: unknown }[]): unknown {
  const fills = sets.filter((s) => s.prop === "fillStyle");
  return fills[fills.length - 1]?.value;
}

describe("ColorRenderer", () => {
  it("type 为 color", () => {
    expect(new ColorRenderer().type).toBe("color");
  });

  it("返回 color 类型和原始 config", () => {
    const config: ColorPickerConfig = { value: "#ff0000" };
    const { renderer, context } = build({ value: config });

    expect(renderer.render(context)).toEqual({ type: "color", config });
  });

  describe("色块", () => {
    it("在单元格中央画 16x16 的色块", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      expect(callsOf(ctx, "fillRect")[0]).toEqual([BOX_X, BOX_Y, BOX_SIZE, BOX_SIZE]);
      expect(callsOf(ctx, "strokeRect")[0]).toEqual([BOX_X, BOX_Y, BOX_SIZE, BOX_SIZE]);
    });

    it("先填充再描边", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      const names = methodNamesOf(ctx);
      expect(names.indexOf("fillRect")).toBeLessThan(names.indexOf("strokeRect"));
    });

    it("底色取自 config.value", () => {
      const { renderer, context, sets } = build({ value: { value: "#ff00aa" } as ColorPickerConfig });

      renderer.render(context);

      expect(sets[0]).toEqual({ prop: "fillStyle", value: "#ff00aa" });
    });

    it("config.value 为空串时回退到 #ffffff", () => {
      const { renderer, context, sets } = build({ value: { value: "" } as ColorPickerConfig });

      renderer.render(context);

      expect(sets[0]).toEqual({ prop: "fillStyle", value: "#ffffff" });
    });

    it("启用时描边为 #d9d9d9，线宽 1", () => {
      const { renderer, context, sets } = build({ isDisabled: false });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "strokeStyle", value: "#d9d9d9" });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
    });

    it("禁用时描边为 #bdbdbd", () => {
      const { renderer, context, sets } = build({ isDisabled: true });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "strokeStyle", value: "#bdbdbd" });
      expect(sets).not.toContainEqual({ prop: "strokeStyle", value: "#d9d9d9" });
    });
  });

  describe("颜色文本", () => {
    it("showText 未开启时不绘制文本", () => {
      const { renderer, context, ctx, sets } = build({
        value: { value: "#1890ff" } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([]);
      expect(sets.filter((s) => s.prop === "textAlign")).toHaveLength(0);
    });

    it("showText 开启时在色块中央绘制颜色值", () => {
      const { renderer, context, ctx } = build({
        value: { value: "#1890ff", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["#1890ff"]);
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(BOX_X + BOX_SIZE / 2);
      expect(callsOf(ctx, "fillText")[0]![2]).toBe(BOX_Y + BOX_SIZE / 2);
    });

    it("showText 时设置居中与 middle 基线，并使用主题字体", () => {
      const { renderer, context, sets, theme } = build({
        value: { value: "#1890ff", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "textAlign", value: "center" });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
    });

    it("showText 且 value 为空串时绘制空串", () => {
      const { renderer, context, ctx } = build({
        value: { value: "", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([""]);
    });
  });

  describe("对比色计算", () => {
    it("纯白底 → 黑色文字", () => {
      const { renderer, context, sets } = build({
        value: { value: "#ffffff", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(lastFillStyle(sets)).toBe("#000000");
    });

    it("纯黑底 → 白色文字", () => {
      const { renderer, context, sets } = build({
        value: { value: "#000000", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(lastFillStyle(sets)).toBe("#ffffff");
    });

    it("亮度略高于 0.5 的灰 → 黑色文字", () => {
      // 0x80 / 255 = 0.50196 > 0.5
      const { renderer, context, sets } = build({
        value: { value: "#808080", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(lastFillStyle(sets)).toBe("#000000");
    });

    it("亮度略低于 0.5 的灰 → 白色文字", () => {
      // 0x7f / 255 = 0.49803 < 0.5
      const { renderer, context, sets } = build({
        value: { value: "#7f7f7f", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(lastFillStyle(sets)).toBe("#ffffff");
    });

    it("不带 # 前缀的 hex 也能解析", () => {
      const { renderer, context, sets } = build({
        value: { value: "ffffff", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(lastFillStyle(sets)).toBe("#000000");
    });

    it("非法 hex 按白色处理 → 黑色文字", () => {
      const { renderer, context, sets } = build({
        value: { value: "red", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(lastFillStyle(sets)).toBe("#000000");
    });

    it("空串回退到白色 → 黑色文字", () => {
      const { renderer, context, sets } = build({
        value: { value: "", showText: true } as ColorPickerConfig,
      });

      renderer.render(context);

      expect(lastFillStyle(sets)).toBe("#000000");
    });
  });
});
