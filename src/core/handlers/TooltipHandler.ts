/**
 * TooltipHandler - Handles tooltip display logic
 *
 * Manages tooltips for truncated content: tags, select dropdown text,
 * image preview dropdowns, and cell text. Shows tooltip when content
 * is truncated or images need preview.
 */

import { TooltipState, ImageTooltipState, SelectConfig, ImageConfig } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { getRenderResult } from "../../utils";

// Constants for image tooltip
const IMAGE_SIZE = 64;

export class TooltipHandler extends BaseHandler {
  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    super(context, eventEmitter);
  }

  /**
   * Get image size constant
   */
  static get IMAGE_SIZE(): number {
    return IMAGE_SIZE;
  }

  /**
   * Check and show tooltip for cell content
   */
  checkTooltip(cell: { rowIndex: number; columnIndex: number } | null): void {
    if (!cell || cell.rowIndex < 0) {
      this.state.tooltip = null;
      return;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) {
      this.state.tooltip = null;
      return;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);

    // Tags tooltip
    if (renderResult.type === "tag" && renderResult.tags) {
      this.handleTagsTooltip(cell, renderResult.tags.tags, cellPos, cellViewportX);
      return;
    }

    // Select tooltip
    if (renderResult.type === "select" && renderResult.select) {
      this.handleSelectTooltip(cell, renderResult.select, cellPos, cellViewportX);
      return;
    }

    // Image tooltip (preview dropdown)
    if (renderResult.type === "image" && renderResult.image) {
      this.handleImageTooltip(cell, renderResult.image, cellPos, cellViewportX, cellViewportY);
      return;
    }

    // Text tooltip
    if (renderResult.text) {
      this.handleTextTooltip(cell, renderResult.text, cellPos, cellViewportX);
      return;
    }

    this.state.tooltip = null;
  }

  /**
   * Handle tags tooltip
   */
  private handleTagsTooltip(
    cell: { rowIndex: number; columnIndex: number },
    tags: { text: string; color?: string }[],
    cellPos: { width: number; y: number; height: number },
    cellViewportX: number,
  ): void {
    const padding = 8;
    const tagPadding = 4;
    const gap = 4;
    const availableWidth = cellPos.width - padding * 2;

    let visibleCount = 0;
    let usedWidth = 0;
    let hasTruncation = false;

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i]!;
      const tagWidth = this.ctx.measureText(tag.text).width + tagPadding * 2;

      const remaining = tags.length - visibleCount;
      const needMoreTag = remaining > 1;
      const moreWidth = needMoreTag
        ? this.ctx.measureText(`+${remaining - 1}`).width + tagPadding * 2 + gap
        : 0;
      const remainingSpace = availableWidth - usedWidth - moreWidth;

      if (tagWidth <= remainingSpace) {
        visibleCount++;
        usedWidth += tagWidth + gap;
      } else {
        hasTruncation = true;
        break;
      }
    }

    if (visibleCount < tags.length) {
      hasTruncation = true;
    }

    if (!hasTruncation) {
      this.state.tooltip = null;
      return;
    }

    this.state.tooltip = {
      cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
      x: cellViewportX,
      y: this.getCellViewportY(cell.rowIndex),
      width: cellPos.width,
      content: { type: "tags", tags: tags },
    };
  }

  /**
   * Handle select tooltip
   */
  private handleSelectTooltip(
    cell: { rowIndex: number; columnIndex: number },
    config: SelectConfig,
    cellPos: { width: number; y: number; height: number },
    cellViewportX: number,
  ): void {
    const padding = 8;
    const arrowWidth = 20;
    const maxTextWidth = cellPos.width - padding * 2 - arrowWidth;

    let displayText = "";
    const value = config.value;
    if (config.multiple && Array.isArray(value)) {
      if (value.length > 0) {
        const labels = value.map((v) => {
          const opt = config.options.find((o) => o.value === v);
          return opt?.label ?? String(v);
        });
        displayText = labels.join(", ");
      }
    } else if (value !== undefined && value !== null) {
      const selectedOption = config.options.find((opt) => opt.value === value);
      displayText = selectedOption?.label ?? String(value);
    }

    if (displayText) {
      const textWidth = this.ctx.measureText(displayText).width;
      if (textWidth > maxTextWidth) {
        this.state.tooltip = {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          x: cellViewportX,
          y: this.getCellViewportY(cell.rowIndex),
          width: cellPos.width,
          content: { type: "text", text: displayText },
        };
        return;
      }
    }

    this.state.tooltip = null;
  }

  /**
   * Handle image tooltip (preview dropdown)
   */
  private handleImageTooltip(
    cell: { rowIndex: number; columnIndex: number },
    config: ImageConfig,
    cellPos: { width: number; height: number },
    cellViewportX: number,
    cellViewportY: number,
  ): void {
    const images = config.images;

    // Single image doesn't need dropdown
    if (!images || images.length <= 1) {
      this.state.tooltip = null;
      return;
    }

    // Multi-image mode - show image preview dropdown
    const canvasRect = this.canvas.getBoundingClientRect();
    const imgSize = IMAGE_SIZE;
    const dropdownPadding = 8;
    const dropdownGap = 8;
    const imagesPerRow = 4;
    const rowCount = Math.ceil(images.length / imagesPerRow);

    // Dynamic row count: default 1 row, max 3 rows
    let maxRows: number;
    if (rowCount <= 1) {
      maxRows = 1;
    } else if (rowCount <= 2) {
      maxRows = 2;
    } else {
      maxRows = 3;
    }

    const dropdownWidth =
      imagesPerRow * imgSize + (imagesPerRow - 1) * dropdownGap + dropdownPadding * 2;
    const rowHeight = imgSize + dropdownGap;
    const dropdownHeight = maxRows * rowHeight + dropdownPadding * 2 - dropdownGap;

    let dropdownY = cellViewportY + cellPos.height;
    let showAbove = false;

    if (dropdownY + dropdownHeight > canvasRect.height) {
      dropdownY = cellViewportY - dropdownHeight;
      showAbove = true;
    }

    let dropdownX = cellViewportX;
    if (dropdownX + dropdownWidth > canvasRect.width) {
      dropdownX = canvasRect.width - dropdownWidth - 4;
    }
    if (dropdownX < 0) {
      dropdownX = 4;
    }

    this.state.imageTooltip = {
      cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
      x: dropdownX,
      y: dropdownY,
      images: images,
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows: maxRows,
      showAbove: showAbove,
    };
  }

  /**
   * Handle text tooltip
   */
  private handleTextTooltip(
    cell: { rowIndex: number; columnIndex: number },
    text: string,
    cellPos: { width: number; y: number },
    cellViewportX: number,
  ): void {
    const padding = 8;
    const maxTextWidth = cellPos.width - padding * 2;
    const textWidth = this.ctx.measureText(text).width;

    if (textWidth > maxTextWidth) {
      this.state.tooltip = {
        cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
        x: cellViewportX,
        y: this.getCellViewportY(cell.rowIndex),
        width: cellPos.width,
        content: { type: "text", text: text },
      };
      return;
    }

    this.state.tooltip = null;
  }

  /**
   * Update tooltip position on scroll
   */
  updateTooltipPosition(): void {
    if (!this.state.tooltip) return;

    const { cell } = this.state.tooltip;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    let tooltipX: number;
    if (column.fixed === "left") {
      tooltipX = cellPos.x;
    } else if (column.fixed === "right") {
      tooltipX = cellPos.x;
    } else {
      tooltipX = cellPos.x - this.scrollState.scrollLeft;
    }

    const tooltipY = this.getCellViewportY(cell.rowIndex);

    this.state.tooltip.x = tooltipX;
    this.state.tooltip.y = tooltipY;
    this.state.tooltip.width = cellPos.width;
  }

  /**
   * Clear tooltip
   */
  clearTooltip(): void {
    this.state.tooltip = null;
  }

  /**
   * Get tooltip state
   */
  getTooltip(): TooltipState | null {
    return this.state.tooltip;
  }

  /**
   * Get image tooltip state
   */
  getImageTooltip(): ImageTooltipState | null {
    return this.state.imageTooltip;
  }
}
