import { TagsRenderer } from "@/core/renderers/TagsRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import type { Column, Row, TableTheme, TagItem, TagsConfig } from "@/types";
import { zhCN } from "@/locale";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, callsOf, textsOf } from "../../helpers/canvasInspect";

function build(overrides: Partial<CellRendererContext> = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const column: Column = { key: "t", title: "T", width: 200, type: "tag" };
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
    value: { tags: [] } as TagsConfig,
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;

  return { renderer: new TagsRenderer(), context, ctx, sets, theme };
}

/** 只有一个标签时，其 roundRect 的几何参数 */
const TAG_ROUND_RECT = [8, 5.5, 15, 21, 4];

describe("TagsRenderer", () => {
  it("type 为 tag", () => {
    expect(new TagsRenderer().type).toBe("tag");
  });

  it("返回 tag 类型和原始 config", () => {
    const config: TagsConfig = { tags: [{ text: "a" }] };
    const { renderer, context } = build({ value: config });

    expect(renderer.render(context)).toEqual({ type: "tag", config });
  });

  describe("空标签占位符", () => {
    it("tags 为空数组时用 config.placeholder", () => {
      const { renderer, context, ctx } = build({
        value: { tags: [], placeholder: "Choose" } as TagsConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["Choose"]);
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(8);
      expect(callsOf(ctx, "fillText")[0]![2]).toBe(16);
    });

    it("tags 缺失时同样走占位符分支", () => {
      const { renderer, context, ctx } = build({
        value: { tags: undefined } as unknown as TagsConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([zhCN.cell.tagPlaceholder]);
    });

    it("未指定 placeholder 时回退到 locale", () => {
      const { renderer, context, ctx } = build({ value: { tags: [] } as TagsConfig });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([zhCN.cell.tagPlaceholder]);
    });

    it("placeholder 为空串时不绘制任何文本", () => {
      const { renderer, context, ctx } = build({
        value: { tags: [], placeholder: "" } as TagsConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([]);
      expect(callsOf(ctx, "roundRect")).toEqual([]);
    });

    it("占位符使用 placeholderText 颜色与主题字体", () => {
      const { renderer, context, sets, theme } = build({
        value: { tags: [] } as TagsConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
      expect(sets).toContainEqual({
        prop: "font",
        value: `${theme.font.size}px ${theme.font.family}`,
      });
      expect(sets).toContainEqual({ prop: "textBaseline", value: "middle" });
    });
  });

  describe("单个标签", () => {
    it("用 roundRect 画圆角标签底并填充", () => {
      const { renderer, context, ctx } = build({
        value: { tags: [{ text: "a" }] } as TagsConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")[0]).toEqual(TAG_ROUND_RECT);
      expect(callsOf(ctx, "fill")).toHaveLength(1);
    });

    it("文本在标签内水平居中", () => {
      const { renderer, context, ctx } = build({
        value: { tags: [{ text: "a" }] } as TagsConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["a"]);
      // (15 - 7) / 2 = 4 → x = 8 + 4
      expect(callsOf(ctx, "fillText")[0]![1]).toBe(12);
      expect(callsOf(ctx, "fillText")[0]![2]).toBe(16);
    });

    it("默认底色取 tagColors.default，文字取 cellText", () => {
      const { renderer, context, sets, theme } = build({
        value: { tags: [{ text: "a" }] } as TagsConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({
        prop: "fillStyle",
        value: theme.colors.tagColors.default,
      });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
    });

    it("tag.bgColor 与 tag.color 覆盖主题默认值", () => {
      const { renderer, context, sets } = build({
        value: { tags: [{ text: "a", bgColor: "#123456", color: "#ffffff" }] } as TagsConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#123456" });
      expect(sets).toContainEqual({ prop: "fillStyle", value: "#ffffff" });
    });

    it("tagColors.default 为空时回退到内置 #f0f0f0", () => {
      const theme: TableTheme = createMockTheme();
      theme.colors.tagColors.default = "";
      const { renderer, context, sets } = build({
        value: { tags: [{ text: "a" }] } as TagsConfig,
        theme,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#f0f0f0" });
    });

    it("标签与省略号都放不下时不绘制任何内容", () => {
      // 可用宽 40-16=24；tagWidth = 70+8 = 78 > 24；truncatedTagSpace = 24 不足 39 → 不画任何标签
      const { renderer, context, ctx } = build({
        width: 40,
        value: { tags: [{ text: "abcdefghij" }] } as TagsConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")).toEqual([]);
      expect(textsOf(ctx)).toEqual([]);
    });
  });

  describe("标签溢出", () => {
    const many: TagItem[] = Array.from({ length: 10 }, () => ({ text: "abcdefghij" }));

    it("最后一行末尾追加 +N 计数标签", () => {
      const { renderer, context, ctx } = build({
        width: 100,
        value: { tags: many } as TagsConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["abcd...", "+9"]);
    });

    it("计数标签用 moreCount 的主题色", () => {
      const { renderer, context, sets, theme } = build({
        width: 100,
        value: { tags: many } as TagsConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({
        prop: "fillStyle",
        value: theme.colors.moreCount.background,
      });
      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.moreCount.text });
    });

    it("计数标签画在已绘制标签的右侧", () => {
      const { renderer, context, ctx } = build({
        width: 100,
        value: { tags: many } as TagsConfig,
      });

      renderer.render(context);

      const rects = callsOf(ctx, "roundRect");
      expect(rects).toHaveLength(2);
      expect(rects[0]).toEqual([8, 5.5, 57, 21, 4]);
      // 8 + 57 + 4 = 69；"+9" 宽 14 → 标签宽 22
      expect(rects[1]).toEqual([69, 5.5, 22, 21, 4]);
      expect(callsOf(ctx, "fillText")[1]![1]).toBe(73);
    });

    it("标签全部放下时不追加计数标签", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { tags: [{ text: "a" }, { text: "b" }] } as TagsConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["a", "b"]);
      expect(callsOf(ctx, "roundRect")).toHaveLength(2);
    });

    it("processedTags 等于标签数时剩余计数为 0，不画计数标签", () => {
      const { renderer, context, ctx } = build({
        width: 200,
        value: { tags: [{ text: "a" }] } as TagsConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual(["a"]);
    });

    it("标签超过一行时只在最后一行追加计数标签", () => {
      // 高度 80 → maxLineCount = min(2, floor((80-16)/23)) = 2
      const { renderer, context, ctx } = build({
        width: 200,
        height: 80,
        value: { tags: many, maxRows: 2 } as TagsConfig,
      });

      renderer.render(context);

      expect(textsOf(ctx)).toEqual([
        "abcdefghij",
        "abcdefghij",
        "abcdefghij",
        "abcdef...",
        "+6",
      ]);

      // 第一行 lineY = 18 → textY = 18 + 21/2 = 28.5；第二行 lineY = 41 → textY = 51.5
      const ys = callsOf(ctx, "fillText").map((a) => a[2]);
      expect(ys).toEqual([28.5, 28.5, 51.5, 51.5, 51.5]);
    });
  });
});
