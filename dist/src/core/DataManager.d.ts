import { Row, Column, TableData, SortConfig, FilterConfig, DataManagerState, Change, HistoryOptions } from '../types';
export declare class DataManager {
    private state;
    /** 历史记录栈 */
    private historyStack;
    /** 重做记录栈 */
    private redoStack;
    /** 历史记录配置 */
    private historyOptions;
    constructor(_rowKey?: string, historyOptions?: HistoryOptions);
    loadData(data: TableData | Promise<TableData> | (() => Promise<TableData>)): Promise<void>;
    private processRows;
    setColumns(columns: Column[]): void;
    getColumns(): Column[];
    /**
     * 交换两个列的位置（基于 key）
     * 前提：调用方已确保两个列是同级的
     * @param fromKey 源列的 key
     * @param toKey 目标列的 key
     * @param fromUid 源列的唯一标识符（可选，用于精确匹配相同 key 的不同列）
     * @param toUid 目标列的唯一标识符（可选）
     */
    swapColumnsByKey(fromKey: string, toKey: string): void;
    reorderColumns(fromIndex: number, toIndex: number): void;
    private countLeafColumns;
    private getLeafColumnInfo;
    private findColumnByKey;
    getRows(): Row[];
    getAllRows(): Row[];
    /** @deprecated 使用 getRows() 或 getAllRows() 代替 */
    getOriginalRows(): Row[];
    getRowCount(): number;
    getTotalRowCount(): number;
    private countAllRows;
    sort(configs: SortConfig[]): void;
    getSort(): SortConfig[];
    clearSort(): void;
    filter(filters: FilterConfig[]): void;
    getFilters(): FilterConfig[];
    clearFilters(): void;
    private applyFiltersAndSort;
    private flattenRowsForDisplay;
    private applyFilters;
    private matchesFilter;
    private applySort;
    private compareValues;
    updateCell(rowIndex: number, columnKey: string, value: unknown, field?: string): Change;
    updateRow(rowIndex: number, data: Record<string, unknown>): Change[];
    addRow(data: Record<string, unknown>, index?: number): Change;
    deleteRow(rowIndex: number): Change;
    toggleRowExpand(rowIndex: number): boolean;
    setRowSelected(rowIndex: number, selected: boolean): void;
    private findStateRow;
    getSelectedRows(): number[];
    selectAll(selected: boolean): void;
    getVisibleRows(startIndex: number, endIndex: number): Row[];
    isLoading(): boolean;
    getError(): Error | null;
    getState(): DataManagerState;
    /**
     * 重置表格状态（撤销所有操作）
     */
    reset(): void;
    /**
     * 记录操作到历史栈
     */
    private recordAction;
    /**
     * 撤销上一步操作
     * @returns 是否撤销成功
     */
    undo(): boolean;
    /**
     * 执行撤销操作
     */
    private undoAction;
    /**
     * 重做上一步撤销的操作
     * @returns 是否重做成功
     */
    redo(): boolean;
    /**
     * 执行重做操作
     */
    private redoAction;
    /**
     * 根据ID查找行
     */
    private findRowById;
    /**
     * 是否可以撤销
     */
    canUndo(): boolean;
    /**
     * 是否可以重做
     */
    canRedo(): boolean;
    /**
     * 获取历史记录数量
     */
    getHistoryLength(): number;
    /**
     * 清空历史记录和重做记录
     */
    clearHistory(): void;
    /**
     * 设置历史记录配置
     */
    setHistoryOptions(options: HistoryOptions): void;
    exportData(options: {
        includeHeaders?: boolean;
        includeHidden?: boolean;
        selectedOnly?: boolean;
    }): unknown[][];
    private getLeafColumnsList;
}
//# sourceMappingURL=DataManager.d.ts.map