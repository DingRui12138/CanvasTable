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
export declare class NavigationHandler extends BaseHandler {
    private selectionHandler;
    private editingConfig;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>, selectionHandler: SelectionHandler, editingConfig: {
        enabled?: boolean;
        mode?: string;
        validateOnChange?: boolean;
    });
    /**
     * Handle arrow key navigation
     */
    handleArrowNavigation(e: KeyboardEvent): void;
    /**
     * Handle Enter key
     * @returns Editing configuration if editing should start, null otherwise
     */
    handleEnterKey(e: KeyboardEvent): {
        type: string;
        config?: unknown;
    } | null;
    /**
     * Get editing start configuration for a cell
     */
    private getEditingStartConfig;
    /**
     * Handle keyboard events while editing
     */
    handleEditingKeyDown(e: KeyboardEvent): boolean;
    /**
     * Scroll to make a cell visible
     */
    scrollToCell(cell: CellPosition): void;
    /**
     * Toggle row expand state
     */
    private toggleRowExpand;
    /**
     * Update editing config
     */
    updateEditingConfig(config: {
        enabled?: boolean;
        mode?: string;
        validateOnChange?: boolean;
    }): void;
}
//# sourceMappingURL=NavigationHandler.d.ts.map