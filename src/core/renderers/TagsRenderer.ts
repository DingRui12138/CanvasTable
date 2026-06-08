/**
 * TagsRenderer - Renders tags cells
 */

import { TagsConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
import { layoutTags } from "../../utils";

export class TagsRenderer extends BaseCellRenderer {
  readonly type: CellType = "tag";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value, locale } = context;

    const config = value as TagsConfig;
    const padding = 8;

    if (!config.tags || config.tags.length === 0) {
      const placeholder = config.placeholder ?? locale.cell.tagPlaceholder;
      if (placeholder) {
        ctx.fillStyle = theme.colors.placeholderText;
        ctx.font = `${theme.font.size}px ${theme.font.family}`;
        ctx.textBaseline = "middle";
        ctx.fillText(placeholder, x + padding, y + height / 2);
      }
      return { type: "tag", config };
    }

    const tagPadding = 4;
    const tagHeight = theme.font.size + tagPadding * 2;
    const tagRadius = 4;
    const gap = 4;
    const lineGap = 2;
    const textWidthCache = new Map<string, number>();
    const measureTextCached = (text: string): number => {
      let measuredWidth = textWidthCache.get(text);
      if (measuredWidth === undefined) {
        measuredWidth = ctx.measureText(text).width;
        textWidthCache.set(text, measuredWidth);
      }
      return measuredWidth;
    };
    const moreTagWidth = (count: number) => measureTextCached(`+${count}`) + tagPadding * 2;
    const { lines, processedTags } = layoutTags(ctx, config, width, height, theme.font.size);

    const totalHeight = lines.length * tagHeight + (lines.length - 1) * lineGap;
    const startY = y + (height - totalHeight) / 2;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]!;
      const lineY = startY + lineIndex * (tagHeight + lineGap);
      let currentX = x + padding;

      for (const { tag, displayText, width: tagWidth } of line) {
        let bgColor = tag.bgColor ?? (theme.colors.tagColors.default || "#f0f0f0");
        let textColor = tag.color ?? theme.colors.cellText;

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(currentX, lineY, tagWidth, tagHeight, tagRadius);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.font = `${theme.font.size}px ${theme.font.family}`;
        ctx.textBaseline = "middle";

        const textY = lineY + tagHeight / 2;
        const textX = currentX + (tagWidth - measureTextCached(displayText)) / 2;
        ctx.fillText(displayText, textX, textY);

        currentX += tagWidth + gap;
      }

      if (lineIndex === lines.length - 1) {
        const remainingCount = config.tags.length - processedTags;
        if (remainingCount > 0) {
          const moreText = `+${remainingCount}`;
          const moreWidth = moreTagWidth(remainingCount);

          ctx.fillStyle = theme.colors.moreCount.background;
          ctx.beginPath();
          ctx.roundRect(currentX, lineY, moreWidth, tagHeight, tagRadius);
          ctx.fill();

          ctx.fillStyle = theme.colors.moreCount.text;
          ctx.font = `${theme.font.size}px ${theme.font.family}`;
          ctx.textBaseline = "middle";
          const textY = lineY + tagHeight / 2;
          const textX = currentX + (moreWidth - measureTextCached(moreText)) / 2;
          ctx.fillText(moreText, textX, textY);
        }
      }
    }

    return { type: "tag", config };
  }
}
