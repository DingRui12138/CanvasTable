import { RowIdManager, ColumnIdManager, RowVersionManager, RenderCache } from "@/core/RenderCache";
import { Row, Column, RenderResult } from "@/types";

describe("RowIdManager", () => {
  it("should generate unique IDs for different rows", () => {
    const manager = new RowIdManager();
    const row1 = { id: "1", data: {} } as Row;
    const row2 = { id: "2", data: {} } as Row;

    const id1 = manager.getId(row1);
    const id2 = manager.getId(row2);

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^r\d+$/);
    expect(id2).toMatch(/^r\d+$/);
  });

  it("should return the same ID for the same row object", () => {
    const manager = new RowIdManager();
    const row = { id: "1", data: {} } as Row;

    const id1 = manager.getId(row);
    const id2 = manager.getId(row);

    expect(id1).toBe(id2);
  });

  it("should reset and generate new IDs", () => {
    const manager = new RowIdManager();
    const row = { id: "1", data: {} } as Row;

    const id1 = manager.getId(row);

    // After reset, the WeakMap is cleared, so the same object gets a new ID
    // But since counter is also reset, it starts from 0 again
    manager.reset();

    // Get ID for a different object to see counter increment
    const row2 = { id: "2", data: {} } as Row;
    const id2 = manager.getId(row2);

    // id2 should be "r0" since counter reset
    expect(id2).toBe("r0");
  });
});

describe("ColumnIdManager", () => {
  it("should generate unique IDs for different columns", () => {
    const manager = new ColumnIdManager();
    const col1 = { key: "col1", title: "Col 1" } as Column;
    const col2 = { key: "col2", title: "Col 2" } as Column;

    const id1 = manager.getId(col1);
    const id2 = manager.getId(col2);

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^c\d+$/);
    expect(id2).toMatch(/^c\d+$/);
  });

  it("should return the same ID for the same column object", () => {
    const manager = new ColumnIdManager();
    const col = { key: "col1", title: "Col 1" } as Column;

    const id1 = manager.getId(col);
    const id2 = manager.getId(col);

    expect(id1).toBe(id2);
  });

  it("should reset and generate new IDs", () => {
    const manager = new ColumnIdManager();
    const col = { key: "col1", title: "Col 1" } as Column;

    const id1 = manager.getId(col);

    // After reset, the WeakMap is cleared, counter starts from 0
    manager.reset();

    // Get ID for a different object to see counter increment
    const col2 = { key: "col2", title: "Col 2" } as Column;
    const id2 = manager.getId(col2);

    // id2 should be "c0" since counter reset
    expect(id2).toBe("c0");
  });
});

describe("RowVersionManager", () => {
  it("should start with version 0", () => {
    const manager = new RowVersionManager();
    const row = { id: "1", data: {} } as Row;

    expect(manager.getVersion(row)).toBe(0);
  });

  it("should increment version", () => {
    const manager = new RowVersionManager();
    const row = { id: "1", data: {} } as Row;

    manager.incrementVersion(row);
    expect(manager.getVersion(row)).toBe(1);

    manager.incrementVersion(row);
    expect(manager.getVersion(row)).toBe(2);
  });

  it("should batch increment versions", () => {
    const manager = new RowVersionManager();
    const row1 = { id: "1", data: {} } as Row;
    const row2 = { id: "2", data: {} } as Row;

    manager.batchIncrement([row1, row2]);

    expect(manager.getVersion(row1)).toBe(1);
    expect(manager.getVersion(row2)).toBe(1);
  });
});

describe("RenderCache", () => {
  let rowIdManager: RowIdManager;
  let columnIdManager: ColumnIdManager;
  let rowVersionManager: RowVersionManager;
  let cache: RenderCache;

  beforeEach(() => {
    rowIdManager = new RowIdManager();
    columnIdManager = new ColumnIdManager();
    rowVersionManager = new RowVersionManager();
    cache = new RenderCache(rowIdManager, columnIdManager, rowVersionManager);
  });

  describe("cell mode caching", () => {
    it("should cache and retrieve render result", () => {
      const row = { id: "1", data: { name: "test" } } as Row;
      const col = { key: "name", title: "Name" } as Column;
      const value = "test";
      const result: RenderResult = { text: "test", type: "text" };

      // First call should not find cache
      expect(cache.get(row, col, value, "cell")).toBeNull();

      // Set cache
      cache.set(row, col, value, result, "cell");

      // Should retrieve from cache
      const cached = cache.get(row, col, value, "cell");
      expect(cached).toEqual(result);
    });

    it("should invalidate cache when value changes", () => {
      const row = { id: "1", data: { name: "test" } } as Row;
      const col = { key: "name", title: "Name" } as Column;
      const result: RenderResult = { text: "test", type: "text" };

      cache.set(row, col, "test", result, "cell");

      // Should find cache with same value
      expect(cache.get(row, col, "test", "cell")).toEqual(result);

      // Should not find cache with different value
      expect(cache.get(row, col, "changed", "cell")).toBeNull();
    });

    it("should invalidate cache when row version changes", () => {
      const row = { id: "1", data: { name: "test" } } as Row;
      const col = { key: "name", title: "Name" } as Column;
      const result: RenderResult = { text: "test", type: "text" };

      cache.set(row, col, "test", result, "cell");

      // Should find cache initially
      expect(cache.get(row, col, "test", "cell")).toEqual(result);

      // Increment row version
      rowVersionManager.incrementVersion(row);

      // Should not find cache after version change
      expect(cache.get(row, col, "test", "cell")).toBeNull();
    });
  });

  describe("value mode caching", () => {
    it("should cache by column and value", () => {
      const row1 = { id: "1", data: { status: "active" } } as Row;
      const row2 = { id: "2", data: { status: "active" } } as Row;
      const col = { key: "status", title: "Status" } as Column;
      const result: RenderResult = { text: "active", type: "text" };

      // Set cache for row1
      cache.set(row1, col, "active", result, "value");

      // row2 with same value should also get cache
      const cached = cache.get(row2, col, "active", "value");
      expect(cached).toEqual(result);
    });

    it("should cache different values separately", () => {
      const row = { id: "1", data: {} } as Row;
      const col = { key: "status", title: "Status" } as Column;

      const resultActive: RenderResult = { text: "active", type: "text" };
      const resultInactive: RenderResult = { text: "inactive", type: "text" };

      cache.set(row, col, "active", resultActive, "value");
      cache.set(row, col, "inactive", resultInactive, "value");

      expect(cache.get(row, col, "active", "value")).toEqual(resultActive);
      expect(cache.get(row, col, "inactive", "value")).toEqual(resultInactive);
    });

    it("should evict the oldest value entry when exceeding the capacity", () => {
      const limitedCache = new RenderCache(
        new RowIdManager(),
        new ColumnIdManager(),
        new RowVersionManager(),
        3000,
        2,
      );
      const row = { id: "1", data: {} } as Row;
      const col = { key: "status", title: "Status" } as Column;
      const result: RenderResult = { text: "value", type: "text" };

      limitedCache.set(row, col, "v1", result, "value");
      limitedCache.set(row, col, "v2", result, "value");
      limitedCache.set(row, col, "v3", result, "value");

      expect(limitedCache.get(row, col, "v1", "value")).toBeNull();
      expect(limitedCache.get(row, col, "v2", "value")).toEqual(result);
      expect(limitedCache.get(row, col, "v3", "value")).toEqual(result);
      expect(limitedCache.getStats().valueCacheSize).toBe(2);
    });
  });

  describe("cleanup operations", () => {
    it("should cleanup invisible rows", () => {
      const row1 = { id: "1", data: {} } as Row;
      const row2 = { id: "2", data: {} } as Row;
      const col = { key: "name", title: "Name" } as Column;
      const result: RenderResult = { text: "test", type: "text" };

      cache.set(row1, col, "value1", result, "cell");
      cache.set(row2, col, "value2", result, "cell");

      const row1Id = rowIdManager.getId(row1);
      const visibleRows = new Set([row1Id]);

      cache.cleanupInvisibleRows(visibleRows);

      // row1 should still be cached
      expect(cache.get(row1, col, "value1", "cell")).toEqual(result);

      // row2 should be removed
      expect(cache.get(row2, col, "value2", "cell")).toBeNull();
    });

    it("should cleanup invisible columns", () => {
      const row = { id: "1", data: {} } as Row;
      const col1 = { key: "col1", title: "Col 1" } as Column;
      const col2 = { key: "col2", title: "Col 2" } as Column;
      const result: RenderResult = { text: "test", type: "text" };

      cache.set(row, col1, "value1", result, "cell");
      cache.set(row, col2, "value2", result, "cell");

      const col1Id = columnIdManager.getId(col1);
      const visibleCols = new Set([col1Id]);

      cache.cleanupInvisibleColumns(visibleCols);

      // col1 should still be cached
      expect(cache.get(row, col1, "value1", "cell")).toEqual(result);

      // col2 should be removed
      expect(cache.get(row, col2, "value2", "cell")).toBeNull();
    });
  });

  describe("clear", () => {
    it("should clear all caches", () => {
      const row = { id: "1", data: {} } as Row;
      const col = { key: "name", title: "Name" } as Column;
      const result: RenderResult = { text: "test", type: "text" };

      cache.set(row, col, "test", result, "cell");
      cache.set(row, col, "active", result, "value");

      cache.clear();

      expect(cache.get(row, col, "test", "cell")).toBeNull();
      expect(cache.get(row, col, "active", "value")).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return cache statistics", () => {
      const row = { id: "1", data: {} } as Row;
      const col = { key: "name", title: "Name" } as Column;
      const result: RenderResult = { text: "test", type: "text" };

      cache.set(row, col, "test", result, "cell");
      cache.set(row, col, "active", result, "value");

      const stats = cache.getStats();

      expect(stats.cellCacheSize).toBe(1);
      expect(stats.valueCacheSize).toBe(1);
      expect(stats.maxCellCacheSize).toBe(3000);
    });
  });

  describe("manager reset", () => {
    it("should reset row IDs", () => {
      const row = { id: "1", data: {} } as Row;
      const col = { key: "name", title: "Name" } as Column;
      const result: RenderResult = { text: "test", type: "text" };

      cache.set(row, col, "test", result, "cell");
      cache.resetRowIds();

      // After reset, the row should have a new ID, so cache should miss
      expect(cache.get(row, col, "test", "cell")).toBeNull();
    });

    it("should reset column IDs", () => {
      const row = { id: "1", data: {} } as Row;
      const col = { key: "name", title: "Name" } as Column;
      const result: RenderResult = { text: "test", type: "text" };

      cache.set(row, col, "test", result, "cell");
      cache.resetColumnIds();

      // After reset, the column should have a new ID, so cache should miss
      expect(cache.get(row, col, "test", "cell")).toBeNull();
    });
  });
});