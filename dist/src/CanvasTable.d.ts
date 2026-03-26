import { CanvasTableProps, CanvasTableAPI, TableData, Row, Column, CellPosition, CellInfo, CellRange, SortConfig, FilterConfig, ViewConfig, ExportOptions, LayoutInfo, TableTheme, ThemeMode, WatermarkConfig } from "./types";
interface TableEvents {
    load: [TableData];
    error: [Error];
    change: [unknown[]];
    sort: [SortConfig[]];
    filter: [FilterConfig[]];
    select: [CellRange[]];
    cellClick: [CellInfo, MouseEvent];
    cellDblClick: [CellInfo, MouseEvent];
    cellHover: [CellInfo | null, MouseEvent];
    headerHover: [string | undefined];
    rowClick: [number, MouseEvent];
    rowDblClick: [number, MouseEvent];
    headerClick: [Column, number, MouseEvent];
    scroll: [number, number];
    columnResize: [string, number];
    columnReorder: [number, number];
    columnReorderDrag: [];
    columnHide: [string];
    columnShow: [string];
    editStart: [CellInfo, import("./types").InputConfig?];
    editEnd: [CellInfo, unknown];
    dateEditStart: [CellInfo, import("./types").DateConfig?];
    dateEditEnd: [CellInfo, string];
    dateDropdownOpen: [];
    dateDropdownClose: [];
    dateDropdownHover: [];
    dateSelect: [CellInfo, string];
    contextMenuOpen: [];
    contextMenuClose: [];
    contextMenuHover: [];
    switchAnimationUpdate: [];
    buttonHoverAnimationUpdate: [];
    rowAddAbove: [number];
    rowAddBelow: [number];
    rowDelete: [number];
    expand: [number, boolean];
    checkboxChange: [CellInfo, boolean];
    radioChange: [CellInfo, unknown];
    switchChange: [CellInfo, boolean];
    buttonClick: [CellInfo, string | undefined];
    imageClick: [CellInfo, string, MouseEvent];
    progressChange: [CellInfo, number];
    undo: [];
    redo: [];
    [key: string]: unknown[];
}
export declare class CanvasTable implements CanvasTableAPI {
    private container;
    private canvas;
    private props;
    private dataManager;
    private layoutManager;
    private renderer;
    private interactionManager;
    private editorManager;
    private eventEmitter;
    private theme;
    private themeMode;
    private mediaQuery;
    private isDestroyed;
    private resizeObserver;
    private scheduledRender;
    constructor(container: HTMLElement | string, props: CanvasTableProps);
    private setupInternalEventListeners;
    private setupEventHandlers;
    private setupResizeObserver;
    private handleResize;
    private initialize;
    private updateLayout;
    private render;
    private performRender;
    resize(): void;
    setData(data: TableData): void;
    getData(): TableData;
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
    setSelectedCells(cells: CellPosition[]): void;
    setSelectedRows(rows: number[]): void;
    clearSelection(): void;
    updateCell(rowIndex: number, column: string, value: unknown): void;
    updateRow(rowIndex: number, data: Record<string, unknown>): void;
    addRow(data: Record<string, unknown>, index?: number): void;
    deleteRow(rowIndex: number): void;
    sort(configs: SortConfig[]): void;
    getSort(): SortConfig[];
    filter(filters: FilterConfig[]): void;
    getFilters(): FilterConfig[];
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
    refresh(): void;
    private createDefaultRowData;
    getCanvas(): HTMLCanvasElement;
    getLayoutInfo(): LayoutInfo;
    getTheme(): TableTheme;
    getThemeMode(): ThemeMode;
    setThemeMode(mode: ThemeMode): void;
    setTheme(theme: Partial<TableTheme>): void;
    setWatermark(config: WatermarkConfig | null): void;
    setExpandColumnKey(key: string | null): void;
    private resolveTheme;
    private applyTheme;
    private setupAutoThemeDetection;
    private teardownAutoThemeDetection;
    private handleThemeChange;
    destroy(): void;
    on<K extends keyof TableEvents>(event: K, callback: (...args: TableEvents[K]) => void): void;
    off<K extends keyof TableEvents>(event: K, callback: (...args: TableEvents[K]) => void): void;
}
export default CanvasTable;
//# sourceMappingURL=CanvasTable.d.ts.map