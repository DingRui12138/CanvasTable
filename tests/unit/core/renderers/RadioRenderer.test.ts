import { RadioRenderer } from "@/core/renderers/RadioRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import type { Column, RadioConfig, RadioOption, Row } from "@/types";
import { zhCN } from "@/locale";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, callsOf, textsOf, methodNamesOf } from "../../helpers/canvasInspect";

function build(overrides: Partial<CellRendererContext> = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const column: Column = { key: "r", title: "R", width: 300, type: "radio" };
  const row: Row = { id: "r0", data: {} };

  const context = {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    theme,
    locale: zhCN,
    layoutManager: {} as CellRendererContext["layoutManager"],
    x: 0,
    y: 0,
    width: 300,
    height: 32,
    column,
    row,
    rowIndex: 0,
    colIndex: 0,
    value: { options: [] } as RadioConfig,
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;

  return { renderer: new RadioRenderer(), context, ctx, sets, theme };
}

/** 单元格高度 32、圆 16 → 圆心 y = 16；x=0 时首个选项圆心 x = 16 */
const CENTER_Y = 16;
const FIRST_CENTER_X = 16;

describe("RadioRenderer", () => {
  it("type 为 radio", () => {
    expect(new RadioRenderer().type).toBe("radio");
  });

  it("返回 radio 类型和原始 config", () => {
    const config: RadioConfig = { checked: true };
    const { renderer, context } = build({ value: config });

    expect(renderer.render(context)).toEqual({ type: "radio", config });
  });

  describe("裁剪与还原", () => {
    it("绘制前 save + rect + clip，结束后 restore", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      const names = methodNamesOf(ctx);
      expect(names[0]).toBe("save");
      expect(names).toContain("rect");
      expect(names).toContain("clip");
      expect(names[names.length - 1]).toBe("restore");
      expect(names.indexOf("save")).toBeLessThan(names.indexOf("clip"));
      expect(names.indexOf("clip")).toBeLessThan(names.indexOf("restore"));
    });

    it("裁剪矩形等于单元格边界", () => {
      const { renderer, context, ctx } = build({ x: 5, y: 7, width: 120, height: 40 });

      renderer.render(context);

      expect(callsOf(ctx, "rect")[0]).toEqual([5, 7, 120, 40]);
    });
  });

  describe("有 options", () => {
    const options: RadioOption[] = [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
    ];

    it("每个选项画一个半径 8 的圆", () => {
      const { renderer, context, ctx } = build({ value: { options } as RadioConfig });

      renderer.render(context);

      const arcs = callsOf(ctx, "arc");
      expect(arcs).toHaveLength(2);
      expect(arcs[0]).toEqual([FIRST_CENTER_X, CENTER_Y, 8, 0, Math.PI * 2]);
      // 第二项：8 + (16 + 4 + 7 + 8) = 43 → 圆心 51
      expect(arcs[1]).toEqual([51, CENTER_Y, 8, 0, Math.PI * 2]);
    });

    it("绘制选项标签文本", () => {
      const { renderer, context, ctx } = build({ value: { options } as RadioConfig });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["A", "B"]);
      // 文本 x = radioX + 16 + 4
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(28);
      expect(callsOf(ctx, "fillText")[1]![1]).toBe(63);
    });

    it("文本垂直居中于圆心", () => {
      const { renderer, context, ctx } = build({ value: { options } as RadioConfig });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![2]).toBe(CENTER_Y);
      expect(callsOf(ctx, "fillText")[1]![2]).toBe(CENTER_Y);
    });

    it("使用主题字体并设置 middle 基线", () => {
      const { renderer, context, sets, theme } = build({ value: { options } as RadioConfig });

      renderer.render(context);

      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
    });

    it("选中项在圆内再画一个半径 4 的实心圆", () => {
      const { renderer, context, ctx } = build({
        value: { options, value: "b" } as RadioConfig,
      });

      renderer.render(context);

      const arcs = callsOf(ctx, "arc");
      expect(arcs).toHaveLength(3);
      expect(arcs[2]).toEqual([51, CENTER_Y, 4, 0, Math.PI * 2]);
    });

    it("选中项内圆用 radio.checkedBg", () => {
      const { renderer, context, sets, theme } = build({
        value: { options, value: "a" } as RadioConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.radio.checkedBg });
    });

    it("config.value 不匹配任何选项时不画内圆", () => {
      const { renderer, context, ctx } = build({
        value: { options, value: "zzz" } as RadioConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")).toHaveLength(2);
    });

    it("未选中项的圆底色用 button.background", () => {
      const { renderer, context, sets, theme } = build({ value: { options } as RadioConfig });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.background });
    });

    it("圆边框用 radio.border，线宽 1", () => {
      const { renderer, context, sets, theme } = build({ value: { options } as RadioConfig });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.radio.border });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
    });
  });

  describe("选项禁用", () => {
    it("单个选项 disabled 时用 radio.disabledBg 与 placeholderText", () => {
      const options: RadioOption[] = [{ label: "A", value: "a", disabled: true }];
      const { renderer, context, sets, theme } = build({ value: { options } as RadioConfig });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.radio.disabledBg });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("列级禁用会让所有选项变灰", () => {
      const options: RadioOption[] = [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ];
      const { renderer, context, sets, theme } = build({
        value: { options } as RadioConfig,
        isDisabled: true,
      });

      renderer.render(context);

      const disabledBgSets = sets.filter(
        (s) => s.prop === "fillStyle" && s.value === theme.colors.radio.disabledBg,
      );
      expect(disabledBgSets).toHaveLength(2);
      expect(sets).not.toContainEqual({
        prop: "fillStyle",
        value: theme.colors.button.background,
      });
    });

    it("isDisabled 为 undefined 时按未禁用处理", () => {
      const options: RadioOption[] = [{ label: "A", value: "a" }];
      const { renderer, context, sets, theme } = build({
        value: { options } as RadioConfig,
        isDisabled: undefined as unknown as boolean,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.background });
    });

    it("禁用时选中内圆用 radio.border 而不是 checkedBg", () => {
      const options: RadioOption[] = [{ label: "A", value: "a" }];
      const { renderer, context, ctx, sets, theme } = build({
        value: { options, value: "a" } as RadioConfig,
        isDisabled: true,
      });

      renderer.render(context);

      expect(sets).not.toContainEqual({ prop: "fillStyle", value: theme.colors.radio.checkedBg });
      const arcs = callsOf(ctx, "arc");
      expect(arcs).toHaveLength(2); // 外圆 + 内圆
      const borderFills = sets.filter(
        (s) => s.prop === "fillStyle" && s.value === theme.colors.radio.border,
      );
      expect(borderFills).toHaveLength(1); // 内圆
    });
  });

  describe("空间不足", () => {
    it("放不下首个选项时直接跳过，不画圆也不画文字", () => {
      const options: RadioOption[] = [{ label: "A", value: "a" }];
      // maxX = 40 - 8 = 32；8 + 35 - 8 = 35 > 32 → break
      const { renderer, context, ctx } = build({
        value: { options } as RadioConfig,
        width: 40,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")).toHaveLength(0);
      expect(textsOf(ctx)).toEqual([]);
    });

    it("放不下后续选项时中断循环，只画能放下的部分", () => {
      const options: RadioOption[] = [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ];
      // maxX = 60 - 8 = 52；首项 8+35-8=35 ≤ 52 通过，次项 43+35-8=70 > 52 中断
      const { renderer, context, ctx } = build({
        value: { options } as RadioConfig,
        width: 60,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")).toHaveLength(1);
      expect(textsOf(ctx)).toEqual(["A"]);
    });
  });

  describe("无 options（单选圆）", () => {
    it("options 缺失时在单元格中央画一个圆", () => {
      const { renderer, context, ctx } = build({ value: {} as RadioConfig });

      renderer.render(context);

      // x=0,w=300 → radioX = (300-16)/2 = 142 → 圆心 150
      expect(callsOf(ctx, "arc")).toEqual([[150, CENTER_Y, 8, 0, Math.PI * 2]]);
      expect(textsOf(ctx)).toEqual([]);
    });

    it("options 为空数组时同样走单选圆路径", () => {
      const { renderer, context, ctx } = build({ value: { options: [] } as RadioConfig });

      renderer.render(context);

      expect(callsOf(ctx, "arc")).toHaveLength(1);
    });

    it("checked 时画内圆", () => {
      const { renderer, context, ctx } = build({
        value: { checked: true } as RadioConfig,
      });

      renderer.render(context);

      const arcs = callsOf(ctx, "arc");
      expect(arcs).toHaveLength(2);
      expect(arcs[1]).toEqual([150, CENTER_Y, 4, 0, Math.PI * 2]);
    });

    it("checked 时内圆用 radio.checkedBg", () => {
      const { renderer, context, sets, theme } = build({
        value: { checked: true } as RadioConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.radio.checkedBg });
    });

    it("未 checked 时不画内圆", () => {
      const { renderer, context, ctx } = build({
        value: { checked: false } as RadioConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "arc")).toHaveLength(1);
    });

    it("列级禁用时外圆用 radio.disabledBg", () => {
      const { renderer, context, sets, theme } = build({
        value: {} as RadioConfig,
        isDisabled: true,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.radio.disabledBg });
    });

    it("列级禁用且 checked 时内圆用 radio.border", () => {
      const { renderer, context, sets, theme } = build({
        value: { checked: true } as RadioConfig,
        isDisabled: true,
      });

      renderer.render(context);

      expect(sets).not.toContainEqual({ prop: "fillStyle", value: theme.colors.radio.checkedBg });
      const borderSets = sets.filter(
        (s) => s.prop === "fillStyle" && s.value === theme.colors.radio.border,
      );
      expect(borderSets).toHaveLength(1);
    });
  });
});
