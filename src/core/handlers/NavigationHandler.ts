/**
 * NavigationHandler - Handles keyboard navigation
 *
 * Manages arrow key navigation, Enter key handling, Tab navigation,
 * and scrolling to cells.
 */

import { CellPosition } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { SelectionHandler } from "./SelectionHandler";
import { resolveDisabled, getColumnField, getRenderResult } from "../../utils";
import { TableEvents } from "../../constants/events";

export class NavigationHandler extends BaseHandler {
  private selectionHandler: SelectionHandler;
  private editingConfig: { enabled?: boolean; mode?: string; validateOnChange?: boolean };

  constructor(
    context: HandlerContext,
    eventEmitter: EventEmitter<InteractionEvents>,
    selectionHandler: SelectionHandler,
    editingConfig: { enabled?: boolean; mode?: string; validateOnChange?: boolean },
  ) {
    super(context, eventEmitter);
    this.selectionHandler = selectionHandler;
    this.editingConfig = editingConfig;
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(e: KeyboardEvent): void {
    e.preventDefault();

    const leafColumns = this.layoutManager.getLeafColumns();

    let currentCell: CellPosition;

    if (this.state.selectedCells.length > 0) {
      const range = this.state.selectedCells[0]!;
      currentCell = e.key === "ArrowUp" || e.key === "ArrowLeft" ? range.start : range.end;
    } else {
      currentCell = { rowIndex: 0, columnIndex: 0 };
    }

    let newRow = currentCell.rowIndex;
    let newCol = currentCell.columnIndex;

    switch (e.key) {
      case "ArrowUp":
        newRow = Math.max(0, newRow - 1);
        break;
      case "ArrowDown":
        newRow = Math.min(this.rows.length - 1, newRow + 1);
        break;
      case "ArrowLeft":
        newCol = Math.max(0, newCol - 1);
        break;
      case "ArrowRight":
        newCol = Math.min(leafColumns.length - 1, newCol + 1);
        break;
    }

    const newCell: CellPosition = { rowIndex: newRow, columnIndex: newCol };
    this.selectionHandler.handleSingleSelection(newCell);

    this.scrollToCell(newCell);
  }

  /**
   * Handle Enter key
   * @returns Editing configuration if editing should start, null otherwise
   */
  handleEnterKey(e: KeyboardEvent): {
    type: string;
    config?: unknown;
  } | null {
    if (this.state.selectedCells.length === 0) return null;

    e.preventDefault();
    e.stopPropagation();

    const cell = this.state.selectedCells[0]!.start;

    if (this.editingConfig.enabled !== false) {
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[cell.columnIndex];
      const row = this.rows[cell.rowIndex];

      if (column && row) {
        const renderResult = getRenderResult(column, row, cell.rowIndex);
        const controlTypes = ["checkbox", "radio", "button", "switch"];
        if (renderResult.type && controlTypes.includes(renderResult.type)) {
          if (renderResult.type === "switch" && renderResult.switch) {
            if (!resolveDisabled(column.disabled, row, column)) {
              // Auto update row.data
              row.data[getColumnField(column)] = !renderResult.switch.checked;
              this.eventEmitter.emit(
                TableEvents.SWITCH_CHANGE,
                this.getCellInfo(cell)!,
                !renderResult.switch.checked,
              );
            }
            return null;
          }
          this.toggleRowExpand(cell.rowIndex);
          return null;
        }

        // Check editable
        if (column.editable === false) return null;

        // Check column disabled
        if (resolveDisabled(column.disabled, row, column)) return null;

        // Check input readonly
        if (renderResult.input?.readonly) return null;

        // Return navigation result for editing
        return this.getEditingStartConfig(cell, column, row, renderResult);
      }
    } else {
      this.toggleRowExpand(cell.rowIndex);
    }

    return null;
  }

  /**
   * Get editing start configuration for a cell
   */
  private getEditingStartConfig(
    cell: CellPosition,
    column: import("../../types").Column,
    row: import("../../types").Row,
    renderResult: import("../../types").RenderResult,
  ): {
    type: string;
    config?: unknown;
  } | null {
    const value = row.data[getColumnField(column)];

    // Try editRender first
    if (column.editRender) {
      try {
        const result = column.editRender(value, row, cell.rowIndex);
        if (result) {
          const configMap: Record<string, keyof typeof result> = {
            input: "input",
            select: "select",
            tags: "tags",
            date: "date",
            checkbox: "checkbox",
            radio: "radio",
            switch: "switch",
          };
          const configKey = configMap[result.type];
          return { type: result.type, config: configKey ? result[configKey] : undefined };
        }
      } catch (error) {
        console.error("Error in editRender:", error);
      }
    }

    // Fall back to render result
    if (renderResult.type === "select" && renderResult.select) {
      return { type: "select", config: renderResult.select };
    }

    if (renderResult.type === "tag" && renderResult.tags && renderResult.tags.editable) {
      return { type: "tags", config: renderResult.tags };
    }

    if (renderResult.type === "date" && renderResult.date) {
      return { type: "date", config: renderResult.date };
    }

    if (renderResult.type === "image" && renderResult.image) {
      return { type: "image", config: renderResult.image };
    }

    return { type: "input", config: renderResult.input };
  }

  /**
   * Handle keyboard events while editing
   */
  handleEditingKeyDown(e: KeyboardEvent): boolean {
    if (!this.state.editingCell) return false;

    switch (e.key) {
      case "Enter":
        return true; // Signal to end editing
      case "Escape":
        return true; // Signal to cancel editing
      case "Tab":
        e.preventDefault();
        return true; // Signal to end editing and move
    }

    return false;
  }

  /**
   * Scroll to make a cell visible
   */
  scrollToCell(cell: CellPosition): void {
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
   * Toggle row expand state
   */
  private toggleRowExpand(rowIndex: number): void {
    const row = this.rows[rowIndex];
    if (row && row.children && row.children.length > 0) {
      this.eventEmitter.emit(TableEvents.EXPAND, row, rowIndex, !row.expanded);
    }
  }

  /**
   * Update editing config
   */
  updateEditingConfig(config: {
    enabled?: boolean;
    mode?: string;
    validateOnChange?: boolean;
  }): void {
    this.editingConfig = config;
  }
}
