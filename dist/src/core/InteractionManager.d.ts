import { CellPosition, CellInfo, CellRange, InteractionState, ScrollState, SelectionConfig, EditingConfig, Column, Row, SortConfig, InputConfig, SelectConfig, DropdownState, TagsConfig, ScrollbarState, FilterConfig, FilterDropdownState, ButtonsDropdownState, ImageTooltipState, ImageEditorState, ContextMenuState, HeaderContextMenuState, ButtonHoverState, DateConfig, DateDropdownState, SwitchAnimationState, ImageConfig } from '../types';
import { LayoutManager } from './LayoutManager';
import { EventEmitter } from './EventEmitter';
interface InteractionEvents {
    cellClick: [CellInfo, MouseEvent];
    cellDblClick: [CellInfo, MouseEvent];
    cellHover: [CellInfo | null, MouseEvent];
    headerHover: [string | undefined];
    rowClick: [number, MouseEvent];
    rowDblClick: [number, MouseEvent];
    selectionChange: [CellRange[]];
    editStart: [CellInfo, InputConfig?];
    selectEditStart: [CellInfo, SelectConfig?];
    editEnd: [CellInfo, unknown];
    scroll: [number, number];
    columnResize: [string, number];
    sortChange: [SortConfig[]];
    filterChange: [FilterConfig[]];
    expand: [number, boolean];
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
    columnSwap: [string, string];
    imageClick: [CellInfo, string, MouseEvent];
    progressChange: [CellInfo, number];
    [key: string]: unknown[];
}
export declare class InteractionManager {
    private static readonly DROPDOWN_ITEM_HEIGHT;
    private static readonly DROPDOWN_MAX_VISIBLE;
    private static readonly IMAGE_SIZE;
    private static readonly IMAGE_PADDING;
    private static readonly IMAGE_GAP;
    private static readonly IMAGES_PER_ROW;
    private static readonly IMAGE_UPLOAD_AREA_HEIGHT;
    private static readonly IMAGE_MAX_ROWS;
    private state;
    private scrollState;
    private scrollbarState;
    private layoutManager;
    private eventEmitter;
    private canvas;
    private ctx;
    private editingConfig;
    private columns;
    private rows;
    private allRows;
    private sortConfig;
    private filterConfig;
    private expandColumnKey;
    private isDestroyed;
    private resizeColumnIndex;
    private resizeStartX;
    private resizeStartWidth;
    private _lastClickTime;
    private _lastClickCell;
    private getScrollbarBounds;
    constructor(canvas: HTMLCanvasElement, layoutManager: LayoutManager, eventEmitter: EventEmitter<InteractionEvents>, _selectionConfig: SelectionConfig, editingConfig: EditingConfig);
    /**
     * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
     */
    private getCellInfo;
    /**
     * 计算单元格在视口中的 X 坐标
     */
    private getCellViewportX;
    /**
     * 验证单元格是否可编辑，返回列和行数据
     */
    private validateCellForEditing;
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
    private handleDropdownClick;
    private handleDropdownHover;
    private handleButtonsDropdownHover;
    private handleImageTooltipHover;
    private handleImageTooltipClick;
    private handleImageEditorHover;
    private handleImageEditorClick;
    private triggerFileInput;
    private handleFileUpload;
    private readFileAsDataURL;
    private commitImageEditorChanges;
    private handleButtonsDropdownClick;
    private handleFilterDropdownClick;
    private handleFilterDropdownHover;
    private handleDateDropdownClick;
    private formatDate;
    private handleDateDropdownHover;
    private handleDragOver;
    private handleDragLeave;
    private handleDrop;
    private handleContextMenu;
    private handleContextMenuClick;
    private handleContextMenuHover;
    getContextMenu(): ContextMenuState | null;
    getHeaderContextMenu(): HeaderContextMenuState | null;
    private handleHeaderContextMenuClick;
    private handleHeaderContextMenuHover;
    private handleDocumentMouseMove;
    private handleDocumentMouseUp;
    private handleMouseMove;
    private handleHeaderHover;
    private updateButtonHoverState;
    private clearAllButtonHoverStates;
    private buttonHoverAnimationRunning;
    private startButtonHoverAnimationLoop;
    private runButtonHoverAnimationLoop;
    getButtonHoverStates(): Map<string, ButtonHoverState>;
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
    private handleExpandIconClick;
    private getClickedRadioOption;
    private handleWheel;
    private updateDropdownPosition;
    private updateFilterDropdownPosition;
    private updateDateDropdownPosition;
    private updateButtonsDropdownPosition;
    private updateImageTooltipPosition;
    private updateImageEditorPosition;
    handleExternalWheel(deltaX: number, deltaY: number): void;
    private updateTooltipPosition;
    private scrollTimeout;
    private handleKeyDown;
    private handleEditingKeyDown;
    private handleArrowNavigation;
    private handleEnterKey;
    private handleHeaderMouseDown;
    /**
     * 计算同级列信息
     * 同级列定义：
     * 1. 有相同父列的列（同一父列的 children）
     * 2. 都是顶级列，且 fixed 属性相同
     */
    private calculateSiblingColumns;
    private getFirstLeafKey;
    private getFirstLeaf;
    private getChildLeafCount;
    private findParentColumn;
    private handleHeaderClick;
    private setSortDirection;
    private toggleSort;
    private openFilterDropdown;
    private handleSingleSelection;
    private handleRangeSelection;
    private handleToggleSelection;
    private scrollToCell;
    private moveSelection;
    /**
     * 获取编辑配置
     * 优先级：editRender > render 返回的编辑配置 > null（走默认逻辑）
     */
    private getEditConfig;
    startEditing(cell: CellPosition, inputConfig?: InputConfig): void;
    startSelectEditing(cell: CellPosition, selectConfig?: SelectConfig): void;
    startTagsEditing(cell: CellPosition, tagsConfig: TagsConfig): void;
    startDateEditing(cell: CellPosition, dateConfig: DateConfig): void;
    startImageEditing(cell: CellPosition, imageConfig: ImageConfig): void;
    endEditing(save: boolean): void;
    clearEditingState(): void;
    isEditing(): boolean;
    getDropdown(): DropdownState | null;
    private toggleRowExpand;
    private selectAll;
    clearSelection(): void;
    resetState(): void;
    private copySelection;
    private getSelectedText;
    setScrollPosition(scrollLeft: number, scrollTop: number): void;
    updateMaxScroll(maxScrollLeft: number, maxScrollTop: number): void;
    setColumns(columns: Column[]): void;
    setRows(rows: Row[]): void;
    setAllRows(rows: Row[]): void;
    setSortConfig(config: SortConfig[]): void;
    setFilterConfig(config: FilterConfig[]): void;
    setExpandColumnKey(key: string | null): void;
    getFilterDropdown(): FilterDropdownState | null;
    getDateDropdown(): DateDropdownState | null;
    getButtonsDropdown(): ButtonsDropdownState | null;
    getImageTooltip(): ImageTooltipState | null;
    getImageEditor(): ImageEditorState | null;
    applyFilter(): void;
    clearFilter(): void;
    getScrollState(): ScrollState;
    getInteractionState(): InteractionState;
    getSelectedCells(): CellPosition[];
    getSelectedRows(): number[];
    setSelectedCells(cells: CellPosition[]): void;
    updateConfig(_selection: SelectionConfig, editing: EditingConfig): void;
    private switchAnimationRunning;
    private startSwitchAnimationLoop;
    private runSwitchAnimationLoop;
    getSwitchAnimations(): Map<string, SwitchAnimationState>;
    destroy(): void;
}
export {};
//# sourceMappingURL=InteractionManager.d.ts.map