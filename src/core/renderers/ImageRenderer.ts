/**
 * ImageRenderer - Renders image cells (single & multi-image grid).
 *
 * The renderer is stateless: all runtime concerns (image load queue,
 * lazy-load gating, per-frame visibility tracking) live on the host
 * Renderer and are exposed via {@link ImageRuntime} on the context.
 */

import { ImageConfig, CellType, TableTheme } from "../../types";
import {
  BaseCellRenderer,
  CellRendererContext,
  CellRenderResult,
  ImageRuntime,
} from "./CellRenderer";

const STANDARD_ROW_HEIGHT = 32;

export class ImageRenderer extends BaseCellRenderer {
  readonly type: CellType = "image";

  render(context: CellRendererContext): CellRenderResult {
    const {
      ctx,
      theme,
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      value,
      isHovered,
      hoveredImageIndex,
      rowIndex,
      imageRuntime,
    } = context;

    const config = value as ImageConfig;

    // Multi-image mode
    if (config.images && config.images.length > 0) {
      this.renderMultipleImages(
        ctx,
        theme,
        x,
        y,
        cellWidth,
        cellHeight,
        config,
        rowIndex,
        isHovered,
        hoveredImageIndex,
        imageRuntime,
      );
      return { type: "image", config };
    }

    // Single-image mode
    if (!config.src) {
      return { type: "image", config };
    }

    const padding = 4;
    const maxImgSize = this.getMaxImageSize(cellWidth, cellHeight, padding, config);
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const borderRadius = config.circle
      ? Math.min(imgWidth, imgHeight) / 2
      : (config.borderRadius ?? 0);

    const imgX = x + (cellWidth - imgWidth) / 2;
    const imgY = y + (cellHeight - imgHeight) / 2;

    // Placeholder background
    ctx.fillStyle = theme.colors.image.placeholderBg;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
    } else {
      ctx.rect(imgX, imgY, imgWidth, imgHeight);
    }
    ctx.fill();

    // Lazy load gating
    const lazyEnabled = config.lazy !== false;
    const threshold = config.lazyThreshold ?? 200;
    if (
      lazyEnabled &&
      rowIndex !== undefined &&
      rowIndex >= 0 &&
      imageRuntime &&
      !imageRuntime.isInLazyLoadRange(rowIndex, threshold)
    ) {
      this.renderImagePlaceholder(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
        imageRuntime,
      );
      if (isHovered && config.hoverable !== false) {
        this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
      }
      return { type: "image", config };
    }

    if (imageRuntime?.isFailed(config.src)) {
      this.renderImageError(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.errorImage,
        imageRuntime,
      );
      return { type: "image", config };
    }

    const cachedImage = imageRuntime?.get(config.src, Math.max(imgWidth, imgHeight)) ?? null;

    if (cachedImage) {
      ctx.save();
      ctx.beginPath();
      if (borderRadius > 0) {
        ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
      } else {
        ctx.rect(imgX, imgY, imgWidth, imgHeight);
      }
      ctx.clip();
      this.drawImageWithFit(
        ctx,
        cachedImage,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        config.fit ?? "cover",
      );
      ctx.restore();
      imageRuntime?.collectVisible(config.src);
    } else if (imageRuntime && !imageRuntime.isLoading(config.src)) {
      imageRuntime.collectVisible(config.src);
      imageRuntime.load(config.src, Math.max(imgWidth, imgHeight));
      this.renderImagePlaceholder(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
        imageRuntime,
      );
    } else {
      // Loading in progress — keep marking visible so it isn't cancelled
      imageRuntime?.collectVisible(config.src);
      this.renderImagePlaceholder(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
        imageRuntime,
      );
    }

    if (isHovered && config.hoverable !== false) {
      this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
    }

    return { type: "image", config };
  }

  private renderMultipleImages(
    ctx: CanvasRenderingContext2D,
    theme: TableTheme,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ImageConfig,
    rowIndex: number | undefined,
    isHovered: boolean | undefined,
    hoveredImageIndex: number | undefined,
    imageRuntime: ImageRuntime | undefined,
  ): void {
    const images = config.images!;
    const padding = 4;
    const maxImgSize = this.getMaxImageSize(cellWidth, cellHeight, padding, config);
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const gap = config.gap ?? 4;
    const borderRadius = config.circle
      ? Math.min(imgWidth, imgHeight) / 2
      : (config.borderRadius ?? 0);
    const showMoreCount = config.showMoreCount !== false;

    const availableWidth = cellWidth - padding * 2;
    const availableHeight = cellHeight - padding * 2;
    const imagesPerRow = Math.max(1, Math.floor((availableWidth + gap) / (imgWidth + gap)));
    const maxRows = Math.max(1, Math.floor((availableHeight + gap) / (imgHeight + gap)));

    const slotCapacity = imagesPerRow * maxRows;
    const requestedMaxVisible = config.maxVisible ?? slotCapacity;
    const needsMoreCount = showMoreCount && images.length > requestedMaxVisible;
    // 当总槽位仅够放下 +N 角标时，让出图片位，仅显示 +N
    const maxVisibleCapacity = needsMoreCount ? Math.max(0, slotCapacity - 1) : slotCapacity;
    const maxVisible = Math.min(requestedMaxVisible, maxVisibleCapacity);

    const lazyEnabled = config.lazy !== false;
    const threshold = config.lazyThreshold ?? 200;
    let inLazyRange = true;
    if (lazyEnabled && rowIndex !== undefined && rowIndex >= 0 && imageRuntime) {
      inLazyRange = imageRuntime.isInLazyLoadRange(rowIndex, threshold);
    }

    const hasMore = images.length > maxVisible;
    const displayCount = hasMore ? maxVisible : images.length;
    const displayImages = images.slice(0, displayCount);
    const moreCount = hasMore ? images.length - maxVisible : 0;

    const renderItemCount = displayCount + (hasMore && showMoreCount ? 1 : 0);
    const displayRows = Math.max(1, Math.ceil(renderItemCount / imagesPerRow));
    const widestRowItems = Math.min(renderItemCount, imagesPerRow);
    const contentWidth = widestRowItems * imgWidth + Math.max(0, widestRowItems - 1) * gap;
    const contentHeight = displayRows * imgHeight + Math.max(0, displayRows - 1) * gap;

    let startX = x + (cellWidth - contentWidth) / 2;
    startX = Math.max(x + padding, startX);
    const startY = y + (cellHeight - contentHeight) / 2;

    for (let i = 0; i < displayImages.length; i++) {
      const src = displayImages[i]!;
      const row = Math.floor(i / imagesPerRow);
      const col = i % imagesPerRow;
      const imgX = startX + col * (imgWidth + gap);
      const imgY = startY + row * (imgHeight + gap);
      const isCurrentHovered = !!isHovered && config.hoverable !== false && hoveredImageIndex === i;

      ctx.fillStyle = theme.colors.image.placeholderBg;
      ctx.beginPath();
      if (borderRadius > 0) {
        ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
      } else {
        ctx.rect(imgX, imgY, imgWidth, imgHeight);
      }
      ctx.fill();

      if (!inLazyRange) {
        this.renderImagePlaceholder(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
          imageRuntime,
        );
        if (isCurrentHovered) {
          this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }

      if (imageRuntime?.isFailed(src)) {
        this.renderImageError(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.errorImage,
          imageRuntime,
        );
        if (isCurrentHovered) {
          this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }

      const cachedImage = imageRuntime?.get(src, Math.max(imgWidth, imgHeight)) ?? null;
      if (cachedImage) {
        ctx.save();
        ctx.beginPath();
        if (borderRadius > 0) {
          ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
        } else {
          ctx.rect(imgX, imgY, imgWidth, imgHeight);
        }
        ctx.clip();
        this.drawImageWithFit(
          ctx,
          cachedImage,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          config.fit ?? "cover",
        );
        ctx.restore();
        imageRuntime?.collectVisible(src);
      } else if (imageRuntime && !imageRuntime.isLoading(src)) {
        imageRuntime.collectVisible(src);
        imageRuntime.load(src, Math.max(imgWidth, imgHeight));
        this.renderImagePlaceholder(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
          imageRuntime,
        );
      } else {
        imageRuntime?.collectVisible(src);
        this.renderImagePlaceholder(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
          imageRuntime,
        );
      }

      if (isCurrentHovered) {
        this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
      }
    }

    if (hasMore && showMoreCount) {
      const lastRow = Math.floor(displayCount / imagesPerRow);
      const lastCol = displayCount % imagesPerRow;
      const countX = startX + lastCol * (imgWidth + gap);
      const countY = startY + lastRow * (imgHeight + gap);
      const isMoreHovered =
        !!isHovered && config.hoverable !== false && hoveredImageIndex === displayCount;
      this.renderMoreCount(
        ctx,
        theme,
        countX,
        countY,
        imgWidth,
        imgHeight,
        borderRadius,
        moreCount,
        isMoreHovered,
      );
    }
  }

  private getMaxImageSize(
    cellWidth: number,
    cellHeight: number,
    padding: number,
    config: ImageConfig,
  ): number {
    const maxHeight =
      config.scaleWithRowHeight === false ? Math.min(cellHeight, STANDARD_ROW_HEIGHT) : cellHeight;
    return Math.max(0, Math.min(cellWidth, maxHeight) - padding * 2);
  }

  private renderImagePlaceholder(
    ctx: CanvasRenderingContext2D,
    theme: TableTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    placeholder: string | undefined,
    imageRuntime: ImageRuntime | undefined,
  ): void {
    if (placeholder && imageRuntime) {
      const cachedPlaceholder = imageRuntime.get(placeholder, Math.max(width, height));
      if (cachedPlaceholder) {
        ctx.save();
        ctx.beginPath();
        if (borderRadius > 0) {
          ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          ctx.rect(x, y, width, height);
        }
        ctx.clip();
        this.drawImageWithFit(ctx, cachedPlaceholder, x, y, width, height, "cover");
        ctx.restore();
        return;
      } else if (!imageRuntime.isLoading(placeholder)) {
        imageRuntime.load(placeholder, Math.max(width, height));
      }
    }

    ctx.fillStyle = theme.colors.image.placeholderBg;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fill();

    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + width / 2;
    const iconY = y + height / 2;

    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;

    ctx.strokeStyle = theme.colors.placeholderText;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(iconX - iconSize / 2, iconY + iconSize / 4);
    ctx.lineTo(iconX - iconSize / 4, iconY);
    ctx.lineTo(iconX, iconY + iconSize / 4);
    ctx.lineTo(iconX + iconSize / 4, iconY - iconSize / 4);
    ctx.lineTo(iconX + iconSize / 2, iconY + iconSize / 4);
    ctx.stroke();

    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
  }

  private renderImageError(
    ctx: CanvasRenderingContext2D,
    theme: TableTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    errorImage: string | undefined,
    imageRuntime: ImageRuntime | undefined,
  ): void {
    if (errorImage && imageRuntime) {
      const cachedErrorImage = imageRuntime.get(errorImage, Math.max(width, height));
      if (cachedErrorImage) {
        ctx.save();
        ctx.beginPath();
        if (borderRadius > 0) {
          ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          ctx.rect(x, y, width, height);
        }
        ctx.clip();
        this.drawImageWithFit(ctx, cachedErrorImage, x, y, width, height, "cover");
        ctx.restore();
        return;
      } else if (!imageRuntime.isLoading(errorImage) && !imageRuntime.isFailed(errorImage)) {
        imageRuntime.load(errorImage, Math.max(width, height));
      }
    }

    ctx.fillStyle = theme.colors.image.errorBg;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fill();

    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + width / 2;
    const iconY = y + height / 2;

    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;

    ctx.strokeStyle = theme.colors.image.errorBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(iconX - iconSize / 4, iconY - iconSize / 4);
    ctx.lineTo(iconX + iconSize / 4, iconY + iconSize / 4);
    ctx.moveTo(iconX + iconSize / 4, iconY - iconSize / 4);
    ctx.lineTo(iconX - iconSize / 4, iconY + iconSize / 4);
    ctx.stroke();

    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
  }

  private renderImageHover(
    ctx: CanvasRenderingContext2D,
    theme: TableTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
  ): void {
    const hoverBorderColor = theme.colors.image.hoverBorder;

    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;

    ctx.strokeStyle = hoverBorderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = theme.colors.image.hoverShadow;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = hoverBorderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
  }

  private renderMoreCount(
    ctx: CanvasRenderingContext2D,
    theme: TableTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    count: number,
    isHovered: boolean,
  ): void {
    ctx.fillStyle = isHovered ? theme.colors.image.hoverBorder : theme.colors.moreCount.background;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fill();

    const text = `+${count}`;
    ctx.fillStyle = theme.colors.moreCount.text;
    ctx.font = `bold ${Math.min(width, height) * 0.4}px ${theme.font.family}`;

    const prevAlign = ctx.textAlign;
    const prevBaseline = ctx.textBaseline;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + width / 2, y + height / 2);

    ctx.textAlign = prevAlign;
    ctx.textBaseline = prevBaseline;
  }

  private drawImageWithFit(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    containerWidth: number,
    containerHeight: number,
    fit: "fill" | "contain" | "cover" | "none",
  ): void {
    const imgRatio = img.width / img.height;
    const containerRatio = containerWidth / containerHeight;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    switch (fit) {
      case "fill":
        drawWidth = containerWidth;
        drawHeight = containerHeight;
        drawX = x;
        drawY = y;
        break;

      case "contain":
        if (imgRatio > containerRatio) {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        } else {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        }
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;

      case "cover":
        if (imgRatio > containerRatio) {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        } else {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        }
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;

      case "none":
      default:
        drawWidth = img.width;
        drawHeight = img.height;
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }
}
