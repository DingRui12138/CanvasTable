/**
 * ControlClickHandler - Handles click interactions for various control types
 *
 * Manages clicks on progress bars, rating stars, expand icons, and radio options.
 * Each method determines the appropriate action based on click position and control config.
 */

import { CellPosition, Column, Row, ProgressConfig, RatingConfig } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { TableEvents } from "../../constants/events";
import { resolveDisabled, getColumnField } from "../../utils";

export class ControlClickHandler extends BaseHandler {
  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    super(context, eventEmitter);
  }

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
    // Check if interactive
    if (!config.interactive) return false;

    // Check if disabled
    if (row && column && resolveDisabled(column.disabled, row, column)) return false;

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
      const barY = cellPos.y - this.scrollState.scrollTop + (cellPos.height - barHeight) / 2;

      const clickViewportY = e.clientY - rect.top;
      const relativeX = clickViewportX - barX;
      const relativeY = clickViewportY - barY;

      // Check if click is within progress bar range
      if (relativeX >= 0 && relativeX <= barWidth && relativeY >= 0 && relativeY <= barHeight) {
        const precision = config.precision ?? 0;
        const rawValue = Math.max(0, Math.min(100, (relativeX / barWidth) * 100));
        const newValue =
          precision === 0 ? Math.round(rawValue) : Number(rawValue.toFixed(precision));

        // Auto update row.data
        if (column && row) {
          row.data[getColumnField(column)] = newValue;
        }

        this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell)!, newValue);
        return true;
      }
    } else if (shape === "circle" || shape === "dashboard") {
      // Circle/Dashboard: calculate progress from click angle
      const clickViewportY = e.clientY - rect.top;
      const cellViewportY = cellPos.y - this.scrollState.scrollTop;

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

        // Auto update row.data
        if (column && row) {
          row.data[getColumnField(column)] = newValue;
        }

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
    // Check if disabled
    if (row && column && resolveDisabled(column.disabled, row, column)) return false;

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

        // Auto update row.data
        if (column && row) {
          row.data[getColumnField(column)] = newValue;
        }

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
    const relativeY = clickY - (cellPos.y - this.scrollState.scrollTop);

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
