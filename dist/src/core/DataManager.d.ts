import { Row, Column, SortConfig, FilterConfig, DataManagerState, Change, ExportContext, HistoryOptions } from "../types";
import { RowVersionManager } from "./RenderCache";
export declare class DataManager {
    private state;
    /** 历史记录栈 */
    private historyStack;
    /** 重做记录栈 */
    private redoStack;
    /** 历史记录配置 */
    private historyOptions;
    /** 行版本管理器（用于渲染缓存） */
    private rowVersionManager;
    constructor(_rowKey?: string, historyOptions?: HistoryOptions);
    /**
     * 获取行版本管理器
     */
    getRowVersionManager(): RowVersionManager;
    loadRows(rows: Row[] | Promise<Row[]> | (() => Promise<Row[]>)): Promise<void>;
    private processRows;
    setColumns(columns: Column[]): void;
    setRows(rows: Row[]): void;
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
    /**
     * Extract numeric value from a value
     * Handles: numbers, strings with numbers (e.g., "8%", "79%", "$100", "1,234.56")
     * Returns null if not a valid number
     */
    private extractNumber;
    updateCell(rowIndex: number, columnKey: string, value: unknown, field?: string): Change;
    updateRow(rowIndex: number, data: Record<string, unknown>): Change[];
    addRow(data: Record<string, unknown>, index?: number): Change;
    private findRootRowIndexByRef;
    addRowRelativeTo(targetRow: Row, data: Record<string, unknown>, placement: "above" | "below"): Change;
    deleteRow(rowIndex: number): Change;
    deleteRowByRef(row: Row): Change;
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
     * 销毁实例，清理所有状态
     */
    destroy(): void;
    /**
     * 设置历史记录配置
     */
    setHistoryOptions(options: HistoryOptions): void;
    exportData(options: {
        includeHeaders?: boolean;
        includeHidden?: boolean;
        selectedOnly?: boolean;
        showRowNumbers?: boolean;
    }): unknown[][];
    getExportContext(options: {
        includeHeaders?: boolean;
        includeHidden?: boolean;
        selectedOnly?: boolean;
        showRowNumbers?: boolean;
    }): ExportContext;
    private getLeafColumnsList;
    private getExportColumnTree;
    private getHeaderDepth;
}
//# sourceMappingURL=DataManager.d.ts.map