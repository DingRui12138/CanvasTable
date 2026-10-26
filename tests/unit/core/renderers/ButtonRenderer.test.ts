import { ButtonRenderer } from "@/core/renderers/ButtonRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import { zhCN } from "@/locale";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, textsOf, callsOf } from "../../helpers/canvasInspect";
import type { ButtonConfig, ButtonsOptions, Column, Row, TableTheme } from "@/types";

const createCtx = createTrackedContext;
const texts = textsOf;

function baseContext(
  overrides: Partial<CellRendererContext> & { value?: unknown } = {},
): CellRendererContext {
  const { ctx } = createCtx();
  const theme = createMockTheme();
  const column: Column = { key: "btn", title: "Btn", width: 200, type: "button" };
  const row: Row = { id: "r0", data: {} };
  return {
    ctx,
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
    value: undefined,
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;
}

/** 用受控 ctx + theme 构建 context，便于断言绘制细节 */
function build(options: {
  value: unknown;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  isDisabled?: boolean;
  /** 显式让 context.isDisabled 保持 undefined，用于覆盖源码里的 `isDisabled ?? false` 兜底分支 */
  omitIsDisabled?: boolean;
  hoverProgress?: number;
  hoveredButtonIndex?: number;
  buttonOptions?: ButtonsOptions;
  theme?: TableTheme;
}) {
  const { ctx, sets } = createCtx();
  const theme = options.theme ?? createMockTheme();
  const context = baseContext({
    ctx,
    theme,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 200,
    height: options.height ?? 32,
    value: options.value,
    isDisabled: options.omitIsDisabled
      ? (undefined as unknown as boolean)
      : (options.isDisabled ?? false),
    buttonOptions: options.buttonOptions,
    hoveredButtonIndex: options.hoveredButtonIndex,
    buttonHoverState:
      options.hoverProgress === undefined
        ? undefined
        : {
            cell: { rowIndex: 0, columnIndex: 0 },
            progress: options.hoverProgress,
            targetProgress: options.hoverProgress,
            startTime: 0,
            startProgress: 0,
          },
  });
  return { renderer: new ButtonRenderer(), context, ctx, sets, theme };
}

describe("ButtonRenderer", () => {
  describe("类型声明", () => {
    it("type 为 button", () => {
      expect(new ButtonRenderer().type).toBe("button");
    });
  });

  describe("单按钮 - 尺寸与位置", () => {
    it("默认尺寸按钮高度 32，并按文本宽度居中", () => {
      const { renderer, context, ctx } = build({ value: { text: "OK" } });

      const result = renderer.render(context);

      // textWidth = 2*7 = 14 → max(14+32, 60) = 60 → min(60, 200-16) = 60
      // buttonX = 0 + (200-60)/2 = 70
      expect(callsOf(ctx, "roundRect")[0]).toEqual([70, 0, 60, 32, 4]);
      expect(result).toMatchObject({ type: "button" });
    });

    it("size 为 small 时按钮高度 24", () => {
      const { renderer, context, ctx } = build({ value: { text: "OK", size: "small" } });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")[0]![3]).toBe(24);
      expect(callsOf(ctx, "roundRect")[0]![1]).toBe(4);
    });

    it("size 为 large 时按钮高度 40", () => {
      const { renderer, context, ctx } = build({
        value: { text: "OK", size: "large" },
        height: 48,
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")[0]![3]).toBe(40);
      expect(callsOf(ctx, "roundRect")[0]![1]).toBe(4);
    });

    it("单元格过窄时按钮宽度被压缩到 width - 16", () => {
      const { renderer, context, ctx } = build({ value: { text: "OK" }, width: 40 });

      renderer.render(context);

      // min(60, 40-16=24) = 24 → buttonX = (40-24)/2 = 8
      expect(callsOf(ctx, "roundRect")[0]).toEqual([8, 0, 24, 32, 4]);
    });

    it("文本很长时按钮宽度按文本撑开", () => {
      const { renderer, context, ctx } = build({ value: { text: "abcdefghij" }, width: 300 });

      renderer.render(context);

      // textWidth = 70 → max(70+32, 60) = 102 → min(102, 284) = 102
      expect(callsOf(ctx, "roundRect")[0]![2]).toBe(102);
    });

    it("未提供 text 时回退到 locale.cell.buttonText", () => {
      const { renderer, context, ctx } = build({ value: {} });

      renderer.render(context);

      expect(texts(ctx)).toEqual([zhCN.cell.buttonText]);
    });

    it("文本居中绘制并恢复 textAlign", () => {
      const { renderer, context, ctx, sets } = build({ value: { text: "OK" } });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![1]).toBe(70 + 30);
      expect(callsOf(ctx, "fillText")[0]![2]).toBe(16);
      expect(sets).toContainEqual({ prop: "textAlign", value: "center" });
      expect(sets[sets.length - 1]).toEqual({ prop: "textAlign", value: "left" });
    });
  });

  describe("单按钮 - 变体配色", () => {
    it.each([
      ["primary", "primaryBg", "primaryText"],
      ["danger", "dangerBg", "dangerText"],
      ["warning", "warningBg", "warningText"],
    ])("variant=%s 使用对应主题色", (variant, bgKey, textKey) => {
      const { renderer, context, sets, theme } = build({ value: { text: "OK", variant } });

      renderer.render(context);

      const colors = theme.colors.button as unknown as Record<string, string>;
      expect(sets).toContainEqual({ prop: "fillStyle", value: colors[bgKey] });
      expect(sets).toContainEqual({ prop: "fillStyle", value: colors[textKey] });
      // 边框色与背景色一致
      expect(sets).toContainEqual({ prop: "strokeStyle", value: colors[bgKey] });
    });

    it("variant=link 时背景与边框透明", () => {
      const { renderer, context, sets, theme } = build({ value: { text: "OK", variant: "link" } });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "transparent" });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: "transparent" });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.linkText });
    });

    it("未指定 variant 时使用默认配色", () => {
      const { renderer, context, sets, theme } = build({ value: { text: "OK" } });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.background });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.text });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.button.border });
    });

    it("禁用状态使用禁用配色", () => {
      const { renderer, context, sets, theme } = build({
        value: { text: "OK", variant: "primary" },
        isDisabled: true,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledBg });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledText });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.button.disabledBorder });
    });

    it("始终以 1px 线宽描边", () => {
      const { renderer, context, sets } = build({ value: { text: "OK" } });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
    });

    it("未传入 isDisabled 时按未禁用处理", () => {
      const { renderer, context, sets, theme } = build({
        value: { text: "OK", variant: "primary" },
        omitIsDisabled: true,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.primaryBg });
      expect(sets).not.toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledBg });
    });
  });

  describe("单按钮 - 悬停动画", () => {
    it("浅色背景下按进度向黑色插值", () => {
      const { renderer, context, sets } = build({ value: { text: "OK" }, hoverProgress: 1 });

      renderer.render(context);

      // #ffffff 亮度 255 > 128 → hoverGray = round(255 - 1*0.2*255) = 204
      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgb(204, 204, 204)" });
    });

    it("深色背景下按进度向白色插值", () => {
      const theme = createMockTheme();
      theme.colors.button.background = "#000000";
      const { renderer, context, sets } = build({
        value: { text: "OK" },
        hoverProgress: 1,
        theme,
      });

      renderer.render(context);

      // 亮度 0 ≤ 128 → hoverGray = round(0 + 1*0.2*255) = 51
      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgb(51, 51, 51)" });
    });

    it("非法 hex 退化为黑色并按深色插值", () => {
      const theme = createMockTheme();
      theme.colors.button.background = "not-a-hex";
      const { renderer, context, sets } = build({
        value: { text: "OK" },
        hoverProgress: 1,
        theme,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "rgb(51, 51, 51)" });
    });

    it("非默认变体通过 globalAlpha 表达悬停并复位", () => {
      const { renderer, context, sets } = build({
        value: { text: "OK", variant: "primary" },
        hoverProgress: 0.5,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "globalAlpha", value: 0.9 });
      expect(sets).toContainEqual({ prop: "globalAlpha", value: 1 });
    });

    it("link 变体不参与悬停动画", () => {
      const { renderer, context, sets } = build({
        value: { text: "OK", variant: "link" },
        hoverProgress: 1,
      });

      renderer.render(context);

      expect(sets).not.toContainEqual({ prop: "globalAlpha", value: 0.8 });
      expect(sets).not.toContainEqual({ prop: "fillStyle", value: "rgb(204, 204, 204)" });
    });

    it("禁用状态不参与悬停动画", () => {
      const { renderer, context, sets, theme } = build({
        value: { text: "OK" },
        hoverProgress: 1,
        isDisabled: true,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledBg });
      expect(sets).not.toContainEqual({ prop: "fillStyle", value: "rgb(204, 204, 204)" });
    });
  });

  describe("多按钮", () => {
    const fourButtons: ButtonConfig[] = [
      { text: "A" },
      { text: "B" },
      { text: "C" },
      { text: "D" },
    ];

    it("按 maxVisible 截断并绘制更多按钮", () => {
      const { renderer, context, ctx } = build({ value: fourButtons });

      const result = renderer.render(context);

      const rects = callsOf(ctx, "roundRect");
      // 3 个可见按钮 + 1 个更多按钮
      expect(rects).toHaveLength(4);
      expect(rects[0]).toEqual([8, 4, 40, 24, 4]);
      expect(rects[1]).toEqual([52, 4, 40, 24, 4]);
      expect(rects[2]).toEqual([96, 4, 40, 24, 4]);
      // moreText = "···" → 21 + 16 = 37
      expect(rects[3]).toEqual([140, 4, 37, 24, 4]);
      expect(texts(ctx)).toEqual(["A", "B", "C", "···"]);
      expect(result).toMatchObject({ type: "button", config: fourButtons });
    });

    it("maxVisible 可自定义", () => {
      const { renderer, context, ctx } = build({
        value: fourButtons,
        buttonOptions: { maxVisible: 2 },
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toHaveLength(3);
      expect(texts(ctx)).toEqual(["A", "B", "···"]);
    });

    it("gap 可自定义", () => {
      const { renderer, context, ctx } = build({
        value: fourButtons,
        buttonOptions: { gap: 10, maxVisible: 2 },
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")[1]![0]).toBe(8 + 40 + 10);
    });

    it("moreButtonText 可自定义", () => {
      const { renderer, context, ctx } = build({
        value: fourButtons,
        buttonOptions: { moreButtonText: "more" },
      });

      renderer.render(context);

      // textWidth = 4*7 = 28 → max(28+16, 32) = 44
      expect(callsOf(ctx, "roundRect")[3]![2]).toBe(44);
      expect(texts(ctx)).toContain("more");
    });

    it("visible 为 false 的按钮被过滤", () => {
      const { renderer, context, ctx } = build({
        value: [{ text: "A" }, { text: "B", visible: false }, { text: "C" }],
      });

      renderer.render(context);

      expect(texts(ctx)).toEqual(["A", "C"]);
      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
    });

    it("按钮数量不超过 maxVisible 时不绘制更多按钮", () => {
      const { renderer, context, ctx } = build({ value: [{ text: "A" }, { text: "B" }] });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
      expect(texts(ctx)).toEqual(["A", "B"]);
    });

    it("全部按钮都不可见时不绘制任何内容", () => {
      const { renderer, context, ctx } = build({
        value: [{ text: "A", visible: false }],
      });

      renderer.render(context);

      expect(ctx.calls).toHaveLength(0);
    });

    it("未提供 text 时回退到 locale.cell.buttonText", () => {
      const { renderer, context, ctx } = build({ value: [{}, {}] });

      renderer.render(context);

      expect(texts(ctx)).toEqual([zhCN.cell.buttonText, zhCN.cell.buttonText]);
    });

    it("按钮宽度最小为 40", () => {
      const { renderer, context, ctx } = build({ value: [{ text: "A" }] });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")[0]![2]).toBe(40);
    });

    it("绘制结束后恢复 textAlign 为 left", () => {
      const { renderer, context, sets } = build({ value: [{ text: "A" }] });

      renderer.render(context);

      expect(sets[sets.length - 1]).toEqual({ prop: "textAlign", value: "left" });
    });
  });

  describe("多按钮 - 变体与悬停", () => {
    it.each([
      ["primary", "primaryBg", "primaryText"],
      ["danger", "dangerBg", "dangerText"],
      ["warning", "warningBg", "warningText"],
    ])("variant=%s 使用对应主题色", (variant, bgKey, textKey) => {
      const { renderer, context, sets, theme } = build({ value: [{ text: "A", variant }] });

      renderer.render(context);

      const colors = theme.colors.button as unknown as Record<string, string>;
      expect(sets).toContainEqual({ prop: "fillStyle", value: colors[bgKey] });
      expect(sets).toContainEqual({ prop: "fillStyle", value: colors[textKey] });
    });

    it("variant=link 时背景与边框透明", () => {
      const { renderer, context, sets, theme } = build({ value: [{ text: "A", variant: "link" }] });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "transparent" });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: "transparent" });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.linkText });
    });

    it("默认变体在悬停时使用 hoverBg", () => {
      const { renderer, context, sets, theme } = build({
        value: [{ text: "A" }, { text: "B" }],
        hoveredButtonIndex: 1,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.hoverBg });
    });

    it("未悬停的默认按钮使用普通背景色", () => {
      const { renderer, context, sets, theme } = build({ value: [{ text: "A" }] });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.background });
      expect(sets).not.toContainEqual({ prop: "fillStyle", value: theme.colors.button.hoverBg });
    });

    it("禁用状态下即使悬停也不使用 hoverBg", () => {
      const { renderer, context, sets, theme } = build({
        value: [{ text: "A" }],
        hoveredButtonIndex: 0,
        isDisabled: true,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledBg });
      expect(sets).not.toContainEqual({ prop: "fillStyle", value: theme.colors.button.hoverBg });
    });

    it("禁用状态下所有按钮使用禁用配色", () => {
      const { renderer, context, sets, theme } = build({
        value: [{ text: "A", variant: "primary" }, { text: "B" }],
        isDisabled: true,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledBg });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledText });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.button.disabledBorder });
    });
  });

  describe("多按钮 - 更多按钮", () => {
    const fiveButtons: ButtonConfig[] = [
      { text: "A" },
      { text: "B" },
      { text: "C" },
      { text: "D" },
      { text: "E" },
    ];

    it("悬停索引等于可见数量时更多按钮高亮", () => {
      const { renderer, context, sets, theme } = build({
        value: fiveButtons,
        hoveredButtonIndex: 3,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.hoverBg });
    });

    it("未悬停更多按钮时使用普通背景色", () => {
      const { renderer, context, sets, theme } = build({ value: fiveButtons });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.background });
    });

    it("禁用时更多按钮使用禁用配色", () => {
      const { renderer, context, sets, theme } = build({
        value: fiveButtons,
        isDisabled: true,
        hoveredButtonIndex: 3,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledBg });
      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.button.disabledBorder });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledText });
    });

    it("更多按钮最小宽度为 32", () => {
      const { renderer, context, ctx } = build({
        value: fiveButtons,
        buttonOptions: { moreButtonText: "x" },
      });

      renderer.render(context);

      // textWidth = 7 → max(7+16, 32) = 32
      expect(callsOf(ctx, "roundRect")[3]![2]).toBe(32);
    });

    it("未传入 isDisabled 时可见按钮与更多按钮都按未禁用处理", () => {
      const { renderer, context, sets, theme } = build({
        value: fiveButtons,
        omitIsDisabled: true,
        hoveredButtonIndex: 3,
      });

      renderer.render(context);

      expect(sets).not.toContainEqual({ prop: "fillStyle", value: theme.colors.button.disabledBg });
      // 悬停索引 3 命中更多按钮（displayButtons.length === 3）→ 高亮
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.hoverBg });
    });
  });

  describe("返回值", () => {
    it("单按钮返回原始 config", () => {
      const config: ButtonConfig = { text: "OK", variant: "primary" };
      const { renderer, context } = build({ value: config });

      expect(renderer.render(context)).toEqual({ type: "button", config });
    });

    it("多按钮返回按钮数组", () => {
      const buttons: ButtonConfig[] = [{ text: "A" }];
      const { renderer, context } = build({ value: buttons });

      expect(renderer.render(context)).toEqual({ type: "button", config: buttons });
    });

    it("空数组按多按钮处理且不绘制", () => {
      const { renderer, context, ctx } = build({ value: [] });

      const result = renderer.render(context);

      expect(ctx.calls).toHaveLength(0);
      expect(result).toEqual({ type: "button", config: [] });
    });
  });
});
