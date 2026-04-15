/**
 * NumberRenderer - Renders numeric cells with formatting
 */

import { Column, Row, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class NumberRenderer extends BaseCellRenderer {
  readonly type: CellType = "number";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, column, row, value, isSelected, isHovered } = context;

    const padding = this.getPadding();
    const align = this.getTextAlign(column);
    const displayValue = this.formatValue(value, column, row);

    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";

    const textColor = this.getTextColor(theme, isSelected, isHovered);
    ctx.fillStyle = textColor;

    const maxTextWidth = width - padding * 2;
    const truncatedText = this.truncateText(ctx, displayValue, maxTextWidth);

    const textX = this.calculateTextX(truncatedText, x, width, padding, align, ctx);
    const textY = y + height / 2;

    ctx.fillText(truncatedText, textX, textY);

    return { type: "number" };
  }

  private getTextColor(
    theme: import("../../types").TableTheme,
    isSelected?: boolean,
    isHovered?: boolean,
  ): string {
    if (isSelected) {
      return theme.colors.cellText;
    }
    if (isHovered) {
      return theme.colors.cellText;
    }
    return theme.colors.cellText;
  }

  private formatValue(value: unknown, column: Column, row: Row): string {
    if (value === null || value === undefined) {
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
