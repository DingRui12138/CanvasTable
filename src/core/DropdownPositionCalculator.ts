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
import { getDevicePixelRatio } from "../utils";

/**
 * Dropdown anchor type - determines Y-axis positioning reference
 */
export type DropdownAnchorType =
  | "cell" // Anchor at cell bottom (default)
  | "cell-top" // Anchor at cell top (for showing above)
  | "button" // Anchor at button bottom (for buttons dropdown)
  | "header" // Anchor at header bottom (for filter dropdown)
  | "custom"; // Custom Y position

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

export class DropdownPositionCalculator {
  private layoutManager: LayoutManager;
  private scrollState: ScrollState;
  private canvas: HTMLCanvasElement;

  // Default configuration
  private static readonly DEFAULT_GAP = 4;
  private static readonly EDGE_PADDING = 8;

  constructor(layoutManager: LayoutManager, scrollState: ScrollState, canvas: HTMLCanvasElement) {
    this.layoutManager = layoutManager;
    this.scrollState = scrollState;
    this.canvas = canvas;
  }

  /**
   * Get logical canvas dimensions (CSS pixels, accounting for devicePixelRatio)
   */
  private getLogicalCanvasSize(): { width: number; height: number } {
    const dpr = getDevicePixelRatio();
    return {
      width: this.canvas.width / dpr,
      height: this.canvas.height / dpr,
    };
  }

  /**
   * Calculate initial dropdown position
   */
  calculate(params: DropdownPositionParams): DropdownPositionResult {
    const { width, height, gap = DropdownPositionCalculator.DEFAULT_GAP } = params;

    const { width: canvasWidth, height: canvasHeight } = this.getLogicalCanvasSize();

    // 1. Calculate X position
    const x = this.calculateX(params, width, canvasWidth);

    // 2. Calculate Y anchor point
    const { anchorY, cellViewportY } = this.calculateAnchorY(params);

    // 3. Calculate final Y position with space detection
    const { y, showAbove } = this.calculateInitialY(anchorY, height, gap, canvasHeight);

    return { x, y, showAbove, anchorViewportY: anchorY, cellViewportY };
  }

  /**
   * Update Y position during scroll (preserves or toggles showAbove)
   */
  updateY(
    params: DropdownUpdateParams,
    currentShowAbove: boolean,
    dropdownHeight: number,
    gap: number = DropdownPositionCalculator.DEFAULT_GAP,
  ): { y: number; showAbove: boolean; cellViewportY: number } {
    const { height: canvasHeight } = this.getLogicalCanvasSize();
    const { anchorY, cellViewportY } = this.calculateAnchorY(params);

    // Calculate position based on current showAbove state
    let y: number;
    if (currentShowAbove) {
      y = anchorY - gap - dropdownHeight;
    } else {
      y = anchorY + gap;
    }

    // Real-time space detection: toggle direction if space insufficient
    let newShowAbove = currentShowAbove;

    if (currentShowAbove && y < 0) {
      // Not enough space above, switch to below
      if (anchorY + gap + dropdownHeight <= canvasHeight) {
        y = anchorY + gap;
        newShowAbove = false;
      }
    } else if (!currentShowAbove && y + dropdownHeight > canvasHeight) {
      // Not enough space below, switch to above
      if (anchorY - gap - dropdownHeight >= 0) {
        y = anchorY - gap - dropdownHeight;
        newShowAbove = true;
      }
    }

    return { y, showAbove: newShowAbove, cellViewportY };
  }

  /**
   * Update X position during horizontal scroll
   */
  updateX(params: DropdownUpdateParams, dropdownWidth: number): number {
    const { width: canvasWidth } = this.getLogicalCanvasSize();
    return this.calculateX(params, dropdownWidth, canvasWidth);
  }

  /**
   * Calculate X position (handles fixed columns and boundary)
   */
  private calculateX(
    params: BasePositionParams,
    dropdownWidth: number,
    canvasWidth: number,
  ): number {
    let baseX: number;

    if (params.anchorType === "header") {
      baseX = this.getHeaderCellX(params.columnKey!, params.column);
    } else if (params.anchorType === "button" && params.buttonRelativeX !== undefined) {
      const cellViewportX = this.getCellViewportX(params);
      baseX = cellViewportX + params.buttonRelativeX;
    } else {
      baseX = this.getCellViewportX(params);
    }

    // Boundary detection
    // Only constrain dropdown position when the cell is still partially visible in the viewport
    // When cell scrolls out of viewport, let dropdown follow it (consistent behavior on both sides)
    const minPadding = DropdownPositionCalculator.EDGE_PADDING;
    const column = params.column ?? this.getColumn(params);
    const cellWidth = column?.width ?? 100;
    const cellRight = baseX + cellWidth;

    // Check if cell is still visible (at least partially in viewport)
    const isCellVisible = cellRight > minPadding && baseX < canvasWidth - minPadding;

    let x = baseX;
    if (isCellVisible) {
      // Cell is visible - ensure dropdown stays within viewport bounds
      if (dropdownWidth <= canvasWidth - minPadding * 2) {
        // Dropdown fits - ensure both sides are within bounds
        if (x + dropdownWidth > canvasWidth - minPadding) {
          x = canvasWidth - dropdownWidth - minPadding;
        }
        if (x < minPadding) {
          x = minPadding;
        }
      } else {
        // Dropdown is wider than canvas - center it
        x = (canvasWidth - dropdownWidth) / 2;
      }
    }
    // If cell is not visible, dropdown follows the cell (can go outside viewport)

    return x;
  }

  /**
   * Get cell viewport X (handles fixed columns)
   */
  private getCellViewportX(params: BasePositionParams): number {
    const cellPos = this.getCellPosition(params);
    const column = params.column ?? this.getColumn(params);

    return column?.fixed ? cellPos.x : cellPos.x - this.scrollState.scrollLeft;
  }

  /**
   * Get cell position from params
   */
  private getCellPosition(params: BasePositionParams): {
    x: number;
    y: number;
    height: number;
    width: number;
  } {
    if (params.cell) {
      return this.layoutManager.getCellPosition(params.cell.rowIndex, params.cell.columnIndex);
    }
    // Fallback: use columnIndex
    return this.layoutManager.getCellPosition(0, params.columnIndex ?? 0);
  }

  private getCellViewportY(params: BasePositionParams): number {
    if (params.cell) {
      return this.layoutManager.getCellViewportY(params.cell.rowIndex, this.scrollState.scrollTop);
    }

    return this.layoutManager.getCellViewportY(0, this.scrollState.scrollTop);
  }

  /**
   * Get column from params
   */
  private getColumn(params: BasePositionParams): Column | undefined {
    if (params.column) return params.column;
    if (params.cell) {
      return this.layoutManager.getLeafColumns()[params.cell.columnIndex];
    }
    return this.layoutManager.getLeafColumns()[params.columnIndex ?? 0];
  }

  /**
   * Get header cell X position
   */
  private getHeaderCellX(columnKey: string, column?: Column): number {
    // Use column if provided
    if (column) {
      const columns = this.layoutManager.getColumns();
      let x = 0;
      for (const col of columns) {
        if (col.key === columnKey) {
          return col.fixed ? x : x - this.scrollState.scrollLeft;
        }
        x += col.width ?? 100;
      }
    }
    return 0;
  }

  /**
   * Calculate Y anchor point based on anchor type
   */
  private calculateAnchorY(params: BasePositionParams): {
    anchorY: number;
    cellViewportY: number;
  } {
    const cellPos = this.getCellPosition(params);
    const cellViewportY = this.getCellViewportY(params);

    switch (params.anchorType) {
      case "cell":
        return {
          anchorY: cellViewportY + cellPos.height, // Cell bottom
          cellViewportY,
        };

      case "cell-top":
        return {
          anchorY: cellViewportY, // Cell top
          cellViewportY,
        };

      case "button":
        return {
          anchorY: cellViewportY + params.buttonY! + params.buttonHeight!, // Button bottom
          cellViewportY,
        };

      case "header":
        const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
        return {
          anchorY: headerHeight,
          cellViewportY: 0,
        };

      case "custom":
        return {
          anchorY: params.customAnchorY!,
          cellViewportY: params.customAnchorY!,
        };

      default:
        return { anchorY: 0, cellViewportY: 0 };
    }
  }

  /**
   * Calculate initial Y position with space detection
   */
  private calculateInitialY(
    anchorY: number,
    dropdownHeight: number,
    gap: number,
    canvasHeight: number,
  ): { y: number; showAbove: boolean } {
    // Default: show below
    let y = anchorY + gap;
    let showAbove = false;

    // Check if enough space below
    if (y + dropdownHeight > canvasHeight) {
      // Try showing above
      const aboveY = anchorY - gap - dropdownHeight;
      if (aboveY >= 0) {
        y = aboveY;
        showAbove = true;
      }
    }

    return { y, showAbove };
  }

  /**
   * Check if cell is still visible in viewport
   */
  isCellInViewport(params: DropdownUpdateParams): boolean {
    const cellPos = this.getCellPosition(params);
    const cellViewportY = this.getCellViewportY(params);
    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
    const { height: canvasHeight } = this.getLogicalCanvasSize();

    return cellViewportY >= headerHeight && cellViewportY + cellPos.height <= canvasHeight;
  }
}
