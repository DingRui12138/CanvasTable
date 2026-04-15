/**
 * ClipboardHandler - Handles copy/paste operations
 *
 * Manages copying selected cells to clipboard and getting selected text.
 */

import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { SelectionHandler } from "./SelectionHandler";
import { getCellDisplayText, getColumnField } from "../../utils";

export class ClipboardHandler extends BaseHandler {
  private selectionHandler: SelectionHandler;

  constructor(
    context: HandlerContext,
    eventEmitter: EventEmitter<InteractionEvents>,
    selectionHandler: SelectionHandler,
  ) {
    super(context, eventEmitter);
    this.selectionHandler = selectionHandler;
  }

  /**
   * Copy selected cells to clipboard
   */
  async copySelection(): Promise<void> {
    const text = this.getSelectedText();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for older browsers
        this.fallbackCopyToClipboard(text);
      }
    }
  }

  /**
   * Get selected cells as tab-separated text
   */
  getSelectedText(): string {
    const selectedCells = this.state.selectedCells;
    if (selectedCells.length === 0) return "";

    const leafColumns = this.layoutManager.getLeafColumns();
    const lines: string[] = [];

    for (const range of selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.selectionHandler.getNormalizedRange(range);

      for (let row = minRow; row <= maxRow; row++) {
        const rowData = this.rows[row];
        if (!rowData) continue;

        const cells: string[] = [];
        for (let col = minCol; col <= maxCol; col++) {
          const column = leafColumns[col];
          if (!column) continue;

          const displayText = getCellDisplayText(column, rowData, row);
          cells.push(displayText);
        }
        lines.push(cells.join("\t"));
      }
    }

    return lines.join("\n");
  }

  /**
   * Get selected cells as a 2D array of values
   */
  getSelectedValues(): unknown[][] {
    const selectedCells = this.state.selectedCells;
    if (selectedCells.length === 0) return [];

    const leafColumns = this.layoutManager.getLeafColumns();
    const result: unknown[][] = [];

    for (const range of selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.selectionHandler.getNormalizedRange(range);

      for (let row = minRow; row <= maxRow; row++) {
        const rowData = this.rows[row];
        if (!rowData) continue;

        const rowValues: unknown[] = [];
        for (let col = minCol; col <= maxCol; col++) {
          const column = leafColumns[col];
          if (!column) continue;

          const value = rowData.data[getColumnField(column)];
          rowValues.push(value);
        }
        result.push(rowValues);
      }
    }

    return result;
  }

  /**
   * Get selected cells as CSV format
   */
  getSelectedCSV(): string {
    const values = this.getSelectedValues();
    return values
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? "");
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(","),
      )
      .join("\n");
  }

  /**
   * Fallback copy method for older browsers
   */
  private fallbackCopyToClipboard(text: string): void {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  /**
   * Check if there is any selection
   */
  hasSelection(): boolean {
    return this.state.selectedCells.length > 0;
  }

  /**
   * Get selection bounds
   */
  getSelectionBounds(): {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  } | null {
    if (this.state.selectedCells.length === 0) return null;

    let minRow = Infinity;
    let maxRow = -Infinity;
    let minCol = Infinity;
    let maxCol = -Infinity;

    for (const range of this.state.selectedCells) {
      const normalized = this.selectionHandler.getNormalizedRange(range);
      minRow = Math.min(minRow, normalized.minRow);
      maxRow = Math.max(maxRow, normalized.maxRow);
      minCol = Math.min(minCol, normalized.minCol);
      maxCol = Math.max(maxCol, normalized.maxCol);
    }

    return { minRow, maxRow, minCol, maxCol };
  }
}
