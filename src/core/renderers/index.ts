/**
 * Cell Renderers Module
 *
 * This module exports all cell renderers and provides a registry
 * for managing and accessing renderers by cell type.
 */

import { CanvasTableLocale, CellType, Column, Row, TableTheme } from "../../types";
import { LayoutManager } from "../LayoutManager";
import { CellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
import { TextRenderer } from "./TextRenderer";
import { NumberRenderer } from "./NumberRenderer";
import { CheckboxRenderer } from "./CheckboxRenderer";
import { RadioRenderer } from "./RadioRenderer";
import { ButtonRenderer } from "./ButtonRenderer";
import { SwitchRenderer } from "./SwitchRenderer";
import { ProgressRenderer } from "./ProgressRenderer";
import { ImageRenderer } from "./ImageRenderer";
import { TagsRenderer } from "./TagsRenderer";
import { DateRenderer } from "./DateRenderer";
import { SelectRenderer } from "./SelectRenderer";
import { InputRenderer } from "./InputRenderer";
import { RatingRenderer } from "./RatingRenderer";
import { ColorRenderer } from "./ColorRenderer";
import { getPerformanceMonitor, RendererPerformanceMonitor } from "./PerformanceMonitor";
import { zhCN } from "../../locale";

// Re-export all types and base classes
export { BaseCellRenderer } from "./CellRenderer";
export type { CellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";

// Re-export all renderers
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
export { ColorRenderer } from "./ColorRenderer";

// Re-export performance monitor
export { RendererPerformanceMonitor, getPerformanceMonitor } from "./PerformanceMonitor";
export type { PerformanceStats, FrameStats } from "./PerformanceMonitor";

/**
 * Registry for managing cell renderers
 */
export class CellRendererRegistry {
  private renderers: Map<CellType, CellRenderer> = new Map();
  private defaultRenderer: CellRenderer;
  private performanceMonitor: RendererPerformanceMonitor;
  private locale: CanvasTableLocale;

  constructor(locale: CanvasTableLocale = zhCN) {
    this.locale = locale;
    // Register all built-in renderers
    this.register(new TextRenderer());
    this.register(new NumberRenderer());
    this.register(new CheckboxRenderer());
    this.register(new RadioRenderer());
    const buttonRenderer = new ButtonRenderer();
    this.register(buttonRenderer);
    this.renderers.set("buttons", buttonRenderer);
    this.register(new SwitchRenderer());
    this.register(new ProgressRenderer());
    this.register(new ImageRenderer());
    this.register(new TagsRenderer());
    this.register(new DateRenderer());
    this.register(new SelectRenderer());
    this.register(new InputRenderer());
    this.register(new RatingRenderer());
    this.register(new ColorRenderer());

    // Default renderer for unknown types
    this.defaultRenderer = new TextRenderer();

    // Get global performance monitor
    this.performanceMonitor = getPerformanceMonitor();
  }

  setLocale(locale: CanvasTableLocale): void {
    this.locale = locale;
  }

  /**
   * Enable or disable performance monitoring
   */
  setPerformanceMonitoring(enabled: boolean): void {
    this.performanceMonitor.setEnabled(enabled);
  }

  /**
   * Check if performance monitoring is enabled
   */
  isPerformanceMonitoringEnabled(): boolean {
    return this.performanceMonitor.isEnabled();
  }

  /**
   * Get the performance monitor instance
   */
  getPerformanceMonitor(): RendererPerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Start a new frame (call before rendering begins)
   */
  startFrame(): void {
    this.performanceMonitor.startFrame();
  }

  /**
   * End the current frame (call after rendering completes)
   */
  endFrame(): void {
    this.performanceMonitor.endFrame();
  }

  /**
   * Register a renderer
   */
  register(renderer: CellRenderer): void {
    this.renderers.set(renderer.type, renderer);
  }

  /**
   * Get a renderer by cell type
   */
  get(type: CellType): CellRenderer | undefined {
    return this.renderers.get(type);
  }

  /**
   * Check if a renderer exists for a type
   */
  has(type: CellType): boolean {
    return this.renderers.has(type);
  }

  /**
   * Render a cell using the appropriate renderer
   */
  render(context: CellRendererContext): CellRenderResult {
    const cellType = context.column.type ?? "text";
    const renderer = this.renderers.get(cellType) ?? this.defaultRenderer;

    // Measure performance if monitoring is enabled
    return this.performanceMonitor.measure(cellType, () => renderer.render(context));
  }

  /**
   * Create a render context
   */
  createContext(params: {
    ctx: CanvasRenderingContext2D;
    theme: TableTheme;
    locale?: CanvasTableLocale;
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
    multipleSelectSeparator?: string;
    hoveredImageIndex?: number;
    hoveredButtonIndex?: number;
  }): CellRendererContext {
    return { ...params, locale: params.locale ?? this.locale };
  }
}
