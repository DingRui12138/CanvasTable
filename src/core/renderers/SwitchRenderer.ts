/**
 * SwitchRenderer - Renders switch/toggle cells
 */

import { SwitchConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class SwitchRenderer extends BaseCellRenderer {
  readonly type: CellType = "switch";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value, isDisabled, switchAnimation } = context;

    const config = value as SwitchConfig;
    const switchWidth = 44;
    const switchHeight = 22;
    const thumbSize = 18;
    const switchX = x + (width - switchWidth) / 2;
    const switchY = y + (height - switchHeight) / 2;
    const radius = switchHeight / 2;

    const isChecked = config.checked ?? false;
    const disabled = isDisabled ?? false;

    const progress = switchAnimation?.progress ?? (isChecked ? 1 : 0);
    const thumbTravel = switchWidth - thumbSize - 4;
    const thumbX = switchX + 2 + progress * thumbTravel;
    const thumbY = switchY + (switchHeight - thumbSize) / 2;

    ctx.save();

    const offColor = disabled ? theme.colors.switch.disabledOffBg : theme.colors.switch.offBg;
    const onColor = disabled ? theme.colors.switch.disabledOnBg : theme.colors.switch.onBg;

    const offRGB = this.hexToRgb(offColor);
    const onRGB = this.hexToRgb(onColor);

    const r = Math.round(offRGB.r + (onRGB.r - offRGB.r) * progress);
    const g = Math.round(offRGB.g + (onRGB.g - offRGB.g) * progress);
    const b = Math.round(offRGB.b + (onRGB.b - offRGB.b) * progress);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    ctx.beginPath();
    ctx.roundRect(switchX, switchY, switchWidth, switchHeight, radius);
    ctx.fill();

    ctx.fillStyle = theme.colors.switch.thumb;
    ctx.beginPath();
    ctx.arc(thumbX + thumbSize / 2, thumbY + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = theme.colors.shadow.color;
    ctx.shadowBlur = theme.colors.shadow.blur;
    ctx.shadowOffsetX = theme.colors.shadow.offsetX;
    ctx.shadowOffsetY = theme.colors.shadow.offsetY;

    ctx.restore();

    return { type: "switch", config };
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16),
        }
      : { r: 0, g: 0, b: 0 };
  }
}
