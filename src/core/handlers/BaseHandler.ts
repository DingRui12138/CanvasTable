/**
 * BaseHandler - Base class for all interaction handlers
 *
 * This class provides shared dependencies and utility methods for all handlers.
 * Each handler extends this base class to access shared state and utilities.
 * Data (rows) is accessed through DataManager to ensure consistency.
 */

import {
  CanvasTableLocale,
  CellPosition,
  CellInfo,
  InteractionState,
  ScrollState,
  Column,
  Row,
} from "../../types";
import { LayoutManager } from "../LayoutManager";
import { DataManager } from "../DataManager";
import { EventEmitter } from "../EventEmitter";
import {
  DropdownPositionCalculator,
  DropdownPositionResult,
  DropdownAnchorType,
} from "../DropdownPositionCalculator";

// Handler context that provides shared dependencies
export interface HandlerContext {
  state: InteractionState;
  scrollState: ScrollState;
  layoutManager: LayoutManager;
  dataManager: DataManager;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  expandColumnKey: string | null;
  locale: CanvasTableLocale;
}

// Event emitter type for interaction events
export interface InteractionEvents {
  cellClick: [CellInfo, MouseEvent];
  cellDblClick: [CellInfo, MouseEvent];
  cellHover: [CellInfo | null, MouseEvent];
  headerHover: [string | undefined];
  rowClick: [Row, number, MouseEvent];
  rowDblClick: [Row, number, MouseEvent];
  selectionChange: [import("../../types").CellRange[]];
  editStart: [CellInfo, import("../../types").InputConfig?];
  selectEditStart: [CellInfo, import("../../types").SelectConfig?];
  editEnd: [CellInfo, unknown];
  scroll: [number, number];
  columnResize: [Column, number];
  sortChange: [import("../../types").SortConfig[]];
  filterChange: [import("../../types").FilterConfig[]];
  expand: [Row, number, boolean];
  checkboxChange: [CellInfo, boolean];
  radioChange: [CellInfo, unknown];
  switchChange: [CellInfo, boolean];
  buttonClick: [CellInfo, string | undefined];
  selectChange: [CellInfo, unknown];
  tagsChange: [CellInfo, string[], boolean];
  dropdownOpen: [];
  dropdownClose: [];
  dropdownHover: [];
  filterDropdownOpen: [];
  filterDropdownClose: [];
  contextMenuOpen: [];
  contextMenuClose: [];
  contextMenuHover: [];
  headerContextMenuOpen: [];
  headerContextMenuClose: [];
  headerContextMenuHover: [];
  columnHide: [string];
  columnShow: [string];
  switchAnimationUpdate: [];
  rowAddAbove: [Row];
  rowAddBelow: [Row];
  rowDelete: [Row];
  rowPinChange: [Row, "top" | "bottom" | null];
  columnReorder: [number, number];
  columnReorderDrag: [];
  columnSwap: [string, string];
  imageClick: [CellInfo, string, MouseEvent];
  progressChange: [CellInfo, number];
  [key: string]: unknown[];
}

/**
 * Abstract base class for interaction handlers
 */
export abstract class BaseHandler {
  protected context: HandlerContext;
  protected eventEmitter: EventEmitter<InteractionEvents>;
  protected dropdownCalculator: DropdownPositionCalculator;

  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    this.context = context;
    this.eventEmitter = eventEmitter;

    // Initialize dropdown position calculator
    this.dropdownCalculator = new DropdownPositionCalculator(
      context.layoutManager,
      context.scrollState,
      context.canvas,
    );
  }

  // Protected accessors for common dependencies
  protected get state(): InteractionState {
    return this.context.state;
  }

  protected get scrollState(): ScrollState {
    return this.context.scrollState;
  }

  protected get layoutManager(): LayoutManager {
    return this.context.layoutManager;
  }

  protected get dataManager(): DataManager {
    return this.context.dataManager;
  }

  protected get canvas(): HTMLCanvasElement {
    return this.context.canvas;
  }

  protected get ctx(): CanvasRenderingContext2D {
    return this.context.ctx;
  }

  protected get locale(): CanvasTableLocale {
    return this.context.locale;
  }

  protected get rows(): Row[] {
    return this.dataManager.getRows();
  }

  protected get allRows(): Row[] {
    return this.dataManager.getAllRows();
  }

  // Shared utility methods

  /**
   * Convert CellPosition to CellInfo with row and column data
   */
  protected getCellInfo(cell: CellPosition): CellInfo | null {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) return null;
    return {
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      row,
      column,
    };
  }

  /**
   * Calculate cell viewport X position
   */
  protected getCellViewportX(cellPos: { x: number }, column: Column | undefined): number {
    return column?.fixed ? cellPos.x : cellPos.x - this.scrollState.scrollLeft;
  }

  protected getCellViewportY(rowIndex: number): number {
    return this.layoutManager.getCellViewportY(rowIndex, this.scrollState.scrollTop);
  }

  /**
   * Update expand column key
   */
  updateExpandColumnKey(key: string | null): void {
    this.context.expandColumnKey = key;
  }

  /**
   * Get the viewport bounds from the canvas
   */
  protected getCanvasBounds(): DOMRect {
    return this.canvas.getBoundingClientRect();
  }

  /**
   * Convert mouse event to viewport coordinates
   */
  protected getViewportCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.getCanvasBounds();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  // Dropdown position calculation methods

  /**
   * Calculate initial dropdown position
   */
  protected calculateDropdownPosition(
    cell: CellPosition,
    width: number,
    height: number,
    anchorType: DropdownAnchorType = "cell",
    options?: {
      column?: Column;
      gap?: number;
      buttonRelativeX?: number;
      buttonY?: number;
      buttonHeight?: number;
      columnKey?: string;
      customAnchorY?: number;
    },
  ): DropdownPositionResult {
    return this.dropdownCalculator.calculate({
      cell,
      column: options?.column ?? this.layoutManager.getLeafColumns()[cell.columnIndex],
      width,
      height,
      anchorType,
      gap: options?.gap,
      buttonRelativeX: options?.buttonRelativeX,
      buttonY: options?.buttonY,
      buttonHeight: options?.buttonHeight,
      columnKey: options?.columnKey,
      customAnchorY: options?.customAnchorY,
    });
  }

  /**
   * Update dropdown Y position during scroll
   */
  protected updateDropdownY(
    cell: CellPosition,
    currentShowAbove: boolean,
    dropdownHeight: number,
    options?: {
      column?: Column;
      gap?: number;
      anchorType?: DropdownAnchorType;
      buttonY?: number;
      buttonHeight?: number;
    },
  ): { y: number; showAbove: boolean; cellViewportY: number } {
    return this.dropdownCalculator.updateY(
      {
        cell,
        column: options?.column ?? this.layoutManager.getLeafColumns()[cell.columnIndex],
        anchorType: options?.anchorType ?? "cell",
        buttonY: options?.buttonY,
        buttonHeight: options?.buttonHeight,
      },
      currentShowAbove,
      dropdownHeight,
      options?.gap,
    );
  }

  /**
   * Update dropdown X position during horizontal scroll
   */
  protected updateDropdownX(
    cell: CellPosition,
    dropdownWidth: number,
    options?: {
      column?: Column;
      anchorType?: DropdownAnchorType;
      buttonRelativeX?: number;
    },
  ): number {
    return this.dropdownCalculator.updateX(
      {
        cell,
        column: options?.column ?? this.layoutManager.getLeafColumns()[cell.columnIndex],
        anchorType: options?.anchorType ?? "cell",
        buttonRelativeX: options?.buttonRelativeX,
      },
      dropdownWidth,
    );
  }

  /**
   * Check if cell is in viewport
   */
  protected isCellInViewport(cell: CellPosition): boolean {
    return this.dropdownCalculator.isCellInViewport({
      cell,
      column: this.layoutManager.getLeafColumns()[cell.columnIndex],
    });
  }
}
