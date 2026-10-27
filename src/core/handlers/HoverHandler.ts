/**
 * HoverHandler - Handles hover hit-testing for cells
 *
 * Determines whether the pointer is on an interactive element (used for the
 * pointer cursor) and tracks which image / button inside a cell is hovered.
 */

import { CellTypes } from "../../types";
import { getRenderResult } from "../../utils";
import { BaseHandler } from "./BaseHandler";

export class HoverHandler extends BaseHandler {
  /**
   * 判断鼠标位置是否落在可点击元素上（用于设置 pointer 光标）
   */
  isClickableElement(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): boolean {
    if (!cell) return false;

    if (cell.rowIndex === -1) {
      return true;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) return false;

    const renderResult = getRenderResult(column, row, cell.rowIndex);
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    // Check column-level disabled
    const isDisabled = !this.editorRegistry.getStrategy(column).canEdit(cell, row, column);

    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);

    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;

    if (renderResult.type === CellTypes.CHECKBOX && renderResult.checkbox) {
      if (isDisabled) return false;
      const size = 16;
      const checkboxX = (cellPos.width - size) / 2;
      const checkboxY = (cellPos.height - size) / 2;
      return (
        relativeX >= checkboxX &&
        relativeX <= checkboxX + size &&
        relativeY >= checkboxY &&
        relativeY <= checkboxY + size
      );
    }

    if (renderResult.type === CellTypes.RADIO && renderResult.radio) {
      if (isDisabled) return false;
      const size = 16;

      if (renderResult.radio.options && renderResult.radio.options.length > 0) {
        const padding = 8;
        const gap = 4;
        const maxX = cellPos.width - padding;

        this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

        let currentX = padding;

        for (let i = 0; i < renderResult.radio.options.length; i++) {
          const option = renderResult.radio.options[i]!;
          if (option.disabled) {
            const textWidth = this.ctx.measureText(option.label).width;
            currentX += size + gap + textWidth + padding;
            continue;
          }

          const textWidth = this.ctx.measureText(option.label).width;
          const optionWidth = size + gap + textWidth + padding;

          if (currentX + optionWidth - padding > maxX) {
            break;
          }

          const radioX = currentX;
          const radioY = (cellPos.height - size) / 2;
          const centerY = radioY + size / 2;

          const inRadioCircle =
            relativeX >= radioX &&
            relativeX <= radioX + size &&
            relativeY >= radioY &&
            relativeY <= radioY + size;

          const textX = radioX + size + gap;
          const inText =
            relativeX >= textX &&
            relativeX <= textX + textWidth &&
            relativeY >= centerY - 10 &&
            relativeY <= centerY + 10;

          if (inRadioCircle || inText) {
            return true;
          }

          currentX += optionWidth;
        }

        return false;
      } else {
        const radioX = (cellPos.width - size) / 2;
        const radioY = (cellPos.height - size) / 2;
        return (
          relativeX >= radioX &&
          relativeX <= radioX + size &&
          relativeY >= radioY &&
          relativeY <= radioY + size
        );
      }
    }

    if (renderResult.type === CellTypes.BUTTON && renderResult.button) {
      if (isDisabled) return false;
      const button = renderResult.button;

      if (Array.isArray(button)) {
        const options = renderResult.buttonOptions ?? {};
        const padding = 8;
        const gap = options.gap ?? 4;
        const maxVisible = options.maxVisible ?? 3;
        const buttonHeight = 24;
        const buttonY = (cellPos.height - buttonHeight) / 2;

        const visibleButtons = button.filter((btn) => btn.visible !== false);
        const displayButtons = visibleButtons.slice(0, maxVisible);

        let currentX = padding;
        for (const btn of displayButtons) {
          const text = btn.text ?? this.locale.cell.buttonText;
          this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          const textWidth = this.ctx.measureText(text).width;
          const buttonWidth = Math.max(textWidth + 16, 40);

          if (
            relativeY >= buttonY &&
            relativeY <= buttonY + buttonHeight &&
            relativeX >= currentX &&
            relativeX <= currentX + buttonWidth
          ) {
            return true;
          }

          currentX += buttonWidth + gap;
        }

        if (visibleButtons.length > maxVisible) {
          const moreText = options.moreButtonText ?? "···";
          this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          const textWidth = this.ctx.measureText(moreText).width;
          const buttonWidth = Math.max(textWidth + 16, 32);

          if (
            relativeY >= buttonY &&
            relativeY <= buttonY + buttonHeight &&
            relativeX >= currentX &&
            relativeX <= currentX + buttonWidth
          ) {
            return true;
          }
        }

        return false;
      }

      const buttonHeight = button.size === "small" ? 24 : button.size === "large" ? 40 : 32;
      const buttonY = (cellPos.height - buttonHeight) / 2;
      const padding = 8;
      return (
        relativeY >= buttonY &&
        relativeY <= buttonY + buttonHeight &&
        relativeX >= padding &&
        relativeX <= cellPos.width - padding
      );
    }

    if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
      if (isDisabled) return false;
      const switchWidth = 44;
      const switchHeight = 22;
      const switchX = (cellPos.width - switchWidth) / 2;
      const switchY = (cellPos.height - switchHeight) / 2;
      return (
        relativeX >= switchX &&
        relativeX <= switchX + switchWidth &&
        relativeY >= switchY &&
        relativeY <= switchY + switchHeight
      );
    }

    if (renderResult.type === CellTypes.SELECT && renderResult.select) {
      if (isDisabled) return false;
      return true;
    }

    if (renderResult.type === CellTypes.TAG && renderResult.tags) {
      return true;
    }

    if (renderResult.type === CellTypes.INPUT && renderResult.input) {
      if (isDisabled || renderResult.input.readonly) return false;
      return true;
    }

    if (renderResult.type === CellTypes.LINK && renderResult.link) {
      const link = renderResult.link;
      const linkText = link.text || link.link;
      if (!linkText) return false;

      // 精确检测点击位置是否在链接文字上
      const padding = 8;
      const fontSize = 13;

      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

      // 计算文字宽度（考虑截断）
      const maxTextWidth = cellPos.width - padding * 2;
      let textWidth = this.ctx.measureText(linkText).width;
      let displayText = linkText;

      if (textWidth > maxTextWidth) {
        const ellipsis = "...";
        while (
          displayText.length > 0 &&
          this.ctx.measureText(displayText + ellipsis).width > maxTextWidth
        ) {
          displayText = displayText.slice(0, -1);
        }
        displayText += ellipsis;
        textWidth = this.ctx.measureText(displayText).width;
      }

      // 计算文字位置（与 Renderer 保持一致）
      const align = column.align ?? "left";
      let textX: number;
      switch (align) {
        case "center":
          textX = (cellPos.width - textWidth) / 2;
          break;
        case "right":
          textX = cellPos.width - padding - textWidth;
          break;
        default:
          textX = padding;
      }
      const textY = (cellPos.height - fontSize) / 2;

      return (
        relativeX >= textX &&
        relativeX <= textX + textWidth &&
        relativeY >= textY &&
        relativeY <= textY + fontSize
      );
    }

    if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
      const config = renderResult.image;
      if (config.clickable === false) return false;

      // 单图模式
      const images = config.images;
      if (!images || images.length <= 1) {
        const src = config.src || (images && images[0]);
        return !!src;
      }

      // 多图模式 - 检查是否 hover 在某张图片上
      const hoveredImageIndex = this.state.hoveredImageIndex ?? -1;
      return hoveredImageIndex >= 0 && hoveredImageIndex < images.length;
    }

    if (renderResult.type === CellTypes.PROGRESS && renderResult.progress) {
      const config = renderResult.progress;
      // 只有 interactive 进度条才可点击
      if (config.interactive !== true) return false;
      if (isDisabled) return false;

      const shape = config.shape ?? "line";

      if (shape === "line") {
        // 线形进度条热区检测
        const padding = 8;
        const size = config.size ?? "medium";
        const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
        const textPosition = config.textPosition ?? "right";
        const showText = config.showText ?? true;
        const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
        const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;

        const barX = padding;
        const barY = (cellPos.height - barHeight) / 2;

        return (
          relativeX >= barX &&
          relativeX <= barX + barWidth &&
          relativeY >= barY &&
          relativeY <= barY + barHeight
        );
      }

      if (shape === "circle" || shape === "dashboard") {
        // 圆环/仪表盘热区检测
        const size = config.size ?? "medium";
        let sizeRatio: number;
        let centerYOffset = 0;

        if (shape === "circle") {
          sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
        } else {
          sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
          centerYOffset = cellPos.height * 0.05; // 仪表盘有偏移
        }

        const defaultDiameter = Math.floor(cellPos.height * sizeRatio);
        const diameter = config.width ?? defaultDiameter;
        const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));

        const centerX = cellPos.width / 2;
        const centerY = cellPos.height / 2 + centerYOffset;
        const radius = (diameter - strokeWidth) / 2;

        // 检测是否在圆环范围内
        const dx = relativeX - centerX;
        const dy = relativeY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 在圆环范围内（考虑 strokeWidth）
        return distance >= radius - strokeWidth && distance <= radius + strokeWidth;
      }
    }

    if (renderResult.type === CellTypes.RATING && renderResult.rating) {
      if (isDisabled) return false;

      const config = renderResult.rating;
      const max = config.max ?? 5;
      const starSize = config.starSize ?? 16;

      // 计算星星起始位置（与 Renderer.renderRating 保持一致）
      const totalWidth = max * starSize;
      const startX = (cellPos.width - totalWidth) / 2;
      const startY = (cellPos.height - starSize) / 2;

      // 检测是否在星星区域内
      return (
        relativeX >= startX &&
        relativeX <= startX + totalWidth &&
        relativeY >= startY &&
        relativeY <= startY + starSize
      );
    }

    if (renderResult.type === CellTypes.COLOR && renderResult.color) {
      if (isDisabled) return false;

      // 检测是否在颜色块区域内
      const padding = 8;
      const colorBoxSize = Math.min(cellPos.height - padding * 2, 24);
      const colorBoxX = (cellPos.width - colorBoxSize) / 2;
      const colorBoxY = (cellPos.height - colorBoxSize) / 2;

      return (
        relativeX >= colorBoxX &&
        relativeX <= colorBoxX + colorBoxSize &&
        relativeY >= colorBoxY &&
        relativeY <= colorBoxY + colorBoxSize
      );
    }

    return false;
  }

  /**
   * 更新单元格内被 hover 的图片索引
   */
  updateImageHoverIndex(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): void {
    if (!cell || cell.rowIndex < 0) {
      this.state.hoveredImageIndex = -1;
      return;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) {
      this.state.hoveredImageIndex = -1;
      return;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);

    // 检查是否是图片列
    if (renderResult.type !== CellTypes.IMAGE || !renderResult.image) {
      this.state.hoveredImageIndex = -1;
      return;
    }

    const config = renderResult.image;
    const images = config.images;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);

    // 计算相对位置
    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;

    // 与 Renderer 保持一致的计算逻辑（含 scaleWithRowHeight 处理）
    const padding = 4;
    const STANDARD_ROW_HEIGHT = 32;
    const effectiveCellHeight =
      config.scaleWithRowHeight === false
        ? Math.min(cellPos.height, STANDARD_ROW_HEIGHT)
        : cellPos.height;
    const maxImgSize = Math.max(0, Math.min(cellPos.width, effectiveCellHeight) - padding * 2);
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const gap = config.gap ?? 4;

    // 单图模式 - 也需要检查是否在图片区域内
    if (!images || images.length <= 1) {
      const imgX = (cellPos.width - imgWidth) / 2;
      const imgY = (cellPos.height - imgHeight) / 2;

      const isInImage =
        relativeX >= imgX &&
        relativeX <= imgX + imgWidth &&
        relativeY >= imgY &&
        relativeY <= imgY + imgHeight;

      this.state.hoveredImageIndex = isInImage && config.hoverable !== false ? 0 : -1;
      return;
    }

    // 根据单元格宽度计算能显示的图片数量（多行布局，需与 ImageRenderer.renderMultipleImages 保持一致）
    const availableWidth = cellPos.width - padding * 2;
    const availableHeight = cellPos.height - padding * 2;
    const showMoreCount = config.showMoreCount !== false;
    const userMaxVisible = config.maxVisible;

    const imagesPerRow = Math.max(1, Math.floor((availableWidth + gap) / (imgWidth + gap)));
    const maxRows = Math.max(1, Math.floor((availableHeight + gap) / (imgHeight + gap)));
    const slotCapacity = imagesPerRow * maxRows;
    const requestedMaxVisible = userMaxVisible ?? slotCapacity;
    const needsMoreCount = showMoreCount && images.length > requestedMaxVisible;
    const maxVisibleCapacity = needsMoreCount ? Math.max(0, slotCapacity - 1) : slotCapacity;
    const maxVisible = Math.min(requestedMaxVisible, maxVisibleCapacity);

    const hasMore = images.length > maxVisible;
    const displayCount = hasMore ? maxVisible : images.length;

    const renderItemCount = displayCount + (hasMore && showMoreCount ? 1 : 0);
    const displayRows = Math.max(1, Math.ceil(renderItemCount / imagesPerRow));
    const widestRowItems = Math.min(renderItemCount, imagesPerRow);
    const contentWidth = widestRowItems * imgWidth + Math.max(0, widestRowItems - 1) * gap;
    const contentHeight = displayRows * imgHeight + Math.max(0, displayRows - 1) * gap;

    let startX = (cellPos.width - contentWidth) / 2;
    startX = Math.max(padding, startX);
    const startY = (cellPos.height - contentHeight) / 2;

    const relX = relativeX - startX;
    const relY = relativeY - startY;

    // 命中图片
    for (let i = 0; i < displayCount; i++) {
      const row = Math.floor(i / imagesPerRow);
      const col = i % imagesPerRow;
      const imgStartX = col * (imgWidth + gap);
      const imgStartY = row * (imgHeight + gap);
      if (
        relX >= imgStartX &&
        relX < imgStartX + imgWidth &&
        relY >= imgStartY &&
        relY < imgStartY + imgHeight
      ) {
        this.state.hoveredImageIndex = config.hoverable !== false ? i : -1;
        return;
      }
    }

    // 命中 +N 块
    if (hasMore && showMoreCount) {
      const moreRow = Math.floor(displayCount / imagesPerRow);
      const moreCol = displayCount % imagesPerRow;
      const moreStartX = moreCol * (imgWidth + gap);
      const moreStartY = moreRow * (imgHeight + gap);
      if (
        relX >= moreStartX &&
        relX < moreStartX + imgWidth &&
        relY >= moreStartY &&
        relY < moreStartY + imgHeight
      ) {
        this.state.hoveredImageIndex = config.hoverable !== false ? displayCount : -1;
        return;
      }
    }

    this.state.hoveredImageIndex = -1;
  }

  /**
   * 更新单元格内被 hover 的按钮索引
   */
  updateButtonsHoverIndex(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): void {
    if (!cell || cell.rowIndex < 0) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);

    // 检查是否是按钮组（数组形式）
    if (
      renderResult.type !== CellTypes.BUTTON ||
      !renderResult.button ||
      !Array.isArray(renderResult.button)
    ) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    const buttons = renderResult.button;
    const options = renderResult.buttonOptions ?? {};
    const visibleButtons = buttons.filter((btn) => btn.visible !== false);
    const maxVisible = options.maxVisible ?? 3;
    const gap = options.gap ?? 4;
    const padding = 8;
    const buttonHeight = 24;

    const displayButtons = visibleButtons.slice(0, maxVisible);
    const moreButtons = visibleButtons.slice(maxVisible);

    // 获取单元格位置
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);
    const buttonY = cellViewportY + (cellPos.height - buttonHeight) / 2;

    const relativeY = mouseY - buttonY;

    // 检查是否在按钮Y范围内
    if (relativeY < 0 || relativeY > buttonHeight) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    // 计算每个按钮的位置
    let currentX = cellViewportX + padding;
    const fontSize = 13;
    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    // 检查显示的按钮
    for (let i = 0; i < displayButtons.length; i++) {
      const btn = displayButtons[i]!;
      const text = btn.text ?? this.locale.cell.buttonText;
      const textWidth = this.ctx.measureText(text).width;
      const buttonWidth = Math.max(textWidth + 16, 40);

      if (mouseX >= currentX && mouseX < currentX + buttonWidth) {
        this.state.hoveredButtonIndex = i;
        return;
      }

      currentX += buttonWidth + gap;
    }

    // 检查"更多"按钮
    if (moreButtons.length > 0) {
      const moreText = options.moreButtonText ?? "···";
      const textWidth = this.ctx.measureText(moreText).width;
      const buttonWidth = Math.max(textWidth + 16, 32);

      if (mouseX >= currentX && mouseX < currentX + buttonWidth) {
        // "更多"按钮的索引是 maxVisible
        this.state.hoveredButtonIndex = maxVisible;
        return;
      }
    }

    this.state.hoveredButtonIndex = -1;
  }
}
