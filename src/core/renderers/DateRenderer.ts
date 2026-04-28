/**
 * DateRenderer - Renders date picker cells
 */

import { DateConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class DateRenderer extends BaseCellRenderer {
  readonly type: CellType = "date";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, locale, x, y, width, height, value } = context;

    const config = value as DateConfig;
    const padding = 8;
    const iconWidth = 20;

    ctx.strokeStyle = theme.colors.date.border;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();

    let displayText = "";
    if (config.value) {
      const date = config.value instanceof Date ? config.value : new Date(config.value);
      if (!isNaN(date.getTime())) {
        const format = config.format ?? "YYYY-MM-DD";
        displayText = this.formatDate(date, format);
      }
    }

    const placeholder = config.placeholder ?? locale.cell.datePlaceholder;
    const text = displayText || placeholder;

    ctx.fillStyle = displayText ? theme.colors.cellText : theme.colors.placeholderText;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";

    const maxTextWidth = width - padding * 2 - iconWidth;
    const ellipsis = "...";
    let finalText = text;
    if (ctx.measureText(text).width > maxTextWidth) {
      let truncated = text;
      while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxTextWidth) {
        truncated = truncated.slice(0, -1);
      }
      finalText = truncated + ellipsis;
    }
    ctx.fillText(finalText, x + padding, y + height / 2);

    // Draw calendar icon
    ctx.strokeStyle = theme.colors.date.icon;
    ctx.lineWidth = 1.5;
    const iconX = x + width - padding - 10;
    const iconY = y + height / 2;

    ctx.beginPath();
    ctx.moveTo(iconX - 6, iconY - 6);
    ctx.lineTo(iconX - 6, iconY + 6);
    ctx.lineTo(iconX + 6, iconY + 6);
    ctx.lineTo(iconX + 6, iconY - 6);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(iconX - 6, iconY - 2);
    ctx.lineTo(iconX + 6, iconY - 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(iconX - 3, iconY - 8);
    ctx.lineTo(iconX - 3, iconY - 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(iconX + 3, iconY - 8);
    ctx.lineTo(iconX + 3, iconY - 5);
    ctx.stroke();

    return { type: "date", config };
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return format
      .replace("YYYY", String(year))
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  }
}
