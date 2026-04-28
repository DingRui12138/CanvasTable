/**
 * CellRenderer Interface and Context
 *
 * This module defines the interface that all cell renderers must implement,
 * enabling a strategy pattern for rendering different cell types.
 */

import {
  Column,
  Row,
  TableTheme,
  CellType,
  CheckboxConfig,
  RadioConfig,
  ButtonConfig,
  ButtonsConfig,
  InputConfig,
  SelectConfig,
  TagsConfig,
  DateConfig,
  SwitchConfig,
  ImageConfig,
  ProgressConfig,
  RatingConfig,
  ColorPickerConfig,
  SwitchAnimationState,
  ButtonHoverState,
  CanvasTableLocale,
} from "../../types";
import { LayoutManager } from "../LayoutManager";

/**
 * Context provided to each cell renderer
 */
export interface CellRendererContext {
  /** Canvas 2D rendering context */
  ctx: CanvasRenderingContext2D;

  /** Table theme for styling */
  theme: TableTheme;

  /** Locale text used by built-in renderers */
  locale: CanvasTableLocale;

  /** Layout manager for position calculations */
  layoutManager: LayoutManager;

  /** Cell X position in viewport coordinates */
  x: number;

  /** Cell Y position in viewport coordinates */
  y: number;

  /** Cell width */
  width: number;

  /** Cell height */
  height: number;

  /** Column definition */
  column: Column;

  /** Row data */
  row: Row;

  /** Row index */
  rowIndex: number;

  /** Column index */
  colIndex: number;

  /** Cell value */
  value: unknown;

  /** Whether the cell is disabled */
  isDisabled: boolean;

  /** Whether the cell is hovered */
  isHovered: boolean;

  /** Whether the cell is selected */
  isSelected: boolean;

  /** Device pixel ratio for HiDPI rendering */
  dpr: number;

  /** Optional switch animation state */
  switchAnimation?: SwitchAnimationState;

  /** Optional button hover state */
  buttonHoverState?: ButtonHoverState;

  /** Global separator used by multi-select cells */
  multipleSelectSeparator?: string;

  /** Hovered image index (for multi-image cells) */
  hoveredImageIndex?: number;

  /** Hovered button index (for buttons cells) */
  hoveredButtonIndex?: number;
}

/**
 * Render result returned by cell renderers
 */
export interface CellRenderResult {
  /** The type of cell that was rendered */
  type: CellType;

  /** Optional config that was used for rendering */
  config?:
    | CheckboxConfig
    | RadioConfig
    | ButtonConfig
    | ButtonsConfig
    | InputConfig
    | SelectConfig
    | TagsConfig
    | DateConfig
    | SwitchConfig
    | ImageConfig
    | ProgressConfig
    | RatingConfig
    | ColorPickerConfig;

  /** Whether the cell handled its own background */
  customBackground?: boolean;

  /** Star bounds for rating click detection */
  starBounds?: Array<{ index: number; x: number; width: number }>;
}

/**
 * Interface that all cell renderers must implement
 */
export interface CellRenderer {
  /** The cell type this renderer handles */
  readonly type: CellType;

  /**
   * Render the cell content
   * @param context The rendering context
   * @returns The render result
   */
  render(context: CellRendererContext): CellRenderResult;

  /**
   * Optional method to measure cell content
   * @param context The rendering context
   * @returns The measured dimensions
   */
  measure?(context: CellRendererContext): { width: number; height: number };
}

/**
 * Base class for cell renderers providing common utilities
 */
export abstract class BaseCellRenderer implements CellRenderer {
  abstract readonly type: CellType;

  abstract render(context: CellRendererContext): CellRenderResult;

  /**
   * Get cell padding
   */
  protected getPadding(): number {
    return 8;
  }

  /**
   * Get the text alignment for a column
   */
  protected getTextAlign(column: Column): "left" | "center" | "right" {
    return column.align ?? "left";
  }

  /**
   * Calculate text position based on alignment
   */
  protected calculateTextX(
    text: string,
    x: number,
    width: number,
    padding: number,
    align: "left" | "center" | "right",
    ctx: CanvasRenderingContext2D,
  ): number {
    const textWidth = ctx.measureText(text).width;

    switch (align) {
      case "center":
        return x + (width - textWidth) / 2;
      case "right":
        return x + width - padding - textWidth;
      default:
        return x + padding;
    }
  }

  /**
   * Draw a rounded rectangle
   */
  protected drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Truncate text to fit within a given width
   */
  protected truncateText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    ellipsis: string = "...",
  ): string {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + ellipsis;
  }
}
