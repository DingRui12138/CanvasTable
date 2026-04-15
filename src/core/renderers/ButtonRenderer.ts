/**
 * ButtonRenderer - Renders button cells
 */

import { ButtonConfig, ButtonsConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class ButtonRenderer extends BaseCellRenderer {
  readonly type: CellType = "button";

  render(context: CellRendererContext): CellRenderResult {
    const { value, buttonHoverState } = context;

    const config = value as ButtonConfig | ButtonsConfig;

    // Handle ButtonsConfig (multiple buttons)
    if (this.isButtonsConfig(config)) {
      return this.renderButtons(context, config);
    }

    return this.renderSingleButton(context, config, buttonHoverState?.progress);
  }

  private isButtonsConfig(config: ButtonConfig | ButtonsConfig): config is ButtonsConfig {
    return "buttons" in config;
  }

  private renderSingleButton(
    context: CellRendererContext,
    config: ButtonConfig,
    hoverProgress?: number,
  ): CellRenderResult {
    const { ctx, theme, x, y, width, height, isDisabled } = context;

    const cellPadding = 8;
    const buttonHeight = config.size === "small" ? 24 : config.size === "large" ? 40 : 32;
    const buttonY = y + (height - buttonHeight) / 2;
    const disabled = isDisabled ?? false;

    // Calculate button width based on text content
    const text = config.text ?? "Button";
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    const textWidth = ctx.measureText(text).width;
    const buttonPadding = 16;
    const buttonWidth = Math.min(
      Math.max(textWidth + buttonPadding * 2, 60),
      width - cellPadding * 2,
    );
    const buttonX = x + (width - buttonWidth) / 2;

    const progress = hoverProgress ?? 0;

    let bgColor: string;
    let textColor: string;
    let borderColor: string;

    if (disabled) {
      bgColor = theme.colors.button.disabledBg;
      textColor = theme.colors.button.disabledText;
      borderColor = theme.colors.button.disabledBorder;
    } else {
      switch (config.variant) {
        case "primary":
          bgColor = theme.colors.button.primaryBg;
          textColor = theme.colors.button.primaryText;
          borderColor = bgColor;
          break;
        case "danger":
          bgColor = theme.colors.button.dangerBg;
          textColor = theme.colors.button.dangerText;
          borderColor = bgColor;
          break;
        case "warning":
          bgColor = theme.colors.button.warningBg;
          textColor = theme.colors.button.warningText;
          borderColor = bgColor;
          break;
        case "link":
          bgColor = "transparent";
          textColor = theme.colors.button.linkText;
          borderColor = "transparent";
          break;
        default:
          bgColor = theme.colors.button.background;
          textColor = theme.colors.button.text;
          borderColor = theme.colors.button.border;
      }
    }

    if (!disabled && progress > 0 && config.variant !== "link") {
      if (config.variant === "default" || !config.variant) {
        const bgRgb = this.hexToRgb(theme.colors.button.background);
        const brightness = (bgRgb.r * 299 + bgRgb.g * 587 + bgRgb.b * 114) / 1000;

        if (brightness > 128) {
          const hoverGray = Math.round(bgRgb.r - progress * 0.2 * bgRgb.r);
          bgColor = `rgb(${hoverGray}, ${hoverGray}, ${hoverGray})`;
        } else {
          const hoverGray = Math.round(bgRgb.r + progress * 0.2 * (255 - bgRgb.r));
          bgColor = `rgb(${hoverGray}, ${hoverGray}, ${hoverGray})`;
        }
      } else {
        ctx.globalAlpha = 1 - progress * 0.2;
      }
    }

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;

    const radius = 4;
    ctx.beginPath();
    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, radius);
    ctx.fill();
    ctx.stroke();

    if (!disabled && progress > 0 && config.variant !== "link") {
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = textColor;
    ctx.font = `${theme.font.size}px ${theme.font.family}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    ctx.textAlign = "left";

    return { type: "button", config };
  }

  private renderButtons(context: CellRendererContext, config: ButtonsConfig): CellRenderResult {
    const { ctx, theme, x, y, height, isDisabled, hoveredButtonIndex } = context;

    const padding = 8;
    const gap = config.gap ?? 4;
    const maxVisible = config.maxVisible ?? 3;
    const buttonHeight = 24;
    const buttonY = y + (height - buttonHeight) / 2;

    const visibleButtons = config.buttons.filter((btn) => btn.visible !== false);

    const displayButtons = visibleButtons.slice(0, maxVisible);
    const moreButtons = visibleButtons.slice(maxVisible);

    let currentX = x + padding;

    for (let i = 0; i < displayButtons.length; i++) {
      const btn = displayButtons[i]!;
      const text = btn.text ?? "Button";
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      const textWidth = ctx.measureText(text).width;
      const buttonWidth = Math.max(textWidth + 16, 40);

      const isHovered = hoveredButtonIndex === i;
      const isBtnDisabled = isDisabled ?? false;

      let bgColor: string;
      let textColor: string;
      let borderColor: string;

      if (isBtnDisabled) {
        bgColor = theme.colors.button.disabledBg;
        textColor = theme.colors.button.disabledText;
        borderColor = theme.colors.button.disabledBorder;
      } else if (btn.variant === "primary") {
        bgColor = theme.colors.button.primaryBg;
        textColor = theme.colors.button.primaryText;
        borderColor = bgColor;
      } else if (btn.variant === "danger") {
        bgColor = theme.colors.button.dangerBg;
        textColor = theme.colors.button.dangerText;
        borderColor = bgColor;
      } else if (btn.variant === "warning") {
        bgColor = theme.colors.button.warningBg;
        textColor = theme.colors.button.warningText;
        borderColor = bgColor;
      } else if (btn.variant === "link") {
        bgColor = "transparent";
        textColor = theme.colors.button.linkText;
        borderColor = "transparent";
      } else {
        bgColor = isHovered ? theme.colors.button.hoverBg : theme.colors.button.background;
        textColor = theme.colors.button.text;
        borderColor = theme.colors.button.border;
      }

      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(currentX, buttonY, buttonWidth, buttonHeight, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(text, currentX + buttonWidth / 2, buttonY + buttonHeight / 2);

      currentX += buttonWidth + gap;
    }

    // Render more button if needed
    if (moreButtons.length > 0) {
      const moreText = `+${moreButtons.length}`;
      const moreWidth = 32;
      const isMoreHovered = hoveredButtonIndex === displayButtons.length;

      ctx.fillStyle = isMoreHovered ? theme.colors.button.hoverBg : theme.colors.button.background;
      ctx.strokeStyle = theme.colors.button.border;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(currentX, buttonY, moreWidth, buttonHeight, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.colors.button.text;
      ctx.font = `${theme.font.size}px ${theme.font.family}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(moreText, currentX + moreWidth / 2, buttonY + buttonHeight / 2);
    }

    ctx.textAlign = "left";

    return { type: "button", config };
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
