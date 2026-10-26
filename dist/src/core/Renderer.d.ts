import { Column, Row, TableTheme, VisibleRange, CellPosition, CellRange, SortConfig, TooltipState, DropdownState, ScrollbarState, FilterConfig, FilterDropdownState, WatermarkConfig, SwitchAnimationState, ButtonsDropdownState, ImageTooltipState, ImageEditorState, ButtonHoverState, DateDropdownState, ContextMenuState, HeaderContextMenuState, ColorPickerDropdownState, ImageLoadConfig, CanvasTableLocale, ValidationError } from "../types";
import { LayoutManager } from "./LayoutManager";
import { RenderCache, RowIdManager, ColumnIdManager } from "./RenderCache";
import type { CTInteractiveRegion } from "./jsx";
type JSXUpdateHandlers = {
    updateValue: (rowIndex: number, column: Column, value: unknown) => Promise<void>;
    updateField: (rowIndex: number, field: string, value: unknown) => Promise<void>;
    updateRow: (rowIndex: number, data: Record<string, unknown>) => Promise<void>;
};
export declare class Renderer {
    private canvas;
    private ctx;
    private theme;
    private layoutManager;
    private locale;
    private dpr;
    private offscreenCanvas;
    private offscreenCtx;
    private cellRendererRegistry;
    private dropdownRenderer;
    private filterDropdownRenderer;
    private imageOverlayRenderer;
    private overlayRenderer;
    private dirtyRegions;
    private expandColumnKey;
    private currentSwitchAnimations;
    private currentButtonHoverStates;
    private hoveredPlaceholderColumnIndex;
    private isDestroyed;
    private multipleSelectSeparator;
    private imageLoadQueue;
    private imageRuntime;
    private imageRenderer;
    private imageRenderContext;
    private jsxMeasurementEngine;
    private jsxLayoutEngine;
    private jsxRenderer;
    private jsxInteractiveRegions;
    private jsxUpdateHandlers;
    private static readonly SHARED_PLACEHOLDER_COLUMN;
    private static readonly SHARED_PLACEHOLDER_ROW;
    /** 当前帧收集的可见图片 URL */
    private frameVisibleUrls;
    private textWidthCache;
    private textWidthCacheKey;
    private cellTextCache;
    private wrappedTextCache;
    /**
     * 根据单元格高度计算可显示行数
     */
    private calculateMaxRows;
    /**
     * 单行文本截断（带缓存）
     * 相同 (字体, 可用宽度, 文本) 直接复用截断结果与测量宽度，避免每帧重复 measureText
     */
    private measureSingleLineText;
    /**
     * 多行文本换行（带缓存）
     * 同时缓存每行宽度，供居中对齐/右对齐复用
     */
    private measureWrappedText;
    private performanceEnabled;
    private performanceStats;
    private frameStartTime;
    private frameCount;
    private frameHistory;
    private static readonly MAX_FRAME_HISTORY;
    private currentFrameStats;
    private currentFramePhases;
    private currentFrameRowBandDetails;
    private lastFrameStats;
    private currentVisibleRange;
    private currentRows;
    private currentScrollTop;
    private rowHeight;
    private currentHoveredCell;
    private currentHoveredImageIndex;
    private currentHoveredButtonIndex;
    private currentProgressDragState;
    private currentRowResizeState;
    private currentValidationErrors;
    private currentPendingValidations;
    private renderCache;
    private rowIdManager;
    private columnIdManager;
    private onImageLoaded;
    constructor(canvas: HTMLCanvasElement, theme: TableTheme, layoutManager: LayoutManager, locale?: CanvasTableLocale);
    private getContext;
    setCanvas(canvas: HTMLCanvasElement): void;
    setTheme(theme: TableTheme): void;
    setLocale(locale: CanvasTableLocale): void;
    setMultipleSelectSeparator(separator: string): void;
    /**
     * 设置图片加载配置
     */
    setImageLoadConfig(config: ImageLoadConfig): void;
    setWatermarkConfig(config: WatermarkConfig | null): void;
    setExpandColumnKey(key: string | null): void;
    /**
     * 设置渲染缓存
     */
    setRenderCache(renderCache: RenderCache): void;
    /**
     * 设置图片加载完成后的渲染触发回调
     */
    setOnImageLoaded(callback: (() => void) | null): void;
    /**
     * 获取行 ID 管理器
     */
    getRowIdManager(): RowIdManager;
    /**
     * 获取列 ID 管理器
     */
    getColumnIdManager(): ColumnIdManager;
    resize(width: number, height: number): void;
    updateTheme(theme: TableTheme): void;
    markDirty(x: number, y: number, width: number, height: number): void;
    markFullRedraw(): void;
    getJSXInteractiveRegions(): CTInteractiveRegion[];
    setJSXUpdateHandlers(handlers: JSXUpdateHandlers | null): void;
    private createJSXRenderContext;
    render(columns: Column[], rows: Row[], visibleRange: VisibleRange, scrollLeft: number, scrollTop: number, options: {
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
    }): void;
    private shouldRenderRowBands;
    /**
     * 一次行循环绘制一个 band 的 center + 左右固定列。
     * 行级信息（行索引/行高/纵坐标/背景色）每行只计算一次，
     * 背景按区域每行只填充一次，避免 center 与固定列各跑一遍行循环。
     */
    private renderBandRows;
    private renderRowBands;
    private renderSummaryBandCells;
    private getSummaryColumnX;
    private getSummaryCellSegments;
    private renderCenterHeader;
    private renderHeaderCellMultiLevel;
    private renderCenterRows;
    private renderCenterRow;
    private renderFixedColumnsContent;
    private renderFixedRowOverlay;
    private renderFixedColumnsHeader;
    private renderHeader;
    private renderHeaderCell;
    private renderDragHandle;
    private renderSortIndicator;
    private renderFilterIndicator;
    private renderRows;
    private renderRow;
    private renderCell;
    private renderCellWithPosition;
    private renderCellInternal;
    /**
     * 获取列的缓存模式
     */
    private getCacheMode;
    /**
     * 执行渲染函数
     */
    private executeRender;
    private renderCellContent;
    private renderWithCellRenderer;
    private renderCellContentInternal;
    private renderExpandIcon;
    renderButtonsDropdown(dropdown: ButtonsDropdownState): void;
    renderImageTooltip(imageTooltip: ImageTooltipState): void;
    renderImageEditor(editor: ImageEditorState): void;
    /**
     * 获取文本宽度（使用缓存优化性能）
     * 避免每帧都调用 measureText
     */
    private measureTextWidth;
    renderColorDropdown(dropdown: ColorPickerDropdownState): void;
    /**
     * 检查行是否在懒加载范围内
     */
    private isInLazyLoadRange;
    private loadImage;
    /**
     * 收集当前帧可见的图片 URL
     */
    collectVisibleImage(src: string): void;
    /**
     * 提交当前帧可见图片集合
     */
    commitVisibleImages(): void;
    /**
     * 重试加载失败的图片
     */
    retryImage(src: string): void;
    /**
     * 检查图片是否加载失败
     */
    isImageFailed(src: string): boolean;
    /**
     * 检查图片是否已加载
     */
    isImageLoaded(src: string): boolean;
    /**
     * 清除图片缓存
     */
    clearImageCache(): void;
    /**
     * 获取图片加载队列统计信息
     */
    getImageLoadStats(): {
        pending: number;
        loading: number;
        cached: number;
        failed: number;
    };
    /**
     * 获取最后一帧的诊断信息
     */
    getLastFrameDiagnostics(): any;
    /**
     * 获取最差帧的诊断信息（总时间最长的帧）
     */
    getWorstFrameDiagnostics(): any;
    /**
     * 获取完整的性能诊断信息
     */
    getPerformanceDiagnostics(): any;
    /**
     * 启用或禁用性能监控
     */
    setPerformanceMonitoring(enabled: boolean): void;
    /**
     * 检查性能监控是否启用
     */
    isPerformanceMonitoringEnabled(): boolean;
    /**
     * 重置性能统计
     */
    resetPerformanceStats(): void;
    /**
     * 开始帧计时
     */
    beginFrame(): void;
    /**
     * 结束帧计时
     */
    endFrame(visibleRange: VisibleRange, scrollTop: number, scrollLeft: number, columns: Column[]): void;
    private formatCellLocation;
    private copyCellStats;
    /**
     * 测量渲染类型的时间
     */
    private measureRender;
    /**
     * 记录单次渲染耗时（用于内联性能采样的场景，如 image 热路径）
     */
    private recordRenderTiming;
    /**
     * 测量渲染阶段的时间
     */
    private measurePhase;
    private recordRowBandDetail;
    private measureRowBandDetail;
    private measureRowBandCellDetail;
    /**
     * 获取性能统计（按类型聚合，丢失列粒度，仅供向后兼容）
     */
    getPerformanceStats(): Map<string, {
        totalTime: number;
        count: number;
        maxTime: number;
        avgTime: number;
    }>;
    /**
     * 输出性能报告到控制台
     */
    logPerformanceReport(): void;
    /**
     * 获取格式化的性能报告字符串
     */
    getPerformanceReport(): string;
    /**
     * 打印性能报告到控制台
     */
    printPerformanceReport(): void;
    renderDropdown(dropdown: DropdownState): void;
    private renderTag;
    private resolveDisabled;
    private formatValue;
    private isCellSelected;
    private renderCenterSelections;
    private renderFixedSelections;
    renderLoadingOverlay(): void;
    renderEmptyState(message: string, sortConfig?: SortConfig[], filterConfig?: FilterConfig[], hoveredHeaderColumnKey?: string, scrollLeft?: number): void;
    private renderEmptyStateHeaderCell;
    private isColumnHovered;
    renderFixedColumnsShadow(fixedWidth: number, side: "left" | "right"): void;
    getCanvas(): HTMLCanvasElement;
    getCanvasContext(): CanvasRenderingContext2D;
    renderTooltip(tooltip: TooltipState): void;
    renderScrollbars(scrollLeft: number, scrollTop: number, maxScrollLeft: number, maxScrollTop: number, scrollbarState: ScrollbarState): void;
    renderWatermark(): void;
    getScrollbarBounds(scrollLeft: number, scrollTop: number, maxScrollLeft: number, maxScrollTop: number): {
        vertical: {
            x: number;
            y: number;
            width: number;
            height: number;
        } | null;
        horizontal: {
            x: number;
            y: number;
            width: number;
            height: number;
        } | null;
    };
    renderFilterDropdown(filterDropdown: FilterDropdownState): void;
    renderDateDropdown(dateDropdown: DateDropdownState): void;
    renderContextMenu(contextMenu: ContextMenuState): void;
    renderHeaderContextMenu(headerContextMenu: HeaderContextMenuState): void;
    private getRenderedRowHeight;
    private renderRowResizeGuide;
    private renderColumnReorderIndicator;
    private renderParentColumnGhost;
    private renderChildColumnsGhost;
    private renderLeafColumnGhost;
    private isDescendantOfColumn;
    private renderLeafColumnRowsGhost;
    private renderParentColumnRowsGhost;
    private renderGhostCellValue;
    /**
     * 清空渲染缓存
     */
    clearRenderCache(): void;
    /**
     * 重置行 ID 管理器
     */
    resetRowIds(): void;
    /**
     * 重置列 ID 管理器
     */
    resetColumnIds(): void;
    /**
     * 清理不可见行的缓存
     */
    cleanupInvisibleRows(visibleRowIds: Set<string>): void;
    /**
     * 清理不可见列的缓存
     */
    cleanupInvisibleColumns(visibleColumnIds: Set<string>): void;
    /**
     * 获取缓存统计信息
     */
    getCacheStats(): {
        cellCacheSize: number;
        valueCacheSize: number;
        maxCellCacheSize: number;
    } | null;
    destroy(): void;
    invalidateJsxOffscreen(scope: 'all' | {
        oldSize: string | string[];
    }): void;
}
export {};
//# sourceMappingURL=Renderer.d.ts.map