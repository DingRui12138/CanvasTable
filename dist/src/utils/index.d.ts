import type { Column, Row, RenderResult, DisabledValue } from '../types';
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
//# sourceMappingURL=index.d.ts.map