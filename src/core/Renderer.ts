import {
  Column,
  Row,
  TableTheme,
  VisibleRange,
  CellPosition,
  CellRange,
  SortConfig,
  SortDirection,
  HorizontalAlign,
  VerticalAlign,
  RenderResult,
  CheckboxConfig,
  RadioConfig,
  ButtonConfig,
  ButtonsConfig,
  InputConfig,
  SelectConfig,
  DateConfig,
  TagsConfig,
  TagItem,
  TooltipState,
  DropdownState,
  ScrollbarState,
  FilterConfig,
  FilterDropdownState,
  WatermarkConfig,
  SwitchAnimationState,
  ButtonsDropdownState,
  ImageTooltipState,
  ImageEditorState,
  ButtonHoverState,
  DisabledValue,
  SwitchConfig,
  DateDropdownState,
  ContextMenuState,
  HeaderContextMenuState,
  ImageConfig,
} from "../types";
import { LayoutManager } from "./LayoutManager";
import {
  truncateText,
  getDevicePixelRatio,
  resolveDisabled,
  LRUCache,
  getColumnField,
} from "../utils";

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private theme: TableTheme;
  private layoutManager: LayoutManager;
  private dpr: number;

  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  private dirtyRegions: Array<{ x: number; y: number; width: number; height: number }> = [];
  private watermarkConfig: WatermarkConfig | null = null;
  private expandColumnKey: string | null = null;
  private currentSwitchAnimations: Map<string, SwitchAnimationState> | undefined;
  private currentButtonHoverStates: Map<string, ButtonHoverState> | undefined;
  private hoveredPlaceholderColumnIndex: number = -1;
  private isDestroyed = false;

  // 图片缓存 (LRU 策略，最大 200 张图片)
  private imageCache: LRUCache<string, HTMLImageElement> = new LRUCache(200);
  private loadingImages: Set<string> = new Set();
  private failedImages: Set<string> = new Set();
  private imageLoadCallbacks: Map<string, Array<() => void>> = new Map();

  // 懒加载相关
  private currentVisibleRange: VisibleRange | null = null;
  private currentScrollTop: number = 0;
  private rowHeight: number = 0;
  private currentHoveredCell: CellPosition | null = null;
  private currentHoveredImageIndex: number = -1;
  private currentHoveredButtonIndex: number = -1;

  constructor(canvas: HTMLCanvasElement, theme: TableTheme, layoutManager: LayoutManager) {
    this.canvas = canvas;
    this.ctx = this.getContext(canvas);
    this.theme = theme;
    this.layoutManager = layoutManager;
    this.dpr = getDevicePixelRatio();

    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.getContext(this.offscreenCanvas);
  }

  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    return ctx;
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = this.getContext(canvas);
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
  }

  setWatermarkConfig(config: WatermarkConfig | null): void {
    this.watermarkConfig = config;
  }

  setExpandColumnKey(key: string | null): void {
    this.expandColumnKey = key;
  }

  resize(width: number, height: number): void {
    const newDpr = getDevicePixelRatio();
    if (newDpr !== this.dpr) {
      this.dpr = newDpr;
    }

    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.offscreenCanvas.width = width * this.dpr;
    this.offscreenCanvas.height = height * this.dpr;
    this.offscreenCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  updateTheme(theme: TableTheme): void {
    this.theme = theme;
  }

  markDirty(x: number, y: number, width: number, height: number): void {
    this.dirtyRegions.push({ x, y, width, height });
  }

  markFullRedraw(): void {}

  render(
    columns: Column[],
    rows: Row[],
    visibleRange: VisibleRange,
    scrollLeft: number,
    scrollTop: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      sortConfig: SortConfig[];
      filterConfig: FilterConfig[];
      showHeader: boolean;
      stripeRows: boolean;
      dropdown?: DropdownState | null;
      hoveredHeaderColumnKey?: string;
      switchAnimations?: Map<string, SwitchAnimationState>;
      buttonHoverStates?: Map<string, ButtonHoverState>;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
      headerContextMenu?: HeaderContextMenuState | null;
      hoveredImageIndex?: number;
      hoveredButtonIndex?: number;
    },
  ): void {
    this.currentSwitchAnimations = options.switchAnimations;
    this.currentButtonHoverStates = options.buttonHoverStates;
    this.currentHoveredCell = options.hoveredCell;
    this.currentHoveredImageIndex = options.hoveredImageIndex ?? -1;
    this.currentHoveredButtonIndex = options.hoveredButtonIndex ?? -1;

    // 保存可视区域信息用于图片懒加载
    this.currentVisibleRange = visibleRange;
    this.currentScrollTop = scrollTop;
    this.rowHeight = this.theme.row.height;

    const { startRow, endRow } = visibleRange;
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.background;
    this.ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    const leafColumns = this.layoutManager.getLeafColumns();
    const fixedInfo = this.layoutManager.getFixedColumnsInfo(columns);
    const hasLeftFixed = fixedInfo.leftFixed.columns.length > 0;
    const hasRightFixed = fixedInfo.rightFixed.columns.length > 0;

    // 检测悬浮的占位列索引
    this.hoveredPlaceholderColumnIndex =
      options.hoveredCell &&
      leafColumns[options.hoveredCell.columnIndex]?.key.startsWith("__hidden_placeholder__")
        ? options.hoveredCell.columnIndex
        : -1;

    const centerStartX = hasLeftFixed ? fixedInfo.leftFixed.width : 0;
    const centerEndX = viewportWidth - (hasRightFixed ? fixedInfo.rightFixed.width : 0);

    const centerColumnIndices = this.layoutManager.getVisibleCenterColumnIndices();

    const leftFixedIndices: number[] = [];
    const rightFixedIndices: number[] = [];
    for (let i = 0; i < leafColumns.length; i++) {
      const col = leafColumns[i];
      if (col) {
        if (col.fixed === "left") leftFixedIndices.push(i);
        if (col.fixed === "right") rightFixedIndices.push(i);
      }
    }

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(centerStartX, 0, centerEndX - centerStartX, viewportHeight);
    this.ctx.clip();

    this.renderCenterRows(
      leafColumns,
      rows,
      startRow,
      endRow,
      centerColumnIndices,
      scrollLeft,
      scrollTop,
      {
        ...options,
        dragColumnIndex: options.columnReorderState?.dragColumnIndex,
        columnReorderState: options.columnReorderState,
      },
    );

    this.ctx.restore();

    this.renderCenterSelections(options.selectedCells, scrollLeft, scrollTop, centerColumnIndices);

    if (options.showHeader) {
      this.renderCenterHeader(
        columns,
        centerColumnIndices,
        scrollTop,
        options.sortConfig,
        options.filterConfig,
        scrollLeft,
        options.hoveredHeaderColumnKey,
        options.columnReorderState?.dragColumnIndex,
        options.columnReorderState,
      );
    }

    if (hasLeftFixed) {
      this.renderFixedColumnsContent(leafColumns, rows, leftFixedIndices, 0, scrollTop, options);
    }

    if (hasRightFixed) {
      this.renderFixedColumnsContent(
        leafColumns,
        rows,
        rightFixedIndices,
        viewportWidth - fixedInfo.rightFixed.width,
        scrollTop,
        options,
      );
    }

    this.renderFixedSelections(
      options.selectedCells,
      scrollTop,
      leftFixedIndices,
      rightFixedIndices,
    );

    if (options.showHeader) {
      if (hasLeftFixed) {
        this.renderFixedColumnsHeader(
          leafColumns,
          leftFixedIndices,
          0,
          options.sortConfig,
          options.filterConfig,
          options.hoveredHeaderColumnKey,
          options.columnReorderState,
        );
      }

      if (hasRightFixed) {
        this.renderFixedColumnsHeader(
          leafColumns,
          rightFixedIndices,
          viewportWidth - fixedInfo.rightFixed.width,
          options.sortConfig,
          options.filterConfig,
          options.hoveredHeaderColumnKey,
          options.columnReorderState,
        );
      }
    }

    if (options.dropdown) {
      this.renderDropdown(options.dropdown);
    }

    if (options.headerContextMenu) {
      this.renderHeaderContextMenu(options.headerContextMenu);
    }

    if (options.columnReorderState) {
      this.renderColumnReorderIndicator(options.columnReorderState, rows, visibleRange, scrollTop);
    }

    this.ctx.restore();

    this.dirtyRegions = [];
  }

  private renderCenterHeader(
    _columns: Column[],
    centerColumnIndices: number[],
    _scrollTop: number,
    sortConfig: SortConfig[],
    filterConfig: FilterConfig[],
    scrollLeft: number,
    hoveredHeaderColumnKey?: string,
    _dragColumnIndex?: number,
    columnReorderState?: {
      dragColumnIndex: number;
      dragColumnKey: string;
      dragStartX: number;
      currentX: number;
      targetColumnIndex: number;
      isParentColumn?: boolean;
    },
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const visibleHeaderCells = this.layoutManager.getVisibleHeaderCells();

    let headerX = 0;
    let headerWidth = 0;
    for (const colIndex of centerColumnIndices) {
      const col = this.layoutManager.getLeafColumn(colIndex);
      if (!col) continue;
      const colOffset = this.layoutManager.getColumnOffset(colIndex);
      const colWidth = this.layoutManager.getColumnWidthByIndex(colIndex);
      if (headerWidth === 0) {
        headerX = colOffset - scrollLeft;
      }
      headerWidth += colWidth;
    }

    this.ctx.save();

    if (headerWidth > 0) {
      this.ctx.fillStyle = this.theme.colors.headerBackground;
      this.ctx.fillRect(headerX, 0, headerWidth, headerHeight);

      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.beginPath();
      this.ctx.moveTo(headerX, headerHeight);
      this.ctx.lineTo(headerX + headerWidth, headerHeight);
      this.ctx.stroke();
    }

    for (const headerCell of visibleHeaderCells) {
      if (headerCell.column.fixed === "left" || headerCell.column.fixed === "right") {
        continue;
      }

      const leafColumns = this.layoutManager.getLeafColumns();
      // 使用对象引用比较
      const columnIndex = leafColumns.findIndex((col) => col === headerCell.column);

      const reorderedIndex = centerColumnIndices.indexOf(columnIndex);
      let cellX = headerCell.x - scrollLeft;

      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== undefined) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]!);
        cellX = firstColOffset - scrollLeft + newOffset;
      }

      const isHovered = headerCell.column.key === hoveredHeaderColumnKey;

      this.renderHeaderCellMultiLevel(
        headerCell.column,
        cellX,
        headerCell.y,
        headerCell.width,
        headerCell.height,
        headerCell.colspan,
        headerCell.rowspan,
        sortConfig,
        filterConfig,
        isHovered,
        false,
        columnIndex,
      );
    }

    this.ctx.restore();
  }

  private renderHeaderCellMultiLevel(
    column: Column,
    x: number,
    y: number,
    width: number,
    height: number,
    _colspan: number,
    _rowspan: number,
    sortConfig: SortConfig[],
    filterConfig: FilterConfig[],
    isHovered: boolean = false,
    _isDragHandleHovered: boolean = false,
    columnIndex: number = -1,
  ): void {
    // 检查是否是隐藏占位列
    if (column.key.startsWith("__hidden_placeholder__")) {
      // 检查整列是否悬浮
      const isColumnHovered = this.hoveredPlaceholderColumnIndex === columnIndex;

      // 绘制背景 - 悬浮时高亮
      this.ctx.fillStyle = isColumnHovered
        ? this.theme.colors.hiddenPlaceholder.hoverBg
        : this.theme.colors.headerBackground;
      this.ctx.fillRect(x, y, width, height);
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.strokeRect(x, y, width, height);
      return;
    }

    const padding = 8;
    // 检查列是否允许拖拽排序（默认允许，除非明确设置 reorderable: false）
    const isReorderable = column.reorderable !== false;
    const showDragHandle = isReorderable && isHovered;
    const dragHandleWidth = showDragHandle ? 10 : 0;

    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(x, y, width, height);

    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";

    const sortInfo = sortConfig.find((s) => s.column === column.key);
    const sortDirection = sortInfo?.direction ?? "none";
    const isSortable = column.sortable !== false;
    // 只有叶子节点才显示排序指示器
    const showSortIndicator =
      !column.children?.length && isSortable && (sortDirection !== "none" || isHovered);
    const sortIndicatorWidth = showSortIndicator ? 20 : 0;

    const hasFilter = filterConfig.some((f) => f.column === column.key);
    // 只有叶子节点才显示筛选指示器
    const showFilterIndicator =
      !column.children?.length && column.filterable && (hasFilter || isHovered);
    const filterIndicatorWidth = showFilterIndicator ? 20 : 0;

    const maxTextWidth =
      width -
      padding * 2 -
      sortIndicatorWidth -
      filterIndicatorWidth -
      dragHandleWidth -
      (showDragHandle ? 4 : 0);
    const text = truncateText(column.title, Math.floor(maxTextWidth / 7));

    const align: HorizontalAlign = column.align ?? "center";
    let textX = x + padding + dragHandleWidth + (showDragHandle ? 4 : 0);

    if (align === "center") {
      textX =
        x +
        (width - this.ctx.measureText(text).width - sortIndicatorWidth - filterIndicatorWidth) / 2;
      if (showDragHandle) {
        textX = Math.max(textX, x + padding + dragHandleWidth + 4);
      }
    } else if (align === "right") {
      textX =
        x +
        width -
        padding -
        this.ctx.measureText(text).width -
        sortIndicatorWidth -
        filterIndicatorWidth;
    }

    const textY = y + height / 2;
    this.ctx.fillText(text, textX, textY);

    if (showDragHandle) {
      this.renderDragHandle(x + padding, y + height / 2);
    }

    if (showFilterIndicator) {
      const filterX = x + width - padding - 10;
      if (showSortIndicator) {
        this.renderSortIndicator(
          filterX - 16,
          textY,
          sortDirection === "none" ? "hover" : sortDirection,
        );
      }
      this.renderFilterIndicator(filterX, textY, hasFilter);
    } else if (showSortIndicator) {
      this.renderSortIndicator(
        x + width - padding - 10,
        textY,
        sortDirection === "none" ? "hover" : sortDirection,
      );
    }

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(x, y, width, height);
  }

  private renderCenterRows(
    columns: Column[],
    rows: Row[],
    startRow: number,
    endRow: number,
    centerColumnIndices: number[],
    scrollLeft: number,
    scrollTop: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
      dragColumnIndex?: number;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
    },
  ): void {
    const renderedMerges = new Set<string>();

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;

      this.renderCenterRow(
        columns,
        rows,
        row,
        rowIndex,
        centerColumnIndices,
        scrollLeft,
        scrollTop,
        options,
        renderedMerges,
      );
    }
  }

  private renderCenterRow(
    columns: Column[],
    rows: Row[],
    row: Row,
    rowIndex: number,
    centerColumnIndices: number[],
    scrollLeft: number,
    scrollTop: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
      dragColumnIndex?: number;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
    },
    renderedMerges: Set<string>,
  ): void {
    const { y: absRowY, height: rowHeight } = this.layoutManager.getCellPosition(rowIndex, 0);
    const rowY = absRowY - scrollTop;

    let backgroundColor = this.theme.colors.rowBackground;

    if (options.stripeRows && rowIndex % 2 === 1) {
      backgroundColor = this.theme.colors.rowAltBackground;
    }

    if (row.selected) {
      backgroundColor = this.theme.colors.rowSelectedBackground;
    }

    const isHoveredRow = options.hoveredCell?.rowIndex === rowIndex;
    if (isHoveredRow) {
      backgroundColor = this.theme.colors.rowHoverBackground;
    }

    for (const colIndex of centerColumnIndices) {
      if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
        continue;
      }

      const column = columns[colIndex];
      if (!column) continue;

      const reorderedIndex = centerColumnIndices.indexOf(colIndex);
      let x: number;

      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== undefined) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]!);
        x = firstColOffset - scrollLeft + newOffset;
      } else {
        const absX = this.layoutManager.getColumnOffset(colIndex);
        x = absX - scrollLeft;
      }

      const width = this.layoutManager.getColumnWidthByIndex(colIndex);

      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(x, rowY, width, rowHeight);
    }

    const affectingMerges = this.layoutManager.getMergesAffectingRow(rowIndex);
    for (const merge of affectingMerges) {
      if (!centerColumnIndices.includes(merge.columnIndex)) continue;

      const mergeKey = `${merge.rowIndex}-${merge.columnIndex}`;
      if (renderedMerges.has(mergeKey)) continue;

      const startRow = rows[merge.rowIndex];
      if (!startRow) continue;

      const mergedPos = this.layoutManager.getMergedCellPosition(merge.rowIndex, merge.columnIndex);
      if (!mergedPos) continue;

      const column = columns[merge.columnIndex];
      if (!column) continue;

      const value = startRow.data[getColumnField(column)];

      const mergeContainsHoveredRow =
        options.hoveredCell?.rowIndex !== undefined &&
        options.hoveredCell.rowIndex >= merge.rowIndex &&
        options.hoveredCell.rowIndex < merge.rowIndex + merge.rowspan;

      const mergeBackgroundColor = mergeContainsHoveredRow
        ? this.theme.colors.rowHoverBackground
        : backgroundColor;

      const mergeX = mergedPos.x - scrollLeft;
      const mergeY = mergedPos.y - scrollTop;

      this.ctx.fillStyle = mergeBackgroundColor;
      this.ctx.fillRect(mergeX, mergeY, mergedPos.width, mergedPos.height);

      this.renderCellWithPosition(
        column,
        startRow,
        merge.rowIndex,
        merge.columnIndex,
        value,
        mergeX,
        mergeY,
        mergedPos.width,
        mergedPos.height,
        options,
      );

      renderedMerges.add(mergeKey);
    }

    for (const colIndex of centerColumnIndices) {
      const column = columns[colIndex];
      if (!column) continue;

      if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
        continue;
      }

      const merge = this.layoutManager.getCellMerge(rowIndex, colIndex);
      if (merge) {
        continue;
      }

      const value = row.data[getColumnField(column)];

      const reorderedIndex = centerColumnIndices.indexOf(colIndex);
      let x: number;

      if (reorderedIndex !== -1) {
        let newOffset = 0;
        for (let i = 0; i < reorderedIndex; i++) {
          const idx = centerColumnIndices[i];
          if (idx !== undefined) {
            newOffset += this.layoutManager.getColumnWidthByIndex(idx);
          }
        }
        const firstColOffset = this.layoutManager.getColumnOffset(centerColumnIndices[0]!);
        x = firstColOffset - scrollLeft + newOffset;
      } else {
        const absX = this.layoutManager.getColumnOffset(colIndex);
        x = absX - scrollLeft;
      }

      const width = this.layoutManager.getColumnWidthByIndex(colIndex);
      const absY = this.layoutManager.getRowOffset(rowIndex);
      const y = absY - scrollTop;
      const height = this.layoutManager.getRowHeightByIndex(rowIndex);

      this.renderCellWithPosition(
        column,
        row,
        rowIndex,
        colIndex,
        value,
        x,
        y,
        width,
        height,
        options,
      );
    }
  }

  private renderFixedColumnsContent(
    columns: Column[],
    rows: Row[],
    fixedColumnIndices: number[],
    startX: number,
    scrollTop: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
      columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
      };
    },
  ): void {
    const viewportHeight = this.canvas.height / this.dpr;

    this.ctx.save();

    let totalFixedWidth = 0;
    for (const colIndex of fixedColumnIndices) {
      totalFixedWidth += this.layoutManager.getColumnWidthByIndex(colIndex);
    }

    const renderedMerges = new Set<string>();

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;

      const absRowY = this.layoutManager.getRowOffset(rowIndex);
      const rowHeight = this.layoutManager.getRowHeightByIndex(rowIndex);
      const rowY = absRowY - scrollTop;

      if (absRowY + rowHeight < scrollTop || absRowY > scrollTop + viewportHeight) {
        continue;
      }

      let backgroundColor = this.theme.colors.rowBackground;

      if (options.stripeRows && rowIndex % 2 === 1) {
        backgroundColor = this.theme.colors.rowAltBackground;
      }

      if (row.selected) {
        backgroundColor = this.theme.colors.rowSelectedBackground;
      }

      const isHoveredRow = options.hoveredCell?.rowIndex === rowIndex;
      if (isHoveredRow) {
        backgroundColor = this.theme.colors.rowHoverBackground;
      }

      for (const colIndex of fixedColumnIndices) {
        if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
          continue;
        }

        const colWidth = this.layoutManager.getColumnWidthByIndex(colIndex);
        const colX =
          startX +
          this.layoutManager.getColumnOffset(colIndex) -
          this.layoutManager.getColumnOffset(fixedColumnIndices[0]!);

        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(colX, rowY, colWidth, rowHeight);
      }

      const affectingMerges = this.layoutManager.getMergesAffectingRow(rowIndex);
      for (const merge of affectingMerges) {
        if (!fixedColumnIndices.includes(merge.columnIndex)) continue;

        const mergeKey = `${merge.rowIndex}-${merge.columnIndex}`;
        if (renderedMerges.has(mergeKey)) continue;

        const startRow = rows[merge.rowIndex];
        if (!startRow) continue;

        const mergedPos = this.layoutManager.getMergedCellPosition(
          merge.rowIndex,
          merge.columnIndex,
        );
        if (!mergedPos) continue;

        const column = columns[merge.columnIndex];
        if (!column) continue;

        const value = startRow.data[getColumnField(column)];

        let mergedWidth = 0;
        const mergedStartX =
          startX +
          this.layoutManager.getColumnOffset(merge.columnIndex) -
          this.layoutManager.getColumnOffset(fixedColumnIndices[0]!);
        for (let i = 0; i < merge.colspan; i++) {
          const mergedColIndex = merge.columnIndex + i;
          if (fixedColumnIndices.includes(mergedColIndex)) {
            mergedWidth += this.layoutManager.getColumnWidthByIndex(mergedColIndex);
          }
        }

        const mergeContainsHoveredRow =
          options.hoveredCell?.rowIndex !== undefined &&
          options.hoveredCell.rowIndex >= merge.rowIndex &&
          options.hoveredCell.rowIndex < merge.rowIndex + merge.rowspan;

        const mergeBackgroundColor = mergeContainsHoveredRow
          ? this.theme.colors.rowHoverBackground
          : backgroundColor;

        const mergeY = mergedPos.y - scrollTop;

        this.ctx.fillStyle = mergeBackgroundColor;
        this.ctx.fillRect(mergedStartX, mergeY, mergedWidth, mergedPos.height);

        this.renderCellWithPosition(
          column,
          startRow,
          merge.rowIndex,
          merge.columnIndex,
          value,
          mergedStartX,
          mergeY,
          mergedWidth,
          mergedPos.height,
          options,
        );

        renderedMerges.add(mergeKey);
      }

      let currentX = startX;
      for (const colIndex of fixedColumnIndices) {
        const column = columns[colIndex];
        if (!column) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }

        if (this.layoutManager.isCellMerged(rowIndex, colIndex)) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }

        const merge = this.layoutManager.getCellMerge(rowIndex, colIndex);
        if (merge) {
          currentX += this.layoutManager.getColumnWidthByIndex(colIndex);
          continue;
        }

        const width = this.layoutManager.getColumnWidthByIndex(colIndex);
        const value = row.data[getColumnField(column)];

        this.renderCellWithPosition(
          column,
          row,
          rowIndex,
          colIndex,
          value,
          currentX,
          rowY,
          width,
          rowHeight,
          options,
        );
        currentX += width;
      }
    }

    this.ctx.restore();
  }

  private renderFixedColumnsHeader(
    _columns: Column[],
    fixedColumnIndices: number[],
    startX: number,
    sortConfig: SortConfig[],
    filterConfig: FilterConfig[],
    hoveredHeaderColumnKey?: string,
    columnReorderState?: {
      dragColumnIndex: number;
      dragColumnKey: string;
      dragStartX: number;
      currentX: number;
      targetColumnIndex: number;
      isParentColumn?: boolean;
    },
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const headerCells = this.layoutManager.getHeaderCells();

    this.ctx.save();

    let totalFixedWidth = 0;
    for (const colIndex of fixedColumnIndices) {
      totalFixedWidth += this.layoutManager.getColumnWidthByIndex(colIndex);
    }

    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(startX, 0, totalFixedWidth, headerHeight);

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, headerHeight);
    this.ctx.lineTo(startX + totalFixedWidth, headerHeight);
    this.ctx.stroke();

    const isRightFixed =
      fixedColumnIndices.length > 0 &&
      this.layoutManager.getLeafColumn(fixedColumnIndices[0]!)?.fixed === "right";

    const offsetX = isRightFixed ? startX - (layoutInfo.totalWidth - totalFixedWidth) : 0;

    for (const headerCell of headerCells) {
      if (!headerCell.isLeaf) continue;

      if (!fixedColumnIndices.includes(headerCell.colIndex)) continue;

      const isHovered = headerCell.column.key === hoveredHeaderColumnKey;

      this.renderHeaderCellMultiLevel(
        headerCell.column,
        headerCell.x + offsetX,
        headerCell.y,
        headerCell.width,
        headerCell.height,
        headerCell.colspan,
        headerCell.rowspan,
        sortConfig,
        filterConfig,
        isHovered,
        false,
        headerCell.colIndex,
      );
    }

    this.ctx.restore();
  }

  private renderHeader(
    columns: Column[],
    startColumn: number,
    endColumn: number,
    scrollTop: number,
    sortConfig: SortConfig[],
    _scrollLeft: number,
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;

    this.ctx.save();
    this.ctx.translate(0, scrollTop);

    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(0, 0, layoutInfo.totalWidth, headerHeight);

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerHeight);
    this.ctx.lineTo(layoutInfo.totalWidth, headerHeight);
    this.ctx.stroke();

    for (let colIndex = startColumn; colIndex <= endColumn; colIndex++) {
      const column = columns[colIndex];
      if (!column) continue;

      const { x, width } = this.layoutManager.getCellPosition(0, colIndex);

      this.renderHeaderCell(column, x, 0, width, headerHeight, colIndex, sortConfig);
    }

    this.ctx.restore();
  }

  private renderHeaderCell(
    column: Column,
    x: number,
    y: number,
    width: number,
    height: number,
    columnIndex: number,
    sortConfig: SortConfig[],
  ): void {
    // 检查是否是隐藏占位列
    if (column.key.startsWith("__hidden_placeholder__")) {
      // 检查整列是否悬浮
      const isColumnHovered = this.hoveredPlaceholderColumnIndex === columnIndex;

      // 绘制占位列表头背景 - 悬浮时高亮
      this.ctx.fillStyle = isColumnHovered
        ? this.theme.colors.hiddenPlaceholder.hoverBg
        : this.theme.colors.headerBackground;
      this.ctx.fillRect(x, y, width, height);

      // 绘制边框
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.strokeRect(x, y, width, height);
      return;
    }

    const padding = 8;
    const isReorderable = column.reorderable !== false;
    // 右侧固定列不显示 drag handle（它们使用 renderHeaderCellMultiLevel）
    const showDragHandle = false;
    const dragHandleWidth = 0;

    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";

    const sortInfo = sortConfig.find((s) => s.column === column.key);
    const sortDirection = sortInfo?.direction ?? "none";
    const sortIndicatorWidth = sortDirection !== "none" ? 20 : 0;

    const maxTextWidth =
      width - padding * 2 - sortIndicatorWidth - dragHandleWidth - (showDragHandle ? 4 : 0);
    const text = truncateText(column.title, Math.floor(maxTextWidth / 7));

    const align: HorizontalAlign = column.align ?? "left";
    let textX = x + padding + dragHandleWidth + (showDragHandle ? 4 : 0);

    if (align === "center") {
      textX = x + (width - this.ctx.measureText(text).width - sortIndicatorWidth) / 2;
      if (showDragHandle) {
        textX = Math.max(textX, x + padding + dragHandleWidth + 4);
      }
    } else if (align === "right") {
      textX = x + width - padding - this.ctx.measureText(text).width - sortIndicatorWidth;
    }

    this.ctx.fillText(text, textX, y + height / 2);

    if (sortDirection !== "none") {
      this.renderSortIndicator(x + width - padding - 10, y + height / 2, sortDirection);
    }

    if (showDragHandle) {
      this.renderDragHandle(x + padding, y + height / 2);
    }

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(x, y, width, height);
  }

  private renderDragHandle(x: number, y: number): void {
    const dotRadius = 1;
    const dotGapX = 5;
    const dotGapY = 4;
    const cols = 2;
    const rows = 3;

    const totalWidth = (cols - 1) * dotGapX;
    const totalHeight = (rows - 1) * dotGapY;

    const startX = x;
    const startY = y - totalHeight / 2;

    this.ctx.fillStyle = this.theme.colors.indicator.inactive;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dotX = startX + col * dotGapX;
        const dotY = startY + row * dotGapY;

        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private renderSortIndicator(x: number, y: number, direction: SortDirection | "hover"): void {
    const arrowWidth = 8;
    const arrowHeight = 5;
    const gap = 2;

    const activeColor = this.theme.colors.indicator.active;
    const inactiveColor = this.theme.colors.indicator.inactive;

    this.ctx.beginPath();
    this.ctx.moveTo(x - arrowWidth / 2, y - gap);
    this.ctx.lineTo(x + arrowWidth / 2, y - gap);
    this.ctx.lineTo(x, y - gap - arrowHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = direction === "asc" ? activeColor : inactiveColor;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x - arrowWidth / 2, y + gap);
    this.ctx.lineTo(x + arrowWidth / 2, y + gap);
    this.ctx.lineTo(x, y + gap + arrowHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = direction === "desc" ? activeColor : inactiveColor;
    this.ctx.fill();
  }

  private renderFilterIndicator(x: number, y: number, hasFilter: boolean): void {
    const size = 10;
    const activeColor = this.theme.colors.indicator.active;
    const inactiveColor = this.theme.colors.indicator.inactive;

    this.ctx.fillStyle = hasFilter ? activeColor : inactiveColor;
    this.ctx.beginPath();

    this.ctx.moveTo(x - size / 2, y - size / 2);
    this.ctx.lineTo(x + size / 2, y - size / 2);
    this.ctx.lineTo(x, y);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillRect(x - 1, y, 2, size / 2);
  }

  private renderRows(
    columns: Column[],
    rows: Row[],
    startRow: number,
    endRow: number,
    startColumn: number,
    endColumn: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
    },
  ): void {
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;

      this.renderRow(columns, row, rowIndex, startColumn, endColumn, options);
    }
  }

  private renderRow(
    columns: Column[],
    row: Row,
    rowIndex: number,
    startColumn: number,
    endColumn: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
      stripeRows: boolean;
    },
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const { x: rowX, y: rowY, height: rowHeight } = this.layoutManager.getCellPosition(rowIndex, 0);
    const rowWidth = layoutInfo.totalWidth;

    let backgroundColor = this.theme.colors.rowBackground;

    if (options.stripeRows && rowIndex % 2 === 1) {
      backgroundColor = this.theme.colors.rowAltBackground;
    }

    if (row.selected) {
      backgroundColor = this.theme.colors.rowSelectedBackground;
    }

    if (options.hoveredCell?.rowIndex === rowIndex) {
      backgroundColor = this.theme.colors.rowHoverBackground;
    }

    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(rowX, rowY, rowWidth, rowHeight);

    for (let colIndex = startColumn; colIndex <= endColumn; colIndex++) {
      const column = columns[colIndex];
      if (!column) continue;

      const value = row.data[getColumnField(column)];

      this.renderCell(column, row, rowIndex, colIndex, value, options);
    }
  }

  private renderCell(
    column: Column,
    row: Row,
    rowIndex: number,
    colIndex: number,
    value: unknown,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
    },
  ): void {
    const { x, y, width, height } = this.layoutManager.getCellPosition(rowIndex, colIndex);
    this.renderCellInternal(column, row, rowIndex, colIndex, value, x, y, width, height, options);
  }

  private renderCellWithPosition(
    column: Column,
    row: Row,
    rowIndex: number,
    colIndex: number,
    value: unknown,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
    },
  ): void {
    this.renderCellInternal(column, row, rowIndex, colIndex, value, x, y, width, height, options);
  }

  private renderCellInternal(
    column: Column,
    row: Row,
    rowIndex: number,
    colIndex: number,
    value: unknown,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      hoveredCell: CellPosition | null;
      selectedCells: CellRange[];
      editingCell: CellPosition | null;
    },
  ): void {
    const padding = 8;

    // 检查是否是隐藏占位列
    if (column.key.startsWith("__hidden_placeholder__")) {
      // 检查整列是否悬浮（当前列是悬浮的占位列）
      const isColumnHovered = this.hoveredPlaceholderColumnIndex === colIndex;

      // 绘制背景 - 悬浮时整列高亮
      this.ctx.fillStyle = isColumnHovered
        ? this.theme.colors.hiddenPlaceholder.hoverBg
        : this.theme.colors.rowBackground;
      this.ctx.fillRect(x, y, width, height);

      // 绘制边框
      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.beginPath();
      this.ctx.moveTo(x + width, y);
      this.ctx.lineTo(x + width, y + height);
      this.ctx.stroke();

      return;
    }

    // Check if cell is disabled
    const isDisabled = this.resolveDisabled(column.disabled, row, column);

    let renderResult: RenderResult = {
      text: this.formatValue(value, column, row),
      type: column.type ?? "text",
    };

    if (column.render) {
      try {
        const customResult = column.render(value, row, column, rowIndex);
        if (customResult) {
          renderResult = { ...renderResult, ...customResult };
        }
      } catch (error) {
        console.error(`Error rendering cell at row ${rowIndex}, column ${column.key}:`, error);
        renderResult = {
          text: "[Error]",
          type: "text",
        };
      }
    }

    const isCellSelected = this.isCellSelected(rowIndex, colIndex, options.selectedCells);
    const isHovered =
      options.hoveredCell?.rowIndex === rowIndex && options.hoveredCell?.columnIndex === colIndex;
    const isEditing =
      options.editingCell?.rowIndex === rowIndex && options.editingCell?.columnIndex === colIndex;

    if (isCellSelected && !row.selected) {
      this.ctx.fillStyle = this.theme.colors.rowSelectedBackground;
      this.ctx.fillRect(x, y, width, height);
    } else if (isHovered && !row.selected) {
      this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
      this.ctx.fillRect(x, y, width, height);
    }

    if (!isEditing) {
      const isExpandColumn = this.expandColumnKey === column.key;
      const hasChildren = row.children && row.children.length > 0;
      const level = row.level ?? 0;

      if (isExpandColumn && hasChildren) {
        this.renderExpandIcon(x, y, width, height, row.expanded ?? false, level);
        const iconWidth = 12 + padding;
        const levelIndent = level * 16;
        this.renderCellContent(
          renderResult,
          x + iconWidth + levelIndent,
          y,
          width - iconWidth - levelIndent,
          height,
          padding,
          column.align,
          rowIndex,
          colIndex,
          isDisabled,
        );
      } else {
        const levelIndent = isExpandColumn ? level * 16 : 0;
        this.renderCellContent(
          renderResult,
          x + levelIndent,
          y,
          width - levelIndent,
          height,
          padding,
          column.align,
          rowIndex,
          colIndex,
          isDisabled,
        );
      }
    }

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = this.theme.border.width;
    this.ctx.strokeRect(x, y, width, height);

    // Apply disabled overlay
    if (isDisabled) {
      // Use appropriate overlay color based on theme
      const overlayColor =
        this.theme.name === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.35)";
      this.ctx.fillStyle = overlayColor;
      this.ctx.fillRect(x, y, width, height);
    }
  }

  private renderCellContent(
    renderResult: RenderResult,
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number,
    defaultAlign?: HorizontalAlign,
    rowIndex?: number,
    colIndex?: number,
    isDisabled?: boolean,
  ): void {
    try {
      this.renderCellContentInternal(
        renderResult,
        x,
        y,
        width,
        height,
        padding,
        defaultAlign,
        rowIndex,
        colIndex,
        isDisabled,
      );
    } catch (error) {
      console.error(`Error rendering cell content at row ${rowIndex}, col ${colIndex}:`, error);
      this.ctx.fillStyle = this.theme.colors.cellText;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("[Render Error]", x + padding, y + height / 2);
    }
  }

  private renderCellContentInternal(
    renderResult: RenderResult,
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number,
    defaultAlign?: HorizontalAlign,
    rowIndex?: number,
    colIndex?: number,
    isDisabled?: boolean,
  ): void {
    // 保存 canvas 状态，确保所有渲染操作不会影响后续单元格
    this.ctx.save();
    try {
      const { text, type, style, checkbox, radio, button, input, tags, link } = renderResult;

      const fontSize = style?.fontSize ?? this.theme.font.size;
      const fontFamily = style?.fontFamily ?? this.theme.font.family;
      const fontWeight = style?.fontWeight ?? "normal";
      const fontStyle = style?.fontStyle ?? "normal";

      this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

      if (type === "checkbox" && checkbox) {
        this.renderCheckbox(x, y, width, height, checkbox, isDisabled);
        return;
      }

      if (type === "radio" && radio) {
        this.renderRadio(x, y, width, height, radio, isDisabled);
        return;
      }

      if (type === "button" && button) {
        let hoverProgress: number | undefined;
        if (rowIndex !== undefined && colIndex !== undefined && this.currentButtonHoverStates) {
          const cellKey = `${rowIndex}-${colIndex}`;
          const hoverState = this.currentButtonHoverStates.get(cellKey);
          if (hoverState) {
            hoverProgress = hoverState.progress;
          }
        }
        this.renderButton(x, y, width, height, button, isDisabled, hoverProgress);
        return;
      }

      if (type === "buttons" && renderResult.buttons) {
        this.renderButtons(
          x,
          y,
          width,
          height,
          renderResult.buttons,
          rowIndex,
          colIndex,
          isDisabled,
        );
        return;
      }

      if (type === "switch" && renderResult.switch) {
        let animationProgress: number | undefined;
        if (rowIndex !== undefined && colIndex !== undefined && this.currentSwitchAnimations) {
          const cellKey = `${rowIndex}-${colIndex}`;
          const animation = this.currentSwitchAnimations.get(cellKey);
          if (animation) {
            animationProgress = animation.progress;
          }
        }
        this.renderSwitch(x, y, width, height, renderResult.switch, isDisabled, animationProgress);
        return;
      }

      if (type === "input" && input) {
        this.renderInput(x, y, width, height, input, isDisabled);
        return;
      }

      if (type === "select" && renderResult.select) {
        this.renderSelect(x, y, width, height, renderResult.select, isDisabled);
        return;
      }

      if (type === "date" && renderResult.date) {
        this.renderDate(x, y, width, height, renderResult.date, isDisabled);
        return;
      }

      if (type === "tag" && tags) {
        this.renderTags(x, y, width, height, padding, tags, isDisabled);
        return;
      }

      if (type === "image" && renderResult.image) {
        const isHovered =
          rowIndex !== undefined &&
          colIndex !== undefined &&
          this.currentHoveredCell?.rowIndex === rowIndex &&
          this.currentHoveredCell?.columnIndex === colIndex;
        this.renderImage(x, y, width, height, renderResult.image, rowIndex, isHovered);
        return;
      }

      if (type === "progress" && renderResult.progress) {
        this.renderProgress(x, y, width, height, renderResult.progress);
        return;
      }

      if (type === "custom" && renderResult.customRender) {
        try {
          renderResult.customRender({
            ctx: this.ctx,
            x,
            y,
            width,
            height,
            padding,
            theme: this.theme,
            dpr: this.dpr,
          });
        } catch (error) {
          console.error("Error in customRender:", error);
        }
        return;
      }

      // 处理 link 类型的显示文本
      let displayText = text;
      let color = style?.color ?? this.theme.colors.cellText;
      if (type === "link" && link) {
        displayText = link.text || link.link;
        color = style?.color ?? this.theme.colors.linkColor;
      }

      if (!displayText) return;

      this.ctx.fillStyle = color;

      const align: HorizontalAlign = style?.horizontalAlign ?? defaultAlign ?? "left";
      const verticalAlign: VerticalAlign = style?.verticalAlign ?? "middle";

      const maxTextWidth = width - padding * 2;
      const ellipsis = "...";
      let textWidth = this.ctx.measureText(displayText).width;

      if (textWidth > maxTextWidth) {
        let truncated = displayText;
        while (
          truncated.length > 0 &&
          this.ctx.measureText(truncated + ellipsis).width > maxTextWidth
        ) {
          truncated = truncated.slice(0, -1);
        }
        displayText = truncated + ellipsis;
        textWidth = this.ctx.measureText(displayText).width;
      }

      let textX: number;
      switch (align) {
        case "center":
          textX = x + (width - this.ctx.measureText(displayText).width) / 2;
          break;
        case "right":
          textX = x + width - padding - this.ctx.measureText(displayText).width;
          break;
        default:
          textX = x + padding;
      }

      let textY: number;
      switch (verticalAlign) {
        case "top":
          this.ctx.textBaseline = "top";
          textY = y + padding;
          break;
        case "bottom":
          this.ctx.textBaseline = "bottom";
          textY = y + height - padding;
          break;
        default:
          this.ctx.textBaseline = "middle";
          textY = y + height / 2;
      }

      if (type === "tag") {
        this.renderTag(displayText, textX, textY, fontSize);
      } else {
        this.ctx.fillText(displayText, textX, textY);

        if (type === "link") {
          const textWidth = this.ctx.measureText(displayText).width;
          this.ctx.strokeStyle = color;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(textX, textY + fontSize / 2 + 2);
          this.ctx.lineTo(textX + textWidth, textY + fontSize / 2 + 2);
          this.ctx.stroke();
        }
      }
    } finally {
      // 确保始终恢复 canvas 状态
      this.ctx.restore();
    }
  }

  private renderExpandIcon(
    x: number,
    y: number,
    width: number,
    height: number,
    expanded: boolean,
    level: number,
  ): void {
    const size = 8;
    const padding = 8;
    const levelIndent = level * 16;
    const iconX = x + padding + levelIndent + size / 2;
    const iconY = y + height / 2;

    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.beginPath();

    if (expanded) {
      this.ctx.moveTo(iconX - size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX + size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX, iconY + size / 2);
    } else {
      this.ctx.moveTo(iconX - size / 2, iconY - size / 2);
      this.ctx.lineTo(iconX + size / 2, iconY);
      this.ctx.lineTo(iconX - size / 2, iconY + size / 2);
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  private renderCheckbox(
    x: number,
    y: number,
    width: number,
    height: number,
    config: CheckboxConfig,
    isDisabled?: boolean,
  ): void {
    const size = 16;
    const checkboxX = x + (width - size) / 2;
    const checkboxY = y + (height - size) / 2;
    const disabled = isDisabled ?? false;

    this.ctx.fillStyle = disabled
      ? this.theme.colors.checkbox.disabledBg
      : this.theme.colors.button.background;
    this.ctx.strokeStyle = this.theme.colors.checkbox.border;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.roundRect(checkboxX, checkboxY, size, size, 3);
    this.ctx.fill();
    this.ctx.stroke();

    if (config.indeterminate) {
      this.ctx.strokeStyle = disabled
        ? this.theme.colors.checkbox.border
        : this.theme.colors.checkbox.checkedBg;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(checkboxX + 4, checkboxY + size / 2);
      this.ctx.lineTo(checkboxX + size - 4, checkboxY + size / 2);
      this.ctx.stroke();
    } else if (config.checked) {
      this.ctx.strokeStyle = disabled
        ? this.theme.colors.checkbox.border
        : this.theme.colors.checkbox.checkedBg;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";

      this.ctx.beginPath();
      this.ctx.moveTo(checkboxX + 4, checkboxY + size / 2);
      this.ctx.lineTo(checkboxX + size / 2 - 1, checkboxY + size - 5);
      this.ctx.lineTo(checkboxX + size - 3, checkboxY + 4);
      this.ctx.stroke();
    }
  }

  private renderRadio(
    x: number,
    y: number,
    width: number,
    height: number,
    config: RadioConfig,
    isDisabled?: boolean,
  ): void {
    const size = 16;
    const padding = 8;
    const gap = 4;
    const columnDisabled = isDisabled ?? false;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.clip();

    if (config.options && config.options.length > 0) {
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

      const optionWidths: number[] = config.options.map((option) => {
        const textWidth = this.ctx.measureText(option.label).width;
        return size + gap + textWidth + padding;
      });

      let currentX = x + padding;
      const maxX = x + width - padding;

      for (let i = 0; i < config.options.length; i++) {
        const option = config.options[i]!;
        const optionWidth = optionWidths[i]!;

        if (currentX + optionWidth - padding > maxX) {
          break;
        }

        const radioX = currentX;
        const radioY = y + (height - size) / 2;
        const centerX = radioX + size / 2;
        const centerY = radioY + size / 2;
        const optionDisabled = option.disabled || columnDisabled;
        const isChecked = config.value === option.value;

        this.ctx.fillStyle = optionDisabled
          ? this.theme.colors.radio.disabledBg
          : this.theme.colors.button.background;
        this.ctx.strokeStyle = this.theme.colors.radio.border;
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        if (isChecked) {
          this.ctx.fillStyle = optionDisabled
            ? this.theme.colors.radio.border
            : this.theme.colors.radio.checkedBg;
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, size / 2 - 4, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.fillStyle = optionDisabled
          ? this.theme.colors.placeholderText
          : this.theme.colors.cellText;
        this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";
        const textX = radioX + size + gap;
        this.ctx.fillText(option.label, textX, centerY);

        currentX += optionWidth;
      }
    } else {
      const radioX = x + (width - size) / 2;
      const radioY = y + (height - size) / 2;
      const centerX = radioX + size / 2;
      const centerY = radioY + size / 2;

      this.ctx.fillStyle = columnDisabled
        ? this.theme.colors.radio.disabledBg
        : this.theme.colors.button.background;
      this.ctx.strokeStyle = this.theme.colors.radio.border;
      this.ctx.lineWidth = 1;

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      if (config.checked) {
        this.ctx.fillStyle = columnDisabled
          ? this.theme.colors.radio.border
          : this.theme.colors.radio.checkedBg;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, size / 2 - 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  private renderButton(
    x: number,
    y: number,
    width: number,
    height: number,
    config: ButtonConfig,
    isDisabled?: boolean,
    hoverProgress?: number,
  ): void {
    const cellPadding = 8;
    const buttonHeight = config.size === "small" ? 24 : config.size === "large" ? 40 : 32;
    const buttonY = y + (height - buttonHeight) / 2;
    const disabled = isDisabled ?? false;

    // 计算按钮宽度：根据文本内容
    const text = config.text ?? "Button";
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const textWidth = this.ctx.measureText(text).width;
    const buttonPadding = 16; // 按钮内边距
    const buttonWidth = Math.min(
      Math.max(textWidth + buttonPadding * 2, 60), // 最小 60px
      width - cellPadding * 2, // 最大不超过单元格宽度
    );
    // 水平居中
    const buttonX = x + (width - buttonWidth) / 2;

    const progress = hoverProgress ?? 0;

    let bgColor: string;
    let textColor: string;
    let borderColor: string;

    if (disabled) {
      // 禁用状态统一使用灰色样式
      bgColor = this.theme.colors.button.disabledBg;
      textColor = this.theme.colors.button.disabledText;
      borderColor = this.theme.colors.button.disabledBorder;
    } else {
      switch (config.variant) {
        case "primary":
          bgColor = this.theme.colors.button.primaryBg;
          textColor = this.theme.colors.button.primaryText;
          borderColor = bgColor;
          break;
        case "danger":
          bgColor = this.theme.colors.button.dangerBg;
          textColor = this.theme.colors.button.dangerText;
          borderColor = bgColor;
          break;
        case "warning":
          bgColor = this.theme.colors.button.warningBg;
          textColor = this.theme.colors.button.warningText;
          borderColor = bgColor;
          break;
        case "link":
          bgColor = "transparent";
          textColor = this.theme.colors.button.linkText;
          borderColor = "transparent";
          break;
        default:
          bgColor = this.theme.colors.button.background;
          textColor = this.theme.colors.button.text;
          borderColor = this.theme.colors.button.border;
      }
    }

    if (!disabled && progress > 0 && config.variant !== "link") {
      if (config.variant === "default" || !config.variant) {
        const bgRgb = this.hexToRgb(this.theme.colors.button.background);
        const brightness = (bgRgb.r * 299 + bgRgb.g * 587 + bgRgb.b * 114) / 1000;

        if (brightness > 128) {
          const hoverGray = Math.round(bgRgb.r - progress * 0.2 * bgRgb.r);
          bgColor = `rgb(${hoverGray}, ${hoverGray}, ${hoverGray})`;
        } else {
          const hoverGray = Math.round(bgRgb.r + progress * 0.2 * (255 - bgRgb.r));
          bgColor = `rgb(${hoverGray}, ${hoverGray}, ${hoverGray})`;
        }
      } else {
        this.ctx.globalAlpha = 1 - progress * 0.2;
      }
    }

    this.ctx.fillStyle = bgColor;
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 1;

    const radius = 4;
    this.ctx.beginPath();
    this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, radius);
    this.ctx.fill();
    this.ctx.stroke();

    if (!disabled && progress > 0 && config.variant !== "link") {
      this.ctx.globalAlpha = 1;
    }

    this.ctx.fillStyle = textColor;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    this.ctx.textAlign = "left";
  }

  private renderButtons(
    x: number,
    y: number,
    _width: number,
    height: number,
    config: ButtonsConfig,
    rowIndex?: number,
    colIndex?: number,
    isDisabled?: boolean,
  ): void {
    const padding = 8;
    const gap = config.gap ?? 4;
    const maxVisible = config.maxVisible ?? 3;
    const buttonHeight = 24;
    const buttonY = y + (height - buttonHeight) / 2;

    const visibleButtons = config.buttons.filter((btn) => btn.visible !== false);

    const displayButtons = visibleButtons.slice(0, maxVisible);
    const moreButtons = visibleButtons.slice(maxVisible);

    // 检查当前单元格是否悬浮，并获取悬浮的按钮索引
    let hoveredIndex = -1;
    if (rowIndex !== undefined && colIndex !== undefined) {
      const isCurrentCellHovered =
        this.currentHoveredCell?.rowIndex === rowIndex &&
        this.currentHoveredCell?.columnIndex === colIndex;
      if (isCurrentCellHovered) {
        hoveredIndex = this.currentHoveredButtonIndex;
      }
    }

    let currentX = x + padding;

    for (let i = 0; i < displayButtons.length; i++) {
      const btn = displayButtons[i]!;
      const text = btn.text ?? "Button";
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      const textWidth = this.ctx.measureText(text).width;
      const buttonWidth = Math.max(textWidth + 16, 40);

      const isHovered = i === hoveredIndex && !isDisabled;
      this.renderSingleButton(
        currentX,
        buttonY,
        buttonWidth,
        buttonHeight,
        btn,
        isHovered,
        isDisabled,
      );

      currentX += buttonWidth + gap;
    }

    if (moreButtons.length > 0) {
      const moreText = config.moreButtonText ?? "···";
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      const textWidth = this.ctx.measureText(moreText).width;
      const buttonWidth = Math.max(textWidth + 16, 32);

      // "更多"按钮的索引是 maxVisible
      const moreBtnIndex = maxVisible;
      const isMoreHovered = moreBtnIndex === hoveredIndex;

      const moreBtn: ButtonConfig = {
        text: moreText,
        variant: "default",
        size: "small",
      };

      this.renderSingleButton(
        currentX,
        buttonY,
        buttonWidth,
        buttonHeight,
        moreBtn,
        isMoreHovered,
        isDisabled,
      );
    }
  }

  private renderSingleButton(
    x: number,
    y: number,
    width: number,
    height: number,
    config: ButtonConfig,
    isHovered?: boolean,
    isDisabled?: boolean,
  ): void {
    const disabled = isDisabled ?? false;
    let bgColor: string;
    let textColor: string;
    let borderColor: string;

    if (disabled) {
      // 禁用状态统一使用灰色样式
      bgColor = this.theme.colors.button.disabledBg;
      textColor = this.theme.colors.button.disabledText;
      borderColor = this.theme.colors.button.disabledBorder;
    } else {
      switch (config.variant) {
        case "primary":
          bgColor = this.theme.colors.button.primaryBg;
          textColor = this.theme.colors.button.primaryText;
          borderColor = bgColor;
          break;
        case "danger":
          bgColor = this.theme.colors.button.dangerBg;
          textColor = this.theme.colors.button.dangerText;
          borderColor = bgColor;
          break;
        case "warning":
          bgColor = this.theme.colors.button.warningBg;
          textColor = this.theme.colors.button.warningText;
          borderColor = bgColor;
          break;
        case "link":
          bgColor = "transparent";
          textColor = this.theme.colors.button.linkText;
          borderColor = "transparent";
          break;
        default:
          bgColor = this.theme.colors.button.background;
          textColor = this.theme.colors.button.text;
          borderColor = this.theme.colors.button.border;
      }
    }

    // 应用 hover 效果
    if (isHovered && !disabled && config.variant !== "link") {
      if (config.variant === "default" || !config.variant) {
        // default 按钮：背景变暗
        const bgRgb = this.hexToRgb(bgColor);
        if (bgRgb) {
          const brightness = (bgRgb.r * 299 + bgRgb.g * 587 + bgRgb.b * 114) / 1000;
          if (brightness > 128) {
            const hoverGray = Math.round(bgRgb.r * 0.88);
            bgColor = `rgb(${hoverGray}, ${hoverGray}, ${hoverGray})`;
          } else {
            const hoverGray = Math.round(bgRgb.r + 0.12 * (255 - bgRgb.r));
            bgColor = `rgb(${hoverGray}, ${hoverGray}, ${hoverGray})`;
          }
        }
      } else {
        // 其他变体：透明度变化
        this.ctx.globalAlpha = 0.85;
      }
    }

    this.ctx.fillStyle = bgColor;
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 1;

    const radius = 4;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
    this.ctx.fill();
    this.ctx.stroke();

    // 恢复透明度
    if (isHovered && !disabled && config.variant !== "default" && config.variant) {
      this.ctx.globalAlpha = 1;
    }

    const text = config.text ?? "Button";
    this.ctx.fillStyle = textColor;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, x + width / 2, y + height / 2);
    this.ctx.textAlign = "left";
  }

  renderButtonsDropdown(dropdown: ButtonsDropdownState): void {
    const itemHeight = 32;
    const minWidth = 100;
    const padding = 8;

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    let maxWidth = minWidth;
    for (const btn of dropdown.buttons) {
      const text = btn.text ?? "Button";
      const textWidth = this.ctx.measureText(text).width;
      maxWidth = Math.max(maxWidth, textWidth + padding * 2 + 16);
    }

    const dropdownHeight = dropdown.buttons.length * itemHeight;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.background;
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(dropdown.x, dropdown.y, maxWidth, dropdownHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    for (let i = 0; i < dropdown.buttons.length; i++) {
      const btn = dropdown.buttons[i]!;
      const itemY = dropdown.y + i * itemHeight;
      const isHovered = i === dropdown.hoveredIndex;

      if (isHovered) {
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
        this.ctx.fillRect(dropdown.x, itemY, maxWidth, itemHeight);
      }

      let textColor: string;
      switch (btn.variant) {
        case "primary":
          textColor = this.theme.colors.button.primaryBg;
          break;
        case "danger":
          textColor = this.theme.colors.button.dangerBg;
          break;
        case "warning":
          textColor = this.theme.colors.button.warningBg;
          break;
        case "link":
          textColor = this.theme.colors.button.linkText;
          break;
        default:
          textColor = this.theme.colors.cellText;
      }

      this.ctx.fillStyle = textColor;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(btn.text ?? "Button", dropdown.x + padding, itemY + itemHeight / 2);
    }

    this.ctx.restore();
  }

  renderImageTooltip(imageTooltip: ImageTooltipState): void {
    const imgSize = 64;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const rowHeight = imgSize + gap;
    const scrollbarWidth = 4;
    const scrollbarGap = 4; // 滚动条与内容区域的间隙
    const tooltipWidth =
      imagesPerRow * imgSize +
      (imagesPerRow - 1) * gap +
      padding * 2 +
      scrollbarGap +
      scrollbarWidth;
    const visibleHeight = imageTooltip.maxRows * rowHeight + padding * 2 - gap;
    const totalRows = Math.ceil(imageTooltip.images.length / imagesPerRow);
    const contentHeight = totalRows * rowHeight - gap;

    this.ctx.save();

    // 先绘制带阴影的背景形状（在 clip 之前）
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;
    this.ctx.fillStyle = this.theme.colors.tooltip.background;
    this.ctx.beginPath();
    this.ctx.roundRect(imageTooltip.x, imageTooltip.y, tooltipWidth, visibleHeight, 6);
    this.ctx.fill();

    // 清除阴影后裁剪
    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.beginPath();
    this.ctx.roundRect(imageTooltip.x, imageTooltip.y, tooltipWidth, visibleHeight, 6);
    this.ctx.clip();

    // 边框
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // 绘制图片
    const startRow = Math.floor(imageTooltip.scrollTop / rowHeight);
    const endRow = Math.min(totalRows, startRow + imageTooltip.maxRows + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= imageTooltip.images.length) break;

        const imgSrc = imageTooltip.images[index];
        if (!imgSrc) continue;

        const x = imageTooltip.x + padding + col * (imgSize + gap);
        const y = imageTooltip.y + padding + row * rowHeight - imageTooltip.scrollTop;

        // 检查是否在可见区域内
        if (y + imgSize < imageTooltip.y || y > imageTooltip.y + visibleHeight) continue;

        const isHovered = index === imageTooltip.hoveredIndex;

        // 尝试获取缓存的图片
        const cachedImg = this.imageCache.get(imgSrc);
        if (cachedImg) {
          // 绘制图片
          this.ctx.save();
          if (isHovered) {
            // hover 效果
            this.ctx.strokeStyle = this.theme.colors.image.hoverBorder;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x - 1, y - 1, imgSize + 2, imgSize + 2);
          }
          this.ctx.drawImage(cachedImg, x, y, imgSize, imgSize);
          this.ctx.restore();
        } else {
          // 绘制占位符
          this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
          this.ctx.fillRect(x, y, imgSize, imgSize);
          this.ctx.strokeStyle = this.theme.colors.dropdown.border;
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(x, y, imgSize, imgSize);

          // 加载图片
          if (!this.loadingImages.has(imgSrc)) {
            this.loadImage(imgSrc);
          }
        }
      }
    }

    // 滚动条
    if (contentHeight > visibleHeight - padding * 2) {
      const scrollbarTrackHeight = visibleHeight - padding * 2;
      const scrollbarThumbHeight = Math.max(
        30,
        (visibleHeight / contentHeight) * scrollbarTrackHeight,
      );
      const scrollbarThumbY =
        imageTooltip.y +
        padding +
        (imageTooltip.scrollTop / (contentHeight - scrollbarTrackHeight + padding * 2)) *
          (scrollbarTrackHeight - scrollbarThumbHeight);

      // 滚动条轨道
      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = this.theme.colors.scrollbar.track;
      this.ctx.fillRect(
        imageTooltip.x + tooltipWidth - padding - scrollbarWidth,
        imageTooltip.y + padding,
        scrollbarWidth,
        scrollbarTrackHeight,
      );

      // 滚动条滑块
      this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
      this.ctx.fillRect(
        imageTooltip.x + tooltipWidth - padding - scrollbarWidth,
        scrollbarThumbY,
        scrollbarWidth,
        scrollbarThumbHeight,
      );
      this.ctx.globalAlpha = prevAlpha;
    }

    this.ctx.restore();
  }

  renderImageEditor(editor: ImageEditorState): void {
    // 防御性检查
    const images = editor.images ?? [];
    const pendingImages = editor.pendingImages ?? [];

    const imgSize = 64;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const editorWidth =
      imagesPerRow * imgSize +
      (imagesPerRow - 1) * gap +
      padding * 2 +
      scrollbarGap +
      scrollbarWidth;
    const imagesHeight = editor.maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    this.ctx.save();

    // 先绘制带阴影的背景形状
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.beginPath();
    this.ctx.roundRect(editor.x, editor.y, editorWidth, editorHeight, 6);
    this.ctx.fill();

    // 清除阴影
    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    // 边框
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // 上传区域
    const uploadY = editor.y;
    const uploadHeight = uploadAreaHeight;
    const isDragging = editor.isDragging;

    // 上传区域背景
    this.ctx.fillStyle = isDragging
      ? this.theme.colors.dropdown.selectedBg
      : this.theme.colors.image.placeholderBg;
    this.ctx.fillRect(
      editor.x + padding,
      uploadY + padding,
      editorWidth - padding * 2,
      uploadHeight - padding * 2,
    );

    // 上传区域边框（虚线）
    this.ctx.strokeStyle = isDragging
      ? this.theme.colors.checkbox.checkedBg
      : this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(
      editor.x + padding,
      uploadY + padding,
      editorWidth - padding * 2,
      uploadHeight - padding * 2,
    );
    this.ctx.setLineDash([]);

    // 上传区域文字
    this.ctx.fillStyle = this.theme.colors.dropdown.text;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    const uploadText = isDragging ? "释放以上传图片" : "点击上传或拖拽图片到此处";
    this.ctx.fillText(uploadText, editor.x + editorWidth / 2, uploadY + uploadHeight / 2);

    // 图片列表区域
    const imagesY = uploadY + uploadHeight;
    const totalRows = Math.ceil((images.length + pendingImages.length) / imagesPerRow);
    const contentHeight = totalRows * rowHeight - gap;
    const visibleHeight = imagesHeight - padding * 2;

    // 裁剪图片区域
    this.ctx.beginPath();
    this.ctx.rect(editor.x, imagesY, editorWidth, imagesHeight);
    this.ctx.clip();

    // 绘制已有图片
    const startRow = Math.floor(editor.scrollTop / rowHeight);
    const endRow = Math.min(totalRows, startRow + editor.maxRows + 1);

    const allImages = [...images, ...pendingImages.map((p) => p.preview)];

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= allImages.length) break;

        const imgSrc = allImages[index];
        if (!imgSrc) continue;

        const imgX = editor.x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - editor.scrollTop;

        // 检查是否在可见区域内
        if (imgY + imgSize < imagesY || imgY > imagesY + imagesHeight) continue;

        const isHovered = index === editor.hoveredIndex;
        const isPending = index >= images.length;

        // 尝试获取缓存的图片
        const cachedImg = this.imageCache.get(imgSrc);
        if (cachedImg) {
          // 绘制图片
          this.ctx.save();
          if (isHovered) {
            // hover 效果
            this.ctx.strokeStyle = this.theme.colors.image.hoverBorder;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(imgX - 1, imgY - 1, imgSize + 2, imgSize + 2);
          }
          this.ctx.drawImage(cachedImg, imgX, imgY, imgSize, imgSize);
          this.ctx.restore();
        } else {
          // 绘制占位符
          this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
          this.ctx.fillRect(imgX, imgY, imgSize, imgSize);
          this.ctx.strokeStyle = this.theme.colors.dropdown.border;
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(imgX, imgY, imgSize, imgSize);

          // 加载图片
          if (!this.loadingImages.has(imgSrc)) {
            this.loadImage(imgSrc);
          }
        }

        // 待上传图片标识
        if (isPending) {
          this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          this.ctx.fillRect(imgX, imgY + imgSize - 20, imgSize, 20);
          this.ctx.fillStyle = "#ffffff";
          this.ctx.font = `${this.theme.font.size - 2}px ${this.theme.font.family}`;
          this.ctx.textAlign = "center";
          this.ctx.fillText("上传中...", imgX + imgSize / 2, imgY + imgSize - 10);
        }

        // hover 时显示删除按钮
        if (isHovered && !isPending) {
          const deleteBtnSize = 16;
          const deleteBtnX = imgX + imgSize - deleteBtnSize / 2 - 2;
          const deleteBtnY = imgY + deleteBtnSize / 2 + 2;

          this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
          this.ctx.beginPath();
          this.ctx.arc(deleteBtnX, deleteBtnY, deleteBtnSize / 2, 0, Math.PI * 2);
          this.ctx.fill();

          // X 图标
          this.ctx.strokeStyle = "#ffffff";
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(deleteBtnX - 3, deleteBtnY - 3);
          this.ctx.lineTo(deleteBtnX + 3, deleteBtnY + 3);
          this.ctx.moveTo(deleteBtnX + 3, deleteBtnY - 3);
          this.ctx.lineTo(deleteBtnX - 3, deleteBtnY + 3);
          this.ctx.stroke();
        }
      }
    }

    // 滚动条
    if (contentHeight > visibleHeight) {
      const scrollbarTrackHeight = visibleHeight;
      const scrollbarThumbHeight = Math.max(
        30,
        (visibleHeight / contentHeight) * scrollbarTrackHeight,
      );
      const scrollbarThumbY =
        imagesY +
        padding +
        (editor.scrollTop / (contentHeight - visibleHeight + padding * 2)) *
          (scrollbarTrackHeight - scrollbarThumbHeight);

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = this.theme.colors.scrollbar.track;
      this.ctx.fillRect(
        editor.x + editorWidth - padding - scrollbarWidth,
        imagesY + padding,
        scrollbarWidth,
        scrollbarTrackHeight,
      );

      this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
      this.ctx.fillRect(
        editor.x + editorWidth - padding - scrollbarWidth,
        scrollbarThumbY,
        scrollbarWidth,
        scrollbarThumbHeight,
      );
      this.ctx.globalAlpha = prevAlpha;
    }

    this.ctx.restore();
  }

  private interpolateColor(color1: string, color2: string, progress: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * progress);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * progress);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * progress);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private renderSwitch(
    x: number,
    y: number,
    width: number,
    height: number,
    config: SwitchConfig,
    isDisabled?: boolean,
    animationProgress?: number,
  ): void {
    const switchWidth = 44;
    const switchHeight = 22;
    const thumbSize = 18;
    const switchX = x + (width - switchWidth) / 2;
    const switchY = y + (height - switchHeight) / 2;
    const radius = switchHeight / 2;

    const isChecked = config.checked ?? false;
    const disabled = isDisabled ?? false;

    const progress = animationProgress ?? (isChecked ? 1 : 0);
    const thumbTravel = switchWidth - thumbSize - 4;
    const thumbX = switchX + 2 + progress * thumbTravel;
    const thumbY = switchY + (switchHeight - thumbSize) / 2;

    this.ctx.save();

    const offColor = disabled
      ? this.theme.colors.switch.disabledOffBg
      : this.theme.colors.switch.offBg;
    const onColor = disabled
      ? this.theme.colors.switch.disabledOnBg
      : this.theme.colors.switch.onBg;

    const offRGB = this.hexToRgb(offColor);
    const onRGB = this.hexToRgb(onColor);

    const r = Math.round(offRGB.r + (onRGB.r - offRGB.r) * progress);
    const g = Math.round(offRGB.g + (onRGB.g - offRGB.g) * progress);
    const b = Math.round(offRGB.b + (onRGB.b - offRGB.b) * progress);

    this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    this.ctx.beginPath();
    this.ctx.roundRect(switchX, switchY, switchWidth, switchHeight, radius);
    this.ctx.fill();

    this.ctx.fillStyle = this.theme.colors.switch.thumb;
    this.ctx.beginPath();
    this.ctx.arc(thumbX + thumbSize / 2, thumbY + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.restore();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  // === 进度条渲染方法 ===

  private renderProgress(
    x: number,
    y: number,
    width: number,
    height: number,
    config: import("../types").ProgressConfig,
  ): void {
    const shape = config.shape ?? "line";

    if (shape === "line") {
      this.renderLineProgress(x, y, width, height, config);
    } else if (shape === "circle") {
      this.renderCircleProgress(x, y, width, height, config);
    } else if (shape === "dashboard") {
      this.renderDashboardProgress(x, y, width, height, config);
    }
  }

  private renderLineProgress(
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: import("../types").ProgressConfig,
  ): void {
    const padding = 8;
    const textPosition = config.textPosition ?? "right";
    const showText = config.showText ?? true;
    const size = config.size ?? "medium";

    this.ctx.save();

    // 计算进度条尺寸
    const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
    const textGap = 8;
    const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
    const barWidth = config.width ?? cellWidth - padding * 2 - textReservedWidth;

    const barX = x + padding;
    const barY = y + (cellHeight - barHeight) / 2;

    // 限制值在 [0, 100] 范围内
    const clampedValue = Math.min(100, Math.max(0, config.value));

    // 获取进度颜色（使用原始值以支持颜色映射）
    const progressColor = this.getProgressColor(config, clampedValue);
    const trackColor = config.trackColor ?? this.theme.colors.progress.track;
    // 圆角半径：默认为高度的一半（完全圆角）
    const radius = config.borderRadius ?? barHeight / 2;

    // 绘制轨道
    this.ctx.fillStyle = trackColor;
    this.ctx.beginPath();
    this.ctx.roundRect(barX, barY, barWidth, barHeight, radius);
    this.ctx.fill();

    // 绘制进度
    const progressWidth = (clampedValue / 100) * barWidth;
    if (progressWidth > 0) {
      this.ctx.fillStyle = progressColor;
      this.ctx.beginPath();
      const actualProgressWidth = Math.max(progressWidth, radius * 2);
      this.ctx.roundRect(barX, barY, actualProgressWidth, barHeight, radius);
      this.ctx.fill();
    }

    // 绘制文本
    if (showText) {
      const text = config.format ? config.format(clampedValue) : `${Math.round(clampedValue)}%`;

      // 根据 size 和 textPosition 计算文字大小
      let fontSize: number;
      if (textPosition === "inside") {
        // inside 模式：文字大小不能超过进度条高度
        fontSize = Math.min(this.theme.font.size, Math.max(10, barHeight - 2));
      } else {
        // right 模式：根据 size 调整文字大小
        fontSize = size === "small" ? 11 : size === "large" ? 14 : this.theme.font.size;
      }

      this.ctx.font = `${fontSize}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";

      if (textPosition === "right") {
        // 文字显示在进度条右侧
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = config.textColor ?? this.theme.colors.cellText;
        this.ctx.fillText(text, barX + barWidth + textGap, y + cellHeight / 2);
      } else {
        // inside - 文字在进度条内部，居中显示
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = config.textColor ?? this.theme.colors.cellText;
        this.ctx.fillText(text, barX + barWidth / 2, y + cellHeight / 2);
      }
    }

    this.ctx.restore();
  }

  private renderCircleProgress(
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: import("../types").ProgressConfig,
  ): void {
    const size = config.size ?? "medium";

    // 根据 size 计算直径占单元格高度的比例
    const sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
    const defaultDiameter = Math.floor(cellHeight * sizeRatio);
    const diameter = config.width ?? defaultDiameter;
    const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));

    const centerX = x + cellWidth / 2;
    const centerY = y + cellHeight / 2;
    const radius = (diameter - strokeWidth) / 2;

    // 限制值在 [0, 100] 范围内
    const clampedValue = Math.min(100, Math.max(0, config.value));

    const progressColor = this.getProgressColor(config, clampedValue);
    const trackColor = config.trackColor ?? this.theme.colors.progress.track;

    this.ctx.save();

    // 绘制轨道圆环
    this.ctx.strokeStyle = trackColor;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // 绘制进度圆环
    const progress = clampedValue / 100;
    const startAngle = -Math.PI / 2; // 从顶部开始
    const endAngle = startAngle + progress * Math.PI * 2;

    if (progress > 0) {
      this.ctx.strokeStyle = progressColor;
      this.ctx.lineCap = config.strokeLinecap ?? "round";
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.stroke();
    }

    // 绘制中心文本
    if (config.showText ?? true) {
      const text = config.format ? config.format(clampedValue) : `${Math.round(clampedValue)}%`;
      this.ctx.fillStyle = config.textColor ?? this.theme.colors.cellText;
      // 文字大小根据圆环直径自适应，但不小于 8px
      const fontSize = Math.max(8, Math.round(diameter * 0.32));
      this.ctx.font = `bold ${fontSize}px ${this.theme.font.family}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(text, centerX, centerY);
    }

    this.ctx.restore();
  }

  private renderDashboardProgress(
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: import("../types").ProgressConfig,
  ): void {
    const size = config.size ?? "medium";

    // 根据 size 计算直径占单元格高度的比例
    const sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
    const defaultDiameter = Math.floor(cellHeight * sizeRatio);
    const diameter = config.width ?? defaultDiameter;
    const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.1));

    const centerX = x + cellWidth / 2;
    // 仪表盘是半圆，需要稍微下移让它在单元格中视觉居中
    const centerY = y + cellHeight / 2 + cellHeight * 0.05;
    const radius = (diameter - strokeWidth) / 2;

    // 限制值在 [0, 100] 范围内
    const clampedValue = Math.min(100, Math.max(0, config.value));

    const progressColor = this.getProgressColor(config, clampedValue);
    const trackColor = config.trackColor ?? this.theme.colors.progress.track;

    // 仪表盘角度范围: 270° (3/4 圆)，缺口在底部中间
    // Canvas arc 角度: 0°=右, 90°=下, 180°=左, 270°=上 (y轴向下)
    //
    // 缺口位置: 底部中间，即 45° 到 135° 的 90° 范围（以 90° 为中心）
    // 弧的范围: 135° 顺时针画到 45°，经过 180°→270°→0°→45°
    // 进度方向: 从 135°(右下偏右) 开始，顺时针增长
    //   0% = 135°, 50% = 270°(顶部), 100% = 45°(右下偏左)
    const startAngle = Math.PI * 0.75; // 135°
    const totalAngle = Math.PI * 1.5; // 270°

    this.ctx.save();

    // 绘制轨道 - 顺时针画 270° (counterclockwise = false)
    // 从 135° 顺时针到 135° + 270° = 405° = 45°
    this.ctx.strokeStyle = trackColor;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = config.strokeLinecap ?? "round";
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle, false);
    this.ctx.stroke();

    // 绘制进度 - 顺时针，角度增加
    const progress = clampedValue / 100;
    if (progress > 0) {
      const progressEndAngle = startAngle + progress * totalAngle;

      this.ctx.strokeStyle = progressColor;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, progressEndAngle, false);
      this.ctx.stroke();
    }

    // 绘制中心文本
    if (config.showText ?? true) {
      const text = config.format ? config.format(clampedValue) : `${Math.round(clampedValue)}%`;
      this.ctx.fillStyle = config.textColor ?? this.theme.colors.cellText;
      // 文字大小根据直径自适应，但不小于 8px
      const fontSize = Math.max(8, Math.round(diameter * 0.28));
      this.ctx.font = `bold ${fontSize}px ${this.theme.font.family}`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(text, centerX, centerY);
    }

    this.ctx.restore();
  }

  private getProgressColor(config: import("../types").ProgressConfig, value: number): string {
    const { color, status } = config;

    // 状态优先
    if (status === "success") return this.theme.colors.progress.success;
    if (status === "warning") return this.theme.colors.progress.warning;
    if (status === "error") return this.theme.colors.progress.error;

    // 单色
    if (typeof color === "string") return color;

    // 函数动态计算
    if (typeof color === "function") return color(value);

    // 渐变区间
    if (Array.isArray(color) && color.length > 0) {
      const sorted = [...color].sort((a, b) => a.value - b.value);

      if (value <= sorted[0]!.value) return sorted[0]!.color;
      if (value >= sorted[sorted.length - 1]!.value) return sorted[sorted.length - 1]!.color;

      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i]!;
        const next = sorted[i + 1]!;
        if (value >= curr.value && value <= next.value) {
          const ratio = (value - curr.value) / (next.value - curr.value);
          return this.interpolateColor(curr.color, next.color, ratio);
        }
      }
    }

    // 默认主题色
    return this.theme.colors.progress.default;
  }

  private getContrastColor(bgColor: string): string {
    const rgb = this.hexToRgb(bgColor);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  }

  private renderInput(
    x: number,
    y: number,
    width: number,
    height: number,
    config: InputConfig,
    _isDisabled?: boolean,
  ): void {
    const padding = 8;

    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.stroke();

    const displayText = config.value ?? "";
    const placeholder = config.placeholder ?? "";
    const text = displayText || placeholder;

    this.ctx.fillStyle = displayText
      ? this.theme.colors.cellText
      : this.theme.colors.placeholderText;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";

    const maxTextWidth = width - padding * 2;

    if (config.multiline) {
      const lineHeight = this.theme.font.size * 1.5;
      const maxRows = config.maxRows ?? 5;
      const maxVisibleHeight = height - padding * 2;
      const maxVisibleRows = Math.max(1, Math.floor(maxVisibleHeight / lineHeight));
      const actualMaxRows = Math.min(maxRows, maxVisibleRows);

      const lines = this.wrapText(text, maxTextWidth);
      const visibleLines = lines.slice(0, actualMaxRows);

      let textY = y + padding + lineHeight / 2;

      for (let i = 0; i < visibleLines.length; i++) {
        let lineText = visibleLines[i]!;
        const isLastVisibleLine = i === visibleLines.length - 1;
        const hasMoreLines = lines.length > visibleLines.length;

        if (isLastVisibleLine) {
          lineText = this.truncateTextWithEllipsis(lineText, maxTextWidth, hasMoreLines);
        }
        this.ctx.fillText(lineText, x + padding, textY);
        textY += lineHeight;
      }
    } else {
      const truncatedText = this.truncateTextWithEllipsis(text, maxTextWidth);
      this.ctx.fillText(truncatedText, x + padding, y + height / 2);
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split("\n");

    for (const paragraph of paragraphs) {
      if (paragraph === "") {
        lines.push("");
        continue;
      }

      let currentLine = "";
      const chars = paragraph.split("");

      for (const char of chars) {
        const testLine = currentLine + char;
        const metrics = this.ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine !== "") {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  private truncateTextWithEllipsis(
    text: string,
    maxWidth: number,
    forceEllipsis: boolean = false,
  ): string {
    const ellipsis = "...";
    const textWidth = this.ctx.measureText(text).width;

    if (textWidth <= maxWidth) {
      if (forceEllipsis) {
        let truncated = text;
        while (
          truncated.length > 0 &&
          this.ctx.measureText(truncated + ellipsis).width > maxWidth
        ) {
          truncated = truncated.slice(0, -1);
        }
        return truncated + ellipsis;
      }
      return text;
    }

    let truncated = text;
    while (truncated.length > 0 && this.ctx.measureText(truncated + ellipsis).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }

    return truncated + ellipsis;
  }

  private renderSelect(
    x: number,
    y: number,
    width: number,
    height: number,
    config: SelectConfig,
    _isDisabled?: boolean,
  ): void {
    const padding = 8;
    const arrowWidth = 20;

    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.stroke();

    let displayText = "";
    if (config.multiple && Array.isArray(config.value)) {
      if (config.value.length > 0) {
        const labels = config.value.map((v) => {
          const opt = config.options.find((o) => o.value === v);
          return opt?.label ?? String(v);
        });
        displayText = labels.join(", ");
      }
    } else if (config.value !== undefined && config.value !== null) {
      const selectedOption = config.options.find((opt) => opt.value === config.value);
      displayText = selectedOption?.label ?? String(config.value);
    }

    const placeholder = config.placeholder ?? "请选择";
    const text = displayText || placeholder;

    this.ctx.fillStyle = displayText
      ? this.theme.colors.cellText
      : this.theme.colors.placeholderText;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";

    const maxTextWidth = width - padding * 2 - arrowWidth;
    const truncatedText = truncateText(
      text,
      Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
    );
    this.ctx.fillText(truncatedText, x + padding, y + height / 2);

    this.ctx.fillStyle = this.theme.colors.date.icon;
    this.ctx.beginPath();
    const arrowX = x + width - padding - 8;
    const arrowY = y + height / 2;
    this.ctx.moveTo(arrowX - 4, arrowY - 2);
    this.ctx.lineTo(arrowX, arrowY + 3);
    this.ctx.lineTo(arrowX + 4, arrowY - 2);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private renderDate(
    x: number,
    y: number,
    width: number,
    height: number,
    config: DateConfig,
    _isDisabled?: boolean,
  ): void {
    const padding = 8;
    const iconWidth = 20;

    this.ctx.strokeStyle = this.theme.colors.date.border;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.stroke();

    let displayText = "";
    if (config.value) {
      const date = config.value instanceof Date ? config.value : new Date(config.value);
      if (!isNaN(date.getTime())) {
        const format = config.format ?? "YYYY-MM-DD";
        displayText = this.formatDate(date, format);
      }
    }

    const placeholder = config.placeholder ?? "选择日期";
    const text = displayText || placeholder;

    this.ctx.fillStyle = displayText
      ? this.theme.colors.cellText
      : this.theme.colors.placeholderText;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";

    const maxTextWidth = width - padding * 2 - iconWidth;
    const ellipsis = "...";
    let finalText = text;
    if (this.ctx.measureText(text).width > maxTextWidth) {
      let truncated = text;
      while (
        truncated.length > 0 &&
        this.ctx.measureText(truncated + ellipsis).width > maxTextWidth
      ) {
        truncated = truncated.slice(0, -1);
      }
      finalText = truncated + ellipsis;
    }
    this.ctx.fillText(finalText, x + padding, y + height / 2);

    this.ctx.strokeStyle = this.theme.colors.date.icon;
    this.ctx.lineWidth = 1.5;
    const iconX = x + width - padding - 10;
    const iconY = y + height / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(iconX - 6, iconY - 6);
    this.ctx.lineTo(iconX - 6, iconY + 6);
    this.ctx.lineTo(iconX + 6, iconY + 6);
    this.ctx.lineTo(iconX + 6, iconY - 6);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(iconX - 6, iconY - 2);
    this.ctx.lineTo(iconX + 6, iconY - 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(iconX - 3, iconY - 8);
    this.ctx.lineTo(iconX - 3, iconY - 5);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(iconX + 3, iconY - 8);
    this.ctx.lineTo(iconX + 3, iconY - 5);
    this.ctx.stroke();
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return format
      .replace("YYYY", String(year))
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  }

  private renderImage(
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ImageConfig,
    rowIndex?: number,
    isHovered?: boolean,
  ): void {
    // 多图模式
    if (config.images && config.images.length > 0) {
      this.renderMultipleImages(x, y, cellWidth, cellHeight, config, rowIndex, isHovered);
      return;
    }

    // 单图模式 - 如果没有图片源则不渲染
    if (!config.src) {
      return;
    }

    const padding = 4; // 单元格内边距
    const maxImgSize = Math.min(cellWidth, cellHeight) - padding * 2;
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    // 限制图片大小不超过单元格可用空间
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const borderRadius = config.circle
      ? Math.min(imgWidth, imgHeight) / 2
      : (config.borderRadius ?? 0);

    // 计算图片居中位置
    const imgX = x + (cellWidth - imgWidth) / 2;
    const imgY = y + (cellHeight - imgHeight) / 2;

    // 绘制占位背景
    this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
    } else {
      this.ctx.rect(imgX, imgY, imgWidth, imgHeight);
    }
    this.ctx.fill();

    // 如果有图片源
    if (config.src) {
      // 检查是否在懒加载范围内
      const lazyEnabled = config.lazy !== false; // 默认开启懒加载
      const threshold = config.lazyThreshold ?? 200;

      if (lazyEnabled && rowIndex !== undefined && this.currentVisibleRange) {
        const inLazyRange = this.isInLazyLoadRange(rowIndex, threshold);
        if (!inLazyRange) {
          // 不在懒加载范围内，只显示占位图
          this.renderImagePlaceholder(
            imgX,
            imgY,
            imgWidth,
            imgHeight,
            borderRadius,
            config.placeholder,
          );
          // Hover 效果
          if (isHovered && config.hoverable !== false) {
            this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
          }
          return;
        }
      }

      // 检查是否加载失败
      if (this.failedImages.has(config.src)) {
        // 加载失败，显示错误图片
        this.renderImageError(imgX, imgY, imgWidth, imgHeight, borderRadius, config.errorImage);
        return;
      }

      const cachedImage = this.imageCache.get(config.src);

      if (cachedImage) {
        // 图片已加载，绘制图片
        this.ctx.save();

        // 创建裁剪路径
        this.ctx.beginPath();
        if (borderRadius > 0) {
          this.ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
        } else {
          this.ctx.rect(imgX, imgY, imgWidth, imgHeight);
        }
        this.ctx.clip();

        // 根据fit模式绘制图片
        this.drawImageWithFit(cachedImage, imgX, imgY, imgWidth, imgHeight, config.fit ?? "cover");

        this.ctx.restore();
      } else if (!this.loadingImages.has(config.src)) {
        // 图片未加载，开始加载
        this.loadImage(config.src);
        // 显示占位图
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      } else {
        // 图片正在加载中，显示占位图或加载指示
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      }
    } else {
      // 没有图片源，显示占位图
      this.renderImagePlaceholder(
        imgX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        config.placeholder,
      );
    }

    // Hover 效果
    if (isHovered && config.hoverable !== false) {
      this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
    }
  }

  private renderMultipleImages(
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    config: ImageConfig,
    rowIndex?: number,
    isHovered?: boolean,
  ): void {
    const images = config.images!;
    const padding = 4; // 单元格内边距
    const maxImgSize = Math.min(cellWidth, cellHeight) - padding * 2;
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    // 限制图片大小不超过单元格可用空间
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const gap = config.gap ?? 4;
    const borderRadius = config.circle
      ? Math.min(imgWidth, imgHeight) / 2
      : (config.borderRadius ?? 0);
    const showMoreCount = config.showMoreCount !== false;

    // 根据单元格宽度计算能显示的图片数量
    const availableWidth = cellWidth - padding * 2;
    const userMaxVisible = config.maxVisible;
    let calculatedMaxVisible: number;

    if (images.length === 1) {
      calculatedMaxVisible = 1;
    } else {
      // 计算能显示几个图片（包括间距）
      const maxByWidth = Math.floor((availableWidth + gap) / (imgWidth + gap));
      // 如果显示 +N，需要预留一个位置
      const reservedForMore = showMoreCount ? 1 : 0;
      calculatedMaxVisible = Math.max(1, maxByWidth - reservedForMore);
    }

    // 如果用户指定了 maxVisible，取较小值
    const maxVisible =
      userMaxVisible !== undefined
        ? Math.min(userMaxVisible, calculatedMaxVisible)
        : calculatedMaxVisible;

    // 检查是否在懒加载范围内
    const lazyEnabled = config.lazy !== false;
    const threshold = config.lazyThreshold ?? 200;
    let inLazyRange = true;
    if (lazyEnabled && rowIndex !== undefined && this.currentVisibleRange) {
      inLazyRange = this.isInLazyLoadRange(rowIndex, threshold);
    }

    // 计算需要显示的图片
    const hasMore = images.length > maxVisible;
    const displayCount = hasMore ? maxVisible : images.length;
    const displayImages = images.slice(0, displayCount);
    const moreCount = hasMore ? images.length - maxVisible : 0;

    // 计算实际渲染的内容宽度
    let contentWidth: number;
    if (hasMore && showMoreCount) {
      // 显示图片 + +N 块
      contentWidth = displayCount * imgWidth + displayCount * gap + imgWidth;
    } else {
      contentWidth = displayImages.length * imgWidth + Math.max(0, displayImages.length - 1) * gap;
    }

    // 确保起始位置不超出单元格左边界
    let startX = x + (cellWidth - contentWidth) / 2;
    startX = Math.max(x + padding, startX);
    const imgY = y + (cellHeight - imgHeight) / 2;

    // 渲染每张图片
    for (let i = 0; i < displayImages.length; i++) {
      const src = displayImages[i]!;
      const imgX = startX + i * (imgWidth + gap);
      const isCurrentHovered =
        isHovered && config.hoverable !== false && this.currentHoveredImageIndex === i;

      // 绘制占位背景
      this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
      this.ctx.beginPath();
      if (borderRadius > 0) {
        this.ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
      } else {
        this.ctx.rect(imgX, imgY, imgWidth, imgHeight);
      }
      this.ctx.fill();

      if (!inLazyRange) {
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
        if (isCurrentHovered) {
          this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }

      // 检查是否加载失败
      if (this.failedImages.has(src)) {
        this.renderImageError(imgX, imgY, imgWidth, imgHeight, borderRadius, config.errorImage);
        if (isCurrentHovered) {
          this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
        }
        continue;
      }

      const cachedImage = this.imageCache.get(src);
      if (cachedImage) {
        // 图片已加载，绘制
        this.ctx.save();
        this.ctx.beginPath();
        if (borderRadius > 0) {
          this.ctx.roundRect(imgX, imgY, imgWidth, imgHeight, borderRadius);
        } else {
          this.ctx.rect(imgX, imgY, imgWidth, imgHeight);
        }
        this.ctx.clip();
        this.drawImageWithFit(cachedImage, imgX, imgY, imgWidth, imgHeight, config.fit ?? "cover");
        this.ctx.restore();
      } else if (!this.loadingImages.has(src)) {
        this.loadImage(src);
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      } else {
        this.renderImagePlaceholder(
          imgX,
          imgY,
          imgWidth,
          imgHeight,
          borderRadius,
          config.placeholder,
        );
      }

      // 单个图片的 hover 效果
      if (isCurrentHovered) {
        this.renderImageHover(imgX, imgY, imgWidth, imgHeight, borderRadius);
      }
    }

    // 渲染 +N 计数（替换最后一张图片或追加）
    if (hasMore && showMoreCount) {
      const countX = startX + displayCount * (imgWidth + gap);
      const isMoreHovered =
        isHovered && config.hoverable !== false && this.currentHoveredImageIndex === displayCount;
      this.renderMoreCount(
        countX,
        imgY,
        imgWidth,
        imgHeight,
        borderRadius,
        moreCount,
        isMoreHovered,
      );
    }
  }

  private renderMoreCount(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    count: number,
    isHovered?: boolean,
  ): void {
    // 绘制半透明背景
    this.ctx.fillStyle = isHovered
      ? this.theme.colors.image.hoverBorder
      : this.theme.colors.moreCount.background;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.fill();

    // 绘制 +N 文字
    const text = `+${count}`;
    this.ctx.fillStyle = this.theme.colors.moreCount.text;
    this.ctx.font = `bold ${Math.min(width, height) * 0.4}px ${this.theme.font.family}`;

    // 保存当前对齐设置
    const prevAlign = this.ctx.textAlign;
    const prevBaseline = this.ctx.textBaseline;

    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(text, x + width / 2, y + height / 2);

    // 恢复对齐设置
    this.ctx.textAlign = prevAlign;
    this.ctx.textBaseline = prevBaseline;
  }

  private renderImageHover(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
  ): void {
    const hoverBorderColor = this.theme.colors.image.hoverBorder;

    // 保存当前状态
    const prevStrokeStyle = this.ctx.strokeStyle;
    const prevLineWidth = this.ctx.lineWidth;

    // 绘制 hover 边框
    this.ctx.strokeStyle = hoverBorderColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.stroke();

    // 绘制 hover 阴影效果（外发光）
    this.ctx.save();
    this.ctx.shadowColor = this.theme.colors.image.hoverShadow;
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.strokeStyle = hoverBorderColor;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.stroke();
    this.ctx.restore();

    // 恢复状态
    this.ctx.strokeStyle = prevStrokeStyle;
    this.ctx.lineWidth = prevLineWidth;
  }

  private renderImagePlaceholder(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    placeholder?: string,
  ): void {
    if (placeholder) {
      // 如果有占位图配置，尝试加载
      const cachedPlaceholder = this.imageCache.get(placeholder);
      if (cachedPlaceholder) {
        this.ctx.save();
        this.ctx.beginPath();
        if (borderRadius > 0) {
          this.ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          this.ctx.rect(x, y, width, height);
        }
        this.ctx.clip();
        this.drawImageWithFit(cachedPlaceholder, x, y, width, height, "cover");
        this.ctx.restore();
        return;
      } else if (!this.loadingImages.has(placeholder)) {
        this.loadImage(placeholder);
      }
    }

    // 显示默认图标背景
    this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.fill();

    // 绘制图片图标
    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + width / 2;
    const iconY = y + height / 2;

    // 保存当前状态
    const prevStrokeStyle = this.ctx.strokeStyle;
    const prevLineWidth = this.ctx.lineWidth;

    this.ctx.strokeStyle = this.theme.colors.placeholderText;
    this.ctx.lineWidth = 1.5;

    // 简单的图片图标
    this.ctx.beginPath();
    this.ctx.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    this.ctx.stroke();

    // 山形
    this.ctx.beginPath();
    this.ctx.moveTo(iconX - iconSize / 2, iconY + iconSize / 4);
    this.ctx.lineTo(iconX - iconSize / 4, iconY);
    this.ctx.lineTo(iconX, iconY + iconSize / 4);
    this.ctx.lineTo(iconX + iconSize / 4, iconY - iconSize / 4);
    this.ctx.lineTo(iconX + iconSize / 2, iconY + iconSize / 4);
    this.ctx.stroke();

    // 恢复状态
    this.ctx.strokeStyle = prevStrokeStyle;
    this.ctx.lineWidth = prevLineWidth;
  }

  private renderImageError(
    x: number,
    y: number,
    width: number,
    height: number,
    borderRadius: number,
    errorImage?: string,
  ): void {
    // 如果有错误图片配置，尝试显示
    if (errorImage) {
      const cachedErrorImage = this.imageCache.get(errorImage);
      if (cachedErrorImage) {
        this.ctx.save();
        this.ctx.beginPath();
        if (borderRadius > 0) {
          this.ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          this.ctx.rect(x, y, width, height);
        }
        this.ctx.clip();
        this.drawImageWithFit(cachedErrorImage, x, y, width, height, "cover");
        this.ctx.restore();
        return;
      } else if (!this.loadingImages.has(errorImage) && !this.failedImages.has(errorImage)) {
        this.loadImage(errorImage);
      }
    }

    // 显示错误背景
    this.ctx.fillStyle = this.theme.colors.image.errorBg;
    this.ctx.beginPath();
    if (borderRadius > 0) {
      this.ctx.roundRect(x, y, width, height, borderRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.fill();

    // 绘制错误图标（破损图片 + X）
    const iconSize = Math.min(width, height) * 0.4;
    const iconX = x + width / 2;
    const iconY = y + height / 2;

    // 保存当前状态
    const prevStrokeStyle = this.ctx.strokeStyle;
    const prevLineWidth = this.ctx.lineWidth;

    // 破损图片轮廓
    this.ctx.strokeStyle = this.theme.colors.image.errorBorder;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    this.ctx.stroke();

    // X 标记
    this.ctx.beginPath();
    this.ctx.moveTo(iconX - iconSize / 4, iconY - iconSize / 4);
    this.ctx.lineTo(iconX + iconSize / 4, iconY + iconSize / 4);
    this.ctx.moveTo(iconX + iconSize / 4, iconY - iconSize / 4);
    this.ctx.lineTo(iconX - iconSize / 4, iconY + iconSize / 4);
    this.ctx.stroke();

    // 恢复状态
    this.ctx.strokeStyle = prevStrokeStyle;
    this.ctx.lineWidth = prevLineWidth;
  }

  private drawImageWithFit(
    img: HTMLImageElement,
    x: number,
    y: number,
    containerWidth: number,
    containerHeight: number,
    fit: "fill" | "contain" | "cover" | "none",
  ): void {
    const imgRatio = img.width / img.height;
    const containerRatio = containerWidth / containerHeight;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    switch (fit) {
      case "fill":
        // 拉伸填充
        drawWidth = containerWidth;
        drawHeight = containerHeight;
        drawX = x;
        drawY = y;
        break;

      case "contain":
        // 包含，保持比例
        if (imgRatio > containerRatio) {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        } else {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        }
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;

      case "cover":
        // 覆盖，保持比例
        if (imgRatio > containerRatio) {
          drawHeight = containerHeight;
          drawWidth = containerHeight * imgRatio;
        } else {
          drawWidth = containerWidth;
          drawHeight = containerWidth / imgRatio;
        }
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;

      case "none":
      default:
        // 原始尺寸
        drawWidth = img.width;
        drawHeight = img.height;
        drawX = x + (containerWidth - drawWidth) / 2;
        drawY = y + (containerHeight - drawHeight) / 2;
        break;
    }

    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  /**
   * 检查行是否在懒加载范围内
   */
  private isInLazyLoadRange(rowIndex: number, threshold: number): boolean {
    if (!this.currentVisibleRange) return true;

    const { startRow, endRow } = this.currentVisibleRange;
    const rowHeight = this.rowHeight || this.theme.row.height;

    // 计算额外行数（基于阈值）
    const extraRows = Math.ceil(threshold / rowHeight);

    // 扩展后的范围
    const lazyStartRow = Math.max(0, startRow - extraRows);
    const lazyEndRow = endRow + extraRows;

    return rowIndex >= lazyStartRow && rowIndex <= lazyEndRow;
  }

  private loadImage(src: string): void {
    if (this.loadingImages.has(src) || this.imageCache.has(src)) {
      return;
    }

    this.loadingImages.add(src);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // 检查组件是否已销毁
      if (this.isDestroyed) return;

      this.imageCache.set(src, img);
      this.loadingImages.delete(src);

      // 触发回调
      const callbacks = this.imageLoadCallbacks.get(src);
      if (callbacks) {
        callbacks.forEach((cb) => cb());
        this.imageLoadCallbacks.delete(src);
      }

      // 请求重绘
      this.markDirty(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    };

    img.onerror = () => {
      // 检查组件是否已销毁
      if (this.isDestroyed) return;

      this.loadingImages.delete(src);
      this.failedImages.add(src);

      // 触发回调（即使失败也触发，让调用者知道加载结束）
      const callbacks = this.imageLoadCallbacks.get(src);
      if (callbacks) {
        callbacks.forEach((cb) => cb());
        this.imageLoadCallbacks.delete(src);
      }
    };

    img.src = src;
  }

  /**
   * 重试加载失败的图片
   */
  retryImage(src: string): void {
    if (this.failedImages.has(src)) {
      this.failedImages.delete(src);
      this.loadImage(src);
    }
  }

  /**
   * 检查图片是否加载失败
   */
  isImageFailed(src: string): boolean {
    return this.failedImages.has(src);
  }

  /**
   * 检查图片是否已加载
   */
  isImageLoaded(src: string): boolean {
    return this.imageCache.has(src);
  }

  /**
   * 清除图片缓存
   */
  clearImageCache(): void {
    this.imageCache.clear();
    this.failedImages.clear();
  }

  renderDropdown(dropdown: DropdownState): void {
    if (dropdown.type === "tags" && dropdown.tagsConfig) {
      this.renderTagsDropdown(dropdown);
      return;
    }

    const { config, x, y, width, scrollTop, hoveredIndex } = dropdown;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, dropdownHeight);
    this.ctx.clip();

    const selectedValues =
      config.multiple && Array.isArray(config.value)
        ? config.value
        : config.value !== undefined
          ? [config.value]
          : [];

    for (let i = 0; i < config.options.length; i++) {
      const option = config.options[i]!;
      const itemY = y + i * itemHeight - scrollTop;

      if (itemY + itemHeight < y || itemY > y + dropdownHeight) continue;

      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      const isSelected = selectedValues.includes(option.value);

      if (isSelected && !config.multiple) {
        this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      if (config.multiple) {
        const checkboxSize = 14;
        const checkboxX = x + 10;
        const checkboxY = itemY + (itemHeight - checkboxSize) / 2;

        this.ctx.strokeStyle = isSelected
          ? this.theme.colors.checkbox.checkedBg
          : this.theme.colors.checkbox.border;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
        this.ctx.stroke();

        if (isSelected) {
          this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
          this.ctx.beginPath();
          this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
          this.ctx.fill();

          this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
          this.ctx.lineWidth = 2;
          this.ctx.lineCap = "round";
          this.ctx.lineJoin = "round";
          this.ctx.beginPath();
          this.ctx.moveTo(checkboxX + 3, checkboxY + checkboxSize / 2);
          this.ctx.lineTo(checkboxX + checkboxSize / 2, checkboxY + checkboxSize - 4);
          this.ctx.lineTo(checkboxX + checkboxSize - 3, checkboxY + 4);
          this.ctx.stroke();
        }

        this.ctx.fillStyle = option.disabled
          ? this.theme.colors.placeholderText
          : this.theme.colors.dropdown.text;
        this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";
        const textX = checkboxX + checkboxSize + 8;
        const textY = itemY + itemHeight / 2;
        const maxTextWidth = width - (checkboxSize + 28);
        const truncatedText = truncateText(
          option.label,
          Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
        );
        this.ctx.fillText(truncatedText, textX, textY);
      } else {
        if (isSelected) {
          this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
          this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`;
        } else {
          this.ctx.fillStyle = option.disabled
            ? this.theme.colors.placeholderText
            : this.theme.colors.dropdown.text;
          this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
        }

        this.ctx.textBaseline = "middle";
        const textX = x + 12;
        const textY = itemY + itemHeight / 2;
        const maxTextWidth = width - 24;
        const truncatedText = truncateText(
          option.label,
          Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
        );
        this.ctx.fillText(truncatedText, textX, textY);

        if (isSelected) {
          this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
          this.ctx.beginPath();
          const checkX = x + width - 20;
          const checkY = textY;
          this.ctx.moveTo(checkX - 6, checkY);
          this.ctx.lineTo(checkX - 2, checkY + 4);
          this.ctx.lineTo(checkX + 6, checkY - 4);
          this.ctx.strokeStyle = this.theme.colors.checkbox.checkedBg;
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        }
      }
    }

    if (config.options.length > maxVisibleItems) {
      const scrollbarWidth = 6;
      const scrollbarX = x + width - scrollbarWidth - 2;
      const totalHeight = config.options.length * itemHeight;
      const scrollbarHeight = Math.max(20, (dropdownHeight / totalHeight) * dropdownHeight);
      const scrollbarY = y + (scrollTop / totalHeight) * dropdownHeight;

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
      this.ctx.beginPath();
      this.ctx.roundRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 3);
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }

    this.ctx.restore();
  }

  private renderTagsDropdown(dropdown: DropdownState): void {
    const { x, y, width, scrollTop, hoveredIndex, tagsConfig } = dropdown;
    if (!tagsConfig || !tagsConfig.options) return;

    const { options, selectedValues = [] } = tagsConfig;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, dropdownHeight);
    this.ctx.clip();

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
      const itemY = y + i * itemHeight - scrollTop;

      if (itemY + itemHeight < y || itemY > y + dropdownHeight) continue;

      const isSelected = selectedValues.includes(option.value ?? option.text);

      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      const checkboxSize = 14;
      const checkboxX = x + 10;
      const checkboxY = itemY + (itemHeight - checkboxSize) / 2;

      this.ctx.fillStyle = isSelected
        ? this.theme.colors.checkbox.checkedBg
        : this.theme.colors.button.background;
      this.ctx.strokeStyle = isSelected
        ? this.theme.colors.checkbox.checkedBg
        : this.theme.colors.checkbox.border;
      this.ctx.lineWidth = 1;

      this.ctx.beginPath();
      this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
      this.ctx.fill();
      this.ctx.stroke();

      if (isSelected) {
        this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(checkboxX + 3, checkboxY + 7);
        this.ctx.lineTo(checkboxX + 6, checkboxY + 10);
        this.ctx.lineTo(checkboxX + 11, checkboxY + 4);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = option.disabled
        ? this.theme.colors.placeholderText
        : this.theme.colors.dropdown.text;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";

      const textX = checkboxX + checkboxSize + 8;
      const textY = itemY + itemHeight / 2;
      const maxTextWidth = width - (checkboxSize + 28);
      const truncatedText = truncateText(
        option.text,
        Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
      );
      this.ctx.fillText(truncatedText, textX, textY);
    }

    if (options.length > maxVisibleItems) {
      const scrollbarWidth = 6;
      const scrollbarX = x + width - scrollbarWidth - 2;
      const totalHeight = options.length * itemHeight;
      const scrollbarHeight = Math.max(20, (dropdownHeight / totalHeight) * dropdownHeight);
      const scrollbarY = y + (scrollTop / totalHeight) * dropdownHeight;

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
      this.ctx.beginPath();
      this.ctx.roundRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 3);
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }

    this.ctx.restore();
  }

  private renderTag(text: string, x: number, y: number, fontSize: number): void {
    const padding = 4;
    const textWidth = this.ctx.measureText(text).width;
    const tagWidth = textWidth + padding * 2;
    const tagHeight = fontSize + padding * 2;

    const tagColor =
      this.theme.colors.tagColors[text.toLowerCase()] ?? this.theme.colors.tagColors["default"]!;

    this.ctx.fillStyle = tagColor;
    this.ctx.beginPath();
    const radius = 4;
    const tagX = x - padding;
    const tagY = y - fontSize / 2 - padding;

    this.ctx.roundRect(tagX, tagY, tagWidth, tagHeight, radius);
    this.ctx.fill();

    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.fillText(text, x, y);
  }

  private renderTags(
    x: number,
    y: number,
    width: number,
    height: number,
    padding: number,
    config: TagsConfig,
    _isDisabled?: boolean,
  ): void {
    const { tags, maxRows = 1 } = config;
    if (!tags || tags.length === 0) return;

    const tagPadding = 4;
    const tagHeight = this.theme.font.size + tagPadding * 2;
    const tagRadius = 4;
    const gap = 4;
    const lineGap = 2;
    const ellipsis = "...";

    const availableWidth = width - padding * 2;
    const maxLineCount = maxRows;

    const moreTagWidth = (count: number) => {
      const moreText = `+${count}`;
      return this.ctx.measureText(moreText).width + tagPadding * 2;
    };

    const calculateTagWidth = (tag: TagItem): number => {
      return this.ctx.measureText(tag.text).width + tagPadding * 2;
    };

    const ellipsisWidth = this.ctx.measureText(ellipsis).width;

    const lines: { tag: TagItem; displayText: string; width: number }[][] = [];
    let currentLine: { tag: TagItem; displayText: string; width: number }[] = [];
    let currentLineWidth = 0;
    let processedTags = 0;

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i]!;
      const tagWidth = calculateTagWidth(tag);

      const isLastLine = lines.length >= maxLineCount - 1;
      const remainingTags = tags.length - i;

      if (isLastLine) {
        const moreWidth = remainingTags > 1 ? moreTagWidth(remainingTags - 1) + gap : 0;
        const remainingSpace = availableWidth - currentLineWidth - moreWidth;

        if (tagWidth <= remainingSpace) {
          currentLine.push({ tag, displayText: tag.text, width: tagWidth });
          currentLineWidth += tagWidth + gap;
          processedTags++;
        } else {
          const truncatedTagSpace = availableWidth - currentLineWidth - moreWidth;
          if (truncatedTagSpace >= tagPadding * 2 + ellipsisWidth + 10) {
            const maxTextWidth = truncatedTagSpace - tagPadding * 2 - ellipsisWidth;
            let truncatedText = "";
            let textWidth = 0;
            for (const char of tag.text) {
              const charWidth = this.ctx.measureText(char).width;
              if (textWidth + charWidth > maxTextWidth) break;
              truncatedText += char;
              textWidth += charWidth;
            }
            if (truncatedText.length > 0) {
              const displayText = truncatedText + ellipsis;
              const truncatedWidth = this.ctx.measureText(displayText).width + tagPadding * 2;
              currentLine.push({ tag, displayText, width: truncatedWidth });
              processedTags++;
            }
          }
          break;
        }
      } else {
        if (tagWidth <= availableWidth - currentLineWidth) {
          currentLine.push({ tag, displayText: tag.text, width: tagWidth });
          currentLineWidth += tagWidth + gap;
          processedTags++;
        } else {
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }
          currentLine = [{ tag, displayText: tag.text, width: tagWidth }];
          currentLineWidth = tagWidth + gap;
          processedTags++;

          if (lines.length >= maxLineCount) {
            break;
          }
        }
      }
    }

    if (currentLine.length > 0 && lines.length < maxLineCount) {
      lines.push(currentLine);
    }

    const totalHeight = lines.length * tagHeight + (lines.length - 1) * lineGap;
    const startY = y + (height - totalHeight) / 2;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]!;
      const lineY = startY + lineIndex * (tagHeight + lineGap);
      let currentX = x + padding;

      for (const { tag, displayText, width: tagWidth } of line) {
        let bgColor = tag.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0");
        let textColor = tag.color ?? this.theme.colors.cellText;

        this.ctx.fillStyle = bgColor;
        this.ctx.beginPath();
        this.ctx.roundRect(currentX, lineY, tagWidth, tagHeight, tagRadius);
        this.ctx.fill();

        this.ctx.fillStyle = textColor;
        this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";

        const textY = lineY + tagHeight / 2;
        const textX = currentX + (tagWidth - this.ctx.measureText(displayText).width) / 2;
        this.ctx.fillText(displayText, textX, textY);

        currentX += tagWidth + gap;
      }

      if (lineIndex === lines.length - 1) {
        const remainingCount = tags.length - processedTags;
        if (remainingCount > 0) {
          const moreText = `+${remainingCount}`;
          const moreWidth = moreTagWidth(remainingCount);

          this.ctx.fillStyle = this.theme.colors.moreCount.background;
          this.ctx.beginPath();
          this.ctx.roundRect(currentX, lineY, moreWidth, tagHeight, tagRadius);
          this.ctx.fill();

          this.ctx.fillStyle = this.theme.colors.moreCount.text;
          this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
          this.ctx.textBaseline = "middle";
          const textY = lineY + tagHeight / 2;
          const textX = currentX + (moreWidth - this.ctx.measureText(moreText).width) / 2;
          this.ctx.fillText(moreText, textX, textY);
        }
      }
    }
  }

  private resolveDisabled(disabled: DisabledValue | undefined, row: Row, column: Column): boolean {
    if (disabled === undefined) {
      return false;
    }
    if (typeof disabled === "function") {
      return disabled(row, column);
    }
    return disabled;
  }

  private formatValue(value: unknown, column: Column, row: Row): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (column.formatter) {
      return column.formatter(value, row, column);
    }

    switch (column.type) {
      case "number":
        return typeof value === "number" ? value.toLocaleString() : String(value);
      case "boolean":
        return value ? "Yes" : "No";
      case "date":
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        return String(value);
      default:
        return String(value);
    }
  }

  private isCellSelected(rowIndex: number, colIndex: number, selectedCells: CellRange[]): boolean {
    return selectedCells.some((range) => {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);

      return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
    });
  }

  private renderCenterSelections(
    selectedCells: CellRange[],
    scrollLeft: number,
    scrollTop: number,
    centerColumnIndices: number[],
  ): void {
    const leafColumns = this.layoutManager.getLeafColumns();

    for (const range of selectedCells) {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);

      const merge = this.layoutManager.getCellMerge(minRow, minCol);
      let effectiveMinRow = minRow;
      let effectiveMaxRow = maxRow;
      let effectiveMinCol = minCol;
      let effectiveMaxCol = maxCol;

      if (merge) {
        effectiveMinRow = merge.rowIndex;
        effectiveMaxRow = merge.rowIndex + merge.rowspan - 1;
        effectiveMinCol = merge.columnIndex;
        effectiveMaxCol = merge.columnIndex + merge.colspan - 1;
      }

      const centerMinCol = Math.max(effectiveMinCol, Math.min(...centerColumnIndices));
      const centerMaxCol = Math.min(effectiveMaxCol, Math.max(...centerColumnIndices));

      if (centerMinCol > centerMaxCol) continue;

      const startCol = leafColumns[centerMinCol];
      const endCol = leafColumns[centerMaxCol];
      if (!startCol || !endCol) continue;
      if (startCol.fixed || endCol.fixed) continue;

      const drawY = this.layoutManager.getRowOffset(effectiveMinRow) - scrollTop;
      const selectionHeight =
        this.layoutManager.getRowOffset(effectiveMaxRow) +
        this.layoutManager.getRowHeightByIndex(effectiveMaxRow) -
        this.layoutManager.getRowOffset(effectiveMinRow);

      const startPos = this.layoutManager.getCellPosition(effectiveMinRow, centerMinCol);
      const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, centerMaxCol);
      const selectionWidth = endPos.x + endPos.width - startPos.x;
      const drawX = startPos.x - scrollLeft;

      this.ctx.strokeStyle = this.theme.colors.selectionBorder;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([]);
      this.ctx.strokeRect(drawX, drawY, selectionWidth, selectionHeight);
    }
  }

  private renderFixedSelections(
    selectedCells: CellRange[],
    scrollTop: number,
    leftFixedIndices: number[],
    rightFixedIndices: number[],
  ): void {
    for (const range of selectedCells) {
      const minRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const minCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const maxCol = Math.max(range.start.columnIndex, range.end.columnIndex);

      // Check if this is a merged cell selection
      const merge = this.layoutManager.getCellMerge(minRow, minCol);
      let effectiveMinRow = minRow;
      let effectiveMaxRow = maxRow;
      let effectiveMinCol = minCol;
      let effectiveMaxCol = maxCol;

      if (merge) {
        effectiveMinRow = merge.rowIndex;
        effectiveMaxRow = merge.rowIndex + merge.rowspan - 1;
        effectiveMinCol = merge.columnIndex;
        effectiveMaxCol = merge.columnIndex + merge.colspan - 1;
      }

      const drawY = this.layoutManager.getRowOffset(effectiveMinRow) - scrollTop;
      const selectionHeight =
        this.layoutManager.getRowOffset(effectiveMaxRow) +
        this.layoutManager.getRowHeightByIndex(effectiveMaxRow) -
        this.layoutManager.getRowOffset(effectiveMinRow);

      this.ctx.strokeStyle = this.theme.colors.selectionBorder;
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([]);

      const leftFixedInSelection = leftFixedIndices.filter(
        (i: number) => i >= effectiveMinCol && i <= effectiveMaxCol,
      );
      if (leftFixedInSelection.length > 0) {
        const leftFixedMin = leftFixedInSelection[0]!;
        const leftFixedMax = leftFixedInSelection[leftFixedInSelection.length - 1]!;
        const startPos = this.layoutManager.getCellPosition(effectiveMinRow, leftFixedMin);
        const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, leftFixedMax);
        const selectionWidth = endPos.x + endPos.width - startPos.x;
        this.ctx.strokeRect(startPos.x, drawY, selectionWidth, selectionHeight);
      }

      const rightFixedInSelection = rightFixedIndices.filter(
        (i: number) => i >= effectiveMinCol && i <= effectiveMaxCol,
      );
      if (rightFixedInSelection.length > 0) {
        const rightFixedMin = rightFixedInSelection[0]!;
        const rightFixedMax = rightFixedInSelection[rightFixedInSelection.length - 1]!;
        const startPos = this.layoutManager.getCellPosition(effectiveMinRow, rightFixedMin);
        const endPos = this.layoutManager.getCellPosition(effectiveMaxRow, rightFixedMax);
        const selectionWidth = endPos.x + endPos.width - startPos.x;
        this.ctx.strokeRect(startPos.x, drawY, selectionWidth, selectionHeight);
      }
    }
  }

  renderLoadingOverlay(): void {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    this.ctx.save();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = this.theme.colors.headerText;
    this.ctx.font = `14px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("Loading...", width / 2, height / 2);
    this.ctx.restore();
  }

  renderEmptyState(
    message: string,
    sortConfig: SortConfig[] = [],
    filterConfig: FilterConfig[] = [],
    hoveredHeaderColumnKey?: string,
  ): void {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.background;
    this.ctx.fillRect(0, 0, width, height);

    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const columns = this.layoutManager.getLeafColumns();

    if (columns.length > 0) {
      this.ctx.save();
      this.ctx.fillStyle = this.theme.colors.headerBackground;
      this.ctx.fillRect(0, 0, width, headerHeight);

      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = this.theme.border.width;
      this.ctx.beginPath();
      this.ctx.moveTo(0, headerHeight);
      this.ctx.lineTo(width, headerHeight);
      this.ctx.stroke();

      const headerCells = this.layoutManager.getHeaderCells();
      for (const headerCell of headerCells) {
        this.ctx.fillStyle = this.theme.colors.headerBackground;
        this.ctx.fillRect(headerCell.x, headerCell.y, headerCell.width, headerCell.height);

        this.ctx.fillStyle = this.theme.colors.headerText;
        this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";

        const sortInfo = sortConfig.find((s) => s.column === headerCell.column.key);
        const sortDirection = sortInfo?.direction ?? "none";
        const isSortable = headerCell.column.sortable !== false;
        const isHovered = headerCell.column.key === hoveredHeaderColumnKey;
        const showSortIndicator =
          headerCell.isLeaf && isSortable && (sortDirection !== "none" || isHovered);
        const sortIndicatorWidth = showSortIndicator ? 20 : 0;

        const hasFilter = filterConfig.some((f) => f.column === headerCell.column.key);
        const showFilterIndicator = headerCell.isLeaf && headerCell.column.filterable;
        const filterIndicatorWidth = showFilterIndicator ? 20 : 0;

        const padding = 8;
        const maxTextWidth =
          headerCell.width - padding * 2 - sortIndicatorWidth - filterIndicatorWidth;
        const text = truncateText(headerCell.column.title, Math.floor(maxTextWidth / 7));

        const align = headerCell.column.align ?? "center";
        let textX = headerCell.x + padding;

        if (align === "center") {
          textX =
            headerCell.x +
            (headerCell.width -
              this.ctx.measureText(text).width -
              sortIndicatorWidth -
              filterIndicatorWidth) /
              2;
        } else if (align === "right") {
          textX =
            headerCell.x +
            headerCell.width -
            padding -
            this.ctx.measureText(text).width -
            sortIndicatorWidth -
            filterIndicatorWidth;
        }

        const textY = headerCell.y + headerCell.height / 2;
        this.ctx.fillText(text, textX, textY);

        if (headerCell.isLeaf) {
          if (showFilterIndicator) {
            const filterX = headerCell.x + headerCell.width - padding - 10;
            if (showSortIndicator) {
              this.renderSortIndicator(
                filterX - 16,
                textY,
                sortDirection === "none" ? "hover" : sortDirection,
              );
            }
            this.renderFilterIndicator(filterX, textY, hasFilter);
          } else if (showSortIndicator) {
            this.renderSortIndicator(
              headerCell.x + headerCell.width - padding - 10,
              textY,
              sortDirection === "none" ? "hover" : sortDirection,
            );
          }
        }

        this.ctx.strokeStyle = this.theme.colors.cellBorder;
        this.ctx.lineWidth = this.theme.border.width;
        this.ctx.strokeRect(headerCell.x, headerCell.y, headerCell.width, headerCell.height);
      }

      this.ctx.restore();
    }

    this.ctx.fillStyle = this.theme.colors.cellText;
    this.ctx.font = `14px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(message, width / 2, headerHeight + (height - headerHeight) / 2);
    this.ctx.restore();
  }

  private isColumnHovered(column: Column, hoveredIndex: number): boolean {
    const leafColumns = this.layoutManager.getLeafColumns();
    const hoveredColumn = leafColumns[hoveredIndex];
    if (!hoveredColumn) return false;
    return column.key === hoveredColumn.key;
  }

  renderFixedColumnsShadow(fixedWidth: number, side: "left" | "right"): void {
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const shadowWidth = 10;

    this.ctx.save();

    const gradient = this.ctx.createLinearGradient(
      side === "left" ? fixedWidth : width - fixedWidth - shadowWidth,
      0,
      side === "left" ? fixedWidth + shadowWidth : width - fixedWidth,
      0,
    );

    if (side === "left") {
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.15)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    } else {
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.15)");
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      side === "left" ? fixedWidth : width - fixedWidth - shadowWidth,
      0,
      shadowWidth,
      height,
    );

    this.ctx.restore();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getCanvasContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  renderTooltip(tooltip: TooltipState): void {
    const { x, y, width: cellWidth, content } = tooltip;
    const padding = 8;
    const lineHeight = 20;
    const tagGap = 4;
    const tagPadding = 4;
    const tagRadius = 4;

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    let tooltipHeight = padding * 2;
    let lines: string[] = [];
    let tagLines: TagItem[][] = [];

    const minTooltipWidth = 140;
    const maxTooltipWidth = 300;
    const availableWidth = cellWidth ?? maxTooltipWidth;

    let contentWidth = 0;

    if (content.type === "text") {
      const textWidth = this.ctx.measureText(content.text).width;
      contentWidth = Math.min(textWidth + padding * 2, maxTooltipWidth);

      const maxWidth = Math.max(minTooltipWidth, Math.min(contentWidth, availableWidth));

      const words = content.text.split("");
      let currentLine = "";

      for (const char of words) {
        const testLine = currentLine + char;
        const testWidth = this.ctx.measureText(testLine).width;

        if (testWidth > maxWidth - padding * 2) {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      tooltipHeight += lines.length * lineHeight;
    } else if (content.type === "tags") {
      const tags = content.tags;
      let currentTagLine: TagItem[] = [];
      let currentLineWidth = padding;

      for (const tag of tags) {
        const tagWidth = this.ctx.measureText(tag.text).width + tagPadding * 2;
        contentWidth = Math.max(contentWidth, currentLineWidth + tagWidth + padding);

        if (currentLineWidth + tagWidth + tagGap > availableWidth - padding) {
          if (currentTagLine.length > 0) {
            tagLines.push(currentTagLine);
            currentTagLine = [];
            currentLineWidth = padding;
          }
        }

        currentTagLine.push(tag);
        currentLineWidth += tagWidth + tagGap;
      }

      if (currentTagLine.length > 0) {
        tagLines.push(currentTagLine);
      }

      tooltipHeight +=
        tagLines.length * (this.theme.font.size + tagPadding * 2) + (tagLines.length - 1) * tagGap;
    }

    const tooltipWidth = Math.max(minTooltipWidth, Math.min(contentWidth, availableWidth));

    let tooltipX = x + (availableWidth - tooltipWidth) / 2;
    const viewportWidth = this.canvas.width / this.dpr;
    if (tooltipX < 0) {
      tooltipX = 4;
    } else if (tooltipX + tooltipWidth > viewportWidth) {
      tooltipX = viewportWidth - tooltipWidth - 4;
    }
    const tooltipY = y - tooltipHeight - this.theme.colors.tooltip.gap;

    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.tooltip.background;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
    this.ctx.fill();

    this.ctx.restore();

    this.ctx.fillStyle = this.theme.colors.tooltip.text;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "top";

    if (content.type === "text") {
      let textY = tooltipY + padding;
      for (const line of lines) {
        this.ctx.fillText(line, tooltipX + padding, textY);
        textY += lineHeight;
      }
    } else if (content.type === "tags") {
      let tagY = tooltipY + padding;
      const tagHeight = this.theme.font.size + tagPadding * 2;

      for (const tagLine of tagLines) {
        let tagX = tooltipX + padding;

        for (const tag of tagLine) {
          const tagWidth = this.ctx.measureText(tag.text).width + tagPadding * 2;

          this.ctx.fillStyle = tag.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0");
          this.ctx.beginPath();
          this.ctx.roundRect(tagX, tagY, tagWidth, tagHeight, tagRadius);
          this.ctx.fill();

          this.ctx.fillStyle = tag.color ?? this.theme.colors.cellText ?? "#333";
          this.ctx.textBaseline = "middle";
          const textX = tagX + (tagWidth - this.ctx.measureText(tag.text).width) / 2;
          this.ctx.fillText(tag.text, textX, tagY + tagHeight / 2);

          tagX += tagWidth + tagGap;
        }

        tagY += tagHeight + tagGap;
      }
    }
  }

  renderScrollbars(
    scrollLeft: number,
    scrollTop: number,
    maxScrollLeft: number,
    maxScrollTop: number,
    scrollbarState: ScrollbarState,
  ): void {
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;

    const scrollbarWidth = 10;
    const scrollbarMinSize = 30;

    if (maxScrollTop > 0) {
      const trackHeight = viewportHeight - headerHeight;
      const thumbHeight = Math.max(
        scrollbarMinSize,
        (viewportHeight / layoutInfo.totalHeight) * trackHeight,
      );
      const thumbY = headerHeight + (scrollTop / maxScrollTop) * (trackHeight - thumbHeight);
      const thumbX = viewportWidth - scrollbarWidth;

      const isHovered = scrollbarState.verticalHovered;
      const isDragging = scrollbarState.verticalDragging;

      let thumbColor = this.theme.colors.scrollbar.thumb;
      if (isDragging) {
        thumbColor = this.theme.colors.scrollbar.thumbActive;
      } else if (isHovered) {
        thumbColor = this.theme.colors.scrollbar.thumbHover;
      }

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = thumbColor;
      this.ctx.beginPath();
      this.ctx.roundRect(thumbX, thumbY, scrollbarWidth - 2, thumbHeight, 4);
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }

    if (maxScrollLeft > 0) {
      const trackWidth = viewportWidth;
      const thumbWidth = Math.max(
        scrollbarMinSize,
        (viewportWidth / layoutInfo.totalWidth) * trackWidth,
      );
      const thumbX = (scrollLeft / maxScrollLeft) * (trackWidth - thumbWidth);
      const thumbY = viewportHeight - scrollbarWidth;

      const isHovered = scrollbarState.horizontalHovered;
      const isDragging = scrollbarState.horizontalDragging;

      let thumbColor = this.theme.colors.scrollbar.thumb;
      if (isDragging) {
        thumbColor = this.theme.colors.scrollbar.thumbActive;
      } else if (isHovered) {
        thumbColor = this.theme.colors.scrollbar.thumbHover;
      }

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = thumbColor;
      this.ctx.beginPath();
      this.ctx.roundRect(thumbX, thumbY, thumbWidth, scrollbarWidth - 2, 4);
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }
  }

  renderWatermark(): void {
    if (!this.watermarkConfig) return;

    const enabled = this.watermarkConfig.enabled ?? true;
    if (!enabled) return;

    const content = this.watermarkConfig.content ?? "Watermark";
    if (!content) return;

    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;

    const fontSize = this.watermarkConfig.fontSize ?? 16;
    const fontFamily = this.watermarkConfig.fontFamily ?? this.theme.font.family;
    const color = this.watermarkConfig.color ?? "rgba(0, 0, 0, 0.15)";
    const rotation = this.watermarkConfig.rotation ?? -22;
    const gapX = this.watermarkConfig.gapX ?? 100;
    const gapY = this.watermarkConfig.gapY ?? 100;
    const opacity = this.watermarkConfig.opacity;

    this.ctx.save();

    if (opacity !== undefined) {
      this.ctx.globalAlpha = opacity;
    }

    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const radians = (rotation * Math.PI) / 180;

    const textWidth = this.ctx.measureText(content).width;
    const cellWidth = textWidth + gapX;
    const cellHeight = fontSize + gapY;

    const cols = Math.ceil(viewportWidth / cellWidth) + 2;
    const rows = Math.ceil(viewportHeight / cellHeight) + 2;

    for (let row = -1; row <= rows; row++) {
      for (let col = -1; col <= cols; col++) {
        const x = col * cellWidth + (row % 2 === 0 ? 0 : cellWidth / 2);
        const y = row * cellHeight;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(radians);
        this.ctx.fillText(content, 0, 0);
        this.ctx.restore();
      }
    }

    this.ctx.restore();
  }

  getScrollbarBounds(
    scrollLeft: number,
    scrollTop: number,
    maxScrollLeft: number,
    maxScrollTop: number,
  ): {
    vertical: { x: number; y: number; width: number; height: number } | null;
    horizontal: { x: number; y: number; width: number; height: number } | null;
  } {
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;

    const scrollbarWidth = 10;
    const scrollbarMinSize = 30;

    let vertical: { x: number; y: number; width: number; height: number } | null = null;
    let horizontal: { x: number; y: number; width: number; height: number } | null = null;

    if (maxScrollTop > 0) {
      const trackHeight = viewportHeight - headerHeight;
      const thumbHeight = Math.max(
        scrollbarMinSize,
        (viewportHeight / layoutInfo.totalHeight) * trackHeight,
      );
      const thumbY = headerHeight + (scrollTop / maxScrollTop) * (trackHeight - thumbHeight);
      const thumbX = viewportWidth - scrollbarWidth;

      vertical = {
        x: thumbX,
        y: thumbY,
        width: scrollbarWidth - 2,
        height: thumbHeight,
      };
    }

    if (maxScrollLeft > 0) {
      const trackWidth = viewportWidth;
      const thumbWidth = Math.max(
        scrollbarMinSize,
        (viewportWidth / layoutInfo.totalWidth) * trackWidth,
      );
      const thumbX = (scrollLeft / maxScrollLeft) * (trackWidth - thumbWidth);
      const thumbY = viewportHeight - scrollbarWidth;

      horizontal = {
        x: thumbX,
        y: thumbY,
        width: thumbWidth,
        height: scrollbarWidth - 2,
      };
    }

    return { vertical, horizontal };
  }

  renderFilterDropdown(filterDropdown: FilterDropdownState): void {
    const { x, y, width, options, scrollTop, hoveredIndex } = filterDropdown;
    const padding = 8;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const buttonHeight = 36;
    const dropdownHeight = visibleCount * itemHeight + buttonHeight;
    const listHeight = visibleCount * itemHeight;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.fill();

    this.ctx.restore();

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, listHeight);
    this.ctx.clip();

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.fillRect(x, y, width, listHeight);

    const checkboxSize = 14;
    const checkboxGap = 8;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const offsetY = -(scrollTop % itemHeight);

    for (let i = 0; i <= visibleCount + 1; i++) {
      const optionIndex = startIndex + i;
      if (optionIndex < 0 || optionIndex >= options.length) continue;

      const option = options[optionIndex];
      if (!option) continue;

      const itemY = y + i * itemHeight + offsetY;

      if (optionIndex === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      const checkboxX = x + padding;
      const checkboxY = itemY + (itemHeight - checkboxSize) / 2;

      this.ctx.strokeStyle = option.checked
        ? this.theme.colors.checkbox.checkedBg
        : this.theme.colors.checkbox.border;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
      this.ctx.stroke();

      if (option.checked) {
        this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
        this.ctx.beginPath();
        this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
        this.ctx.fill();

        this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(checkboxX + 3, checkboxY + 7);
        this.ctx.lineTo(checkboxX + 6, checkboxY + 10);
        this.ctx.lineTo(checkboxX + 11, checkboxY + 4);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      const textX = checkboxX + checkboxSize + checkboxGap;
      const maxTextWidth = width - padding * 2 - checkboxSize - checkboxGap;
      const text = truncateText(
        option.label,
        Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
      );
      this.ctx.fillText(text, textX, itemY + itemHeight / 2);
    }

    this.ctx.restore();

    const buttonY = y + listHeight;
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.fillRect(x, buttonY, width, buttonHeight);
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, buttonY);
    this.ctx.lineTo(x + width, buttonY);
    this.ctx.stroke();

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    const resetText = "重置";
    const confirmText = "确定";
    const resetWidth = this.ctx.measureText(resetText).width;
    const confirmWidth = this.ctx.measureText(confirmText).width;

    const resetX = x + padding;
    const confirmX = x + width - padding - confirmWidth;
    const textY = buttonY + buttonHeight / 2;

    this.ctx.fillStyle = this.theme.colors.placeholderText;
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(resetText, resetX, textY);

    this.ctx.fillStyle = this.theme.colors.linkColor;
    this.ctx.fillText(confirmText, confirmX, textY);

    if (options.length > maxVisibleItems) {
      const scrollbarWidth = 6;
      const totalHeight = options.length * itemHeight;
      const thumbHeight = Math.max(20, (listHeight / totalHeight) * listHeight);
      const maxThumbY = listHeight - thumbHeight;
      const thumbY = (scrollTop / (totalHeight - listHeight)) * maxThumbY;

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
      this.ctx.beginPath();
      this.ctx.roundRect(
        x + width - scrollbarWidth - 2,
        y + thumbY + 2,
        scrollbarWidth,
        thumbHeight,
        3,
      );
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }

    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.stroke();
  }

  renderDateDropdown(dateDropdown: DateDropdownState): void {
    const { x, y, width, currentYear, currentMonth, selectedDate, hoveredDate } = dateDropdown;

    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.fillRect(x, y, width, dropdownHeight);

    const monthNames = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ];
    const headerText = `${currentYear}年 ${monthNames[currentMonth]}`;

    this.ctx.fillStyle = this.theme.colors.dropdown.text;
    this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(headerText, x + width / 2, y + headerHeight / 2);

    const arrowSize = 6;
    const leftArrowX = x + 20;
    const rightArrowX = x + width - 20;
    const arrowY = y + headerHeight / 2;

    this.ctx.fillStyle = this.theme.colors.placeholderText;
    this.ctx.beginPath();
    this.ctx.moveTo(leftArrowX + arrowSize, arrowY - arrowSize);
    this.ctx.lineTo(leftArrowX - arrowSize, arrowY);
    this.ctx.lineTo(leftArrowX + arrowSize, arrowY + arrowSize);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(rightArrowX - arrowSize, arrowY - arrowSize);
    this.ctx.lineTo(rightArrowX + arrowSize, arrowY);
    this.ctx.lineTo(rightArrowX - arrowSize, arrowY + arrowSize);
    this.ctx.closePath();
    this.ctx.fill();

    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const dayWidth = (width - rowPadding * 2) / 7;

    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`;
    this.ctx.fillStyle = this.theme.colors.placeholderText;

    for (let i = 0; i < 7; i++) {
      const dayX = x + rowPadding + i * dayWidth + dayWidth / 2;
      const dayY = y + headerHeight + weekdayHeight / 2;
      this.ctx.fillText(weekdays[i]!, dayX, dayY);
    }

    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekday + day - 1;
      const row = Math.floor(index / 7);
      const col = index % 7;

      const cellX = x + rowPadding + col * dayWidth;
      const cellY = y + headerHeight + weekdayHeight + row * dayHeight;

      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.getTime() === today.getTime();
      const isSelected =
        selectedDate &&
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate();
      const isHovered =
        hoveredDate &&
        date.getFullYear() === hoveredDate.getFullYear() &&
        date.getMonth() === hoveredDate.getMonth() &&
        date.getDate() === hoveredDate.getDate();

      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
        this.ctx.fillStyle = "#ffffff";
      } else if (isHovered) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      } else if (isToday) {
        this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
        this.ctx.fillStyle = "#ffffff";
      } else {
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      }

      this.ctx.fillText(String(day), cellX + dayWidth / 2, cellY + dayHeight / 2);
    }

    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.stroke();

    this.ctx.restore();
  }

  renderContextMenu(contextMenu: ContextMenuState): void {
    const { x, y, hoveredIndex } = contextMenu;
    const menuWidth = 140;
    const itemHeight = 32;
    const menuItems = [
      { text: "上方添加行", icon: "+" },
      { text: "下方添加行", icon: "+" },
      { text: "删除行", icon: "-" },
    ];
    const menuHeight = menuItems.length * itemHeight;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(x, y, menuWidth, menuHeight, 6);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i]!;
      const itemY = y + i * itemHeight;

      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, menuWidth, itemHeight);
      }

      if (i === 2) {
        this.ctx.fillStyle = "#f56c6c";
      } else {
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      }

      this.ctx.textBaseline = "middle";
      this.ctx.fillText(item.text, x + 12, itemY + itemHeight / 2);
    }

    this.ctx.restore();
  }

  renderHeaderContextMenu(headerContextMenu: HeaderContextMenuState): void {
    const { x, y, hoveredIndex } = headerContextMenu;
    const menuWidth = 120;
    const itemHeight = 32;
    const menuItems = [{ text: "隐藏此列" }];
    const menuHeight = menuItems.length * itemHeight;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(x, y, menuWidth, menuHeight, 6);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i]!;
      const itemY = y + i * itemHeight;

      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, menuWidth, itemHeight);
      }

      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(item.text, x + 12, itemY + itemHeight / 2);
    }

    this.ctx.restore();
  }

  private renderColumnReorderIndicator(
    state: {
      dragColumnIndex: number;
      dragColumnKey: string;
      dragStartX: number;
      currentX: number;
      targetColumnIndex: number;
      isParentColumn?: boolean;
    },
    rows: Row[],
    visibleRange: VisibleRange,
    scrollTop: number,
  ): void {
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;
    const viewportHeight = this.canvas.height / this.dpr;

    const column = this.layoutManager.getColumnByKey(state.dragColumnKey);
    const dragColWidth = column ? this.layoutManager.getColumnWidth(column) : 100;

    const ghostX = state.currentX - dragColWidth / 2;

    this.ctx.save();
    this.ctx.globalAlpha = 0.7;

    this.ctx.fillStyle = this.theme.colors.headerBackground;
    this.ctx.fillRect(ghostX, 0, dragColWidth, viewportHeight);

    this.ctx.strokeStyle = this.theme.colors.button.primaryBg;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(ghostX, 0, dragColWidth, viewportHeight);
    this.ctx.setLineDash([]);

    if (state.isParentColumn && column && column.children && column.children.length > 0) {
      this.renderParentColumnGhost(column, ghostX, headerHeight);
      this.renderParentColumnRowsGhost(column, ghostX, headerHeight, rows, visibleRange, scrollTop);
    } else if (column) {
      this.renderLeafColumnGhost(column, ghostX, 0, headerHeight);
      this.renderLeafColumnRowsGhost(column, ghostX, headerHeight, rows, visibleRange, scrollTop);
    }

    this.ctx.restore();
  }

  private renderParentColumnGhost(column: Column, ghostX: number, headerHeight: number): void {
    const colDepth = column.depth ?? 0;
    const rowHeight = this.theme.row.headerHeight;
    const parentHeaderY = colDepth * rowHeight;
    const parentHeaderHeight = rowHeight;
    const totalWidth = this.layoutManager.getColumnWidth(column);

    this.ctx.fillStyle = this.theme.colors.button.primaryBg;
    this.ctx.fillRect(ghostX, parentHeaderY, totalWidth, parentHeaderHeight);

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(ghostX, parentHeaderY, totalWidth, parentHeaderHeight);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const text = column.title;
    const textWidth = this.ctx.measureText(text).width;
    const textX = ghostX + (totalWidth - textWidth) / 2;
    this.ctx.fillText(text, textX, parentHeaderY + parentHeaderHeight / 2);

    this.renderChildColumnsGhost(column, ghostX, colDepth + 1, headerHeight);
  }

  private renderChildColumnsGhost(
    column: Column,
    startX: number,
    depth: number,
    headerHeight: number,
  ): void {
    if (!column.children || column.children.length === 0) return;

    const rowHeight = this.theme.row.headerHeight;
    let currentX = startX;

    for (const child of column.children) {
      const childWidth = this.layoutManager.getColumnWidth(child);

      if (child.children && child.children.length > 0) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        const headerY = depth * rowHeight;
        const headerH = rowHeight;
        this.ctx.fillRect(currentX, headerY, childWidth, headerH);

        this.ctx.strokeStyle = this.theme.colors.cellBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(currentX, headerY, childWidth, headerH);

        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";
        const text = child.title;
        const textWidth = this.ctx.measureText(text).width;
        const textX = currentX + (childWidth - textWidth) / 2;
        this.ctx.fillText(text, textX, headerY + headerH / 2);

        this.renderChildColumnsGhost(child, currentX, depth + 1, headerHeight);
      } else {
        this.renderLeafColumnGhost(child, currentX, depth, headerHeight);
      }

      currentX += childWidth;
    }
  }

  private renderLeafColumnGhost(
    column: Column,
    ghostX: number,
    depth: number,
    headerHeight: number,
  ): void {
    const rowHeight = this.theme.row.headerHeight;
    const colWidth = this.layoutManager.getColumnWidth(column);
    const headerY = depth * rowHeight;
    const headerH = headerHeight - headerY;

    this.ctx.fillStyle = this.theme.colors.button.primaryBg;
    this.ctx.fillRect(ghostX, headerY, colWidth, headerH);

    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(ghostX, headerY, colWidth, headerH);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = `${this.theme.font.headerSize}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const text = column.title;
    const textWidth = this.ctx.measureText(text).width;
    const textX = ghostX + (colWidth - textWidth) / 2;
    this.ctx.fillText(text, textX, headerY + headerH / 2);
  }

  private isDescendantOfColumn(column: Column, ancestorKey: string): boolean {
    if (column.key === ancestorKey) {
      return true;
    }
    if (column.parentKey === ancestorKey) {
      return true;
    }
    if (column.parentKey) {
      const parent = this.layoutManager.getColumnByKey(column.parentKey);
      if (parent) {
        return this.isDescendantOfColumn(parent, ancestorKey);
      }
    }
    return false;
  }

  private renderLeafColumnRowsGhost(
    column: Column,
    ghostX: number,
    headerHeight: number,
    rows: Row[],
    visibleRange: VisibleRange,
    scrollTop: number,
  ): void {
    const colWidth = this.layoutManager.getColumnWidth(column);
    const { startRow, endRow } = visibleRange;

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;

      const absY = this.layoutManager.getRowOffset(rowIndex);
      const rowHeight = this.layoutManager.getRowHeightByIndex(rowIndex);
      const y = absY - scrollTop;

      if (y + rowHeight < headerHeight || y > this.canvas.height / this.dpr) {
        continue;
      }

      this.ctx.fillStyle = this.theme.colors.rowBackground;
      this.ctx.fillRect(ghostX, y, colWidth, rowHeight);

      this.ctx.strokeStyle = this.theme.colors.cellBorder;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(ghostX, y + rowHeight);
      this.ctx.lineTo(ghostX + colWidth, y + rowHeight);
      this.ctx.stroke();

      const value = row.data[getColumnField(column)];
      this.renderGhostCellValue(column, row, rowIndex, value, ghostX, y, colWidth, rowHeight);
    }
  }

  private renderParentColumnRowsGhost(
    column: Column,
    ghostX: number,
    headerHeight: number,
    rows: Row[],
    visibleRange: VisibleRange,
    scrollTop: number,
  ): void {
    if (!column.children || column.children.length === 0) return;

    let currentX = ghostX;
    for (const child of column.children) {
      const childWidth = this.layoutManager.getColumnWidth(child);

      if (child.children && child.children.length > 0) {
        this.renderParentColumnRowsGhost(
          child,
          currentX,
          headerHeight,
          rows,
          visibleRange,
          scrollTop,
        );
      } else {
        this.renderLeafColumnRowsGhost(
          child,
          currentX,
          headerHeight,
          rows,
          visibleRange,
          scrollTop,
        );
      }

      currentX += childWidth;
    }
  }

  private renderGhostCellValue(
    column: Column,
    row: Row,
    rowIndex: number,
    value: unknown,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const padding = 8;

    // 获取渲染结果
    let renderResult: RenderResult = {
      text: this.formatValue(value, column, row),
      type: column.type ?? "text",
    };

    if (column.render) {
      try {
        const customResult = column.render(value, row, column, rowIndex);
        if (customResult) {
          renderResult = { ...renderResult, ...customResult };
        }
      } catch (error) {
        console.error(`Error rendering ghost cell:`, error);
        renderResult = { text: "[Error]", type: "text" };
      }
    }

    // 计算禁用状态
    const isDisabled = resolveDisabled(column.disabled, row, column);

    // 使用统一的渲染方法
    this.renderCellContent(
      renderResult,
      x,
      y,
      width,
      height,
      padding,
      column.align,
      rowIndex,
      undefined,
      isDisabled,
    );
  }

  destroy(): void {
    this.isDestroyed = true;
    this.dirtyRegions = [];
    // 清理图片缓存，防止内存泄漏
    this.imageCache.clear();
    this.loadingImages.clear();
    this.failedImages.clear();
    this.imageLoadCallbacks.clear();
  }
}
