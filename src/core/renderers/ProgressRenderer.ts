/**
 * ProgressRenderer - Renders progress bar cells
 */

import { ProgressConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class ProgressRenderer extends BaseCellRenderer {
  readonly type: CellType = "progress";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value } = context;

    const config = value as ProgressConfig;
    const shape = config.shape ?? "line";

    if (shape === "line") {
      this.renderLineProgress(ctx, theme, x, y, width, height, config);
    } else if (shape === "circle") {
      this.renderCircleProgress(ctx, theme, x, y, width, height, config);
    } else if (shape === "dashboard") {
      this.renderDashboardProgress(ctx, theme, x, y, width, height, config);
    }

    return { type: "progress", config };
  }

  private renderLineProgress(
    ctx: CanvasRenderingContext2D,
    theme: import("../../types").TableTheme,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ProgressConfig,
  ): void {
    const padding = 8;
    const textPosition = config.textPosition ?? "right";
    const showText = config.showText ?? true;
    const size = config.size ?? "medium";

    ctx.save();

    const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
    const textGap = 8;
    const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
    const barWidth = config.width ?? cellWidth - padding * 2 - textReservedWidth;

    const barX = x + padding;
    const barY = y + (cellHeight - barHeight) / 2;

    const clampedValue = Math.min(100, Math.max(0, config.value));

    const progressColor = this.getProgressColor(theme, config, clampedValue);
    const trackColor = config.trackColor ?? theme.colors.progress.track;
    const radius = config.borderRadius ?? barHeight / 2;

    ctx.fillStyle = trackColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, radius);
    ctx.fill();

    const progressWidth = (clampedValue / 100) * barWidth;
    if (progressWidth > 0) {
      ctx.fillStyle = progressColor;
      ctx.beginPath();
      const actualProgressWidth = Math.max(progressWidth, radius * 2);
      ctx.roundRect(barX, barY, actualProgressWidth, barHeight, radius);
      ctx.fill();
    }

    if (showText) {
      const precision = config.precision ?? 0;
      const text = config.format
        ? config.format(clampedValue)
        : `${precision === 0 ? Math.round(clampedValue) : clampedValue.toFixed(precision)}%`;

      let fontSize: number;
      if (textPosition === "inside") {
        fontSize = Math.min(theme.font.size, Math.max(10, barHeight - 2));
      } else {
        fontSize = size === "small" ? 11 : size === "large" ? 14 : theme.font.size;
      }

      ctx.font = `${fontSize}px ${theme.font.family}`;
      ctx.textBaseline = "middle";

      if (textPosition === "right") {
        ctx.textAlign = "left";
        ctx.fillStyle = config.textColor ?? theme.colors.cellText;
        ctx.fillText(text, barX + barWidth + textGap, y + cellHeight / 2);
      } else {
        ctx.textAlign = "center";
        ctx.fillStyle = config.textColor ?? theme.colors.cellText;
        ctx.fillText(text, barX + barWidth / 2, y + cellHeight / 2);
      }
    }

    ctx.restore();
  }

  private renderCircleProgress(
    ctx: CanvasRenderingContext2D,
    theme: import("../../types").TableTheme,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ProgressConfig,
  ): void {
    const size = config.size ?? "medium";

    const sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
    const defaultDiameter = Math.floor(cellHeight * sizeRatio);
    const diameter = config.width ?? defaultDiameter;
    const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));

    const centerX = x + cellWidth / 2;
    const centerY = y + cellHeight / 2;
    const radius = (diameter - strokeWidth) / 2;

    const clampedValue = Math.min(100, Math.max(0, config.value));

    const progressColor = this.getProgressColor(theme, config, clampedValue);
    const trackColor = config.trackColor ?? theme.colors.progress.track;

    ctx.save();

    ctx.strokeStyle = trackColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    const progress = clampedValue / 100;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * Math.PI * 2;

    if (progress > 0) {
      ctx.strokeStyle = progressColor;
      ctx.lineCap = config.strokeLinecap ?? "round";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();
    }

    if (config.showText ?? true) {
      const precision = config.precision ?? 0;
      const text = config.format
        ? config.format(clampedValue)
        : `${precision === 0 ? Math.round(clampedValue) : clampedValue.toFixed(precision)}%`;
      ctx.fillStyle = config.textColor ?? theme.colors.cellText;
      const fontSize = Math.max(8, Math.round(diameter * 0.32));
      ctx.font = `bold ${fontSize}px ${theme.font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, centerX, centerY);
    }

    ctx.restore();
  }

  private renderDashboardProgress(
    ctx: CanvasRenderingContext2D,
    theme: import("../../types").TableTheme,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ProgressConfig,
  ): void {
    const size = config.size ?? "medium";

    const sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
    const defaultDiameter = Math.floor(cellHeight * sizeRatio);
    const diameter = config.width ?? defaultDiameter;
    const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.1));

    const centerX = x + cellWidth / 2;
    const centerY = y + cellHeight / 2 + cellHeight * 0.05;
    const radius = (diameter - strokeWidth) / 2;

    const clampedValue = Math.min(100, Math.max(0, config.value));

    const progressColor = this.getProgressColor(theme, config, clampedValue);
    const trackColor = config.trackColor ?? theme.colors.progress.track;

    const startAngle = Math.PI * 0.75;
    const totalAngle = Math.PI * 1.5;

    ctx.save();

    ctx.strokeStyle = trackColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = config.strokeLinecap ?? "round";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle, false);
    ctx.stroke();

    const progress = clampedValue / 100;
    if (progress > 0) {
      const progressEndAngle = startAngle + progress * totalAngle;

      ctx.strokeStyle = progressColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, progressEndAngle, false);
      ctx.stroke();
    }

    if (config.showText ?? true) {
      const precision = config.precision ?? 0;
      const text = config.format
        ? config.format(clampedValue)
        : `${precision === 0 ? Math.round(clampedValue) : clampedValue.toFixed(precision)}%`;
      ctx.fillStyle = config.textColor ?? theme.colors.cellText;
      const fontSize = Math.max(8, Math.round(diameter * 0.28));
      ctx.font = `bold ${fontSize}px ${theme.font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, centerX, centerY);
    }

    ctx.restore();
  }

  private getProgressColor(
    theme: import("../../types").TableTheme,
    config: ProgressConfig,
    value: number,
  ): string {
    const { color, status } = config;

    if (status === "success") return theme.colors.progress.success;
    if (status === "warning") return theme.colors.progress.warning;
    if (status === "error") return theme.colors.progress.error;

    if (typeof color === "string") return color;

    if (typeof color === "function") return color(value);

    if (Array.isArray(color) && color.length > 0) {
      const sorted = [...color].sort((a, b) => a.value - b.value);

      if (value <= sorted[0]!.value) return sorted[0]!.color;
      if (value >= sorted[sorted.length - 1]!.value) return sorted[sorted.length - 1]!.color;

      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i]!;
        const next = sorted[i + 1]!;
        if (value >= curr.value && value <= next.value) {
          const ratio = (value - curr.value) / (next.value - curr.value);
          return this.interpolateColor(curr.color, next.color, ratio);
        }
      }
    }

    return theme.colors.progress.default;
  }

  private interpolateColor(color1: string, color2: string, ratio: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
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
