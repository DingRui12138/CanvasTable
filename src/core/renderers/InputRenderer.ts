/**
 * InputRenderer - Renders input field cells
 */

import { InputConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class InputRenderer extends BaseCellRenderer {
  readonly type: CellType = "input";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value } = context;

    const config = value as InputConfig;
    const padding = 8;

    ctx.strokeStyle = theme.colors.input.border;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();

    const displayText = config.value ?? "";
    const placeholder = config.placeholder ?? "";
    const text = displayText || placeholder;

    ctx.fillStyle = displayText ? theme.colors.cellText : theme.colors.placeholderText;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";

    const maxTextWidth = width - padding * 2;

    if (config.multiline) {
      const lineHeight = theme.font.size * 1.5;
      const maxRows = config.maxRows ?? 5;
      const maxVisibleHeight = height - padding * 2;
      const maxVisibleRows = Math.max(1, Math.floor(maxVisibleHeight / lineHeight));
      const actualMaxRows = Math.min(maxRows, maxVisibleRows);

      const lines = this.wrapText(ctx, text, maxTextWidth);
      const visibleLines = lines.slice(0, actualMaxRows);

      let textY = y + padding + lineHeight / 2;

      for (let i = 0; i < visibleLines.length; i++) {
        let lineText = visibleLines[i]!;
        const isLastVisibleLine = i === visibleLines.length - 1;
        const hasMoreLines = lines.length > visibleLines.length;

        if (isLastVisibleLine) {
          lineText = this.truncateTextWithEllipsis(ctx, lineText, maxTextWidth, hasMoreLines);
        }
        ctx.fillText(lineText, x + padding, textY);
        textY += lineHeight;
      }
    } else {
      const truncatedText = this.truncateTextWithEllipsis(ctx, text, maxTextWidth);
      ctx.fillText(truncatedText, x + padding, y + height / 2);
    }

    return { type: "input", config };
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split("\n");

    for (const paragraph of paragraphs) {
      if (paragraph === "") {
        lines.push("");
        continue;
      }

      let remaining = paragraph;

      while (remaining.length > 0) {
        // 使用二分查找找到当前行能放下的最大字符数
        const breakPoint = this.findLineBreakPoint(ctx, remaining, maxWidth);

        if (breakPoint === 0) {
          // 第一个字符都放不下，强制放一个字符
          lines.push(remaining[0]!);
          remaining = remaining.slice(1);
        } else {
          lines.push(remaining.slice(0, breakPoint));
          remaining = remaining.slice(breakPoint);
        }
      }
    }

    return lines;
  }

  /**
   * 二分查找找到能放入 maxWidth 的最大字符数
   */
  private findLineBreakPoint(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): number {
    const len = text.length;

    // 边界检查
    if (len === 0) return 0;

    // 先检查整段是否能放下
    if (ctx.measureText(text).width <= maxWidth) {
      return len;
    }

    // 二分查找
    let left = 1;
    let right = len;
    let result = 0;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const substr = text.slice(0, mid);
      const width = ctx.measureText(substr).width;

      if (width <= maxWidth) {
        result = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  private truncateTextWithEllipsis(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    forceEllipsis: boolean = false,
  ): string {
    const ellipsis = "...";
    const ellipsisWidth = ctx.measureText(ellipsis).width;

    // 先检查整段是否能放下
    const textWidth = ctx.measureText(text).width;

    if (textWidth <= maxWidth) {
      if (forceEllipsis) {
        // 需要添加省略号，检查是否能放下文本+省略号
        if (textWidth + ellipsisWidth <= maxWidth) {
          return text + ellipsis;
        }
        // 需要截断以放下省略号
        return this.truncateWithEllipsisBinary(ctx, text, maxWidth, ellipsis, ellipsisWidth);
      }
      return text;
    }

    return this.truncateWithEllipsisBinary(ctx, text, maxWidth, ellipsis, ellipsisWidth);
  }

  /**
   * 二分查找截断文本并添加省略号
   */
  private truncateWithEllipsisBinary(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    ellipsis: string,
    ellipsisWidth: number,
  ): string {
    const targetWidth = maxWidth - ellipsisWidth;

    if (targetWidth <= 0) {
      return ellipsis;
    }

    const len = text.length;

    // 二分查找能放下的最大长度
    let left = 0;
    let right = len;
    let result = 0;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const substr = text.slice(0, mid);
      const width = ctx.measureText(substr).width;

      if (width <= targetWidth) {
        result = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return text.slice(0, result) + ellipsis;
  }
}
