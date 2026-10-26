/**
 * ContextMenuHandler - Handles right-click context menu interactions
 *
 * Manages cell context menu and header context menu.
 */
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
export declare class ContextMenuHandler extends BaseHandler {
    private static readonly DROPDOWN_ITEM_HEIGHT;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    /**
     * Handle context menu click
     */
    handleContextMenuClick(e: MouseEvent): boolean;
    /**
     * Handle context menu hover
     */
    handleContextMenuHover(e: MouseEvent): void;
    /**
     * Handle header context menu click
     */
    handleHeaderContextMenuClick(e: MouseEvent): boolean;
    /**
     * Handle header context menu hover
     */
    handleHeaderContextMenuHover(e: MouseEvent): void;
    /**
     * Close context menus
     */
    closeContextMenus(): void;
    /**
     * Get context menu state
     */
    getContextMenu(): import("../../types").ContextMenuState | null;
    /**
     * Get header context menu state
     */
    getHeaderContextMenu(): import("../../types").HeaderContextMenuState | null;
}
//# sourceMappingURL=ContextMenuHandler.d.ts.map