import { Column, Row, LayoutInfo, VisibleRange, VirtualScrollConfig, TableTheme, HeaderCell, CellMerge, HitTestResult, MouseRegion } from '../types';
export declare class LayoutManager {
    private layoutInfo;
    private visibleRange;
    private config;
    private theme;
    private columnWidths;
    private rowHeights;
    private rowOffsets;
    private columnOffsets;
    private columns;
    private headerDepth;
    private headerCells;
    private leafColumns;
    private cellMergeMap;
    private cellMergeByRow;
    private mergedCellSet;
    private cellToMergeMap;
    private viewportWidth;
    private viewportHeight;
    private scrollLeft;
    private scrollTop;
    private showRowNumbers;
    private rowNumberColumnWidth;
    constructor(config: VirtualScrollConfig | undefined, theme: TableTheme);
    setShowRowNumbers(show: boolean): void;
    getShowRowNumbers(): boolean;
    getRowNumberColumnWidth(): number;
    static readonly HIDDEN_PLACEHOLDER_WIDTH = 5;
    static readonly HIDDEN_PLACEHOLDER_PREFIX = "__hidden_placeholder__";
    hasLeftFixedColumns(): boolean;
    isHiddenPlaceholderColumn(column: Column): boolean;
    getHiddenColumnKey(placeholderColumn: Column): string | null;
    private createEmptyLayoutInfo;
    setViewportSize(width: number, height: number): void;
    setTheme(theme: TableTheme): void;
    setScrollPosition(scrollLeft: number, scrollTop: number): void;
    getScrollLeft(): number;
    private createRowNumberColumn;
    calculateLayout(columns: Column[], rows: Row[]): LayoutInfo;
    private calculateHeaderLayout;
    private calculateColumnLayout;
    private calculateCellMerges;
    private calculateRowLayout;
    getColumnWidth(column: Column): number;
    setColumnWidth(columnKey: string, width: number): void;
    private recalculateColumnLayout;
    private recalculateHeaderLayout;
    getColumnByKey(key: string): Column | undefined;
    getLeafColumnIndexByKey(key: string): number | null;
    getLeafColumnIndex(column: Column): number;
    getRowHeight(_row: Row): number;
    private calculateTotalWidth;
    private calculateTotalHeight;
    private updateVisibleRange;
    private findRowIndexAtOffset;
    private findColumnIndexAtOffset;
    getVisibleRange(): VisibleRange;
    getLayoutInfo(): LayoutInfo;
    getHeaderCells(): HeaderCell[];
    getHeaderCellAtPosition(viewportX: number, viewportY: number): HeaderCell | null;
    getLeafHeaderCell(columnIndex: number): HeaderCell | null;
    getLeafHeaderCellViewportPosition(columnIndex: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    getLeafColumns(): Column[];
    getColumns(): Column[];
    getLeafColumn(index: number): Column | undefined;
    getHeaderDepth(): number;
    getCellMerge(rowIndex: number, columnIndex: number): CellMerge | null;
    isCellMerged(rowIndex: number, columnIndex: number): boolean;
    isMergeStartCell(rowIndex: number, columnIndex: number): boolean;
    getMergesAffectingRow(rowIndex: number): CellMerge[];
    getMergedCellPosition(rowIndex: number, columnIndex: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    getRowOffset(rowIndex: number): number;
    getColumnOffset(columnIndex: number): number;
    getRowHeightByIndex(rowIndex: number): number;
    getColumnWidthByIndex(columnIndex: number): number;
    getCellPosition(rowIndex: number, columnIndex: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    getCellAtPosition(x: number, y: number, scrollTop?: number): {
        rowIndex: number;
        columnIndex: number;
    } | null;
    private findRowIndexAtPosition;
    private findColumnIndexAtPosition;
    getRightFixedWidth(): number;
    getLeftFixedWidth(): number;
    getMaxScrollLeft(): number;
    getMaxScrollTop(): number;
    getViewportWidth(): number;
    getScrollOffsetForRow(rowIndex: number): number;
    getScrollOffsetForColumn(columnIndex: number): number;
    getFixedColumnsInfo(columns: Column[]): {
        leftFixed: {
            columns: Column[];
            width: number;
        };
        rightFixed: {
            columns: Column[];
            width: number;
        };
        center: {
            columns: Column[];
            width: number;
        };
    };
    isColumnResizable(_columnIndex: number): boolean;
    getResizeHandlePosition(columnIndex: number): number;
    isResizeHandleAtPosition(x: number, y: number): number;
    getVisibleCenterColumnIndices(): number[];
    getVisibleHeaderCells(): HeaderCell[];
    updateTheme(theme: TableTheme): void;
    reset(): void;
    /**
     * 获取鼠标所在的区域类型
     */
    getMouseRegion(viewportX: number): MouseRegion;
    /**
     * 统一命中测试入口
     * @param viewportX 视口 X 坐标
     * @param viewportY 视口 Y 坐标
     * @param scrollbarBounds 可选的滚动条边界（由 Renderer 计算，确保与渲染一致）
     */
    hitTest(viewportX: number, viewportY: number, scrollbarBounds?: {
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
    }): HitTestResult;
    /**
     * 检测滚动条区域
     * @param viewportX 视口 X 坐标
     * @param viewportY 视口 Y 坐标
     * @param externalBounds 可选的外部滚动条边界（优先使用）
     */
    private hitTestScrollbar;
    /**
     * 检测列头区域
     */
    private hitTestHeader;
    /**
     * 检测 resize handle（按区域检测，避免穿透）
     */
    private hitTestResizeHandle;
    /**
     * 检测左侧固定列的 resize handle
     */
    private hitTestLeftFixedResizeHandle;
    /**
     * 检测右侧固定列的 resize handle
     */
    private hitTestRightFixedResizeHandle;
    /**
     * 检测滚动区域的 resize handle
     */
    private hitTestScrollableResizeHandle;
    /**
     * 检测单元格区域
     */
    private hitTestCell;
    /**
     * 在左侧固定列中查找列索引
     */
    private findColumnIndexInLeftFixed;
    /**
     * 在右侧固定列中查找列索引
     */
    private findColumnIndexInRightFixed;
    /**
     * 在滚动区域中查找列索引
     */
    private findColumnIndexInScrollable;
}
//# sourceMappingURL=LayoutManager.d.ts.map