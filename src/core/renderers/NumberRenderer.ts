/**
 * NumberRenderer - Renders numeric cells with formatting
 *
 * Visual behavior matches InputRenderer:
 * - Draws input border
 * - Shows placeholder (in placeholderText color) when value is empty
 * - Shows formatted value (in cellText color) when value exists
 * - Placeholder source: column.placeholder ?? locale.cell.numberPlaceholder
 */

import { Column, Row, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class NumberRenderer extends BaseCellRenderer {
  readonly type: CellType = "number";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, column, row, value, isSelected, isHovered, locale } =
      context;

    const padding = 8;
    const align = this.getTextAlign(column);
    const displayValue = this.formatValue(value, column, row);

    // Draw input border (consistent with InputRenderer)
    ctx.strokeStyle = theme.colors.input.border;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();

    // Placeholder logic (consistent with InputRenderer)
    const placeholder = column.placeholder ?? locale.cell.numberPlaceholder;
    const text = displayValue || placeholder;

    ctx.fillStyle = displayValue ? theme.colors.cellText : theme.colors.placeholderText;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";

    const maxTextWidth = width - padding * 2;
    const truncatedText = this.truncateText(ctx, text, maxTextWidth);

    const textX = this.calculateTextX(truncatedText, x, width, padding, align, ctx);
    const textY = y + height / 2;

    ctx.fillText(truncatedText, textX, textY);

    return { type: "number" };
  }

  private formatValue(value: unknown, column: Column, row: Row): string {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    if (column.formatter) {
      return column.formatter(value, row, column);
    }

    if (typeof value === "number") {
      return value.toLocaleString();
    }

    return String(value);
  }
}
