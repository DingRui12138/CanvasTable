/**
 * Cell Renderers Module
 *
 * This module exports all cell renderers and provides a registry
 * for managing and accessing renderers by cell type.
 */
import { CellType, Column, Row, TableTheme } from "../../types";
import { LayoutManager } from "../LayoutManager";
import { CellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
import { RendererPerformanceMonitor } from "./PerformanceMonitor";
export { BaseCellRenderer } from "./CellRenderer";
export type { CellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export { TextRenderer } from "./TextRenderer";
export { NumberRenderer } from "./NumberRenderer";
export { CheckboxRenderer } from "./CheckboxRenderer";
export { RadioRenderer } from "./RadioRenderer";
export { ButtonRenderer } from "./ButtonRenderer";
export { SwitchRenderer } from "./SwitchRenderer";
export { ProgressRenderer } from "./ProgressRenderer";
export { ImageRenderer } from "./ImageRenderer";
export { TagsRenderer } from "./TagsRenderer";
export { DateRenderer } from "./DateRenderer";
export { SelectRenderer } from "./SelectRenderer";
export { InputRenderer } from "./InputRenderer";
export { RatingRenderer } from "./RatingRenderer";
export { RendererPerformanceMonitor, getPerformanceMonitor } from "./PerformanceMonitor";
export type { PerformanceStats, FrameStats } from "./PerformanceMonitor";
/**
 * Registry for managing cell renderers
 */
export declare class CellRendererRegistry {
    private renderers;
    private defaultRenderer;
    private performanceMonitor;
    constructor();
    /**
     * Enable or disable performance monitoring
     */
    setPerformanceMonitoring(enabled: boolean): void;
    /**
     * Check if performance monitoring is enabled
     */
    isPerformanceMonitoringEnabled(): boolean;
    /**
     * Get the performance monitor instance
     */
    getPerformanceMonitor(): RendererPerformanceMonitor;
    /**
     * Start a new frame (call before rendering begins)
     */
    startFrame(): void;
    /**
     * End the current frame (call after rendering completes)
     */
    endFrame(): void;
    /**
     * Register a renderer
     */
    register(renderer: CellRenderer): void;
    /**
     * Get a renderer by cell type
     */
    get(type: CellType): CellRenderer | undefined;
    /**
     * Check if a renderer exists for a type
     */
    has(type: CellType): boolean;
    /**
     * Render a cell using the appropriate renderer
     */
    render(context: CellRendererContext): CellRenderResult;
    /**
     * Create a render context
     */
    createContext(params: {
        ctx: CanvasRenderingContext2D;
        theme: TableTheme;
        layoutManager: LayoutManager;
        x: number;
        y: number;
        width: number;
        height: number;
        column: Column;
        row: Row;
        rowIndex: number;
        colIndex: number;
        value: unknown;
        isDisabled: boolean;
        isHovered: boolean;
        isSelected: boolean;
        dpr: number;
        switchAnimation?: import("../../types").SwitchAnimationState;
        buttonHoverState?: import("../../types").ButtonHoverState;
        hoveredImageIndex?: number;
        hoveredButtonIndex?: number;
    }): CellRendererContext;
}
//# sourceMappingURL=index.d.ts.map