/**
 * CellRenderer Interface and Context
 *
 * This module defines the interface that all cell renderers must implement,
 * enabling a strategy pattern for rendering different cell types.
 */
import { Column, Row, TableTheme, CellType, CheckboxConfig, RadioConfig, ButtonConfig, ButtonsConfig, InputConfig, SelectConfig, TagsConfig, DateConfig, SwitchConfig, ImageConfig, ProgressConfig, RatingConfig, ColorPickerConfig, SwitchAnimationState, ButtonHoverState, CanvasTableLocale } from "../../types";
import { LayoutManager } from "../LayoutManager";
/**
 * Runtime hooks required by ImageRenderer to integrate with the host's
 * image load queue, lazy-load gating, and per-frame visibility tracking.
 *
 * Renderer (host) is the owner of these resources; ImageRenderer is
 * stateless and reads/writes them through this contract.
 */
export interface ImageRuntime {
    /** Read cached image (already pre-scaled to targetSize when available). */
    get(src: string, targetSize?: number): HTMLImageElement | HTMLCanvasElement | null;
    /** Whether the image is currently being loaded. */
    isLoading(src: string): boolean;
    /** Whether the image previously failed to load. */
    isFailed(src: string): boolean;
    /** Request a load; the host triggers a redraw via its callback when ready. */
    load(src: string, targetSize?: number): void;
    /** Mark src as visible this frame so it isn't cancelled by cancelInvisible. */
    collectVisible(src: string): void;
    /** Whether the row is within the lazy-load extended viewport. */
    isInLazyLoadRange(rowIndex: number, threshold: number): boolean;
}
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
    /** Required when rendering image cells; provides host runtime hooks. */
    imageRuntime?: ImageRuntime;
}
/**
 * Render result returned by cell renderers
 */
export interface CellRenderResult {
    /** The type of cell that was rendered */
    type: CellType;
    /** Optional config that was used for rendering */
    config?: CheckboxConfig | RadioConfig | ButtonConfig | ButtonsConfig | InputConfig | SelectConfig | TagsConfig | DateConfig | SwitchConfig | ImageConfig | ProgressConfig | RatingConfig | ColorPickerConfig;
    /** Whether the cell handled its own background */
    customBackground?: boolean;
    /** Star bounds for rating click detection */
    starBounds?: Array<{
        index: number;
        x: number;
        width: number;
    }>;
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
    measure?(context: CellRendererContext): {
        width: number;
        height: number;
    };
}
/**
 * Base class for cell renderers providing common utilities
 */
export declare abstract class BaseCellRenderer implements CellRenderer {
    abstract readonly type: CellType;
    abstract render(context: CellRendererContext): CellRenderResult;
    /**
     * Get cell padding
     */
    protected getPadding(): number;
    /**
     * Get the text alignment for a column
     */
    protected getTextAlign(column: Column): "left" | "center" | "right";
    /**
     * Calculate text position based on alignment
     */
    protected calculateTextX(text: string, x: number, width: number, padding: number, align: "left" | "center" | "right", ctx: CanvasRenderingContext2D): number;
    /**
     * Draw a rounded rectangle
     */
    protected drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void;
    /**
     * Truncate text to fit within a given width
     */
    protected truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, ellipsis?: string): string;
}
//# sourceMappingURL=CellRenderer.d.ts.map