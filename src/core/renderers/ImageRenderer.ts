/**
 * ImageRenderer - Renders image cells
 *
 * Note: Image rendering requires access to image cache and loading state.
 * The actual image loading is handled by the main Renderer class.
 * This renderer focuses on the rendering logic for loaded images.
 */

import { ImageConfig, CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

export class ImageRenderer extends BaseCellRenderer {
  readonly type: CellType = "image";

  /**
   * Image cache reference - set by Renderer during initialization
   */
  static imageCache: Map<string, HTMLImageElement> = new Map();
  static loadingImages: Set<string> = new Set();
  static failedImages: Set<string> = new Set();

  render(context: CellRendererContext): CellRenderResult {
    const { ctx, theme, x, y, width, height, value, isHovered, hoveredImageIndex } = context;

    const config = value as ImageConfig;

    // Multi-image mode
    if (config.images && config.images.length > 0) {
      return this.renderMultipleImages(
        ctx,
        theme,
        x,
        y,
        width,
        height,
        config,
        isHovered,
        hoveredImageIndex,
      );
    }

    // Single image mode
    if (!config.src) {
      return { type: "image", config };
    }

    const padding = 4;
    const maxImgSize = Math.min(width, height) - padding * 2;
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const borderRadius = config.circle
      ? Math.min(imgWidth, imgHeight) / 2
      : (config.borderRadius ?? 0);

    const imgX = x + (width - imgWidth) / 2;
    const imgY = y + (height - imgHeight) / 2;

    // Draw placeholder background
    ctx.fillStyle = theme.colors.image.placeholderBg;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
    } else {
      ctx.rect(imgX, imgY, imgWidth, imgHeight);
    }
    ctx.fill();

    // Check if image is loaded
    if (ImageRenderer.failedImages.has(config.src)) {
      this.renderImageError(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.errorImage,
      );
      return { type: "image", config };
    }

    const cachedImage = ImageRenderer.imageCache.get(config.src);

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
    } else if (!ImageRenderer.loadingImages.has(config.src)) {
      // Signal that this image needs to be loaded
      // The main Renderer will handle actual loading
      this.renderImagePlaceholder(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
      );
    } else {
      this.renderImagePlaceholder(
        ctx,
        theme,
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
      );
    }

    // Hover effect
    if (isHovered && config.hoverable !== false) {
      this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
    }

    return { type: "image", config };
  }

  private renderMultipleImages(
    ctx: CanvasRenderingContext2D,
    theme: import("../../types").TableTheme,
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ImageConfig,
    isHovered?: boolean,
    hoveredImageIndex?: number,
  ): CellRenderResult {
    const images = config.images!;
    const padding = 4;
    const maxImgSize = Math.min(cellWidth, cellHeight) - padding * 2;
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
    const userMaxVisible = config.maxVisible;

    let calculatedMaxVisible: number;
    if (images.length === 1) {
      calculatedMaxVisible = 1;
    } else {
      const maxByWidth = Math.floor((availableWidth + gap) / (imgWidth + gap));
      const reservedForMore = showMoreCount ? 1 : 0;
      calculatedMaxVisible = Math.max(1, maxByWidth - reservedForMore);
    }

    const maxVisible =
      userMaxVisible !== undefined
        ? Math.min(userMaxVisible, calculatedMaxVisible)
        : calculatedMaxVisible;

    const hasMore = images.length > maxVisible;
    const displayCount = hasMore ? maxVisible : images.length;
    const displayImages = images.slice(0, displayCount);
    const moreCount = hasMore ? images.length - maxVisible : 0;

    let contentWidth: number;
    if (hasMore && showMoreCount) {
      contentWidth = displayCount * imgWidth + displayCount * gap + imgWidth;
    } else {
      contentWidth = displayImages.length * imgWidth + Math.max(0, displayImages.length - 1) * gap;
    }

    let startX = x + (cellWidth - contentWidth) / 2;
    startX = Math.max(x + padding, startX);
    const imgY = y + (cellHeight - imgHeight) / 2;

    for (let i = 0; i < displayImages.length; i++) {
      const src = displayImages[i]!;
      const imgX = startX + i * (imgWidth + gap);
      const isCurrentHovered = isHovered && config.hoverable !== false && hoveredImageIndex === i;

      ctx.fillStyle = theme.colors.image.placeholderBg;
      ctx.beginPath();
      if (borderRadius > 0) {
        ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
      } else {
        ctx.rect(imgX, imgY, imgWidth, imgHeight);
      }
      ctx.fill();

      if (ImageRenderer.failedImages.has(src)) {
        this.renderImageError(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.errorImage,
        );
        if (isCurrentHovered) {
          this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }

      const cachedImage = ImageRenderer.imageCache.get(src);
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
      } else {
        this.renderImagePlaceholder(
          ctx,
          theme,
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      }

      if (isCurrentHovered) {
        this.renderImageHover(ctx, theme, imgX, imgY, imgWidth, imgHeight, borderRadius);
      }
    }

    // Render +N count
    if (hasMore && showMoreCount) {
      const countX = startX + displayCount * (imgWidth + gap);
      const isMoreHovered =
        isHovered && config.hoverable !== false && hoveredImageIndex === displayCount;
      this.renderMoreCount(
        ctx,
        theme,
        countX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        moreCount,
        isMoreHovered,
      );
    }

    return { type: "image", config };
  }

  private renderImagePlaceholder(
    ctx: CanvasRenderingContext2D,
    theme: import("../../types").TableTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    placeholder?: string,
  ): void {
    ctx.fillStyle = theme.colors.image.placeholderBg;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fill();

    // Draw placeholder icon or text
    if (placeholder) {
      ctx.fillStyle = theme.colors.placeholderText;
      ctx.font = `${Math.min(12, width / 4)}px ${theme.font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(placeholder, x + width / 2, y + height / 2);
      ctx.textAlign = "left";
    }
  }

  private renderImageError(
    ctx: CanvasRenderingContext2D,
    theme: import("../../types").TableTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    errorImage?: string,
  ): void {
    ctx.fillStyle = theme.colors.image.errorBg ?? "#f0f0f0";
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.fill();

    if (errorImage) {
      const cachedErrorImage = ImageRenderer.imageCache.get(errorImage);
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
      }
    }

    // Draw error icon
    ctx.fillStyle = theme.colors.placeholderText;
    ctx.font = `bold ${Math.min(16, width / 2)}px ${theme.font.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", x + width / 2, y + height / 2);
    ctx.textAlign = "left";
  }

  private renderImageHover(
    ctx: CanvasRenderingContext2D,
    theme: import("../../types").TableTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
  ): void {
    ctx.strokeStyle = theme.colors.image.hoverBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (borderRadius > 0) {
      ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      ctx.rect(x, y, width, height);
    }
    ctx.stroke();
  }

  private renderMoreCount(
    ctx: CanvasRenderingContext2D,
    theme: import("../../types").TableTheme,
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    count: number,
    isHovered?: boolean,
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
    ctx.font = `bold ${theme.font.size}px ${theme.font.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + width / 2, y + height / 2);
    ctx.textAlign = "left";
  }

  private drawImageWithFit(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    fit: "cover" | "contain" | "fill" | "none",
  ): void {
    if (fit === "none") {
      ctx.drawImage(image, x, y, width, height);
      return;
    }

    const imgRatio = image.width / image.height;
    const containerRatio = width / height;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    switch (fit) {
      case "cover":
        if (imgRatio > containerRatio) {
          drawHeight = height;
          drawWidth = height * imgRatio;
          drawX = x - (drawWidth - width) / 2;
          drawY = y;
        } else {
          drawWidth = width;
          drawHeight = width / imgRatio;
          drawX = x;
          drawY = y - (drawHeight - height) / 2;
        }
        break;
      case "contain":
        if (imgRatio > containerRatio) {
          drawWidth = width;
          drawHeight = width / imgRatio;
          drawX = x;
          drawY = y + (height - drawHeight) / 2;
        } else {
          drawHeight = height;
          drawWidth = height * imgRatio;
          drawX = x + (width - drawWidth) / 2;
          drawY = y;
        }
        break;
      case "fill":
      default:
        drawX = x;
        drawY = y;
        drawWidth = width;
        drawHeight = height;
    }

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  /**
   * Clear all static caches to prevent memory leaks
   */
  static clearCache(): void {
    ImageRenderer.imageCache.clear();
    ImageRenderer.loadingImages.clear();
    ImageRenderer.failedImages.clear();
  }
}
