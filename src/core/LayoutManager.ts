import {
  Column,
  Row,
  LayoutInfo,
  VisibleRange,
  VirtualScrollConfig,
  TableTheme,
  HeaderCell,
  CellMerge,
  HitTestResult,
  MouseRegion,
  RowBands,
  RowHitResult,
  RowPinPosition,
  ComputedSummaryRow,
} from "../types";
import { binarySearch, clamp } from "../utils";
import { RowPinManager } from "./RowPinManager";

const DEFAULT_ROW_BUFFER_SIZE = 5;
const DEFAULT_COLUMN_BUFFER_SIZE = 2;
const DEFAULT_ROW_HEIGHT = 32;
const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 500;

export class LayoutManager {
  private layoutInfo: LayoutInfo;
  private visibleRange: VisibleRange;
  private config: VirtualScrollConfig;
  private theme: TableTheme;
  private columnWidths: Map<string, number> = new Map();
  private rowHeights: number[] = [];
  private rowOffsets: number[] = [];
  private rowBands: RowBands;
  private rowPinManager?: RowPinManager;
  private rowHeightByRow: WeakMap<Row, number> = new WeakMap();
  private rowIndexByRow: WeakMap<Row, number> = new WeakMap();
  private bodyRowIndexByRow: WeakMap<Row, number> = new WeakMap();
  private rowBandOffsetByRow: WeakMap<Row, number> = new WeakMap();
  private pinnedRowByRow: WeakMap<Row, boolean> = new WeakMap();
  private bodyRowHeights: number[] = [];
  private bodyRowOffsets: number[] = [];
  private pinnedTopHeight: number = 0;
  private pinnedBottomHeight: number = 0;
  private summaryTopHeight: number = 0;
  private summaryBottomHeight: number = 0;
  private bodyViewportHeight: number = 0;
  private columnOffsets: number[] = [];
  private columns: Column[] = [];
  private headerDepth: number = 1;
  private headerCells: HeaderCell[] = [];
  private leafColumns: Column[] = [];
  private cellMergeMap: Map<string, CellMerge> = new Map();
  private cellMergeByRow: Map<number, CellMerge[]> = new Map();
  private mergedCellSet: Set<string> = new Set();
  private cellToMergeMap: Map<string, CellMerge> = new Map();

  // 动态行高支持
  private rowHeightOverrides: WeakMap<Row, number> = new WeakMap();
  private hasRowHeightOverrides: boolean = false;
  private rowHeightFn?: (row: Row, rowIndex: number) => number;
  private cachedRows: Row[] = []; // 缓存行引用，用于检测数据变化
  private rowHeightsDirty: boolean = true; // 标记行高度是否需要重新计算

  private viewportWidth: number = 0;
  private viewportHeight: number = 0;
  private scrollLeft: number = 0;
  private scrollTop: number = 0;

  private showRowNumbers: boolean = false;
  private rowNumberColumnWidth: number = 50;

  constructor(config: VirtualScrollConfig | undefined, theme: TableTheme) {
    this.config = {
      enabled: config?.enabled ?? true,
      rowBufferSize: config?.rowBufferSize ?? DEFAULT_ROW_BUFFER_SIZE,
      columnBufferSize: config?.columnBufferSize ?? DEFAULT_COLUMN_BUFFER_SIZE,
      estimatedRowHeight: config?.estimatedRowHeight ?? DEFAULT_ROW_HEIGHT,
      estimatedColumnWidth: config?.estimatedColumnWidth ?? DEFAULT_COLUMN_WIDTH,
    };
    this.theme = theme;

    this.layoutInfo = this.createEmptyLayoutInfo();
    this.rowBands = this.createEmptyRowBands();
    this.visibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };
  }

  private createEmptyRowBands(): RowBands {
    return {
      summaryTop: { type: "summary-top", rows: [], height: 0, y: this.theme.row.headerHeight },
      pinnedTop: { type: "pinned-top", rows: [], height: 0, y: this.theme.row.headerHeight },
      body: { type: "body", rows: [], height: 0, y: this.theme.row.headerHeight },
      pinnedBottom: { type: "pinned-bottom", rows: [], height: 0, y: this.viewportHeight },
      summaryBottom: { type: "summary-bottom", rows: [], height: 0, y: this.viewportHeight },
    };
  }

  setShowRowNumbers(show: boolean): void {
    this.showRowNumbers = show;
  }

  getShowRowNumbers(): boolean {
    return this.showRowNumbers;
  }

  getRowNumberColumnWidth(): number {
    return this.showRowNumbers ? this.rowNumberColumnWidth : 0;
  }

  // 占位列相关常量
  static readonly HIDDEN_PLACEHOLDER_WIDTH = 5;
  static readonly HIDDEN_PLACEHOLDER_PREFIX = "__hidden_placeholder__";

  hasLeftFixedColumns(): boolean {
    return this.leafColumns.some(
      (col) =>
        col?.fixed === "left" &&
        !(col as Column & { _isRowNumber?: boolean })._isRowNumber &&
        !col.key.startsWith(LayoutManager.HIDDEN_PLACEHOLDER_PREFIX),
    );
  }

  isHiddenPlaceholderColumn(column: Column): boolean {
    return column.key.startsWith(LayoutManager.HIDDEN_PLACEHOLDER_PREFIX);
  }

  getHiddenColumnKey(placeholderColumn: Column): string | null {
    if (this.isHiddenPlaceholderColumn(placeholderColumn)) {
      return (placeholderColumn as Column & { _hiddenColumnKey: string })._hiddenColumnKey ?? null;
    }
    return null;
  }

  private createEmptyLayoutInfo(): LayoutInfo {
    return {
      totalWidth: 0,
      totalHeight: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      headerHeight: this.theme.row.headerHeight,
      rowHeight: this.theme.row.height,
      columnWidths: [],
      rowOffsets: [],
      columnOffsets: [],
    };
  }

  setViewportSize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.layoutInfo.viewportWidth = width;
    this.layoutInfo.viewportHeight = height;
    this.updateVisibleRange();
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
    this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth;
    this.layoutInfo.rowHeight = this.theme.row.height;
  }

  setRowHeightFn(fn?: (row: Row, rowIndex: number) => number): void {
    this.rowHeightFn = fn;
    this.rowHeightsDirty = true;
  }

  setRowPinManager(rowPinManager?: RowPinManager): void {
    this.rowPinManager = rowPinManager;
    this.rowHeightsDirty = true;
  }

  setSummaryRows(
    summaryTopRows: ComputedSummaryRow[],
    summaryBottomRows: ComputedSummaryRow[],
  ): void {
    this.rowBands.summaryTop.rows = [...summaryTopRows];
    this.rowBands.summaryBottom.rows = [...summaryBottomRows];
    this.summaryTopHeight = this.calculateSummaryRowsHeight(summaryTopRows);
    this.summaryBottomHeight = this.calculateSummaryRowsHeight(summaryBottomRows);
    this.rowBands.summaryTop.height = this.summaryTopHeight;
    this.rowBands.summaryBottom.height = this.summaryBottomHeight;
    this.updateRowBandGeometry();
    this.updateVisibleRange();
  }

  getRowBands(): RowBands {
    return {
      summaryTop: { ...this.rowBands.summaryTop, rows: [...this.rowBands.summaryTop.rows] },
      pinnedTop: { ...this.rowBands.pinnedTop, rows: [...this.rowBands.pinnedTop.rows] },
      body: { ...this.rowBands.body, rows: [...this.rowBands.body.rows] },
      pinnedBottom: {
        ...this.rowBands.pinnedBottom,
        rows: [...this.rowBands.pinnedBottom.rows],
      },
      summaryBottom: {
        ...this.rowBands.summaryBottom,
        rows: [...this.rowBands.summaryBottom.rows],
      },
    };
  }

  getRowBandsForRender(): RowBands {
    return this.rowBands;
  }

  hasPinnedRows(): boolean {
    return this.rowBands.pinnedTop.rows.length > 0 || this.rowBands.pinnedBottom.rows.length > 0;
  }

  getBodyViewportHeight(): number {
    return this.bodyViewportHeight;
  }

  getBodyContentHeight(): number {
    return this.rowBands.body.height;
  }

  getRowPinPosition(row: Row): "top" | "bottom" | null {
    return this.rowPinManager?.getPosition(row) ?? null;
  }

  setRowHeight(row: Row, height: number): void {
    const clampedHeight = clamp(height, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(row, clampedHeight);
    this.hasRowHeightOverrides = true;
    this.rowHeightsDirty = true;
  }

  updateRowHeight(row: Row, height: number): boolean {
    const clampedHeight = clamp(height, this.theme.row.minHeight, this.theme.row.maxHeight);
    this.rowHeightOverrides.set(row, clampedHeight);
    this.hasRowHeightOverrides = true;

    const rowIndex = this.rowIndexByRow.get(row);
    if (rowIndex === undefined || rowIndex < 0 || rowIndex >= this.rowHeights.length) {
      this.rowHeightsDirty = true;
      return false;
    }

    const previousHeight = this.rowHeights[rowIndex] ?? this.theme.row.height;
    const delta = clampedHeight - previousHeight;
    if (delta === 0) {
      return true;
    }

    this.rowHeights[rowIndex] = clampedHeight;
    this.rowHeightByRow.set(row, clampedHeight);

    for (let i = rowIndex + 1; i < this.rowOffsets.length; i++) {
      this.rowOffsets[i] = (this.rowOffsets[i] ?? 0) + delta;
    }
    this.layoutInfo.rowOffsets = this.rowOffsets;

    const bodyRowIndex = this.bodyRowIndexByRow.get(row);
    if (bodyRowIndex !== undefined && bodyRowIndex >= 0) {
      this.bodyRowHeights[bodyRowIndex] = clampedHeight;
      for (let i = bodyRowIndex + 1; i < this.bodyRowOffsets.length; i++) {
        this.bodyRowOffsets[i] = (this.bodyRowOffsets[i] ?? 0) + delta;
      }
      this.rowBands.body.height += delta;
    } else {
      this.updatePinnedRowHeight(row, delta);
    }

    this.updateRowBandGeometry();
    this.layoutInfo.totalHeight = this.calculateTotalHeight(this.rowHeights.length);
    this.updateVisibleRange();
    return true;
  }

  updateRowPin(
    row: Row,
    previousPosition: RowPinPosition | null,
    nextPosition: RowPinPosition | null,
  ): boolean {
    const rowIndex = this.rowIndexByRow.get(row);
    if (rowIndex === undefined || rowIndex < 0 || rowIndex >= this.rowHeights.length) {
      return false;
    }

    if (previousPosition === nextPosition) {
      return true;
    }

    const height = this.getResolvedRowHeight(row);

    if (!this.removeRowFromPinSource(row, previousPosition, height)) {
      return false;
    }

    if (!this.addRowToPinTarget(row, nextPosition, rowIndex, height)) {
      return false;
    }

    this.updatePinnedBandOffsets(this.rowBands.pinnedTop.rows);
    this.updatePinnedBandOffsets(this.rowBands.pinnedBottom.rows);
    this.updateRowBandGeometry();
    this.layoutInfo.totalHeight = this.calculateTotalHeight(this.rowHeights.length);
    this.updateVisibleRange();
    return true;
  }

  clearRowHeightOverrides(): void {
    if (!this.hasRowHeightOverrides) {
      return;
    }
    this.rowHeightOverrides = new WeakMap();
    this.hasRowHeightOverrides = false;
    this.rowHeightsDirty = true;
  }

  setScrollPosition(scrollLeft: number, scrollTop: number): void {
    this.scrollLeft = scrollLeft;
    this.scrollTop = scrollTop;
    this.updateVisibleRange();
  }

  getScrollLeft(): number {
    return this.scrollLeft;
  }

  private createRowNumberColumn(hasLeftFixed: boolean): Column {
    return {
      key: `__row_number_${Date.now()}__`,
      title: "#",
      width: this.rowNumberColumnWidth,
      fixed: hasLeftFixed ? "left" : false,
      type: "text",
      align: "center",
      hideable: false,
      sortable: false,
      reorderable: false,
      _isRowNumber: true,
      render: (_value: unknown, _row: Row, _column: Column, rowIndex: number) => ({
        text: String(rowIndex + 1),
        type: "text",
        style: {
          color: this.theme.colors.placeholderText,
          horizontalAlign: "center",
        },
      }),
    } as Column & { _isRowNumber: boolean };
  }

  private hasLeftFixedColumnsIn(columns: Column[]): boolean {
    for (const column of columns) {
      if (column.fixed === "left") return true;
      if (column.children && this.hasLeftFixedColumnsIn(column.children)) return true;
    }
    return false;
  }

  private buildLayoutColumns(columns: Column[]): Column[] {
    if (!this.showRowNumbers) {
      return columns;
    }

    return [this.createRowNumberColumn(this.hasLeftFixedColumnsIn(columns)), ...columns];
  }

  getVisibleLeafColumnsForLayout(columns: Column[]): Column[] {
    const leafColumns: Column[] = [];

    const createHiddenPlaceholder = (column: Column, fixed: "left" | "right" | undefined): Column =>
      ({
        key: LayoutManager.HIDDEN_PLACEHOLDER_PREFIX + column.key,
        title: "",
        width: LayoutManager.HIDDEN_PLACEHOLDER_WIDTH,
        type: "text",
        fixed,
        _hiddenColumnKey: column.key,
      }) as Column & { _hiddenColumnKey: string };

    const findAdjacentFixed = (
      items: Column[],
      fromIndex: number,
      direction: -1 | 1,
    ): "left" | "right" | undefined => {
      for (let index = fromIndex; index >= 0 && index < items.length; index += direction) {
        const adjacent = items[index];
        if (adjacent && !adjacent.hidden) {
          return adjacent.fixed === "left" || adjacent.fixed === "right"
            ? adjacent.fixed
            : undefined;
        }
      }

      return undefined;
    };

    const collectLeaves = (items: Column[], includeEdgePlaceholders: boolean): void => {
      let accumulatedWidth = 0;
      let previousWasHidden = false;

      for (let index = 0; index < items.length; index++) {
        const column = items[index];
        if (!column) continue;

        if (column.hidden) {
          const hasPreviousVisible = items.slice(0, index).some((item) => item && !item.hidden);
          const hasNextVisible = items.slice(index + 1).some((item) => item && !item.hidden);
          const shouldAddPlaceholder = includeEdgePlaceholders
            ? hasPreviousVisible && hasNextVisible
            : (previousWasHidden === false || accumulatedWidth > 0) &&
              (hasNextVisible || accumulatedWidth > 0);

          if (shouldAddPlaceholder) {
            const previousFixed = findAdjacentFixed(items, index - 1, -1);
            const nextFixed = findAdjacentFixed(items, index + 1, 1);
            const placeholderFixed = previousFixed === nextFixed ? previousFixed : undefined;
            const placeholder = createHiddenPlaceholder(column, placeholderFixed);
            leafColumns.push(placeholder);
            accumulatedWidth += LayoutManager.HIDDEN_PLACEHOLDER_WIDTH;
          }

          previousWasHidden = true;
          continue;
        }

        previousWasHidden = false;
        if (column.children && column.children.length > 0) {
          const beforeCount = leafColumns.length;
          collectLeaves(column.children, false);
          if (leafColumns.length > beforeCount) {
            accumulatedWidth += leafColumns
              .slice(beforeCount)
              .reduce((total, leaf) => total + this.getColumnWidth(leaf), 0);
          }
        } else {
          leafColumns.push(column);
          accumulatedWidth += this.getColumnWidth(column);
        }
      }
    };

    collectLeaves(this.buildLayoutColumns(columns), true);
    return leafColumns;
  }

  calculateLayout(columns: Column[], rows: Row[]): LayoutInfo {
    // 判断是否有左侧固定列
    this.columns = this.buildLayoutColumns(columns);

    // 保留已手动调整的列宽，不要清除
    this.calculateHeaderLayout(this.columns);
    this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth;
    this.calculateColumnLayout(this.columns);
    this.calculateRowLayout(rows);
    this.calculateCellMerges(rows);

    this.layoutInfo.totalWidth = this.calculateTotalWidth();
    this.layoutInfo.totalHeight = this.calculateTotalHeight(rows.length);

    return { ...this.layoutInfo };
  }

  /**
   * 只更新列相关的布局（用于列重排、列交换等操作）
   * 避免遍历所有行，提升大数据量时的性能
   */
  calculateColumnLayoutOnly(columns: Column[]): LayoutInfo {
    this.columns = this.buildLayoutColumns(columns);

    // 只计算列相关布局，不重新计算行布局
    this.calculateHeaderLayout(this.columns);
    this.layoutInfo.headerHeight = this.theme.row.headerHeight * this.headerDepth;
    this.calculateColumnLayout(this.columns);

    this.layoutInfo.totalWidth = this.calculateTotalWidth();
    // totalHeight 不变，因为行没有变化

    return { ...this.layoutInfo };
  }

  private calculateHeaderLayout(columns: Column[]): void {
    this.headerCells = [];
    this.leafColumns = [];
    this.headerDepth = 1;

    const calculateDepthSkipHidden = (column: Column, currentDepth: number): number => {
      if (column.hidden) return currentDepth;
      if (column.children && column.children.length > 0) {
        let maxChildDepth = currentDepth;
        for (const child of column.children) {
          if (!child.hidden) {
            maxChildDepth = Math.max(
              maxChildDepth,
              calculateDepthSkipHidden(child, currentDepth + 1),
            );
          }
        }
        return maxChildDepth;
      }
      return currentDepth;
    };

    for (const column of columns) {
      if (!column.hidden) {
        this.headerDepth = Math.max(this.headerDepth, calculateDepthSkipHidden(column, 0) + 1);
      }
    }

    const processColumn = (
      column: Column,
      depth: number,
      startX: number,
      parentKey?: string,
    ): number => {
      column.depth = depth;
      column.parentKey = parentKey;

      // 处理完全隐藏的列
      if (column.hidden) {
        return 0;
      }

      if (column.children && column.children.length > 0) {
        let childX = startX;
        let totalWidth = 0;
        let visibleChildCount = 0;
        let prevChildWasHidden = false;

        for (let i = 0; i < column.children.length; i++) {
          const child = column.children[i];
          if (!child) continue;

          if (child.hidden) {
            // 检查是否需要添加占位列
            // 只有当隐藏列前后都有可见列时才添加占位
            const hasNextVisible = column.children.slice(i + 1).some((c) => c && !c.hidden);
            if (
              (prevChildWasHidden === false || totalWidth > 0) &&
              (hasNextVisible || totalWidth > 0)
            ) {
              // 查找前一个可见子列的 fixed 属性
              let prevChildFixed: "left" | "right" | undefined;
              for (let j = i - 1; j >= 0; j--) {
                const prevChild = column.children[j];
                if (prevChild && !prevChild.hidden) {
                  if (prevChild.fixed === "left" || prevChild.fixed === "right") {
                    prevChildFixed = prevChild.fixed;
                  }
                  break;
                }
              }

              // 查找后一个可见子列的 fixed 属性
              let nextChildFixed: "left" | "right" | undefined;
              for (let j = i + 1; j < column.children.length; j++) {
                const nextChild = column.children[j];
                if (nextChild && !nextChild.hidden) {
                  if (nextChild.fixed === "left" || nextChild.fixed === "right") {
                    nextChildFixed = nextChild.fixed;
                  }
                  break;
                }
              }

              // 如果前后子列的 fixed 属性相同，占位符也使用相同的 fixed 属性
              const placeholderFixed =
                prevChildFixed === nextChildFixed ? prevChildFixed : undefined;

              // 创建占位列，继承相邻列的 fixed 属性（如果相同）
              const placeholderKey = LayoutManager.HIDDEN_PLACEHOLDER_PREFIX + child.key;
              const placeholderColumn: Column = {
                key: placeholderKey,
                title: "",
                width: LayoutManager.HIDDEN_PLACEHOLDER_WIDTH,
                type: "text",
                fixed: placeholderFixed,
                _hiddenColumnKey: child.key,
              } as Column & { _hiddenColumnKey: string };

              const placeholderWidth = LayoutManager.HIDDEN_PLACEHOLDER_WIDTH;
              this.columnWidths.set(placeholderKey, placeholderWidth);

              this.leafColumns.push(placeholderColumn);

              // 添加表头单元格 - 在正确的层级
              const placeholderDepth = depth + 1;
              const placeholderRowspan = this.headerDepth - placeholderDepth;
              this.headerCells.push({
                column: placeholderColumn,
                x: childX,
                y: placeholderDepth * this.theme.row.headerHeight,
                width: placeholderWidth,
                height: this.theme.row.headerHeight * placeholderRowspan,
                rowIndex: placeholderDepth,
                colIndex: this.leafColumns.length - 1,
                colspan: 1,
                rowspan: placeholderRowspan,
                isLeaf: true,
              });

              totalWidth += placeholderWidth;
              childX += placeholderWidth;
            }
            prevChildWasHidden = true;
            continue;
          }

          prevChildWasHidden = false;
          const childWidth = processColumn(child, depth + 1, childX, column.key);
          childX += childWidth;
          totalWidth += childWidth;
          visibleChildCount++;
        }

        if (visibleChildCount === 0) {
          return 0; // 所有子列都隐藏了
        }

        // 计算 colspan 为实际可见子列数量
        this.headerCells.push({
          column,
          x: startX,
          y: depth * this.theme.row.headerHeight,
          width: totalWidth,
          height: this.theme.row.headerHeight,
          rowIndex: depth,
          colIndex: this.headerCells.length,
          colspan: visibleChildCount,
          rowspan: 1,
          isLeaf: false,
        });

        return totalWidth;
      } else {
        const width = this.getColumnWidth(column);
        this.columnWidths.set(column.key, width);

        const rowspan = this.headerDepth - depth;

        this.headerCells.push({
          column,
          x: startX,
          y: depth * this.theme.row.headerHeight,
          width,
          height: this.theme.row.headerHeight * rowspan,
          rowIndex: depth,
          colIndex: this.leafColumns.length,
          colspan: 1,
          rowspan,
          isLeaf: true,
        });

        this.leafColumns.push(column);
        return width;
      }
    };

    let x = 0;
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex];
      if (!column) continue;

      if (column.hidden) {
        // 顶级列隐藏时，检查是否需要添加占位列
        const hasNextVisible = columns.slice(colIndex + 1).some((c) => c && !c.hidden);
        const hasPrevVisible = columns.slice(0, colIndex).some((c) => c && !c.hidden);

        if (hasPrevVisible && hasNextVisible) {
          // 查找前一个可见列的 fixed 属性（只取 'left' 或 'right'）
          let prevFixed: "left" | "right" | undefined;
          for (let j = colIndex - 1; j >= 0; j--) {
            const prevCol = columns[j];
            if (prevCol && !prevCol.hidden) {
              if (prevCol.fixed === "left" || prevCol.fixed === "right") {
                prevFixed = prevCol.fixed;
              }
              break;
            }
          }

          // 查找后一个可见列的 fixed 属性（只取 'left' 或 'right'）
          let nextFixed: "left" | "right" | undefined;
          for (let j = colIndex + 1; j < columns.length; j++) {
            const nextCol = columns[j];
            if (nextCol && !nextCol.hidden) {
              if (nextCol.fixed === "left" || nextCol.fixed === "right") {
                nextFixed = nextCol.fixed;
              }
              break;
            }
          }

          // 如果前后列的 fixed 属性相同，占位符也使用相同的 fixed 属性
          const placeholderFixed = prevFixed === nextFixed ? prevFixed : undefined;

          // 创建占位列，继承相邻列的 fixed 属性（如果相同）
          const placeholderKey = LayoutManager.HIDDEN_PLACEHOLDER_PREFIX + column.key;
          const placeholderColumn: Column = {
            key: placeholderKey,
            title: "",
            width: LayoutManager.HIDDEN_PLACEHOLDER_WIDTH,
            type: "text",
            fixed: placeholderFixed,
            _hiddenColumnKey: column.key,
          } as Column & { _hiddenColumnKey: string };

          const placeholderWidth = LayoutManager.HIDDEN_PLACEHOLDER_WIDTH;
          this.columnWidths.set(placeholderKey, placeholderWidth);

          // 添加表头单元格
          this.headerCells.push({
            column: placeholderColumn,
            x: x,
            y: 0,
            width: placeholderWidth,
            height: this.theme.row.headerHeight * this.headerDepth,
            rowIndex: 0,
            colIndex: this.leafColumns.length,
            colspan: 1,
            rowspan: this.headerDepth,
            isLeaf: true,
          });

          this.leafColumns.push(placeholderColumn);
          x += placeholderWidth;
        }
        continue;
      }

      x += processColumn(column, 0, x);
    }
  }

  private calculateColumnLayout(_columns: Column[]): void {
    this.columnOffsets = [];
    const widths: number[] = [];

    let offset = 0;
    for (const column of this.leafColumns) {
      const width = this.columnWidths.get(column.key) ?? this.getColumnWidth(column);
      widths.push(width);
      this.columnOffsets.push(offset);
      offset += width;
    }

    this.layoutInfo.columnWidths = widths;
  }

  private calculateCellMerges(rows: Row[]): void {
    this.cellMergeMap.clear();
    this.cellMergeByRow.clear();
    this.mergedCellSet.clear();
    this.cellToMergeMap.clear();

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row || !row.cellMerges) continue;

      for (const merge of row.cellMerges) {
        const normalizedMerge: CellMerge = {
          ...merge,
          rowIndex: rowIndex,
        };
        const key = `${rowIndex}-${merge.columnIndex}`;
        this.cellMergeMap.set(key, normalizedMerge);
        this.cellToMergeMap.set(key, normalizedMerge);

        for (let r = rowIndex; r < rowIndex + merge.rowspan; r++) {
          if (!this.cellMergeByRow.has(r)) {
            this.cellMergeByRow.set(r, []);
          }
          this.cellMergeByRow.get(r)!.push(normalizedMerge);

          for (let c = merge.columnIndex; c < merge.columnIndex + merge.colspan; c++) {
            if (r !== rowIndex || c !== merge.columnIndex) {
              this.mergedCellSet.add(`${r}-${c}`);
              this.cellToMergeMap.set(`${r}-${c}`, normalizedMerge);
            }
          }
        }
      }
    }
  }

  private calculateRowLayout(rows: Row[]): void {
    const rowCount = rows.length;
    const defaultHeight = this.theme.row.height;

    // 检查数据是否变化：比较行数和行对象引用，避免布局层耦合业务 row id。
    const rowsChanged =
      rowCount !== this.cachedRows.length || rows.some((row, i) => row !== this.cachedRows[i]);

    // 如果数据未变化且高度未标记为脏，跳过计算
    if (!rowsChanged && !this.rowHeightsDirty && this.rowHeights.length === rowCount) {
      this.calculateRowBands(rows);
      return;
    }

    // 更新缓存
    this.cachedRows = [...rows];
    this.rowHeightsDirty = false;
    this.rowHeightByRow = new WeakMap();
    this.rowIndexByRow = new WeakMap();

    // 计算每行高度：override > rowHeightFn > default
    const fn = this.rowHeightFn;
    this.rowHeights = rows.map((row, index) => {
      const overrideHeight = this.rowHeightOverrides.get(row);
      if (overrideHeight !== undefined) {
        return clamp(overrideHeight, this.theme.row.minHeight, this.theme.row.maxHeight);
      }

      if (fn) {
        return fn(row, index);
      }

      return defaultHeight;
    });
    rows.forEach((row, index) => {
      this.rowHeightByRow.set(row, this.rowHeights[index] ?? defaultHeight);
      this.rowIndexByRow.set(row, index);
    });

    // 累加计算 offsets
    this.rowOffsets = Array.from({ length: rowCount });
    this.rowOffsets[0] = this.layoutInfo.headerHeight;
    for (let i = 1; i < rowCount; i++) {
      this.rowOffsets[i] = this.rowOffsets[i - 1]! + this.rowHeights[i - 1]!;
    }

    this.layoutInfo.rowOffsets = [...this.rowOffsets];
    this.calculateRowBands(rows);
  }

  private calculateRowBands(rows: Row[]): void {
    this.bodyRowIndexByRow = new WeakMap();
    this.rowBandOffsetByRow = new WeakMap();
    this.pinnedRowByRow = new WeakMap();

    const visibleRows = new Set(rows);
    const pinnedTopRows = this.rowPinManager
      ? this.rowPinManager.getTopRows().filter((row) => visibleRows.has(row))
      : [];
    const pinnedBottomRows = this.rowPinManager
      ? this.rowPinManager.getBottomRows().filter((row) => visibleRows.has(row))
      : [];
    const bodyRows = this.rowPinManager
      ? rows.filter((row) => !this.rowPinManager!.isPinned(row))
      : rows;

    this.pinnedTopHeight = this.calculateRowsHeight(pinnedTopRows);
    this.pinnedBottomHeight = this.calculateRowsHeight(pinnedBottomRows);
    this.bodyViewportHeight = Math.max(
      0,
      this.viewportHeight -
        this.layoutInfo.headerHeight -
        this.summaryTopHeight -
        this.pinnedTopHeight -
        this.pinnedBottomHeight -
        this.summaryBottomHeight,
    );

    const summaryTopY = this.layoutInfo.headerHeight;
    const pinnedTopY = summaryTopY + this.summaryTopHeight;
    const bodyY = pinnedTopY + this.pinnedTopHeight;
    const summaryBottomY =
      this.viewportHeight > 0
        ? Math.max(bodyY, this.viewportHeight - this.summaryBottomHeight)
        : bodyY + this.calculateRowsHeight(bodyRows) + this.pinnedBottomHeight;
    const pinnedBottomY =
      this.viewportHeight > 0
        ? Math.max(bodyY, summaryBottomY - this.pinnedBottomHeight)
        : bodyY + this.calculateRowsHeight(bodyRows);

    this.rowBands = {
      summaryTop: {
        type: "summary-top",
        rows: this.rowBands.summaryTop.rows,
        height: this.summaryTopHeight,
        y: summaryTopY,
      },
      pinnedTop: {
        type: "pinned-top",
        rows: pinnedTopRows,
        height: this.pinnedTopHeight,
        y: pinnedTopY,
      },
      body: {
        type: "body",
        rows: bodyRows,
        height: this.calculateRowsHeight(bodyRows),
        y: bodyY,
      },
      pinnedBottom: {
        type: "pinned-bottom",
        rows: pinnedBottomRows,
        height: this.pinnedBottomHeight,
        y: pinnedBottomY,
      },
      summaryBottom: {
        type: "summary-bottom",
        rows: this.rowBands.summaryBottom.rows,
        height: this.summaryBottomHeight,
        y: summaryBottomY,
      },
    };

    this.bodyRowHeights = bodyRows.map((row) => this.getResolvedRowHeight(row));
    this.bodyRowOffsets = Array.from({ length: bodyRows.length });
    if (bodyRows.length > 0) {
      this.bodyRowOffsets[0] = 0;
      for (let i = 1; i < bodyRows.length; i++) {
        this.bodyRowOffsets[i] = this.bodyRowOffsets[i - 1]! + this.bodyRowHeights[i - 1]!;
      }
    }

    let pinnedTopOffset = 0;
    for (const row of pinnedTopRows) {
      this.pinnedRowByRow.set(row, true);
      this.rowBandOffsetByRow.set(row, pinnedTopOffset);
      pinnedTopOffset += this.getResolvedRowHeight(row);
    }

    for (let i = 0; i < bodyRows.length; i++) {
      const row = bodyRows[i]!;
      this.bodyRowIndexByRow.set(row, i);
      this.rowBandOffsetByRow.set(row, this.bodyRowOffsets[i] ?? 0);
    }

    let pinnedBottomOffset = 0;
    for (const row of pinnedBottomRows) {
      this.pinnedRowByRow.set(row, true);
      this.rowBandOffsetByRow.set(row, pinnedBottomOffset);
      pinnedBottomOffset += this.getResolvedRowHeight(row);
    }
  }

  private updatePinnedRowHeight(row: Row, delta: number): void {
    const position = this.getRowPinPosition(row);
    if (position === "top") {
      this.pinnedTopHeight += delta;
      this.rowBands.pinnedTop.height = this.pinnedTopHeight;
      this.updatePinnedBandOffsets(this.rowBands.pinnedTop.rows);
      return;
    }

    if (position === "bottom") {
      this.pinnedBottomHeight += delta;
      this.rowBands.pinnedBottom.height = this.pinnedBottomHeight;
      this.updatePinnedBandOffsets(this.rowBands.pinnedBottom.rows);
    }
  }

  private removeRowFromPinSource(
    row: Row,
    previousPosition: RowPinPosition | null,
    height: number,
  ): boolean {
    if (previousPosition === "top") {
      return this.removePinnedRow(this.rowBands.pinnedTop.rows, row, () => {
        this.pinnedTopHeight -= height;
        this.rowBands.pinnedTop.height = this.pinnedTopHeight;
      });
    }

    if (previousPosition === "bottom") {
      return this.removePinnedRow(this.rowBands.pinnedBottom.rows, row, () => {
        this.pinnedBottomHeight -= height;
        this.rowBands.pinnedBottom.height = this.pinnedBottomHeight;
      });
    }

    return this.removeBodyRow(row, height);
  }

  private addRowToPinTarget(
    row: Row,
    nextPosition: RowPinPosition | null,
    rowIndex: number,
    height: number,
  ): boolean {
    if (nextPosition === "top") {
      this.rowBands.pinnedTop.rows.push(row);
      this.pinnedTopHeight += height;
      this.rowBands.pinnedTop.height = this.pinnedTopHeight;
      this.pinnedRowByRow.set(row, true);
      return true;
    }

    if (nextPosition === "bottom") {
      this.rowBands.pinnedBottom.rows.push(row);
      this.pinnedBottomHeight += height;
      this.rowBands.pinnedBottom.height = this.pinnedBottomHeight;
      this.pinnedRowByRow.set(row, true);
      return true;
    }

    this.insertBodyRow(row, rowIndex, height);
    this.pinnedRowByRow.delete(row);
    return true;
  }

  private removePinnedRow(rows: Row[], row: Row, onRemoved: () => void): boolean {
    const index = rows.indexOf(row);
    if (index < 0) {
      return false;
    }

    rows.splice(index, 1);
    this.pinnedRowByRow.delete(row);
    this.rowBandOffsetByRow.delete(row);
    onRemoved();
    return true;
  }

  private removeBodyRow(row: Row, height: number): boolean {
    const bodyIndex = this.bodyRowIndexByRow.get(row);
    if (bodyIndex === undefined || bodyIndex < 0) {
      return false;
    }

    this.rowBands.body.rows.splice(bodyIndex, 1);
    this.bodyRowHeights.splice(bodyIndex, 1);
    this.bodyRowOffsets.splice(bodyIndex, 1);
    this.rowBands.body.height -= height;
    this.bodyRowIndexByRow.delete(row);
    this.rowBandOffsetByRow.delete(row);
    this.rebuildBodyBandFrom(bodyIndex);
    return true;
  }

  private insertBodyRow(row: Row, rowIndex: number, height: number): void {
    const bodyIndex = this.findBodyInsertionIndex(rowIndex);
    this.rowBands.body.rows.splice(bodyIndex, 0, row);
    this.bodyRowHeights.splice(bodyIndex, 0, height);
    this.bodyRowOffsets.splice(bodyIndex, 0, 0);
    this.rowBands.body.height += height;
    this.rebuildBodyBandFrom(bodyIndex);
  }

  private findBodyInsertionIndex(rowIndex: number): number {
    let left = 0;
    let right = this.rowBands.body.rows.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const currentRow = this.rowBands.body.rows[mid];
      const currentIndex = currentRow ? this.getRowIndexByRef(currentRow) : -1;

      if (currentIndex < rowIndex) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  private rebuildBodyBandFrom(startIndex: number): void {
    const start = Math.max(0, startIndex);
    for (let i = start; i < this.rowBands.body.rows.length; i++) {
      this.bodyRowOffsets[i] =
        i === 0 ? 0 : (this.bodyRowOffsets[i - 1] ?? 0) + (this.bodyRowHeights[i - 1] ?? 0);

      const row = this.rowBands.body.rows[i]!;
      this.bodyRowIndexByRow.set(row, i);
      this.rowBandOffsetByRow.set(row, this.bodyRowOffsets[i] ?? 0);
    }
  }

  private updatePinnedBandOffsets(rows: Row[]): void {
    let offset = 0;
    for (const pinnedRow of rows) {
      this.rowBandOffsetByRow.set(pinnedRow, offset);
      offset += this.getResolvedRowHeight(pinnedRow);
    }
  }

  private updateRowBandGeometry(): void {
    this.bodyViewportHeight = Math.max(
      0,
      this.viewportHeight -
        this.layoutInfo.headerHeight -
        this.summaryTopHeight -
        this.pinnedTopHeight -
        this.pinnedBottomHeight -
        this.summaryBottomHeight,
    );

    const summaryTopY = this.layoutInfo.headerHeight;
    const pinnedTopY = summaryTopY + this.summaryTopHeight;
    const bodyY = pinnedTopY + this.pinnedTopHeight;
    const summaryBottomY =
      this.viewportHeight > 0
        ? Math.max(bodyY, this.viewportHeight - this.summaryBottomHeight)
        : bodyY + this.rowBands.body.height + this.pinnedBottomHeight;

    this.rowBands.summaryTop.y = summaryTopY;
    this.rowBands.pinnedTop.y = pinnedTopY;
    this.rowBands.body.y = bodyY;
    this.rowBands.pinnedBottom.y =
      this.viewportHeight > 0
        ? Math.max(bodyY, summaryBottomY - this.pinnedBottomHeight)
        : bodyY + this.rowBands.body.height;
    this.rowBands.summaryBottom.y = summaryBottomY;
  }

  private calculateRowsHeight(rows: Row[]): number {
    return rows.reduce((total, row) => total + this.getResolvedRowHeight(row), 0);
  }

  private calculateSummaryRowsHeight(rows: ComputedSummaryRow[]): number {
    return rows.reduce((total, row) => total + row.height, 0);
  }

  private getResolvedRowHeight(row: Row): number {
    return this.rowHeightByRow.get(row) ?? this.theme.row.height;
  }

  getRowIndexByRef(row: Row): number {
    return this.rowIndexByRow.get(row) ?? -1;
  }

  getBodyRowIndexByRef(row: Row): number {
    return this.bodyRowIndexByRow.get(row) ?? -1;
  }

  getRowBandOffsetByRef(row: Row): number | null {
    const bodyRowIndex = this.bodyRowIndexByRow.get(row);
    if (bodyRowIndex !== undefined && bodyRowIndex >= 0) {
      return this.bodyRowOffsets[bodyRowIndex] ?? null;
    }

    return this.rowBandOffsetByRow.get(row) ?? null;
  }

  isRowInPinnedBand(row: Row): boolean {
    return this.pinnedRowByRow.has(row);
  }

  getColumnWidth(column: Column): number {
    if (this.columnWidths.has(column.key)) {
      return this.columnWidths.get(column.key)!;
    }

    if (column.children && column.children.length > 0) {
      let totalWidth = 0;
      for (const child of column.children) {
        totalWidth += this.getColumnWidth(child);
      }
      return totalWidth;
    }

    let width = column.width ?? this.config.estimatedColumnWidth ?? DEFAULT_COLUMN_WIDTH;
    width = clamp(width, column.minWidth ?? MIN_COLUMN_WIDTH, column.maxWidth ?? MAX_COLUMN_WIDTH);

    return width;
  }

  setColumnWidth(columnKey: string, width: number): void {
    const column = this.getColumnByKey(columnKey);
    if (column) {
      const clampedWidth = clamp(
        width,
        column.minWidth ?? MIN_COLUMN_WIDTH,
        column.maxWidth ?? MAX_COLUMN_WIDTH,
      );
      this.columnWidths.set(columnKey, clampedWidth);
      this.recalculateColumnLayout();
      this.recalculateHeaderLayout();
    }
  }

  private recalculateColumnLayout(): void {
    this.columnOffsets = [];
    const widths: number[] = [];

    let offset = 0;
    for (const column of this.leafColumns) {
      const width = this.columnWidths.get(column.key) ?? this.getColumnWidth(column);
      widths.push(width);
      this.columnOffsets.push(offset);
      offset += width;
    }

    this.layoutInfo.columnWidths = widths;
    this.layoutInfo.totalWidth = this.calculateTotalWidth();
  }

  private recalculateHeaderLayout(): void {
    const updateHeaderCellPositions = (columns: Column[], startX: number): number => {
      let x = startX;
      for (const column of columns) {
        const headerCell = this.headerCells.find((hc) => hc.column === column);
        if (headerCell) {
          headerCell.x = x;
          if (column.children && column.children.length > 0) {
            headerCell.width = updateHeaderCellPositions(column.children, x);
          } else {
            headerCell.width = this.columnWidths.get(column.key) ?? this.getColumnWidth(column);
          }
          x += headerCell.width;
        }
      }
      return x - startX;
    };

    updateHeaderCellPositions(this.columns, 0);
  }

  getColumnByKey(key: string): Column | undefined {
    const findColumn = (columns: Column[]): Column | undefined => {
      for (const col of columns) {
        if (col.key === key) return col;
        if (col.children) {
          const found = findColumn(col.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findColumn(this.columns);
  }

  getLeafColumnIndexByKey(key: string): number | null {
    for (let i = 0; i < this.leafColumns.length; i++) {
      if (this.leafColumns[i]?.key === key) {
        return i;
      }
    }
    return null;
  }

  getLeafColumnIndex(column: Column): number {
    return this.leafColumns.findIndex((col) => col === column);
  }

  getRowHeight(_row: Row): number {
    return this.theme.row.height;
  }

  private calculateTotalWidth(): number {
    let total = 0;
    for (const column of this.leafColumns) {
      total += this.columnWidths.get(column.key) ?? this.getColumnWidth(column);
    }
    return total;
  }

  private calculateTotalHeight(_rowCount: number): number {
    return (
      this.layoutInfo.headerHeight +
      this.pinnedTopHeight +
      this.rowBands.body.height +
      this.pinnedBottomHeight
    );
  }

  private updateVisibleRange(): void {
    if (!this.config.enabled) {
      this.visibleRange = {
        startRow: 0,
        endRow: Math.max(0, this.rowHeights.length - 1),
        startColumn: 0,
        endColumn: Math.max(0, this.layoutInfo.columnWidths.length - 1),
      };
      return;
    }

    const headerHeight = this.layoutInfo.headerHeight;
    const rowBufferSize = this.config.rowBufferSize ?? DEFAULT_ROW_BUFFER_SIZE;
    const columnBufferSize = this.config.columnBufferSize ?? DEFAULT_COLUMN_BUFFER_SIZE;

    const bodyViewportHeight =
      this.bodyViewportHeight > 0
        ? this.bodyViewportHeight
        : Math.max(0, this.viewportHeight - headerHeight);

    const startRow = this.findBodyRowIndexAtOffset(this.scrollTop);
    const endRow = this.findBodyRowIndexAtOffset(this.scrollTop + bodyViewportHeight);

    this.visibleRange.startRow = Math.max(0, startRow - rowBufferSize);
    this.visibleRange.endRow = Math.min(this.bodyRowHeights.length - 1, endRow + rowBufferSize);

    const startColumn = this.findColumnIndexAtOffset(this.scrollLeft);
    const endColumn = this.findColumnIndexAtOffset(this.scrollLeft + this.viewportWidth);

    this.visibleRange.startColumn = Math.max(0, startColumn - columnBufferSize);
    this.visibleRange.endColumn = Math.min(
      this.layoutInfo.columnWidths.length - 1,
      endColumn + columnBufferSize,
    );
  }

  private findRowIndexAtOffset(offset: number): number {
    if (offset <= 0) return 0;
    if (this.rowOffsets.length === 0) return 0;

    const lastOffset = this.rowOffsets[this.rowOffsets.length - 1] ?? 0;
    if (offset >= lastOffset) {
      return this.rowOffsets.length - 1;
    }

    return binarySearch(this.rowOffsets, offset, (item) => item);
  }

  private findBodyRowIndexAtOffset(offset: number): number {
    if (offset <= 0) return 0;
    if (this.bodyRowOffsets.length === 0) return 0;

    const lastIndex = this.bodyRowOffsets.length - 1;
    const lastOffset = this.bodyRowOffsets[lastIndex] ?? 0;
    const lastHeight = this.bodyRowHeights[lastIndex] ?? 0;
    if (offset >= lastOffset + lastHeight) {
      return lastIndex;
    }

    let left = 0;
    let right = lastIndex;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const rowOffset = this.bodyRowOffsets[mid]!;
      const rowHeight = this.bodyRowHeights[mid]!;

      if (offset >= rowOffset && offset < rowOffset + rowHeight) {
        return mid;
      }

      if (offset < rowOffset) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return Math.max(0, Math.min(lastIndex, left));
  }

  private findRowInBandAtOffset(rows: Row[], offset: number): Row | null {
    if (offset < 0) {
      return null;
    }

    let currentOffset = 0;
    for (const row of rows) {
      const height = this.getResolvedRowHeight(row);
      if (offset >= currentOffset && offset < currentOffset + height) {
        return row;
      }
      currentOffset += height;
    }

    return null;
  }

  private findSummaryRowInBandAtOffset(
    rows: ComputedSummaryRow[],
    offset: number,
  ): ComputedSummaryRow | null {
    if (offset < 0) {
      return null;
    }

    let currentOffset = 0;
    for (const row of rows) {
      if (offset >= currentOffset && offset < currentOffset + row.height) {
        return row;
      }
      currentOffset += row.height;
    }

    return null;
  }

  getRowViewportY(rowIndex: number, scrollTop: number = this.scrollTop): number | null {
    const row = this.cachedRows[rowIndex];
    if (!row) {
      return null;
    }

    if (this.rowBands.pinnedTop.rows.includes(row)) {
      return this.rowBands.pinnedTop.y + (this.getRowBandOffsetByRef(row) ?? 0);
    }

    if (this.getBodyRowIndexByRef(row) >= 0) {
      return this.rowBands.body.y + (this.getRowBandOffsetByRef(row) ?? 0) - scrollTop;
    }

    if (this.rowBands.pinnedBottom.rows.includes(row)) {
      return this.rowBands.pinnedBottom.y + (this.getRowBandOffsetByRef(row) ?? 0);
    }

    return null;
  }

  getCellViewportY(rowIndex: number, scrollTop: number = this.scrollTop): number {
    if (rowIndex === -1) {
      return 0;
    }

    return this.getRowViewportY(rowIndex, scrollTop) ?? this.getRowOffset(rowIndex) - scrollTop;
  }

  private findColumnIndexAtOffset(offset: number): number {
    if (offset <= 0) return 0;
    if (this.columnOffsets.length === 0) return 0;

    const lastOffset = this.columnOffsets[this.columnOffsets.length - 1] ?? 0;
    if (offset >= lastOffset) {
      return this.columnOffsets.length - 1;
    }

    return binarySearch(this.columnOffsets, offset, (item) => item);
  }

  getVisibleRange(): VisibleRange {
    return { ...this.visibleRange };
  }

  getLayoutInfo(): LayoutInfo {
    return { ...this.layoutInfo };
  }

  getHeaderCells(): HeaderCell[] {
    return [...this.headerCells];
  }

  getHeaderCellAtPosition(viewportX: number, viewportY: number): HeaderCell | null {
    // 注意：传入的参数是相对于 canvas 的视口坐标
    // 对于固定列，使用原始坐标；对于非固定列，需要考虑滚动偏移

    // 收集所有匹配的单元格
    const matchedCells: HeaderCell[] = [];

    for (const cell of this.headerCells) {
      let cellViewportX: number;

      if (cell.column.fixed === "left") {
        // 左侧固定列，使用原始 x 坐标
        cellViewportX = cell.x;
      } else if (cell.column.fixed === "right") {
        // 右侧固定列，需要计算偏移
        const rightFixedWidth = this.getRightFixedWidth();
        const startX = this.viewportWidth - rightFixedWidth;
        const offsetX = startX - (this.layoutInfo.totalWidth - rightFixedWidth);
        cellViewportX = cell.x + offsetX;
      } else {
        // 非固定列，需要减去滚动偏移
        cellViewportX = cell.x - this.scrollLeft;
      }

      if (
        viewportX >= cellViewportX &&
        viewportX < cellViewportX + cell.width &&
        viewportY >= cell.y &&
        viewportY < cell.y + cell.height
      ) {
        matchedCells.push(cell);
      }
    }

    if (matchedCells.length === 0) return null;

    // 如果只有一个匹配，直接返回
    if (matchedCells.length === 1) return matchedCells[0]!;

    // 优先返回固定列（固定列在视觉上覆盖在其他列上方）
    const fixedCell = matchedCells.find(
      (c) => c.column.fixed === "left" || c.column.fixed === "right",
    );
    if (fixedCell) {
      // 如果是叶子列直接返回，否则继续找对应的叶子列
      if (fixedCell.isLeaf) return fixedCell;

      // 找到该固定列下的叶子列
      for (const cell of this.headerCells) {
        if (!cell.isLeaf) continue;
        if (cell.column.fixed !== fixedCell.column.fixed) continue;

        let cellViewportX: number;
        if (cell.column.fixed === "left") {
          cellViewportX = cell.x;
        } else {
          const rightFixedWidth = this.getRightFixedWidth();
          const startX = this.viewportWidth - rightFixedWidth;
          const offsetX = startX - (this.layoutInfo.totalWidth - rightFixedWidth);
          cellViewportX = cell.x + offsetX;
        }

        if (viewportX >= cellViewportX && viewportX < cellViewportX + cell.width) {
          return cell;
        }
      }
    }

    // 优先返回叶子列（isLeaf: true），因为它们是更精确的匹配
    const leafCell = matchedCells.find((c) => c.isLeaf);
    if (leafCell) return leafCell;

    // 如果点击的是父列（非叶子列），找到该位置对应的叶子列
    // 通过 x 坐标查找对应的叶子列
    for (const cell of this.headerCells) {
      if (!cell.isLeaf) continue;

      let cellViewportX: number;
      if (cell.column.fixed === "left") {
        cellViewportX = cell.x;
      } else if (cell.column.fixed === "right") {
        const rightFixedWidth = this.getRightFixedWidth();
        const startX = this.viewportWidth - rightFixedWidth;
        const offsetX = startX - (this.layoutInfo.totalWidth - rightFixedWidth);
        cellViewportX = cell.x + offsetX;
      } else {
        cellViewportX = cell.x - this.scrollLeft;
      }

      // 检查叶子列是否在 x 坐标范围内
      if (viewportX >= cellViewportX && viewportX < cellViewportX + cell.width) {
        return cell;
      }
    }

    // 如果没找到对应的叶子列，返回 rowIndex 最大的（最深层）
    return matchedCells.reduce((deepest, cell) =>
      cell.rowIndex > deepest.rowIndex ? cell : deepest,
    );
  }

  getLeafHeaderCell(columnIndex: number): HeaderCell | null {
    const column = this.leafColumns[columnIndex];
    if (!column) return null;
    // 使用对象引用比较，支持相同 key 的不同列
    return this.headerCells.find((hc) => hc.column === column && hc.isLeaf) ?? null;
  }

  getLeafHeaderCellViewportPosition(
    columnIndex: number,
  ): { x: number; y: number; width: number; height: number } | null {
    const leafHeaderCell = this.getLeafHeaderCell(columnIndex);
    if (!leafHeaderCell) return null;

    const column = leafHeaderCell.column;
    let x = leafHeaderCell.x;
    const y = leafHeaderCell.y;
    const width = leafHeaderCell.width;
    const height = leafHeaderCell.height;

    if (column.fixed === "left") {
      // 左侧固定列，位置不变
    } else if (column.fixed === "right") {
      // 右侧固定列
      // 渲染时使用: headerCell.x + offsetX
      // offsetX = startX - (totalWidth - totalFixedWidth)
      // startX = viewportWidth - rightFixedWidth
      // 如果 rightFixedWidth == totalFixedWidth，则 offsetX = viewportWidth - totalWidth
      const rightFixedWidth = this.getRightFixedWidth();
      const startX = this.viewportWidth - rightFixedWidth;
      const offsetX = startX - (this.layoutInfo.totalWidth - rightFixedWidth);
      x = leafHeaderCell.x + offsetX;
    } else {
      // 普通列，减去滚动偏移
      x = x - this.scrollLeft;
    }

    return { x, y, width, height };
  }

  getLeafColumns(): Column[] {
    return [...this.leafColumns];
  }

  getColumns(): Column[] {
    return [...this.columns];
  }

  getLeafColumn(index: number): Column | undefined {
    return this.leafColumns[index];
  }

  getHeaderDepth(): number {
    return this.headerDepth;
  }

  getCellMerge(rowIndex: number, columnIndex: number): CellMerge | null {
    return this.cellToMergeMap.get(`${rowIndex}-${columnIndex}`) ?? null;
  }

  isCellMerged(rowIndex: number, columnIndex: number): boolean {
    return this.mergedCellSet.has(`${rowIndex}-${columnIndex}`);
  }

  isMergeStartCell(rowIndex: number, columnIndex: number): boolean {
    const key = `${rowIndex}-${columnIndex}`;
    return this.cellMergeMap.has(key);
  }

  getMergesAffectingRow(rowIndex: number): CellMerge[] {
    return this.cellMergeByRow.get(rowIndex) ?? [];
  }

  getMergedCellPosition(
    rowIndex: number,
    columnIndex: number,
  ): { x: number; y: number; width: number; height: number } | null {
    const merge = this.getCellMerge(rowIndex, columnIndex);
    if (!merge) return null;

    const x = this.getColumnOffset(merge.columnIndex);
    const y = this.getRowOffset(merge.rowIndex);
    let width = 0;
    for (let i = 0; i < merge.colspan; i++) {
      width += this.getColumnWidthByIndex(merge.columnIndex + i);
    }
    let height = 0;
    for (let i = 0; i < merge.rowspan; i++) {
      height += this.getRowHeightByIndex(merge.rowIndex + i);
    }

    return { x, y, width, height };
  }

  getRowOffset(rowIndex: number): number {
    return this.rowOffsets[rowIndex] ?? 0;
  }

  getColumnOffset(columnIndex: number): number {
    return this.columnOffsets[columnIndex] ?? 0;
  }

  getRowHeightByIndex(rowIndex: number): number {
    return this.rowHeights[rowIndex] ?? this.theme.row.height;
  }

  getRowHeightBounds(): { min: number; max: number } {
    return {
      min: this.theme.row.minHeight,
      max: this.theme.row.maxHeight,
    };
  }

  getColumnWidthByIndex(columnIndex: number): number {
    return this.layoutInfo.columnWidths[columnIndex] ?? DEFAULT_COLUMN_WIDTH;
  }

  getCellPosition(
    rowIndex: number,
    columnIndex: number,
  ): { x: number; y: number; width: number; height: number } {
    const column = this.leafColumns[columnIndex];
    let x = this.getColumnOffset(columnIndex);
    const y = rowIndex === -1 ? 0 : this.getRowOffset(rowIndex);
    const width = this.getColumnWidthByIndex(columnIndex);
    const height =
      rowIndex === -1 ? this.layoutInfo.headerHeight : this.getRowHeightByIndex(rowIndex);

    if (column?.fixed === "left") {
      let currentX = 0;
      for (let i = 0; i < this.leafColumns.length; i++) {
        const col = this.leafColumns[i];
        if (col?.fixed === "left") {
          if (i === columnIndex) {
            x = currentX;
            break;
          }
          currentX += this.layoutInfo.columnWidths[i]!;
        }
      }
    }

    if (column?.fixed === "right") {
      const rightFixedWidth = this.getRightFixedWidth();
      let currentX = this.viewportWidth - rightFixedWidth;
      for (let i = 0; i < this.leafColumns.length; i++) {
        const col = this.leafColumns[i];
        if (col?.fixed === "right") {
          if (i === columnIndex) {
            x = currentX;
            break;
          }
          currentX += this.layoutInfo.columnWidths[i]!;
        }
      }
    }

    return { x, y, width, height };
  }

  getCellAtPosition(
    x: number,
    y: number,
    scrollTop?: number,
  ): { rowIndex: number; columnIndex: number } | null {
    const headerHeight = this.layoutInfo.headerHeight;
    const actualScrollTop = scrollTop ?? this.scrollTop;
    const viewportY = y - actualScrollTop;

    if (viewportY < headerHeight) {
      const columnIndex = this.findColumnIndexAtPosition(x);
      if (columnIndex < 0) return null;
      return { rowIndex: -1, columnIndex };
    }

    const rowIndex = this.findRowIndexAtPosition(y);
    const columnIndex = this.findColumnIndexAtPosition(x);

    if (rowIndex < 0 || rowIndex >= this.rowHeights.length) {
      return null;
    }

    if (columnIndex < 0 || columnIndex >= this.layoutInfo.columnWidths.length) {
      return null;
    }

    const merge = this.getCellMerge(rowIndex, columnIndex);
    if (merge) {
      return { rowIndex: merge.rowIndex, columnIndex: merge.columnIndex };
    }

    return { rowIndex, columnIndex };
  }

  getRowHitAtViewportPosition(
    viewportX: number,
    viewportY: number,
    scrollTop: number,
  ): RowHitResult | null {
    const columnIndex = (() => {
      const regionDetail = this.getMouseRegion(viewportX);
      if (regionDetail === "left-fixed") {
        return this.findColumnIndexInLeftFixed(viewportX);
      }
      if (regionDetail === "right-fixed") {
        return this.findColumnIndexInRightFixed(viewportX);
      }
      return this.findColumnIndexInScrollable(viewportX + this.scrollLeft);
    })();

    if (columnIndex < 0 || columnIndex >= this.layoutInfo.columnWidths.length) {
      return null;
    }

    if (viewportY < this.layoutInfo.headerHeight) {
      return null;
    }

    if (
      this.summaryTopHeight > 0 &&
      viewportY < this.rowBands.summaryTop.y + this.summaryTopHeight
    ) {
      const row = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryTop.rows,
        viewportY - this.rowBands.summaryTop.y,
      );
      return row ? { row, band: "summary-top", columnIndex } : null;
    }

    if (viewportY < this.rowBands.pinnedTop.y + this.pinnedTopHeight) {
      const row = this.findRowInBandAtOffset(
        this.rowBands.pinnedTop.rows,
        viewportY - this.rowBands.pinnedTop.y,
      );
      return row ? { row, band: "pinned-top", columnIndex } : null;
    }

    if (
      this.summaryBottomHeight > 0 &&
      viewportY >= this.rowBands.summaryBottom.y &&
      viewportY < this.rowBands.summaryBottom.y + this.summaryBottomHeight
    ) {
      const row = this.findSummaryRowInBandAtOffset(
        this.rowBands.summaryBottom.rows,
        viewportY - this.rowBands.summaryBottom.y,
      );
      return row ? { row, band: "summary-bottom", columnIndex } : null;
    }

    if (
      this.pinnedBottomHeight > 0 &&
      viewportY >= this.rowBands.pinnedBottom.y &&
      viewportY < this.rowBands.pinnedBottom.y + this.pinnedBottomHeight
    ) {
      const row = this.findRowInBandAtOffset(
        this.rowBands.pinnedBottom.rows,
        viewportY - this.rowBands.pinnedBottom.y,
      );
      return row ? { row, band: "pinned-bottom", columnIndex } : null;
    }

    const bodyOffset = scrollTop + (viewportY - this.rowBands.body.y);
    const bodyRowIndex = this.findBodyRowIndexAtOffset(bodyOffset);
    const row = this.rowBands.body.rows[bodyRowIndex];
    return row ? { row, band: "body", columnIndex } : null;
  }

  getCellAtViewportPosition(
    viewportX: number,
    viewportY: number,
    scrollTop: number = this.scrollTop,
  ): { rowIndex: number; columnIndex: number } | null {
    if (viewportY < this.layoutInfo.headerHeight) {
      const columnIndex = this.findColumnIndexAtPosition(viewportX + this.scrollLeft);
      if (columnIndex < 0) return null;
      return { rowIndex: -1, columnIndex };
    }

    const hit = this.getRowHitAtViewportPosition(viewportX, viewportY, scrollTop);
    if (!hit) {
      return null;
    }
    if (hit.band === "summary-top" || hit.band === "summary-bottom") {
      return null;
    }

    const rowIndex = this.getRowIndexByRef(hit.row as Row);
    if (rowIndex < 0) {
      return null;
    }

    const merge = this.getCellMerge(rowIndex, hit.columnIndex);
    if (merge) {
      return { rowIndex: merge.rowIndex, columnIndex: merge.columnIndex };
    }

    return { rowIndex, columnIndex: hit.columnIndex };
  }

  private findRowIndexAtPosition(y: number): number {
    // 二分查找优化（动态行高模式下更高效）
    let left = 0;
    let right = this.rowOffsets.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const offset = this.rowOffsets[mid]!;
      const height = this.rowHeights[mid]!;

      if (y >= offset && y < offset + height) {
        return mid;
      }

      if (y < offset) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return -1;
  }

  private findColumnIndexAtPosition(x: number): number {
    const viewportX = x - this.scrollLeft;
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();

    if (leftFixedWidth > 0 && viewportX < leftFixedWidth) {
      let currentX = 0;
      for (let i = 0; i < this.leafColumns.length; i++) {
        const column = this.leafColumns[i];
        if (column?.fixed === "left") {
          const width = this.layoutInfo.columnWidths[i]!;
          if (viewportX >= currentX && viewportX < currentX + width) {
            return i;
          }
          currentX += width;
        }
      }
      // 鼠标在左侧固定列区域内，但没有匹配到具体列，返回 -1
      return -1;
    }

    if (rightFixedWidth > 0) {
      const rightFixedStartX = this.viewportWidth - rightFixedWidth;
      if (viewportX >= rightFixedStartX && viewportX < this.viewportWidth) {
        let currentX = rightFixedStartX;
        for (let i = 0; i < this.leafColumns.length; i++) {
          const column = this.leafColumns[i];
          if (column?.fixed === "right") {
            const width = this.layoutInfo.columnWidths[i]!;
            if (viewportX >= currentX && viewportX < currentX + width) {
              return i;
            }
            currentX += width;
          }
        }
        // 鼠标在右侧固定列区域内，但没有匹配到具体列，返回 -1
        return -1;
      }
    }

    for (let i = 0; i < this.columnOffsets.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }

      const offset = this.columnOffsets[i]!;
      const width = this.layoutInfo.columnWidths[i]!;
      if (x >= offset && x < offset + width) {
        return i;
      }
    }

    return -1;
  }

  public getRightFixedWidth(): number {
    let width = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "right") {
        width += this.layoutInfo.columnWidths[i] ?? 0;
      }
    }
    return width;
  }

  public getLeftFixedWidth(): number {
    let width = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left") {
        width += this.layoutInfo.columnWidths[i] ?? 0;
      }
    }
    return width;
  }

  getMaxScrollLeft(): number {
    return Math.max(0, this.layoutInfo.totalWidth - this.viewportWidth);
  }

  getMaxScrollTop(): number {
    return Math.max(0, this.rowBands.body.height - this.bodyViewportHeight);
  }

  getViewportWidth(): number {
    return this.viewportWidth;
  }

  getScrollOffsetForRow(rowIndex: number): number {
    const rowOffset = this.getRowOffset(rowIndex);
    const rowHeight = this.getRowHeightByIndex(rowIndex);

    if (rowOffset < this.scrollTop) {
      return rowOffset;
    }

    if (rowOffset + rowHeight > this.scrollTop + this.viewportHeight) {
      return rowOffset + rowHeight - this.viewportHeight;
    }

    return this.scrollTop;
  }

  getScrollOffsetForColumn(columnIndex: number): number {
    const columnOffset = this.getColumnOffset(columnIndex);
    const columnWidth = this.getColumnWidthByIndex(columnIndex);

    if (columnOffset < this.scrollLeft) {
      return columnOffset;
    }

    if (columnOffset + columnWidth > this.scrollLeft + this.viewportWidth) {
      return columnOffset + columnWidth - this.viewportWidth;
    }

    return this.scrollLeft;
  }

  getFixedColumnsInfo(columns: Column[]): {
    leftFixed: { columns: Column[]; width: number };
    rightFixed: { columns: Column[]; width: number };
    center: { columns: Column[]; width: number };
  } {
    const leftFixed: Column[] = [];
    const rightFixed: Column[] = [];
    const center: Column[] = [];

    for (const column of this.leafColumns.length > 0 ? this.leafColumns : columns) {
      if (column.fixed === "left") {
        leftFixed.push(column);
      } else if (column.fixed === "right") {
        rightFixed.push(column);
      } else {
        center.push(column);
      }
    }

    const leftWidth = leftFixed.reduce((sum, col) => sum + this.getColumnWidth(col), 0);
    const rightWidth = rightFixed.reduce((sum, col) => sum + this.getColumnWidth(col), 0);
    const centerWidth = center.reduce((sum, col) => sum + this.getColumnWidth(col), 0);

    return {
      leftFixed: { columns: leftFixed, width: leftWidth },
      rightFixed: { columns: rightFixed, width: rightWidth },
      center: { columns: center, width: centerWidth },
    };
  }

  isColumnResizable(_columnIndex: number): boolean {
    return true;
  }

  getResizeHandlePosition(columnIndex: number): number {
    let position = 0;
    for (let i = 0; i <= columnIndex; i++) {
      position += this.layoutInfo.columnWidths[i] ?? 0;
    }
    return position;
  }

  isResizeHandleAtPosition(x: number, y: number): number {
    const tolerance = 5;

    if (y > this.layoutInfo.headerHeight) {
      return -1;
    }

    const viewportX = x - this.scrollLeft;
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();

    // 左侧固定列区域
    if (leftFixedWidth > 0 && viewportX < leftFixedWidth) {
      let currentX = 0;
      for (let i = 0; i < this.leafColumns.length; i++) {
        const column = this.leafColumns[i];
        if (column?.fixed === "left") {
          currentX += this.layoutInfo.columnWidths[i]!;
          if (Math.abs(viewportX - currentX) <= tolerance) {
            return i;
          }
        } else {
          break;
        }
      }
      // 鼠标在左侧固定列区域内，但没有匹配到 resize handle
      return -1;
    }

    // 右侧固定列区域
    if (rightFixedWidth > 0) {
      const rightFixedStartX = this.viewportWidth - rightFixedWidth;
      if (viewportX >= rightFixedStartX) {
        let currentX = this.viewportWidth;

        // 右侧固定列的左边界（第一个右侧固定列的 resize handle）
        if (Math.abs(viewportX - rightFixedStartX) <= tolerance) {
          for (let i = 0; i < this.leafColumns.length; i++) {
            const column = this.leafColumns[i];
            if (column?.fixed === "right") {
              return i;
            }
          }
        }

        // 右侧固定列之间的 resize handle
        for (let i = this.leafColumns.length - 1; i >= 0; i--) {
          const column = this.leafColumns[i];
          if (column?.fixed === "right") {
            currentX -= this.layoutInfo.columnWidths[i]!;
            if (Math.abs(viewportX - currentX) <= tolerance) {
              return i;
            }
          } else {
            break;
          }
        }
        // 鼠标在右侧固定列区域内，但没有匹配到 resize handle
        return -1;
      }
    }

    // 中间滚动区域
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }
      const handleX = this.getResizeHandlePosition(i);
      if (Math.abs(x - handleX) <= tolerance) {
        return i;
      }
    }

    return -1;
  }

  getVisibleCenterColumnIndices(): number[] {
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();
    const visibleStart = this.scrollLeft + leftFixedWidth;
    const visibleEnd = this.scrollLeft + this.viewportWidth - rightFixedWidth;

    const indices: number[] = [];

    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }

      const colStart = this.columnOffsets[i] ?? 0;
      const colEnd = colStart + (this.layoutInfo.columnWidths[i] ?? 0);

      if (colEnd >= visibleStart && colStart <= visibleEnd) {
        indices.push(i);
      }
    }

    return indices;
  }

  getVisibleHeaderCells(): HeaderCell[] {
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();
    const visibleStart = this.scrollLeft + leftFixedWidth;
    const visibleEnd = this.scrollLeft + this.viewportWidth - rightFixedWidth;

    const visibleCells: HeaderCell[] = [];
    const addedKeys = new Set<string>();

    const parentKeys = new Set<string>();

    for (const headerCell of this.headerCells) {
      const colStart = headerCell.x;
      const colEnd = headerCell.x + headerCell.width;

      const isFixedLeft = headerCell.column.fixed === "left";
      const isFixedRight = headerCell.column.fixed === "right";

      const columnKey = headerCell.column.key;

      if (isFixedLeft || isFixedRight) {
        if (!addedKeys.has(columnKey)) {
          visibleCells.push(headerCell);
          addedKeys.add(columnKey);

          let parentKey = headerCell.column.parentKey;
          while (parentKey) {
            parentKeys.add(parentKey);
            const parentColumn = this.getColumnByKey(parentKey);
            parentKey = parentColumn?.parentKey;
          }
        }
        continue;
      }

      if (colEnd >= visibleStart && colStart <= visibleEnd) {
        if (!addedKeys.has(columnKey)) {
          visibleCells.push(headerCell);
          addedKeys.add(columnKey);

          let parentKey = headerCell.column.parentKey;
          while (parentKey) {
            parentKeys.add(parentKey);
            const parentColumn = this.getColumnByKey(parentKey);
            parentKey = parentColumn?.parentKey;
          }
        }
      }
    }

    for (const headerCell of this.headerCells) {
      const columnKey = headerCell.column.key;
      if (parentKeys.has(headerCell.column.key) && !addedKeys.has(columnKey)) {
        visibleCells.push(headerCell);
        addedKeys.add(columnKey);
      }
    }

    return visibleCells;
  }

  updateTheme(theme: TableTheme): void {
    this.theme = theme;
    this.layoutInfo.headerHeight = theme.row.headerHeight;
    this.layoutInfo.rowHeight = theme.row.height;
    this.rowHeightsDirty = true;
  }

  reset(): void {
    this.columnWidths.clear();
    this.rowHeights = [];
    this.rowOffsets = [];
    this.columnOffsets = [];
    this.columns = [];
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.headerCells = [];
    this.leafColumns = [];
    this.headerDepth = 1;
    this.cellMergeMap.clear();
    this.cellMergeByRow.clear();
    this.mergedCellSet.clear();
    this.cellToMergeMap.clear();
    this.rowHeightOverrides = new WeakMap();
    this.hasRowHeightOverrides = false;
    this.rowHeightFn = undefined;
    this.cachedRows = [];
    this.rowHeightsDirty = true;
    this.layoutInfo = this.createEmptyLayoutInfo();
    this.visibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };
  }

  // ==================== Hit Test Methods ====================

  /**
   * 获取鼠标所在的区域类型
   */
  getMouseRegion(viewportX: number): MouseRegion {
    const leftFixedWidth = this.getLeftFixedWidth();
    const rightFixedWidth = this.getRightFixedWidth();

    if (leftFixedWidth > 0 && viewportX < leftFixedWidth) {
      return "left-fixed";
    }

    if (rightFixedWidth > 0 && viewportX >= this.viewportWidth - rightFixedWidth) {
      return "right-fixed";
    }

    return "scrollable";
  }

  /**
   * 统一命中测试入口
   * @param viewportX 视口 X 坐标
   * @param viewportY 视口 Y 坐标
   * @param scrollbarBounds 可选的滚动条边界（由 Renderer 计算，确保与渲染一致）
   */
  hitTest(
    viewportX: number,
    viewportY: number,
    scrollbarBounds?: {
      vertical: { x: number; y: number; width: number; height: number } | null;
      horizontal: { x: number; y: number; width: number; height: number } | null;
    },
  ): HitTestResult {
    // 1. 检测滚动条区域（最高优先级）
    const scrollbarResult = this.hitTestScrollbar(viewportX, viewportY, scrollbarBounds);
    if (scrollbarResult) return scrollbarResult;

    // 2. 检测列头区域
    if (viewportY < this.layoutInfo.headerHeight) {
      return this.hitTestHeader(viewportX, viewportY);
    }

    // 3. 检测单元格区域
    return this.hitTestCell(viewportX, viewportY);
  }

  /**
   * 检测滚动条区域
   * @param viewportX 视口 X 坐标
   * @param viewportY 视口 Y 坐标
   * @param externalBounds 可选的外部滚动条边界（优先使用）
   */
  private hitTestScrollbar(
    viewportX: number,
    viewportY: number,
    externalBounds?: {
      vertical: { x: number; y: number; width: number; height: number } | null;
      horizontal: { x: number; y: number; width: number; height: number } | null;
    },
  ): HitTestResult | null {
    // 使用外部提供的滚动条边界（如果有）
    if (externalBounds) {
      // 垂直滚动条
      if (externalBounds.vertical) {
        const { x, y, width, height } = externalBounds.vertical;
        if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + height) {
          return {
            region: "scrollbar-vertical",
            scrollbar: {
              type: "vertical",
              bounds: { x, y, width, height },
            },
            viewport: { x: viewportX, y: viewportY },
          };
        }
      }

      // 水平滚动条
      if (externalBounds.horizontal) {
        const { x, y, width, height } = externalBounds.horizontal;
        if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + height) {
          return {
            region: "scrollbar-horizontal",
            scrollbar: {
              type: "horizontal",
              bounds: { x, y, width, height },
            },
            viewport: { x: viewportX, y: viewportY },
          };
        }
      }

      return null;
    }

    // 内部计算滚动条边界（与 Renderer 相同的 thumb 边界计算）
    const layoutInfo = this.layoutInfo;
    const maxScrollTop = this.getMaxScrollTop();
    const maxScrollLeft = this.getMaxScrollLeft();
    const scrollbarWidth = 10;
    const scrollbarMinSize = 30;
    const headerHeight = layoutInfo.headerHeight;

    // 垂直滚动条（检测 thumb 区域）
    if (maxScrollTop > 0) {
      const trackHeight = this.viewportHeight - headerHeight;
      const thumbHeight = Math.max(
        scrollbarMinSize,
        (this.viewportHeight / layoutInfo.totalHeight) * trackHeight,
      );
      const thumbY = headerHeight + (this.scrollTop / maxScrollTop) * (trackHeight - thumbHeight);
      const thumbX = this.viewportWidth - scrollbarWidth;
      const thumbWidth = scrollbarWidth - 2;

      if (
        viewportX >= thumbX &&
        viewportX <= thumbX + thumbWidth &&
        viewportY >= thumbY &&
        viewportY <= thumbY + thumbHeight
      ) {
        return {
          region: "scrollbar-vertical",
          scrollbar: {
            type: "vertical",
            bounds: { x: thumbX, y: thumbY, width: thumbWidth, height: thumbHeight },
          },
          viewport: { x: viewportX, y: viewportY },
        };
      }
    }

    // 水平滚动条（检测 thumb 区域）
    if (maxScrollLeft > 0) {
      const trackWidth = this.viewportWidth - (maxScrollTop > 0 ? scrollbarWidth : 0);
      const thumbWidth = Math.max(
        scrollbarMinSize,
        (this.viewportWidth / layoutInfo.totalWidth) * trackWidth,
      );
      const thumbX = (this.scrollLeft / maxScrollLeft) * (trackWidth - thumbWidth);
      const thumbY = this.viewportHeight - scrollbarWidth;
      const thumbHeight = scrollbarWidth - 2;

      if (
        viewportX >= thumbX &&
        viewportX <= thumbX + thumbWidth &&
        viewportY >= thumbY &&
        viewportY <= thumbY + thumbHeight
      ) {
        return {
          region: "scrollbar-horizontal",
          scrollbar: {
            type: "horizontal",
            bounds: { x: thumbX, y: thumbY, width: thumbWidth, height: thumbHeight },
          },
          viewport: { x: viewportX, y: viewportY },
        };
      }
    }

    return null;
  }

  /**
   * 检测列头区域
   */
  private hitTestHeader(viewportX: number, viewportY: number): HitTestResult {
    const regionDetail = this.getMouseRegion(viewportX);

    // 检测 resize handle
    const resizeIndex = this.hitTestResizeHandle(viewportX, regionDetail);
    if (resizeIndex >= 0) {
      return {
        region: "header",
        regionDetail,
        isResizeHandle: true,
        resizeColumnIndex: resizeIndex,
        viewport: { x: viewportX, y: viewportY },
      };
    }

    // 检测列头单元格
    const headerCell = this.getHeaderCellAtPosition(viewportX, viewportY);

    return {
      region: "header",
      regionDetail,
      headerCell: headerCell ?? undefined,
      viewport: { x: viewportX, y: viewportY },
    };
  }

  /**
   * 检测 resize handle（按区域检测，避免穿透）
   */
  private hitTestResizeHandle(viewportX: number, region: MouseRegion): number {
    const tolerance = 5;

    if (region === "left-fixed") {
      return this.hitTestLeftFixedResizeHandle(viewportX, tolerance);
    }

    if (region === "right-fixed") {
      return this.hitTestRightFixedResizeHandle(viewportX, tolerance);
    }

    return this.hitTestScrollableResizeHandle(viewportX, tolerance);
  }

  /**
   * 检测左侧固定列的 resize handle
   */
  private hitTestLeftFixedResizeHandle(viewportX: number, tolerance: number): number {
    let currentX = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left") {
        currentX += this.layoutInfo.columnWidths[i]!;
        if (Math.abs(viewportX - currentX) <= tolerance) {
          return i;
        }
      } else {
        break;
      }
    }
    return -1;
  }

  /**
   * 检测右侧固定列的 resize handle
   */
  private hitTestRightFixedResizeHandle(viewportX: number, tolerance: number): number {
    const rightFixedWidth = this.getRightFixedWidth();
    const rightFixedStartX = this.viewportWidth - rightFixedWidth;

    // 右侧固定列的左边界
    if (Math.abs(viewportX - rightFixedStartX) <= tolerance) {
      for (let i = 0; i < this.leafColumns.length; i++) {
        const column = this.leafColumns[i];
        if (column?.fixed === "right") {
          return i;
        }
      }
    }

    // 右侧固定列之间的边界
    let currentX = this.viewportWidth;
    for (let i = this.leafColumns.length - 1; i >= 0; i--) {
      const column = this.leafColumns[i];
      if (column?.fixed === "right") {
        currentX -= this.layoutInfo.columnWidths[i]!;
        if (Math.abs(viewportX - currentX) <= tolerance) {
          return i;
        }
      } else {
        break;
      }
    }

    return -1;
  }

  /**
   * 检测滚动区域的 resize handle
   */
  private hitTestScrollableResizeHandle(viewportX: number, tolerance: number): number {
    // 滚动区域需要转换为绝对坐标
    const x = viewportX + this.scrollLeft;

    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }

      const offset = this.columnOffsets[i];
      const width = this.layoutInfo.columnWidths[i]!;
      if (offset !== undefined && Math.abs(x - (offset + width)) <= tolerance) {
        return i;
      }
    }

    return -1;
  }

  /**
   * 检测单元格区域
   */
  private hitTestCell(viewportX: number, viewportY: number): HitTestResult {
    const regionDetail = this.getMouseRegion(viewportX);
    const rowResizeIndex = this.hitTestRowResizeHandleAtViewportPosition(viewportY);

    // 根据区域计算列索引
    let columnIndex: number;

    if (regionDetail === "left-fixed") {
      columnIndex = this.findColumnIndexInLeftFixed(viewportX);
    } else if (regionDetail === "right-fixed") {
      columnIndex = this.findColumnIndexInRightFixed(viewportX);
    } else {
      const x = viewportX + this.scrollLeft;
      columnIndex = this.findColumnIndexInScrollable(x);
    }

    if (columnIndex < 0 || columnIndex >= this.layoutInfo.columnWidths.length) {
      return { region: "outside", regionDetail, viewport: { x: viewportX, y: viewportY } };
    }

    const rowHit = this.getRowHitAtViewportPosition(viewportX, viewportY, this.scrollTop);
    if (rowHit?.band === "summary-top" || rowHit?.band === "summary-bottom") {
      return {
        region: "cell",
        regionDetail,
        rowHit,
        viewport: { x: viewportX, y: viewportY },
      };
    }

    const cell = this.getCellAtViewportPosition(viewportX, viewportY, this.scrollTop);
    if (!cell && rowResizeIndex < 0) {
      return { region: "outside", regionDetail, viewport: { x: viewportX, y: viewportY } };
    }

    const resolvedRowIndex = rowResizeIndex >= 0 ? rowResizeIndex : (cell?.rowIndex ?? -1);
    if (resolvedRowIndex < 0 || resolvedRowIndex >= this.rowHeights.length) {
      return { region: "outside", regionDetail, viewport: { x: viewportX, y: viewportY } };
    }

    // 检查合并单元格
    const merge = this.getCellMerge(resolvedRowIndex, columnIndex);
    if (merge) {
      return {
        region: "cell",
        regionDetail,
        cell: { rowIndex: merge.rowIndex, columnIndex: merge.columnIndex },
        rowHit: rowHit ?? undefined,
        isRowResizeHandle: rowResizeIndex >= 0,
        resizeRowIndex: rowResizeIndex >= 0 ? rowResizeIndex : undefined,
        viewport: { x: viewportX, y: viewportY },
      };
    }

    return {
      region: "cell",
      regionDetail,
      cell: { rowIndex: resolvedRowIndex, columnIndex },
      rowHit: rowHit ?? undefined,
      isRowResizeHandle: rowResizeIndex >= 0,
      resizeRowIndex: rowResizeIndex >= 0 ? rowResizeIndex : undefined,
      viewport: { x: viewportX, y: viewportY },
    };
  }

  private hitTestRowResizeHandleAtViewportPosition(viewportY: number): number {
    const tolerance = 4;

    const pinnedTopIndex = this.findResizeHandleInPinnedRows(
      this.rowBands.pinnedTop.rows,
      this.rowBands.pinnedTop.y,
      viewportY,
      tolerance,
    );
    if (pinnedTopIndex >= 0) {
      return pinnedTopIndex;
    }

    const bodyIndex = this.findBodyResizeHandleAtViewportY(viewportY, tolerance);
    if (bodyIndex >= 0) {
      return bodyIndex;
    }

    const pinnedBottomIndex = this.findResizeHandleInPinnedRows(
      this.rowBands.pinnedBottom.rows,
      this.rowBands.pinnedBottom.y,
      viewportY,
      tolerance,
    );
    if (pinnedBottomIndex >= 0) {
      return pinnedBottomIndex;
    }

    return -1;
  }

  private findBodyResizeHandleAtViewportY(viewportY: number, tolerance: number): number {
    if (this.rowBands.body.rows.length === 0) {
      return -1;
    }

    const bodyTop = this.rowBands.body.y;
    const bodyBottom = bodyTop + this.bodyViewportHeight;
    if (viewportY < bodyTop - tolerance || viewportY > bodyBottom + tolerance) {
      return -1;
    }

    const bodyOffset = this.scrollTop + (viewportY - bodyTop);
    const candidateBodyIndex = this.findBodyRowIndexAtOffset(Math.max(0, bodyOffset - tolerance));
    const candidateIndexes = [candidateBodyIndex, candidateBodyIndex + 1];

    for (const bodyIndex of candidateIndexes) {
      const row = this.rowBands.body.rows[bodyIndex];
      if (!row) continue;

      const bottom =
        bodyTop +
        (this.bodyRowOffsets[bodyIndex] ?? 0) +
        this.getResolvedRowHeight(row) -
        this.scrollTop;
      if (Math.abs(viewportY - bottom) <= tolerance) {
        return this.getRowIndexByRef(row);
      }
    }

    return -1;
  }

  private findResizeHandleInPinnedRows(
    rows: Row[],
    bandY: number,
    viewportY: number,
    tolerance: number,
  ): number {
    for (const row of rows) {
      const bottom =
        bandY + (this.getRowBandOffsetByRef(row) ?? 0) + this.getResolvedRowHeight(row);
      if (Math.abs(viewportY - bottom) <= tolerance) {
        return this.getRowIndexByRef(row);
      }
    }

    return -1;
  }

  /**
   * 在左侧固定列中查找列索引
   */
  private findColumnIndexInLeftFixed(viewportX: number): number {
    let currentX = 0;
    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left") {
        const width = this.layoutInfo.columnWidths[i]!;
        if (viewportX >= currentX && viewportX < currentX + width) {
          return i;
        }
        currentX += width;
      }
    }
    return -1;
  }

  /**
   * 在右侧固定列中查找列索引
   */
  private findColumnIndexInRightFixed(viewportX: number): number {
    const rightFixedWidth = this.getRightFixedWidth();
    const rightFixedStartX = this.viewportWidth - rightFixedWidth;
    let currentX = rightFixedStartX;

    for (let i = 0; i < this.leafColumns.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "right") {
        const width = this.layoutInfo.columnWidths[i]!;
        if (viewportX >= currentX && viewportX < currentX + width) {
          return i;
        }
        currentX += width;
      }
    }
    return -1;
  }

  /**
   * 在滚动区域中查找列索引
   */
  private findColumnIndexInScrollable(x: number): number {
    for (let i = 0; i < this.columnOffsets.length; i++) {
      const column = this.leafColumns[i];
      if (column?.fixed === "left" || column?.fixed === "right") {
        continue;
      }

      const offset = this.columnOffsets[i];
      const width = this.layoutInfo.columnWidths[i]!;
      if (offset !== undefined && x >= offset && x < offset + width) {
        return i;
      }
    }
    return -1;
  }
}
