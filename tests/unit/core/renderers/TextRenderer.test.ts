import { TextRenderer } from "@/core/renderers/TextRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import { zhCN } from "@/locale";
import type { Column, Row } from "@/types";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, textsOf, callsOf } from "../../helpers/canvasInspect";

function build(overrides: Partial<CellRendererContext> = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const column: Column = { key: "t", title: "T", width: 200, type: "text" };
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
    value: "hello",
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;

  return { renderer: new TextRenderer(), context, ctx, sets, theme };
}

describe("TextRenderer", () => {
  it("type 为 text", () => {
    expect(new TextRenderer().type).toBe("text");
  });

  describe("值格式化", () => {
    it("字符串值原样绘制", () => {
      const { renderer, context, ctx } = build({ value: "hello" });

      const result = renderer.render(context);

      expect(textsOf(ctx)).toEqual(["hello"]);
      expect(result).toEqual({ type: "text" });
    });

    it("数字值转成字符串", () => {
      const { renderer, context, ctx } = build({ value: 42 });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["42"]);
    });

    it("布尔值转成字符串", () => {
      const { renderer, context, ctx } = build({ value: false });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["false"]);
    });

    it("column.formatter 优先于默认转换", () => {
      const { renderer, context, ctx } = build({
        value: 7,
        column: {
          key: "t",
          title: "T",
          width: 200,
          type: "text",
          formatter: (v) => `#${String(v)}`,
        },
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["#7"]);
    });

    it("formatter 收到 value / row / column 三个参数", () => {
      const formatter = jest.fn(() => "X");
      const row: Row = { id: "r9", data: { t: 1 } };
      const column: Column = { key: "t", title: "T", width: 200, type: "text", formatter };
      const { renderer, context } = build({ value: 7, row, column });

      renderer.render(context);

      expect(formatter).toHaveBeenCalledWith(7, row, column);
    });
  });

  describe("空值与占位符", () => {
    it("value 为 null 时走占位符", () => {
      const { renderer, context, ctx, sets, theme } = build({ value: null });

      renderer.render(context);

      // 未配置 placeholder → 文本为空字符串
      expect(textsOf(ctx)).toEqual([""]);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("value 为 undefined 时走占位符", () => {
      const { renderer, context, ctx, sets, theme } = build({ value: undefined });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([""]);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("value 为空字符串时走占位符", () => {
      const { renderer, context, ctx, sets, theme } = build({ value: "" });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
      expect(textsOf(ctx)).toEqual([""]);
    });

    it("配置了 column.placeholder 时优先使用它", () => {
      const { renderer, context, ctx } = build({
        value: null,
        column: { key: "t", title: "T", width: 200, type: "text", placeholder: "—" },
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["—"]);
    });

    it("formatter 返回空字符串时也走占位符分支", () => {
      const { renderer, context, ctx, sets, theme } = build({
        value: 1,
        column: {
          key: "t",
          title: "T",
          width: 200,
          type: "text",
          placeholder: "P",
          formatter: () => "",
        },
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["P"]);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("formatter 返回 0 这类假值字符串时不算空", () => {
      const { renderer, context, ctx } = build({
        value: 0,
        column: {
          key: "t",
          title: "T",
          width: 200,
          type: "text",
          placeholder: "P",
          formatter: () => "0",
        },
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["0"]);
    });
  });

  describe("文字颜色", () => {
    it("有值时使用 cellText", () => {
      const { renderer, context, sets, theme } = build({ value: "x" });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
    });

    it("选中态使用 cellText", () => {
      const { renderer, context, sets, theme } = build({ value: "x", isSelected: true });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
    });

    it("悬停态使用 cellText", () => {
      const { renderer, context, sets, theme } = build({ value: "x", isHovered: true });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
    });
  });

  describe("排版", () => {
    it("使用主题字体与垂直居中基线", () => {
      const { renderer, context, sets, theme } = build({ value: "x" });

      renderer.render(context);

      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
    });

    it("文本垂直居中于单元格", () => {
      const { renderer, context, ctx } = build({ value: "x", y: 10, height: 40 });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![2]).toBe(30);
    });

    it("默认左对齐并留出 8px 内边距", () => {
      const { renderer, context, ctx } = build({ value: "ab", x: 5 });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![1]).toBe(13);
    });

    it("居中对齐时按剩余宽度取中点", () => {
      const { renderer, context, ctx } = build({
        value: "ab",
        x: 0,
        width: 100,
        column: { key: "t", title: "T", width: 100, type: "text", align: "center" },
      });

      renderer.render(context);

      // 14 宽 → (100 - 14) / 2 = 43
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(43);
    });

    it("右对齐时贴右边并留出内边距", () => {
      const { renderer, context, ctx } = build({
        value: "ab",
        x: 0,
        width: 100,
        column: { key: "t", title: "T", width: 100, type: "text", align: "right" },
      });

      renderer.render(context);

      expect(callsOf(ctx, "fillText")[0]![1]).toBe(78);
    });

    it("内容超宽时按单元格宽度截断", () => {
      const { renderer, context, ctx } = build({ value: "abcdefghij", width: 40 });

      renderer.render(context);

      // 可用宽度 40 - 16 = 24 → "a..." = 28 > 24 → "..." = 21
      expect(textsOf(ctx)).toEqual(["..."]);
    });

    it("截断后的文本参与对齐计算", () => {
      const { renderer, context, ctx } = build({
        value: "abcdefghij",
        width: 60,
        column: { key: "t", title: "T", width: 60, type: "text", align: "right" },
      });

      renderer.render(context);

      // 可用 44 → "abcd..." = 49 > 44 → "abc..." = 42；x = 0 + 60 - 8 - 42 = 10
      expect(textsOf(ctx)).toEqual(["abc..."]);
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(10);
    });
  });
});
