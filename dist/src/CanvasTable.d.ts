import { CanvasTableProps, CanvasTableAPI, Row, Column, CellPosition, CellInfo, CellRange, SortConfig, FilterConfig, ViewConfig, ExportOptions, LayoutInfo, TableTheme, ThemeMode, WatermarkConfig, ImageLoadConfig, RowPinPosition, CanvasTableLocale, LocaleConfig, ValidationError } from "./types";
interface TableEvents {
    load: [{
        rows: Row[];
        columns: Column[];
    }];
    error: [Error];
    change: [unknown[]];
    sort: [SortConfig[]];
    filter: [FilterConfig[]];
    select: [CellRange[]];
    cellClick: [CellInfo, MouseEvent];
    cellDblClick: [CellInfo, MouseEvent];
    cellHover: [CellInfo | null, MouseEvent];
    headerHover: [string | undefined];
    rowClick: [Row, number, MouseEvent];
    rowDblClick: [Row, number, MouseEvent];
    headerClick: [Column, number, MouseEvent];
    scroll: [number, number];
    columnResize: [Column, number];
    rowResizeDrag: [];
    rowHeightChange: [Row, number, number];
    columnReorder: [number, number];
    columnReorderDrag: [];
    columnHide: [string];
    columnShow: [string];
    editStart: [CellInfo, import("./types").InputConfig?];
    editEnd: [CellInfo, unknown];
    dateEditStart: [CellInfo, import("./types").DateConfig?];
    dateEditEnd: [CellInfo, string];
    dateDropdownOpen: [];
    dateDropdownClose: [CellPosition | null];
    dateDropdownHover: [];
    dateSelect: [CellInfo, string];
    colorDropdownOpen: [];
    colorDropdownClose: [CellPosition | null];
    colorDropdownHover: [];
    dropdownOpen: [];
    dropdownClose: [CellPosition | null];
    dropdownHover: [];
    contextMenuOpen: [];
    contextMenuClose: [];
    contextMenuHover: [];
    switchAnimationUpdate: [];
    buttonHoverAnimationUpdate: [];
    rowAddAbove: [Row];
    rowAddBelow: [Row];
    rowDelete: [Row];
    rowPinChange: [Row, RowPinPosition | null];
    expand: [Row, number, boolean];
    checkboxChange: [CellInfo, boolean];
    radioChange: [CellInfo, unknown];
    switchChange: [CellInfo, boolean];
    buttonClick: [CellInfo, string | undefined];
    imageClick: [CellInfo, string, MouseEvent];
    progressChange: [CellInfo, number];
    ratingChange: [CellInfo, number];
    colorChange: [CellInfo, string];
    selectChange: [CellInfo, unknown, boolean];
    tagsChange: [CellInfo, string[], boolean];
    undo: [];
    redo: [];
    [key: string]: unknown[];
}
export declare class CanvasTable implements CanvasTableAPI {
    private container;
    private wrapper;
    private canvas;
    private props;
    private dataManager;
    private layoutManager;
    private rowPinManager;
    private renderer;
    private interactionManager;
    private editorManager;
    private editorRegistry;
    private filterInputManager;
    private eventEmitter;
    private loadingOverlay;
    private theme;
    private themeMode;
    private locale;
    private mediaQuery;
    private isDestroyed;
    private resizeObserver;
    private renderCache;
    private rowIdManager;
    private columnIdManager;
    private scheduledRender;
    private manualLoading;
    private validationErrorRows;
    private pendingValidationCells;
    private pendingAnimationFrame;
    private forcedValidationTooltipCell;
    private warningTooltipTimeout;
    private ctPerformanceEnabled;
    private ctFrameHistory;
    private static readonly CT_MAX_FRAME_HISTORY;
    private ctFrameCount;
    private ctLastRafTime;
    private ctScheduledAt;
    private ctRafInterval;
    private ctScheduledToStartDelay;
    private ctCoalescedCount;
    private ctCurrentFramePhases;
    constructor(container: HTMLElement | string, props: CanvasTableProps);
    private setupInternalEventListeners;
    private setupEventHandlers;
    private setupResizeObserver;
    private handleResize;
    private initialize;
    private updateLayout;
    private updateSummaryRows;
    private refreshSummaryRowsAfterDataChange;
    private normalizeValidationResult;
    private handleValidation;
    private addPendingValidation;
    private removePendingValidation;
    private startPendingAnimation;
    private stopPendingAnimation;
    private deleteValidationError;
    private clearTooltipForValidation;
    private commitCellValue;
    /**
     * 统一的编辑器提交流程 — 交互式和 DOM 编辑器共用
     *
     * get column → await commitCellValue → if committed call callback → render
     */
    private handleEditorCommit;
    private validateEditorCommit;
    private clearValidationErrorForCell;
    private buildVisibleValidationErrorIndex;
    private render;
    private performRender;
    /**
     * 记录 CanvasTable 帧统计
     */
    private _recordCtFrame;
    resize(): void;
    setRows(rows: Row[]): void;
    getRows(): Row[];
    getRow(rowIndex: number): Row | undefined;
    getColumns(): Column[];
    setColumns(columns: Column[]): void;
    scrollToRow(rowIndex: number, column?: number): Promise<void>;
    scrollTo(scrollLeft: number, scrollTop: number): void;
    getScrollPosition(): {
        scrollLeft: number;
        scrollTop: number;
    };
    getSelectedCells(): CellPosition[];
    getSelectedRows(): number[];
    getPinnedRows(position: RowPinPosition): Row[];
    setSelectedCells(cells: CellPosition[]): void;
    setSelectedRows(rows: number[]): void;
    clearSelection(): void;
    updateCell(rowIndex: number, column: string, value: unknown): Promise<void>;
    updateRow(rowIndex: number, data: Record<string, unknown>): Promise<void>;
    getValidationErrors(): ValidationError[];
    getValidationError(cell: CellPosition): ValidationError | null;
    clearValidationErrors(): void;
    private getValidationTooltip;
    addRow(data: Record<string, unknown>, index?: number): void;
    deleteRow(rowIndex: number): void;
    /**
     * 追加数据行（用于懒加载）
     * @param rows 要追加的行数据
     */
    appendRows(rows: Row[]): void;
    /**
     * 设置加载更多状态
     * @param loading 是否正在加载
     */
    setLoadingMore(loading: boolean): void;
    /**
     * 设置是否还有更多数据
     * @param hasMore 是否还有更多数据，false 表示加载完成
     */
    setHasMore(hasMore: boolean): void;
    /**
     * 显示 loading overlay
     * @param text 可选的 loading 文本
     */
    showLoading(text?: string): void;
    /**
     * 隐藏 loading overlay
     */
    hideLoading(): void;
    sort(configs: SortConfig[]): void;
    filter(filters: FilterConfig[]): void;
    clearFilters(): void;
    export(options: ExportOptions): Promise<Blob>;
    /**
     * 撤销上一步操作
     * @returns 是否撤销成功
     */
    undo(): boolean;
    /**
     * 是否可以撤销
     */
    canUndo(): boolean;
    /**
     * 重做上一步撤销的操作
     * @returns 是否重做成功
     */
    redo(): boolean;
    /**
     * 是否可以重做
     */
    canRedo(): boolean;
    /**
     * 获取历史记录数量
     */
    getHistoryLength(): number;
    /**
     * 清空历史记录
     */
    clearHistory(): void;
    /**
     * 设置历史记录配置
     */
    setHistoryOptions(options: {
        maxActions?: number;
    }): void;
    hideColumn(columnKey: string): void;
    showColumn(columnKey: string): void;
    private showColumnInternal;
    private hideColumnInternal;
    getViewConfig(): ViewConfig;
    setViewConfig(config: ViewConfig): void;
    setLocale(locale: LocaleConfig): void;
    getLocale(): CanvasTableLocale;
    refresh(): void;
    private createDefaultRowData;
    getCanvas(): HTMLCanvasElement;
    getLayoutInfo(): LayoutInfo;
    getTheme(): TableTheme;
    getThemeMode(): ThemeMode;
    setThemeMode(mode: ThemeMode): void;
    setTheme(theme: Partial<TableTheme>): void;
    setWatermark(config: WatermarkConfig | null): void;
    /**
     * 设置图片加载配置
     */
    setImageLoadConfig(config: ImageLoadConfig): void;
    /**
     * 获取图片加载队列统计信息
     */
    getImageLoadStats(): {
        pending: number;
        loading: number;
        cached: number;
        failed: number;
    };
    setExpandColumnKey(key: string | null): void;
    private resolveTheme;
    private applyTheme;
    private setupAutoThemeDetection;
    private teardownAutoThemeDetection;
    private handleThemeChange;
    /**
     * 测量 CanvasTable 阶段时间的辅助方法
     */
    private measureCanvasPhase;
    /**
     * 启用或禁用性能监控
     * @param enabled 是否启用
     */
    setPerformanceMonitoring(enabled: boolean): void;
    /**
     * 检查性能监控是否启用
     */
    isPerformanceMonitoringEnabled(): boolean;
    /**
     * 获取性能统计报告
     */
    getPerformanceReport(): string;
    /**
     * 打印性能统计报告到控制台
     */
    printPerformanceReport(): void;
    /**
     * 重置性能统计数据
     */
    resetPerformanceStats(): void;
    /**
     * 获取 CanvasTable 最后一帧的诊断信息
     */
    private getCtLastFrameDiagnostics;
    /**
     * 获取 CanvasTable 最差帧的诊断信息（总时间最长的帧）
     */
    private getCtWorstFrameDiagnostics;
    /**
     * 获取慢帧数组（总时间超过阈值的帧，默认 16ms）
     */
    private getCtSlowFrames;
    /**
     * 获取完整的性能诊断信息（包含 CanvasTable 和 Renderer）
     */
    getPerformanceDiagnostics(): any;
    /**
     * 清空渲染缓存
     * 当数据外部变化时调用，确保缓存失效
     */
    clearRenderCache(): void;
    /**
     * 获取渲染缓存统计信息
     */
    getRenderCacheStats(): {
        cellCacheSize: number;
        valueCacheSize: number;
        maxCellCacheSize: number;
    };
    /**
     * 获取当前的筛选配置
     * @returns 筛选配置数组
     */
    getFilterConfig(): FilterConfig[];
    /**
     * 获取当前的排序配置
     * @returns 排序配置数组
     */
    getSortConfig(): SortConfig[];
    /**
     * 打印当前的筛选和排序状态到控制台
     */
    debugState(): void;
    destroy(): void;
    on<K extends keyof TableEvents>(event: K, callback: (...args: TableEvents[K]) => void): void;
    off<K extends keyof TableEvents>(event: K, callback: (...args: TableEvents[K]) => void): void;
}
export default CanvasTable;
//# sourceMappingURL=CanvasTable.d.ts.map