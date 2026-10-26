import { NumberRenderer } from "@/core/renderers/NumberRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import { zhCN } from "@/locale";
import type { Column, Row } from "@/types";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, textsOf, callsOf } from "../../helpers/canvasInspect";

function build(overrides: Partial<CellRendererContext> = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const column: Column = { key: "n", title: "N", width: 200, type: "number" };
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
    value: 42,
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;

  return { renderer: new NumberRenderer(), context, ctx, sets, theme };
}

/** 断言某次 fillText 的文本 */
function drawnText(ctx: ReturnType<typeof build>["ctx"]): string | undefined {
  return textsOf(ctx)[0];
}

describe("NumberRenderer", () => {
  it("type 为 number", () => {
    expect(new NumberRenderer().type).toBe("number");
  });

  it("返回 number 类型的渲染结果", () => {
    const { renderer, context } = build();

    expect(renderer.render(context)).toEqual({ type: "number" });
  });

  describe("输入框边框", () => {
    it("用主题的 input.border 描边，线宽 1", () => {
      const { renderer, context, sets, theme } = build();

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.input.border });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
    });

    it("沿单元格边界画矩形并描边", () => {
      const { renderer, context, ctx } = build({ x: 10, y: 20, width: 120, height: 32 });

      renderer.render(context);

      expect(callsOf(ctx, "rect")[0]).toEqual([10, 20, 120, 32]);
      expect(callsOf(ctx, "stroke")).toHaveLength(1);
    });

    it("描边前先 beginPath", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      const names = ctx.calls.map((c) => c.method);
      expect(names.indexOf("beginPath")).toBeLessThan(names.indexOf("rect"));
      expect(names.indexOf("rect")).toBeLessThan(names.indexOf("stroke"));
    });
  });

  describe("数值格式化", () => {
    it("数字走 toLocaleString", () => {
      const { renderer, context, ctx } = build({ value: 1234567 });

      renderer.render(context);

      expect(drawnText(ctx)).toBe((1234567).toLocaleString());
    });

    it("零会被正常绘制而不是当作空值", () => {
      const { renderer, context, ctx, sets, theme } = build({ value: 0 });

      renderer.render(context);

      expect(drawnText(ctx)).toBe("0");
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
    });

    it("负数保留符号", () => {
      const { renderer, context, ctx } = build({ value: -1234 });

      renderer.render(context);

      expect(drawnText(ctx)).toBe((-1234).toLocaleString());
    });

    it("小数保留小数位", () => {
      const { renderer, context, ctx } = build({ value: 3.5 });

      renderer.render(context);

      expect(drawnText(ctx)).toBe((3.5).toLocaleString());
    });

    it("字符串数字原样绘制", () => {
      const { renderer, context, ctx } = build({ value: "1,234" });

      renderer.render(context);

      expect(drawnText(ctx)).toBe("1,234");
    });

    it("布尔值转成字符串", () => {
      const { renderer, context, ctx } = build({ value: true });

      renderer.render(context);

      expect(drawnText(ctx)).toBe("true");
    });

    it("formatter 优先于内置格式化", () => {
      const { renderer, context, ctx } = build({
        value: 1234567,
        column: {
          key: "n",
          title: "N",
          width: 200,
          type: "number",
          formatter: (v) => `${String(v)} 元`,
        },
      });

      renderer.render(context);

      expect(drawnText(ctx)).toBe("1234567 元");
    });

    it("formatter 收到 value / row / column 三个参数", () => {
      const formatter = jest.fn(() => "F");
      const row: Row = { id: "r9", data: { n: 1 } };
      const column: Column = { key: "n", title: "N", width: 200, type: "number", formatter };
      const { renderer, context } = build({ value: 7, row, column });

      renderer.render(context);

      expect(formatter).toHaveBeenCalledWith(7, row, column);
    });
  });

  describe("空值与占位符", () => {
    it("null 使用 locale 的 numberPlaceholder", () => {
      const { renderer, context, ctx, sets, theme } = build({ value: null });

      renderer.render(context);

      expect(drawnText(ctx)).toBe(zhCN.cell.numberPlaceholder);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("undefined 使用 locale 的 numberPlaceholder", () => {
      const { renderer, context, ctx } = build({ value: undefined });

      renderer.render(context);

      expect(drawnText(ctx)).toBe(zhCN.cell.numberPlaceholder);
    });

    it("空字符串使用 locale 的 numberPlaceholder", () => {
      const { renderer, context, ctx } = build({ value: "" });

      renderer.render(context);

      expect(drawnText(ctx)).toBe(zhCN.cell.numberPlaceholder);
    });

    it("column.placeholder 优先于 locale", () => {
      const { renderer, context, ctx } = build({
        value: null,
        column: { key: "n", title: "N", width: 200, type: "number", placeholder: "N/A" },
      });

      renderer.render(context);

      expect(drawnText(ctx)).toBe("N/A");
    });

    it("column.placeholder 为空字符串时不会回退到 locale（?? 只拦 null/undefined）", () => {
      const { renderer, context, ctx } = build({
        value: null,
        column: { key: "n", title: "N", width: 200, type: "number", placeholder: "" },
      });

      renderer.render(context);

      // "" ?? locale → "" 是有效值，所以最终文本为空串
      expect(drawnText(ctx)).toBe("");
    });

    it("formatter 返回空串时也走占位符", () => {
      const { renderer, context, ctx, sets, theme } = build({
        value: 1,
        column: {
          key: "n",
          title: "N",
          width: 200,
          type: "number",
          placeholder: "P",
          formatter: () => "",
        },
      });

      renderer.render(context);

      expect(drawnText(ctx)).toBe("P");
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("有值时使用 cellText 而不是 placeholderText", () => {
      const { renderer, context, sets, theme } = build({ value: 5 });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
      expect(sets).not.toContainEqual({
        prop: "fillStyle",
        value: theme.colors.placeholderText,
      });
    });
  });

  describe("排版", () => {
    it("使用主题字体与垂直居中基线", () => {
      const { renderer, context, sets, theme } = build();

      renderer.render(context);

      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
    });

    it("文本垂直居中于单元格", () => {
      const { renderer, context, ctx } = build({ y: 10, height: 40 });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![2]).toBe(30);
    });

    it("默认左对齐并留出 8px 内边距", () => {
      const { renderer, context, ctx } = build({ value: "42", x: 5 });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![1]).toBe(13);
    });

    it("居中对齐按剩余宽度取中点", () => {
      const { renderer, context, ctx } = build({
        value: "42",
        x: 0,
        width: 100,
        column: { key: "n", title: "N", width: 100, type: "number", align: "center" },
      });

      renderer.render(context);

      // measureText("42") = 14 → (100 - 14) / 2 = 43
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(43);
    });

    it("右对齐时贴右边并留出内边距", () => {
      const { renderer, context, ctx } = build({
        value: "42",
        x: 0,
        width: 100,
        column: { key: "n", title: "N", width: 100, type: "number", align: "right" },
      });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![1]).toBe(78);
    });

    it("内容超宽时按单元格宽度截断", () => {
      const { renderer, context, ctx } = build({ value: "1234567890", width: 40 });

      renderer.render(context);

      // 可用 40 - 16 = 24；"1234567890" = 70 > 24，逐字裁剪后只剩省略号
      expect(drawnText(ctx)).toBe("...");
    });

    it("截断后的文本参与对齐计算", () => {
      const { renderer, context, ctx } = build({
        value: "1234567890",
        width: 60,
        column: { key: "n", title: "N", width: 60, type: "number", align: "right" },
      });

      renderer.render(context);

      // 可用 44 → "123..." = 42；x = 0 + 60 - 8 - 42 = 10
      expect(drawnText(ctx)).toBe("123...");
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(10);
    });

    it("占位符过长时同样被截断", () => {
      const { renderer, context, ctx } = build({
        value: null,
        width: 40,
        column: {
          key: "n",
          title: "N",
          width: 40,
          type: "number",
          placeholder: "very-long-placeholder",
        },
      });

      renderer.render(context);

      expect(drawnText(ctx)).toBe("...");
    });
  });
});
