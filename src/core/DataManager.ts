import {
  Row,
  Column,
  SortConfig,
  FilterConfig,
  DataManagerState,
  Change,
  HistoryAction,
  HistoryOptions,
} from "../types";
import { generateId, isPromise, getCellDisplayText, getColumnField } from "../utils";
import { RowVersionManager } from "./RenderCache";

const DEFAULT_MAX_ACTIONS = 200;

export class DataManager {
  private state: DataManagerState = {
    rows: [],
    filteredRows: [],
    sortedRows: [],
    columns: [],
    filters: [],
    sort: [],
    loading: false,
    error: null,
  };

  /** 历史记录栈 */
  private historyStack: HistoryAction[] = [];
  /** 重做记录栈 */
  private redoStack: HistoryAction[] = [];
  /** 历史记录配置 */
  private historyOptions: HistoryOptions;

  /** 行版本管理器（用于渲染缓存） */
  private rowVersionManager: RowVersionManager = new RowVersionManager();

  constructor(_rowKey?: string, historyOptions?: HistoryOptions) {
    this.historyOptions = {
      maxActions: historyOptions?.maxActions ?? DEFAULT_MAX_ACTIONS,
    };
  }

  /**
   * 获取行版本管理器
   */
  getRowVersionManager(): RowVersionManager {
    return this.rowVersionManager;
  }

  async loadRows(rows: Row[] | Promise<Row[]> | (() => Promise<Row[]>)): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    this.state.filters = [];
    this.state.sort = [];

    try {
      let tableRows: Row[];

      if (typeof rows === "function") {
        tableRows = await rows();
      } else if (isPromise<Row[]>(rows)) {
        tableRows = await rows;
      } else {
        tableRows = rows;
      }

      this.state.rows = this.processRows(tableRows);
      // 加载新数据时清空历史记录和重做记录
      this.historyStack = [];
      this.redoStack = [];

      this.applyFiltersAndSort();
    } catch (error) {
      this.state.error = error instanceof Error ? error : new Error(String(error));
      throw error;
    } finally {
      this.state.loading = false;
    }
  }

  private processRows(rows: Row[], level: number = 0): Row[] {
    return rows.map((row) => {
      const processedRow: Row = {
        id: row.id ?? generateId(),
        data: row.data,
        level,
        expanded: row.expanded ?? false,
        selected: row.selected ?? false,
        cellMerges: row.cellMerges,
      };
      if (row.children) {
        processedRow.children = this.processRows(row.children, level + 1);
      }
      return processedRow;
    });
  }

  setColumns(columns: Column[]): void {
    this.state.columns = columns;
  }

  setRows(rows: Row[]): void {
    this.state.rows = this.processRows(rows);
    this.applyFiltersAndSort();
  }

  getColumns(): Column[] {
    return this.state.columns;
  }

  /**
   * 交换两个列的位置（基于 key）
   * 前提：调用方已确保两个列是同级的
   * @param fromKey 源列的 key
   * @param toKey 目标列的 key
   * @param fromUid 源列的唯一标识符（可选，用于精确匹配相同 key 的不同列）
   * @param toUid 目标列的唯一标识符（可选）
   */
  swapColumnsByKey(fromKey: string, toKey: string): void {
    if (fromKey === toKey) return;

    const fromColumn = this.findColumnByKey(this.state.columns, fromKey);
    const toColumn = this.findColumnByKey(this.state.columns, toKey);

    if (!fromColumn || !toColumn) return;

    // 两个列都有父级
    if (fromColumn.parentKey && toColumn.parentKey) {
      // 同一父级下交换
      if (fromColumn.parentKey === toColumn.parentKey) {
        const parentColumn = this.findColumnByKey(this.state.columns, fromColumn.parentKey);
        if (parentColumn && parentColumn.children) {
          const fromIndex = parentColumn.children.findIndex((c) => c.key === fromKey);
          const toIndex = parentColumn.children.findIndex((c) => c.key === toKey);
          if (fromIndex >= 0 && toIndex >= 0) {
            const children = [...parentColumn.children];
            [children[fromIndex], children[toIndex]] = [children[toIndex]!, children[fromIndex]!];
            parentColumn.children = children;
          }
        }
      }
    } else if (!fromColumn.parentKey && !toColumn.parentKey) {
      // 两个都是顶级列，直接交换
      const fromIndex = this.state.columns.findIndex((c) => c.key === fromKey);
      const toIndex = this.state.columns.findIndex((c) => c.key === toKey);
      if (fromIndex >= 0 && toIndex >= 0) {
        const columns = [...this.state.columns];
        [columns[fromIndex], columns[toIndex]] = [columns[toIndex]!, columns[fromIndex]!];
        this.state.columns = columns;
      }
    }
  }

  reorderColumns(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;

    const leafInfo = this.getLeafColumnInfo(fromIndex);
    if (!leafInfo) return;

    const totalLeaves = this.countLeafColumns(this.state.columns);

    let actualToIndex = toIndex;
    if (fromIndex < toIndex) {
      actualToIndex = toIndex - 1;
    }

    if (actualToIndex < 0) actualToIndex = 0;
    if (actualToIndex > totalLeaves - 1) actualToIndex = totalLeaves - 1;

    const targetLeafInfo = this.getLeafColumnInfo(actualToIndex);
    if (!targetLeafInfo) return;

    if (leafInfo.parent && targetLeafInfo.parent) {
      if (leafInfo.parent === targetLeafInfo.parent) {
        const parentColumn = this.findColumnByKey(this.state.columns, leafInfo.parent);
        if (parentColumn && parentColumn.children) {
          const children = [...parentColumn.children];
          const [movedChild] = children.splice(leafInfo.indexInParent, 1);
          children.splice(targetLeafInfo.indexInParent, 0, movedChild!);
          parentColumn.children = children;
        }
      } else {
        return;
      }
    } else if (!leafInfo.parent && !targetLeafInfo.parent) {
      const columns = [...this.state.columns];
      const [movedColumn] = columns.splice(leafInfo.indexInParent, 1);
      columns.splice(targetLeafInfo.indexInParent, 0, movedColumn!);
      this.state.columns = columns;
    } else {
      return;
    }
  }

  private countLeafColumns(columns: Column[]): number {
    let count = 0;
    for (const column of columns) {
      if (column.children && column.children.length > 0) {
        count += this.countLeafColumns(column.children);
      } else {
        count++;
      }
    }
    return count;
  }

  private getLeafColumnInfo(
    leafIndex: number,
  ): { parent: string | null; indexInParent: number; column: Column } | null {
    let currentLeafIndex = 0;

    const findLeaf = (
      columns: Column[],
      parentKey: string | null,
    ): { parent: string | null; indexInParent: number; column: Column } | null => {
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i]!;
        if (column.children && column.children.length > 0) {
          const result = findLeaf(column.children, column.key);
          if (result) return result;
        } else {
          if (currentLeafIndex === leafIndex) {
            return { parent: parentKey, indexInParent: i, column };
          }
          currentLeafIndex++;
        }
      }
      return null;
    };

    return findLeaf(this.state.columns, null);
  }

  private findColumnByKey(columns: Column[], key: string): Column | null {
    for (const column of columns) {
      if (column.key === key) return column;
      if (column.children) {
        const found = this.findColumnByKey(column.children, key);
        if (found) return found;
      }
    }
    return null;
  }

  getRows(): Row[] {
    return this.state.sortedRows;
  }

  getAllRows(): Row[] {
    return this.state.rows;
  }

  /** @deprecated 使用 getRows() 或 getAllRows() 代替 */
  getOriginalRows(): Row[] {
    return this.state.rows;
  }

  getRowCount(): number {
    return this.state.sortedRows.length;
  }

  getTotalRowCount(): number {
    return this.countAllRows(this.state.rows);
  }

  private countAllRows(rows: Row[]): number {
    let count = 0;
    for (const row of rows) {
      count++;
      if (row.children && row.expanded) {
        count += this.countAllRows(row.children);
      }
    }
    return count;
  }

  sort(configs: SortConfig[]): void {
    this.state.sort = configs;
    this.applyFiltersAndSort();
  }

  getSort(): SortConfig[] {
    return [...this.state.sort];
  }

  clearSort(): void {
    this.state.sort = [];
    this.applyFiltersAndSort();
  }

  filter(filters: FilterConfig[]): void {
    this.state.filters = [...filters];
    this.applyFiltersAndSort();
  }

  getFilters(): FilterConfig[] {
    return [...this.state.filters];
  }

  clearFilters(): void {
    this.state.filters = [];
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    let rows = [...this.state.rows];

    if (this.state.filters.length > 0) {
      rows = this.applyFilters(rows);
    }

    this.state.filteredRows = rows;

    if (this.state.sort.length > 0) {
      rows = this.applySort(rows);
    }

    rows = this.flattenRowsForDisplay(rows);

    this.state.sortedRows = rows;
  }

  private flattenRowsForDisplay(rows: Row[], parentExpanded: boolean = true): Row[] {
    const result: Row[] = [];

    for (const row of rows) {
      if (!parentExpanded) continue;

      result.push(row);

      if (row.children && row.children.length > 0 && row.expanded) {
        const childRows = this.flattenRowsForDisplay(row.children, true);
        result.push(...childRows);
      }
    }

    return result;
  }

  private applyFilters(rows: Row[]): Row[] {
    const findColumn = (columns: Column[], key: string): Column | undefined => {
      for (const col of columns) {
        if (col.key === key) return col;
        if (col.children) {
          const found = findColumn(col.children, key);
          if (found) return found;
        }
      }
      return undefined;
    };

    return rows.filter((row) => {
      const matchesAllFilters = this.state.filters.every((filter) => {
        const column = findColumn(this.state.columns, filter.column);
        if (!column) return true;

        const value = row.data[getColumnField(column)];
        return this.matchesFilter(value, filter, row, column);
      });

      if (matchesAllFilters && row.children) {
        const filteredChildren = this.applyFilters(row.children);
        if (filteredChildren.length > 0) {
          return true;
        }
      }

      return matchesAllFilters;
    });
  }

  private matchesFilter(value: unknown, filter: FilterConfig, row: Row, column: Column): boolean {
    if (column.filter?.custom) {
      return column.filter.custom(value, filter.value, row);
    }

    const filterValue = filter.value;
    const strValue = String(value ?? "").toLowerCase();
    const strFilterValue = String(filterValue ?? "").toLowerCase();

    // 处理新的筛选模式
    if (filter.operator === "in") {
      if (Array.isArray(filterValue)) {
        // 如果单元格值是数组（如 tags 列），检查是否有任何元素匹配
        if (Array.isArray(value)) {
          // 对于 tags 数组，需要特殊处理
          // 检查数组中是否有对象 { text, color } 或原始值匹配
          return value.some((item) => {
            if (typeof item === "object" && item !== null && "text" in item) {
              // tags 格式: { text: "Tag1", color: "red" }
              return filterValue.some((v) => String(v) === String((item as { text: string }).text));
            }
            return filterValue.some((v) => String(v) === String(item));
          });
        }
        return filterValue.some((v) => String(v) === String(value));
      }
      return false;
    }

    // 范围筛选 (number, progress)
    if (filter.operator === "between" && typeof filterValue === "object" && filterValue !== null) {
      const range = filterValue as { min?: number; max?: number };
      const numValue = Number(value);
      if (isNaN(numValue)) return false;

      const { min, max } = range;
      if (min !== undefined && max !== undefined) {
        return numValue >= min && numValue <= max;
      } else if (min !== undefined) {
        return numValue >= min;
      } else if (max !== undefined) {
        return numValue <= max;
      }
      return true;
    }

    // 日期范围筛选
    if (
      filter.operator === "dateRange" &&
      typeof filterValue === "object" &&
      filterValue !== null
    ) {
      const dateRange = filterValue as { start?: Date | null; end?: Date | null };
      const dateValue = value instanceof Date ? value : new Date(String(value));

      if (isNaN(dateValue.getTime())) return false;

      const { start, end } = dateRange;
      if (start && end) {
        return dateValue >= start && dateValue <= end;
      } else if (start) {
        return dateValue >= start;
      } else if (end) {
        return dateValue <= end;
      }
      return true;
    }

    switch (filter.operator) {
      case "equals":
      case "=":
        return strValue === strFilterValue;
      case "notEquals":
      case "!=":
        return strValue !== strFilterValue;
      case "contains":
        return strValue.includes(strFilterValue);
      case "notContains":
        return !strValue.includes(strFilterValue);
      case "startsWith":
        return strValue.startsWith(strFilterValue);
      case "endsWith":
        return strValue.endsWith(strFilterValue);
      case "gt":
      case ">":
        return Number(value) > Number(filterValue);
      case "gte":
      case ">=":
        return Number(value) >= Number(filterValue);
      case "lt":
      case "<":
        return Number(value) < Number(filterValue);
      case "lte":
      case "<=":
        return Number(value) <= Number(filterValue);
      case "notIn":
        if (Array.isArray(filterValue)) {
          return !filterValue.some((v) => String(v) === String(value));
        }
        return false;
      case "isEmpty":
        return value === null || value === undefined || value === "";
      case "isNotEmpty":
        return value !== null && value !== undefined && value !== "";
      case "regex":
        try {
          const regex = new RegExp(String(filterValue), "i");
          return regex.test(strValue);
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  private applySort(rows: Row[]): Row[] {
    const findColumn = (columns: Column[], key: string): Column | undefined => {
      for (const col of columns) {
        if (col.key === key) return col;
        if (col.children) {
          const found = findColumn(col.children, key);
          if (found) return found;
        }
      }
      return undefined;
    };

    const sortedRows = [...rows].sort((a, b) => {
      for (const config of this.state.sort) {
        const column = findColumn(this.state.columns, config.column);
        if (!column) continue;

        const field = getColumnField(column);
        const aValue = a.data[field];
        const bValue = b.data[field];

        let comparison = this.compareValues(aValue, bValue, column.type);

        if (comparison !== 0) {
          return config.direction === "desc" ? -comparison : comparison;
        }
      }
      return 0;
    });

    return sortedRows.map((row) => {
      const sortedRow: Row = { ...row };
      if (row.children) {
        sortedRow.children = this.applySort(row.children);
      }
      return sortedRow;
    });
  }

  private compareValues(a: unknown, b: unknown, type?: string): number {
    if (a === b) return 0;
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;

    switch (type) {
      case "number":
        return Number(a) - Number(b);
      case "date":
        return new Date(a as string).getTime() - new Date(b as string).getTime();
      case "boolean":
        return Number(a) - Number(b);
      default: {
        // Try to extract numeric values from strings (e.g., "8%", "79%", "$100", "50px")
        const aNum = this.extractNumber(a);
        const bNum = this.extractNumber(b);

        // If both can be parsed as numbers, compare numerically
        if (aNum !== null && bNum !== null) {
          return aNum - bNum;
        }

        // Fallback to string comparison
        return String(a).localeCompare(String(b));
      }
    }
  }

  /**
   * Extract numeric value from a value
   * Handles: numbers, strings with numbers (e.g., "8%", "79%", "$100", "1,234.56")
   * Returns null if not a valid number
   */
  private extractNumber(value: unknown): number | null {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return null;

    // Remove common prefixes/suffixes: $, %, px, em, etc.
    // Handle comma-separated thousands: 1,234.56
    const cleaned = value
      .replace(/^[^\d.-]+/, "") // Remove leading non-numeric chars (e.g., $, €)
      .replace(/[^\d.-]+$/, "") // Remove trailing non-numeric chars (e.g., %, px)
      .replace(/,/g, ""); // Remove thousand separators

    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  updateCell(rowIndex: number, columnKey: string, value: unknown, field?: string): Change {
    const row = this.state.sortedRows[rowIndex];
    if (!row) {
      throw new Error(`Row at index ${rowIndex} not found`);
    }

    const findColumn = (columns: Column[], key: string): Column | undefined => {
      for (const col of columns) {
        if (col.key === key) return col;
        if (col.children) {
          const found = findColumn(col.children, key);
          if (found) return found;
        }
      }
      return undefined;
    };

    const columnDef = findColumn(this.state.columns, columnKey);
    const dataField = field ?? columnDef?.field ?? columnKey;
    let convertedValue = value;

    if (columnDef) {
      switch (columnDef.type) {
        case "number":
          convertedValue =
            value !== "" && value !== null && value !== undefined ? Number(value) : null;
          break;
        case "boolean":
          convertedValue = Boolean(value);
          break;
        case "date":
          if (typeof value === "string" && value) {
            convertedValue = value;
          }
          break;
        default:
          convertedValue = value;
      }
    }
    const oldValue = row.data[dataField];
    row.data[dataField] = convertedValue;

    // 更新行版本（用于渲染缓存失效）
    this.rowVersionManager.incrementVersion(row);

    // 记录到历史栈
    this.recordAction({
      type: "update",
      rowId: row.id,
      column: dataField,
      oldValue,
      newValue: convertedValue,
    });

    const stateRow = this.findStateRow(row.id);
    if (stateRow) {
      stateRow.data[dataField] = convertedValue;
    }

    this.applyFiltersAndSort();

    return {
      type: "update",
      rowIndex,
      column: dataField,
      oldValue,
      newValue: convertedValue,
    };
  }

  updateRow(rowIndex: number, data: Record<string, unknown>): Change[] {
    const row = this.state.sortedRows[rowIndex];
    if (!row) {
      throw new Error(`Row at index ${rowIndex} not found`);
    }

    const changes: Change[] = [];

    for (const [key, value] of Object.entries(data)) {
      const oldValue = row.data[key];
      if (oldValue !== value) {
        row.data[key] = value;
        changes.push({
          type: "update",
          rowIndex,
          column: key,
          oldValue,
          newValue: value,
        });
      }
    }

    // 记录每个修改到历史栈
    for (const change of changes) {
      this.recordAction({
        type: "update",
        rowId: row.id,
        column: change.column!,
        oldValue: change.oldValue,
        newValue: change.newValue,
      });
    }

    // 更新行版本（用于渲染缓存失效）
    if (changes.length > 0) {
      this.rowVersionManager.incrementVersion(row);
    }

    const stateRow = this.findStateRow(row.id);
    if (stateRow) {
      Object.assign(stateRow.data, data);
    }

    this.applyFiltersAndSort();
    return changes;
  }

  addRow(data: Record<string, unknown>, index?: number): Change {
    const newRow: Row = {
      id: generateId(),
      data,
      expanded: false,
      selected: false,
      level: 0,
    };

    const insertIndex =
      index !== undefined && index >= 0 && index <= this.state.rows.length
        ? index
        : this.state.rows.length;

    if (index !== undefined && index >= 0 && index <= this.state.rows.length) {
      this.state.rows.splice(index, 0, newRow);
    } else {
      this.state.rows.push(newRow);
    }

    // 记录到历史栈
    this.recordAction({
      type: "add",
      rowId: newRow.id,
      rowIndex: insertIndex,
      rowData: { ...newRow, data: { ...newRow.data } },
    });

    this.applyFiltersAndSort();

    return {
      type: "add",
      rowIndex: insertIndex,
      row: newRow,
    };
  }

  private findRootRowIndexByRef(targetRow: Row): number {
    return this.state.rows.findIndex((row) => row === targetRow);
  }

  addRowRelativeTo(
    targetRow: Row,
    data: Record<string, unknown>,
    placement: "above" | "below",
  ): Change {
    if ((targetRow.level ?? 0) > 0) {
      throw new Error("Adding rows relative to child rows is not supported");
    }

    const targetIndex = this.findRootRowIndexByRef(targetRow);
    if (targetIndex < 0) {
      throw new Error("Target row not found");
    }

    const insertIndex = placement === "above" ? targetIndex : targetIndex + 1;
    return this.addRow(data, insertIndex);
  }

  deleteRow(rowIndex: number): Change {
    const row = this.state.sortedRows[rowIndex];
    if (!row) {
      throw new Error(`Row at index ${rowIndex} not found`);
    }

    const originalIndex = this.state.rows.findIndex((r) => r.id === row.id);
    if (originalIndex !== -1) {
      this.state.rows.splice(originalIndex, 1);
    }

    // 记录到历史栈
    this.recordAction({
      type: "delete",
      rowId: row.id,
      rowIndex: originalIndex,
      rowData: { ...row, data: { ...row.data } },
    });

    this.applyFiltersAndSort();

    return {
      type: "delete",
      rowIndex,
      row,
    };
  }

  deleteRowByRef(row: Row): Change {
    if ((row.level ?? 0) > 0) {
      throw new Error("Deleting child rows by reference is not supported");
    }

    const originalIndex = this.findRootRowIndexByRef(row);
    if (originalIndex < 0) {
      throw new Error("Row not found");
    }

    this.state.rows.splice(originalIndex, 1);

    this.recordAction({
      type: "delete",
      rowId: row.id,
      rowIndex: originalIndex,
      rowData: { ...row, data: { ...row.data } },
    });

    this.applyFiltersAndSort();

    return {
      type: "delete",
      rowIndex: originalIndex,
      row,
    };
  }

  toggleRowExpand(rowIndex: number): boolean {
    const row = this.state.sortedRows[rowIndex];
    if (!row || !row.children) return false;

    row.expanded = !row.expanded;

    const stateRow = this.findStateRow(row.id);
    if (stateRow) {
      stateRow.expanded = row.expanded;
    }

    this.applyFiltersAndSort();
    return row.expanded;
  }

  setRowSelected(rowIndex: number, selected: boolean): void {
    const row = this.state.sortedRows[rowIndex];
    if (!row) return;

    row.selected = selected;

    const stateRow = this.findStateRow(row.id);
    if (stateRow) {
      stateRow.selected = selected;
    }
  }

  private findStateRow(id: string): Row | undefined {
    const findInRows = (rows: Row[]): Row | undefined => {
      for (const row of rows) {
        if (row.id === id) return row;
        if (row.children) {
          const found = findInRows(row.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findInRows(this.state.rows);
  }

  getSelectedRows(): number[] {
    const selectedIndices: number[] = [];
    this.state.sortedRows.forEach((row, index) => {
      if (row.selected) {
        selectedIndices.push(index);
      }
    });
    return selectedIndices;
  }

  selectAll(selected: boolean): void {
    const updateRows = (rows: Row[]): void => {
      rows.forEach((row) => {
        row.selected = selected;
        if (row.children) {
          updateRows(row.children);
        }
      });
    };

    updateRows(this.state.sortedRows);
    updateRows(this.state.rows);
  }

  getVisibleRows(startIndex: number, endIndex: number): Row[] {
    const result: Row[] = [];

    const collectVisibleRows = (rows: Row[], start: number, end: number): void => {
      let currentIndex = 0;

      for (const row of rows) {
        if (currentIndex >= start && currentIndex <= end) {
          result.push(row);
        }
        currentIndex++;

        if (row.children && row.expanded) {
          collectVisibleRows(row.children, start - currentIndex, end - currentIndex);
        }

        if (currentIndex > end) break;
      }
    };

    collectVisibleRows(this.state.sortedRows, startIndex, endIndex);
    return result;
  }

  isLoading(): boolean {
    return this.state.loading;
  }

  getError(): Error | null {
    return this.state.error;
  }

  getState(): DataManagerState {
    return { ...this.state };
  }

  /**
   * 重置表格状态（撤销所有操作）
   */
  reset(): void {
    // 撤销所有历史操作
    while (this.canUndo()) {
      this.undo();
    }
    this.state.filters = [];
    this.state.sort = [];
    this.applyFiltersAndSort();
  }

  // === 历史记录方法 ===

  /**
   * 记录操作到历史栈
   */
  private recordAction(action: HistoryAction): void {
    const maxActions = this.historyOptions.maxActions ?? DEFAULT_MAX_ACTIONS;
    if (maxActions <= 0) return;

    this.historyStack.push(action);
    // 记录新操作时清空重做栈
    this.redoStack = [];

    // 超过最大数量时移除最早的操作
    if (this.historyStack.length > maxActions) {
      this.historyStack.shift();
    }
  }

  /**
   * 撤销上一步操作
   * @returns 是否撤销成功
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    const action = this.historyStack.pop()!;
    this.undoAction(action);
    // 将撤销的操作放入重做栈
    this.redoStack.push(action);

    return true;
  }

  /**
   * 执行撤销操作
   */
  private undoAction(action: HistoryAction): void {
    switch (action.type) {
      case "update": {
        // 恢复旧值
        const row = this.findRowById(action.rowId);
        if (row) {
          row.data[action.column] = action.oldValue;
        }
        break;
      }
      case "add": {
        // 撤销新增：删除该行
        const index = this.state.rows.findIndex((r) => r.id === action.rowId);
        if (index !== -1) {
          this.state.rows.splice(index, 1);
        }
        break;
      }
      case "delete": {
        // 撤销删除：恢复该行到原位置
        if (action.rowIndex >= 0 && action.rowIndex <= this.state.rows.length) {
          this.state.rows.splice(action.rowIndex, 0, action.rowData);
        } else {
          this.state.rows.push(action.rowData);
        }
        break;
      }
    }

    this.applyFiltersAndSort();
  }

  /**
   * 重做上一步撤销的操作
   * @returns 是否重做成功
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    const action = this.redoStack.pop()!;
    this.redoAction(action);
    // 将重做的操作放回历史栈
    this.historyStack.push(action);

    return true;
  }

  /**
   * 执行重做操作
   */
  private redoAction(action: HistoryAction): void {
    switch (action.type) {
      case "update": {
        // 重做更新：恢复新值
        const row = this.findRowById(action.rowId);
        if (row) {
          row.data[action.column] = action.newValue;
        }
        break;
      }
      case "add": {
        // 重做新增：重新添加该行
        if (action.rowIndex >= 0 && action.rowIndex <= this.state.rows.length) {
          this.state.rows.splice(action.rowIndex, 0, action.rowData);
        } else {
          this.state.rows.push(action.rowData);
        }
        break;
      }
      case "delete": {
        // 重做删除：重新删除该行
        const index = this.state.rows.findIndex((r) => r.id === action.rowId);
        if (index !== -1) {
          this.state.rows.splice(index, 1);
        }
        break;
      }
    }

    this.applyFiltersAndSort();
  }

  /**
   * 根据ID查找行
   */
  private findRowById(id: string): Row | undefined {
    const findInRows = (rows: Row[]): Row | undefined => {
      for (const row of rows) {
        if (row.id === id) return row;
        if (row.children) {
          const found = findInRows(row.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findInRows(this.state.rows);
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.historyStack.length > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 获取历史记录数量
   */
  getHistoryLength(): number {
    return this.historyStack.length;
  }

  /**
   * 清空历史记录和重做记录
   */
  clearHistory(): void {
    this.historyStack = [];
    this.redoStack = [];
  }

  /**
   * 销毁实例，清理所有状态
   */
  destroy(): void {
    this.state.rows = [];
    this.state.filteredRows = [];
    this.state.sortedRows = [];
    this.state.columns = [];
    this.state.filters = [];
    this.state.sort = [];
    this.historyStack = [];
    this.redoStack = [];
  }

  /**
   * 设置历史记录配置
   */
  setHistoryOptions(options: HistoryOptions): void {
    this.historyOptions = { ...this.historyOptions, ...options };
    // 如果新配置的最大数量小于当前历史记录数量，移除多余的操作
    const maxActions = this.historyOptions.maxActions ?? DEFAULT_MAX_ACTIONS;
    while (this.historyStack.length > maxActions && maxActions > 0) {
      this.historyStack.shift();
    }
  }

  exportData(options: {
    includeHeaders?: boolean;
    includeHidden?: boolean;
    selectedOnly?: boolean;
  }): unknown[][] {
    const { includeHeaders = true, selectedOnly = false } = options;

    const rows = selectedOnly
      ? this.state.sortedRows.filter((row) => row.selected)
      : this.state.sortedRows;

    const leafColumns = this.getLeafColumnsList();

    const result: unknown[][] = [];

    if (includeHeaders) {
      result.push(leafColumns.map((col) => col.title));
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      result.push(leafColumns.map((col) => getCellDisplayText(col, row, i)));
    }

    return result;
  }

  private getLeafColumnsList(): Column[] {
    const leafColumns: Column[] = [];

    const collectLeaves = (columns: Column[]): void => {
      for (const column of columns) {
        if (column.children && column.children.length > 0) {
          collectLeaves(column.children);
        } else {
          leafColumns.push(column);
        }
      }
    };

    collectLeaves(this.state.columns);
    return leafColumns;
  }
}
