/**
 * TagsRenderer - Renders tags cells
 */

import { TagsConfig, TagItem, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class TagsRenderer extends BaseCellRenderer {
  readonly type: CellType = "tag";

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value } = context;

    const config = value as TagsConfig;
    const padding = 8;
    const { tags, maxRows = 1 } = config;

    if (!tags || tags.length === 0) {
      return { type: "tag", config };
    }

    const tagPadding = 4;
    const tagHeight = theme.font.size + tagPadding * 2;
    const tagRadius = 4;
    const gap = 4;
    const lineGap = 2;
    const ellipsis = "...";

    const availableWidth = width - padding * 2;
    const maxLineCount = maxRows;

    const moreTagWidth = (count: number) => {
      const moreText = `+${count}`;
      return ctx.measureText(moreText).width + tagPadding * 2;
    };

    const calculateTagWidth = (tag: TagItem): number => {
      return ctx.measureText(tag.text).width + tagPadding * 2;
    };

    const ellipsisWidth = ctx.measureText(ellipsis).width;

    const lines: { tag: TagItem; displayText: string; width: number }[][] = [];
    let currentLine: { tag: TagItem; displayText: string; width: number }[] = [];
    let currentLineWidth = 0;
    let processedTags = 0;

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i]!;
      const tagWidth = calculateTagWidth(tag);

      const isLastLine = lines.length >= maxLineCount - 1;
      const remainingTags = tags.length - i;

      if (isLastLine) {
        const moreWidth = remainingTags > 1 ? moreTagWidth(remainingTags - 1) + gap : 0;
        const remainingSpace = availableWidth - currentLineWidth - moreWidth;

        if (tagWidth <= remainingSpace) {
          currentLine.push({ tag, displayText: tag.text, width: tagWidth });
          currentLineWidth += tagWidth + gap;
          processedTags++;
        } else {
          const truncatedTagSpace = availableWidth - currentLineWidth - moreWidth;
          if (truncatedTagSpace >= tagPadding * 2 + ellipsisWidth + 10) {
            const maxTextWidth = truncatedTagSpace - tagPadding * 2 - ellipsisWidth;
            let truncatedText = "";
            let textWidth = 0;
            for (const char of tag.text) {
              const charWidth = ctx.measureText(char).width;
              if (textWidth + charWidth > maxTextWidth) break;
              truncatedText += char;
              textWidth += charWidth;
            }
            if (truncatedText.length > 0) {
              const displayText = truncatedText + ellipsis;
              const truncatedWidth = ctx.measureText(displayText).width + tagPadding * 2;
              currentLine.push({ tag, displayText, width: truncatedWidth });
              processedTags++;
            }
          }
          break;
        }
      } else {
        if (tagWidth <= availableWidth - currentLineWidth) {
          currentLine.push({ tag, displayText: tag.text, width: tagWidth });
          currentLineWidth += tagWidth + gap;
          processedTags++;
        } else {
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }
          currentLine = [{ tag, displayText: tag.text, width: tagWidth }];
          currentLineWidth = tagWidth + gap;
          processedTags++;

          if (lines.length >= maxLineCount) {
            break;
          }
        }
      }
    }

    if (currentLine.length > 0 && lines.length < maxLineCount) {
      lines.push(currentLine);
    }

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
        const textX = currentX + (tagWidth - ctx.measureText(displayText).width) / 2;
        ctx.fillText(displayText, textX, textY);

        currentX += tagWidth + gap;
      }

      if (lineIndex === lines.length - 1) {
        const remainingCount = tags.length - processedTags;
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
          const textX = currentX + (moreWidth - ctx.measureText(moreText).width) / 2;
          ctx.fillText(moreText, textX, textY);
        }
      }
    }

    return { type: "tag", config };
  }
}
