/**
 * BaseHandler - Base class for all interaction handlers
 *
 * This class provides shared dependencies and utility methods for all handlers.
 * Each handler extends this base class to access shared state and utilities.
 * Data (rows) is accessed through DataManager to ensure consistency.
 */
import { CanvasTableLocale, CellPosition, CellInfo, InteractionState, ScrollState, Column, Row } from "../../types";
import { LayoutManager } from "../LayoutManager";
import { DataManager } from "../DataManager";
import { EventEmitter } from "../EventEmitter";
import { EditorRegistry } from "../editors";
import { DropdownPositionCalculator, DropdownPositionResult, DropdownAnchorType } from "../DropdownPositionCalculator";
export interface HandlerContext {
    state: InteractionState;
    scrollState: ScrollState;
    layoutManager: LayoutManager;
    dataManager: DataManager;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    expandColumnKey: string | null;
    locale: CanvasTableLocale;
    editorRegistry: EditorRegistry;
}
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
    selectChange: [CellInfo, unknown, boolean];
    tagsChange: [CellInfo, string[], boolean];
    dropdownOpen: [];
    dropdownClose: [CellPosition | null];
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
export declare abstract class BaseHandler {
    protected context: HandlerContext;
    protected eventEmitter: EventEmitter<InteractionEvents>;
    protected dropdownCalculator: DropdownPositionCalculator;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    protected get state(): InteractionState;
    protected get scrollState(): ScrollState;
    protected get layoutManager(): LayoutManager;
    protected get dataManager(): DataManager;
    protected get canvas(): HTMLCanvasElement;
    protected get ctx(): CanvasRenderingContext2D;
    protected get locale(): CanvasTableLocale;
    protected get rows(): Row[];
    protected get allRows(): Row[];
    protected get editorRegistry(): EditorRegistry;
    /**
     * Convert CellPosition to CellInfo with row and column data
     */
    protected getCellInfo(cell: CellPosition): CellInfo | null;
    /**
     * Calculate cell viewport X position
     */
    protected getCellViewportX(cellPos: {
        x: number;
    }, column: Column | undefined): number;
    protected getCellViewportY(rowIndex: number): number;
    /**
     * Update expand column key
     */
    updateExpandColumnKey(key: string | null): void;
    /**
     * Get the viewport bounds from the canvas
     */
    protected getCanvasBounds(): DOMRect;
    /**
     * Convert mouse event to viewport coordinates
     */
    protected getViewportCoords(e: MouseEvent): {
        x: number;
        y: number;
    };
    /**
     * Calculate initial dropdown position
     */
    protected calculateDropdownPosition(cell: CellPosition, width: number, height: number, anchorType?: DropdownAnchorType, options?: {
        column?: Column;
        gap?: number;
        buttonRelativeX?: number;
        buttonY?: number;
        buttonHeight?: number;
        columnKey?: string;
        customAnchorY?: number;
    }): DropdownPositionResult;
    /**
     * Update dropdown Y position during scroll
     */
    protected updateDropdownY(cell: CellPosition, currentShowAbove: boolean, dropdownHeight: number, options?: {
        column?: Column;
        gap?: number;
        anchorType?: DropdownAnchorType;
        buttonY?: number;
        buttonHeight?: number;
    }): {
        y: number;
        showAbove: boolean;
        cellViewportY: number;
    };
    /**
     * Update dropdown X position during horizontal scroll
     */
    protected updateDropdownX(cell: CellPosition, dropdownWidth: number, options?: {
        column?: Column;
        anchorType?: DropdownAnchorType;
        buttonRelativeX?: number;
    }): number;
    /**
     * Check if cell is in viewport
     */
    protected isCellInViewport(cell: CellPosition): boolean;
}
//# sourceMappingURL=BaseHandler.d.ts.map