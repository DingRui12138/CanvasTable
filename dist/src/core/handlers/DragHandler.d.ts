/**
 * DragHandler - Handles drag operations
 *
 * Manages column resize, column reorder, and related drag state management.
 */
import { Column, FixedType } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
export interface SiblingColumnInfo {
    key: string;
    left: number;
    right: number;
    center: number;
    width: number;
    leafCount: number;
    firstLeafIndex: number;
    fixed: FixedType;
}
export declare class DragHandler extends BaseHandler {
    private resizeColumnIndex;
    private resizeStartX;
    private resizeStartWidth;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    /**
     * Handle column resize drag
     */
    handleColumnResizeDrag(e: MouseEvent): boolean;
    /**
     * Start column resize
     */
    startColumnResize(columnIndex: number, startX: number, startWidth: number): void;
    /**
     * End column resize
     */
    endColumnResize(): void;
    /**
     * Calculate sibling columns for reorder
     * Sibling columns are defined as:
     * 1. Columns with the same parent (same parent's children)
     * 2. Top-level columns with the same fixed property
     */
    calculateSiblingColumns(column: Column): SiblingColumnInfo[];
    /**
     * Handle column reorder drag
     */
    handleColumnReorderDrag(viewportX: number): boolean;
    /**
     * End column reorder
     */
    endColumnReorder(): {
        dragColumnIndex: number;
        targetColumnIndex: number;
    } | null;
    /**
     * Get first leaf column from a column (possibly parent)
     */
    private getFirstLeaf;
    /**
     * Get child leaf count for a column
     */
    private getChildLeafCount;
    /**
     * Get resize column index
     */
    getResizeColumnIndex(): number;
    /**
     * Check if currently resizing
     */
    isResizing(): boolean;
    /**
     * Check if currently reordering
     */
    isReordering(): boolean;
}
//# sourceMappingURL=DragHandler.d.ts.map