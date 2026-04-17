/**
 * DropdownPositionCalculator - Universal dropdown position calculator
 *
 * Provides unified position calculation for all dropdown types:
 * - select/tags dropdown
 * - date dropdown
 * - color picker dropdown
 * - buttons dropdown
 * - image tooltip/editor
 * - filter dropdown
 */
import { CellPosition, Column, ScrollState } from "../types";
import { LayoutManager } from "./LayoutManager";
/**
 * Dropdown anchor type - determines Y-axis positioning reference
 */
export type DropdownAnchorType = "cell" | "cell-top" | "button" | "header" | "custom";
/**
 * Base dropdown position parameters (shared across all operations)
 */
interface BasePositionParams {
    /** Target cell position */
    cell?: CellPosition;
    /** Column configuration (for handling fixed columns) */
    column?: Column;
    /** Column index (used when column not provided) */
    columnIndex?: number;
    /** Y-axis anchor type */
    anchorType?: DropdownAnchorType;
    /** Gap from anchor point */
    gap?: number;
    /** Button relative X position (only for anchorType="button") */
    buttonRelativeX?: number;
    /** Button Y offset within cell (only for anchorType="button") */
    buttonY?: number;
    /** Button height (only for anchorType="button") */
    buttonHeight?: number;
    /** Column key (only for anchorType="header") */
    columnKey?: string;
    /** Custom anchor Y (only for anchorType="custom") */
    customAnchorY?: number;
}
/**
 * Dropdown position calculation parameters (for initial calculation)
 */
export interface DropdownPositionParams extends BasePositionParams {
    /** Dropdown width */
    width: number;
    /** Dropdown height */
    height: number;
}
/**
 * Dropdown position update parameters (for scroll updates - no size needed)
 */
export interface DropdownUpdateParams extends BasePositionParams {
    /** Previous showAbove state (for updateY) */
    currentShowAbove?: boolean;
}
/**
 * Dropdown position calculation result
 */
export interface DropdownPositionResult {
    /** X coordinate (viewport relative) */
    x: number;
    /** Y coordinate (viewport relative) */
    y: number;
    /** Whether dropdown shows above anchor */
    showAbove: boolean;
    /** Anchor viewport Y (for external use) */
    anchorViewportY?: number;
    /** Cell viewport Y (for external use) */
    cellViewportY?: number;
}
export declare class DropdownPositionCalculator {
    private layoutManager;
    private scrollState;
    private canvas;
    private static readonly DEFAULT_GAP;
    private static readonly EDGE_PADDING;
    constructor(layoutManager: LayoutManager, scrollState: ScrollState, canvas: HTMLCanvasElement);
    /**
     * Get logical canvas dimensions (CSS pixels, accounting for devicePixelRatio)
     */
    private getLogicalCanvasSize;
    /**
     * Calculate initial dropdown position
     */
    calculate(params: DropdownPositionParams): DropdownPositionResult;
    /**
     * Update Y position during scroll (preserves or toggles showAbove)
     */
    updateY(params: DropdownUpdateParams, currentShowAbove: boolean, dropdownHeight: number, gap?: number): {
        y: number;
        showAbove: boolean;
        cellViewportY: number;
    };
    /**
     * Update X position during horizontal scroll
     */
    updateX(params: DropdownUpdateParams, dropdownWidth: number): number;
    /**
     * Calculate X position (handles fixed columns and boundary)
     */
    private calculateX;
    /**
     * Get cell viewport X (handles fixed columns)
     */
    private getCellViewportX;
    /**
     * Get cell position from params
     */
    private getCellPosition;
    /**
     * Get column from params
     */
    private getColumn;
    /**
     * Get header cell X position
     */
    private getHeaderCellX;
    /**
     * Calculate Y anchor point based on anchor type
     */
    private calculateAnchorY;
    /**
     * Calculate initial Y position with space detection
     */
    private calculateInitialY;
    /**
     * Check if cell is still visible in viewport
     */
    isCellInViewport(params: DropdownUpdateParams): boolean;
}
export {};
//# sourceMappingURL=DropdownPositionCalculator.d.ts.map