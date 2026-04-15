/**
 * ContextMenuHandler - Handles right-click context menu interactions
 *
 * Manages cell context menu and header context menu.
 */

import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { TableEvents } from "../../constants/events";

export class ContextMenuHandler extends BaseHandler {
  private static readonly DROPDOWN_ITEM_HEIGHT = 32;

  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    super(context, eventEmitter);
  }

  /**
   * Handle context menu click
   */
  handleContextMenuClick(e: MouseEvent): boolean {
    if (!this.state.contextMenu) return false;

    const { x, y, rowIndex } = this.state.contextMenu;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const menuWidth = 140;
    const itemHeight = ContextMenuHandler.DROPDOWN_ITEM_HEIGHT;
    const menuItems = 3;
    const menuHeight = menuItems * itemHeight;

    if (
      viewportX >= x &&
      viewportX <= x + menuWidth &&
      viewportY >= y &&
      viewportY <= y + menuHeight
    ) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex === 0) {
        this.eventEmitter.emit(TableEvents.ROW_ADD_ABOVE, rowIndex);
      } else if (itemIndex === 1) {
        this.eventEmitter.emit(TableEvents.ROW_ADD_BELOW, rowIndex);
      } else if (itemIndex === 2) {
        this.eventEmitter.emit(TableEvents.ROW_DELETE, rowIndex);
      }

      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
      return true;
    }

    return false;
  }

  /**
   * Handle context menu hover
   */
  handleContextMenuHover(e: MouseEvent): void {
    if (!this.state.contextMenu) return;

    const { x, y, hoveredIndex: prevHoveredIndex } = this.state.contextMenu;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const menuWidth = 140;
    const itemHeight = ContextMenuHandler.DROPDOWN_ITEM_HEIGHT;
    const menuItems = 3;
    const menuHeight = menuItems * itemHeight;

    let newHoveredIndex = -1;

    if (
      viewportX >= x &&
      viewportX <= x + menuWidth &&
      viewportY >= y &&
      viewportY <= y + menuHeight
    ) {
      const relativeY = viewportY - y;
      newHoveredIndex = Math.floor(relativeY / itemHeight);
    }

    if (newHoveredIndex !== prevHoveredIndex) {
      this.state.contextMenu.hoveredIndex = newHoveredIndex;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_HOVER);
    }
  }

  /**
   * Handle header context menu click
   */
  handleHeaderContextMenuClick(e: MouseEvent): boolean {
    if (!this.state.headerContextMenu) return false;

    const { x, y, columnKey } = this.state.headerContextMenu;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const menuWidth = 120;
    const menuHeight = 32;

    if (
      viewportX >= x &&
      viewportX <= x + menuWidth &&
      viewportY >= y &&
      viewportY <= y + menuHeight
    ) {
      // Hide this column
      this.eventEmitter.emit(TableEvents.COLUMN_HIDE, columnKey);

      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
      return true;
    }

    return false;
  }

  /**
   * Handle header context menu hover
   */
  handleHeaderContextMenuHover(e: MouseEvent): void {
    if (!this.state.headerContextMenu) return;

    const { x, y, hoveredIndex: prevHoveredIndex } = this.state.headerContextMenu;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const menuWidth = 120;
    const menuHeight = 32;

    let newHoveredIndex = -1;

    if (
      viewportX >= x &&
      viewportX <= x + menuWidth &&
      viewportY >= y &&
      viewportY <= y + menuHeight
    ) {
      newHoveredIndex = 0;
    }

    if (newHoveredIndex !== prevHoveredIndex) {
      this.state.headerContextMenu.hoveredIndex = newHoveredIndex;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_HOVER);
    }
  }

  /**
   * Close context menus
   */
  closeContextMenus(): void {
    if (this.state.contextMenu) {
      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
    }
    if (this.state.headerContextMenu) {
      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
    }
  }

  /**
   * Get context menu state
   */
  getContextMenu(): import("../../types").ContextMenuState | null {
    return this.state.contextMenu;
  }

  /**
   * Get header context menu state
   */
  getHeaderContextMenu(): import("../../types").HeaderContextMenuState | null {
    return this.state.headerContextMenu;
  }
}
