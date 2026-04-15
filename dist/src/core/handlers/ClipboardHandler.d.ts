/**
 * ClipboardHandler - Handles copy/paste operations
 *
 * Manages copying selected cells to clipboard and getting selected text.
 */
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { SelectionHandler } from "./SelectionHandler";
export declare class ClipboardHandler extends BaseHandler {
    private selectionHandler;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>, selectionHandler: SelectionHandler);
    /**
     * Copy selected cells to clipboard
     */
    copySelection(): Promise<void>;
    /**
     * Get selected cells as tab-separated text
     */
    getSelectedText(): string;
    /**
     * Get selected cells as a 2D array of values
     */
    getSelectedValues(): unknown[][];
    /**
     * Get selected cells as CSV format
     */
    getSelectedCSV(): string;
    /**
     * Fallback copy method for older browsers
     */
    private fallbackCopyToClipboard;
    /**
     * Check if there is any selection
     */
    hasSelection(): boolean;
    /**
     * Get selection bounds
     */
    getSelectionBounds(): {
        minRow: number;
        maxRow: number;
        minCol: number;
        maxCol: number;
    } | null;
}
//# sourceMappingURL=ClipboardHandler.d.ts.map