/**
 * HeaderHandler - Handles header interactions
 *
 * Manages header hover, click, sort, filter dropdown, and column reorder.
 */

import {
  Column,
  FixedType,
  SortDirection,
  SortConfig,
  FilterConfig,
  HeaderCell,
} from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { TableEvents } from "../../constants/events";
import { getFilterModeByColumnType, getColumnFilterOptions } from "../../utils";

export interface SiblingColumnInfo {
  key: string;
  left: number;
  right: number;
  center: number;
  width: number;
  leafCount: number;
  firstLeafIndex: number;
  fixed: FixedType;
}

export class HeaderHandler extends BaseHandler {
  private sortConfig: SortConfig[];
  private filterConfig: FilterConfig[];

  constructor(
    context: HandlerContext,
    eventEmitter: EventEmitter<InteractionEvents>,
    sortConfig: SortConfig[],
    filterConfig: FilterConfig[],
  ) {
    super(context, eventEmitter);
    this.sortConfig = sortConfig;
    this.filterConfig = filterConfig;
  }

  /**
   * Handle header hover
   */
  handleHeaderHover(headerCell: HeaderCell, viewportX: number, viewportY: number): void {
    const column = headerCell.column;
    const prevHoveredHeader = this.state.hoveredHeaderColumnKey;

    // Calculate header cell viewport position
    let cellViewportX: number;
    if (column.fixed === "left") {
      cellViewportX = headerCell.x;
    } else if (column.fixed === "right") {
      const rightFixedWidth = this.layoutManager.getRightFixedWidth();
      const startX = this.layoutManager.getViewportWidth() - rightFixedWidth;
      const offsetX = startX - (this.layoutManager.getLayoutInfo().totalWidth - rightFixedWidth);
      cellViewportX = headerCell.x + offsetX;
    } else {
      cellViewportX = headerCell.x - this.scrollState.scrollLeft;
    }

    const cellViewportY = headerCell.y;
    const cellWidth = headerCell.width;
    const cellHeight = headerCell.height;

    const padding = 8;
    const dragHandleWidth = 10;
    const dragHandleHeight = 10;
    const dragHandleX = cellViewportX + padding;
    const dragHandleY = cellViewportY + (cellHeight - dragHandleHeight) / 2;

    // Check if column allows reorder (default true unless explicitly set to false)
    const isReorderable = column.reorderable !== false;

    // Only check drag handle for reorderable columns
    const isOnDragHandle =
      isReorderable &&
      viewportX >= dragHandleX &&
      viewportX <= dragHandleX + dragHandleWidth &&
      viewportY >= dragHandleY &&
      viewportY <= dragHandleY + dragHandleHeight;

    // Set hovered header key (supports parent headers)
    this.state.hoveredHeaderColumnKey = column.key;

    const showFilterIndicator = column?.filterable && headerCell.isLeaf;

    let filterIconX: number | undefined;
    let sortIconX: number;

    if (showFilterIndicator) {
      filterIconX = cellViewportX + cellWidth - padding - 10;
      sortIconX = filterIconX - 16;
    } else {
      sortIconX = cellViewportX + cellWidth - padding - 10;
    }
    const sortIconY = cellViewportY + cellHeight / 2;

    const arrowWidth = 8;
    const arrowHeight = 5;
    const gap = 2;
    const hitAreaPadding = 4;

    const upArrowTop = sortIconY - gap - arrowHeight - hitAreaPadding;
    const downArrowBottom = sortIconY + gap + arrowHeight + hitAreaPadding;
    const containerLeft = sortIconX - arrowWidth / 2 - hitAreaPadding;
    const containerRight = sortIconX + arrowWidth / 2 + hitAreaPadding;

    // Only show sort/filter hover effects for leaf headers
    const isOnFilterIcon =
      headerCell.isLeaf &&
      showFilterIndicator &&
      filterIconX !== undefined &&
      Math.abs(viewportX - filterIconX) < 12;
    const isInSortContainer =
      headerCell.isLeaf &&
      column &&
      column.sortable !== false &&
      viewportX >= containerLeft &&
      viewportX <= containerRight &&
      viewportY >= upArrowTop &&
      viewportY <= downArrowBottom;

    if (isOnDragHandle) {
      this.canvas.style.cursor = "grab";
    } else if (isOnFilterIcon || isInSortContainer) {
      this.canvas.style.cursor = "pointer";
    } else {
      this.canvas.style.cursor = "default";
    }

    this.state.hoveredCell = null;
    this.state.tooltip = null;
    if (prevHoveredHeader !== this.state.hoveredHeaderColumnKey) {
      this.eventEmitter.emit(TableEvents.HEADER_HOVER, this.state.hoveredHeaderColumnKey);
    }
  }

  /**
   * Handle header mouse down
   */
  handleHeaderMouseDown(columnIndex: number, e: MouseEvent): boolean {
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const headerCell = this.layoutManager.getHeaderCellAtPosition(viewportX, viewportY);
    if (!headerCell) return false;

    const column = headerCell.column;

    // Don't allow reorder for reorderable: false columns
    if (column.reorderable === false) {
      return false;
    }

    const resizeColIndex = this.layoutManager.isResizeHandleAtPosition(
      viewportX + this.scrollState.scrollLeft,
      0,
    );

    if (resizeColIndex >= 0) {
      return false;
    }

    // Calculate viewport coordinates for fixed columns
    let cellViewportX: number;
    if (column.fixed === "left") {
      cellViewportX = headerCell.x;
    } else if (column.fixed === "right") {
      const rightFixedWidth = this.layoutManager.getRightFixedWidth();
      const viewportWidth = this.layoutManager.getViewportWidth();
      const startX = viewportWidth - rightFixedWidth;
      const totalWidth = this.layoutManager.getLayoutInfo().totalWidth;
      const offsetX = startX - (totalWidth - rightFixedWidth);
      cellViewportX = headerCell.x + offsetX;
    } else {
      cellViewportX = headerCell.x - this.scrollState.scrollLeft;
    }
    const cellViewportY = headerCell.y;
    const cellHeight = headerCell.height;

    const padding = 8;
    const dragHandleWidth = 10;
    const dragHandleHeight = 10;
    const dragHandleX = cellViewportX + padding;
    const dragHandleY = cellViewportY + (cellHeight - dragHandleHeight) / 2;

    const isOnDragHandle =
      viewportX >= dragHandleX &&
      viewportX <= dragHandleX + dragHandleWidth &&
      viewportY >= dragHandleY &&
      viewportY <= dragHandleY + dragHandleHeight;

    // Only leaf headers support sort/filter click
    if (headerCell.isLeaf && !isOnDragHandle) {
      return false; // Signal to handle header click
    }

    // Non-leaf header click outside drag handle - no action
    if (!headerCell.isLeaf && !isOnDragHandle) {
      return false;
    }

    // On drag handle - start column reorder
    let dragColumnKey = column.key;
    let dragColumnIndex = columnIndex;

    if (!headerCell.isLeaf && column.children && column.children.length > 0) {
      const firstLeaf = this.getFirstLeaf(column);
      if (firstLeaf) {
        dragColumnKey = column.key;
        dragColumnIndex = this.layoutManager.getLeafColumnIndex(firstLeaf);
        if (dragColumnIndex < 0) dragColumnIndex = columnIndex;
      }
    }

    // Calculate sibling columns
    const siblingColumns = this.calculateSiblingColumns(column);
    const dragSiblingIndex = siblingColumns.findIndex((s) => s.key === column.key);

    this.state.columnReorderState = {
      dragColumnIndex,
      dragColumnKey,
      dragStartX: viewportX,
      currentX: viewportX,
      targetColumnIndex: dragColumnIndex,
      isParentColumn: !headerCell.isLeaf,
      isFixedColumn: !!column.fixed,
      siblingColumns,
      dragSiblingIndex,
      lastSwapTime: undefined,
      lastSwapTargetKey: undefined,
    };

    return true;
  }

  /**
   * Handle header click (sort/filter)
   */
  handleHeaderClick(columnIndex: number, e: MouseEvent): void {
    const column = this.layoutManager.getLeafColumn(columnIndex);
    if (!column) return;

    this.eventEmitter.emit(TableEvents.HEADER_CLICK, column, columnIndex, e);

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const viewportPos = this.layoutManager.getLeafHeaderCellViewportPosition(columnIndex);
    if (!viewportPos) return;

    const cellViewportX = viewportPos.x;
    const cellViewportY = viewportPos.y;
    const cellWidth = viewportPos.width;
    const cellHeight = viewportPos.height;

    const showFilterIndicator = column.filterable;

    const padding = 8;
    let filterIconX: number | undefined;
    let sortIconX: number;

    if (showFilterIndicator) {
      filterIconX = cellViewportX + cellWidth - padding - 10;
      sortIconX = filterIconX - 16;
    } else {
      sortIconX = cellViewportX + cellWidth - padding - 10;
    }

    // Check filter icon click
    if (
      showFilterIndicator &&
      filterIconX !== undefined &&
      Math.abs(viewportX - filterIconX) < 12
    ) {
      this.openFilterDropdown(column, columnIndex);
      return;
    }

    if (column.sortable === false) {
      return;
    }

    const sortIconY = cellViewportY + cellHeight / 2;

    const arrowWidth = 8;
    const arrowHeight = 5;
    const gap = 2;
    const hitAreaPadding = 4;

    const upArrowTop = sortIconY - gap - arrowHeight - hitAreaPadding;
    const upArrowBottom = sortIconY - gap + hitAreaPadding;
    const downArrowTop = sortIconY + gap - hitAreaPadding;
    const downArrowBottom = sortIconY + gap + arrowHeight + hitAreaPadding;
    const containerLeft = sortIconX - arrowWidth / 2 - hitAreaPadding;
    const containerRight = sortIconX + arrowWidth / 2 + hitAreaPadding;

    const isInContainer =
      viewportX >= containerLeft &&
      viewportX <= containerRight &&
      viewportY >= upArrowTop &&
      viewportY <= downArrowBottom;

    if (isInContainer) {
      const isInUpArrow = viewportY >= upArrowTop && viewportY <= upArrowBottom;
      const isInDownArrow = viewportY >= downArrowTop && viewportY <= downArrowBottom;

      if (isInUpArrow) {
        this.setSortDirection(column, "asc", e);
      } else if (isInDownArrow) {
        this.setSortDirection(column, "desc", e);
      } else {
        this.toggleSort(column, e);
      }
    }
  }

  /**
   * Set sort direction
   */
  private setSortDirection(column: Column, direction: SortDirection, e: MouseEvent): void {
    const existingIndex = this.sortConfig.findIndex((s) => s.column === column.key);
    const currentDirection =
      existingIndex >= 0 ? this.sortConfig[existingIndex]!.direction : "none";

    if (currentDirection === direction) {
      if (e.shiftKey) {
        if (existingIndex >= 0) {
          this.sortConfig.splice(existingIndex, 1);
        }
      } else {
        this.sortConfig = [];
      }
      this.eventEmitter.emit(TableEvents.SORT_CHANGE, [...this.sortConfig]);
      return;
    }

    if (e.shiftKey) {
      if (existingIndex >= 0) {
        this.sortConfig[existingIndex]!.direction = direction;
      } else {
        this.sortConfig.push({ column: column.key, direction });
      }
    } else {
      this.sortConfig = [{ column: column.key, direction }];
    }

    this.eventEmitter.emit(TableEvents.SORT_CHANGE, [...this.sortConfig]);
  }

  /**
   * Toggle sort
   */
  private toggleSort(column: Column, _e: MouseEvent): void {
    const existingIndex = this.sortConfig.findIndex((s) => s.column === column.key);
    let newDirection: SortDirection = "asc";

    if (existingIndex >= 0) {
      const currentDirection = this.sortConfig[existingIndex]!.direction;
      if (currentDirection === "asc") {
        newDirection = "desc";
      } else if (currentDirection === "desc") {
        newDirection = "none";
      }
    }

    if (_e.shiftKey) {
      if (existingIndex >= 0) {
        if (newDirection === "none") {
          this.sortConfig.splice(existingIndex, 1);
        } else {
          this.sortConfig[existingIndex]!.direction = newDirection;
        }
      } else if (newDirection !== "none") {
        this.sortConfig.push({ column: column.key, direction: newDirection });
      }
    } else {
      if (newDirection === "none") {
        this.sortConfig = [];
      } else {
        this.sortConfig = [{ column: column.key, direction: newDirection }];
      }
    }

    this.eventEmitter.emit(TableEvents.SORT_CHANGE, [...this.sortConfig]);
  }

  /**
   * Open filter dropdown
   */
  openFilterDropdown(column: Column, columnIndex: number): void {
    const cellPos = this.layoutManager.getCellPosition(-1, columnIndex);
    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;

    const mode = getFilterModeByColumnType(column);
    if (!mode) return;

    let dropdownX: number;
    if (column.fixed === "left") {
      dropdownX = cellPos.x;
    } else if (column.fixed === "right") {
      dropdownX = cellPos.x;
    } else {
      dropdownX = cellPos.x - this.scrollState.scrollLeft;
    }

    const rowsToUse = this.allRows.length > 0 ? this.allRows : this.rows;
    const existingFilter = this.filterConfig.find((f) => f.column === column.key);

    switch (mode) {
      case "search": {
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "search",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 200),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          searchValue: (existingFilter?.value as string) ?? "",
        };
        break;
      }

      case "select": {
        const options = getColumnFilterOptions(column, rowsToUse, 0);
        const selectedValues = existingFilter ? (existingFilter.value as unknown[]) : [];
        const isLoading = options.length === 0 && rowsToUse.length > 0;

        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "select",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 200),
          options: options.map((item) => ({
            label: item.label,
            value: item.value,
            checked: selectedValues.includes(item.value),
          })),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          isLoading,
        };
        break;
      }

      case "range": {
        const existingValues = existingFilter?.value as { min?: number; max?: number } | undefined;
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "range",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 200),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          minValue: existingValues?.min ?? "",
          maxValue: existingValues?.max ?? "",
        };
        break;
      }

      case "dateRange": {
        const existingDateValues = existingFilter?.value as
          | { start?: Date; end?: Date }
          | undefined;
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "dateRange",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 240),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          startDate: existingDateValues?.start ?? null,
          endDate: existingDateValues?.end ?? null,
        };
        break;
      }

      case "boolean": {
        const existingBoolValue = existingFilter?.value as "all" | "true" | "false" | undefined;
        this.state.filterDropdown = {
          columnKey: column.key,
          mode: "boolean",
          x: dropdownX,
          y: headerHeight,
          width: Math.max(cellPos.width, 160),
          scrollTop: 0,
          hoveredIndex: -1,
          searchText: "",
          boolValue: existingBoolValue ?? "all",
        };
        break;
      }
    }

    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * Calculate sibling columns for reorder
   */
  calculateSiblingColumns(column: Column): SiblingColumnInfo[] {
    const siblings: SiblingColumnInfo[] = [];
    const scrollLeft = this.scrollState.scrollLeft;

    let siblingColumns: Column[] = [];

    if (column.parentKey) {
      const parentColumn = this.layoutManager.getColumnByKey(column.parentKey);
      if (parentColumn && parentColumn.children) {
        siblingColumns = parentColumn.children;
      }
    } else {
      const allColumns = this.layoutManager.getColumns();
      siblingColumns = allColumns.filter((col: Column) => {
        if (col.reorderable === false) return false;
        return col.fixed === column.fixed;
      });
    }

    const leftFixedWidth = this.layoutManager.getLeftFixedWidth();
    const rightFixedWidth = this.layoutManager.getRightFixedWidth();
    const viewportWidth = this.layoutManager.getViewportWidth();

    for (const sibling of siblingColumns) {
      const leafCount = this.getChildLeafCount(sibling);
      const firstLeaf = this.getFirstLeaf(sibling);
      const firstLeafIndex = firstLeaf ? this.layoutManager.getLeafColumnIndex(firstLeaf) : -1;

      if (firstLeafIndex < 0) continue;

      const width = this.layoutManager.getColumnWidth(sibling);
      const siblingFixed = sibling.fixed;

      let left = 0;

      if (siblingFixed === "left") {
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (col?.fixed === "left") {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
      } else if (siblingFixed === "right") {
        left = viewportWidth - rightFixedWidth;
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (col?.fixed === "right") {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
      } else {
        left = leftFixedWidth;
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (!col?.fixed) {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
        left -= scrollLeft;
      }

      siblings.push({
        key: sibling.key,
        left,
        right: left + width,
        center: left + width / 2,
        width,
        leafCount,
        firstLeafIndex,
        fixed: siblingFixed || false,
      });
    }

    return siblings;
  }

  /**
   * Get first leaf column from a column (possibly parent)
   */
  private getFirstLeaf(column: Column): Column | null {
    if (!column.children || column.children.length === 0) {
      return column;
    }
    return this.getFirstLeaf(column.children[0]!);
  }

  /**
   * Get child leaf count for a column
   */
  private getChildLeafCount(column: Column): number {
    if (!column.children || column.children.length === 0) {
      return 1;
    }
    let count = 0;
    for (const child of column.children) {
      count += this.getChildLeafCount(child);
    }
    return count;
  }

  /**
   * Update sort config reference
   */
  updateSortConfig(config: SortConfig[]): void {
    this.sortConfig = config;
  }

  /**
   * Update filter config reference
   */
  updateFilterConfig(config: FilterConfig[]): void {
    this.filterConfig = config;
  }
}
