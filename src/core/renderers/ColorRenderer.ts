/**
 * ColorRenderer - Renders color picker cells
 */

import { CellType, ColorPickerConfig } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

const STANDARD_ROW_HEIGHT = 32;

export class ColorRenderer extends BaseCellRenderer {
  readonly type: CellType = "color";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value, isDisabled } = context;
    const config = value as ColorPickerConfig;
    const padding = 8;
    const colorBoxSize = Math.min(STANDARD_ROW_HEIGHT - padding * 2, 24);
    const colorBoxX = x + (width - colorBoxSize) / 2;
    const colorBoxY = y + (height - colorBoxSize) / 2;

    ctx.fillStyle = config.value || "#ffffff";
    ctx.fillRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize);

    ctx.strokeStyle = isDisabled ? "#bdbdbd" : "#d9d9d9";
    ctx.lineWidth = 1;
    ctx.strokeRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize);

    if (config.showText) {
      ctx.fillStyle = this.getContrastColor(config.value || "#ffffff");
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.value || "", colorBoxX + colorBoxSize / 2, colorBoxY + colorBoxSize / 2);
    }

    return { type: "color", config };
  }

  private getContrastColor(hexColor: string): string {
    const rgb = this.hexToRgb(hexColor);
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16),
        }
      : { r: 255, g: 255, b: 255 };
  }
}
