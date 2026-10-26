/**
 * RenderCache - 单元格渲染结果缓存
 *
 * 使用 WeakMap 存储行/列标识符，不污染原始数据
 * 支持单元格缓存和列值缓存两种模式
 */
import { Row, Column, RenderResult } from "../types";
/**
 * 行 ID 管理器
 * 使用 WeakMap 懒创建行标识符
 */
export declare class RowIdManager {
    private map;
    private counter;
    /**
     * 获取行 ID（懒创建）
     */
    getId(row: Row): string;
    /**
     * 重置（loadData 时调用）
     */
    reset(): void;
}
/**
 * 列 ID 管理器
 * 使用 WeakMap 懒创建列标识符
 */
export declare class ColumnIdManager {
    private map;
    private counter;
    /**
     * 获取列 ID（懒创建）
     */
    getId(column: Column): string;
    /**
     * 重置（setColumns 时调用）
     */
    reset(): void;
}
/**
 * 行版本管理器
 * 使用 WeakMap 存储行版本号
 */
export declare class RowVersionManager {
    private map;
    /**
     * 获取行版本号
     */
    getVersion(row: Row): number;
    /**
     * 递增行版本号
     */
    incrementVersion(row: Row): void;
    /**
     * 批量递增版本号
     */
    batchIncrement(rows: Row[]): void;
}
/**
 * 渲染结果缓存
 */
export declare class RenderCache {
    /** 单元格缓存：key = rowId-columnId */
    private cellCache;
    /** 列值缓存：key = columnId-value */
    private valueCache;
    /** 行 ID 管理器 */
    private rowIdManager;
    /** 列 ID 管理器 */
    private columnIdManager;
    /** 行版本管理器 */
    private rowVersionManager;
    /** 单元格缓存最大数量 */
    private maxCellCacheSize;
    /** 列值缓存最大数量 */
    private maxValueCacheSize;
    constructor(rowIdManager: RowIdManager, columnIdManager: ColumnIdManager, rowVersionManager: RowVersionManager, maxCellCacheSize?: number, maxValueCacheSize?: number);
    /**
     * 生成单元格缓存 key
     */
    private getCellCacheKey;
    /**
     * 生成列值缓存 key
     */
    private getValueCacheKey;
    /**
     * 将值转换为字符串用于缓存 key
     */
    private stringifyValue;
    /**
     * 获取缓存
     * @param row 行对象
     * @param column 列对象
     * @param value 单元格值
     * @param cacheMode 缓存模式
     * @returns 缓存的 RenderResult 或 null
     */
    get(row: Row, column: Column, value: unknown, cacheMode: "cell" | "value"): RenderResult | null;
    /**
     * 设置缓存
     */
    set(row: Row, column: Column, value: unknown, renderResult: RenderResult, cacheMode: "cell" | "value"): void;
    /**
     * 确保值缓存不超过最大数量
     */
    private ensureValueCapacity;
    /**
     * 确保单元格缓存不超过最大数量
     */
    private ensureCellCapacity;
    /**
     * 清理不可见行的缓存
     * @param visibleRowIds 可见行的 ID 集合
     */
    cleanupInvisibleRows(visibleRowIds: Set<string>): void;
    /**
     * 清理不可见列的缓存
     * @param visibleColumnIds 可见列的 ID 集合
     */
    cleanupInvisibleColumns(visibleColumnIds: Set<string>): void;
    /**
     * 清空所有缓存
     */
    clear(): void;
    /**
     * 重置行 ID 管理器并清空缓存（loadData 时调用）
     */
    resetRowIds(): void;
    /**
     * 重置列 ID 管理器并清空缓存（setColumns 时调用）
     */
    resetColumnIds(): void;
    /**
     * 获取缓存统计信息
     */
    getStats(): {
        cellCacheSize: number;
        valueCacheSize: number;
        maxCellCacheSize: number;
    };
}
//# sourceMappingURL=RenderCache.d.ts.map