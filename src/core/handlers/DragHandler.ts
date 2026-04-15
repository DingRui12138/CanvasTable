/**
 * DragHandler - Handles drag operations
 *
 * Manages column resize, column reorder, and related drag state management.
 */

import { Column, FixedType } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { TableEvents } from "../../constants/events";

export interface SiblingColumnInfo {
  key: string;
  left: number;
  right: number;
  center: number;
  width: number;
  leafCount: number;
  firstLeafIndex: number;
  fixed: FixedType;
}

export class DragHandler extends BaseHandler {
  // Resize state
  private resizeColumnIndex: number = -1;
  private resizeStartX: number = 0;
  private resizeStartWidth: number = 0;

  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    super(context, eventEmitter);
  }

  /**
   * Handle column resize drag
   */
  handleColumnResizeDrag(e: MouseEvent): boolean {
    if (!this.state.isDragging || this.state.dragType !== "column-resize") {
      return false;
    }

    const column = this.layoutManager.getLeafColumn(this.resizeColumnIndex);
    if (!column) return false;

    let deltaX = e.clientX - this.resizeStartX;

    if (column.fixed === "right") {
      deltaX = -deltaX;
    }

    const newWidth = Math.max(50, this.resizeStartWidth + deltaX);
    this.layoutManager.setColumnWidth(column.key, newWidth);
    this.eventEmitter.emit(TableEvents.COLUMN_RESIZE, column, newWidth);

    return true;
  }

  /**
   * Start column resize
   */
  startColumnResize(columnIndex: number, startX: number, startWidth: number): void {
    this.resizeColumnIndex = columnIndex;
    this.resizeStartX = startX;
    this.resizeStartWidth = startWidth;
    this.state.isDragging = true;
    this.state.dragType = "column-resize";
  }

  /**
   * End column resize
   */
  endColumnResize(): void {
    this.state.isDragging = false;
    this.state.dragType = null;
    this.resizeColumnIndex = -1;
  }

  /**
   * Calculate sibling columns for reorder
   * Sibling columns are defined as:
   * 1. Columns with the same parent (same parent's children)
   * 2. Top-level columns with the same fixed property
   */
  calculateSiblingColumns(column: Column): SiblingColumnInfo[] {
    const siblings: SiblingColumnInfo[] = [];

    const scrollLeft = this.scrollState.scrollLeft;
    let siblingColumns: Column[] = [];

    if (column.parentKey) {
      // Has parent, get siblings under same parent
      const parentColumn = this.layoutManager.getColumnByKey(column.parentKey);
      if (parentColumn && parentColumn.children) {
        siblingColumns = parentColumn.children;
      }
    } else {
      // Top-level columns, get same fixed property and reorderable columns
      const allColumns = this.layoutManager.getColumns();
      siblingColumns = allColumns.filter((col: Column) => {
        // Exclude non-reorderable columns
        if (col.reorderable === false) return false;
        // Only same fixed property
        return col.fixed === column.fixed;
      });
    }

    // Calculate position info for each sibling
    const leftFixedWidth = this.layoutManager.getLeftFixedWidth();
    const rightFixedWidth = this.layoutManager.getRightFixedWidth();
    const viewportWidth = this.layoutManager.getViewportWidth();

    for (const sibling of siblingColumns) {
      const leafCount = this.getChildLeafCount(sibling);
      const firstLeaf = this.getFirstLeaf(sibling);
      const firstLeafIndex = firstLeaf ? this.layoutManager.getLeafColumnIndex(firstLeaf) : -1;

      if (firstLeafIndex < 0) continue;

      const width = this.layoutManager.getColumnWidth(sibling);
      const siblingFixed = sibling.fixed;

      // Calculate left boundary (viewport coordinates) based on each column's fixed property
      let left = 0;

      if (siblingFixed === "left") {
        // Left fixed: accumulate from left to right
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (col?.fixed === "left") {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
      } else if (siblingFixed === "right") {
        // Right fixed: start from right boundary
        left = viewportWidth - rightFixedWidth;
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (col?.fixed === "right") {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
      } else {
        // Normal columns: consider scroll and left fixed columns
        left = leftFixedWidth;
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (!col?.fixed) {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
        left -= scrollLeft;
      }

      siblings.push({
        key: sibling.key,
        left,
        right: left + width,
        center: left + width / 2,
        width,
        leafCount,
        firstLeafIndex,
        fixed: siblingFixed || false,
      });
    }

    return siblings;
  }

  /**
   * Handle column reorder drag
   */
  handleColumnReorderDrag(viewportX: number): boolean {
    if (!this.state.columnReorderState) return false;

    this.state.columnReorderState.currentX = viewportX;

    const reorderState = this.state.columnReorderState;
    const siblingColumns = reorderState.siblingColumns;
    const dragSiblingIndex = reorderState.dragSiblingIndex;

    // If no sibling columns, re-calculate (legacy support)
    if (!siblingColumns || siblingColumns.length === 0) {
      this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
      return true;
    }

    // Debounce: check if in cooldown period (50ms)
    const now = Date.now();
    if (reorderState.lastSwapTime && now - reorderState.lastSwapTime < 50) {
      this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
      return true;
    }

    // Find current mouse position column among siblings
    let targetSiblingIndex = -1;
    let targetCenter = 0;

    for (let i = 0; i < siblingColumns.length; i++) {
      const sibling = siblingColumns[i]!;
      if (viewportX >= sibling.left && viewportX < sibling.right) {
        targetSiblingIndex = i;
        targetCenter = sibling.center;
        break;
      }
    }

    // If mouse not on any sibling column, clear last swap target
    if (targetSiblingIndex === -1) {
      reorderState.lastSwapTargetKey = undefined;
    }

    // Execute swap detection
    if (targetSiblingIndex !== -1 && targetSiblingIndex !== dragSiblingIndex) {
      const dragSibling = siblingColumns[dragSiblingIndex];
      const targetSibling = siblingColumns[targetSiblingIndex];

      if (dragSibling && targetSibling) {
        // Prevent duplicate swap with same target
        if (reorderState.lastSwapTargetKey === targetSibling.key) {
          this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
          return true;
        }

        // Check if crossed center line
        let shouldSwap = false;
        const direction = targetSiblingIndex > dragSiblingIndex ? "right" : "left";

        if (direction === "right") {
          shouldSwap = viewportX >= targetCenter;
        } else {
          shouldSwap = viewportX < targetCenter;
        }

        if (shouldSwap) {
          // Sibling columns are guaranteed to be in same region, swap directly
          this.eventEmitter.emit(TableEvents.COLUMN_SWAP, dragSibling.key, targetSibling.key);

          // Update state
          reorderState.lastSwapTime = now;
          reorderState.lastSwapTargetKey = undefined;

          // Update sibling columns info (re-calculate after swap)
          const dragColumn = this.layoutManager.getColumnByKey(reorderState.dragColumnKey);

          if (dragColumn) {
            const newSiblingColumns = this.calculateSiblingColumns(dragColumn);
            const newDragSiblingIndex = newSiblingColumns.findIndex(
              (s) => s.key === reorderState.dragColumnKey,
            );

            reorderState.siblingColumns = newSiblingColumns;
            reorderState.dragSiblingIndex =
              newDragSiblingIndex >= 0 ? newDragSiblingIndex : dragSiblingIndex;

            const newDragSibling = newSiblingColumns[reorderState.dragSiblingIndex];
            if (newDragSibling) {
              reorderState.dragColumnIndex = newDragSibling.firstLeafIndex;
            }
          }
        }
      }
    } else if (targetSiblingIndex === dragSiblingIndex) {
      // Mouse returned to dragged column's new position, clear last swap target
      reorderState.lastSwapTargetKey = undefined;
    }

    // Update target column index (for rendering indicator)
    if (targetSiblingIndex !== -1) {
      const targetSibling = siblingColumns[targetSiblingIndex];
      if (targetSibling) {
        reorderState.targetColumnIndex = targetSibling.firstLeafIndex;
      }
    } else {
      // Mouse not on any sibling column, use dragged column as target
      const dragSibling = siblingColumns[dragSiblingIndex];
      if (dragSibling) {
        reorderState.targetColumnIndex = dragSibling.firstLeafIndex;
      }
    }

    this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
    return true;
  }

  /**
   * End column reorder
   */
  endColumnReorder(): { dragColumnIndex: number; targetColumnIndex: number } | null {
    if (!this.state.columnReorderState) return null;

    const { dragColumnIndex, targetColumnIndex } = this.state.columnReorderState;
    const shouldReorder = dragColumnIndex !== targetColumnIndex && targetColumnIndex >= 0;

    this.state.isDragging = false;
    this.state.dragType = null;
    this.state.columnReorderState = undefined;

    if (shouldReorder) {
      return { dragColumnIndex, targetColumnIndex };
    }

    return null;
  }

  /**
   * Get first leaf column from a column (possibly parent)
   */
  private getFirstLeaf(column: Column): Column | null {
    if (!column.children || column.children.length === 0) {
      return column;
    }
    return this.getFirstLeaf(column.children[0]!);
  }

  /**
   * Get child leaf count for a column
   */
  private getChildLeafCount(column: Column): number {
    if (!column.children || column.children.length === 0) {
      return 1;
    }
    let count = 0;
    for (const child of column.children) {
      count += this.getChildLeafCount(child);
    }
    return count;
  }

  /**
   * Get resize column index
   */
  getResizeColumnIndex(): number {
    return this.resizeColumnIndex;
  }

  /**
   * Check if currently resizing
   */
  isResizing(): boolean {
    return this.state.isDragging && this.state.dragType === "column-resize";
  }

  /**
   * Check if currently reordering
   */
  isReordering(): boolean {
    return this.state.isDragging && this.state.dragType === "column-reorder";
  }
}
