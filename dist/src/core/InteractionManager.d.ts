import { CellPosition, CellInfo, CellRange, InteractionState, ScrollState, SelectionConfig, EditingConfig, Column, Row, SortConfig, InputConfig, SelectConfig, DropdownState, TagsConfig, ScrollbarState, FilterConfig, FilterDropdownState, ButtonsDropdownState, ImageTooltipState, ImageEditorState, ContextMenuState, HeaderContextMenuState, ButtonHoverState, DateConfig, DateDropdownState, SwitchAnimationState, ImageConfig, ColorPickerConfig, ColorPickerDropdownState, CanvasTableLocale } from "../types";
import { LayoutManager } from "./LayoutManager";
import { DataManager } from "./DataManager";
import { EventEmitter } from "./EventEmitter";
import { EditorRegistry } from "./editors";
import type { CTInteractiveRegion } from "./jsx";
interface InteractionEvents {
    cellClick: [CellInfo, MouseEvent];
    cellDblClick: [CellInfo, MouseEvent];
    cellHover: [CellInfo | null, MouseEvent];
    headerHover: [string | undefined];
    rowClick: [Row, number, MouseEvent];
    rowDblClick: [Row, number, MouseEvent];
    selectionChange: [CellRange[]];
    editStart: [CellInfo, InputConfig?];
    selectEditStart: [CellInfo, SelectConfig?];
    editEnd: [CellInfo, unknown];
    scroll: [number, number];
    columnResize: [Column, number];
    sortChange: [SortConfig[]];
    filterChange: [FilterConfig[]];
    expand: [Row, number, boolean];
    checkboxChange: [CellInfo, boolean];
    radioChange: [CellInfo, unknown];
    switchChange: [CellInfo, boolean];
    buttonClick: [CellInfo, string | undefined];
    selectChange: [CellInfo, unknown, boolean];
    tagsChange: [CellInfo, string[], boolean];
    dropdownOpen: [];
    dropdownClose: [CellPosition | null];
    dropdownHover: [];
    filterDropdownOpen: [];
    filterDropdownClose: [];
    contextMenuOpen: [];
    contextMenuClose: [];
    contextMenuHover: [];
    headerContextMenuOpen: [];
    headerContextMenuClose: [];
    headerContextMenuHover: [];
    columnHide: [string];
    columnShow: [string];
    switchAnimationUpdate: [];
    rowAddAbove: [Row];
    rowAddBelow: [Row];
    rowDelete: [Row];
    rowPinChange: [Row, "top" | "bottom" | null];
    columnReorder: [number, number];
    columnReorderDrag: [];
    rowResizeDrag: [];
    rowHeightChange: [Row, number, number];
    columnSwap: [string, string];
    imageClick: [CellInfo, string, MouseEvent];
    progressChange: [CellInfo, number];
    ratingChange: [CellInfo, number];
    loadMore: [{
        startIndex: number;
        scrollTop: number;
        direction: "down" | "up";
    }];
    [key: string]: unknown[];
}
export declare class InteractionManager {
    private static readonly DROPDOWN_ITEM_HEIGHT;
    private static readonly DROPDOWN_MAX_VISIBLE;
    static readonly IMAGE_SIZE = 64;
    static readonly IMAGE_PADDING = 8;
    static readonly IMAGE_GAP = 8;
    static readonly IMAGES_PER_ROW = 4;
    static readonly IMAGE_UPLOAD_AREA_HEIGHT = 60;
    static readonly IMAGE_MAX_ROWS = 3;
    private state;
    private scrollState;
    private scrollbarState;
    private layoutManager;
    private eventEmitter;
    private canvas;
    private ctx;
    private editingConfig;
    private dataManager;
    private sortConfig;
    private filterConfig;
    private expandColumnKey;
    private isDestroyed;
    private editingHandler;
    private dropdownHandler;
    private selectionHandler;
    private navigationHandler;
    private contextMenuHandler;
    private imageHandler;
    private headerHandler;
    private controlClickHandler;
    private buttonAnimationHandler;
    private tooltipHandler;
    private clipboardHandler;
    private hoverHandler;
    private wheelHandler;
    private filterHandler;
    private get rows();
    private resizeColumnIndex;
    private resizeStartX;
    private resizeStartWidth;
    private getScrollbarBounds;
    private rowHeightResizeEnabled;
    private rowResizable;
    private enableRowPinning;
    private rowPinnable;
    private locale;
    private handlerContext;
    private editorRegistry;
    private jsxInteractiveRegions;
    /** JSX 进度条拖拽状态（预览值 + 拖拽几何） */
    private jsxProgressDrag;
    /** 校验失败时阻止下拉关闭的回调（调用实际 validation hook） */
    private shouldBlockDropdownClose;
    /** 校验失败时阻止关闭编辑态的回调（调用实际 commit/validation hook）
     * 接收 mousedown 事件以便在 DOM 编辑器场景下 preventDefault 阻止焦点转移 */
    private shouldBlockEditingClose;
    constructor(canvas: HTMLCanvasElement, layoutManager: LayoutManager, dataManager: DataManager, eventEmitter: EventEmitter<InteractionEvents>, _selectionConfig: SelectionConfig, editingConfig: EditingConfig, locale: CanvasTableLocale | undefined, editorRegistry: EditorRegistry);
    /**
     * Initialize handler instances
     */
    private initHandlers;
    /**
     * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
     */
    private getCellInfo;
    /**
     * 计算单元格在视口中的 X 坐标
     */
    private getCellViewportX;
    private getCellViewportY;
    /**
     * 获取规范化的选择范围
     */
    private getNormalizedRange;
    private bindEvents;
    private unbindEvents;
    private bindDocumentEvents;
    private unbindDocumentEvents;
    setGetScrollbarBounds(callback: () => {
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
    }): void;
    getScrollbarState(): ScrollbarState;
    private handleMouseDown;
    private triggerFileInput;
    private handleDragOver;
    private handleDragLeave;
    private handleDrop;
    private handleContextMenu;
    getContextMenu(): ContextMenuState | null;
    getHeaderContextMenu(): HeaderContextMenuState | null;
    private handleDocumentMouseMove;
    private handleDocumentMouseUp;
    private handleMouseMove;
    private clearAllButtonHoverStates;
    getButtonHoverStates: () => Map<string, ButtonHoverState>;
    getHoveredImageIndex(): number;
    getHoveredButtonIndex(): number;
    private checkTooltip;
    private handleMouseUp;
    private handleMouseLeave;
    private handleDblClick;
    private handleControlClick;
    private handleProgressDragMove;
    private handleWheel;
    handleExternalWheel(deltaX: number, deltaY: number): void;
    private handleKeyDown;
    private handleEditingKeyDown;
    private handleEnterKey;
    /**
     * 获取编辑配置
     * 优先级：editRender > render 返回的编辑配置 > null（走默认逻辑）
     */
    private getEditConfig;
    startEditing(cell: CellPosition, inputConfig?: InputConfig): void;
    startSelectEditing(cell: CellPosition, selectConfig?: SelectConfig): void;
    startTagsEditing(cell: CellPosition, tagsConfig: TagsConfig): void;
    startDateEditing(cell: CellPosition, dateConfig: DateConfig): void;
    startColorEditing(cell: CellPosition, colorConfig: ColorPickerConfig): void;
    startImageEditing(cell: CellPosition, imageConfig: ImageConfig): void;
    endEditing(save: boolean): void;
    clearEditingState(): void;
    /**
     * 清除进度条拖拽的临时显示值（提交完成后调用）
     *
     * 仅在「提交完成的值为拖拽结束时记录的最终值」时才清除，
     * 以避免拖拽过程中 mousedown 触发的提前提交（值不同）或在拖拽进行中误清除。
     *
     * @param cell 提交的单元格；仅当与当前拖拽单元格一致时才清除
     * @param value 提交完成的值；仅当与 pendingValue 一致时才清除
     */
    clearProgressDragState(cell?: CellPosition, value?: number): void;
    isEditing(): boolean;
    getDropdown(): DropdownState | null;
    setJSXInteractiveRegions(regions: CTInteractiveRegion[]): void;
    /** 当前 JSX 进度条拖拽预览值（供 Renderer 覆盖绘制） */
    getJSXProgressDragPreview(): {
        rowIndex: number;
        columnIndex: number;
        elementId?: string;
        value: number;
    } | null;
    private startJSXProgressDrag;
    private updateJSXProgressDrag;
    private finishJSXProgressDrag;
    private computeJSXProgressValue;
    private getJSXInteractiveRegionAt;
    private toggleRowExpand;
    clearSelection(): void;
    resetState(): void;
    /** 关闭 select/tags dropdown（公开方法，供 CanvasTable 在校验成功后调用） */
    closeSelectDropdown(): void;
    /** 关闭 select/tags dropdown */
    private closeDropdown;
    /** 关闭 filter dropdown */
    private closeFilterDropdown;
    /** 关闭 date dropdown（programmatic，非用户取消） */
    private closeDateDropdown;
    /** 关闭 color dropdown（programmatic，非用户取消） */
    private closeColorDropdown;
    /** 关闭 buttons dropdown */
    private closeButtonsDropdown;
    /** 关闭所有 dropdown */
    private closeAllDropdowns;
    private copySelection;
    setScrollPosition(scrollLeft: number, scrollTop: number): void;
    updateMaxScroll(maxScrollLeft: number, maxScrollTop: number): void;
    setSortConfig(config: SortConfig[]): void;
    setFilterConfig(config: FilterConfig[]): void;
    setExpandColumnKey(key: string | null): void;
    setLazyLoadConfig(enabled: boolean, threshold?: number): void;
    setLoadingMore(loading: boolean): void;
    /**
     * 设置是否还有更多数据
     * @param hasMore 是否还有更多数据，false 表示加载完成
     */
    setHasMore(hasMore: boolean): void;
    getFilterDropdown(): FilterDropdownState | null;
    getDateDropdown(): DateDropdownState | null;
    getColorDropdown(): ColorPickerDropdownState | null;
    getButtonsDropdown(): ButtonsDropdownState | null;
    getImageTooltip(): ImageTooltipState | null;
    getImageEditor(): ImageEditorState | null;
    applyFilter(): void;
    clearFilter(): void;
    /**
     * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
     * 用于重置按钮
     */
    resetFilterValue(): void;
    /**
     * 处理筛选下拉框的搜索输入
     * 用于延迟加载模式下的选项搜索
     */
    handleFilterDropdownSearch(searchText: string): void;
    /**
     * 处理筛选下拉框的范围值更新
     */
    handleFilterDropdownRangeUpdate(minValue: string, maxValue: string): void;
    /**
     * 处理筛选下拉框的布尔值更新
     */
    handleFilterDropdownBooleanUpdate(value: "all" | "true" | "false"): void;
    /**
     * 处理筛选下拉框的日期范围更新
     */
    handleFilterDropdownDateRangeUpdate(startDate: Date | null, endDate: Date | null): void;
    getScrollState(): ScrollState;
    getInteractionState(): InteractionState;
    getSelectedCells(): CellPosition[];
    getSelectedRows(): number[];
    setSelectedCells(cells: CellPosition[]): void;
    updateConfig(_selection: SelectionConfig, editing: EditingConfig): void;
    setRowHeightResizeEnabled(enabled: boolean): void;
    setShouldBlockDropdownClose(callback: (cell: CellPosition) => Promise<boolean>): void;
    /** 设置 DOM 编辑器活跃状态检查回调，用于避免 keydown 重复触发 endEditing */
    private isDomEditorActive;
    setDomEditorActiveChecker(checker: () => boolean): void;
    setShouldBlockEditingClose(callback: (e?: MouseEvent) => Promise<boolean>): void;
    setRowResizable(resizable: boolean | ((row: Row, rowIndex: number) => boolean) | undefined): void;
    setRowPinningEnabled(enabled: boolean): void;
    setRowPinnable(pinnable: boolean | ((row: Row) => boolean) | undefined): void;
    setLocale(locale: CanvasTableLocale): void;
    private isRowPinnable;
    private getRowContextMenuItems;
    private isRowResizable;
    getSwitchAnimations: () => Map<string, SwitchAnimationState>;
    destroy(): void;
}
export {};
//# sourceMappingURL=InteractionManager.d.ts.map