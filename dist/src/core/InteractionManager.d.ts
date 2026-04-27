import { CellPosition, CellInfo, CellRange, InteractionState, ScrollState, SelectionConfig, EditingConfig, Column, Row, SortConfig, InputConfig, SelectConfig, DropdownState, TagsConfig, ScrollbarState, FilterConfig, FilterDropdownState, ButtonsDropdownState, ImageTooltipState, ImageEditorState, ContextMenuState, HeaderContextMenuState, ButtonHoverState, DateConfig, DateDropdownState, SwitchAnimationState, ImageConfig, ColorPickerConfig, ColorPickerDropdownState } from "../types";
import { LayoutManager } from "./LayoutManager";
import { DataManager } from "./DataManager";
import { EventEmitter } from "./EventEmitter";
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
    selectChange: [CellInfo, unknown];
    tagsChange: [CellInfo, string[], boolean];
    dropdownOpen: [];
    dropdownClose: [];
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
    rowAddAbove: [number];
    rowAddBelow: [number];
    rowDelete: [number];
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
    private get rows();
    private get allRows();
    private resizeColumnIndex;
    private resizeStartX;
    private resizeStartWidth;
    private _lastClickTime;
    private _lastClickCell;
    private getScrollbarBounds;
    private lazyLoadEnabled;
    private lazyLoadThreshold;
    private isLoadingMore;
    private hasMoreData;
    private rowHeightResizeEnabled;
    private rowResizable;
    constructor(canvas: HTMLCanvasElement, layoutManager: LayoutManager, dataManager: DataManager, eventEmitter: EventEmitter<InteractionEvents>, _selectionConfig: SelectionConfig, editingConfig: EditingConfig);
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
    private updateButtonHoverState;
    private clearAllButtonHoverStates;
    private startButtonHoverAnimationLoop;
    getButtonHoverStates: () => Map<string, ButtonHoverState>;
    getHoveredImageIndex(): number;
    getHoveredButtonIndex(): number;
    private updateImageHoverIndex;
    private updateButtonsHoverIndex;
    private checkTooltip;
    private isClickableElement;
    private handleMouseUp;
    private handleMouseLeave;
    private handleDblClick;
    private handleControlClick;
    private handleProgressClick;
    private handleProgressDragMove;
    private handleRatingClick;
    private handleExpandIconClick;
    private getClickedRadioOption;
    private handleWheel;
    /**
     * 检查是否需要触发懒加载
     */
    private checkLazyLoad;
    handleExternalWheel(deltaX: number, deltaY: number): void;
    private updateTooltipPosition;
    private scrollTimeout;
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
    isEditing(): boolean;
    getDropdown(): DropdownState | null;
    private toggleRowExpand;
    clearSelection(): void;
    resetState(): void;
    /** 关闭 select/tags dropdown */
    private closeDropdown;
    /** 关闭 filter dropdown */
    private closeFilterDropdown;
    /** 关闭 date dropdown */
    private closeDateDropdown;
    /** 关闭 color dropdown */
    private closeColorDropdown;
    /** 关闭 buttons dropdown */
    private closeButtonsDropdown;
    /** 关闭所有 dropdown */
    private closeAllDropdowns;
    /** 更新所有 dropdown 位置（滚动时调用） */
    private updateAllDropdownPositions;
    private copySelection;
    private getSelectedText;
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
    /**
     * 根据筛选模式获取操作符
     */
    private getOperatorByMode;
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
    setRowResizable(resizable: boolean | ((row: Row, rowIndex: number) => boolean) | undefined): void;
    private isRowResizable;
    private startSwitchAnimationLoop;
    getSwitchAnimations: () => Map<string, SwitchAnimationState>;
    destroy(): void;
}
export {};
//# sourceMappingURL=InteractionManager.d.ts.map