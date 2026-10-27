/**
 * ControlClickHandler - Handles click interactions for various control types
 *
 * Manages clicks on progress bars, rating stars, expand icons, and radio options.
 * Each method determines the appropriate action based on click position and control config.
 */

import { CellPosition, CellTypes, Column, ProgressConfig, RatingConfig, Row } from "../../types";
import { getRenderResult } from "../../utils";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { TableEvents } from "../../constants/events";
import { EditingHandler } from "./EditingHandler";
import { ButtonAnimationHandler } from "./ButtonAnimationHandler";

/** 下拉菜单单项高度 */
const DROPDOWN_ITEM_HEIGHT = 32;

export class ControlClickHandler extends BaseHandler {
  private editingHandler: EditingHandler;
  private buttonAnimationHandler: ButtonAnimationHandler;

  constructor(
    context: HandlerContext,
    eventEmitter: EventEmitter<InteractionEvents>,
    editingHandler: EditingHandler,
    buttonAnimationHandler: ButtonAnimationHandler,
  ) {
    super(context, eventEmitter);
    this.editingHandler = editingHandler;
    this.buttonAnimationHandler = buttonAnimationHandler;
  }

  /**
   * Handle click on any interactive cell control (checkbox/radio/button/switch/link/…).
   * Returns true when the click has been consumed by a control.
   */
  handleControlClick(cell: CellPosition, e: MouseEvent): boolean {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) return false;

    // 处理占位列点击 - 显示对应的隐藏列
    if (column.key.startsWith("__hidden_placeholder__")) {
      const hiddenColumnKey = (column as Column & { _hiddenColumnKey?: string })._hiddenColumnKey;
      if (hiddenColumnKey) {
        this.eventEmitter.emit(TableEvents.COLUMN_SHOW, hiddenColumnKey);
        return true;
      }
    }

    if (this.context.expandColumnKey === column.key && row.children && row.children.length > 0) {
      const expandClick = this.handleExpandIconClick(cell, e, row);
      if (expandClick) return true;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);

    // Check column-level canEdit
    const isDisabled = !this.editorRegistry.getStrategy(column).canEdit(cell, row, column);

    if (renderResult.type === CellTypes.CHECKBOX && renderResult.checkbox) {
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      const checkboxSize = 16;
      const checkboxX = cellViewportX + (cellPos.width - checkboxSize) / 2;
      const checkboxY = cellViewportY + (cellPos.height - checkboxSize) / 2;

      const isOnCheckbox =
        viewportX >= checkboxX &&
        viewportX <= checkboxX + checkboxSize &&
        viewportY >= checkboxY &&
        viewportY <= checkboxY + checkboxSize;

      if (isOnCheckbox && !isDisabled) {
        const newChecked = !renderResult.checkbox.checked;
        this.eventEmitter.emit(TableEvents.CHECKBOX_CHANGE, this.getCellInfo(cell)!, newChecked);
        return true;
      }

      return false;
    }

    if (renderResult.type === CellTypes.RADIO && renderResult.radio) {
      if (isDisabled) return false;

      if (renderResult.radio.options && renderResult.radio.options.length > 0) {
        const clickedOption = this.getClickedRadioOption(cell, e, renderResult.radio.options);
        if (clickedOption && !clickedOption.disabled) {
          this.eventEmitter.emit(
            TableEvents.RADIO_CHANGE,
            this.getCellInfo(cell)!,
            clickedOption.value,
          );
          return true;
        }
        return false;
      } else {
        this.eventEmitter.emit(
          TableEvents.RADIO_CHANGE,
          this.getCellInfo(cell)!,
          renderResult.radio.value,
        );
        return true;
      }
    }

    if (renderResult.type === CellTypes.BUTTON && renderResult.button) {
      if (isDisabled) return false;

      const buttonConfig = renderResult.button;

      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;

      if (Array.isArray(buttonConfig)) {
        const options = renderResult.buttonOptions ?? {};
        const padding = 8;
        const gap = options.gap ?? 4;
        const maxVisible = options.maxVisible ?? 3;
        const buttonHeight = 24;
        const buttonY = (cellPos.height - buttonHeight) / 2;

        const visibleButtons = buttonConfig.filter((btn) => btn.visible !== false);
        const displayButtons = visibleButtons.slice(0, maxVisible);
        const moreButtons = visibleButtons.slice(maxVisible);

        let currentX = padding;
        for (let i = 0; i < displayButtons.length; i++) {
          const btn = displayButtons[i]!;
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
            this.eventEmitter.emit(
              TableEvents.BUTTON_CLICK,
              this.getCellInfo(cell)!,
              btn.actionKey,
            );
            return true;
          }

          currentX += buttonWidth + gap;
        }

        if (moreButtons.length > 0) {
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
            const dropdownX = cellViewportX + currentX;
            const itemHeight = DROPDOWN_ITEM_HEIGHT;
            const dropdownHeight = moreButtons.length * itemHeight;
            const canvasRect = this.canvas.getBoundingClientRect();

            let dropdownY = cellViewportY + buttonY + buttonHeight + 4;
            let showAbove = false;

            if (dropdownY + dropdownHeight > canvasRect.height) {
              dropdownY = cellViewportY + buttonY - dropdownHeight - 4;
              showAbove = true;
            }

            this.state.buttonsDropdown = {
              cell,
              x: dropdownX,
              y: dropdownY,
              buttons: moreButtons,
              hoveredIndex: -1,
              buttonRelativeX: currentX,
              buttonY: buttonY,
              buttonHeight: buttonHeight,
              showAbove,
            };
            this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
            return true;
          }
        }

        return false;
      }

      const buttonHeight =
        buttonConfig.size === "small" ? 24 : buttonConfig.size === "large" ? 40 : 32;
      const buttonY = (cellPos.height - buttonHeight) / 2;

      // 计算按钮宽度：与 Renderer 保持一致
      const text = buttonConfig.text ?? this.locale.cell.buttonText;
      const fontSize = 13;
      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = this.ctx.measureText(text).width;
      const buttonPadding = 16;
      const cellPadding = 8;
      const buttonWidth = Math.min(
        Math.max(textWidth + buttonPadding * 2, 60),
        cellPos.width - cellPadding * 2,
      );
      const buttonX = (cellPos.width - buttonWidth) / 2;

      const isOnButton =
        relativeY >= buttonY &&
        relativeY <= buttonY + buttonHeight &&
        relativeX >= buttonX &&
        relativeX <= buttonX + buttonWidth;

      if (!isOnButton) return false;

      this.eventEmitter.emit(
        TableEvents.BUTTON_CLICK,
        this.getCellInfo(cell)!,
        buttonConfig.actionKey,
      );
      return true;
    }

    if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
      if (isDisabled) return false;

      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;

      const switchWidth = 44;
      const switchHeight = 22;
      const switchX = (cellPos.width - switchWidth) / 2;
      const switchY = (cellPos.height - switchHeight) / 2;

      const isOnSwitch =
        relativeX >= switchX &&
        relativeX <= switchX + switchWidth &&
        relativeY >= switchY &&
        relativeY <= switchY + switchHeight;

      if (!isOnSwitch) return false;

      const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
      const existingAnimation = this.state.switchAnimations.get(cellKey);
      const currentChecked = renderResult.switch.checked ?? false;
      const currentProgress = existingAnimation
        ? existingAnimation.progress
        : currentChecked
          ? 1
          : 0;
      const targetProgress = currentProgress < 0.5 ? 1 : 0;
      const targetChecked = targetProgress === 1;

      if (currentChecked !== targetChecked) {
        this.eventEmitter.emit(TableEvents.SWITCH_CHANGE, this.getCellInfo(cell)!, targetChecked);
      }

      this.state.switchAnimations.set(cellKey, {
        cell,
        progress: currentProgress,
        targetProgress,
        startTime: Date.now(),
        startProgress: currentProgress,
      });

      this.buttonAnimationHandler.startSwitchAnimationLoop();
      return true;
    }

    if (renderResult.type === CellTypes.INPUT && renderResult.input) {
      if (isDisabled || renderResult.input.readonly) return false;

      return false;
    }

    if (renderResult.type === CellTypes.LINK && renderResult.link) {
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;

      const link = renderResult.link;
      const linkUrl = link.link;
      const linkText = link.text || link.link;
      if (!linkUrl || !linkText) return false;

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

      const isOnLink =
        relativeX >= textX &&
        relativeX <= textX + textWidth &&
        relativeY >= textY &&
        relativeY <= textY + fontSize;

      if (!isOnLink) return false;

      // 检测是否为双击，如果是双击则不跳转链接（让 dblclick 事件处理编辑）
      const now = Date.now();
      const isDoubleClick =
        this.lastClickCell?.rowIndex === cell.rowIndex &&
        this.lastClickCell?.columnIndex === cell.columnIndex &&
        now - this.lastClickTime < 350;

      // 更新点击记录
      this.lastClickTime = now;
      this.lastClickCell = { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex };

      if (isDoubleClick) {
        return false; // 不跳转，让 dblclick 事件处理
      }

      window.open(linkUrl, "_blank", "noopener,noreferrer");
      return true;
    }

    if (renderResult.type === CellTypes.PROGRESS && renderResult.progress) {
      const result = this.handleProgressClick(cell, e, renderResult.progress, column, row);
      if (result) {
        // 点击成功后启动拖拽状态，只更新显示值不更新数据
        const precision = renderResult.progress.precision ?? 0;
        const displayValue =
          precision === 0
            ? Math.round(renderResult.progress.value)
            : Number(renderResult.progress.value.toFixed(precision));
        this.state.isDragging = true;
        this.state.dragType = "progress-drag";
        this.state.progressDragState = {
          cell,
          config: renderResult.progress,
          column,
          row,
          startX: e.clientX,
          startValue: renderResult.progress.value,
          displayValue: displayValue,
        };
        this.canvas.style.cursor = "grabbing";
        this.context.onDragStart?.();
      }
      return result;
    }

    if (renderResult.type === CellTypes.RATING && renderResult.rating) {
      return this.handleRatingClick(cell, e, renderResult.rating, column, row);
    }

    if (renderResult.type === CellTypes.COLOR && renderResult.color) {
      if (isDisabled) return false;

      // 计算颜色块位置，只有点击颜色块才触发
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      const rect = this.canvas.getBoundingClientRect();
      const clickViewportX = e.clientX - rect.left;
      const clickViewportY = e.clientY - rect.top;

      const padding = 8;
      const colorBoxSize = Math.min(cellPos.height - padding * 2, 24);
      const colorBoxX = cellViewportX + (cellPos.width - colorBoxSize) / 2;
      const colorBoxY = cellViewportY + (cellPos.height - colorBoxSize) / 2;

      // 检查点击是否在颜色块区域内
      if (
        clickViewportX >= colorBoxX &&
        clickViewportX <= colorBoxX + colorBoxSize &&
        clickViewportY >= colorBoxY &&
        clickViewportY <= colorBoxY + colorBoxSize
      ) {
        this.editingHandler.startColorEditing(cell, renderResult.color);
        return true;
      }

      return false;
    }

    if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
      if (renderResult.image.clickable === false) return false;

      const config = renderResult.image;
      const images = config.images;

      // 获取点击位置
      const rect = this.canvas.getBoundingClientRect();
      const clickViewportX = e.clientX - rect.left;
      const clickViewportY = e.clientY - rect.top;

      // 计算单元格视口位置
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      // 计算相对位置
      const relativeX = clickViewportX - cellViewportX;
      const relativeY = clickViewportY - cellViewportY;

      // 与 updateImageHoverIndex 保持一致的计算逻辑
      const padding = 4;
      const maxImgSize = Math.min(cellPos.width, cellPos.height) - padding * 2;
      const configWidth = config.width ?? 32;
      const configHeight = config.height ?? 32;
      const imgWidth = Math.min(configWidth, maxImgSize);
      const imgHeight = Math.min(configHeight, maxImgSize);
      const gap = config.gap ?? 4;

      // 多图模式
      if (images && images.length > 1) {
        const maxVisible = config.maxVisible ?? 3;
        const showMoreCount = config.showMoreCount !== false;
        const availableWidth = cellPos.width - padding * 2;
        const maxByWidth = Math.floor((availableWidth + gap) / (imgWidth + gap));
        const reservedForMore = showMoreCount ? 1 : 0;
        const calculatedMaxVisible = Math.max(1, maxByWidth - reservedForMore);
        const actualMaxVisible = Math.min(maxVisible, calculatedMaxVisible);
        const displayCount = images.length > actualMaxVisible ? actualMaxVisible : images.length;
        const hasMore = images.length > actualMaxVisible;

        // 计算内容宽度
        let contentWidth: number;
        if (hasMore && showMoreCount) {
          contentWidth = displayCount * imgWidth + displayCount * gap + imgWidth;
        } else {
          contentWidth = displayCount * imgWidth + Math.max(0, displayCount - 1) * gap;
        }

        let startX = (cellPos.width - contentWidth) / 2;
        startX = Math.max(padding, startX);
        const imgY = (cellPos.height - imgHeight) / 2;

        const relX = relativeX - startX;
        const relY = relativeY - imgY;

        // 检查是否在图片区域内
        if (relX < 0 || relX > contentWidth || relY < 0 || relY > imgHeight) {
          return false;
        }

        // 计算点击的图片索引
        const clickedIndex = Math.floor(relX / (imgWidth + gap));

        // 点击的是 +N 块
        if (hasMore && showMoreCount && clickedIndex === displayCount) {
          return false;
        }

        // 点击的是显示的图片
        if (clickedIndex >= 0 && clickedIndex < images.length) {
          const clickedSrc = images[clickedIndex];
          if (clickedSrc) {
            this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell)!, clickedSrc, e);
            return true;
          }
        }
        return false;
      }

      // 单图模式或只有一张图片的情况
      const imgX = (cellPos.width - imgWidth) / 2;
      const imgY = (cellPos.height - imgHeight) / 2;

      const isInImage =
        relativeX >= imgX &&
        relativeX <= imgX + imgWidth &&
        relativeY >= imgY &&
        relativeY <= imgY + imgHeight;

      if (!isInImage) return false;

      const src = config.src || (images && images[0]);
      if (!src) return false;

      this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell)!, src, e);
      return true;
    }

    return false;
  }

  /**
   * Handle progress bar drag move (display value only, data is committed on mouseup)
   */
  handleProgressDragMove(e: MouseEvent): void {
    const dragState = this.state.progressDragState;
    if (!dragState) return;

    const { cell, config, column } = dragState;
    const rect = this.canvas.getBoundingClientRect();
    const clickViewportX = e.clientX - rect.left;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);

    const shape = config.shape ?? "line";

    if (shape === "line") {
      const padding = 8;
      const textPosition = config.textPosition ?? "right";
      const showText = config.showText ?? true;
      const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
      const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;

      const barX = cellViewportX + padding;
      const relativeX = clickViewportX - barX;

      const precision = config.precision ?? 0;
      const rawValue = Math.max(0, Math.min(100, (relativeX / barWidth) * 100));
      const newValue = precision === 0 ? Math.round(rawValue) : Number(rawValue.toFixed(precision));

      // 只更新显示值，不更新数据
      dragState.displayValue = newValue;
      this.eventEmitter.emit(TableEvents.PROGRESS_DRAG);
    } else if (shape === "circle" || shape === "dashboard") {
      const clickViewportY = e.clientY - rect.top;
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      let centerYOffset = 0;
      if (shape === "dashboard") {
        centerYOffset = cellPos.height * 0.05;
      }

      const cellCenterX = cellViewportX + cellPos.width / 2;
      const cellCenterY = cellViewportY + cellPos.height / 2 + centerYOffset;

      const dx = clickViewportX - cellCenterX;
      const dy = clickViewportY - cellCenterY;

      let angle = Math.atan2(dy, dx);
      let newValue: number;

      if (shape === "circle") {
        angle = angle + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        newValue = (angle / (Math.PI * 2)) * 100;
      } else {
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;

        if (angle < 0) angle += Math.PI * 2;

        let offset = angle - startAngle;
        if (offset < 0) offset += Math.PI * 2;

        newValue = (offset / totalAngle) * 100;
      }

      newValue = Math.max(0, Math.min(100, newValue));

      const precision = config.precision ?? 0;
      newValue = precision === 0 ? Math.round(newValue) : Number(newValue.toFixed(precision));

      // 只更新显示值，不更新数据
      dragState.displayValue = newValue;
      this.eventEmitter.emit(TableEvents.PROGRESS_DRAG);
    }
  }

  /** 记录最近一次点击，用于区分双击（避免链接跳转） */
  private lastClickTime = 0;
  private lastClickCell: { rowIndex: number; columnIndex: number } | null = null;

  /**
   * Handle progress bar click
   */
  handleProgressClick(
    cell: CellPosition,
    e: MouseEvent,
    config: ProgressConfig,
    column: Column | undefined,
    row: Row | undefined,
  ): boolean {
    // Check if disabled
    if (!config.interactive) return false;
    if (row && column && !this.editorRegistry.getStrategy(column).canEdit(cell, row, column))
      return false;

    // Get click position
    const rect = this.canvas.getBoundingClientRect();
    const clickViewportX = e.clientX - rect.left;

    // Calculate cell viewport position
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);

    const shape = config.shape ?? "line";

    if (shape === "line") {
      // Line progress: calculate progress from click position
      const padding = 8;
      const size = config.size ?? "medium";
      const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
      const textPosition = config.textPosition ?? "right";
      const showText = config.showText ?? true;
      const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
      const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;

      const barX = cellViewportX + padding;
      const barY = this.getCellViewportY(cell.rowIndex) + (cellPos.height - barHeight) / 2;

      const clickViewportY = e.clientY - rect.top;
      const relativeX = clickViewportX - barX;
      const relativeY = clickViewportY - barY;

      // Check if click is within progress bar range
      if (relativeX >= 0 && relativeX <= barWidth && relativeY >= 0 && relativeY <= barHeight) {
        const precision = config.precision ?? 0;
        const rawValue = Math.max(0, Math.min(100, (relativeX / barWidth) * 100));
        const newValue =
          precision === 0 ? Math.round(rawValue) : Number(rawValue.toFixed(precision));

        this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell)!, newValue);
        return true;
      }
    } else if (shape === "circle" || shape === "dashboard") {
      // Circle/Dashboard: calculate progress from click angle
      const clickViewportY = e.clientY - rect.top;
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      const size = config.size ?? "medium";
      let sizeRatio: number;
      let centerYOffset = 0;

      if (shape === "circle") {
        sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
      } else {
        sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
        centerYOffset = cellPos.height * 0.05; // Dashboard has offset
      }

      const defaultDiameter = Math.floor(cellPos.height * sizeRatio);
      const diameter = config.width ?? defaultDiameter;
      const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));
      const radius = (diameter - strokeWidth) / 2;

      const cellCenterX = cellViewportX + cellPos.width / 2;
      const cellCenterY = cellViewportY + cellPos.height / 2 + centerYOffset;

      const dx = clickViewportX - cellCenterX;
      const dy = clickViewportY - cellCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if click is within ring range
      if (distance >= radius - strokeWidth && distance <= radius + strokeWidth) {
        let angle = Math.atan2(dy, dx);
        let newValue: number;

        if (shape === "circle") {
          // Circle: calculate from top
          angle = angle + Math.PI / 2; // Adjust to start from top
          if (angle < 0) angle += Math.PI * 2;
          newValue = (angle / (Math.PI * 2)) * 100;
        } else {
          // Dashboard: gap at bottom center (45° to 135°, 90° range)
          // Progress starts from 135°, grows clockwise to 45°
          const startAngle = Math.PI * 0.75; // 135°
          const totalAngle = Math.PI * 1.5; // 270°

          // Normalize angle to [0, 2π]
          if (angle < 0) angle += Math.PI * 2;

          // Calculate offset relative to startAngle clockwise
          let offset = angle - startAngle;
          if (offset < 0) offset += Math.PI * 2;

          // Check if in valid range (0 to 270°)
          if (offset > totalAngle) return false;

          newValue = (offset / totalAngle) * 100;
        }

        newValue = Math.max(0, Math.min(100, newValue));

        const precision = config.precision ?? 0;
        newValue = precision === 0 ? Math.round(newValue) : Number(newValue.toFixed(precision));

        this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell)!, newValue);
        return true;
      }
    }

    return false;
  }

  /**
   * Handle rating click
   */
  handleRatingClick(
    cell: CellPosition,
    e: MouseEvent,
    config: RatingConfig,
    column: Column | undefined,
    row: Row | undefined,
  ): boolean {
    // Check if can edit
    if (row && column && !this.editorRegistry.getStrategy(column).canEdit(cell, row, column))
      return false;

    // Get click position
    const rect = this.canvas.getBoundingClientRect();
    const clickViewportX = e.clientX - rect.left;

    // Calculate cell viewport position
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);

    // Calculate relative click position
    const relativeX = clickViewportX - cellViewportX;

    const max = config.max ?? 5;
    const starSize = config.starSize ?? 16;
    const allowHalf = config.allowHalf ?? false;
    const currentValue = config.value ?? 0;

    // Calculate star start position (consistent with Renderer.renderRating)
    const totalWidth = max * starSize;
    const startX = (cellPos.width - totalWidth) / 2;
    const startY = (cellPos.height - starSize) / 2;

    // Get click position Y relative to cell (consistent with isClickableElement hot zone)
    const clickViewportY = e.clientY - rect.top;
    const cellViewportY = cellPos.y - this.context.scrollState.scrollTop;
    const relativeY = clickViewportY - cellViewportY;

    // Validate Y position — click must be within star vertical range to match cursor:pointer hot zone
    if (relativeY < startY || relativeY > startY + starSize) return false;

    // Find clicked star
    for (let i = 0; i < max; i++) {
      const starX = startX + i * starSize;

      if (relativeX >= starX && relativeX <= starX + starSize) {
        // Click on this star
        let newValue: number;

        if (allowHalf) {
          // Allow half star: check if click is on left half
          const starRelativeX = relativeX - starX;
          const isLeftHalf = starRelativeX < starSize / 2;

          if (isLeftHalf) {
            newValue = i + 0.5;
          } else {
            newValue = i + 1;
          }

          // If clicking current value, reset to 0
          if (newValue === currentValue) {
            newValue = 0;
          }
        } else {
          // No half star: set directly to index + 1
          newValue = i + 1;

          // If clicking current value, reset to 0
          if (newValue === currentValue) {
            newValue = 0;
          }
        }

        // Ensure not exceeding max
        newValue = Math.min(newValue, max);

        this.eventEmitter.emit(TableEvents.RATING_CHANGE, this.getCellInfo(cell)!, newValue);
        return true;
      }
    }

    return false;
  }

  /**
   * Handle expand icon click
   */
  handleExpandIconClick = (cell: CellPosition, e: MouseEvent, row: Row): boolean => {
    const rect = this.canvas.getBoundingClientRect();
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];

    const clickX = e.clientX - rect.left;

    const cellViewportX = this.getCellViewportX(cellPos, column);

    const relativeX = clickX - cellViewportX;
    const level = row.level ?? 0;
    const padding = 8;
    const iconSize = 8;
    const levelIndent = level * 16;
    const iconX = padding + levelIndent;
    const iconEndX = iconX + iconSize + 4;

    if (relativeX >= iconX && relativeX <= iconEndX) {
      this.eventEmitter.emit(TableEvents.EXPAND, row, cell.rowIndex, !row.expanded);
      return true;
    }

    return false;
  };

  /**
   * Get clicked radio option
   */
  getClickedRadioOption(
    cell: CellPosition,
    e: MouseEvent,
    options: { label: string; value: unknown; disabled?: boolean }[],
  ): { label: string; value: unknown; disabled?: boolean } | null {
    const rect = this.canvas.getBoundingClientRect();
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellViewportX = this.getCellViewportX(cellPos, column);

    const relativeX = clickX - cellViewportX;
    const relativeY = clickY - this.getCellViewportY(cell.rowIndex);

    const padding = 8;
    const size = 16;
    const gap = 4;
    const maxX = cellPos.width - padding;

    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

    let currentX = padding;

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
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
        return option;
      }

      currentX += optionWidth;
    }

    return null;
  }
}
