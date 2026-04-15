/**
 * SelectRenderer - Renders select dropdown cells
 */

import { SelectConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class SelectRenderer extends BaseCellRenderer {
  readonly type: CellType = "select";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value } = context;

    const config = value as SelectConfig;
    const padding = 8;
    const arrowWidth = 20;

    ctx.strokeStyle = theme.colors.input.border;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();

    let displayText = "";
    if (config.multiple && Array.isArray(config.value)) {
      if (config.value.length > 0) {
        const labels = config.value.map((v) => {
          const opt = config.options.find((o) => o.value === v);
          return opt?.label ?? String(v);
        });
        displayText = labels.join(", ");
      }
    } else if (config.value !== undefined && config.value !== null) {
      const selectedOption = config.options.find((opt) => opt.value === config.value);
      displayText = selectedOption?.label ?? String(config.value);
    }

    const placeholder = config.placeholder ?? "请选择";
    const text = displayText || placeholder;

    ctx.fillStyle = displayText ? theme.colors.cellText : theme.colors.placeholderText;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";

    const maxTextWidth = width - padding * 2 - arrowWidth;
    const truncatedText = this.truncateText(ctx, text, maxTextWidth);
    ctx.fillText(truncatedText, x + padding, y + height / 2);

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
}
