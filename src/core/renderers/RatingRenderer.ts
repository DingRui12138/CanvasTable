/**
 * RatingRenderer - Renders rating/star cells
 *
 * Supports click-to-modify rating with optional half-star support.
 */

import { RatingConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class RatingRenderer extends BaseCellRenderer {
  readonly type: CellType = "rating";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, x, y, width, height, value, isDisabled } = context;

    const config = value as RatingConfig;
    const ratingValue = config.value ?? 0;
    const max = config.max ?? 5;
    const configuredStarSize = config.starSize ?? 16;
    const allowHalf = config.allowHalf ?? false;

    // 当 cell 宽度不足以容纳所有星星时，按 cell 宽度等比缩小，避免越界绘制到相邻列
    const starSize = Math.min(configuredStarSize, Math.floor(width / max));

    // Default colors
    const activeColor = config.color ?? "#FFD700";
    const inactiveColor = config.inactiveColor ?? "#E0E0E0";
    const disabledColor = config.disabledColor ?? "#BDBDBD";

    // Use disabled color if cell is disabled
    const fillColor = isDisabled ? disabledColor : activeColor;
    const emptyColor = isDisabled ? disabledColor : inactiveColor;

    // Calculate star positions (centered in cell)
    const totalWidth = max * starSize;
    const startX = x + (width - totalWidth) / 2;
    const startY = y + (height - starSize) / 2;

    ctx.save();

    // Store star bounds for click detection
    const starBounds: Array<{ index: number; x: number; width: number }> = [];

    for (let i = 0; i < max; i++) {
      const starX = startX + i * starSize;

      // Record bounds for click detection
      starBounds.push({
        index: i,
        x: starX,
        width: starSize,
      });

      // Calculate fill amount for this star
      const starValue = ratingValue - i;
      let fillAmount = 0;

      if (starValue >= 1) {
        fillAmount = 1; // Full star
      } else if (starValue > 0) {
        fillAmount = allowHalf ? starValue : 0; // Half star or empty
      }

      // Draw the star
      this.drawStar(ctx, starX, startY, starSize, fillAmount, fillColor, emptyColor);
    }

    ctx.restore();

    return {
      type: "rating",
      config: { ...config, value: ratingValue },
      starBounds,
    };
  }

  /**
   * Draw a star at the given position
   * @param ctx Canvas context
   * @param x Star center X
   * @param y Star center Y
   * @param size Star size
   * @param fillAmount Fill amount (0-1, supports half)
   * @param fillColor Fill color
   * @param emptyColor Empty/background color
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    fillAmount: number,
    fillColor: string,
    emptyColor: string,
  ): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4; // Inner radius ratio

    // Star points (5-pointed star)
    const points = this.getStarPoints(centerX, centerY, outerRadius, innerRadius);

    // Draw empty star background first
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i]!.x, points[i]!.y);
    }
    ctx.closePath();
    ctx.fillStyle = emptyColor;
    ctx.fill();

    // Draw filled portion
    if (fillAmount > 0) {
      ctx.save();

      // Create clipping path for filled portion
      ctx.beginPath();
      ctx.rect(x, y, size * fillAmount, size);
      ctx.clip();

      // Draw filled star
      ctx.beginPath();
      ctx.moveTo(points[0]!.x, points[0]!.y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i]!.x, points[i]!.y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Calculate star points coordinates
   */
  private getStarPoints(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];
    const angleStep = Math.PI / 5; // 36 degrees
    const startAngle = -Math.PI / 2; // Start from top

    for (let i = 0; i < 10; i++) {
      const angle = startAngle + i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }

    return points;
  }
}
