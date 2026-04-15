/**
 * CheckboxRenderer - Renders checkbox cells
 */

import { CheckboxConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class CheckboxRenderer extends BaseCellRenderer {
  readonly type: CellType = "checkbox";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value, isDisabled } = context;

    const config = value as CheckboxConfig;
    const size = 16;
    const checkboxX = x + (width - size) / 2;
    const checkboxY = y + (height - size) / 2;
    const disabled = isDisabled ?? false;

    ctx.fillStyle = disabled ? theme.colors.checkbox.disabledBg : theme.colors.button.background;
    ctx.strokeStyle = theme.colors.checkbox.border;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(checkboxX, checkboxY, size, size, 3);
    ctx.fill();
    ctx.stroke();

    if (config.indeterminate) {
      ctx.strokeStyle = disabled ? theme.colors.checkbox.border : theme.colors.checkbox.checkedBg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(checkboxX + 4, checkboxY + size / 2);
      ctx.lineTo(checkboxX + size - 4, checkboxY + size / 2);
      ctx.stroke();
    } else if (config.checked) {
      ctx.strokeStyle = disabled ? theme.colors.checkbox.border : theme.colors.checkbox.checkedBg;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(checkboxX + 4, checkboxY + size / 2);
      ctx.lineTo(checkboxX + size / 2 - 1, checkboxY + size - 5);
      ctx.lineTo(checkboxX + size - 3, checkboxY + 4);
      ctx.stroke();
    }

    return { type: "checkbox", config };
  }
}
