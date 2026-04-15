/**
 * SelectionHandler - Handles cell selection logic
 *
 * Manages single selection, range selection, toggle selection,
 * select all, and selection movement.
 */

import { CellPosition, CellRange } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { clamp } from "../../utils";
import { TableEvents } from "../../constants/events";

export class SelectionHandler extends BaseHandler {
  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    super(context, eventEmitter);
  }

  /**
   * Handle single cell selection
   */
  handleSingleSelection(cell: CellPosition): void {
    this.state.selectedCells = [
      {
        start: cell,
        end: cell,
      },
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  /**
   * Handle range selection (shift+click)
   */
  handleRangeSelection(cell: CellPosition): void {
    if (!this.state.selectionStart) {
      this.handleSingleSelection(cell);
      return;
    }

    this.state.selectedCells = [
      {
        start: this.state.selectionStart,
        end: cell,
      },
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  /**
   * Handle toggle selection (ctrl/cmd+click)
   */
  handleToggleSelection(cell: CellPosition): void {
    const existingIndex = this.state.selectedCells.findIndex((range) => {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);

      return (
        cell.rowIndex >= minRow &&
        cell.rowIndex <= maxRow &&
        cell.columnIndex >= minCol &&
        cell.columnIndex <= maxCol
      );
    });

    if (existingIndex >= 0) {
      this.state.selectedCells.splice(existingIndex, 1);
    } else {
      this.state.selectedCells.push({ start: cell, end: cell });
    }

    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  /**
   * Select all cells
   */
  selectAll(): void {
    const leafColumns = this.layoutManager.getLeafColumns();
    if (this.rows.length === 0 || leafColumns.length === 0) return;

    this.state.selectedCells = [
      {
        start: { rowIndex: 0, columnIndex: 0 },
        end: { rowIndex: this.rows.length - 1, columnIndex: leafColumns.length - 1 },
      },
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.state.selectedCells = [];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  /**
   * Move selection by delta
   */
  moveSelection(rowDelta: number, colDelta: number): void {
    if (this.state.selectedCells.length === 0) return;

    const leafColumns = this.layoutManager.getLeafColumns();
    const cell = this.state.selectedCells[0]!.start;
    const newRow = clamp(cell.rowIndex + rowDelta, 0, this.rows.length - 1);
    const newCol = clamp(cell.columnIndex + colDelta, 0, leafColumns.length - 1);

    const newCell: CellPosition = { rowIndex: newRow, columnIndex: newCol };
    this.handleSingleSelection(newCell);
    this.scrollToCell(newCell);
  }

  /**
   * Get normalized range (min/max row and column)
   */
  getNormalizedRange(range: CellRange): {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  } {
    return {
      minRow: Math.min(range.start.rowIndex, range.end.rowIndex),
      maxRow: Math.max(range.start.rowIndex, range.end.rowIndex),
      minCol: Math.min(range.start.columnIndex, range.end.columnIndex),
      maxCol: Math.max(range.start.columnIndex, range.end.columnIndex),
    };
  }

  /**
   * Scroll to make a cell visible
   */
  private scrollToCell(cell: CellPosition): void {
    const targetScrollTop = this.layoutManager.getScrollOffsetForRow(cell.rowIndex);
    const targetScrollLeft = this.layoutManager.getScrollOffsetForColumn(cell.columnIndex);

    if (
      targetScrollTop !== this.scrollState.scrollTop ||
      targetScrollLeft !== this.scrollState.scrollLeft
    ) {
      this.scrollState.scrollLeft = targetScrollLeft;
      this.scrollState.scrollTop = targetScrollTop;
      this.eventEmitter.emit(TableEvents.SCROLL, targetScrollLeft, targetScrollTop);
    }
  }

  /**
   * Check if a cell is selected
   */
  isCellSelected(cell: CellPosition): boolean {
    return this.state.selectedCells.some((range) => {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);
      return (
        cell.rowIndex >= minRow &&
        cell.rowIndex <= maxRow &&
        cell.columnIndex >= minCol &&
        cell.columnIndex <= maxCol
      );
    });
  }

  /**
   * Get selected cells as flat array
   */
  getSelectedCells(): CellPosition[] {
    const cells: CellPosition[] = [];
    for (const range of this.state.selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          cells.push({ rowIndex: row, columnIndex: col });
        }
      }
    }
    return cells;
  }
}
