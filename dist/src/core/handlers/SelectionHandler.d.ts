/**
 * SelectionHandler - Handles cell selection logic
 *
 * Manages single selection, range selection, toggle selection,
 * select all, and selection movement.
 */
import { CellPosition, CellRange } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
export declare class SelectionHandler extends BaseHandler {
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    /**
     * Handle single cell selection
     */
    handleSingleSelection(cell: CellPosition): void;
    /**
     * Handle range selection (shift+click)
     */
    handleRangeSelection(cell: CellPosition): void;
    /**
     * Handle toggle selection (ctrl/cmd+click)
     */
    handleToggleSelection(cell: CellPosition): void;
    /**
     * Select all cells
     */
    selectAll(): void;
    /**
     * Clear selection
     */
    clearSelection(): void;
    /**
     * Move selection by delta
     */
    moveSelection(rowDelta: number, colDelta: number): void;
    /**
     * Get normalized range (min/max row and column)
     */
    getNormalizedRange(range: CellRange): {
        minRow: number;
        maxRow: number;
        minCol: number;
        maxCol: number;
    };
    /**
     * Scroll to make a cell visible
     */
    private scrollToCell;
    /**
     * Check if a cell is selected
     */
    isCellSelected(cell: CellPosition): boolean;
    /**
     * Get selected cells as flat array
     */
    getSelectedCells(): CellPosition[];
}
//# sourceMappingURL=SelectionHandler.d.ts.map