import {
  Column,
  Row,
  TableTheme,
  CellType,
  CellTypes,
  VisibleRange,
  CellPosition,
  CellRange,
  SortConfig,
  SortDirection,
  HorizontalAlign,
  VerticalAlign,
  RenderResult,
  TooltipState,
  DropdownState,
  ScrollbarState,
  FilterConfig,
  FilterDropdownState,
  WatermarkConfig,
  SwitchAnimationState,
  ButtonsDropdownState,
  ImageTooltipState,
  ImageEditorState,
  ButtonHoverState,
  ButtonsOptions,
  DisabledValue,
  DateDropdownState,
  ContextMenuState,
  HeaderContextMenuState,
  ColorPickerDropdownState,
  ImageLoadConfig,
  RowBand,
  CanvasTableLocale,
  ComputedSummaryRow,
  ValidationError,
} from "../types";
import { LayoutManager } from "./LayoutManager";
import { RenderCache, RowIdManager, ColumnIdManager } from "./RenderCache";
import { ImageLoadQueue } from "./ImageLoadQueue";
import { DropdownRenderer } from "./renderers/DropdownRenderer";
import { FilterDropdownRenderer } from "./renderers/FilterDropdownRenderer";
import { ImageOverlayRenderer } from "./renderers/ImageOverlayRenderer";
import { OverlayRenderer } from "./renderers/OverlayRenderer";
import {
  CellRendererRegistry,
  type CellRenderResult as StrategyCellRenderResult,
} from "./renderers";
import type { CellRenderer, CellRendererContext, ImageRuntime } from "./renderers/CellRenderer";
import {
  truncateText,
  getDevicePixelRatio,
  resolveDisabled,
  getColumnField,
  calculateMaxTextRows,
  layoutWrappedText,
} from "../utils";
import { CTElementRenderer, LayoutEngine, MeasurementEngine } from "./jsx";
import type { CTInteractiveRegion, JSXRenderContext } from "./jsx";
import { zhCN } from "../locale";

type CellRenderLocation = {
  rowIndex?: number;
  colIndex?: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PhaseStats = {
  totalTime: number;
  count: number;
  maxTime: number;
};

type CellRenderStats = PhaseStats & {
  maxCell?: CellRenderLocation;
};

type RowBandDetailStats = PhaseStats & {
  maxAt?: CellRenderLocation;
  columnKey?: string;
};

type RowBandCellTrace = {
  prefix: string;
  location: CellRenderLocation;
  columnKey: string;
};

type JSXUpdateHandlers = {
  updateValue: (rowIndex: number, column: Column, value: unknown) => Promise<void>;
  updateField: (rowIndex: number, field: string, value: unknown) => Promise<void>;
  updateRow: (rowIndex: number, data: Record<string, unknown>) => Promise<void>;
};

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private theme: TableTheme;
  private layoutManager: LayoutManager;
  private locale: CanvasTableLocale;
  private dpr: number;

  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private cellRendererRegistry: CellRendererRegistry;
  private dropdownRenderer: DropdownRenderer;
  private filterDropdownRenderer: FilterDropdownRenderer;
  private imageOverlayRenderer: ImageOverlayRenderer;
  private overlayRenderer: OverlayRenderer;

  private dirtyRegions: Array<{ x: number; y: number; width: number; height: number }> = [];
  private expandColumnKey: string | null = null;
  private currentSwitchAnimations: Map<string, SwitchAnimationState> | undefined;
  private currentButtonHoverStates: Map<string, ButtonHoverState> | undefined;
  private hoveredPlaceholderColumnIndex: number = -1;
  private isDestroyed = false;

  // 多选列分隔符
  private multipleSelectSeparator: string = ", ";

  // 图片加载队列（延迟加载 + 请求取消）
  private imageLoadQueue: ImageLoadQueue;

  // 图片渲染器使用的运行时桥接
  private imageRuntime!: ImageRuntime;

  // 图片单元格的快路径：缓存渲染器与可复用 context，
  // 避免在滚动热路径上每个单元格都分配 options/context 对象。
  private imageRenderer!: CellRenderer;
  private imageRenderContext!: CellRendererContext;
  private jsxMeasurementEngine!: MeasurementEngine;
  private jsxLayoutEngine!: LayoutEngine;
  private jsxRenderer!: CTElementRenderer;
  private jsxInteractiveRegions: CTInteractiveRegion[] = [];
  private jsxUpdateHandlers: JSXUpdateHandlers | null = null;
  private static readonly SHARED_PLACEHOLDER_COLUMN = {
    key: "image",
    title: "image",
    type: "image" as CellType,
  } as Column;
  private static readonly SHARED_PLACEHOLDER_ROW = { id: "", data: {} } as Row;

  /** 当前帧收集的可见图片 URL */
  private frameVisibleUrls: Set<string> = new Set();

  // 文本宽度缓存（用于按钮等需要测量文本宽度的场景）
  private textWidthCache: Map<string, number> = new Map();
  private textWidthCacheKey: string = ""; // 当前字体配置的 key

  // 动态行高支持
  /**
   * 根据单元格高度计算可显示行数
   */
  private calculateMaxRows(cellHeight: number, lineHeight: number, padding: number = 8): number {
    return calculateMaxTextRows(cellHeight, lineHeight, padding);
  }

  /**
   * 多行文本换行
   */
  private wrapTextToLines(text: string, maxWidth: number, maxRows: number): string[] {
    return layoutWrappedText(this.ctx, text, maxWidth, maxRows).lines;
  }

  // 性能监控
  private performanceEnabled: boolean = false;
  // type -> columnKey -> stats
  private performanceStats: Map<string, Map<string, CellRenderStats>> = new Map();
  private frameStartTime: number = 0;
  private frameCount: number = 0;

  // 帧历史记录（保留最近 120 帧）
  private frameHistory: Array<{
    frameId: number;
    startTime: number;
    totalTime: number;
    cellRenderTime: number;
    nonCellRendererTime: number;
    unaccountedTime: number;
    phases: Map<string, PhaseStats>;
    rowBandDetails: Map<string, RowBandDetailStats>;
    cellsByType: Map<string, Map<string, CellRenderStats>>;
    visibleRows: number;
    visibleColumns: number;
    visibleCells: number;
    scrollTop: number;
    scrollLeft: number;
  }> = [];
  private static readonly MAX_FRAME_HISTORY = 120;

  // 当前帧统计 (type -> columnKey -> stats)
  private currentFrameStats: Map<string, Map<string, CellRenderStats>> = new Map();
  // 当前帧阶段统计 (phaseName -> stats)
  private currentFramePhases: Map<string, PhaseStats> = new Map();
  // 当前帧 rowBands 内部细分统计 (detailName -> stats)
  private currentFrameRowBandDetails: Map<string, RowBandDetailStats> = new Map();
  // 上一帧统计（用于报告）
  private lastFrameStats: Map<string, Map<string, CellRenderStats>> = new Map();

  // 懒加载相关
  private currentVisibleRange: VisibleRange | null = null;
  private currentRows: Row[] = [];
  private currentScrollTop: number = 0;
  private rowHeight: number = 0;
  private currentHoveredCell: CellPosition | null = null;
  private currentHoveredImageIndex: number = -1;
  private currentHoveredButtonIndex: number = -1;
  private currentProgressDragState: import("../types").InteractionState["progressDragState"] =
    undefined;
  private currentRowResizeState: import("../types").InteractionState["rowResizeState"] = undefined;
  private currentValidationErrors: Map<string, ValidationError> = new Map();
  private currentPendingValidations: Set<string> = new Set();

  // 渲染缓存相关
  private renderCache: RenderCache | null = null;
  private rowIdManager: RowIdManager = new RowIdManager();
  private columnIdManager: ColumnIdManager = new ColumnIdManager();

  // 图片加载完成后的渲染触发回调
  private onImageLoaded: (() => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    theme: TableTheme,
    layoutManager: LayoutManager,
    locale: CanvasTableLocale = zhCN,
  ) {
    this.canvas = canvas;
    this.ctx = this.getContext(canvas);
    this.theme = theme;
    this.layoutManager = layoutManager;
    this.locale = locale;
    this.dpr = getDevicePixelRatio();

    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.getContext(this.offscreenCanvas);
    this.cellRendererRegistry = new CellRendererRegistry(locale);
    this.dropdownRenderer = new DropdownRenderer(
      this.ctx,
      this.theme,
      (text) => this.measureTextWidth(text),
      locale,
    );
    this.filterDropdownRenderer = new FilterDropdownRenderer(this.ctx, this.theme, locale);
    this.imageOverlayRenderer = new ImageOverlayRenderer(
      this.ctx,
      this.theme,
      {
        get: (src, minSize) => this.imageLoadQueue.get(src, minSize),
        isLoading: (src) => this.imageLoadQueue.isLoading(src),
        load: (src, targetSize) => this.loadImage(src, targetSize),
        collectVisible: (src) => this.collectVisibleImage(src),
      },
      locale,
    );
    this.overlayRenderer = new OverlayRenderer(
      this.canvas,
      this.ctx,
      this.theme,
      this.layoutManager,
      this.dpr,
      locale,
    );
    this.jsxMeasurementEngine = new MeasurementEngine(this.ctx);
    this.jsxLayoutEngine = new LayoutEngine(this.jsxMeasurementEngine);
    this.jsxRenderer = new CTElementRenderer(this.ctx, this.jsxLayoutEngine, this.theme);

    // 初始化图片加载队列（使用默认配置）
    this.imageLoadQueue = new ImageLoadQueue();

    // 图片渲染器使用的运行时桥接
    this.imageRuntime = {
      get: (src, targetSize) => this.imageLoadQueue.get(src, targetSize),
      isLoading: (src) => this.imageLoadQueue.isLoading(src),
      isFailed: (src) => this.imageLoadQueue.isFailed(src),
      load: (src, targetSize) => this.loadImage(src, targetSize),
      collectVisible: (src) => this.collectVisibleImage(src),
      isInLazyLoadRange: (rowIndex, threshold) => this.isInLazyLoadRange(rowIndex, threshold),
    };

    // 缓存图片渲染器与可复用 context，避免滚动热路径上反复分配
    this.imageRenderer = this.cellRendererRegistry.get("image")!;
    this.imageRenderContext = {
      ctx: this.ctx,
      theme: this.theme,
      locale: this.locale,
      layoutManager: this.layoutManager,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      column: Renderer.SHARED_PLACEHOLDER_COLUMN,
      row: Renderer.SHARED_PLACEHOLDER_ROW,
      rowIndex: -1,
      colIndex: -1,
      value: undefined,
      isDisabled: false,
      isHovered: false,
      isSelected: false,
      dpr: this.dpr,
      hoveredImageIndex: -1,
      imageRuntime: this.imageRuntime,
    };
  }

  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    return ctx;
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = this.getContext(canvas);
    this.dropdownRenderer.setContext(this.ctx);
    this.filterDropdownRenderer.setContext(this.ctx);
    this.imageOverlayRenderer.setContext(this.ctx);
    this.overlayRenderer.setCanvas(this.canvas, this.ctx);
    this.jsxMeasurementEngine.setContext(this.ctx);
    this.jsxRenderer.setContext(this.ctx);
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
    this.dropdownRenderer.setTheme(theme);
    this.filterDropdownRenderer.setTheme(theme);
    this.imageOverlayRenderer.setTheme(theme);
    this.overlayRenderer.setTheme(theme);
    this.jsxRenderer.setTheme(theme);
  }

  setLocale(locale: CanvasTableLocale): void {
    this.locale = locale;
    this.cellRendererRegistry.setLocale(locale);
    this.dropdownRenderer.setLocale(locale);
    this.filterDropdownRenderer.setLocale(locale);
    this.imageOverlayRenderer.setLocale(locale);
    this.overlayRenderer.setLocale(locale);
  }

  setMultipleSelectSeparator(separator: string): void {
    this.multipleSelectSeparator = separator;
  }

  /**
   * 设置图片加载配置
   */
  setImageLoadConfig(config: ImageLoadConfig): void {
    this.imageLoadQueue = new ImageLoadQueue({
      maxConcurrent: config.maxConcurrent ?? 6,
      maxCacheSize: config.maxCacheSize ?? 200,
    });
  }

  setWatermarkConfig(config: WatermarkConfig | null): void {
    this.overlayRenderer.setWatermarkConfig(config);
  }

  setExpandColumnKey(key: string | null): void {
    this.expandColumnKey = key;
  }

  /**
   * 设置渲染缓存
   */
  setRenderCache(renderCache: RenderCache): void {
    this.renderCache = renderCache;
  }

  /**
   * 设置图片加载完成后的渲染触发回调
   */
  setOnImageLoaded(callback: (() => void) | null): void {
    this.onImageLoaded = callback;
  }

  /**
   * 获取行 ID 管理器
   */
  getRowIdManager(): RowIdManager {
    return this.rowIdManager;
  }

  /**
   * 获取列 ID 管理器
   */
  getColumnIdManager(): ColumnIdManager {
    return this.columnIdManager;
  }

  resize(width: number, height: number): void {
    const newDpr = getDevicePixelRatio();
    if (newDpr !== this.dpr) {
      this.dpr = newDpr;
      this.overlayRenderer.setDpr(newDpr);
    }

    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.offscreenCanvas.width = width * this.dpr;
    this.offscreenCanvas.height = height * this.dpr;
    this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  updateTheme(theme: TableTheme): void {
    this.theme = theme;
    this.dropdownRenderer.setTheme(theme);
    this.filterDropdownRenderer.setTheme(theme);
    this.imageOverlayRenderer.setTheme(theme);
    this.overlayRenderer.setTheme(theme);
    this.jsxRenderer.setTheme(theme);
  }

  markDirty(x: number, y: number, width: number, height: number): void {
    this.dirtyRegions.push({ x, y, width, height });
  }

  markFullRedraw(): void {}

  getJSXInteractiveRegions(): CTInteractiveRegion[] {
    return this.jsxInteractiveRegions;
  }

  setJSXUpdateHandlers(handlers: JSXUpdateHandlers | null): void {
    this.jsxUpdateHandlers = handlers;
  }

  private createJSXRenderContext(
    row: Row,
    column: Column,
    rowIndex: number,
    colIndex: number,
    value: unknown,
  ): JSXRenderContext {
    return {
      value,
      row,
      column,
      rowIndex,
      colIndex,
      updateValue: async (nextValue) => {
        await this.jsxUpdateHandlers?.updateValue(rowIndex, column, nextValue);
      },
      updateField: async (field, nextValue) => {
        await this.jsxUpdateHandlers?.updateField(rowIndex, field, nextValue);
      },
      updateRow: async (data) => {
        await this.jsxUpdateHandlers?.updateRow(rowIndex, data);
      },
    };
  }

  render(
    columns: Column[],
    rows: Row[],
    visibleRange: VisibleRange,
    scrollLeft: number,
    scrollTop: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      sortConfig: SortConfig[];
      filterConfig: FilterConfig[];
      showHeader: boolean;
      stripeRows: boolean;
      dropdown?: DropdownState | null;
      hoveredHeaderColumnKey?: string;
      switchAnimations?: Map<string, SwitchAnimationState>;
      buttonHoverStates?: Map<string, ButtonHoverState>;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
      headerContextMenu?: HeaderContextMenuState | null;
      hoveredImageIndex?: number;
      hoveredButtonIndex?: number;
      progressDragState?: import("../types").InteractionState["progressDragState"];
      rowResizeState?: import("../types").InteractionState["rowResizeState"];
      validationErrors?: Map<string, ValidationError>;
      pendingValidations?: Set<string>;
    },
  ): void {
    this.currentSwitchAnimations = options.switchAnimations;
    this.currentButtonHoverStates = options.buttonHoverStates;
    this.currentHoveredCell = options.hoveredCell;
    this.currentHoveredImageIndex = options.hoveredImageIndex ?? -1;
    this.currentHoveredButtonIndex = options.hoveredButtonIndex ?? -1;
    this.currentProgressDragState = options.progressDragState;
    this.currentRowResizeState = options.rowResizeState;
    this.currentValidationErrors = options.validationErrors ?? new Map();
    this.currentPendingValidations = options.pendingValidations ?? new Set();
    this.jsxInteractiveRegions = [];

    // 开始性能监控帧
    this.beginFrame();

    let rootStateSaved = false;
    let centerClipStateSaved = false;

    try {
      // 保存可视区域信息用于图片懒加载
      this.currentVisibleRange = visibleRange;
      this.currentRows = rows;
      this.currentScrollTop = scrollTop;
      this.rowHeight = this.theme.row.height;

      const { startRow, endRow } = visibleRange;
      const viewportWidth = this.canvas.width / this.dpr;
      const viewportHeight = this.canvas.height / this.dpr;

      this.ctx.save();
      rootStateSaved = true;

      this.measurePhase("clearBackground", () => {
        this.ctx.fillStyle = this.theme.colors.background;
        this.ctx.fillRect(0, 0, viewportWidth, viewportHeight);
      });

      const leafColumns = this.layoutManager.getLeafColumns();
      const fixedInfo = this.layoutManager.getFixedColumnsInfo(columns);
      const hasLeftFixed = fixedInfo.leftFixed.columns.length > 0;
      const hasRightFixed = fixedInfo.rightFixed.columns.length > 0;

      // 检测悬浮的占位列索引
      this.hoveredPlaceholderColumnIndex =
        options.hoveredCell &&
        leafColumns[options.hoveredCell.columnIndex]?.key.startsWith("__hidden_placeholder__")
          ? options.hoveredCell.columnIndex
          : -1;

      const centerStartX = hasLeftFixed ? fixedInfo.leftFixed.width : 0;
      const centerEndX = viewportWidth - (hasRightFixed ? fixedInfo.rightFixed.width : 0);

      const centerColumnIndices = this.layoutManager.getVisibleCenterColumnIndices();

      const leftFixedIndices: number[] = [];
      const rightFixedIndices: number[] = [];
      for (let i = 0; i < leafColumns.length; i++) {
        const col = leafColumns[i];
        if (col) {
          if (col.fixed === "left") leftFixedIndices.push(i);
          if (col.fixed === "right") rightFixedIndices.push(i);
        }
      }

      const renderBands = this.shouldRenderRowBands();

      this.ctx.save();
      centerClipStateSaved = true;
      this.ctx.beginPath();
      this.ctx.rect(centerStartX, 0, centerEndX - centerStartX, viewportHeight);
      this.ctx.clip();

      if (renderBands) {
        this.measurePhase("rowBands", () => {
          this.renderRowBands(
            rows,
            centerColumnIndices,
            [],
            [],
            scrollLeft,
            scrollTop,
            visibleRange,
            fixedInfo,
            options,
            "rowBands",
          );
        });
      } else {
        this.measurePhase("centerRows", () => {
          this.renderCenterRows(
            leafColumns,
            rows,
            startRow,
            endRow,
            centerColumnIndices,
            scrollLeft,
            scrollTop,
            {
              ...options,
              dragColumnIndex: options.columnReorderState?.dragColumnIndex,
              columnReorderState: options.columnReorderState,
            },
          );
        });
      }

      this.ctx.restore();
      centerClipStateSaved = false;

      this.measurePhase("centerSelections", () => {
        this.renderCenterSelections(
          options.selectedCells,
          scrollLeft,
          scrollTop,
          centerColumnIndices,
        );
      });

      if (options.showHeader) {
        this.measurePhase("centerHeader", () => {
          this.renderCenterHeader(
            columns,
            centerColumnIndices,
            scrollTop,
            options.sortConfig,
            options.filterConfig,
            scrollLeft,
            options.hoveredHeaderColumnKey,
            options.columnReorderState?.dragColumnIndex,
            options.columnReorderState,
          );
        });
      }

      if (hasLeftFixed && !renderBands) {
        this.measurePhase("fixedColumnsContentLeft", () => {
          this.renderFixedColumnsContent(
            leafColumns,
            rows,
            leftFixedIndices,
            0,
            scrollTop,
            visibleRange,
            options,
          );
        });
      }

      if (hasRightFixed && !renderBands) {
        this.measurePhase("fixedColumnsContentRight", () => {
          this.renderFixedColumnsContent(
            leafColumns,
            rows,
            rightFixedIndices,
            viewportWidth - fixedInfo.rightFixed.width,
            scrollTop,
            visibleRange,
            options,
          );
        });
      }

      if (renderBands && (hasLeftFixed || hasRightFixed)) {
        this.measurePhase("rowBandsFixed", () => {
          this.renderRowBands(
            rows,
            [],
            leftFixedIndices,
            rightFixedIndices,
            scrollLeft,
            scrollTop,
            visibleRange,
            fixedInfo,
            options,
            "rowBandsFixed",
          );
        });
      }

      this.measurePhase("fixedSelections", () => {
        this.renderFixedSelections(
          options.selectedCells,
          scrollTop,
          leftFixedIndices,
          rightFixedIndices,
        );
      });

      if (options.showHeader) {
        if (hasLeftFixed) {
          this.measurePhase("fixedColumnsHeaderLeft", () => {
            this.renderFixedColumnsHeader(
              leafColumns,
              leftFixedIndices,
              0,
              options.sortConfig,
              options.filterConfig,
              options.hoveredHeaderColumnKey,
              options.columnReorderState,
            );
          });
        }

        if (hasRightFixed) {
          this.measurePhase("fixedColumnsHeaderRight", () => {
            this.renderFixedColumnsHeader(
              leafColumns,
              rightFixedIndices,
              viewportWidth - fixedInfo.rightFixed.width,
              options.sortConfig,
              options.filterConfig,
              options.hoveredHeaderColumnKey,
              options.columnReorderState,
            );
          });
        }
      }

      this.measurePhase("rowResizeGuide", () => {
        this.renderRowResizeGuide(viewportWidth);
      });

      if (options.dropdown) {
        const dropdown = options.dropdown;
        this.measurePhase("dropdown", () => {
          this.renderDropdown(dropdown);
        });
      }

      if (options.headerContextMenu) {
        const headerContextMenu = options.headerContextMenu;
        this.measurePhase("headerContextMenu", () => {
          this.renderHeaderContextMenu(headerContextMenu);
        });
      }

      if (options.columnReorderState) {
        const columnReorderState = options.columnReorderState;
        this.measurePhase("columnReorderIndicator", () => {
          this.renderColumnReorderIndicator(columnReorderState, rows, visibleRange, scrollTop);
        });
      }

      this.ctx.restore();
      rootStateSaved = false;

      // 提交当前帧可见图片集合，取消不可见图片的加载请求
      this.measurePhase("imageCommit", () => {
        this.commitVisibleImages();
      });

      this.dirtyRegions = [];
    } finally {
      if (centerClipStateSaved) {
        this.ctx.restore();
      }
      if (rootStateSaved) {
        this.ctx.restore();
      }
      // 结束性能监控帧
      this.endFrame(visibleRange, scrollTop, scrollLeft, columns);
    }
  }

  private shouldRenderRowBands(): boolean {
    const rowBands = this.layoutManager.getRowBandsForRender();
    return (
      this.layoutManager.hasPinnedRows() ||
      rowBands.summaryTop.rows.length > 0 ||
      rowBands.summaryBottom.rows.length > 0
    );
  }

  private renderRowBandCells(
    band: RowBand,
    allRows: Row[],
    columnIndices: number[],
    scrollLeft: number,
    scrollTop: number,
    visibleRange: VisibleRange,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
    },
    startX?: number,
    detailPrefix?: string,
  ): void {
    let y = band.y;
    if (band.type === "body") {
      y -= scrollTop;
    }

    const startIndex = band.type === "body" ? visibleRange.startRow : 0;
    const endIndex =
      band.type === "body"
        ? Math.min(visibleRange.endRow, band.rows.length - 1)
        : band.rows.length - 1;
    const measureDetail = <T>(name: string, fn: () => T): T =>
      detailPrefix ? this.measureRowBandDetail(`${detailPrefix}.${name}`, fn) : fn();
    const countDetail = (name: string): void => {
      if (detailPrefix) {
        this.recordRowBandDetail(`${detailPrefix}.${name}`, 0);
      }
    };

    for (let bandRowIndex = startIndex; bandRowIndex <= endIndex; bandRowIndex++) {
      const row = band.rows[bandRowIndex];
      if (!row) {
        continue;
      }

      countDetail("rows.visited");
      const rowIndex = measureDetail("rowIndexLookup", () =>
        this.layoutManager.getRowIndexByRef(row),
      );
      if (rowIndex < 0) {
        continue;
      }

      const rowHeight = measureDetail("rowHeightLookup", () =>
        this.layoutManager.getRowHeightByIndex(rowIndex),
      );
      if (band.type === "body") {
        const rowOffset = measureDetail("rowOffsetLookup", () =>
          this.layoutManager.getRowBandOffsetByRef(row),
        );
        y = band.y - scrollTop + (rowOffset ?? 0);
      }
      const viewportHeight = this.canvas.height / this.dpr;
      if (y + rowHeight < 0 || y > viewportHeight) {
        y += rowHeight;
        continue;
      }

      let backgroundColor = this.theme.colors.rowBackground;
      if (options.stripeRows && rowIndex % 2 === 1) {
        backgroundColor = this.theme.colors.rowAltBackground;
      }
      if (row.selected) {
        backgroundColor = this.theme.colors.rowSelectedBackground;
      }
      if (options.hoveredCell?.rowIndex === rowIndex) {
        backgroundColor = this.theme.colors.rowHoverBackground;
      }

      for (const colIndex of columnIndices) {
        countDetail("cells.visited");
        const column = measureDetail("columnLookup", () =>
          this.layoutManager.getLeafColumn(colIndex),
        );
        if (!column) continue;

        const width = measureDetail("columnWidthLookup", () =>
          this.layoutManager.getColumnWidthByIndex(colIndex),
        );
        const x = measureDetail("columnOffsetLookup", () =>
          startX !== undefined
            ? startX +
              this.layoutManager.getColumnOffset(colIndex) -
              this.layoutManager.getColumnOffset(columnIndices[0]!)
            : this.layoutManager.getColumnOffset(colIndex) - scrollLeft,
        );

        measureDetail("backgroundFill", () => {
          this.ctx.fillStyle = backgroundColor;
          this.ctx.fillRect(x, y, width, rowHeight);
        });
        const cellTrace = detailPrefix
          ? {
              prefix: `${detailPrefix}.cellInternal`,
              location: { rowIndex, colIndex, x, y, width, height: rowHeight },
              columnKey: column.key,
            }
          : undefined;
        measureDetail("cellWithPosition", () => {
          this.renderCellWithPosition(
            column,
            row,
            rowIndex,
            colIndex,
            row.data[getColumnField(column)],
            x,
            y,
            width,
            rowHeight,
            options,
            cellTrace,
          );
        });
      }

      y += rowHeight;
    }
  }

  private renderRowBands(
    rows: Row[],
    centerColumnIndices: number[],
    leftFixedIndices: number[],
    rightFixedIndices: number[],
    scrollLeft: number,
    scrollTop: number,
    visibleRange: VisibleRange,
    fixedInfo: ReturnType<LayoutManager["getFixedColumnsInfo"]>,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
    },
    detailRoot: "rowBands" | "rowBandsFixed",
  ): void {
    const rowBands = this.measureRowBandDetail(`${detailRoot}.getBands`, () =>
      this.layoutManager.getRowBandsForRender(),
    );
    const pinnedBands = [rowBands.pinnedTop, rowBands.pinnedBottom];
    const summaryBands = [rowBands.summaryTop, rowBands.summaryBottom];

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(
      0,
      rowBands.body.y,
      this.canvas.width / this.dpr,
      this.layoutManager.getBodyViewportHeight(),
    );
    this.ctx.clip();
    this.renderRowBandCells(
      rowBands.body,
      rows,
      centerColumnIndices,
      scrollLeft,
      scrollTop,
      visibleRange,
      options,
      undefined,
      `${detailRoot}.center.body`,
    );
    this.ctx.restore();

    for (const band of pinnedBands) {
      this.renderRowBandCells(
        band,
        rows,
        centerColumnIndices,
        scrollLeft,
        scrollTop,
        visibleRange,
        options,
        undefined,
        `${detailRoot}.center.${band.type}`,
      );
    }
    for (const band of summaryBands) {
      this.measureRowBandDetail(`${detailRoot}.center.${band.type}.summaryCells`, () => {
        this.renderSummaryBandCells(band, centerColumnIndices, scrollLeft);
      });
    }

    if (leftFixedIndices.length > 0) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(
        0,
        rowBands.body.y,
        this.canvas.width / this.dpr,
        this.layoutManager.getBodyViewportHeight(),
      );
      this.ctx.clip();
      this.renderRowBandCells(
        rowBands.body,
        rows,
        leftFixedIndices,
        scrollLeft,
        scrollTop,
        visibleRange,
        options,
        0,
        `${detailRoot}.leftFixed.body`,
      );
      this.ctx.restore();

      for (const band of pinnedBands) {
        this.renderRowBandCells(
          band,
          rows,
          leftFixedIndices,
          scrollLeft,
          scrollTop,
          visibleRange,
          options,
          0,
          `${detailRoot}.leftFixed.${band.type}`,
        );
      }
      for (const band of summaryBands) {
        this.measureRowBandDetail(`${detailRoot}.leftFixed.${band.type}.summaryCells`, () => {
          this.renderSummaryBandCells(band, leftFixedIndices, scrollLeft, 0);
        });
      }
    }

    if (rightFixedIndices.length > 0) {
      const viewportWidth = this.canvas.width / this.dpr;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(
        0,
        rowBands.body.y,
        this.canvas.width / this.dpr,
        this.layoutManager.getBodyViewportHeight(),
      );
      this.ctx.clip();
      this.renderRowBandCells(
        rowBands.body,
        rows,
        rightFixedIndices,
        scrollLeft,
        scrollTop,
        visibleRange,
        options,
        viewportWidth - fixedInfo.rightFixed.width,
        `${detailRoot}.rightFixed.body`,
      );
      this.ctx.restore();

      for (const band of pinnedBands) {
        this.renderRowBandCells(
          band,
          rows,
          rightFixedIndices,
          scrollLeft,
          scrollTop,
          visibleRange,
          options,
          viewportWidth - fixedInfo.rightFixed.width,
          `${detailRoot}.rightFixed.${band.type}`,
        );
      }
      for (const band of summaryBands) {
        this.measureRowBandDetail(`${detailRoot}.rightFixed.${band.type}.summaryCells`, () => {
          this.renderSummaryBandCells(
            band,
            rightFixedIndices,
            scrollLeft,
            viewportWidth - fixedInfo.rightFixed.width,
          );
        });
      }
    }
  }

  private renderSummaryBandCells(
    band: RowBand<ComputedSummaryRow>,
    columnIndices: number[],
    scrollLeft: number,
    startX?: number,
  ): void {
    if (band.rows.length === 0 || columnIndices.length === 0) return;

    let y = band.y;
    const visibleColumns = new Set(columnIndices);

    for (const row of band.rows) {
      const rowHeight = row.height;
      for (const columnIndex of columnIndices) {
        const x = this.getSummaryColumnX(columnIndex, columnIndices, scrollLeft, startX);
        const width = this.layoutManager.getColumnWidthByIndex(columnIndex);

        this.ctx.fillStyle = this.theme.colors.headerBackground;
        this.ctx.fillRect(x, y, width, rowHeight);
        this.ctx.strokeStyle = this.theme.colors.cellBorder;
        this.ctx.lineWidth = this.theme.border.width;
        this.ctx.strokeRect(x, y, width, rowHeight);
      }

      for (const cell of row.cells) {
        const segments = this.getSummaryCellSegments(cell, visibleColumns);
        if (segments.length === 0) {
          continue;
        }

        const column = this.layoutManager.getLeafColumn(cell.startColumnIndex);
        if (!column) continue;

        for (const segment of segments) {
          const x = this.getSummaryColumnX(segment.start, columnIndices, scrollLeft, startX);
          const endOffset =
            this.layoutManager.getColumnOffset(segment.end) +
            this.layoutManager.getColumnWidthByIndex(segment.end);
          const width = endOffset - this.layoutManager.getColumnOffset(segment.start);

          this.ctx.fillStyle =
            cell.renderResult.style?.backgroundColor ?? this.theme.colors.headerBackground;
          this.ctx.fillRect(x, y, width, rowHeight);

          if (segment.start <= cell.startColumnIndex && cell.startColumnIndex <= segment.end) {
            this.renderCellContent(
              cell.renderResult,
              x,
              y,
              width,
              rowHeight,
              8,
              column.align,
              -1,
              cell.startColumnIndex,
              false,
              column.key,
            );
          }

          this.ctx.strokeStyle =
            cell.renderResult.style?.borderColor ?? this.theme.colors.cellBorder;
          this.ctx.lineWidth = cell.renderResult.style?.borderWidth ?? this.theme.border.width;
          this.ctx.strokeRect(x, y, width, rowHeight);
        }
      }
      y += rowHeight;
    }
  }

  private getSummaryColumnX(
    columnIndex: number,
    columnIndices: number[],
    scrollLeft: number,
    startX?: number,
  ): number {
    const columnOffset = this.layoutManager.getColumnOffset(columnIndex);

    if (startX !== undefined) {
      return startX + columnOffset - this.layoutManager.getColumnOffset(columnIndices[0]!);
    }

    return columnOffset - scrollLeft;
  }

  private getSummaryCellSegments(
    cell: ComputedSummaryRow["cells"][number],
    visibleColumns: Set<number>,
  ): Array<{ start: number; end: number }> {
    const segments: Array<{ start: number; end: number }> = [];
    let segmentStart: number | null = null;
    let previousIndex: number | null = null;

    for (let index = cell.startColumnIndex; index <= cell.endColumnIndex; index++) {
      if (!visibleColumns.has(index)) {
        if (segmentStart !== null && previousIndex !== null) {
          segments.push({ start: segmentStart, end: previousIndex });
          segmentStart = null;
          previousIndex = null;
        }
        continue;
      }

      if (segmentStart === null) {
        segmentStart = index;
      } else if (previousIndex !== null && index !== previousIndex + 1) {
        segments.push({ start: segmentStart, end: previousIndex });
        segmentStart = index;
      }

      previousIndex = index;
    }

    if (segmentStart !== null && previousIndex !== null) {
      segments.push({ start: segmentStart, end: previousIndex });
    }

    return segments;
  }

  private renderCenterHeader(
    _columns: Column[],
    centerColumnIndices: number[],
    _scrollTop: number,
    sortConfig: SortConfig[],
    filterConfig: FilterConfig[],
    scrollLeft: number,
    hoveredHeaderColumnKey?: string,
    _dragColumnIndex?: number,
    _columnReorderState?: {
      dragColumnIndex: number;
      dragColumnKey: string;
      dragStartX: number;
      currentX: number;
      targetColumnIndex: number;
      isParentColumn?: boolean;
    },
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const visibleHeaderCells = this.layoutManager.getVisibleHeaderCells();

    let headerX = 0;
    let headerWidth = 0;
    for (const colIndex of centerColumnIndices) {
      const col = this.layoutManager.getLeafColumn(colIndex);
      if (!col) continue;
      const colOffset = this.layoutManager.getColumnOffset(colIndex);
      const colWidth = this.layoutManager.getColumnWidthByIndex(colIndex);
      if (headerWidth === 0) {
        headerX = colOffset - scrollLeft;
      }
      headerWidth += colWidth;
    }

    this.ctx.save();

    if (headerWidth > 0) {
      this.ctx.fillStyle = this.theme.colors.headerBackground;
      this.ctx.fillRect(headerX, 0, headerWidth, headerHeight);

      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.beginPath();
      this.ctx.moveTo(headerX, headerHeight);
      this.ctx.lineTo(headerX + headerWidth, headerHeight);
      this.ctx.stroke();
    }

    for (const headerCell of visibleHeaderCells) {
      if (headerCell.column.fixed === "left" || headerCell.column.fixed === "right") {
        continue;
      }

      const leafColumns = this.layoutManager.getLeafColumns();
      // 使用对象引用比较
      const columnIndex = leafColumns.findIndex((col) => col === headerCell.column);

      const reorderedIndex = centerColumnIndices.indexOf(columnIndex);
      let cellX = headerCell.x - scrollLeft;

      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== undefined) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]!);
        cellX = firstColOffset - scrollLeft + newOffset;
      }

      const isHovered = headerCell.column.key === hoveredHeaderColumnKey;

      this.renderHeaderCellMultiLevel(
        headerCell.column,
        cellX,
        headerCell.y,
        headerCell.width,
        headerCell.height,
        headerCell.colspan,
        headerCell.rowspan,
        sortConfig,
        filterConfig,
        isHovered,
        false,
        columnIndex,
      );
    }

    this.ctx.restore();
  }

  private renderHeaderCellMultiLevel(
    column: Column,
    x: number,
    y: number,
    width: number,
    height: number,
    _colspan: number,
    _rowspan: number,
    sortConfig: SortConfig[],
    filterConfig: FilterConfig[],
    isHovered: boolean = false,
    _isDragHandleHovered: boolean = false,
    columnIndex: number = -1,
  ): void {
    // 检查是否是隐藏占位列
    if (column.key.startsWith("__hidden_placeholder__")) {
      // 检查整列是否悬浮
      const isColumnHovered = this.hoveredPlaceholderColumnIndex === columnIndex;

      // 绘制背景 - 悬浮时高亮
      this.ctx.fillStyle = isColumnHovered
        ? this.theme.colors.hiddenPlaceholder.hoverBg
        : this.theme.colors.headerBackground;
      this.ctx.fillRect(x, y, width, height);
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.strokeRect(x, y, width, height);
      return;
    }

    const padding = 8;
    // 检查列是否允许拖拽排序（默认允许，除非明确设置 reorderable: false）
    const isReorderable = column.reorderable !== false;
    const showDragHandle = isReorderable && isHovered;
    const dragHandleWidth = showDragHandle ? 10 : 0;

    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(x, y, width, height);

    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";

    const sortInfo = sortConfig.find((s) => s.column === column.key);
    const sortDirection = sortInfo?.direction ?? "none";
    const isSortable = column.sortable !== false;
    // 只有叶子节点才显示排序指示器
    const showSortIndicator =
      !column.children?.length && isSortable && (sortDirection !== "none" || isHovered);
    const sortIndicatorWidth = showSortIndicator ? 20 : 0;

    const hasFilter = filterConfig.some((f) => f.column === column.key);
    // 只有叶子节点才显示筛选指示器
    const showFilterIndicator =
      !column.children?.length && column.filterable && (hasFilter || isHovered);
    const filterIndicatorWidth = showFilterIndicator ? 20 : 0;

    const maxTextWidth =
      width -
      padding * 2 -
      sortIndicatorWidth -
      filterIndicatorWidth -
      dragHandleWidth -
      (showDragHandle ? 4 : 0);
    const text = truncateText(column.title, Math.floor(maxTextWidth / 7));

    const align: HorizontalAlign = column.align ?? "center";
    let textX = x + padding + dragHandleWidth + (showDragHandle ? 4 : 0);

    if (align === "center") {
      textX =
        x +
        (width - this.ctx.measureText(text).width - sortIndicatorWidth - filterIndicatorWidth) / 2;
      if (showDragHandle) {
        textX = Math.max(textX, x + padding + dragHandleWidth + 4);
      }
    } else if (align === "right") {
      textX =
        x +
        width -
        padding -
        this.ctx.measureText(text).width -
        sortIndicatorWidth -
        filterIndicatorWidth;
    }

    const textY = y + height / 2;
    this.ctx.fillText(text, textX, textY);

    if (showDragHandle) {
      this.renderDragHandle(x + padding, y + height / 2);
    }

    if (showFilterIndicator) {
      const filterX = x + width - padding - 10;
      if (showSortIndicator) {
        this.renderSortIndicator(
          filterX - 16,
          textY,
          sortDirection === "none" ? "hover" : sortDirection,
        );
      }
      this.renderFilterIndicator(filterX, textY, hasFilter);
    } else if (showSortIndicator) {
      this.renderSortIndicator(
        x + width - padding - 10,
        textY,
        sortDirection === "none" ? "hover" : sortDirection,
      );
    }

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(x, y, width, height);
  }

  private renderCenterRows(
    columns: Column[],
    rows: Row[],
    startRow: number,
    endRow: number,
    centerColumnIndices: number[],
    scrollLeft: number,
    scrollTop: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
      dragColumnIndex?: number;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
    },
  ): void {
    const renderedMerges = new Set<string>();
    const activeRowIndex = this.currentRowResizeState?.rowIndex;

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (rowIndex === activeRowIndex) {
        continue;
      }

      const row = rows[rowIndex];
      if (!row) continue;

      this.renderCenterRow(
        columns,
        rows,
        row,
        rowIndex,
        centerColumnIndices,
        scrollLeft,
        scrollTop,
        options,
        renderedMerges,
      );
    }

    const activeRow =
      activeRowIndex !== undefined && activeRowIndex >= startRow && activeRowIndex <= endRow
        ? rows[activeRowIndex]
        : undefined;

    if (activeRowIndex !== undefined && activeRow) {
      this.renderCenterRow(
        columns,
        rows,
        activeRow,
        activeRowIndex,
        centerColumnIndices,
        scrollLeft,
        scrollTop,
        options,
        new Set(),
      );
    }
  }

  private renderCenterRow(
    columns: Column[],
    rows: Row[],
    row: Row,
    rowIndex: number,
    centerColumnIndices: number[],
    scrollLeft: number,
    scrollTop: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
      dragColumnIndex?: number;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
    },
    renderedMerges: Set<string>,
  ): void {
    const absRowY = this.layoutManager.getRowOffset(rowIndex);
    const rowHeight = this.getRenderedRowHeight(rowIndex);
    const rowY = absRowY - scrollTop;
    const leafColumns = this.layoutManager.getLeafColumns();

    let backgroundColor = this.theme.colors.rowBackground;

    if (options.stripeRows && rowIndex % 2 === 1) {
      backgroundColor = this.theme.colors.rowAltBackground;
    }

    if (row.selected) {
      backgroundColor = this.theme.colors.rowSelectedBackground;
    }

    const isHoveredRow = options.hoveredCell?.rowIndex === rowIndex;
    if (isHoveredRow) {
      backgroundColor = this.theme.colors.rowHoverBackground;
    }

    for (const colIndex of centerColumnIndices) {
      if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
        continue;
      }

      const column = leafColumns[colIndex];
      if (!column) continue;

      const reorderedIndex = centerColumnIndices.indexOf(colIndex);
      let x: number;

      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== undefined) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]!);
        x = firstColOffset - scrollLeft + newOffset;
      } else {
        const absX = this.layoutManager.getColumnOffset(colIndex);
        x = absX - scrollLeft;
      }

      const width = this.layoutManager.getColumnWidthByIndex(colIndex);

      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(x, rowY, width, rowHeight);
    }

    const affectingMerges = this.layoutManager.getMergesAffectingRow(rowIndex);
    for (const merge of affectingMerges) {
      if (!centerColumnIndices.includes(merge.columnIndex)) continue;

      const mergeKey = `${merge.rowIndex}-${merge.columnIndex}`;
      if (renderedMerges.has(mergeKey)) continue;

      const startRow = rows[merge.rowIndex];
      if (!startRow) continue;

      const mergedPos = this.layoutManager.getMergedCellPosition(merge.rowIndex, merge.columnIndex);
      if (!mergedPos) continue;

      const column = leafColumns[merge.columnIndex];
      if (!column) continue;

      const value = startRow.data[getColumnField(column)];

      const mergeContainsHoveredRow =
        options.hoveredCell?.rowIndex !== undefined &&
        options.hoveredCell.rowIndex >= merge.rowIndex &&
        options.hoveredCell.rowIndex < merge.rowIndex + merge.rowspan;

      const mergeBackgroundColor = mergeContainsHoveredRow
        ? this.theme.colors.rowHoverBackground
        : backgroundColor;

      const mergeX = mergedPos.x - scrollLeft;
      const mergeY = mergedPos.y - scrollTop;

      this.ctx.fillStyle = mergeBackgroundColor;
      this.ctx.fillRect(mergeX, mergeY, mergedPos.width, mergedPos.height);

      this.renderCellWithPosition(
        column,
        startRow,
        merge.rowIndex,
        merge.columnIndex,
        value,
        mergeX,
        mergeY,
        mergedPos.width,
        mergedPos.height,
        options,
      );

      renderedMerges.add(mergeKey);
    }

    for (const colIndex of centerColumnIndices) {
      const column = leafColumns[colIndex];
      if (!column) continue;

      if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
        continue;
      }

      const merge = this.layoutManager.getCellMerge(rowIndex, colIndex);
      if (merge) {
        continue;
      }

      const value = row.data[getColumnField(column)];

      const reorderedIndex = centerColumnIndices.indexOf(colIndex);
      let x: number;

      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== undefined) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]!);
        x = firstColOffset - scrollLeft + newOffset;
      } else {
        const absX = this.layoutManager.getColumnOffset(colIndex);
        x = absX - scrollLeft;
      }

      const width = this.layoutManager.getColumnWidthByIndex(colIndex);
      const absY = this.layoutManager.getRowOffset(rowIndex);
      const y = absY - scrollTop;
      const height = this.getRenderedRowHeight(rowIndex);

      this.renderCellWithPosition(
        column,
        row,
        rowIndex,
        colIndex,
        value,
        x,
        y,
        width,
        height,
        options,
      );
    }
  }

  private renderFixedColumnsContent(
    columns: Column[],
    rows: Row[],
    fixedColumnIndices: number[],
    startX: number,
    scrollTop: number,
    visibleRange: VisibleRange,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
    },
  ): void {
    const viewportHeight = this.canvas.height / this.dpr;

    this.ctx.save();

    let _totalFixedWidth = 0;
    for (const colIndex of fixedColumnIndices) {
      _totalFixedWidth += this.layoutManager.getColumnWidthByIndex(colIndex);
    }

    const renderedMerges = new Set<string>();
    const activeRowIndex = this.currentRowResizeState?.rowIndex;

    const startRow = Math.max(0, visibleRange.startRow);
    const endRow = Math.min(rows.length - 1, visibleRange.endRow);

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (rowIndex === activeRowIndex) {
        continue;
      }

      const row = rows[rowIndex];
      if (!row) continue;

      const absRowY = this.layoutManager.getRowOffset(rowIndex);
      const rowHeight = this.getRenderedRowHeight(rowIndex);
      const rowY = absRowY - scrollTop;

      if (absRowY + rowHeight < scrollTop || absRowY > scrollTop + viewportHeight) {
        continue;
      }

      let backgroundColor = this.theme.colors.rowBackground;

      if (options.stripeRows && rowIndex % 2 === 1) {
        backgroundColor = this.theme.colors.rowAltBackground;
      }

      if (row.selected) {
        backgroundColor = this.theme.colors.rowSelectedBackground;
      }

      const isHoveredRow = options.hoveredCell?.rowIndex === rowIndex;
      if (isHoveredRow) {
        backgroundColor = this.theme.colors.rowHoverBackground;
      }

      for (const colIndex of fixedColumnIndices) {
        if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
          continue;
        }

        const colWidth = this.layoutManager.getColumnWidthByIndex(colIndex);
        const colX =
          startX +
          this.layoutManager.getColumnOffset(colIndex) -
          this.layoutManager.getColumnOffset(fixedColumnIndices[0]!);

        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(colX, rowY, colWidth, rowHeight);
      }

      const affectingMerges = this.layoutManager.getMergesAffectingRow(rowIndex);
      const leafColumns = this.layoutManager.getLeafColumns();
      for (const merge of affectingMerges) {
        if (!fixedColumnIndices.includes(merge.columnIndex)) continue;

        const mergeKey = `${merge.rowIndex}-${merge.columnIndex}`;
        if (renderedMerges.has(mergeKey)) continue;

        const startRow = rows[merge.rowIndex];
        if (!startRow) continue;

        const mergedPos = this.layoutManager.getMergedCellPosition(
          merge.rowIndex,
          merge.columnIndex,
        );
        if (!mergedPos) continue;

        const column = leafColumns[merge.columnIndex];
        if (!column) continue;

        const value = startRow.data[getColumnField(column)];

        let mergedWidth = 0;
        const mergedStartX =
          startX +
          this.layoutManager.getColumnOffset(merge.columnIndex) -
          this.layoutManager.getColumnOffset(fixedColumnIndices[0]!);
        for (let i = 0; i < merge.colspan; i++) {
          const mergedColIndex = merge.columnIndex + i;
          if (fixedColumnIndices.includes(mergedColIndex)) {
            mergedWidth += this.layoutManager.getColumnWidthByIndex(mergedColIndex);
          }
        }

        const mergeContainsHoveredRow =
          options.hoveredCell?.rowIndex !== undefined &&
          options.hoveredCell.rowIndex >= merge.rowIndex &&
          options.hoveredCell.rowIndex < merge.rowIndex + merge.rowspan;

        const mergeBackgroundColor = mergeContainsHoveredRow
          ? this.theme.colors.rowHoverBackground
          : backgroundColor;

        const mergeY = mergedPos.y - scrollTop;

        this.ctx.fillStyle = mergeBackgroundColor;
        this.ctx.fillRect(mergedStartX, mergeY, mergedWidth, mergedPos.height);

        this.renderCellWithPosition(
          column,
          startRow,
          merge.rowIndex,
          merge.columnIndex,
          value,
          mergedStartX,
          mergeY,
          mergedWidth,
          mergedPos.height,
          options,
        );

        renderedMerges.add(mergeKey);
      }

      let currentX = startX;
      for (const colIndex of fixedColumnIndices) {
        const column = leafColumns[colIndex];
        if (!column) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }

        if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }

        const merge = this.layoutManager.getCellMerge(rowIndex, colIndex);
        if (merge) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }

        const width = this.layoutManager.getColumnWidthByIndex(colIndex);
        const value = row.data[getColumnField(column)];

        this.renderCellWithPosition(
          column,
          row,
          rowIndex,
          colIndex,
          value,
          currentX,
          rowY,
          width,
          rowHeight,
          options,
        );
        currentX += width;
      }
    }

    const activeRow = activeRowIndex !== undefined ? rows[activeRowIndex] : undefined;
    if (activeRowIndex !== undefined && activeRow) {
      this.renderFixedRowOverlay(
        columns,
        activeRow,
        activeRowIndex,
        fixedColumnIndices,
        startX,
        scrollTop,
        options,
      );
    }

    this.ctx.restore();
  }

  private renderFixedRowOverlay(
    columns: Column[],
    row: Row,
    rowIndex: number,
    fixedColumnIndices: number[],
    startX: number,
    scrollTop: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
    },
  ): void {
    const absRowY = this.layoutManager.getRowOffset(rowIndex);
    const rowHeight = this.getRenderedRowHeight(rowIndex);
    const rowY = absRowY - scrollTop;
    const viewportHeight = this.canvas.height / this.dpr;
    const leafColumns = this.layoutManager.getLeafColumns();

    if (absRowY + rowHeight < scrollTop || absRowY > scrollTop + viewportHeight) {
      return;
    }

    let backgroundColor = this.theme.colors.rowBackground;

    if (options.stripeRows && rowIndex % 2 === 1) {
      backgroundColor = this.theme.colors.rowAltBackground;
    }

    if (row.selected) {
      backgroundColor = this.theme.colors.rowSelectedBackground;
    }

    if (options.hoveredCell?.rowIndex === rowIndex) {
      backgroundColor = this.theme.colors.rowHoverBackground;
    }

    let currentX = startX;
    for (const colIndex of fixedColumnIndices) {
      const width = this.layoutManager.getColumnWidthByIndex(colIndex);
      const column = leafColumns[colIndex];

      if (!column) {
        currentX += width;
        continue;
      }

      if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
        currentX += width;
        continue;
      }

      const merge = this.layoutManager.getCellMerge(rowIndex, colIndex);
      if (merge && (merge.rowIndex !== rowIndex || merge.columnIndex !== colIndex)) {
        currentX += width;
        continue;
      }

      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(currentX, rowY, width, rowHeight);

      const value = row.data[getColumnField(column)];
      this.renderCellWithPosition(
        column,
        row,
        rowIndex,
        colIndex,
        value,
        currentX,
        rowY,
        width,
        rowHeight,
        options,
      );

      currentX += width;
    }
  }

  private renderFixedColumnsHeader(
    _columns: Column[],
    fixedColumnIndices: number[],
    startX: number,
    sortConfig: SortConfig[],
    filterConfig: FilterConfig[],
    hoveredHeaderColumnKey?: string,
    _columnReorderState?: {
      dragColumnIndex: number;
      dragColumnKey: string;
      dragStartX: number;
      currentX: number;
      targetColumnIndex: number;
      isParentColumn?: boolean;
    },
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const headerCells = this.layoutManager.getHeaderCells();

    this.ctx.save();

    let _totalFixedWidth = 0;
    for (const colIndex of fixedColumnIndices) {
      _totalFixedWidth += this.layoutManager.getColumnWidthByIndex(colIndex);
    }

    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(startX, 0, _totalFixedWidth, headerHeight);

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, headerHeight);
    this.ctx.lineTo(startX + _totalFixedWidth, headerHeight);
    this.ctx.stroke();

    const isRightFixed =
      fixedColumnIndices.length > 0 &&
      this.layoutManager.getLeafColumn(fixedColumnIndices[0]!)?.fixed === "right";

    const offsetX = isRightFixed ? startX - (layoutInfo.totalWidth - _totalFixedWidth) : 0;

    for (const headerCell of headerCells) {
      if (!headerCell.isLeaf) continue;

      if (!fixedColumnIndices.includes(headerCell.colIndex)) continue;

      const isHovered = headerCell.column.key === hoveredHeaderColumnKey;

      this.renderHeaderCellMultiLevel(
        headerCell.column,
        headerCell.x + offsetX,
        headerCell.y,
        headerCell.width,
        headerCell.height,
        headerCell.colspan,
        headerCell.rowspan,
        sortConfig,
        filterConfig,
        isHovered,
        false,
        headerCell.colIndex,
      );
    }

    this.ctx.restore();
  }

  private renderHeader(
    columns: Column[],
    startColumn: number,
    endColumn: number,
    scrollTop: number,
    sortConfig: SortConfig[],
    _scrollLeft: number,
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const leafColumns = this.layoutManager.getLeafColumns();

    this.ctx.save();
    this.ctx.translate(0, scrollTop);

    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(0, 0, layoutInfo.totalWidth, headerHeight);

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerHeight);
    this.ctx.lineTo(layoutInfo.totalWidth, headerHeight);
    this.ctx.stroke();

    for (let colIndex = startColumn; colIndex <= endColumn; colIndex++) {
      const column = leafColumns[colIndex];
      if (!column) continue;

      const { x, width } = this.layoutManager.getCellPosition(0, colIndex);

      this.renderHeaderCell(column, x, 0, width, headerHeight, colIndex, sortConfig);
    }

    this.ctx.restore();
  }

  private renderHeaderCell(
    column: Column,
    x: number,
    y: number,
    width: number,
    height: number,
    columnIndex: number,
    sortConfig: SortConfig[],
  ): void {
    // 检查是否是隐藏占位列
    if (column.key.startsWith("__hidden_placeholder__")) {
      // 检查整列是否悬浮
      const isColumnHovered = this.hoveredPlaceholderColumnIndex === columnIndex;

      // 绘制占位列表头背景 - 悬浮时高亮
      this.ctx.fillStyle = isColumnHovered
        ? this.theme.colors.hiddenPlaceholder.hoverBg
        : this.theme.colors.headerBackground;
      this.ctx.fillRect(x, y, width, height);

      // 绘制边框
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.strokeRect(x, y, width, height);
      return;
    }

    const padding = 8;
    // 右侧固定列不显示 drag handle（它们使用 renderHeaderCellMultiLevel）
    const showDragHandle = false;
    const dragHandleWidth = 0;

    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";

    const sortInfo = sortConfig.find((s) => s.column === column.key);
    const sortDirection = sortInfo?.direction ?? "none";
    const sortIndicatorWidth = sortDirection !== "none" ? 20 : 0;

    const maxTextWidth =
      width - padding * 2 - sortIndicatorWidth - dragHandleWidth - (showDragHandle ? 4 : 0);
    const text = truncateText(column.title, Math.floor(maxTextWidth / 7));

    const align: HorizontalAlign = column.align ?? "left";
    let textX = x + padding + dragHandleWidth + (showDragHandle ? 4 : 0);

    if (align === "center") {
      textX = x + (width - this.ctx.measureText(text).width - sortIndicatorWidth) / 2;
      if (showDragHandle) {
        textX = Math.max(textX, x + padding + dragHandleWidth + 4);
      }
    } else if (align === "right") {
      textX = x + width - padding - this.ctx.measureText(text).width - sortIndicatorWidth;
    }

    this.ctx.fillText(text, textX, y + height / 2);

    if (sortDirection !== "none") {
      this.renderSortIndicator(x + width - padding - 10, y + height / 2, sortDirection);
    }

    if (showDragHandle) {
      this.renderDragHandle(x + padding, y + height / 2);
    }

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(x, y, width, height);
  }

  private renderDragHandle(x: number, y: number): void {
    const dotRadius = 1;
    const dotGapX = 5;
    const dotGapY = 4;
    const cols = 2;
    const rows = 3;

    const totalHeight = (rows - 1) * dotGapY;

    const startX = x;
    const startY = y - totalHeight / 2;

    this.ctx.fillStyle = this.theme.colors.indicator.inactive;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dotX = startX + col * dotGapX;
        const dotY = startY + row * dotGapY;

        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private renderSortIndicator(x: number, y: number, direction: SortDirection | "hover"): void {
    const arrowWidth = 8;
    const arrowHeight = 5;
    const gap = 2;

    const activeColor = this.theme.colors.indicator.active;
    const inactiveColor = this.theme.colors.indicator.inactive;

    this.ctx.beginPath();
    this.ctx.moveTo(x - arrowWidth / 2, y - gap);
    this.ctx.lineTo(x + arrowWidth / 2, y - gap);
    this.ctx.lineTo(x, y - gap - arrowHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = direction === "asc" ? activeColor : inactiveColor;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x - arrowWidth / 2, y + gap);
    this.ctx.lineTo(x + arrowWidth / 2, y + gap);
    this.ctx.lineTo(x, y + gap + arrowHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = direction === "desc" ? activeColor : inactiveColor;
    this.ctx.fill();
  }

  private renderFilterIndicator(x: number, y: number, hasFilter: boolean): void {
    const size = 10;
    const activeColor = this.theme.colors.indicator.active;
    const inactiveColor = this.theme.colors.indicator.inactive;

    this.ctx.fillStyle = hasFilter ? activeColor : inactiveColor;
    this.ctx.beginPath();

    this.ctx.moveTo(x - size / 2, y - size / 2);
    this.ctx.lineTo(x + size / 2, y - size / 2);
    this.ctx.lineTo(x, y);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillRect(x - 1, y, 2, size / 2);
  }

  private renderRows(
    columns: Column[],
    rows: Row[],
    startRow: number,
    endRow: number,
    startColumn: number,
    endColumn: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
    },
  ): void {
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;

      this.renderRow(columns, row, rowIndex, startColumn, endColumn, options);
    }
  }

  private renderRow(
    columns: Column[],
    row: Row,
    rowIndex: number,
    startColumn: number,
    endColumn: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
    },
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const { x: rowX, y: rowY, height: rowHeight } = this.layoutManager.getCellPosition(rowIndex, 0);
    const rowWidth = layoutInfo.totalWidth;

    let backgroundColor = this.theme.colors.rowBackground;

    if (options.stripeRows && rowIndex % 2 === 1) {
      backgroundColor = this.theme.colors.rowAltBackground;
    }

    if (row.selected) {
      backgroundColor = this.theme.colors.rowSelectedBackground;
    }

    if (options.hoveredCell?.rowIndex === rowIndex) {
      backgroundColor = this.theme.colors.rowHoverBackground;
    }

    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(rowX, rowY, rowWidth, rowHeight);

    for (let colIndex = startColumn; colIndex <= endColumn; colIndex++) {
      const column = columns[colIndex];
      if (!column) continue;

      const value = row.data[getColumnField(column)];

      this.renderCell(column, row, rowIndex, colIndex, value, options);
    }
  }

  private renderCell(
    column: Column,
    row: Row,
    rowIndex: number,
    colIndex: number,
    value: unknown,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
    },
  ): void {
    const { x, y, width, height } = this.layoutManager.getCellPosition(rowIndex, colIndex);
    this.renderCellInternal(column, row, rowIndex, colIndex, value, x, y, width, height, options);
  }

  private renderCellWithPosition(
    column: Column,
    row: Row,
    rowIndex: number,
    colIndex: number,
    value: unknown,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
    },
    rowBandTrace?: RowBandCellTrace,
  ): void {
    this.renderCellInternal(
      column,
      row,
      rowIndex,
      colIndex,
      value,
      x,
      y,
      width,
      height,
      options,
      rowBandTrace,
    );
  }

  private renderCellInternal(
    column: Column,
    row: Row,
    rowIndex: number,
    colIndex: number,
    value: unknown,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
    },
    rowBandTrace?: RowBandCellTrace,
  ): void {
    const padding = 8;
    const measureCell = <T>(name: string, fn: () => T): T =>
      this.measureRowBandCellDetail(rowBandTrace, name, fn);

    if (column.key.startsWith("__hidden_placeholder__")) {
      measureCell("hiddenPlaceholder", () => {
        const isColumnHovered = this.hoveredPlaceholderColumnIndex === colIndex;
        this.ctx.fillStyle = isColumnHovered
          ? this.theme.colors.hiddenPlaceholder.hoverBg
          : this.theme.colors.rowBackground;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = this.theme.colors.cellBorder;
        this.ctx.lineWidth = this.theme.border.width;
        this.ctx.beginPath();
        this.ctx.moveTo(x + width, y);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.stroke();
      });
      return;
    }

    const isDisabled = measureCell("resolveDisabled", () =>
      this.resolveDisabled(column.disabled, row, column),
    );

    const cacheMode = measureCell("cacheMode", () => this.getCacheMode(column));
    let renderResult: RenderResult;

    if (this.renderCache && cacheMode !== false) {
      const cached = measureCell("cacheGet", () =>
        this.renderCache!.get(row, column, value, cacheMode),
      );
      if (cached) {
        renderResult = cached;
      } else {
        renderResult = measureCell("executeRender", () =>
          this.executeRender(column, row, rowIndex, value, rowBandTrace),
        );
        measureCell("cacheSet", () => {
          this.renderCache!.set(row, column, value, renderResult, cacheMode);
        });
      }
    } else {
      renderResult = measureCell("executeRender", () =>
        this.executeRender(column, row, rowIndex, value, rowBandTrace),
      );
    }

    const isCellSelected = measureCell("selectionCheck", () =>
      this.isCellSelected(rowIndex, colIndex, options.selectedCells),
    );
    const { isHovered, isEditing } = measureCell("hoverEditingCheck", () => ({
      isHovered:
        options.hoveredCell?.rowIndex === rowIndex && options.hoveredCell?.columnIndex === colIndex,
      isEditing:
        options.editingCell?.rowIndex === rowIndex && options.editingCell?.columnIndex === colIndex,
    }));

    measureCell("stateBackground", () => {
      if (isCellSelected && !row.selected) {
        this.ctx.fillStyle = this.theme.colors.rowSelectedBackground;
        this.ctx.fillRect(x, y, width, height);
      } else if (isHovered && !row.selected) {
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
        this.ctx.fillRect(x, y, width, height);
      }
    });

    if (!isEditing) {
      const isExpandColumn = this.expandColumnKey === column.key;
      const hasChildren = row.children && row.children.length > 0;
      const level = row.level ?? 0;

      if (isExpandColumn && hasChildren) {
        measureCell("expandIcon", () => {
          this.renderExpandIcon(x, y, width, height, row.expanded ?? false, level);
        });
        const iconWidth = 12 + padding;
        const levelIndent = level * 16;
        measureCell("renderCellContent", () => {
          this.renderCellContent(
            renderResult,
            x + iconWidth + levelIndent,
            y,
            width - iconWidth - levelIndent,
            height,
            padding,
            column.align,
            rowIndex,
            colIndex,
            isDisabled,
            column.key,
            row,
            column,
            value,
          );
        });
      } else {
        const levelIndent = isExpandColumn ? level * 16 : 0;
        measureCell("renderCellContent", () => {
          this.renderCellContent(
            renderResult,
            x + levelIndent,
            y,
            width - levelIndent,
            height,
            padding,
            column.align,
            rowIndex,
            colIndex,
            isDisabled,
            column.key,
            row,
            column,
            value,
          );
        });
      }
    }

    measureCell("border", () => {
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.strokeRect(x, y, width, height);
    });

    const validationKey = `${rowIndex}-${colIndex}`;
    const validationError = measureCell("validationLookup", () =>
      this.currentValidationErrors.get(validationKey),
    );
    if (validationError) {
      measureCell("validationDraw", () => {
        const outlineWidth = Math.max(this.theme.border.width, 2);
        const inset = outlineWidth / 2;
        this.ctx.strokeStyle =
          validationError.level === "warning"
            ? (this.theme.colors.tagColors.warning ?? "#faad14")
            : (this.theme.colors.tagColors.error ?? "#ff4d4f");
        this.ctx.lineWidth = outlineWidth;
        this.ctx.strokeRect(x + inset, y + inset, width - outlineWidth, height - outlineWidth);
      });
    } else {
      const isPendingValidation = measureCell("pendingValidationLookup", () =>
        this.currentPendingValidations.has(validationKey),
      );
      if (isPendingValidation) {
        measureCell("pendingValidationDraw", () => {
          const outlineWidth = Math.max(this.theme.border.width, 2);
          const inset = outlineWidth / 2;
          const pulsePhase = (Date.now() % 1500) / 1500;
          const alpha = 0.3 + 0.4 * Math.sin(pulsePhase * Math.PI * 2);
          this.ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          this.ctx.lineWidth = outlineWidth;
          this.ctx.strokeRect(x + inset, y + inset, width - outlineWidth, height - outlineWidth);
        });
      }
    }

    if (isDisabled) {
      measureCell("disabledOverlay", () => {
        const overlayColor =
          this.theme.name === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.35)";
        this.ctx.fillStyle = overlayColor;
        this.ctx.fillRect(x, y, width, height);
      });
    }
  }

  /**
   * 获取列的缓存模式
   */
  private getCacheMode(column: Column): "cell" | "value" | false {
    // 用户明确禁用缓存
    if (column.cacheRender === false) return false;
    if (column.cacheMode === false) return false;

    // 用户明确指定模式
    if (column.cacheMode === "value") return "value";
    if (column.cacheMode === "cell") return "cell";

    // 默认不使用缓存（对于大数据场景更高效）
    // 只有用户明确指定 cacheMode 时才启用
    return false;
  }

  /**
   * 执行渲染函数
   */
  private executeRender(
    column: Column,
    row: Row,
    rowIndex: number,
    value: unknown,
    rowBandTrace?: RowBandCellTrace,
  ): RenderResult {
    const measureCell = <T>(name: string, fn: () => T): T =>
      this.measureRowBandCellDetail(rowBandTrace, name, fn);

    let renderResult: RenderResult = {
      text: measureCell("formatValue", () => this.formatValue(value, column, row, rowBandTrace)),
      type: column.type ?? "text",
    };

    if (column.type === "number") {
      renderResult.placeholder = column.placeholder ?? this.locale.cell.numberPlaceholder;
    }

    if (column.render) {
      try {
        const customResult = measureCell("columnRender", () =>
          column.render!(value, row, column, rowIndex),
        );
        if (customResult) {
          renderResult = measureCell("mergeRenderResult", () => ({
            ...renderResult,
            ...customResult,
          }));
        }
      } catch (error) {
        measureCell("renderError", () => {
          console.error(`Error rendering cell at row ${rowIndex}, column ${column.key}:`, error);
        });
        renderResult = {
          text: "[Error]",
          type: "text",
        };
      }
    }

    return renderResult;
  }

  private renderCellContent(
    renderResult: RenderResult,
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number,
    defaultAlign?: HorizontalAlign,
    rowIndex?: number,
    colIndex?: number,
    isDisabled?: boolean,
    columnKey?: string,
    row?: Row,
    column?: Column,
    value?: unknown,
  ): void {
    try {
      this.renderCellContentInternal(
        renderResult,
        x,
        y,
        width,
        height,
        padding,
        defaultAlign,
        rowIndex,
        colIndex,
        isDisabled,
        columnKey,
        row,
        column,
        value,
      );
    } catch (error) {
      console.error(`Error rendering cell content at row ${rowIndex}, col ${colIndex}:`, error);
      this.ctx.fillStyle = this.theme.colors.cellText;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("[Render Error]", x + padding, y + height / 2);
    }
  }

  private renderWithCellRenderer(
    type: CellType,
    value: unknown,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      rowIndex?: number;
      colIndex?: number;
      isDisabled?: boolean;
      switchAnimation?: SwitchAnimationState;
      buttonHoverState?: ButtonHoverState;
      multipleSelectSeparator?: string;
      hoveredButtonIndex?: number;
      hoveredImageIndex?: number;
      isHovered?: boolean;
      imageRuntime?: ImageRuntime;
      buttonOptions?: ButtonsOptions;
    } = {},
  ): StrategyCellRenderResult | null {
    const renderer = this.cellRendererRegistry.get(type);
    if (!renderer) {
      return null;
    }

    return renderer.render(
      this.cellRendererRegistry.createContext({
        ctx: this.ctx,
        theme: this.theme,
        layoutManager: this.layoutManager,
        x,
        y,
        width,
        height,
        column: { key: type, title: type, type } as Column,
        row: { id: "", data: {} } as Row,
        rowIndex: options.rowIndex ?? -1,
        colIndex: options.colIndex ?? -1,
        value,
        isDisabled: options.isDisabled ?? false,
        isHovered: options.isHovered ?? false,
        isSelected: false,
        dpr: this.dpr,
        locale: this.locale,
        switchAnimation: options.switchAnimation,
        buttonHoverState: options.buttonHoverState,
        multipleSelectSeparator: options.multipleSelectSeparator,
        hoveredButtonIndex: options.hoveredButtonIndex,
        hoveredImageIndex: options.hoveredImageIndex,
        buttonOptions: options.buttonOptions,
        imageRuntime: options.imageRuntime,
      }),
    );
  }

  private renderCellContentInternal(
    renderResult: RenderResult,
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number,
    defaultAlign?: HorizontalAlign,
    rowIndex?: number,
    colIndex?: number,
    isDisabled?: boolean,
    columnKey?: string,
    row?: Row,
    column?: Column,
    value?: unknown,
  ): void {
    // 保存 canvas 状态，确保所有渲染操作不会影响后续单元格
    this.ctx.save();
    try {
      const { text, type, style, checkbox, radio, button, input, tags, link } = renderResult;
      const ck = columnKey ?? "(unknown)";

      const fontSize = style?.fontSize ?? this.theme.font.size;
      const fontFamily = style?.fontFamily ?? this.theme.font.family;
      const fontWeight = style?.fontWeight ?? "normal";
      const fontStyle = style?.fontStyle ?? "normal";
      const cellLocation = this.performanceEnabled
        ? { rowIndex, colIndex, x, y, width, height }
        : undefined;

      this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

      if (type === CellTypes.CHECKBOX && checkbox) {
        this.measureRender("checkbox", ck, cellLocation, () => {
          this.renderWithCellRenderer("checkbox", checkbox, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.RADIO && radio) {
        this.measureRender("radio", ck, cellLocation, () => {
          this.renderWithCellRenderer("radio", radio, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.BUTTON && button) {
        if (Array.isArray(button)) {
          let hoveredButtonIndex = -1;
          if (rowIndex !== undefined && colIndex !== undefined) {
            const isCurrentCellHovered =
              this.currentHoveredCell?.rowIndex === rowIndex &&
              this.currentHoveredCell?.columnIndex === colIndex;
            if (isCurrentCellHovered) {
              hoveredButtonIndex = this.currentHoveredButtonIndex;
            }
          }
          this.measureRender("button", ck, cellLocation, () => {
            this.renderWithCellRenderer("button", button, x, y, width, height, {
              rowIndex,
              colIndex,
              isDisabled,
              hoveredButtonIndex,
              buttonOptions: renderResult.buttonOptions,
            });
          });
          return;
        }

        let buttonHoverState: ButtonHoverState | undefined;
        if (rowIndex !== undefined && colIndex !== undefined && this.currentButtonHoverStates) {
          const cellKey = `${rowIndex}-${colIndex}`;
          const hoverState = this.currentButtonHoverStates.get(cellKey);
          if (hoverState) {
            buttonHoverState = hoverState;
          }
        }
        this.measureRender("button", ck, cellLocation, () => {
          this.renderWithCellRenderer("button", button, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
            buttonHoverState,
          });
        });
        return;
      }

      if (type === CellTypes.SWITCH && renderResult.switch) {
        let switchAnimation: SwitchAnimationState | undefined;
        if (rowIndex !== undefined && colIndex !== undefined && this.currentSwitchAnimations) {
          const cellKey = `${rowIndex}-${colIndex}`;
          const animation = this.currentSwitchAnimations.get(cellKey);
          if (animation) {
            switchAnimation = animation;
          }
        }
        this.measureRender("switch", ck, cellLocation, () => {
          this.renderWithCellRenderer("switch", renderResult.switch!, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
            switchAnimation,
          });
        });
        return;
      }

      if (type === CellTypes.INPUT && input) {
        this.measureRender("input", ck, cellLocation, () => {
          this.renderWithCellRenderer("input", input, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.SELECT && renderResult.select) {
        this.measureRender("select", ck, cellLocation, () => {
          this.renderWithCellRenderer("select", renderResult.select!, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
            multipleSelectSeparator: this.multipleSelectSeparator,
          });
        });
        return;
      }

      if (type === CellTypes.DATE && renderResult.date) {
        this.measureRender("date", ck, cellLocation, () => {
          this.renderWithCellRenderer("date", renderResult.date!, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.TAG && tags) {
        this.measureRender("tags", ck, cellLocation, () => {
          this.renderWithCellRenderer("tag", tags, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.IMAGE && renderResult.image) {
        const isHovered =
          rowIndex !== undefined &&
          colIndex !== undefined &&
          this.currentHoveredCell?.rowIndex === rowIndex &&
          this.currentHoveredCell?.columnIndex === colIndex;

        // Hot path: mutate the reusable context instead of allocating per cell.
        // ImageRenderer is stateless and reads context fields synchronously, so
        // sharing one object across cells is safe and avoids GC pressure during
        // scroll on dense image grids.
        const imageCtx = this.imageRenderContext;
        imageCtx.ctx = this.ctx;
        imageCtx.theme = this.theme;
        imageCtx.locale = this.locale;
        imageCtx.layoutManager = this.layoutManager;
        imageCtx.dpr = this.dpr;
        imageCtx.x = x;
        imageCtx.y = y;
        imageCtx.width = width;
        imageCtx.height = height;
        imageCtx.value = renderResult.image;
        imageCtx.rowIndex = rowIndex ?? -1;
        imageCtx.colIndex = colIndex ?? -1;
        imageCtx.isDisabled = isDisabled ?? false;
        imageCtx.isHovered = !!isHovered;
        imageCtx.hoveredImageIndex = this.currentHoveredImageIndex;

        this.measureRender("image", ck, cellLocation, () => {
          this.imageRenderer.render(imageCtx);
        });
        return;
      }

      if (type === CellTypes.PROGRESS && renderResult.progress) {
        // 检查是否是正在拖拽的进度条
        const isDragging =
          rowIndex !== undefined &&
          colIndex !== undefined &&
          this.currentProgressDragState &&
          this.currentProgressDragState.cell.rowIndex === rowIndex &&
          this.currentProgressDragState.cell.columnIndex === colIndex;

        // 如果正在拖拽，使用 displayValue
        const progressConfig = isDragging
          ? { ...renderResult.progress!, value: this.currentProgressDragState!.displayValue }
          : renderResult.progress!;

        this.measureRender("progress", ck, cellLocation, () => {
          this.renderWithCellRenderer("progress", progressConfig, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.RATING && renderResult.rating) {
        let starBounds: StrategyCellRenderResult["starBounds"] | undefined;
        this.measureRender("rating", ck, cellLocation, () => {
          starBounds = this.renderWithCellRenderer(
            "rating",
            renderResult.rating!,
            x,
            y,
            width,
            height,
            {
              rowIndex,
              colIndex,
              isDisabled,
            },
          )?.starBounds;
        });
        if (starBounds) {
          renderResult.starBounds = starBounds;
        }
        return;
      }

      if (type === CellTypes.COLOR && renderResult.color) {
        this.measureRender("color", ck, cellLocation, () => {
          this.renderWithCellRenderer("color", renderResult.color!, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      // JSX render handling - before customRender
      // 自定义渲染将完整的单元格交给用户控制，从左上角 (x, y) 开始绘制，
      // 不应用内置 padding 或居中，样式（颜色、间距等）完全由用户决定。
      // 传入单元格尺寸给 LayoutEngine，允许根元素使用 "100%" 撑满单元格。
      // 渲染出错时仅跳过本单元格，不影响其它列的渲染。

      if (renderResult.type === "custom" && renderResult.jsxRender) {
        this.measureRender("jsx", ck, cellLocation, () => {
          // 强制保存完整 Canvas 状态，JSX 渲染完全隔离
          this.ctx.save();
          try {
            const contextRow = row ?? Renderer.SHARED_PLACEHOLDER_ROW;
            const contextColumn = column ?? Renderer.SHARED_PLACEHOLDER_COLUMN;
            const jsxContext = this.createJSXRenderContext(
              contextRow,
              contextColumn,
              rowIndex ?? -1,
              colIndex ?? -1,
              value,
            );
            const elementTree = renderResult.jsxRender!(jsxContext);
            const jsxLayoutKey = renderResult.jsxLayoutKey;
            const layoutCacheKey =
              typeof jsxLayoutKey === "function"
                ? (jsxLayoutKey(jsxContext) ?? null)
                : (jsxLayoutKey ?? null);
            this.jsxRenderer.setRenderContext({
              ctx: this.ctx,
              theme: this.theme,
              imageRuntime: this.imageRuntime,
              row: contextRow,
              column: contextColumn,
              rowIndex,
              colIndex,
              cellRect: { x, y, width, height },
              updateValue: jsxContext.updateValue,
              updateField: jsxContext.updateField,
              updateRow: jsxContext.updateRow,
              collectInteractiveRegion: (region) => {
                this.jsxInteractiveRegions.push(region);
              },
            });
            this.jsxRenderer.render(elementTree, x, y, { width, height }, layoutCacheKey);
          } catch (e) {
            console.error(`[Renderer] JSX render error at row ${rowIndex}, col ${colIndex}:`, e);
          } finally {
            // 强制恢复 Canvas 状态，不管 JSX 内部发生了什么
            this.ctx.restore();
          }
        });
        return;
      }

      if (renderResult.type === "custom" && renderResult.customRender) {
        this.measureRender("custom", ck, cellLocation, () => {
          try {
            renderResult.customRender!({
              ctx: this.ctx,
              x,
              y,
              width,
              height,
              padding,
              theme: this.theme,
              dpr: this.dpr,
            });
          } catch (e) {
            console.error(`[Renderer] customRender error at row ${rowIndex}, col ${colIndex}:`, e);
          }
        });
        return;
      }

      // 文本渲染（默认）
      this.measureRender("text", ck, cellLocation, () => {
        // 处理 link 类型的显示文本
        let displayText = text;
        let color = style?.color ?? this.theme.colors.cellText;
        if (type === CellTypes.LINK && link) {
          displayText = link.text || link.link;
          color = style?.color ?? this.theme.colors.linkColor;
        }

        // number 类型：空值显示 placeholder
        if (type === CellTypes.NUMBER && !displayText) {
          displayText = renderResult.placeholder ?? this.locale.cell.numberPlaceholder;
          color = this.theme.colors.placeholderText;
        }

        if (!displayText) return;

        this.ctx.fillStyle = color;

        const align: HorizontalAlign = style?.horizontalAlign ?? defaultAlign ?? "left";
        const verticalAlign: VerticalAlign = style?.verticalAlign ?? "middle";

        const fontSize = this.theme.font.size;
        const lineHeight = fontSize * 1.5;
        const maxTextWidth = width - padding * 2;

        // 计算可显示行数
        const maxRows = this.calculateMaxRows(height, lineHeight, padding);

        if (maxRows > 1) {
          // 多行显示模式
          const lines = this.wrapTextToLines(displayText, maxTextWidth, maxRows);
          const totalHeight = lines.length * lineHeight;

          // 计算起始 Y（根据 verticalAlign）
          let startY: number;
          if (verticalAlign === "top") {
            startY = y + padding;
          } else if (verticalAlign === "bottom") {
            startY = y + height - padding - totalHeight;
          } else {
            // middle: 居中
            startY = y + (height - totalHeight) / 2;
          }

          this.ctx.textBaseline = "top";
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]!;
            let textX: number;
            switch (align) {
              case "center":
                textX = x + (width - this.ctx.measureText(line).width) / 2;
                break;
              case "right":
                textX = x + width - padding - this.ctx.measureText(line).width;
                break;
              default:
                textX = x + padding;
            }
            this.ctx.fillText(line, textX, startY + i * lineHeight);
          }
        } else {
          // 单行显示模式（原有逻辑）
          const ellipsis = "...";
          let textWidth = this.ctx.measureText(displayText).width;

          if (textWidth > maxTextWidth) {
            let truncated = displayText;
            while (
              truncated.length > 0 &&
              this.ctx.measureText(truncated + ellipsis).width > maxTextWidth
            ) {
              truncated = truncated.slice(0, -1);
            }
            displayText = truncated + ellipsis;
          }

          let textX: number;
          switch (align) {
            case "center":
              textX = x + (width - this.ctx.measureText(displayText).width) / 2;
              break;
            case "right":
              textX = x + width - padding - this.ctx.measureText(displayText).width;
              break;
            default:
              textX = x + padding;
          }

          let textY: number;
          switch (verticalAlign) {
            case "top":
              this.ctx.textBaseline = "top";
              textY = y + padding;
              break;
            case "bottom":
              this.ctx.textBaseline = "bottom";
              textY = y + height - padding;
              break;
            default:
              this.ctx.textBaseline = "middle";
              textY = y + height / 2;
          }

          if (type === CellTypes.TAG) {
            this.renderTag(displayText, textX, textY, fontSize);
          } else {
            this.ctx.fillText(displayText, textX, textY);

            if (type === CellTypes.LINK) {
              const textWidth = this.ctx.measureText(displayText).width;
              this.ctx.strokeStyle = color;
              this.ctx.lineWidth = 1;
              this.ctx.beginPath();
              this.ctx.moveTo(textX, textY + fontSize / 2 + 2);
              this.ctx.lineTo(textX + textWidth, textY + fontSize / 2 + 2);
              this.ctx.stroke();
            }
          }
        } // end else (单行模式)
      }); // Close measureRender lambda
    } finally {
      // 确保始终恢复 canvas 状态
      this.ctx.restore();
    }
  }

  private renderExpandIcon(
    x: number,
    y: number,
    width: number,
    height: number,
    expanded: boolean,
    level: number,
  ): void {
    const size = 8;
    const padding = 8;
    const levelIndent = level * 16;
    const iconX = x + padding + levelIndent + size / 2;
    const iconY = y + height / 2;

    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.beginPath();

    if (expanded) {
      this.ctx.moveTo(iconX - size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX + size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX, iconY + size / 2);
    } else {
      this.ctx.moveTo(iconX - size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX + size / 2, iconY);
      this.ctx.lineTo(iconX - size / 2, iconY + size / 2);
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  renderButtonsDropdown(dropdown: ButtonsDropdownState): void {
    this.dropdownRenderer.renderButtonsDropdown(dropdown);
  }

  renderImageTooltip(imageTooltip: ImageTooltipState): void {
    this.imageOverlayRenderer.renderImageTooltip(imageTooltip);
  }

  renderImageEditor(editor: ImageEditorState): void {
    this.imageOverlayRenderer.renderImageEditor(editor);
  }

  /**
   * 获取文本宽度（使用缓存优化性能）
   * 避免每帧都调用 measureText
   */
  private measureTextWidth(text: string): number {
    // 更新字体缓存 key
    const fontKey = `${this.theme.font.size}-${this.theme.font.family}`;
    if (this.textWidthCacheKey !== fontKey) {
      // 字体配置变化，清空缓存
      this.textWidthCache.clear();
      this.textWidthCacheKey = fontKey;
    }

    // 检查缓存
    const cachedWidth = this.textWidthCache.get(text);
    if (cachedWidth !== undefined) {
      return cachedWidth;
    }

    // 测量并缓存
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const width = this.ctx.measureText(text).width;
    this.textWidthCache.set(text, width);
    return width;
  }

  renderColorDropdown(dropdown: ColorPickerDropdownState): void {
    this.overlayRenderer.renderColorDropdown(dropdown);
  }

  /**
   * 检查行是否在懒加载范围内
   */
  private isInLazyLoadRange(rowIndex: number, threshold: number): boolean {
    if (!this.currentVisibleRange) return true;

    const { startRow, endRow } = this.currentVisibleRange;
    const rowHeight = this.rowHeight || this.theme.row.height;

    // 计算额外行数（基于阈值）
    const extraRows = Math.ceil(threshold / rowHeight);

    // 扩展后的范围
    const lazyStartRow = Math.max(0, startRow - extraRows);
    const lazyEndRow = endRow + extraRows;

    const row = this.currentRows[rowIndex];
    if (!row) {
      return rowIndex >= lazyStartRow && rowIndex <= lazyEndRow;
    }

    if (this.layoutManager.isRowInPinnedBand(row)) {
      return true;
    }

    const bodyRowIndex = this.layoutManager.getBodyRowIndexByRef(row);
    if (bodyRowIndex >= 0) {
      return bodyRowIndex >= lazyStartRow && bodyRowIndex <= lazyEndRow;
    }

    return rowIndex >= lazyStartRow && rowIndex <= lazyEndRow;
  }

  private loadImage(src: string, targetSize?: number): void {
    if (this.isDestroyed) return;

    // 使用 ImageLoadQueue，传递渲染尺寸用于预缩放
    this.imageLoadQueue.request(src, targetSize, (success) => {
      if (this.isDestroyed) return;

      if (success) {
        // 请求重绘
        this.markDirty(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
        // 触发外部渲染
        this.onImageLoaded?.();
      }
    });
  }

  /**
   * 收集当前帧可见的图片 URL
   */
  collectVisibleImage(src: string): void {
    if (src && !src.startsWith("data:")) {
      this.frameVisibleUrls.add(src);
    }
  }

  /**
   * 提交当前帧可见图片集合
   */
  commitVisibleImages(): void {
    // 取消不可见的请求
    this.imageLoadQueue.cancelInvisible(this.frameVisibleUrls);
    // 提交当前帧的加载请求，启动延迟加载
    this.imageLoadQueue.commitFrame();
    // 重置下一帧
    this.frameVisibleUrls = new Set();
  }

  /**
   * 重试加载失败的图片
   */
  retryImage(src: string): void {
    this.imageLoadQueue.retry(src);
  }

  /**
   * 检查图片是否加载失败
   */
  isImageFailed(src: string): boolean {
    return this.imageLoadQueue.isFailed(src);
  }

  /**
   * 检查图片是否已加载
   */
  isImageLoaded(src: string): boolean {
    return this.imageLoadQueue.has(src);
  }

  /**
   * 清除图片缓存
   */
  clearImageCache(): void {
    this.imageLoadQueue.clear();
  }

  /**
   * 获取图片加载队列统计信息
   */
  getImageLoadStats(): { pending: number; loading: number; cached: number; failed: number } {
    return this.imageLoadQueue.getStats();
  }

  // ==================== 性能监控方法 ====================

  /**
   * 获取最后一帧的诊断信息
   */
  getLastFrameDiagnostics(): any {
    if (this.frameHistory.length === 0) return null;
    return this.frameHistory[this.frameHistory.length - 1] ?? null;
  }

  /**
   * 获取最差帧的诊断信息（总时间最长的帧）
   */
  getWorstFrameDiagnostics(): any {
    if (this.frameHistory.length === 0) return null;
    return this.frameHistory.reduce((worst, frame) =>
      frame.totalTime > worst.totalTime ? frame : worst,
    );
  }

  /**
   * 获取完整的性能诊断信息
   */
  getPerformanceDiagnostics(): any {
    return {
      frameHistory: [...this.frameHistory],
      lastFrame: this.getLastFrameDiagnostics(),
      worstFrame: this.getWorstFrameDiagnostics(),
    };
  }

  /**
   * 启用或禁用性能监控
   */
  setPerformanceMonitoring(enabled: boolean): void {
    this.performanceEnabled = enabled;
    // 注意：禁用时不清空数据，让用户可以查看报告后再手动调用 resetPerformanceStats()
  }

  /**
   * 检查性能监控是否启用
   */
  isPerformanceMonitoringEnabled(): boolean {
    return this.performanceEnabled;
  }

  /**
   * 重置性能统计
   */
  resetPerformanceStats(): void {
    this.performanceStats.clear();
    this.currentFrameStats.clear();
    this.currentFramePhases.clear();
    this.currentFrameRowBandDetails.clear();
    this.lastFrameStats.clear();
    this.frameHistory = [];
    this.frameCount = 0;
  }

  /**
   * 开始帧计时
   */
  beginFrame(): void {
    if (!this.performanceEnabled) return;
    this.frameStartTime = performance.now();
    // 清空当前帧统计
    this.currentFrameStats.clear();
    this.currentFramePhases.clear();
    this.currentFrameRowBandDetails.clear();
  }

  /**
   * 结束帧计时
   */
  endFrame(
    visibleRange: VisibleRange,
    scrollTop: number,
    scrollLeft: number,
    columns: Column[],
  ): void {
    if (!this.performanceEnabled) return;
    const frameEndTime = performance.now();
    const frameTotalTime = frameEndTime - this.frameStartTime;
    this.frameCount++;

    // 保存上一帧统计（深拷贝内层 Map）
    this.lastFrameStats = new Map();
    for (const [type, byKey] of this.currentFrameStats) {
      const copiedByKey: Map<string, CellRenderStats> = new Map();
      for (const [columnKey, stats] of byKey) {
        copiedByKey.set(columnKey, this.copyCellStats(stats));
      }
      this.lastFrameStats.set(type, copiedByKey);
    }

    // 计算 cellRenderTime（所有单元格渲染时间总和）
    let cellRenderTime = 0;
    for (const byKey of this.currentFrameStats.values()) {
      for (const stat of byKey.values()) {
        cellRenderTime += stat.totalTime;
      }
    }

    // 计算 instrumentedPhaseTime（所有阶段时间总和）
    let instrumentedPhaseTime = 0;
    for (const stat of this.currentFramePhases.values()) {
      instrumentedPhaseTime += stat.totalTime;
    }

    // 将当前帧统计累积到总统计
    for (const [type, byKey] of this.currentFrameStats) {
      let totalByKey = this.performanceStats.get(type);
      if (!totalByKey) {
        totalByKey = new Map();
        this.performanceStats.set(type, totalByKey);
      }
      for (const [columnKey, frameStat] of byKey) {
        const stats = totalByKey.get(columnKey) || { totalTime: 0, count: 0, maxTime: 0 };
        stats.totalTime += frameStat.totalTime;
        stats.count += frameStat.count;
        if (frameStat.maxTime > stats.maxTime) {
          stats.maxTime = frameStat.maxTime;
          stats.maxCell = frameStat.maxCell ? { ...frameStat.maxCell } : undefined;
        }
        totalByKey.set(columnKey, stats);
      }
    }

    // 保存帧历史记录
    const visibleRows = visibleRange.endRow - visibleRange.startRow + 1;
    const fixedInfo = this.layoutManager.getFixedColumnsInfo(columns);
    const visibleColumns =
      this.layoutManager.getVisibleCenterColumnIndices().length +
      fixedInfo.leftFixed.columns.length +
      fixedInfo.rightFixed.columns.length;
    const visibleCells = visibleRows * visibleColumns;

    // 深拷贝 cellsByType
    const cellsByType: Map<string, Map<string, CellRenderStats>> = new Map();
    for (const [type, byKey] of this.currentFrameStats) {
      const copiedByKey: Map<string, CellRenderStats> = new Map();
      for (const [columnKey, stats] of byKey) {
        copiedByKey.set(columnKey, this.copyCellStats(stats));
      }
      cellsByType.set(type, copiedByKey);
    }

    // 深拷贝 phases
    const phases: Map<string, PhaseStats> = new Map();
    for (const [name, stats] of this.currentFramePhases) {
      phases.set(name, { ...stats });
    }

    // 深拷贝 rowBands 内部细分统计
    const rowBandDetails: Map<string, RowBandDetailStats> = new Map();
    for (const [name, stats] of this.currentFrameRowBandDetails) {
      rowBandDetails.set(name, {
        ...stats,
        maxAt: stats.maxAt ? { ...stats.maxAt } : undefined,
      });
    }

    const nonCellRendererTime = Math.max(0, frameTotalTime - cellRenderTime);
    const unaccountedTime = Math.max(0, frameTotalTime - instrumentedPhaseTime);

    const frameEntry = {
      frameId: this.frameCount,
      startTime: this.frameStartTime,
      totalTime: frameTotalTime,
      cellRenderTime,
      nonCellRendererTime,
      unaccountedTime,
      phases,
      rowBandDetails,
      cellsByType,
      visibleRows,
      visibleColumns,
      visibleCells,
      scrollTop,
      scrollLeft,
    };

    this.frameHistory.push(frameEntry);

    // 保留最近 120 帧
    if (this.frameHistory.length > Renderer.MAX_FRAME_HISTORY) {
      this.frameHistory.shift();
    }
  }

  private formatCellLocation(location?: CellRenderLocation): string {
    if (!location) return "row: N/A col: N/A xy: N/A";
    return `row: ${location.rowIndex ?? "N/A"} col: ${location.colIndex ?? "N/A"} xy: (${location.x.toFixed(0)},${location.y.toFixed(0)}) size: ${location.width.toFixed(0)}x${location.height.toFixed(0)}`;
  }

  private copyCellStats(stats: CellRenderStats): CellRenderStats {
    return {
      ...stats,
      maxCell: stats.maxCell ? { ...stats.maxCell } : undefined,
    };
  }

  /**
   * 测量渲染类型的时间
   */
  private measureRender(
    type: string,
    columnKey: string,
    location: CellRenderLocation | undefined,
    fn: () => void,
  ): void {
    if (!this.performanceEnabled) {
      fn();
      return;
    }

    const renderLocation = location ?? { x: 0, y: 0, width: 0, height: 0 };
    const start = performance.now();
    fn();
    const duration = performance.now() - start;

    this.recordRenderTiming(type, columnKey, duration, renderLocation);
  }

  /**
   * 记录单次渲染耗时（用于内联性能采样的场景，如 image 热路径）
   */
  private recordRenderTiming(
    type: string,
    columnKey: string,
    duration: number,
    location: CellRenderLocation,
  ): void {
    let byKey = this.currentFrameStats.get(type);
    if (!byKey) {
      byKey = new Map();
      this.currentFrameStats.set(type, byKey);
    }
    const frameStats = byKey.get(columnKey) || { totalTime: 0, count: 0, maxTime: 0 };
    frameStats.totalTime += duration;
    frameStats.count++;
    if (duration > frameStats.maxTime) {
      frameStats.maxTime = duration;
      frameStats.maxCell = { ...location };
    }
    byKey.set(columnKey, frameStats);
  }

  /**
   * 测量渲染阶段的时间
   */
  private measurePhase<T>(name: string, fn: () => T): T {
    if (!this.performanceEnabled) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    const phaseStats = this.currentFramePhases.get(name) || { totalTime: 0, count: 0, maxTime: 0 };
    phaseStats.totalTime += duration;
    phaseStats.count++;
    phaseStats.maxTime = Math.max(phaseStats.maxTime, duration);
    this.currentFramePhases.set(name, phaseStats);

    return result;
  }

  private recordRowBandDetail(
    name: string,
    duration: number,
    location?: CellRenderLocation,
    columnKey?: string,
  ): void {
    if (!this.performanceEnabled) return;

    const stats = this.currentFrameRowBandDetails.get(name) ?? {
      totalTime: 0,
      count: 0,
      maxTime: 0,
    };
    stats.totalTime += duration;
    stats.count++;
    if (duration > stats.maxTime) {
      stats.maxTime = duration;
      stats.maxAt = location ? { ...location } : undefined;
      stats.columnKey = columnKey;
    }
    this.currentFrameRowBandDetails.set(name, stats);
  }

  private measureRowBandDetail<T>(
    name: string,
    fn: () => T,
    location?: CellRenderLocation,
    columnKey?: string,
  ): T {
    if (!this.performanceEnabled) {
      return fn();
    }

    const start = performance.now();
    try {
      return fn();
    } finally {
      this.recordRowBandDetail(name, performance.now() - start, location, columnKey);
    }
  }

  private measureRowBandCellDetail<T>(
    trace: RowBandCellTrace | undefined,
    name: string,
    fn: () => T,
  ): T {
    if (!trace) {
      return fn();
    }

    return this.measureRowBandDetail(
      `${trace.prefix}.${name}`,
      fn,
      trace.location,
      trace.columnKey,
    );
  }

  /**
   * 获取性能统计（按类型聚合，丢失列粒度，仅供向后兼容）
   */
  getPerformanceStats(): Map<
    string,
    { totalTime: number; count: number; maxTime: number; avgTime: number }
  > {
    const result = new Map();
    for (const [type, byKey] of this.performanceStats) {
      let totalTime = 0;
      let count = 0;
      let maxTime = 0;
      for (const stats of byKey.values()) {
        totalTime += stats.totalTime;
        count += stats.count;
        maxTime = Math.max(maxTime, stats.maxTime);
      }
      result.set(type, {
        totalTime,
        count,
        maxTime,
        avgTime: count > 0 ? totalTime / count : 0,
      });
    }
    return result;
  }

  /**
   * 输出性能报告到控制台
   */
  logPerformanceReport(): void {
    if (!this.performanceEnabled) return;

    const formatCellLocation = (location?: CellRenderLocation) => this.formatCellLocation(location);

    type Row = {
      Type: string;
      Key: string;
      Calls: number;
      "Avg(ms)": string;
      "Max(ms)": string;
      "Total(ms)": string;
      MaxAt: string;
    };
    const rows: Row[] = [];
    for (const [type, byKey] of this.performanceStats) {
      const keyEntries = Array.from(byKey.entries())
        .map(([columnKey, stats]) => ({
          columnKey,
          ...stats,
          avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
        }))
        .sort((a, b) => b.avgTime - a.avgTime);
      for (const e of keyEntries) {
        rows.push({
          Type: type,
          Key: e.columnKey,
          Calls: e.count,
          "Avg(ms)": e.avgTime.toFixed(3),
          "Max(ms)": e.maxTime.toFixed(3),
          "Total(ms)": e.totalTime.toFixed(1),
          MaxAt: formatCellLocation(e.maxCell),
        });
      }
    }

    console.group(`🎯 Renderer Performance (Frame ${this.frameCount})`);
    console.table(rows);

    const lastFrame = this.getLastFrameDiagnostics();
    const rowBandDetails = lastFrame?.rowBandDetails as Map<string, RowBandDetailStats> | undefined;
    if (rowBandDetails && rowBandDetails.size > 0) {
      const phases = lastFrame.phases as Map<string, PhaseStats>;
      const rowBandsTotal = phases.get("rowBands")?.totalTime ?? 0;
      const rowBandsFixedTotal = phases.get("rowBandsFixed")?.totalTime ?? 0;
      const total = rowBandsTotal + rowBandsFixedTotal;
      const rowBandRows = Array.from(rowBandDetails.entries())
        .map(([name, stats]) => ({
          Step: name,
          Column: stats.columnKey ?? "",
          "Total(ms)": stats.totalTime.toFixed(3),
          Count: stats.count,
          "Avg(ms)": (stats.count > 0 ? stats.totalTime / stats.count : 0).toFixed(3),
          "Max(ms)": stats.maxTime.toFixed(3),
          "%": (total > 0 ? (stats.totalTime / total) * 100 : 0).toFixed(1),
          MaxAt: this.formatCellLocation(stats.maxAt),
        }))
        .sort((a, b) => Number(b["Total(ms)"]) - Number(a["Total(ms)"]))
        .slice(0, 24);
      console.group("🔎 RowBands Details (last frame)");
      console.table(rowBandRows);
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * 获取格式化的性能报告字符串
   */
  getPerformanceReport(): string {
    const lines: string[] = [
      "=== Renderer Performance Report ===",
      `Status: ${this.performanceEnabled ? "Enabled" : "Disabled"}`,
      `Captured Renderer Frames: ${this.frameCount}`,
      `Retained Renderer Frames: ${this.frameHistory.length} ` +
        `(last ${Renderer.MAX_FRAME_HISTORY} max)`,
    ];

    const formatRowBandDetails = (
      details: Map<string, RowBandDetailStats> | undefined,
      totalTime: number,
      indent = "  ",
    ) => {
      if (!details || details.size === 0) return [];
      return Array.from(details.entries())
        .map(([name, stats]) => ({
          name,
          ...stats,
          avg: stats.count > 0 ? stats.totalTime / stats.count : 0,
          percentage: totalTime > 0 ? (stats.totalTime / totalTime) * 100 : 0,
        }))
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 24)
        .map((detail) => {
          const location = detail.maxAt ? ` | maxAt: ${this.formatCellLocation(detail.maxAt)}` : "";
          const column = detail.columnKey ? ` | column: ${detail.columnKey}` : "";
          return (
            `${indent}${detail.name.padEnd(42)} | ` +
            `calls: ${detail.count.toString().padStart(5)} | ` +
            `avg: ${detail.avg.toFixed(3).padStart(7)}ms | ` +
            `max: ${detail.maxTime.toFixed(3).padStart(7)}ms | ` +
            `total: ${detail.totalTime.toFixed(2).padStart(8)}ms | ` +
            `${detail.percentage.toFixed(1).padStart(5)}%` +
            column +
            location
          );
        });
    };

    const frameCount = this.frameCount || 1;

    // 检查是否有数据
    if (this.performanceStats.size === 0) {
      lines.push("");
      lines.push("No rendering data collected yet.");
      lines.push("Try scrolling the table while monitoring is enabled.");
      return lines.join("\n");
    }

    // 上一帧统计（如果有的话）
    if (this.lastFrameStats.size > 0) {
      lines.push("");
      lines.push("=== LAST FRAME STATS (most recent frame) ===");
      lines.push("-".repeat(70));

      const typeBuckets = Array.from(this.lastFrameStats.entries())
        .map(([type, byKey]) => {
          const keyEntries = Array.from(byKey.entries())
            .map(([columnKey, stats]) => ({
              columnKey,
              count: stats.count,
              totalTime: stats.totalTime,
              avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
              maxTime: stats.maxTime,
              maxCell: stats.maxCell,
            }))
            .sort((a, b) => b.totalTime - a.totalTime);
          const totalTime = keyEntries.reduce((s, e) => s + e.totalTime, 0);
          const totalCount = keyEntries.reduce((s, e) => s + e.count, 0);
          return { type, totalTime, totalCount, keyEntries };
        })
        .sort((a, b) => b.totalTime - a.totalTime);

      for (const bucket of typeBuckets) {
        lines.push(`[${bucket.type}]`);
        for (const e of bucket.keyEntries) {
          lines.push(
            `  ${e.columnKey.padEnd(20)} | ` +
              `calls: ${e.count.toString().padStart(4)} | ` +
              `avg: ${e.avgTime.toFixed(3).padStart(7)}ms | ` +
              `max: ${e.maxTime.toFixed(3).padStart(7)}ms | ` +
              `total: ${e.totalTime.toFixed(2).padStart(6)}ms | ` +
              `maxAt: ${this.formatCellLocation(e.maxCell)}`,
          );
        }
        const typeAvg = bucket.totalCount > 0 ? bucket.totalTime / bucket.totalCount : 0;
        let typeMax = 0;
        for (const e of bucket.keyEntries) {
          typeMax = Math.max(typeMax, e.maxTime);
        }
        lines.push(
          `  ${"total".padEnd(20)} | ` +
            `calls: ${bucket.totalCount.toString().padStart(4)} | ` +
            `avg: ${typeAvg.toFixed(3).padStart(7)}ms | ` +
            `max: ${typeMax.toFixed(3).padStart(7)}ms | ` +
            `total: ${bucket.totalTime.toFixed(2).padStart(6)}ms`,
        );
      }

      const lastFrameTotal = typeBuckets.reduce((s, b) => s + b.totalTime, 0);
      lines.push("");
      lines.push(`Last frame total render time: ${lastFrameTotal.toFixed(2)}ms`);

      const lastFrame = this.getLastFrameDiagnostics();
      if (lastFrame?.rowBandDetails?.size > 0) {
        const rowBandsTotal = lastFrame.phases.get("rowBands")?.totalTime ?? 0;
        const rowBandsFixedTotal = lastFrame.phases.get("rowBandsFixed")?.totalTime ?? 0;
        lines.push("");
        lines.push("=== ROW BANDS DETAIL (last frame, top 24) ===");
        lines.push(
          ...formatRowBandDetails(
            lastFrame.rowBandDetails,
            rowBandsTotal + rowBandsFixedTotal,
            "  ",
          ),
        );
      }
    }

    // 总体统计
    lines.push("");
    lines.push("=== TOTAL STATS (all frames average) ===");
    lines.push("-".repeat(70));

    const typeBuckets = Array.from(this.performanceStats.entries())
      .map(([type, byKey]) => {
        const keyEntries = Array.from(byKey.entries())
          .map(([columnKey, stats]) => ({
            columnKey,
            count: stats.count,
            totalTime: stats.totalTime,
            maxTime: stats.maxTime,
            maxCell: stats.maxCell,
            avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
            callsPerFrame: Math.round(stats.count / frameCount),
            avgFrameTime: stats.totalTime / frameCount,
          }))
          .sort((a, b) => b.avgFrameTime - a.avgFrameTime);
        const totalCount = keyEntries.reduce((s, e) => s + e.count, 0);
        const totalTime = keyEntries.reduce((s, e) => s + e.totalTime, 0);
        const maxTime = keyEntries.reduce((m, e) => Math.max(m, e.maxTime), 0);
        return { type, totalCount, totalTime, maxTime, keyEntries };
      })
      .sort((a, b) => b.totalTime - a.totalTime);

    for (const bucket of typeBuckets) {
      lines.push(`[${bucket.type}]`);
      for (const e of bucket.keyEntries) {
        lines.push(
          `  ${e.columnKey.padEnd(20)} | ` +
            `avg calls/frame: ${e.callsPerFrame.toString().padStart(4)} | ` +
            `avg: ${e.avgTime.toFixed(3).padStart(7)}ms | ` +
            `max: ${e.maxTime.toFixed(3).padStart(7)}ms | ` +
            `frameTotal: ${e.avgFrameTime.toFixed(2).padStart(6)}ms | ` +
            `maxAt: ${this.formatCellLocation(e.maxCell)}`,
        );
      }
      const typeAvg = bucket.totalCount > 0 ? bucket.totalTime / bucket.totalCount : 0;
      const typeFrameTotal = bucket.totalTime / frameCount;
      const typeCallsPerFrame = Math.round(bucket.totalCount / frameCount);
      lines.push(
        `  ${"total".padEnd(20)} | ` +
          `avg calls/frame: ${typeCallsPerFrame.toString().padStart(4)} | ` +
          `avg: ${typeAvg.toFixed(3).padStart(7)}ms | ` +
          `max: ${bucket.maxTime.toFixed(3).padStart(7)}ms | ` +
          `frameTotal: ${typeFrameTotal.toFixed(2).padStart(6)}ms`,
      );
    }

    const avgFrameTotal = typeBuckets.reduce((sum, b) => sum + b.totalTime / frameCount, 0);

    lines.push("");
    lines.push(`Average frame render time: ${avgFrameTotal.toFixed(2)}ms`);

    return lines.join("\n");
  }

  /**
   * 打印性能报告到控制台
   */
  printPerformanceReport(): void {
    console.log(this.getPerformanceReport());
  }

  renderDropdown(dropdown: DropdownState): void {
    this.dropdownRenderer.renderDropdown(dropdown);
  }

  private renderTag(text: string, x: number, y: number, fontSize: number): void {
    const padding = 4;
    const textWidth = this.ctx.measureText(text).width;
    const tagWidth = textWidth + padding * 2;
    const tagHeight = fontSize + padding * 2;

    const tagColor =
      this.theme.colors.tagColors[text.toLowerCase()] ?? this.theme.colors.tagColors["default"]!;

    this.ctx.fillStyle = tagColor;
    this.ctx.beginPath();
    const radius = 4;
    const tagX = x - padding;
    const tagY = y - fontSize / 2 - padding;

    this.ctx.roundRect(tagX, tagY, tagWidth, tagHeight, radius);
    this.ctx.fill();

    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.fillText(text, x, y);
  }

  private resolveDisabled(disabled: DisabledValue | undefined, row: Row, column: Column): boolean {
    if (disabled === undefined) {
      return false;
    }
    if (typeof disabled === "function") {
      return disabled(row, column);
    }
    return disabled;
  }

  private formatValue(
    value: unknown,
    column: Column,
    row: Row,
    rowBandTrace?: RowBandCellTrace,
  ): string {
    const measureCell = <T>(name: string, fn: () => T): T =>
      this.measureRowBandCellDetail(rowBandTrace, `formatValue.${name}`, fn);

    if (value === null || value === undefined) {
      return measureCell("empty", () => "");
    }

    if (column.formatter) {
      return measureCell("columnFormatter", () => column.formatter!(value, row, column));
    }

    switch (column.type) {
      case "number":
        return typeof value === "number"
          ? measureCell("number.toLocaleString", () => value.toLocaleString())
          : measureCell("number.stringConvert", () => String(value));
      case "boolean":
        return measureCell("boolean", () => (value ? "Yes" : "No"));
      case "date":
        if (value instanceof Date) {
          return measureCell("date.toLocaleDateString", () => value.toLocaleDateString());
        }
        return measureCell("date.stringConvert", () => String(value));
      default:
        return measureCell("default.stringConvert", () => String(value));
    }
  }

  private isCellSelected(rowIndex: number, colIndex: number, selectedCells: CellRange[]): boolean {
    return selectedCells.some((range) => {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);

      return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
    });
  }

  private renderCenterSelections(
    selectedCells: CellRange[],
    scrollLeft: number,
    scrollTop: number,
    centerColumnIndices: number[],
  ): void {
    const leafColumns = this.layoutManager.getLeafColumns();

    for (const range of selectedCells) {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);

      const merge = this.layoutManager.getCellMerge(minRow, minCol);
      let effectiveMinRow = minRow;
      let effectiveMaxRow = maxRow;
      let effectiveMinCol = minCol;
      let effectiveMaxCol = maxCol;

      if (merge) {
        effectiveMinRow = merge.rowIndex;
        effectiveMaxRow = merge.rowIndex + merge.rowspan - 1;
        effectiveMinCol = merge.columnIndex;
        effectiveMaxCol = merge.columnIndex + merge.colspan - 1;
      }

      const centerMinCol = Math.max(effectiveMinCol, Math.min(...centerColumnIndices));
      const centerMaxCol = Math.min(effectiveMaxCol, Math.max(...centerColumnIndices));

      if (centerMinCol > centerMaxCol) continue;

      const startCol = leafColumns[centerMinCol];
      const endCol = leafColumns[centerMaxCol];
      if (!startCol || !endCol) continue;
      if (startCol.fixed || endCol.fixed) continue;

      const drawY = this.layoutManager.getRowViewportY(effectiveMinRow, scrollTop);
      if (drawY === null) continue;
      const selectionHeight =
        this.layoutManager.getRowOffset(effectiveMaxRow) +
        this.layoutManager.getRowHeightByIndex(effectiveMaxRow) -
        this.layoutManager.getRowOffset(effectiveMinRow);

      const startPos = this.layoutManager.getCellPosition(effectiveMinRow, centerMinCol);
      const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, centerMaxCol);
      const selectionWidth = endPos.x + endPos.width - startPos.x;
      const drawX = startPos.x - scrollLeft;

      this.ctx.strokeStyle = this.theme.colors.selectionBorder;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([]);
      this.ctx.strokeRect(drawX, drawY, selectionWidth, selectionHeight);
    }
  }

  private renderFixedSelections(
    selectedCells: CellRange[],
    scrollTop: number,
    leftFixedIndices: number[],
    rightFixedIndices: number[],
  ): void {
    for (const range of selectedCells) {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);

      // Check if this is a merged cell selection
      const merge = this.layoutManager.getCellMerge(minRow, minCol);
      let effectiveMinRow = minRow;
      let effectiveMaxRow = maxRow;
      let effectiveMinCol = minCol;
      let effectiveMaxCol = maxCol;

      if (merge) {
        effectiveMinRow = merge.rowIndex;
        effectiveMaxRow = merge.rowIndex + merge.rowspan - 1;
        effectiveMinCol = merge.columnIndex;
        effectiveMaxCol = merge.columnIndex + merge.colspan - 1;
      }

      const drawY = this.layoutManager.getRowViewportY(effectiveMinRow, scrollTop);
      if (drawY === null) continue;
      const selectionHeight =
        this.layoutManager.getRowOffset(effectiveMaxRow) +
        this.layoutManager.getRowHeightByIndex(effectiveMaxRow) -
        this.layoutManager.getRowOffset(effectiveMinRow);

      this.ctx.strokeStyle = this.theme.colors.selectionBorder;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([]);

      const leftFixedInSelection = leftFixedIndices.filter(
        (i: number) => i >= effectiveMinCol && i <= effectiveMaxCol,
      );
      if (leftFixedInSelection.length > 0) {
        const leftFixedMin = leftFixedInSelection[0]!;
        const leftFixedMax = leftFixedInSelection[leftFixedInSelection.length - 1]!;
        const startPos = this.layoutManager.getCellPosition(effectiveMinRow, leftFixedMin);
        const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, leftFixedMax);
        const selectionWidth = endPos.x + endPos.width - startPos.x;
        this.ctx.strokeRect(startPos.x, drawY, selectionWidth, selectionHeight);
      }

      const rightFixedInSelection = rightFixedIndices.filter(
        (i: number) => i >= effectiveMinCol && i <= effectiveMaxCol,
      );
      if (rightFixedInSelection.length > 0) {
        const rightFixedMin = rightFixedInSelection[0]!;
        const rightFixedMax = rightFixedInSelection[rightFixedInSelection.length - 1]!;
        const startPos = this.layoutManager.getCellPosition(effectiveMinRow, rightFixedMin);
        const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, rightFixedMax);
        const selectionWidth = endPos.x + endPos.width - startPos.x;
        this.ctx.strokeRect(startPos.x, drawY, selectionWidth, selectionHeight);
      }
    }
  }

  renderLoadingOverlay(): void {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    this.ctx.save();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `14px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(this.locale.loadingText, width / 2, height / 2);
    this.ctx.restore();
  }

  renderEmptyState(
    message: string,
    sortConfig: SortConfig[] = [],
    filterConfig: FilterConfig[] = [],
    hoveredHeaderColumnKey?: string,
    scrollLeft: number = 0,
  ): void {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.background;
    this.ctx.fillRect(0, 0, width, height);

    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const columns = this.layoutManager.getLeafColumns();

    if (columns.length > 0) {
      // 获取固定列信息
      const fixedInfo = this.layoutManager.getFixedColumnsInfo(columns);
      const hasLeftFixed = fixedInfo.leftFixed.columns.length > 0;
      const hasRightFixed = fixedInfo.rightFixed.columns.length > 0;
      const leftFixedWidth = hasLeftFixed ? fixedInfo.leftFixed.width : 0;
      const rightFixedWidth = hasRightFixed ? fixedInfo.rightFixed.width : 0;

      this.ctx.save();
      this.ctx.fillStyle = this.theme.colors.headerBackground;
      this.ctx.fillRect(0, 0, width, headerHeight);

      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.beginPath();
      this.ctx.moveTo(0, headerHeight);
      this.ctx.lineTo(width, headerHeight);
      this.ctx.stroke();

      // 使用可见表头单元格，与正常渲染保持一致
      const headerCells = this.layoutManager.getVisibleHeaderCells();

      // 先绘制中心区域（需要裁剪）
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(leftFixedWidth, 0, width - leftFixedWidth - rightFixedWidth, headerHeight);
      this.ctx.clip();

      for (const headerCell of headerCells) {
        // 跳过固定列，它们会在后面单独绘制
        if (headerCell.column.fixed === "left" || headerCell.column.fixed === "right") {
          continue;
        }

        // 应用 scrollLeft 偏移
        const cellX = headerCell.x - scrollLeft;
        this.renderEmptyStateHeaderCell(
          headerCell,
          cellX,
          sortConfig,
          filterConfig,
          hoveredHeaderColumnKey,
        );
      }
      this.ctx.restore();

      // 绘制左侧固定列表头
      if (hasLeftFixed) {
        for (const headerCell of headerCells) {
          if (headerCell.column.fixed !== "left") continue;
          this.renderEmptyStateHeaderCell(
            headerCell,
            headerCell.x,
            sortConfig,
            filterConfig,
            hoveredHeaderColumnKey,
          );
        }
      }

      // 绘制右侧固定列表头
      if (hasRightFixed) {
        for (const headerCell of headerCells) {
          if (headerCell.column.fixed !== "right") continue;
          // 计算右侧固定列的视口位置
          const startX = width - rightFixedWidth;
          const offsetX =
            startX - (this.layoutManager.getLayoutInfo().totalWidth - rightFixedWidth);
          const cellX = headerCell.x + offsetX;
          this.renderEmptyStateHeaderCell(
            headerCell,
            cellX,
            sortConfig,
            filterConfig,
            hoveredHeaderColumnKey,
          );
        }
      }

      this.ctx.restore();
    }

    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.font = `14px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(message, width / 2, headerHeight + (height - headerHeight) / 2);
    this.ctx.restore();
  }

  private renderEmptyStateHeaderCell(
    headerCell: import("../types").HeaderCell,
    cellX: number,
    sortConfig: SortConfig[],
    filterConfig: FilterConfig[],
    hoveredHeaderColumnKey?: string,
  ): void {
    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(cellX, headerCell.y, headerCell.width, headerCell.height);

    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";

    const sortInfo = sortConfig.find((s) => s.column === headerCell.column.key);
    const sortDirection = sortInfo?.direction ?? "none";
    const isSortable = headerCell.column.sortable !== false;
    const isHovered = headerCell.column.key === hoveredHeaderColumnKey;
    const showSortIndicator =
      headerCell.isLeaf && isSortable && (sortDirection !== "none" || isHovered);
    const sortIndicatorWidth = showSortIndicator ? 20 : 0;

    const hasFilter = filterConfig.some((f) => f.column === headerCell.column.key);
    const showFilterIndicator = headerCell.isLeaf && headerCell.column.filterable;
    const filterIndicatorWidth = showFilterIndicator ? 20 : 0;

    const padding = 8;
    const maxTextWidth = headerCell.width - padding * 2 - sortIndicatorWidth - filterIndicatorWidth;
    const text = truncateText(headerCell.column.title, Math.floor(maxTextWidth / 7));

    const align = headerCell.column.align ?? "center";
    let textX = cellX + padding;

    if (align === "center") {
      textX =
        cellX +
        (headerCell.width -
          this.ctx.measureText(text).width -
          sortIndicatorWidth -
          filterIndicatorWidth) /
          2;
    } else if (align === "right") {
      textX =
        cellX +
        headerCell.width -
        padding -
        this.ctx.measureText(text).width -
        sortIndicatorWidth -
        filterIndicatorWidth;
    }

    const textY = headerCell.y + headerCell.height / 2;
    this.ctx.fillText(text, textX, textY);

    if (headerCell.isLeaf) {
      if (showFilterIndicator) {
        const filterX = cellX + headerCell.width - padding - 10;
        if (showSortIndicator) {
          this.renderSortIndicator(
            filterX - 16,
            textY,
            sortDirection === "none" ? "hover" : sortDirection,
          );
        }
        this.renderFilterIndicator(filterX, textY, hasFilter);
      } else if (showSortIndicator) {
        this.renderSortIndicator(
          cellX + headerCell.width - padding - 10,
          textY,
          sortDirection === "none" ? "hover" : sortDirection,
        );
      }
    }

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(cellX, headerCell.y, headerCell.width, headerCell.height);
  }

  private isColumnHovered(column: Column, hoveredIndex: number): boolean {
    const leafColumns = this.layoutManager.getLeafColumns();
    const hoveredColumn = leafColumns[hoveredIndex];
    if (!hoveredColumn) return false;
    return column.key === hoveredColumn.key;
  }

  renderFixedColumnsShadow(fixedWidth: number, side: "left" | "right"): void {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const shadowWidth = 10;

    this.ctx.save();

    const gradient = this.ctx.createLinearGradient(
      side === "left" ? fixedWidth : width - fixedWidth - shadowWidth,
      0,
      side === "left" ? fixedWidth + shadowWidth : width - fixedWidth,
      0,
    );

    if (side === "left") {
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.15)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    } else {
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.15)");
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      side === "left" ? fixedWidth : width - fixedWidth - shadowWidth,
      0,
      shadowWidth,
      height,
    );

    this.ctx.restore();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getCanvasContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  renderTooltip(tooltip: TooltipState): void {
    this.overlayRenderer.renderTooltip(tooltip);
  }

  renderScrollbars(
    scrollLeft: number,
    scrollTop: number,
    maxScrollLeft: number,
    maxScrollTop: number,
    scrollbarState: ScrollbarState,
  ): void {
    this.overlayRenderer.renderScrollbars(
      scrollLeft,
      scrollTop,
      maxScrollLeft,
      maxScrollTop,
      scrollbarState,
    );
  }

  renderWatermark(): void {
    this.overlayRenderer.renderWatermark();
  }

  getScrollbarBounds(
    scrollLeft: number,
    scrollTop: number,
    maxScrollLeft: number,
    maxScrollTop: number,
  ): {
    vertical: { x: number; y: number; width: number; height: number } | null;
    horizontal: { x: number; y: number; width: number; height: number } | null;
  } {
    return this.overlayRenderer.getScrollbarBounds(
      scrollLeft,
      scrollTop,
      maxScrollLeft,
      maxScrollTop,
    );
  }

  renderFilterDropdown(filterDropdown: FilterDropdownState): void {
    this.filterDropdownRenderer.render(filterDropdown);
  }

  renderDateDropdown(dateDropdown: DateDropdownState): void {
    this.overlayRenderer.renderDateDropdown(dateDropdown);
  }

  renderContextMenu(contextMenu: ContextMenuState): void {
    this.overlayRenderer.renderContextMenu(contextMenu);
  }

  renderHeaderContextMenu(headerContextMenu: HeaderContextMenuState): void {
    this.overlayRenderer.renderHeaderContextMenu(headerContextMenu);
  }

  private getRenderedRowHeight(rowIndex: number): number {
    if (this.currentRowResizeState?.rowIndex === rowIndex) {
      return this.currentRowResizeState.displayHeight;
    }

    return this.layoutManager.getRowHeightByIndex(rowIndex);
  }

  private renderRowResizeGuide(viewportWidth: number): void {
    if (!this.currentRowResizeState) {
      return;
    }

    const rowY = this.layoutManager.getRowViewportY(
      this.currentRowResizeState.rowIndex,
      this.currentScrollTop,
    );
    if (rowY === null) {
      return;
    }

    const guideY = rowY + this.currentRowResizeState.displayHeight;

    this.ctx.save();
    this.ctx.strokeStyle = this.theme.row.resizeGuideColor;
    this.ctx.lineWidth = this.theme.row.resizeGuideWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(0, guideY);
    this.ctx.lineTo(viewportWidth, guideY);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private renderColumnReorderIndicator(
    state: {
      dragColumnIndex: number;
      dragColumnKey: string;
      dragStartX: number;
      currentX: number;
      targetColumnIndex: number;
      isParentColumn?: boolean;
    },
    rows: Row[],
    visibleRange: VisibleRange,
    scrollTop: number,
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const viewportHeight = this.canvas.height / this.dpr;

    const column = this.layoutManager.getColumnByKey(state.dragColumnKey);
    const dragColWidth = column ? this.layoutManager.getColumnWidth(column) : 100;

    const ghostX = state.currentX - dragColWidth / 2;

    this.ctx.save();
    this.ctx.globalAlpha = 0.7;

    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(ghostX, 0, dragColWidth, viewportHeight);

    this.ctx.strokeStyle = this.theme.colors.button.primaryBg;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(ghostX, 0, dragColWidth, viewportHeight);
    this.ctx.setLineDash([]);

    if (state.isParentColumn && column && column.children && column.children.length > 0) {
      this.renderParentColumnGhost(column, ghostX, headerHeight);
      this.renderParentColumnRowsGhost(column, ghostX, headerHeight, rows, visibleRange, scrollTop);
    } else if (column) {
      this.renderLeafColumnGhost(column, ghostX, 0, headerHeight);
      this.renderLeafColumnRowsGhost(column, ghostX, headerHeight, rows, visibleRange, scrollTop);
    }

    this.ctx.restore();
  }

  private renderParentColumnGhost(column: Column, ghostX: number, headerHeight: number): void {
    const colDepth = column.depth ?? 0;
    const rowHeight = this.theme.row.headerHeight;
    const parentHeaderY = colDepth * rowHeight;
    const parentHeaderHeight = rowHeight;
    const totalWidth = this.layoutManager.getColumnWidth(column);

    this.ctx.fillStyle = this.theme.colors.button.primaryBg;
    this.ctx.fillRect(ghostX, parentHeaderY, totalWidth, parentHeaderHeight);

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(ghostX, parentHeaderY, totalWidth, parentHeaderHeight);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const text = column.title;
    const textWidth = this.ctx.measureText(text).width;
    const textX = ghostX + (totalWidth - textWidth) / 2;
    this.ctx.fillText(text, textX, parentHeaderY + parentHeaderHeight / 2);

    this.renderChildColumnsGhost(column, ghostX, colDepth + 1, headerHeight);
  }

  private renderChildColumnsGhost(
    column: Column,
    startX: number,
    depth: number,
    headerHeight: number,
  ): void {
    if (!column.children || column.children.length === 0) return;

    const rowHeight = this.theme.row.headerHeight;
    let currentX = startX;

    for (const child of column.children) {
      const childWidth = this.layoutManager.getColumnWidth(child);

      if (child.children && child.children.length > 0) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        const headerY = depth * rowHeight;
        const headerH = rowHeight;
        this.ctx.fillRect(currentX, headerY, childWidth, headerH);

        this.ctx.strokeStyle = this.theme.colors.cellBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(currentX, headerY, childWidth, headerH);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";
        const text = child.title;
        const textWidth = this.ctx.measureText(text).width;
        const textX = currentX + (childWidth - textWidth) / 2;
        this.ctx.fillText(text, textX, headerY + headerH / 2);

        this.renderChildColumnsGhost(child, currentX, depth + 1, headerHeight);
      } else {
        this.renderLeafColumnGhost(child, currentX, depth, headerHeight);
      }

      currentX += childWidth;
    }
  }

  private renderLeafColumnGhost(
    column: Column,
    ghostX: number,
    depth: number,
    headerHeight: number,
  ): void {
    const rowHeight = this.theme.row.headerHeight;
    const colWidth = this.layoutManager.getColumnWidth(column);
    const headerY = depth * rowHeight;
    const headerH = headerHeight - headerY;

    this.ctx.fillStyle = this.theme.colors.button.primaryBg;
    this.ctx.fillRect(ghostX, headerY, colWidth, headerH);

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(ghostX, headerY, colWidth, headerH);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const text = column.title;
    const textWidth = this.ctx.measureText(text).width;
    const textX = ghostX + (colWidth - textWidth) / 2;
    this.ctx.fillText(text, textX, headerY + headerH / 2);
  }

  private isDescendantOfColumn(column: Column, ancestorKey: string): boolean {
    if (column.key === ancestorKey) {
      return true;
    }
    if (column.parentKey === ancestorKey) {
      return true;
    }
    if (column.parentKey) {
      const parent = this.layoutManager.getColumnByKey(column.parentKey);
      if (parent) {
        return this.isDescendantOfColumn(parent, ancestorKey);
      }
    }
    return false;
  }

  private renderLeafColumnRowsGhost(
    column: Column,
    ghostX: number,
    headerHeight: number,
    rows: Row[],
    visibleRange: VisibleRange,
    scrollTop: number,
  ): void {
    const colWidth = this.layoutManager.getColumnWidth(column);
    const { startRow, endRow } = visibleRange;

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;

      const absY = this.layoutManager.getRowOffset(rowIndex);
      const rowHeight = this.layoutManager.getRowHeightByIndex(rowIndex);
      const y = absY - scrollTop;

      if (y + rowHeight < headerHeight || y > this.canvas.height / this.dpr) {
        continue;
      }

      this.ctx.fillStyle = this.theme.colors.rowBackground;
      this.ctx.fillRect(ghostX, y, colWidth, rowHeight);

      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(ghostX, y + rowHeight);
      this.ctx.lineTo(ghostX + colWidth, y + rowHeight);
      this.ctx.stroke();

      const value = row.data[getColumnField(column)];
      this.renderGhostCellValue(column, row, rowIndex, value, ghostX, y, colWidth, rowHeight);
    }
  }

  private renderParentColumnRowsGhost(
    column: Column,
    ghostX: number,
    headerHeight: number,
    rows: Row[],
    visibleRange: VisibleRange,
    scrollTop: number,
  ): void {
    if (!column.children || column.children.length === 0) return;

    let currentX = ghostX;
    for (const child of column.children) {
      const childWidth = this.layoutManager.getColumnWidth(child);

      if (child.children && child.children.length > 0) {
        this.renderParentColumnRowsGhost(
          child,
          currentX,
          headerHeight,
          rows,
          visibleRange,
          scrollTop,
        );
      } else {
        this.renderLeafColumnRowsGhost(
          child,
          currentX,
          headerHeight,
          rows,
          visibleRange,
          scrollTop,
        );
      }

      currentX += childWidth;
    }
  }

  private renderGhostCellValue(
    column: Column,
    row: Row,
    rowIndex: number,
    value: unknown,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const padding = 8;

    // 获取渲染结果
    let renderResult: RenderResult = {
      text: this.formatValue(value, column, row),
      type: column.type ?? "text",
    };

    if (column.render) {
      try {
        const customResult = column.render(value, row, column, rowIndex);
        if (customResult) {
          renderResult = { ...renderResult, ...customResult };
        }
      } catch (error) {
        console.error(`Error rendering ghost cell:`, error);
        renderResult = { text: "[Error]", type: "text" };
      }
    }

    // 计算禁用状态
    const isDisabled = resolveDisabled(column.disabled, row, column);

    // 使用统一的渲染方法
    this.renderCellContent(
      renderResult,
      x,
      y,
      width,
      height,
      padding,
      column.align,
      rowIndex,
      undefined,
      isDisabled,
      column.key,
    );
  }

  // ==================== 缓存管理方法 ====================

  /**
   * 清空渲染缓存
   */
  clearRenderCache(): void {
    if (this.renderCache) {
      this.renderCache.clear();
    }
  }

  /**
   * 重置行 ID 管理器
   */
  resetRowIds(): void {
    if (this.renderCache) {
      this.renderCache.resetRowIds();
    }
    this.rowIdManager.reset();
  }

  /**
   * 重置列 ID 管理器
   */
  resetColumnIds(): void {
    if (this.renderCache) {
      this.renderCache.resetColumnIds();
    }
    this.columnIdManager.reset();
  }

  /**
   * 清理不可见行的缓存
   */
  cleanupInvisibleRows(visibleRowIds: Set<string>): void {
    if (this.renderCache) {
      this.renderCache.cleanupInvisibleRows(visibleRowIds);
    }
  }

  /**
   * 清理不可见列的缓存
   */
  cleanupInvisibleColumns(visibleColumnIds: Set<string>): void {
    if (this.renderCache) {
      this.renderCache.cleanupInvisibleColumns(visibleColumnIds);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    cellCacheSize: number;
    valueCacheSize: number;
    maxCellCacheSize: number;
  } | null {
    return this.renderCache?.getStats() ?? null;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.dirtyRegions = [];
    // 清理图片加载队列
    this.imageLoadQueue.destroy();
    // 清理渲染缓存
    if (this.renderCache) {
      this.renderCache.clear();
    }
  }
}
