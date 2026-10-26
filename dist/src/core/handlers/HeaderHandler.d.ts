/**
 * HeaderHandler - Handles header interactions
 *
 * Manages header hover, click, sort, filter dropdown, and column reorder.
 */
import { Column, FixedType, SortConfig, FilterConfig, HeaderCell } from "../../types";
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
export declare class HeaderHandler extends BaseHandler {
    private sortConfig;
    private filterConfig;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>, sortConfig: SortConfig[], filterConfig: FilterConfig[]);
    /**
     * Handle header hover
     */
    handleHeaderHover(headerCell: HeaderCell, viewportX: number, viewportY: number): void;
    /**
     * Handle header mouse down
     */
    handleHeaderMouseDown(columnIndex: number, e: MouseEvent): boolean;
    /**
     * Handle header click (sort/filter)
     */
    handleHeaderClick(columnIndex: number, e: MouseEvent): void;
    /**
     * Set sort direction
     */
    private setSortDirection;
    /**
     * Toggle sort
     */
    private toggleSort;
    /**
     * Open filter dropdown
     */
    openFilterDropdown(column: Column, columnIndex: number): void;
    /**
     * Calculate sibling columns for reorder
     */
    calculateSiblingColumns(column: Column): SiblingColumnInfo[];
    /**
     * Get first leaf column from a column (possibly parent)
     */
    private getFirstLeaf;
    /**
     * Get child leaf count for a column
     */
    private getChildLeafCount;
    /**
     * Update sort config reference
     */
    updateSortConfig(config: SortConfig[]): void;
    /**
     * Update filter config reference
     */
    updateFilterConfig(config: FilterConfig[]): void;
}
//# sourceMappingURL=HeaderHandler.d.ts.map