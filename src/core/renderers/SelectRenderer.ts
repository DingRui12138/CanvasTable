/**
 * SelectRenderer - Renders select dropdown cells
 */

import { SelectConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class SelectRenderer extends BaseCellRenderer {
  readonly type: CellType = "select";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value, multipleSelectSeparator } = context;

    const config = value as SelectConfig;
    const padding = 8;
    const arrowWidth = 20;

    ctx.strokeStyle = theme.colors.input.border;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();

    const fontSize = theme.font.size;
    const lineHeight = fontSize * 1.5;

    if (config.multiple && Array.isArray(config.value) && config.value.length > 0) {
      const maxRows = this.calculateMaxRows(height, lineHeight, padding);
      const maxTextWidth = width - padding * 2 - arrowWidth;
      const labels = config.value.map((v) => {
        const opt = config.options.find((o) => o.value === v);
        return opt?.label ?? String(v);
      });
      const separator = config.separator ?? multipleSelectSeparator ?? ", ";
      const lines = this.wrapTextToLines(ctx, labels.join(separator), maxTextWidth, maxRows);

      ctx.fillStyle = theme.colors.cellText;
      ctx.font = `${fontSize}px ${theme.font.family}`;
      ctx.textBaseline = "top";

      const totalHeight = lines.length * lineHeight;
      const startY = y + (height - totalHeight) / 2;

      for (let rowIdx = 0; rowIdx < lines.length; rowIdx++) {
        const line = lines[rowIdx]!;
        ctx.fillText(line, x + padding, startY + rowIdx * lineHeight + (lineHeight - fontSize) / 2);
      }
    } else {
      let displayText = "";
      if (config.value !== undefined && config.value !== null) {
        const selectedOption = config.options.find((opt) => opt.value === config.value);
        displayText = selectedOption?.label ?? String(config.value);
      }

      const placeholder = config.placeholder ?? "请选择";
      const text = displayText || placeholder;

      ctx.fillStyle = displayText ? theme.colors.cellText : theme.colors.placeholderText;
      ctx.font = `${fontSize}px ${theme.font.family}`;
      ctx.textBaseline = "middle";

      const maxTextWidth = width - padding * 2 - arrowWidth;
      const truncatedText = this.truncateText(ctx, text, maxTextWidth);
      ctx.fillText(truncatedText, x + padding, y + height / 2);
    }

    // Draw dropdown arrow
    ctx.fillStyle = theme.colors.date.icon;
    ctx.beginPath();
    const arrowX = x + width - padding - 8;
    const arrowY = y + height / 2;
    ctx.moveTo(arrowX - 4, arrowY - 2);
    ctx.lineTo(arrowX, arrowY + 3);
    ctx.lineTo(arrowX + 4, arrowY - 2);
    ctx.closePath();
    ctx.fill();

    return { type: "select", config };
  }

  private calculateMaxRows(cellHeight: number, lineHeight: number, padding: number = 8): number {
    return Math.max(1, Math.floor((cellHeight - padding * 2) / lineHeight));
  }

  private wrapTextToLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxRows: number,
  ): string[] {
    const lines: string[] = [];
    let currentLine = "";

    for (const char of text) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
        if (lines.length >= maxRows) {
          const lastLine = lines[maxRows - 1]!;
          const ellipsis = "...";
          let truncated = lastLine;
          while (ctx.measureText(truncated + ellipsis).width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          lines[maxRows - 1] = truncated + ellipsis;
          return lines;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, maxRows);
  }
}
