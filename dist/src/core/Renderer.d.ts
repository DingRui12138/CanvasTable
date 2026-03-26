import { Column, Row, TableTheme, VisibleRange, CellPosition, CellRange, SortConfig, TooltipState, DropdownState, ScrollbarState, FilterConfig, FilterDropdownState, WatermarkConfig, SwitchAnimationState, ButtonsDropdownState, ImageTooltipState, ImageEditorState, ButtonHoverState, DateDropdownState, ContextMenuState, HeaderContextMenuState } from '../types';
import { LayoutManager } from './LayoutManager';
export declare class Renderer {
    private canvas;
    private ctx;
    private theme;
    private layoutManager;
    private dpr;
    private offscreenCanvas;
    private offscreenCtx;
    private dirtyRegions;
    private watermarkConfig;
    private expandColumnKey;
    private currentSwitchAnimations;
    private currentButtonHoverStates;
    private hoveredPlaceholderColumnIndex;
    private isDestroyed;
    private imageCache;
    private loadingImages;
    private failedImages;
    private imageLoadCallbacks;
    private currentVisibleRange;
    private currentScrollTop;
    private rowHeight;
    private currentHoveredCell;
    private currentHoveredImageIndex;
    private currentHoveredButtonIndex;
    constructor(canvas: HTMLCanvasElement, theme: TableTheme, layoutManager: LayoutManager);
    private getContext;
    setCanvas(canvas: HTMLCanvasElement): void;
    setTheme(theme: TableTheme): void;
    setWatermarkConfig(config: WatermarkConfig | null): void;
    setExpandColumnKey(key: string | null): void;
    resize(width: number, height: number): void;
    updateTheme(theme: TableTheme): void;
    markDirty(x: number, y: number, width: number, height: number): void;
    markFullRedraw(): void;
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
    }): void;
    private renderCenterHeader;
    private renderHeaderCellMultiLevel;
    private renderCenterRows;
    private renderCenterRow;
    private renderFixedColumnsContent;
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
    private renderCellContent;
    private renderCellContentInternal;
    private renderExpandIcon;
    private renderCheckbox;
    private renderRadio;
    private renderButton;
    private renderButtons;
    private renderSingleButton;
    renderButtonsDropdown(dropdown: ButtonsDropdownState): void;
    renderImageTooltip(imageTooltip: ImageTooltipState): void;
    renderImageEditor(editor: ImageEditorState): void;
    private interpolateColor;
    private renderSwitch;
    private hexToRgb;
    private renderProgress;
    private renderLineProgress;
    private renderCircleProgress;
    private renderDashboardProgress;
    private getProgressColor;
    private getContrastColor;
    private renderInput;
    private wrapText;
    private truncateTextWithEllipsis;
    private renderSelect;
    private renderDate;
    private formatDate;
    private renderImage;
    private renderMultipleImages;
    private renderMoreCount;
    private renderImageHover;
    private renderImagePlaceholder;
    private renderImageError;
    private drawImageWithFit;
    /**
     * 检查行是否在懒加载范围内
     */
    private isInLazyLoadRange;
    private loadImage;
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
    renderDropdown(dropdown: DropdownState): void;
    private renderTagsDropdown;
    private renderTag;
    private renderTags;
    private resolveDisabled;
    private formatValue;
    private isCellSelected;
    private renderCenterSelections;
    private renderFixedSelections;
    renderLoadingOverlay(): void;
    renderEmptyState(message: string, sortConfig?: SortConfig[], filterConfig?: FilterConfig[], hoveredHeaderColumnKey?: string): void;
    private isColumnHovered;
    renderFixedColumnsShadow(fixedWidth: number, side: 'left' | 'right'): void;
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
    private renderColumnReorderIndicator;
    private renderParentColumnGhost;
    private renderChildColumnsGhost;
    private renderLeafColumnGhost;
    private isDescendantOfColumn;
    private renderLeafColumnRowsGhost;
    private renderParentColumnRowsGhost;
    private renderGhostCellValue;
    destroy(): void;
}
//# sourceMappingURL=Renderer.d.ts.map