import { BaseCellRenderer } from "@/core/renderers/CellRenderer";
import type { CellRenderResult } from "@/core/renderers/CellRenderer";
import type { CellType, Column } from "@/types";
import { createTrackedContext, callsOf, methodNamesOf } from "../../helpers/canvasInspect";

/**
 * BaseCellRenderer 的五个工具方法都是 protected，需要一个具体子类把它们暴露出来。
 * 这里刻意保持子类极简，避免把被测逻辑和测试脚手架混在一起。
 */
class ProbeRenderer extends BaseCellRenderer {
  readonly type: CellType = "text";

  render(): CellRenderResult {
    return { type: "text" };
  }

  padding(): number {
    return this.getPadding();
  }

  align(column: Column): "left" | "center" | "right" {
    return this.getTextAlign(column);
  }

  textX(
    text: string,
    x: number,
    width: number,
    padding: number,
    align: "left" | "center" | "right",
    ctx: CanvasRenderingContext2D,
  ): number {
    return this.calculateTextX(text, x, width, padding, align, ctx);
  }

  rounded(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    this.drawRoundedRect(ctx, x, y, width, height, radius);
  }

  /** 三参数重载走 truncateText 的默认省略号 */
  truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string;
  /** 四参数重载传入自定义省略号 */
  truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, ellipsis: string): string;
  truncate(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    ellipsis?: string,
  ): string {
    return ellipsis === undefined
      ? this.truncateText(ctx, text, maxWidth)
      : this.truncateText(ctx, text, maxWidth, ellipsis);
  }
}

function column(overrides: Partial<Column> = {}): Column {
  return { key: "c", title: "C", width: 100, type: "text", ...overrides };
}

describe("BaseCellRenderer", () => {
  let renderer: ProbeRenderer;

  beforeEach(() => {
    renderer = new ProbeRenderer();
  });

  describe("getPadding", () => {
    it("固定返回 8", () => {
      expect(renderer.padding()).toBe(8);
    });
  });

  describe("getTextAlign", () => {
    it("未指定 align 时默认左对齐", () => {
      expect(renderer.align(column())).toBe("left");
    });

    it("透传 column.align", () => {
      expect(renderer.align(column({ align: "center" }))).toBe("center");
      expect(renderer.align(column({ align: "right" }))).toBe("right");
      expect(renderer.align(column({ align: "left" }))).toBe("left");
    });
  });

  describe("calculateTextX", () => {
    it("居中对齐按可用宽度取中点", () => {
      const { ctx } = createTrackedContext();

      // measureText("ab") = 14 → 10 + (100 - 14) / 2 = 53
      expect(renderer.textX("ab", 10, 100, 8, "center", ctx)).toBe(53);
    });

    it("右对齐时贴右边并留出 padding", () => {
      const { ctx } = createTrackedContext();

      // 10 + 100 - 8 - 14 = 88
      expect(renderer.textX("ab", 10, 100, 8, "right", ctx)).toBe(88);
    });

    it("左对齐时贴左边并留出 padding", () => {
      const { ctx } = createTrackedContext();

      expect(renderer.textX("ab", 10, 100, 8, "left", ctx)).toBe(18);
    });

    it("未知对齐值走左对齐兜底", () => {
      const { ctx } = createTrackedContext();

      expect(renderer.textX("ab", 10, 100, 8, "justify" as "left", ctx)).toBe(18);
    });

    it("空文本宽度为 0", () => {
      const { ctx } = createTrackedContext();

      expect(renderer.textX("", 10, 100, 8, "center", ctx)).toBe(60);
      expect(renderer.textX("", 10, 100, 8, "right", ctx)).toBe(102);
    });
  });

  describe("drawRoundedRect", () => {
    it("按固定顺序描出四段圆角路径", () => {
      const { ctx } = createTrackedContext();

      renderer.rounded(ctx, 10, 20, 100, 40, 6);

      expect(methodNamesOf(ctx)).toEqual([
        "beginPath",
        "moveTo",
        "lineTo",
        "quadraticCurveTo",
        "lineTo",
        "quadraticCurveTo",
        "lineTo",
        "quadraticCurveTo",
        "lineTo",
        "quadraticCurveTo",
        "closePath",
      ]);
    });

    it("起点与终点坐标按半径偏移", () => {
      const { ctx } = createTrackedContext();

      renderer.rounded(ctx, 10, 20, 100, 40, 6);

      expect(callsOf(ctx, "moveTo")[0]).toEqual([16, 20]);
      // 上边线的终点
      expect(callsOf(ctx, "lineTo")[0]).toEqual([104, 20]);
      // 右下角之前的右边线终点
      expect(callsOf(ctx, "lineTo")[1]).toEqual([110, 54]);
      // 左下角之前的底边线终点
      expect(callsOf(ctx, "lineTo")[2]).toEqual([16, 60]);
      // 最后一段左边线终点
      expect(callsOf(ctx, "lineTo")[3]).toEqual([10, 26]);
    });

    it("四个圆角各自用一条二次贝塞尔曲线", () => {
      const { ctx } = createTrackedContext();

      renderer.rounded(ctx, 10, 20, 100, 40, 6);

      expect(callsOf(ctx, "quadraticCurveTo")).toEqual([
        [110, 20, 110, 26],
        [110, 60, 104, 60],
        [10, 60, 10, 54],
        [10, 20, 16, 20],
      ]);
    });

    it("半径为 0 时退化为直角矩形路径", () => {
      const { ctx } = createTrackedContext();

      renderer.rounded(ctx, 0, 0, 50, 30, 0);

      expect(callsOf(ctx, "moveTo")[0]).toEqual([0, 0]);
      expect(callsOf(ctx, "lineTo")[0]).toEqual([50, 0]);
      expect(methodNamesOf(ctx).at(-1)).toBe("closePath");
    });
  });

  describe("truncateText", () => {
    it("文本放得下时原样返回", () => {
      const { ctx } = createTrackedContext();

      expect(renderer.truncate(ctx, "abc", 100)).toBe("abc");
    });

    it("刚好等于最大宽度时不截断", () => {
      const { ctx } = createTrackedContext();

      // "abc" = 21，maxWidth 21
      expect(renderer.truncate(ctx, "abc", 21)).toBe("abc");
    });

    it("超宽时逐步裁剪并补默认省略号", () => {
      const { ctx } = createTrackedContext();

      // "abcdefghij" = 70，maxWidth 35；"ab..." = 35 恰好放下
      expect(renderer.truncate(ctx, "abcdefghij", 35)).toBe("ab...");
    });

    it("省略号可自定义", () => {
      const { ctx } = createTrackedContext();

      // "…" = 7 → "abcd…" = 35
      expect(renderer.truncate(ctx, "abcdefghij", 35, "…")).toBe("abcd…");
    });

    it("宽度小到放不下省略号时返回纯省略号", () => {
      const { ctx } = createTrackedContext();

      expect(renderer.truncate(ctx, "abcdef", 0)).toBe("...");
    });

    it("空文本直接返回", () => {
      const { ctx } = createTrackedContext();

      expect(renderer.truncate(ctx, "", 10)).toBe("");
    });

    it("中文按同样的字符宽度估算", () => {
      const { ctx } = createTrackedContext();

      // 每个字符宽度 7（mock 的估算方式）
      expect(renderer.truncate(ctx, "中文测试文本", 35)).toBe("中文...");
    });
  });
});
