import { SelectRenderer } from "@/core/renderers/SelectRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import type { Column, Row, SelectConfig } from "@/types";
import { zhCN } from "@/locale";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, callsOf, textsOf, methodNamesOf } from "../../helpers/canvasInspect";

function build(overrides: Partial<CellRendererContext> = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const column: Column = { key: "s", title: "S", width: 100, type: "select" };
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
    value: { options: [] } as SelectConfig,
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;

  return { renderer: new SelectRenderer(), context, ctx, sets, theme };
}

/** measureText 宽度 = 字符数 * 7 */
const W = (s: string) => s.length * 7;

describe("SelectRenderer", () => {
  it("type 为 select", () => {
    expect(new SelectRenderer().type).toBe("select");
  });

  it("返回 select 类型和原始 config", () => {
    const config: SelectConfig = { options: [], value: "a" };
    const { renderer, context } = build({ value: config });

    expect(renderer.render(context)).toEqual({ type: "select", config });
  });

  describe("外框", () => {
    it("沿单元格边界画矩形并描边", () => {
      const { renderer, context, ctx } = build({ x: 4, y: 6, width: 120, height: 32 });

      renderer.render(context);

      expect(callsOf(ctx, "rect")[0]).toEqual([4, 6, 120, 32]);
      expect(callsOf(ctx, "stroke")).toHaveLength(1);
    });

    it("边框用 input.border，线宽 1", () => {
      const { renderer, context, sets, theme } = build();

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.input.border });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
    });

    it("描边前先 beginPath", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      const names = methodNamesOf(ctx);
      expect(names.indexOf("beginPath")).toBeLessThan(names.indexOf("rect"));
      expect(names.indexOf("rect")).toBeLessThan(names.indexOf("stroke"));
    });
  });

  describe("下拉箭头", () => {
    it("画一个朝下的三角并填充", () => {
      const { renderer, context, ctx } = build({ width: 100, height: 32 });

      renderer.render(context);

      // arrowX = 0 + 100 - 8 - 8 = 84；arrowY = 16
      expect(callsOf(ctx, "moveTo")[0]).toEqual([80, 14]);
      expect(callsOf(ctx, "lineTo")[0]).toEqual([84, 19]);
      expect(callsOf(ctx, "lineTo")[1]).toEqual([88, 14]);
      expect(callsOf(ctx, "closePath")).toHaveLength(1);
    });

    it("箭头颜色用 date.icon", () => {
      const { renderer, context, sets, theme } = build();

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.date.icon });
    });
  });

  describe("单选显示", () => {
    it("命中选项时显示选项 label", () => {
      const { renderer, context, ctx } = build({
        value: { options: [{ label: "Alpha", value: "a" }], value: "a" } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("Alpha");
    });

    it("未命中选项时退化为原始值的字符串", () => {
      const { renderer, context, ctx } = build({
        value: { options: [{ label: "Alpha", value: "a" }], value: "zzz" } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("zzz");
    });

    it("有值时用 cellText 且文本左对齐留 8px 内边距", () => {
      const { renderer, context, ctx, sets, theme } = build({
        value: { options: [{ label: "Alpha", value: "a" }], value: "a" } as SelectConfig,
        height: 32,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(8);
      expect(callsOf(ctx, "fillText")[0]![2]).toBe(16);
    });

    it("使用主题字体与 middle 基线", () => {
      const { renderer, context, sets, theme } = build({
        value: { options: [], value: "a" } as SelectConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
    });

    it("value 为 undefined 时显示 locale 占位符并使用 placeholderText", () => {
      const { renderer, context, ctx, sets, theme } = build({
        value: { options: [] } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe(zhCN.cell.selectPlaceholder);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("value 为 null 时同样显示占位符", () => {
      const { renderer, context, ctx } = build({
        value: { options: [], value: null } as unknown as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe(zhCN.cell.selectPlaceholder);
    });

    it("config.placeholder 优先于 locale", () => {
      const { renderer, context, ctx } = build({
        value: { options: [], placeholder: "Pick one" } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("Pick one");
    });

    it("config.placeholder 为空串时不再回退 locale", () => {
      const { renderer, context, ctx } = build({
        value: { options: [], placeholder: "" } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("");
    });

    it("占位符过长时被截断", () => {
      const { renderer, context, ctx } = build({
        width: 60,
        value: { options: [], placeholder: "abcdefghijklmnop" } as SelectConfig,
      });

      renderer.render(context);

      // 可用宽度 60 - 16 - 20 = 24 → "..." 宽 21，逐字裁剪后仅剩省略号
      expect(textsOf(ctx)[0]).toBe("...");
    });
  });

  describe("多选显示", () => {
    const options = [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
    ];

    it("默认用 ', ' 连接各选项 label", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { options, value: ["a", "b"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("A, B");
    });

    it("config.separator 优先", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { options, value: ["a", "b"], multiple: true, separator: "|" } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("A|B");
    });

    it("无 config.separator 时用全局 multipleSelectSeparator", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        multipleSelectSeparator: " / ",
        value: { options, value: ["a", "b"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("A / B");
    });

    it("选项不存在时回退为值的字符串", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { options, value: ["a", "zzz"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("A, zzz");
    });

    it("文本较长时折成多行并逐行下移", () => {
      const longOptions = [
        { label: "aaaaaaaaaa", value: "a" },
        { label: "bbbbbbbbbb", value: "b" },
      ];
      // maxRows = floor((80 - 16) / 19.5) = 3；可用宽 100 - 16 - 20 = 64
      const { renderer, context, ctx } = build({
        width: 100,
        height: 80,
        value: { options: longOptions, value: ["a", "b"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["aaaaaaaaa", "a, bbbbbb", "bbbb"]);
      // startY = (80 - 3 * 19.5) / 2 = 10.75 → 首行 y = 10.75 + (19.5 - 13) / 2 = 14
      const ys = callsOf(ctx, "fillText").map((a) => a[2]);
      expect(ys).toEqual([14, 33.5, 53]);
    });

    it("多行文本按行高垂直居中", () => {
      const { renderer, context, ctx, sets, theme } = build({
        width: 200,
        height: 80,
        value: { options, value: ["a", "b"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      // lineHeight = 19.5；maxRows = floor((80 - 16) / 19.5) = 3；1 行文本
      expect(sets).toContainEqual({ prop: "textBaseline", value: "top" });
      // startY = (80 - 19.5) / 2 = 30.25 → y = 30.25 + (19.5 - 13) / 2 = 33.5
      expect(callsOf(ctx, "fillText")[0]![2]).toBe(33.5);
      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
    });

    it("超过最大行数时截断并加省略号", () => {
      const longOptions = [
        { label: "aaaaaaaaaa", value: "a" },
        { label: "bbbbbbbbbb", value: "b" },
      ];
      const { renderer, context, ctx } = build({
        width: 100,
        height: 32,
        value: { options: longOptions, value: ["a", "b"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      // 可用宽 64、maxRows 1 → 首行只能容纳 9 个字符，末尾补 "..."
      expect(textsOf(ctx)[0]).toBe("aaaaaa...");
      expect(textsOf(ctx)[0]!.endsWith("...")).toBe(true);
    });

    it("可用宽度连省略号都放不下时只留省略号", () => {
      const longOptions = [
        { label: "aaaaaaaaaa", value: "a" },
        { label: "bbbbbbbbbb", value: "b" },
      ];
      const { renderer, context, ctx } = build({
        width: 50,
        height: 32,
        value: { options: longOptions, value: ["a", "b"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("...");
    });

    it("单个字符就超宽时同样只剩省略号", () => {
      const { renderer, context, ctx } = build({
        width: 40,
        height: 32,
        value: { options, value: ["a", "b"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("...");
    });

    it("拼接结果为空串时不绘制任何文本", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { options: [], value: [""], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([]);
    });

    it("多选样式下文本同样使用 cellText", () => {
      const { renderer, context, sets, theme } = build({
        width: 200,
        value: { options, value: ["a", "b"], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
    });

    it("multiple 为真但 value 不是数组时走单选路径", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { options, value: "a", multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("A");
    });

    it("multiple 为真但 value 为空数组时走单选路径", () => {
      const { renderer, context, ctx, sets, theme } = build({
        width: 200,
        value: { options, value: [], multiple: true } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe(zhCN.cell.selectPlaceholder);
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("multiple 为假时即使 value 是数组也走单选路径", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { options, value: ["a", "b"], multiple: false } as SelectConfig,
      });

      renderer.render(context);

      // 单选路径下 String(["a","b"]) = "a,b"，未命中选项
      expect(textsOf(ctx)[0]).toBe("a,b");
    });
  });

  describe("截断逻辑", () => {
    it("宽度足够时不加省略号", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { options: [{ label: "Alpha", value: "a" }], value: "a" } as SelectConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)[0]).toBe("Alpha");
      expect(W("Alpha")).toBeLessThanOrEqual(200 - 36);
    });
  });

  describe("私有辅助方法", () => {
    it("calculateMaxRows 的 padding 默认值为 8", () => {
      // 内部调用点恒传第三个参数，默认值分支只能通过类型断言触达
      const probe = new SelectRenderer() as unknown as {
        calculateMaxRows(cellHeight: number, lineHeight: number, padding?: number): number;
      };

      // 默认 padding 8：(100 - 16) / 10 = 8.4 → 8
      expect(probe.calculateMaxRows(100, 10)).toBe(8);
      // 显式 padding 0：(100 - 0) / 10 = 10
      expect(probe.calculateMaxRows(100, 10, 0)).toBe(10);
    });
  });
});
