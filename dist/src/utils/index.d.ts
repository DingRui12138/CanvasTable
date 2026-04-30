import type { Column, Row, RenderResult, DisabledValue, FilterMode, SelectOption } from "../types";
/**
 * 获取列的数据字段名
 * 优先使用 field，如果没有则使用 key
 */
export declare function getColumnField(column: Column): string;
export declare function formatNumber(value: number, options?: {
    thousandSeparator?: boolean;
    decimalPlaces?: number;
    prefix?: string;
    suffix?: string;
}): string;
export declare function formatPercent(value: number, decimalPlaces?: number): string;
export declare function formatDate(value: Date | number | string, format?: string): string;
export declare function formatBoolean(value: boolean, trueText?: string, falseText?: string): string;
export declare function truncateText(text: string, maxLength: number, ellipsis?: string): string;
export declare function generateId(): string;
export declare function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): (...args: Parameters<T>) => void;
export declare function clamp(value: number, min: number, max: number): number;
export declare function deepClone<T>(obj: T): T;
export declare function isEqual(a: unknown, b: unknown): boolean;
export declare function getNestedValue(obj: Record<string, unknown>, path: string): unknown;
export declare function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void;
export declare function binarySearch<T>(array: T[], value: number, getValue: (item: T) => number): number;
export declare function measureText(ctx: CanvasRenderingContext2D, text: string, fontSize: number, fontFamily: string): {
    width: number;
    height: number;
};
export declare function getDevicePixelRatio(): number;
export declare function createCanvas(width: number, height: number): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
};
export declare function requestAnimationFrameThrottle<T extends (...args: unknown[]) => unknown>(fn: T): (...args: Parameters<T>) => void;
export declare function isPromise<T>(value: unknown): value is Promise<T>;
export declare function downloadBlob(blob: Blob, filename: string): void;
export declare function arrayToCsv(data: unknown[][], delimiter?: string): string;
export { buildExcelExportModel, createXlsxBlob, createXlsxBlobFromModel } from "./xlsx";
export declare function resolveDisabled(disabled: DisabledValue | undefined, row: Row, column: Column): boolean;
export declare function getRenderResult(column: Column, row: Row, rowIndex: number): RenderResult;
export declare function getCellDisplayText(column: Column, row: Row, rowIndex: number): string;
/**
 * LRU (Least Recently Used) 缓存
 * 用于图片缓存，防止大量图片导致内存溢出
 */
export declare class LRUCache<K, V> {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    /**
     * 获取缓存值，同时更新访问顺序
     */
    get(key: K): V | undefined;
    /**
     * 设置缓存值
     */
    set(key: K, value: V): void;
    /**
     * 检查是否存在
     */
    has(key: K): boolean;
    /**
     * 删除缓存
     */
    delete(key: K): boolean;
    /**
     * 清空缓存
     */
    clear(): void;
    /**
     * 获取缓存大小
     */
    get size(): number;
    /**
     * 获取所有键
     */
    keys(): IterableIterator<K>;
}
/**
 * 根据列类型获取默认筛选模式
 * @param column 列配置
 * @returns 筛选模式，如果不支持筛选则返回 null
 */
export declare function getFilterModeByColumnType(column: Column): FilterMode | null;
/** 采样获取筛选选项的最大行数 */
declare const FILTER_SAMPLE_ROWS = 100;
/** 搜索匹配结果的最大数量 */
declare const FILTER_SEARCH_LIMIT = 100;
/**
 * 获取列的筛选选项（用于 select 模式）
 * 策略：
 * 1. 检查 column.filter.options 或 render 返回的 options
 * 2. 如果没有，采样前 100 行获取
 * 3. 返回去重后的选项列表
 *
 * @param column 列配置
 * @param rows 数据行（可选，用于采样）
 * @param startIndex 开始采样的行索引（默认 0）
 * @returns 筛选选项列表，如果没有可用选项则返回空数组
 */
export declare function getColumnFilterOptions(column: Column, rows?: Row[], startIndex?: number): SelectOption[];
/**
 * 搜索匹配筛选选项
 * 用于延迟加载场景：用户输入关键字后搜索匹配的选项
 *
 * @param column 列配置
 * @param rows 数据行
 * @param searchText 搜索关键字
 * @param maxResults 最大结果数量（默认 100）
 * @returns 匹配的筛选选项
 */
export declare function searchFilterOptions(column: Column, rows: Row[], searchText: string, maxResults?: number): SelectOption[];
export { FILTER_SAMPLE_ROWS, FILTER_SEARCH_LIMIT };
//# sourceMappingURL=index.d.ts.map