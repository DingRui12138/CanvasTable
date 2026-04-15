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
export class RowIdManager {
  private map: WeakMap<Row, string> = new WeakMap();
  private counter: number = 0;

  /**
   * 获取行 ID（懒创建）
   */
  getId(row: Row): string {
    let id = this.map.get(row);
    if (!id) {
      id = `r${this.counter++}`;
      this.map.set(row, id);
    }
    return id;
  }

  /**
   * 重置（loadData 时调用）
   */
  reset(): void {
    this.map = new WeakMap();
    this.counter = 0;
  }
}

/**
 * 列 ID 管理器
 * 使用 WeakMap 懒创建列标识符
 */
export class ColumnIdManager {
  private map: WeakMap<Column, string> = new WeakMap();
  private counter: number = 0;

  /**
   * 获取列 ID（懒创建）
   */
  getId(column: Column): string {
    let id = this.map.get(column);
    if (!id) {
      id = `c${this.counter++}`;
      this.map.set(column, id);
    }
    return id;
  }

  /**
   * 重置（setColumns 时调用）
   */
  reset(): void {
    this.map = new WeakMap();
    this.counter = 0;
  }
}

/**
 * 行版本管理器
 * 使用 WeakMap 存储行版本号
 */
export class RowVersionManager {
  private map: WeakMap<Row, number> = new WeakMap();

  /**
   * 获取行版本号
   */
  getVersion(row: Row): number {
    return this.map.get(row) ?? 0;
  }

  /**
   * 递增行版本号
   */
  incrementVersion(row: Row): void {
    const current = this.map.get(row) ?? 0;
    this.map.set(row, current + 1);
  }

  /**
   * 批量递增版本号
   */
  batchIncrement(rows: Row[]): void {
    for (const row of rows) {
      this.incrementVersion(row);
    }
  }
}

/**
 * 缓存单元格数据
 */
interface CachedCell {
  /** 原始值，用于检测变化 */
  value: unknown;
  /** 渲染结果 */
  renderResult: RenderResult;
  /** 行版本号 */
  rowVersion: number;
}

/**
 * 渲染结果缓存
 */
export class RenderCache {
  /** 单元格缓存：key = rowId-columnId */
  private cellCache: Map<string, CachedCell> = new Map();

  /** 列值缓存：key = columnId-value */
  private valueCache: Map<string, RenderResult> = new Map();

  /** 行 ID 管理器 */
  private rowIdManager: RowIdManager;

  /** 列 ID 管理器 */
  private columnIdManager: ColumnIdManager;

  /** 行版本管理器 */
  private rowVersionManager: RowVersionManager;

  /** 单元格缓存最大数量 */
  private maxCellCacheSize: number;

  constructor(
    rowIdManager: RowIdManager,
    columnIdManager: ColumnIdManager,
    rowVersionManager: RowVersionManager,
    maxCellCacheSize: number = 3000,
  ) {
    this.rowIdManager = rowIdManager;
    this.columnIdManager = columnIdManager;
    this.rowVersionManager = rowVersionManager;
    this.maxCellCacheSize = maxCellCacheSize;
  }

  // ==================== Key 生成 ====================

  /**
   * 生成单元格缓存 key
   */
  private getCellCacheKey(row: Row, column: Column): string {
    const rowId = this.rowIdManager.getId(row);
    const columnId = this.columnIdManager.getId(column);
    return `${rowId}-${columnId}`;
  }

  /**
   * 生成列值缓存 key
   */
  private getValueCacheKey(column: Column, value: unknown): string {
    const columnId = this.columnIdManager.getId(column);
    const valueStr = this.stringifyValue(value);
    return `${columnId}-${valueStr}`;
  }

  /**
   * 将值转换为字符串用于缓存 key
   */
  private stringifyValue(value: unknown): string {
    if (value === null) return "__null__";
    if (value === undefined) return "__undefined__";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  // ==================== 缓存操作 ====================

  /**
   * 获取缓存
   * @param row 行对象
   * @param column 列对象
   * @param value 单元格值
   * @param cacheMode 缓存模式
   * @returns 缓存的 RenderResult 或 null
   */
  get(row: Row, column: Column, value: unknown, cacheMode: "cell" | "value"): RenderResult | null {
    if (cacheMode === "value") {
      const key = this.getValueCacheKey(column, value);
      return this.valueCache.get(key) ?? null;
    }

    // cell mode
    const key = this.getCellCacheKey(row, column);
    const cached = this.cellCache.get(key);

    if (!cached) return null;

    // 检查值和版本是否匹配
    const rowVersion = this.rowVersionManager.getVersion(row);
    if (cached.value !== value || cached.rowVersion !== rowVersion) {
      // 缓存失效，删除
      this.cellCache.delete(key);
      return null;
    }

    // 直接返回，不做 LRU 更新（减少 Map 操作开销）
    return cached.renderResult;
  }

  /**
   * 设置缓存
   */
  set(
    row: Row,
    column: Column,
    value: unknown,
    renderResult: RenderResult,
    cacheMode: "cell" | "value",
  ): void {
    if (cacheMode === "value") {
      const key = this.getValueCacheKey(column, value);
      this.valueCache.set(key, renderResult);
      // valueCache 不限制大小，因为 key 是稳定的值组合
    } else {
      const key = this.getCellCacheKey(row, column);
      this.ensureCellCapacity();
      this.cellCache.set(key, {
        value,
        renderResult,
        rowVersion: this.rowVersionManager.getVersion(row),
      });
    }
  }

  /**
   * 确保单元格缓存不超过最大数量
   */
  private ensureCellCapacity(): void {
    if (this.cellCache.size >= this.maxCellCacheSize) {
      // 删除最早的条目（LRU）
      const firstKey = this.cellCache.keys().next().value;
      if (firstKey !== undefined) {
        this.cellCache.delete(firstKey);
      }
    }
  }

  // ==================== 缓存清理 ====================

  /**
   * 清理不可见行的缓存
   * @param visibleRowIds 可见行的 ID 集合
   */
  cleanupInvisibleRows(visibleRowIds: Set<string>): void {
    const keysToDelete: string[] = [];

    for (const key of this.cellCache.keys()) {
      const rowId = key.split("-")[0];
      if (rowId && !visibleRowIds.has(rowId)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cellCache.delete(key);
    }
  }

  /**
   * 清理不可见列的缓存
   * @param visibleColumnIds 可见列的 ID 集合
   */
  cleanupInvisibleColumns(visibleColumnIds: Set<string>): void {
    const keysToDelete: string[] = [];

    for (const key of this.cellCache.keys()) {
      // key 格式: rowId-columnId，取第二部分
      const parts = key.split("-");
      const columnId = parts.slice(1).join("-"); // 处理 columnId 可能包含 "-" 的情况
      if (columnId && !visibleColumnIds.has(columnId)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cellCache.delete(key);
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cellCache.clear();
    this.valueCache.clear();
  }

  // ==================== 管理器重置 ====================

  /**
   * 重置行 ID 管理器并清空缓存（loadData 时调用）
   */
  resetRowIds(): void {
    this.rowIdManager.reset();
    this.cellCache.clear();
    this.valueCache.clear();
  }

  /**
   * 重置列 ID 管理器并清空缓存（setColumns 时调用）
   */
  resetColumnIds(): void {
    this.columnIdManager.reset();
    this.cellCache.clear();
    this.valueCache.clear();
  }

  // ==================== 统计信息 ====================

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    cellCacheSize: number;
    valueCacheSize: number;
    maxCellCacheSize: number;
  } {
    return {
      cellCacheSize: this.cellCache.size,
      valueCacheSize: this.valueCache.size,
      maxCellCacheSize: this.maxCellCacheSize,
    };
  }
}
