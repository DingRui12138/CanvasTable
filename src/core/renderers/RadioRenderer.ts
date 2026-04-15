/**
 * RadioRenderer - Renders radio button cells
 */

import { RadioConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class RadioRenderer extends BaseCellRenderer {
  readonly type: CellType = "radio";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value, isDisabled } = context;

    const config = value as RadioConfig;
    const size = 16;
    const padding = 8;
    const gap = 4;
    const columnDisabled = isDisabled ?? false;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    if (config.options && config.options.length > 0) {
      ctx.font = `${theme.font.size}px ${theme.font.family}`;

      const optionWidths: number[] = config.options.map((option) => {
        const textWidth = ctx.measureText(option.label).width;
        return size + gap + textWidth + padding;
      });

      let currentX = x + padding;
      const maxX = x + width - padding;

      for (let i = 0; i < config.options.length; i++) {
        const option = config.options[i]!;
        const optionWidth = optionWidths[i]!;

        if (currentX + optionWidth - padding > maxX) {
          break;
        }

        const radioX = currentX;
        const radioY = y + (height - size) / 2;
        const centerX = radioX + size / 2;
        const centerY = radioY + size / 2;
        const optionDisabled = option.disabled || columnDisabled;
        const isChecked = config.value === option.value;

        ctx.fillStyle = optionDisabled
          ? theme.colors.radio.disabledBg
          : theme.colors.button.background;
        ctx.strokeStyle = theme.colors.radio.border;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isChecked) {
          ctx.fillStyle = optionDisabled ? theme.colors.radio.border : theme.colors.radio.checkedBg;
          ctx.beginPath();
          ctx.arc(centerX, centerY, size / 2 - 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = optionDisabled ? theme.colors.placeholderText : theme.colors.cellText;
        ctx.font = `${theme.font.size}px ${theme.font.family}`;
        ctx.textBaseline = "middle";
        const textX = radioX + size + gap;
        ctx.fillText(option.label, textX, centerY);

        currentX += optionWidth;
      }
    } else {
      const radioX = x + (width - size) / 2;
      const radioY = y + (height - size) / 2;
      const centerX = radioX + size / 2;
      const centerY = radioY + size / 2;

      ctx.fillStyle = columnDisabled
        ? theme.colors.radio.disabledBg
        : theme.colors.button.background;
      ctx.strokeStyle = theme.colors.radio.border;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (config.checked) {
        ctx.fillStyle = columnDisabled ? theme.colors.radio.border : theme.colors.radio.checkedBg;
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();

    return { type: "radio", config };
  }
}
