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
  DisabledValue,
  DateDropdownState,
  ContextMenuState,
  HeaderContextMenuState,
  ImageConfig,
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
import {
  truncateText,
  getDevicePixelRatio,
  resolveDisabled,
  getColumnField,
  calculateMaxTextRows,
  layoutWrappedText,
} from "../utils";
import { CTRenderer, LayoutEngine, MeasurementEngine } from "./jsx";
import { zhCN } from "../locale";

const STANDARD_ROW_HEIGHT = 32;

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
  private watermarkConfig: WatermarkConfig | null = null;
  private expandColumnKey: string | null = null;
  private currentSwitchAnimations: Map<string, SwitchAnimationState> | undefined;
  private currentButtonHoverStates: Map<string, ButtonHoverState> | undefined;
  private hoveredPlaceholderColumnIndex: number = -1;
  private isDestroyed = false;

  // 多选列分隔符
  private multipleSelectSeparator: string = ", ";

  // 图片加载队列（延迟加载 + 请求取消）
  private imageLoadQueue: ImageLoadQueue;

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
  private performanceStats: Map<string, { totalTime: number; count: number; maxTime: number }> =
    new Map();
  private frameStartTime: number = 0;
  private frameCount: number = 0;
  private lastReportTime: number = 0;

  // 当前帧统计
  private currentFrameStats: Map<string, { totalTime: number; count: number }> = new Map();
  // 上一帧统计（用于报告）
  private lastFrameStats: Map<string, { totalTime: number; count: number }> = new Map();

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

    // 初始化图片加载队列（使用默认配置）
    this.imageLoadQueue = new ImageLoadQueue();
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
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
    this.dropdownRenderer.setTheme(theme);
    this.filterDropdownRenderer.setTheme(theme);
    this.imageOverlayRenderer.setTheme(theme);
    this.overlayRenderer.setTheme(theme);
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
    this.watermarkConfig = config;
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
  }

  markDirty(x: number, y: number, width: number, height: number): void {
    this.dirtyRegions.push({ x, y, width, height });
  }

  markFullRedraw(): void {}

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

    // 开始性能监控帧
    this.beginFrame();

    // 保存可视区域信息用于图片懒加载
    this.currentVisibleRange = visibleRange;
    this.currentRows = rows;
    this.currentScrollTop = scrollTop;
    this.rowHeight = this.theme.row.height;

    const { startRow, endRow } = visibleRange;
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.background;
    this.ctx.fillRect(0, 0, viewportWidth, viewportHeight);

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
    this.ctx.beginPath();
    this.ctx.rect(centerStartX, 0, centerEndX - centerStartX, viewportHeight);
    this.ctx.clip();

    if (renderBands) {
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
      );
    } else {
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
    }

    this.ctx.restore();

    this.renderCenterSelections(options.selectedCells, scrollLeft, scrollTop, centerColumnIndices);

    if (options.showHeader) {
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
    }

    if (hasLeftFixed && !renderBands) {
      this.renderFixedColumnsContent(
        leafColumns,
        rows,
        leftFixedIndices,
        0,
        scrollTop,
        visibleRange,
        options,
      );
    }

    if (hasRightFixed && !renderBands) {
      this.renderFixedColumnsContent(
        leafColumns,
        rows,
        rightFixedIndices,
        viewportWidth - fixedInfo.rightFixed.width,
        scrollTop,
        visibleRange,
        options,
      );
    }

    if (renderBands && (hasLeftFixed || hasRightFixed)) {
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
      );
    }

    this.renderFixedSelections(
      options.selectedCells,
      scrollTop,
      leftFixedIndices,
      rightFixedIndices,
    );

    if (options.showHeader) {
      if (hasLeftFixed) {
        this.renderFixedColumnsHeader(
          leafColumns,
          leftFixedIndices,
          0,
          options.sortConfig,
          options.filterConfig,
          options.hoveredHeaderColumnKey,
          options.columnReorderState,
        );
      }

      if (hasRightFixed) {
        this.renderFixedColumnsHeader(
          leafColumns,
          rightFixedIndices,
          viewportWidth - fixedInfo.rightFixed.width,
          options.sortConfig,
          options.filterConfig,
          options.hoveredHeaderColumnKey,
          options.columnReorderState,
        );
      }
    }

    this.renderRowResizeGuide(viewportWidth);

    if (options.dropdown) {
      this.renderDropdown(options.dropdown);
    }

    if (options.headerContextMenu) {
      this.renderHeaderContextMenu(options.headerContextMenu);
    }

    if (options.columnReorderState) {
      this.renderColumnReorderIndicator(options.columnReorderState, rows, visibleRange, scrollTop);
    }

    this.ctx.restore();

    // 提交当前帧可见图片集合，取消不可见图片的加载请求
    this.commitVisibleImages();

    this.dirtyRegions = [];
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

    for (let bandRowIndex = startIndex; bandRowIndex <= endIndex; bandRowIndex++) {
      const row = band.rows[bandRowIndex];
      if (!row) {
        continue;
      }

      const rowIndex = this.layoutManager.getRowIndexByRef(row);
      if (rowIndex < 0) {
        continue;
      }

      const rowHeight = this.layoutManager.getRowHeightByIndex(rowIndex);
      if (band.type === "body") {
        y = band.y - scrollTop + (this.layoutManager.getRowBandOffsetByRef(row) ?? 0);
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
        const column = this.layoutManager.getLeafColumn(colIndex);
        if (!column) continue;

        const width = this.layoutManager.getColumnWidthByIndex(colIndex);
        const x =
          startX !== undefined
            ? startX +
              this.layoutManager.getColumnOffset(colIndex) -
              this.layoutManager.getColumnOffset(columnIndices[0]!)
            : this.layoutManager.getColumnOffset(colIndex) - scrollLeft;

        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(x, y, width, rowHeight);
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
        );
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
  ): void {
    const rowBands = this.layoutManager.getRowBandsForRender();
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
      );
    }
    for (const band of summaryBands) {
      this.renderSummaryBandCells(band, centerColumnIndices, scrollLeft);
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
        );
      }
      for (const band of summaryBands) {
        this.renderSummaryBandCells(band, leftFixedIndices, scrollLeft, 0);
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
        );
      }
      for (const band of summaryBands) {
        this.renderSummaryBandCells(
          band,
          rightFixedIndices,
          scrollLeft,
          viewportWidth - fixedInfo.rightFixed.width,
        );
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

    // 结束性能监控帧
    this.endFrame();

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
  ): void {
    this.renderCellInternal(column, row, rowIndex, colIndex, value, x, y, width, height, options);
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
  ): void {
    const padding = 8;

    // 检查是否是隐藏占位列
    if (column.key.startsWith("__hidden_placeholder__")) {
      // 检查整列是否悬浮（当前列是悬浮的占位列）
      const isColumnHovered = this.hoveredPlaceholderColumnIndex === colIndex;

      // 绘制背景 - 悬浮时整列高亮
      this.ctx.fillStyle = isColumnHovered
        ? this.theme.colors.hiddenPlaceholder.hoverBg
        : this.theme.colors.rowBackground;
      this.ctx.fillRect(x, y, width, height);

      // 绘制边框
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.beginPath();
      this.ctx.moveTo(x + width, y);
      this.ctx.lineTo(x + width, y + height);
      this.ctx.stroke();

      return;
    }

    // Check if cell is disabled
    const isDisabled = this.resolveDisabled(column.disabled, row, column);

    // 确定缓存模式
    const cacheMode = this.getCacheMode(column);
    let renderResult: RenderResult;

    // 尝试从缓存获取
    if (this.renderCache && cacheMode !== false) {
      const cached = this.renderCache.get(row, column, value, cacheMode);
      if (cached) {
        renderResult = cached;
      } else {
        // 缓存未命中，执行渲染
        renderResult = this.executeRender(column, row, rowIndex, value);

        // 存入缓存
        this.renderCache.set(row, column, value, renderResult, cacheMode);
      }
    } else {
      // 不使用缓存，直接渲染
      renderResult = this.executeRender(column, row, rowIndex, value);
    }

    const isCellSelected = this.isCellSelected(rowIndex, colIndex, options.selectedCells);
    const isHovered =
      options.hoveredCell?.rowIndex === rowIndex && options.hoveredCell?.columnIndex === colIndex;
    const isEditing =
      options.editingCell?.rowIndex === rowIndex && options.editingCell?.columnIndex === colIndex;

    if (isCellSelected && !row.selected) {
      this.ctx.fillStyle = this.theme.colors.rowSelectedBackground;
      this.ctx.fillRect(x, y, width, height);
    } else if (isHovered && !row.selected) {
      this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
      this.ctx.fillRect(x, y, width, height);
    }

    if (!isEditing) {
      const isExpandColumn = this.expandColumnKey === column.key;
      const hasChildren = row.children && row.children.length > 0;
      const level = row.level ?? 0;

      if (isExpandColumn && hasChildren) {
        this.renderExpandIcon(x, y, width, height, row.expanded ?? false, level);
        const iconWidth = 12 + padding;
        const levelIndent = level * 16;
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
        );
      } else {
        const levelIndent = isExpandColumn ? level * 16 : 0;
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
        );
      }
    }

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(x, y, width, height);

    const validationError = this.currentValidationErrors.get(`${rowIndex}-${colIndex}`);
    if (validationError) {
      const outlineWidth = Math.max(this.theme.border.width, 2);
      const inset = outlineWidth / 2;
      this.ctx.strokeStyle =
        validationError.level === "warning"
          ? (this.theme.colors.tagColors.warning ?? "#faad14")
          : (this.theme.colors.tagColors.error ?? "#ff4d4f");
      this.ctx.lineWidth = outlineWidth;
      this.ctx.strokeRect(x + inset, y + inset, width - outlineWidth, height - outlineWidth);
    } else if (this.currentPendingValidations.has(`${rowIndex}-${colIndex}`)) {
      // Pending async validation — pulsing blue border
      const outlineWidth = Math.max(this.theme.border.width, 2);
      const inset = outlineWidth / 2;
      const pulsePhase = (Date.now() % 1500) / 1500;
      const alpha = 0.3 + 0.4 * Math.sin(pulsePhase * Math.PI * 2);
      this.ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
      this.ctx.lineWidth = outlineWidth;
      this.ctx.strokeRect(x + inset, y + inset, width - outlineWidth, height - outlineWidth);
    }

    // Apply disabled overlay
    if (isDisabled) {
      // Use appropriate overlay color based on theme
      const overlayColor =
        this.theme.name === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.35)";
      this.ctx.fillStyle = overlayColor;
      this.ctx.fillRect(x, y, width, height);
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
  private executeRender(column: Column, row: Row, rowIndex: number, value: unknown): RenderResult {
    let renderResult: RenderResult = {
      text: this.formatValue(value, column, row),
      type: column.type ?? "text",
    };

    // number 类型：将 column.placeholder 传入 renderResult，供占位符渲染使用
    if (column.type === "number") {
      renderResult.placeholder = column.placeholder ?? this.locale.cell.numberPlaceholder;
    }

    if (column.render) {
      try {
        const customResult = column.render(value, row, column, rowIndex);
        if (customResult) {
          renderResult = { ...renderResult, ...customResult };
        }
      } catch (error) {
        console.error(`Error rendering cell at row ${rowIndex}, column ${column.key}:`, error);
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
      isHovered?: boolean;
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
  ): void {
    // 保存 canvas 状态，确保所有渲染操作不会影响后续单元格
    this.ctx.save();
    try {
      const { text, type, style, checkbox, radio, button, input, tags, link } = renderResult;

      const fontSize = style?.fontSize ?? this.theme.font.size;
      const fontFamily = style?.fontFamily ?? this.theme.font.family;
      const fontWeight = style?.fontWeight ?? "normal";
      const fontStyle = style?.fontStyle ?? "normal";

      this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

      if (type === CellTypes.CHECKBOX && checkbox) {
        this.measureRender("checkbox", () => {
          this.renderWithCellRenderer("checkbox", checkbox, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.RADIO && radio) {
        this.measureRender("radio", () => {
          this.renderWithCellRenderer("radio", radio, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.BUTTON && button) {
        let buttonHoverState: ButtonHoverState | undefined;
        if (rowIndex !== undefined && colIndex !== undefined && this.currentButtonHoverStates) {
          const cellKey = `${rowIndex}-${colIndex}`;
          const hoverState = this.currentButtonHoverStates.get(cellKey);
          if (hoverState) {
            buttonHoverState = hoverState;
          }
        }
        this.measureRender("button", () => {
          this.renderWithCellRenderer("button", button, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
            buttonHoverState,
          });
        });
        return;
      }

      if (type === CellTypes.BUTTONS && renderResult.buttons) {
        let hoveredButtonIndex = -1;
        if (rowIndex !== undefined && colIndex !== undefined) {
          const isCurrentCellHovered =
            this.currentHoveredCell?.rowIndex === rowIndex &&
            this.currentHoveredCell?.columnIndex === colIndex;
          if (isCurrentCellHovered) {
            hoveredButtonIndex = this.currentHoveredButtonIndex;
          }
        }
        this.measureRender("buttons", () => {
          this.renderWithCellRenderer("buttons", renderResult.buttons!, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
            hoveredButtonIndex,
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
        this.measureRender("switch", () => {
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
        this.measureRender("input", () => {
          this.renderWithCellRenderer("input", input, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.SELECT && renderResult.select) {
        this.measureRender("select", () => {
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
        this.measureRender("date", () => {
          this.renderWithCellRenderer("date", renderResult.date!, x, y, width, height, {
            rowIndex,
            colIndex,
            isDisabled,
          });
        });
        return;
      }

      if (type === CellTypes.TAG && tags) {
        this.measureRender("tags", () => {
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
        this.measureRender("image", () =>
          this.renderImage(x, y, width, height, renderResult.image!, rowIndex, isHovered),
        );
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

        this.measureRender("progress", () => {
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
        this.measureRender("rating", () => {
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
        this.measureRender("color", () => {
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
        this.measureRender("jsx", () => {
          // 强制保存完整 Canvas 状态，JSX 渲染完全隔离
          this.ctx.save();
          try {
            const elementTree = renderResult.jsxRender!();
            const measurementEngine = new MeasurementEngine(this.ctx);
            const layoutEngine = new LayoutEngine(measurementEngine);
            const ctRenderer = new CTRenderer(this.ctx, layoutEngine, this.theme);
            ctRenderer.render(elementTree, x, y, { width, height });
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
        this.measureRender("custom", () => {
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
      this.measureRender("text", () => {
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

  private renderImage(
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ImageConfig,
    rowIndex?: number,
    isHovered?: boolean,
  ): void {
    // 多图模式
    if (config.images && config.images.length > 0) {
      this.renderMultipleImages(x, y, cellWidth, cellHeight, config, rowIndex, isHovered);
      return;
    }

    // 单图模式 - 如果没有图片源则不渲染
    if (!config.src) {
      return;
    }

    const padding = 4; // 单元格内边距
    const maxImgSize = this.getMaxImageSize(cellWidth, cellHeight, padding, config);
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    // 限制图片大小不超过单元格可用空间
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const borderRadius = config.circle
      ? Math.min(imgWidth, imgHeight) / 2
      : (config.borderRadius ?? 0);

    // 计算图片居中位置
    const imgX = x + (cellWidth - imgWidth) / 2;
    const imgY = y + (cellHeight - imgHeight) / 2;

    // 绘制占位背景
    this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
    } else {
      this.ctx.rect(imgX, imgY, imgWidth, imgHeight);
    }
    this.ctx.fill();

    // 如果有图片源
    if (config.src) {
      // 检查是否在懒加载范围内
      const lazyEnabled = config.lazy !== false; // 默认开启懒加载
      const threshold = config.lazyThreshold ?? 200;

      if (lazyEnabled && rowIndex !== undefined && this.currentVisibleRange) {
        const inLazyRange = this.isInLazyLoadRange(rowIndex, threshold);
        if (!inLazyRange) {
          // 不在懒加载范围内，只显示占位图
          this.renderImagePlaceholder(
            imgX,
            imgY,
            imgWidth,
            imgHeight,
            borderRadius,
            config.placeholder,
          );
          // Hover 效果
          if (isHovered && config.hoverable !== false) {
            this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
          }
          return;
        }
      }

      // 检查是否加载失败
      if (this.imageLoadQueue.isFailed(config.src)) {
        // 加载失败，显示错误图片
        this.renderImageError(imgX, imgY, imgWidth, imgHeight, borderRadius, config.errorImage);
        return;
      }

      const cachedImage = this.imageLoadQueue.get(config.src, Math.max(imgWidth, imgHeight));

      if (cachedImage) {
        // 图片已加载，绘制图片
        this.ctx.save();

        // 创建裁剪路径
        this.ctx.beginPath();
        if (borderRadius > 0) {
          this.ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
        } else {
          this.ctx.rect(imgX, imgY, imgWidth, imgHeight);
        }
        this.ctx.clip();

        // 根据fit模式绘制图片
        this.drawImageWithFit(cachedImage, imgX, imgY, imgWidth, imgHeight, config.fit ?? "cover");

        this.ctx.restore();

        // 收集可见图片
        this.collectVisibleImage(config.src);
      } else if (!this.imageLoadQueue.isLoading(config.src)) {
        this.collectVisibleImage(config.src);
        // 图片未加载，开始加载（传递渲染尺寸用于预缩放）
        this.loadImage(config.src, Math.max(imgWidth, imgHeight));
        // 显示占位图
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      } else {
        // 图片正在加载中，显示占位图
        // 注意：仍然需要收集可见图片，防止被 cancelInvisible 取消
        this.collectVisibleImage(config.src);
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      }
    } else {
      // 没有图片源，显示占位图
      this.renderImagePlaceholder(
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
      );
    }

    // Hover 效果
    if (isHovered && config.hoverable !== false) {
      this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
    }
  }

  private getMaxImageSize(
    cellWidth: number,
    cellHeight: number,
    padding: number,
    config: ImageConfig,
  ): number {
    const maxHeight =
      config.scaleWithRowHeight === false ? Math.min(cellHeight, STANDARD_ROW_HEIGHT) : cellHeight;

    return Math.max(0, Math.min(cellWidth, maxHeight) - padding * 2);
  }

  private renderMultipleImages(
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ImageConfig,
    rowIndex?: number,
    isHovered?: boolean,
  ): void {
    const images = config.images!;
    const padding = 4; // 单元格内边距
    const maxImgSize = this.getMaxImageSize(cellWidth, cellHeight, padding, config);
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    // 限制图片大小不超过单元格可用空间
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const gap = config.gap ?? 4;
    const borderRadius = config.circle
      ? Math.min(imgWidth, imgHeight) / 2
      : (config.borderRadius ?? 0);
    const showMoreCount = config.showMoreCount !== false;

    // 根据单元格宽度和高度计算能显示的图片数量（支持多行）
    const availableWidth = cellWidth - padding * 2;
    const availableHeight = cellHeight - padding * 2;

    // 每行能显示几个图片
    const imagesPerRow = Math.max(1, Math.floor((availableWidth + gap) / (imgWidth + gap)));
    // 能显示几行
    const maxRows = Math.max(1, Math.floor((availableHeight + gap) / (imgHeight + gap)));

    const slotCapacity = imagesPerRow * maxRows;
    const requestedMaxVisible = config.maxVisible ?? slotCapacity;
    const needsMoreCount = showMoreCount && images.length > requestedMaxVisible;
    const maxVisibleCapacity = needsMoreCount ? Math.max(1, slotCapacity - 1) : slotCapacity;
    const maxVisible = Math.max(1, Math.min(requestedMaxVisible, maxVisibleCapacity));

    // 检查是否在懒加载范围内
    const lazyEnabled = config.lazy !== false;
    const threshold = config.lazyThreshold ?? 200;
    let inLazyRange = true;
    if (lazyEnabled && rowIndex !== undefined && this.currentVisibleRange) {
      inLazyRange = this.isInLazyLoadRange(rowIndex, threshold);
    }

    // 计算需要显示的图片
    const hasMore = images.length > maxVisible;
    const displayCount = hasMore ? maxVisible : images.length;
    const displayImages = images.slice(0, displayCount);
    const moreCount = hasMore ? images.length - maxVisible : 0;

    const renderItemCount = displayCount + (hasMore && showMoreCount ? 1 : 0);
    const displayRows = Math.max(1, Math.ceil(renderItemCount / imagesPerRow));
    const widestRowItems = Math.min(renderItemCount, imagesPerRow);
    const contentWidth = widestRowItems * imgWidth + Math.max(0, widestRowItems - 1) * gap;
    const contentHeight = displayRows * imgHeight + Math.max(0, displayRows - 1) * gap;

    // 居中定位
    let startX = x + (cellWidth - contentWidth) / 2;
    startX = Math.max(x + padding, startX);
    const startY = y + (cellHeight - contentHeight) / 2;

    // 渲染每张图片（多行布局）
    for (let i = 0; i < displayImages.length; i++) {
      const src = displayImages[i]!;
      const row = Math.floor(i / imagesPerRow);
      const col = i % imagesPerRow;
      const imgX = startX + col * (imgWidth + gap);
      const imgY = startY + row * (imgHeight + gap);
      const isCurrentHovered =
        isHovered && config.hoverable !== false && this.currentHoveredImageIndex === i;

      // 绘制占位背景
      this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
      this.ctx.beginPath();
      if (borderRadius > 0) {
        this.ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
      } else {
        this.ctx.rect(imgX, imgY, imgWidth, imgHeight);
      }
      this.ctx.fill();

      if (!inLazyRange) {
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
        if (isCurrentHovered) {
          this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }

      // 检查是否加载失败
      if (this.imageLoadQueue.isFailed(src)) {
        this.renderImageError(imgX, imgY, imgWidth, imgHeight, borderRadius, config.errorImage);
        if (isCurrentHovered) {
          this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }

      const cachedImage = this.imageLoadQueue.get(src, Math.max(imgWidth, imgHeight));
      if (cachedImage) {
        // 图片已加载，绘制
        this.ctx.save();
        this.ctx.beginPath();
        if (borderRadius > 0) {
          this.ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
        } else {
          this.ctx.rect(imgX, imgY, imgWidth, imgHeight);
        }
        this.ctx.clip();
        this.drawImageWithFit(cachedImage, imgX, imgY, imgWidth, imgHeight, config.fit ?? "cover");
        this.ctx.restore();

        // 收集可见图片
        this.collectVisibleImage(src);
      } else if (!this.imageLoadQueue.isLoading(src)) {
        this.collectVisibleImage(src);
        this.loadImage(src, Math.max(imgWidth, imgHeight));
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      } else {
        // 图片正在加载中，显示占位图
        // 注意：仍然需要收集可见图片，防止被 cancelInvisible 取消
        this.collectVisibleImage(src);
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      }

      // 单个图片的 hover 效果
      if (isCurrentHovered) {
        this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
      }
    }

    // 渲染 +N 计数（替换最后一张图片或追加）
    if (hasMore && showMoreCount) {
      // 计算最后一个位置的行和列
      const lastRow = Math.floor(displayCount / imagesPerRow);
      const lastCol = displayCount % imagesPerRow;
      const countX = startX + lastCol * (imgWidth + gap);
      const countY = startY + lastRow * (imgHeight + gap);
      const isMoreHovered =
        isHovered && config.hoverable !== false && this.currentHoveredImageIndex === displayCount;
      this.renderMoreCount(
        countX,
        countY,
        imgWidth,
        imgHeight,
        borderRadius,
        moreCount,
        isMoreHovered,
      );
    }
  }

  private renderMoreCount(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    count: number,
    isHovered?: boolean,
  ): void {
    // 绘制半透明背景
    this.ctx.fillStyle = isHovered
      ? this.theme.colors.image.hoverBorder
      : this.theme.colors.moreCount.background;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.fill();

    // 绘制 +N 文字
    const text = `+${count}`;
    this.ctx.fillStyle = this.theme.colors.moreCount.text;
    this.ctx.font = `bold ${Math.min(width, height) * 0.4}px ${this.theme.font.family}`;

    // 保存当前对齐设置
    const prevAlign = this.ctx.textAlign;
    const prevBaseline = this.ctx.textBaseline;

    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(text, x + width / 2, y + height / 2);

    // 恢复对齐设置
    this.ctx.textAlign = prevAlign;
    this.ctx.textBaseline = prevBaseline;
  }

  private renderImageHover(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
  ): void {
    const hoverBorderColor = this.theme.colors.image.hoverBorder;

    // 保存当前状态
    const prevStrokeStyle = this.ctx.strokeStyle;
    const prevLineWidth = this.ctx.lineWidth;

    // 绘制 hover 边框
    this.ctx.strokeStyle = hoverBorderColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.stroke();

    // 绘制 hover 阴影效果（外发光）
    this.ctx.save();
    this.ctx.shadowColor = this.theme.colors.image.hoverShadow;
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.strokeStyle = hoverBorderColor;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.stroke();
    this.ctx.restore();

    // 恢复状态
    this.ctx.strokeStyle = prevStrokeStyle;
    this.ctx.lineWidth = prevLineWidth;
  }

  private renderImagePlaceholder(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    placeholder?: string,
  ): void {
    if (placeholder) {
      // 如果有占位图配置，尝试加载
      const cachedPlaceholder = this.imageLoadQueue.get(placeholder, Math.max(width, height));
      if (cachedPlaceholder) {
        this.ctx.save();
        this.ctx.beginPath();
        if (borderRadius > 0) {
          this.ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          this.ctx.rect(x, y, width, height);
        }
        this.ctx.clip();
        this.drawImageWithFit(cachedPlaceholder, x, y, width, height, "cover");
        this.ctx.restore();
        return;
      } else if (!this.imageLoadQueue.isLoading(placeholder)) {
        this.loadImage(placeholder, Math.max(width, height));
      }
    }

    // 显示默认图标背景
    this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.fill();

    // 绘制图片图标
    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + width / 2;
    const iconY = y + height / 2;

    // 保存当前状态
    const prevStrokeStyle = this.ctx.strokeStyle;
    const prevLineWidth = this.ctx.lineWidth;

    this.ctx.strokeStyle = this.theme.colors.placeholderText;
    this.ctx.lineWidth = 1.5;

    // 简单的图片图标
    this.ctx.beginPath();
    this.ctx.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    this.ctx.stroke();

    // 山形
    this.ctx.beginPath();
    this.ctx.moveTo(iconX - iconSize / 2, iconY + iconSize / 4);
    this.ctx.lineTo(iconX - iconSize / 4, iconY);
    this.ctx.lineTo(iconX, iconY + iconSize / 4);
    this.ctx.lineTo(iconX + iconSize / 4, iconY - iconSize / 4);
    this.ctx.lineTo(iconX + iconSize / 2, iconY + iconSize / 4);
    this.ctx.stroke();

    // 恢复状态
    this.ctx.strokeStyle = prevStrokeStyle;
    this.ctx.lineWidth = prevLineWidth;
  }

  private renderImageError(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    errorImage?: string,
  ): void {
    // 如果有错误图片配置，尝试显示
    if (errorImage) {
      const cachedErrorImage = this.imageLoadQueue.get(errorImage, Math.max(width, height));
      if (cachedErrorImage) {
        this.ctx.save();
        this.ctx.beginPath();
        if (borderRadius > 0) {
          this.ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          this.ctx.rect(x, y, width, height);
        }
        this.ctx.clip();
        this.drawImageWithFit(cachedErrorImage, x, y, width, height, "cover");
        this.ctx.restore();
        return;
      } else if (
        !this.imageLoadQueue.isLoading(errorImage) &&
        !this.imageLoadQueue.isFailed(errorImage)
      ) {
        this.loadImage(errorImage, Math.max(width, height));
      }
    }

    // 显示错误背景
    this.ctx.fillStyle = this.theme.colors.image.errorBg;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.fill();

    // 绘制错误图标（破损图片 + X）
    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + width / 2;
    const iconY = y + height / 2;

    // 保存当前状态
    const prevStrokeStyle = this.ctx.strokeStyle;
    const prevLineWidth = this.ctx.lineWidth;

    // 破损图片轮廓
    this.ctx.strokeStyle = this.theme.colors.image.errorBorder;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    this.ctx.stroke();

    // X 标记
    this.ctx.beginPath();
    this.ctx.moveTo(iconX - iconSize / 4, iconY - iconSize / 4);
    this.ctx.lineTo(iconX + iconSize / 4, iconY + iconSize / 4);
    this.ctx.moveTo(iconX + iconSize / 4, iconY - iconSize / 4);
    this.ctx.lineTo(iconX - iconSize / 4, iconY + iconSize / 4);
    this.ctx.stroke();

    // 恢复状态
    this.ctx.strokeStyle = prevStrokeStyle;
    this.ctx.lineWidth = prevLineWidth;
  }

  private drawImageWithFit(
    img: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    containerWidth: number,
    containerHeight: number,
    fit: "fill" | "contain" | "cover" | "none",
  ): void {
    const imgRatio = img.width / img.height;
    const containerRatio = containerWidth / containerHeight;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    switch (fit) {
      case "fill":
        // 拉伸填充
        drawWidth = containerWidth;
        drawHeight = containerHeight;
        drawX = x;
        drawY = y;
        break;

      case "contain":
        // 包含，保持比例
        if (imgRatio > containerRatio) {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        } else {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        }
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;

      case "cover":
        // 覆盖，保持比例
        if (imgRatio > containerRatio) {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        } else {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        }
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;

      case "none":
      default:
        // 原始尺寸
        drawWidth = img.width;
        drawHeight = img.height;
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;
    }

    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
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
    this.lastFrameStats.clear();
    this.frameCount = 0;
    this.lastReportTime = 0;
  }

  /**
   * 开始帧计时
   */
  beginFrame(): void {
    if (!this.performanceEnabled) return;
    this.frameStartTime = performance.now();
    // 清空当前帧统计
    this.currentFrameStats.clear();
  }

  /**
   * 结束帧计时
   */
  endFrame(): void {
    if (!this.performanceEnabled) return;
    this.frameCount++;

    // 保存上一帧统计
    this.lastFrameStats = new Map(this.currentFrameStats);

    // 将当前帧统计累积到总统计
    for (const [type, frameStat] of this.currentFrameStats) {
      const stats = this.performanceStats.get(type) || { totalTime: 0, count: 0, maxTime: 0 };
      stats.totalTime += frameStat.totalTime;
      stats.count += frameStat.count;
      // 计算该渲染器在此帧的平均时间作为 maxTime 候选
      const avgFrameTime = frameStat.totalTime / frameStat.count;
      stats.maxTime = Math.max(stats.maxTime, avgFrameTime);
      this.performanceStats.set(type, stats);
    }
  }

  /**
   * 测量渲染类型的时间
   */
  private measureRender(type: string, fn: () => void): void {
    if (!this.performanceEnabled) {
      fn();
      return;
    }

    const start = performance.now();
    fn();
    const duration = performance.now() - start;

    // 更新当前帧统计
    const frameStats = this.currentFrameStats.get(type) || { totalTime: 0, count: 0 };
    frameStats.totalTime += duration;
    frameStats.count++;
    this.currentFrameStats.set(type, frameStats);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): Map<
    string,
    { totalTime: number; count: number; maxTime: number; avgTime: number }
  > {
    const result = new Map();
    for (const [type, stats] of this.performanceStats) {
      result.set(type, {
        ...stats,
        avgTime: stats.totalTime / stats.count,
      });
    }
    return result;
  }

  /**
   * 输出性能报告到控制台
   */
  logPerformanceReport(): void {
    if (!this.performanceEnabled) return;

    const entries = Array.from(this.performanceStats.entries())
      .map(([type, stats]) => ({
        type,
        avgTime: stats.totalTime / stats.count,
        ...stats,
      }))
      .sort((a, b) => b.avgTime - a.avgTime);

    console.group(`🎯 Renderer Performance (Frame ${this.frameCount})`);
    console.table(
      entries.map((e) => ({
        Type: e.type,
        Calls: e.count,
        "Avg(ms)": e.avgTime.toFixed(3),
        "Max(ms)": e.maxTime.toFixed(3),
        "Total(ms)": e.totalTime.toFixed(1),
      })),
    );
    console.groupEnd();
  }

  /**
   * 获取格式化的性能报告字符串
   */
  getPerformanceReport(): string {
    const lines: string[] = [
      "=== Renderer Performance Report ===",
      `Status: ${this.performanceEnabled ? "Enabled" : "Disabled"}`,
      `Total Frames: ${this.frameCount}`,
    ];

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

      const lastEntries = Array.from(this.lastFrameStats.entries())
        .map(([type, stats]) => ({
          type,
          count: stats.count,
          totalTime: stats.totalTime,
          avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
        }))
        .sort((a, b) => b.totalTime - a.totalTime);

      for (const e of lastEntries) {
        lines.push(
          `${e.type.padEnd(15)} | ` +
            `calls: ${e.count.toString().padStart(4)} | ` +
            `avg: ${e.avgTime.toFixed(3).padStart(7)}ms | ` +
            `total: ${e.totalTime.toFixed(2).padStart(6)}ms`,
        );
      }

      const lastFrameTotal = lastEntries.reduce((sum, e) => sum + e.totalTime, 0);
      lines.push("");
      lines.push(`Last frame total render time: ${lastFrameTotal.toFixed(2)}ms`);
    }

    // 总体统计
    lines.push("");
    lines.push("=== TOTAL STATS (all frames average) ===");
    lines.push("-".repeat(70));

    const totalEntries = Array.from(this.performanceStats.entries())
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        totalTime: stats.totalTime,
        maxTime: stats.maxTime,
        avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
        callsPerFrame: Math.round(stats.count / frameCount),
        avgFrameTime: stats.totalTime / frameCount,
      }))
      .sort((a, b) => b.avgFrameTime - a.avgFrameTime);

    for (const e of totalEntries) {
      lines.push(
        `${e.type.padEnd(15)} | ` +
          `avg calls/frame: ${e.callsPerFrame.toString().padStart(4)} | ` +
          `avg: ${e.avgTime.toFixed(3).padStart(7)}ms | ` +
          `max: ${e.maxTime.toFixed(3).padStart(7)}ms | ` +
          `frameTotal: ${e.avgFrameTime.toFixed(2).padStart(6)}ms`,
      );
    }

    const avgFrameTotal = totalEntries.reduce((sum, e) => sum + e.avgFrameTime, 0);
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

  private formatValue(value: unknown, column: Column, row: Row): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (column.formatter) {
      return column.formatter(value, row, column);
    }

    switch (column.type) {
      case "number":
        return typeof value === "number" ? value.toLocaleString() : String(value);
      case "boolean":
        return value ? "Yes" : "No";
      case "date":
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        return String(value);
      default:
        return String(value);
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
