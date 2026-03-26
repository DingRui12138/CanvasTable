import {
  CellPosition,
  CellInfo,
  CellRange,
  InteractionState,
  ScrollState,
  SelectionConfig,
  EditingConfig,
  Column,
  Row,
  SortConfig,
  SortDirection,
  InputConfig,
  SelectConfig,
  DropdownState,
  TagsConfig,
  ScrollbarState,
  FilterConfig,
  FilterDropdownState,
  ButtonsDropdownState,
  ImageTooltipState,
  ImageEditorState,
  ContextMenuState,
  HeaderContextMenuState,
  ButtonHoverState,
  DateConfig,
  DateDropdownState,
  SwitchAnimationState,
  FixedType,
  ImageConfig,
  EditRenderResult,
} from "../types";
import { LayoutManager } from "./LayoutManager";
import { EventEmitter } from "./EventEmitter";
import {
  clamp,
  getCellDisplayText,
  getRenderResult,
  resolveDisabled,
  getColumnField,
} from "../utils";
import { TableEvents } from "../constants/events";

interface InteractionEvents {
  cellClick: [CellInfo, MouseEvent];
  cellDblClick: [CellInfo, MouseEvent];
  cellHover: [CellInfo | null, MouseEvent];
  headerHover: [string | undefined];
  rowClick: [number, MouseEvent];
  rowDblClick: [number, MouseEvent];
  selectionChange: [CellRange[]];
  editStart: [CellInfo, InputConfig?];
  selectEditStart: [CellInfo, SelectConfig?];
  editEnd: [CellInfo, unknown];
  scroll: [number, number];
  columnResize: [string, number];
  sortChange: [SortConfig[]];
  filterChange: [FilterConfig[]];
  expand: [number, boolean];
  checkboxChange: [CellInfo, boolean];
  radioChange: [CellInfo, unknown];
  switchChange: [CellInfo, boolean];
  buttonClick: [CellInfo, string | undefined];
  selectChange: [CellInfo, unknown];
  tagsChange: [CellInfo, string[], boolean];
  dropdownOpen: [];
  dropdownClose: [];
  dropdownHover: [];
  filterDropdownOpen: [];
  filterDropdownClose: [];
  contextMenuOpen: [];
  contextMenuClose: [];
  contextMenuHover: [];
  headerContextMenuOpen: [];
  headerContextMenuClose: [];
  headerContextMenuHover: [];
  columnHide: [string];
  columnShow: [string];
  switchAnimationUpdate: [];
  rowAddAbove: [number];
  rowAddBelow: [number];
  rowDelete: [number];
  columnReorder: [number, number];
  columnReorderDrag: [];
  columnSwap: [string, string]; // fromKey, toKey
  imageClick: [CellInfo, string, MouseEvent];
  progressChange: [CellInfo, number];
  [key: string]: unknown[];
}

export class InteractionManager {
  // 下拉菜单常量
  private static readonly DROPDOWN_ITEM_HEIGHT = 32;
  private static readonly DROPDOWN_MAX_VISIBLE = 8;

  // 图片编辑器常量
  private static readonly IMAGE_SIZE = 64;
  private static readonly IMAGE_PADDING = 8;
  private static readonly IMAGE_GAP = 8;
  private static readonly IMAGES_PER_ROW = 4;
  private static readonly IMAGE_UPLOAD_AREA_HEIGHT = 60;
  private static readonly IMAGE_MAX_ROWS = 3;

  private state: InteractionState;
  private scrollState: ScrollState;
  private scrollbarState: ScrollbarState;
  private layoutManager: LayoutManager;
  private eventEmitter: EventEmitter<InteractionEvents>;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private editingConfig: EditingConfig;
  private columns: Column[] = [];
  private rows: Row[] = [];
  private allRows: Row[] = [];
  private sortConfig: SortConfig[] = [];
  private filterConfig: FilterConfig[] = [];
  private expandColumnKey: string | null = null;
  private isDestroyed = false;

  private resizeColumnIndex: number = -1;
  private resizeStartX: number = 0;
  private resizeStartWidth: number = 0;

  // 用于检测双击，防止双击时触发 link 跳转
  private _lastClickTime: number = 0;
  private _lastClickCell: { rowIndex: number; columnIndex: number } | null = null;

  private getScrollbarBounds: () => {
    vertical: { x: number; y: number; width: number; height: number } | null;
    horizontal: { x: number; y: number; width: number; height: number } | null;
  } = () => ({ vertical: null, horizontal: null });

  constructor(
    canvas: HTMLCanvasElement,
    layoutManager: LayoutManager,
    eventEmitter: EventEmitter<InteractionEvents>,
    _selectionConfig: SelectionConfig,
    editingConfig: EditingConfig,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.layoutManager = layoutManager;
    this.eventEmitter = eventEmitter;
    this.editingConfig = editingConfig;

    this.state = {
      hoveredCell: null,
      selectedCells: [],
      editingCell: null,
      editingValue: null,
      isSelecting: false,
      selectionStart: null,
      isDragging: false,
      dragType: null,
      dragTarget: null,
      tooltip: null,
      dropdown: null,
      filterDropdown: null,
      dateDropdown: null,
      buttonsDropdown: null,
      imageTooltip: null,
      imageEditor: null,
      contextMenu: null,
      headerContextMenu: null,
      switchAnimations: new Map(),
      buttonHoverStates: new Map(),
      hoveredImageIndex: -1,
      hoveredButtonIndex: -1,
    };

    this.scrollState = {
      scrollLeft: 0,
      scrollTop: 0,
      maxScrollLeft: 0,
      maxScrollTop: 0,
      isScrolling: false,
    };

    this.scrollbarState = {
      verticalHovered: false,
      horizontalHovered: false,
      verticalDragging: false,
      horizontalDragging: false,
      dragStartY: 0,
      dragStartScrollTop: 0,
      dragStartX: 0,
      dragStartScrollLeft: 0,
    };

    this.bindEvents();
  }

  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  private getCellInfo(cell: CellPosition): CellInfo | null {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) return null;
    return {
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      row,
      column,
    };
  }

  /**
   * 计算单元格在视口中的 X 坐标
   */
  private getCellViewportX(cellPos: { x: number }, column: Column | undefined): number {
    return column?.fixed ? cellPos.x : cellPos.x - this.scrollState.scrollLeft;
  }

  /**
   * 验证单元格是否可编辑，返回列和行数据
   */
  private validateCellForEditing(cell: CellPosition): { column: Column; row: Row } | null {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column || column.editable === false) return null;
    const row = this.rows[cell.rowIndex];
    if (!row) return null;
    if (resolveDisabled(column.disabled, row, column)) return null;
    return { column, row };
  }

  /**
   * 获取规范化的选择范围
   */
  private getNormalizedRange(range: CellRange): {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
  } {
    return {
      minRow: Math.min(range.start.rowIndex, range.end.rowIndex),
      maxRow: Math.max(range.start.rowIndex, range.end.rowIndex),
      minCol: Math.min(range.start.columnIndex, range.end.columnIndex),
      maxCol: Math.max(range.start.columnIndex, range.end.columnIndex),
    };
  }

  private bindEvents(): void {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.addEventListener("dblclick", this.handleDblClick);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", this.handleContextMenu);
    this.canvas.addEventListener("dragover", this.handleDragOver);
    this.canvas.addEventListener("dragleave", this.handleDragLeave);
    this.canvas.addEventListener("drop", this.handleDrop);

    document.addEventListener("keydown", this.handleKeyDown);
  }

  private unbindEvents(): void {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.removeEventListener("dblclick", this.handleDblClick);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("contextmenu", this.handleContextMenu);
    this.canvas.removeEventListener("dragover", this.handleDragOver);
    this.canvas.removeEventListener("dragleave", this.handleDragLeave);
    this.canvas.removeEventListener("drop", this.handleDrop);

    document.removeEventListener("keydown", this.handleKeyDown);
  }

  private bindDocumentEvents(): void {
    document.addEventListener("mousemove", this.handleDocumentMouseMove);
    document.addEventListener("mouseup", this.handleDocumentMouseUp);
  }

  private unbindDocumentEvents(): void {
    document.removeEventListener("mousemove", this.handleDocumentMouseMove);
    document.removeEventListener("mouseup", this.handleDocumentMouseUp);
  }

  setGetScrollbarBounds(
    callback: () => {
      vertical: { x: number; y: number; width: number; height: number } | null;
      horizontal: { x: number; y: number; width: number; height: number } | null;
    },
  ): void {
    this.getScrollbarBounds = callback;
  }

  getScrollbarState(): ScrollbarState {
    return { ...this.scrollbarState };
  }

  private handleMouseDown = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    // 处理弹出层点击
    if (this.state.contextMenu) {
      const menuClick = this.handleContextMenuClick(e);
      if (menuClick) return;
      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
      return;
    }

    if (this.state.headerContextMenu) {
      const menuClick = this.handleHeaderContextMenuClick(e);
      if (menuClick) return;
      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
      return;
    }

    if (this.state.filterDropdown) {
      const filterClick = this.handleFilterDropdownClick(e);
      if (filterClick) return;
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
      return;
    }

    if (this.state.dateDropdown) {
      const dateClick = this.handleDateDropdownClick(e);
      if (dateClick) return;
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE);
      return;
    }

    if (this.state.dropdown) {
      const dropdownClick = this.handleDropdownClick(e);
      if (dropdownClick) return;
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
      return;
    }

    if (this.state.buttonsDropdown) {
      const dropdownClick = this.handleButtonsDropdownClick(e);
      if (dropdownClick) return;
      this.state.buttonsDropdown = null;
      return;
    }

    if (this.state.imageTooltip) {
      const dropdownClick = this.handleImageTooltipClick(e);
      if (dropdownClick) return;
      this.state.imageTooltip = null;
      // 不 return，继续处理后续点击逻辑
    }

    if (this.state.imageEditor) {
      const editorClick = this.handleImageEditorClick(e);
      if (editorClick) return;
      this.commitImageEditorChanges();
      return;
    }

    // 统一命中测试
    const hitResult = this.layoutManager.hitTest(viewportX, viewportY, this.getScrollbarBounds());

    switch (hitResult.region) {
      case "scrollbar-vertical":
        this.scrollbarState.verticalDragging = true;
        this.scrollbarState.dragStartY = e.clientY;
        this.scrollbarState.dragStartScrollTop = this.scrollState.scrollTop;
        this.canvas.style.cursor = "grabbing";
        this.bindDocumentEvents();
        return;

      case "scrollbar-horizontal":
        this.scrollbarState.horizontalDragging = true;
        this.scrollbarState.dragStartX = e.clientX;
        this.scrollbarState.dragStartScrollLeft = this.scrollState.scrollLeft;
        this.canvas.style.cursor = "grabbing";
        this.bindDocumentEvents();
        return;

      case "header":
        if (hitResult.isResizeHandle && hitResult.resizeColumnIndex !== undefined) {
          this.state.isDragging = true;
          this.state.dragType = "column-resize";
          this.resizeColumnIndex = hitResult.resizeColumnIndex;
          this.resizeStartX = e.clientX;
          this.resizeStartWidth = this.layoutManager.getColumnWidthByIndex(
            hitResult.resizeColumnIndex,
          );
          this.canvas.style.cursor = "col-resize";
          return;
        }
        if (hitResult.headerCell) {
          this.handleHeaderMouseDown(hitResult.headerCell.colIndex ?? -1, e);
        }
        return;

      case "cell":
        if (hitResult.cell && this.handleControlClick(hitResult.cell, e)) {
          return;
        }
        if (hitResult.cell) {
          if (e.shiftKey && this.state.selectedCells.length > 0) {
            this.handleRangeSelection(hitResult.cell);
          } else if (e.ctrlKey || e.metaKey) {
            this.handleToggleSelection(hitResult.cell);
          } else {
            this.handleSingleSelection(hitResult.cell);
            this.state.isSelecting = true;
            this.state.selectionStart = hitResult.cell;
          }
        }
        return;

      case "outside":
        return;
    }
  };

  private handleDropdownClick(e: MouseEvent): boolean {
    if (!this.state.dropdown) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, width, scrollTop, type, tagsConfig } = this.state.dropdown;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;

    if (type === "tags" && tagsConfig) {
      const visibleCount = Math.min(tagsConfig.options?.length ?? 0, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        const relativeY = viewportY - y + scrollTop;
        const itemIndex = Math.floor(relativeY / itemHeight);

        if (itemIndex >= 0 && itemIndex < (tagsConfig.options?.length ?? 0) && tagsConfig.options) {
          const option = tagsConfig.options[itemIndex]!;
          if (!option.disabled) {
            const isMultiple = tagsConfig.multiple !== false;

            if (isMultiple) {
              const selectedValues = [...(tagsConfig.selectedValues ?? [])];
              const optionValue = option.value ?? option.text;
              const existingIndex = selectedValues.indexOf(optionValue);

              if (existingIndex >= 0) {
                selectedValues.splice(existingIndex, 1);
              } else {
                selectedValues.push(optionValue);
              }

              // 自动更新 row.data
              const dropdownCell = this.state.dropdown.cell;
              const leafColumns = this.layoutManager.getLeafColumns();
              const dropdownColumn = leafColumns[dropdownCell.columnIndex];
              const dropdownRow = this.rows[dropdownCell.rowIndex];
              if (dropdownColumn && dropdownRow) {
                dropdownRow.data[getColumnField(dropdownColumn)] = selectedValues;
              }

              this.eventEmitter.emit(
                TableEvents.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell)!,
                selectedValues,
                true,
              );

              this.state.dropdown.tagsConfig = {
                ...tagsConfig,
                selectedValues,
              };
              this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
            } else {
              const optionValue = option.value ?? option.text;

              // 自动更新 row.data
              const dropdownCell = this.state.dropdown.cell;
              const leafColumns = this.layoutManager.getLeafColumns();
              const dropdownColumn = leafColumns[dropdownCell.columnIndex];
              const dropdownRow = this.rows[dropdownCell.rowIndex];
              if (dropdownColumn && dropdownRow) {
                dropdownRow.data[getColumnField(dropdownColumn)] = optionValue;
              }

              this.eventEmitter.emit(
                TableEvents.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell)!,
                [optionValue],
                false,
              );
              this.state.dropdown = null;
              this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
            }
          }
        }
        return true;
      }
      return false;
    }

    const { config } = this.state.dropdown;
    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const relativeY = viewportY - y + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < config.options.length) {
        const option = config.options[itemIndex]!;
        if (!option.disabled) {
          if (config.multiple) {
            const currentValues = Array.isArray(config.value) ? [...config.value] : [];
            const optionValue = option.value;
            const existingIndex = currentValues.indexOf(optionValue);

            if (existingIndex >= 0) {
              currentValues.splice(existingIndex, 1);
            } else {
              currentValues.push(optionValue);
            }

            // 自动更新 row.data
            const dropdownCell = this.state.dropdown.cell;
            const leafColumns = this.layoutManager.getLeafColumns();
            const dropdownColumn = leafColumns[dropdownCell.columnIndex];
            const dropdownRow = this.rows[dropdownCell.rowIndex];
            if (dropdownColumn && dropdownRow) {
              dropdownRow.data[getColumnField(dropdownColumn)] = currentValues;
            }

            this.eventEmitter.emit(
              TableEvents.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell)!,
              currentValues,
            );

            this.state.dropdown.config = {
              ...config,
              value: currentValues,
            };
            this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
          } else {
            // 自动更新 row.data
            const dropdownCell = this.state.dropdown.cell;
            const leafColumns = this.layoutManager.getLeafColumns();
            const dropdownColumn = leafColumns[dropdownCell.columnIndex];
            const dropdownRow = this.rows[dropdownCell.rowIndex];
            if (dropdownColumn && dropdownRow) {
              dropdownRow.data[getColumnField(dropdownColumn)] = option.value;
            }

            this.eventEmitter.emit(
              TableEvents.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell)!,
              option.value,
            );
            this.state.dropdown = null;
            this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
          }
        }
      }
      return true;
    }

    return false;
  }

  private handleDropdownHover(e: MouseEvent): void {
    if (!this.state.dropdown) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, width, scrollTop, type, tagsConfig } = this.state.dropdown;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;

    if (type === "tags" && tagsConfig) {
      const visibleCount = Math.min(tagsConfig.options?.length ?? 0, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        const relativeY = viewportY - y + scrollTop;
        const itemIndex = Math.floor(relativeY / itemHeight);

        if (itemIndex >= 0 && itemIndex < (tagsConfig.options?.length ?? 0)) {
          this.state.dropdown.hoveredIndex = itemIndex;
          this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
        }
      } else {
        this.state.dropdown.hoveredIndex = -1;
      }
      return;
    }

    const { config } = this.state.dropdown;
    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const relativeY = viewportY - y + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < config.options.length) {
        this.state.dropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
      }
    } else {
      this.state.dropdown.hoveredIndex = -1;
    }
  }

  private handleButtonsDropdownHover(e: MouseEvent): void {
    if (!this.state.buttonsDropdown) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, buttons } = this.state.buttonsDropdown;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;

    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    let maxWidth = 100;
    for (const btn of buttons) {
      const text = btn.text ?? "Button";
      const textWidth = this.ctx.measureText(text).width;
      maxWidth = Math.max(maxWidth, textWidth + 24);
    }

    if (
      viewportX >= x &&
      viewportX <= x + maxWidth &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < buttons.length) {
        this.state.buttonsDropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
      }
    } else {
      this.state.buttonsDropdown.hoveredIndex = -1;
    }
  }

  private handleImageTooltipHover(e: MouseEvent): boolean {
    if (!this.state.imageTooltip) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, images, scrollTop, maxRows } = this.state.imageTooltip;
    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const dropdownWidth =
      imagesPerRow * imgSize +
      (imagesPerRow - 1) * gap +
      padding * 2 +
      scrollbarGap +
      scrollbarWidth;
    const rowHeight = imgSize + gap;
    const visibleHeight = maxRows * rowHeight + padding * 2 - gap;

    const prevHoveredIndex = this.state.imageTooltip.hoveredIndex;

    // 检查是否在 dropdown 区域内
    if (
      viewportX >= x &&
      viewportX <= x + dropdownWidth &&
      viewportY >= y &&
      viewportY <= y + visibleHeight
    ) {
      // 精确检测：遍历可见图片，检查鼠标是否在图片区域内
      const totalRows = Math.ceil(images.length / imagesPerRow);
      const startRow = Math.floor(scrollTop / rowHeight);
      const endRow = Math.min(totalRows, startRow + maxRows + 1);

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < imagesPerRow; col++) {
          const index = row * imagesPerRow + col;
          if (index >= images.length) break;

          const imgX = x + padding + col * (imgSize + gap);
          const imgY = y + padding + row * rowHeight - scrollTop;

          // 检查鼠标是否在图片区域内
          if (
            viewportX >= imgX &&
            viewportX <= imgX + imgSize &&
            viewportY >= imgY &&
            viewportY <= imgY + imgSize
          ) {
            this.state.imageTooltip.hoveredIndex = index;
            // hover 状态改变时触发渲染
            if (prevHoveredIndex !== index) {
              this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_HOVER);
            }
            return true;
          }
        }
      }
      // 在 dropdown 内但不在任何图片上
      this.state.imageTooltip.hoveredIndex = -1;
      // hover 状态改变时触发渲染
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_HOVER);
      }
      return true;
    }
    this.state.imageTooltip.hoveredIndex = -1;
    // hover 状态改变时触发渲染
    if (prevHoveredIndex !== -1) {
      this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_HOVER);
    }
    return false;
  }

  private handleImageTooltipClick(e: MouseEvent): boolean {
    if (!this.state.imageTooltip) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, images, cell, scrollTop, maxRows } = this.state.imageTooltip;
    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const dropdownWidth =
      imagesPerRow * imgSize +
      (imagesPerRow - 1) * gap +
      padding * 2 +
      scrollbarGap +
      scrollbarWidth;
    const rowHeight = imgSize + gap;
    const visibleHeight = maxRows * rowHeight + padding * 2 - gap;

    // 点击在 dropdown 外，返回 false 让调用者继续处理
    if (
      viewportX < x ||
      viewportX > x + dropdownWidth ||
      viewportY < y ||
      viewportY > y + visibleHeight
    ) {
      return false;
    }

    // 重新计算点击的图片索引
    const relativeX = viewportX - x - padding;
    const relativeY = viewportY - y - padding + scrollTop;
    const col = Math.floor(relativeX / (imgSize + gap));
    const row = Math.floor(relativeY / rowHeight);

    if (col >= 0 && col < imagesPerRow && row >= 0) {
      const index = row * imagesPerRow + col;
      if (index >= 0 && index < images.length) {
        const imageSrc = images[index];
        if (imageSrc) {
          this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell)!, imageSrc, e);
        }
      }
    }
    return true;
  }

  private handleImageEditorHover(e: MouseEvent): boolean {
    if (!this.state.imageEditor) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, images, pendingImages, scrollTop, maxRows } = this.state.imageEditor;
    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    const prevHoveredIndex = this.state.imageEditor.hoveredIndex;

    // 在编辑器外
    if (
      viewportX < x ||
      viewportX > x + editorWidth ||
      viewportY < y ||
      viewportY > y + editorHeight
    ) {
      this.state.imageEditor.hoveredIndex = -1;
      // hover 状态改变时触发渲染
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
      }
      return false;
    }

    // 在上传区域
    if (viewportY >= y && viewportY <= y + uploadAreaHeight) {
      this.state.imageEditor.hoveredIndex = -1;
      // hover 状态改变时触发渲染
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
      }
      return true;
    }

    // 在图片区域
    const imagesY = y + uploadAreaHeight;
    const totalImages = images.length + pendingImages.length;

    for (let row = 0; row < maxRows + 1; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= totalImages) break;

        const imgX = x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - scrollTop;

        if (
          viewportX >= imgX &&
          viewportX <= imgX + imgSize &&
          viewportY >= imgY &&
          viewportY <= imgY + imgSize
        ) {
          this.state.imageEditor.hoveredIndex = index;
          // hover 状态改变时触发渲染
          if (prevHoveredIndex !== index) {
            this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
          }
          return true;
        }
      }
    }

    this.state.imageEditor.hoveredIndex = -1;
    // hover 状态改变时触发渲染
    if (prevHoveredIndex !== -1) {
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
    }
    return true;
  }

  private handleImageEditorClick(e: MouseEvent): boolean {
    if (!this.state.imageEditor) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, images, cell, scrollTop, maxRows } = this.state.imageEditor;
    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    // 点击在编辑器外，关闭编辑器
    if (
      viewportX < x ||
      viewportX > x + editorWidth ||
      viewportY < y ||
      viewportY > y + editorHeight
    ) {
      // 保存更改并关闭
      this.commitImageEditorChanges();
      return true;
    }

    // 点击在上传区域（与 handleImageEditorMouseMove 保持一致的范围）
    if (viewportY >= y && viewportY <= y + uploadAreaHeight) {
      this.triggerFileInput();
      return true;
    }

    // 计算点击位置对应的图片索引
    const imagesY = y + uploadAreaHeight;
    const totalImages = images.length + (this.state.imageEditor.pendingImages?.length ?? 0);

    for (let row = 0; row < maxRows + 1; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= totalImages) break;

        const imgX = x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - scrollTop;

        if (
          viewportX >= imgX &&
          viewportX <= imgX + imgSize &&
          viewportY >= imgY &&
          viewportY <= imgY + imgSize
        ) {
          // 点击在图片上 - 删除
          if (index < images.length) {
            const deletedImage = images[index];
            images.splice(index, 1);
            this.state.imageEditor.images = [...images];
            this.eventEmitter.emit(
              TableEvents.IMAGE_DELETE,
              this.getCellInfo(cell)!,
              deletedImage,
              index,
            );
          }
          return true;
        }
      }
    }

    return true;
  }

  private triggerFileInput(): void {
    if (!this.state.imageEditor) return;

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[this.state.imageEditor.cell.columnIndex];
    if (!column) return;

    const row = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!row) return;

    // 获取图片配置
    const renderResult = column.render
      ? column.render(
          row.data[getColumnField(column)],
          row,
          column,
          this.state.imageEditor.cell.rowIndex,
        )
      : { image: row.data[getColumnField(column)] as ImageConfig };
    const imageConfig = renderResult.image ?? {};

    const input = document.createElement("input");
    input.type = "file";
    input.accept = imageConfig.accept ?? "image/*";
    // 单图模式下禁用多选
    input.multiple = !this.state.imageEditor.isSingleImage && imageConfig.multiple !== false;

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      await this.handleFileUpload(Array.from(files));
    };

    input.click();
  }

  private async handleFileUpload(files: File[]): Promise<void> {
    if (!this.state.imageEditor) return;

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[this.state.imageEditor.cell.columnIndex];
    if (!column) return;

    // 获取上传配置
    const row = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!row) return;

    // 获取图片配置
    const renderResult = column.render
      ? column.render(
          row.data[getColumnField(column)],
          row,
          column,
          this.state.imageEditor.cell.rowIndex,
        )
      : { image: row.data[getColumnField(column)] as ImageConfig };
    const imageConfig = renderResult.image ?? {};

    const onUpload = imageConfig.onUpload;
    const maxCount = imageConfig.maxCount;
    const isSingleImage = this.state.imageEditor.isSingleImage;

    // 检查数量限制
    // 单图模式下只允许上传一张，且会替换当前图片
    const currentCount =
      this.state.imageEditor.images.length + this.state.imageEditor.pendingImages.length;
    let remainingSlots: number;
    if (isSingleImage) {
      // 单图模式：清空当前图片，只接受一张新图片
      remainingSlots = 1;
      this.state.imageEditor.images = [];
    } else {
      remainingSlots = maxCount !== undefined ? maxCount - currentCount : files.length;
    }
    const filesToUpload = files.slice(0, remainingSlots);

    // 添加预览
    const pendingImages: Array<{ file: File; preview: string }> = [];
    for (const file of filesToUpload) {
      const preview = await this.readFileAsDataURL(file);
      pendingImages.push({ file, preview });
    }

    this.state.imageEditor.pendingImages = [
      ...this.state.imageEditor.pendingImages,
      ...pendingImages,
    ];
    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);

    // 触发上传
    if (onUpload) {
      for (const pending of pendingImages) {
        try {
          const url = await onUpload(pending.file);
          // 上传成功，从 pending 移动到 images
          const index = this.state.imageEditor.pendingImages.findIndex(
            (p) => p.preview === pending.preview,
          );
          if (index >= 0) {
            this.state.imageEditor.pendingImages.splice(index, 1);
            this.state.imageEditor.images = [...this.state.imageEditor.images, url];
            this.eventEmitter.emit(
              TableEvents.IMAGE_UPLOAD,
              this.getCellInfo(this.state.imageEditor.cell)!,
              url,
            );
          }
        } catch (error) {
          console.error("Upload failed:", error);
          // 上传失败，从 pending 中移除
          const index = this.state.imageEditor.pendingImages.findIndex(
            (p) => p.preview === pending.preview,
          );
          if (index >= 0) {
            this.state.imageEditor.pendingImages.splice(index, 1);
          }
        }
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
      }
    } else {
      // 没有上传函数，直接使用预览 URL
      for (const pending of pendingImages) {
        const index = this.state.imageEditor.pendingImages.findIndex(
          (p) => p.preview === pending.preview,
        );
        if (index >= 0) {
          this.state.imageEditor.pendingImages.splice(index, 1);
          this.state.imageEditor.images = [...this.state.imageEditor.images, pending.preview];
          this.eventEmitter.emit(
            TableEvents.IMAGE_UPLOAD,
            this.getCellInfo(this.state.imageEditor.cell)!,
            pending.preview,
          );
        }
      }
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    }
  }

  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private commitImageEditorChanges(): void {
    if (!this.state.imageEditor) return;

    const { cell, images, isSingleImage } = this.state.imageEditor;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (column && row) {
      const originalValue = row.data[getColumnField(column)];
      let newValue: unknown;

      if (isSingleImage) {
        // 单图模式：保存为 src
        const newSrc = images[0] ?? null;

        if (typeof originalValue === "string") {
          // 原始数据是字符串，保持字符串格式
          newValue = newSrc;
        } else if (Array.isArray(originalValue)) {
          // 原始是数组，转为对象
          newValue = { src: newSrc };
        } else if (originalValue && typeof originalValue === "object") {
          // 原始是对象，更新 src
          newValue = {
            ...(originalValue as Record<string, unknown>),
            src: newSrc,
          };
        } else {
          // 原始是 null/undefined/其他，保存为字符串
          newValue = newSrc;
        }
      } else {
        // 多图模式：保存为 images 数组
        if (Array.isArray(originalValue)) {
          // 原始数据是数组，直接替换
          newValue = images;
        } else if (originalValue && typeof originalValue === "object") {
          // 原始数据是对象，合并 images 属性
          newValue = {
            ...(originalValue as Record<string, unknown>),
            images,
          };
        } else {
          // 原始数据是其他类型，创建新数组
          newValue = images;
        }
      }

      // 更新数据
      this.eventEmitter.emit(TableEvents.EDIT_END, this.getCellInfo(cell)!, newValue);
    }

    this.state.imageEditor = null;
    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_CLOSE);
  }

  private handleButtonsDropdownClick(e: MouseEvent): boolean {
    if (!this.state.buttonsDropdown) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, buttons, cell } = this.state.buttonsDropdown;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;

    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    let maxWidth = 100;
    for (const btn of buttons) {
      const text = btn.text ?? "Button";
      const textWidth = this.ctx.measureText(text).width;
      maxWidth = Math.max(maxWidth, textWidth + 24);
    }

    if (
      viewportX >= x &&
      viewportX <= x + maxWidth &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < buttons.length) {
        const btn = buttons[itemIndex]!;
        this.eventEmitter.emit(TableEvents.BUTTON_CLICK, this.getCellInfo(cell)!, btn.actionKey);
        this.state.buttonsDropdown = null;
        return true;
      }
    }

    this.state.buttonsDropdown = null;
    return true;
  }

  private handleFilterDropdownClick(e: MouseEvent): boolean {
    if (!this.state.filterDropdown) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, width, options, scrollTop } = this.state.filterDropdown;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const buttonHeight = 36;
    const listHeight = visibleCount * itemHeight;
    const dropdownHeight = listHeight + buttonHeight;
    const padding = 8;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      if (options.length > maxVisibleItems) {
        const scrollbarWidth = 6;
        const totalHeight = options.length * itemHeight;
        const thumbHeight = Math.max(20, (listHeight / totalHeight) * listHeight);
        const maxThumbY = listHeight - thumbHeight;
        const thumbY = (scrollTop / (totalHeight - listHeight)) * maxThumbY;
        const scrollbarX = x + width - scrollbarWidth - 2;

        if (
          viewportX >= scrollbarX &&
          viewportX <= scrollbarX + scrollbarWidth &&
          viewportY >= y + thumbY &&
          viewportY <= y + thumbY + thumbHeight
        ) {
          this.state.filterDropdown.isScrollbarDragging = true;
          this.state.filterDropdown.scrollbarDragStartY = e.clientY;
          this.state.filterDropdown.scrollbarDragStartScrollTop = scrollTop;
          this.bindDocumentEvents();
          return true;
        }
      }

      const buttonY = y + listHeight;

      if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
        const fontSize = 14;
        this.ctx.font = `${fontSize}px sans-serif`;
        const resetText = "重置";
        const confirmText = "确定";
        const resetWidth = this.ctx.measureText(resetText).width;
        const confirmWidth = this.ctx.measureText(confirmText).width;

        const resetX = x + padding;
        const confirmX = x + width - padding - confirmWidth;

        if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
          this.clearFilter();
          return true;
        }

        if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
          this.applyFilter();
          return true;
        }
      }

      const relativeY = viewportY - y + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < options.length) {
        options[itemIndex]!.checked = !options[itemIndex]!.checked;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      }
      return true;
    }

    return false;
  }

  private handleFilterDropdownHover(e: MouseEvent): void {
    if (!this.state.filterDropdown) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, width, options, scrollTop } = this.state.filterDropdown;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const listHeight = visibleCount * itemHeight;

    if (options.length > maxVisibleItems) {
      const scrollbarWidth = 6;
      const totalHeight = options.length * itemHeight;
      const thumbHeight = Math.max(20, (listHeight / totalHeight) * listHeight);
      const maxThumbY = listHeight - thumbHeight;
      const thumbY = (scrollTop / (totalHeight - listHeight)) * maxThumbY;
      const scrollbarX = x + width - scrollbarWidth - 2;

      if (
        viewportX >= scrollbarX &&
        viewportX <= scrollbarX + scrollbarWidth &&
        viewportY >= y + thumbY &&
        viewportY <= y + thumbY + thumbHeight
      ) {
        this.canvas.style.cursor = "grab";
        return;
      }
    }

    if (viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + listHeight) {
      const relativeY = viewportY - y + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < options.length) {
        this.state.filterDropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      }
    } else {
      this.state.filterDropdown.hoveredIndex = -1;
    }
  }

  private handleDateDropdownClick(e: MouseEvent): boolean {
    if (!this.state.dateDropdown) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, width, currentYear, currentMonth } = this.state.dateDropdown;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const arrowSize = 6;
      const leftArrowX = x + 20;
      const rightArrowX = x + width - 20;
      const arrowY = y + headerHeight / 2;

      if (viewportY >= y && viewportY <= y + headerHeight) {
        if (viewportX >= leftArrowX - arrowSize - 5 && viewportX <= leftArrowX + arrowSize + 5) {
          if (currentMonth === 0) {
            this.state.dateDropdown.currentYear = currentYear - 1;
            this.state.dateDropdown.currentMonth = 11;
          } else {
            this.state.dateDropdown.currentMonth = currentMonth - 1;
          }
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
          return true;
        }

        if (viewportX >= rightArrowX - arrowSize - 5 && viewportX <= rightArrowX + arrowSize + 5) {
          if (currentMonth === 11) {
            this.state.dateDropdown.currentYear = currentYear + 1;
            this.state.dateDropdown.currentMonth = 0;
          } else {
            this.state.dateDropdown.currentMonth = currentMonth + 1;
          }
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
          return true;
        }
      }

      const dayWidth = (width - rowPadding * 2) / 7;
      const firstDay = new Date(currentYear, currentMonth, 1);
      const startWeekday = firstDay.getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const index = startWeekday + day - 1;
        const row = Math.floor(index / 7);
        const col = index % 7;

        const cellX = x + rowPadding + col * dayWidth;
        const cellY = y + headerHeight + weekdayHeight + row * dayHeight;

        if (
          viewportX >= cellX &&
          viewportX <= cellX + dayWidth &&
          viewportY >= cellY &&
          viewportY <= cellY + dayHeight
        ) {
          const selectedDate = new Date(currentYear, currentMonth, day);
          const formattedDate = this.formatDate(selectedDate);

          const cell = this.state.dateDropdown.cell;
          const leafColumns = this.layoutManager.getLeafColumns();
          const column = leafColumns[cell.columnIndex];
          const rows = this.rows;
          const row = rows[cell.rowIndex];

          if (column && row) {
            row.data[getColumnField(column)] = formattedDate;
          }

          this.state.dateDropdown = null;
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE);
          this.eventEmitter.emit(TableEvents.DATE_SELECT, this.getCellInfo(cell)!, formattedDate);
          return true;
        }
      }

      return true;
    }

    return false;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private handleDateDropdownHover(e: MouseEvent): void {
    if (!this.state.dateDropdown) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const {
      x,
      y,
      width,
      currentYear,
      currentMonth,
      hoveredDate: prevHoveredDate,
    } = this.state.dateDropdown;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;

    let newHoveredDate: Date | null = null;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const dayWidth = (width - rowPadding * 2) / 7;
      const firstDay = new Date(currentYear, currentMonth, 1);
      const startWeekday = firstDay.getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const index = startWeekday + day - 1;
        const row = Math.floor(index / 7);
        const col = index % 7;

        const cellX = x + rowPadding + col * dayWidth;
        const cellY = y + headerHeight + weekdayHeight + row * dayHeight;

        if (
          viewportX >= cellX &&
          viewportX <= cellX + dayWidth &&
          viewportY >= cellY &&
          viewportY <= cellY + dayHeight
        ) {
          newHoveredDate = new Date(currentYear, currentMonth, day);
          break;
        }
      }
    }

    const prevTime = prevHoveredDate ? prevHoveredDate.getTime() : null;
    const newTime = newHoveredDate ? newHoveredDate.getTime() : null;

    if (prevTime !== newTime) {
      this.state.dateDropdown.hoveredDate = newHoveredDate;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_HOVER);
    }
  }

  private handleDragOver = (e: DragEvent): void => {
    e.preventDefault();

    if (!this.state.imageEditor) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, maxRows } = this.state.imageEditor;
    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    // 在编辑器区域内
    if (
      viewportX >= x &&
      viewportX <= x + editorWidth &&
      viewportY >= y &&
      viewportY <= y + editorHeight
    ) {
      this.state.imageEditor.isDragging = true;
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    }
  };

  private handleDragLeave = (e: DragEvent): void => {
    if (!this.state.imageEditor) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, maxRows } = this.state.imageEditor;
    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    // 离开编辑器区域
    if (
      viewportX < x ||
      viewportX > x + editorWidth ||
      viewportY < y ||
      viewportY > y + editorHeight
    ) {
      this.state.imageEditor.isDragging = false;
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    }
  };

  private handleDrop = async (e: DragEvent): Promise<void> => {
    e.preventDefault();

    if (!this.state.imageEditor) return;

    this.state.imageEditor.isDragging = false;

    const files = Array.from(e.dataTransfer?.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length > 0) {
      await this.handleFileUpload(files);
    }

    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    if (this.state.contextMenu) {
      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
    }

    if (this.state.headerContextMenu) {
      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
    }

    if (this.state.dropdown) {
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
    }

    if (this.state.filterDropdown) {
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
    }

    if (this.state.dateDropdown) {
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE);
    }

    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;

    // 检查是否在表头区域
    if (viewportY <= headerHeight) {
      // 表头右键菜单 - 使用 getHeaderCellAtPosition 获取正确层级的列
      const headerCell = this.layoutManager.getHeaderCellAtPosition(viewportX, viewportY);

      if (headerCell) {
        const column = headerCell.column;

        // 检查列是否允许隐藏
        if (column.hideable === false) return;

        const canvasRect = this.canvas.getBoundingClientRect();
        const menuWidth = 120;
        const menuHeight = 32;

        let menuX = viewportX;
        let menuY = viewportY;

        if (menuX + menuWidth > canvasRect.width) {
          menuX = canvasRect.width - menuWidth - 8;
        }
        if (menuX < 0) {
          menuX = 8;
        }
        if (menuY + menuHeight > canvasRect.height) {
          menuY = canvasRect.height - menuHeight - 8;
        }

        this.state.headerContextMenu = {
          x: menuX,
          y: menuY,
          columnKey: column.key,
          columnIndex: headerCell.colIndex,
          hoveredIndex: -1,
        };

        this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_OPEN);
        return;
      }
      return;
    }

    // 单元格右键菜单
    const x = viewportX + this.scrollState.scrollLeft;
    const y = viewportY + this.scrollState.scrollTop;
    const cell = this.layoutManager.getCellAtPosition(x, y, this.scrollState.scrollTop);

    if (!cell || cell.rowIndex < 0) return;

    const canvasRect = this.canvas.getBoundingClientRect();
    const menuWidth = 140;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const menuItems = 3;
    const menuHeight = menuItems * itemHeight;

    let menuX = viewportX;
    let menuY = viewportY;

    if (menuX + menuWidth > canvasRect.width) {
      menuX = canvasRect.width - menuWidth - 8;
    }
    if (menuX < 0) {
      menuX = 8;
    }

    if (menuY + menuHeight > canvasRect.height) {
      menuY = canvasRect.height - menuHeight - 8;
    }
    if (menuY < 0) {
      menuY = 8;
    }

    this.state.contextMenu = {
      x: menuX,
      y: menuY,
      rowIndex: cell.rowIndex,
      hoveredIndex: -1,
    };

    this.eventEmitter.emit(TableEvents.CONTEXT_MENU_OPEN);
  };

  private handleContextMenuClick(e: MouseEvent): boolean {
    if (!this.state.contextMenu) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, rowIndex } = this.state.contextMenu;
    const menuWidth = 140;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const menuItems = 3;
    const menuHeight = menuItems * itemHeight;

    if (
      viewportX >= x &&
      viewportX <= x + menuWidth &&
      viewportY >= y &&
      viewportY <= y + menuHeight
    ) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex === 0) {
        this.eventEmitter.emit(TableEvents.ROW_ADD_ABOVE, rowIndex);
      } else if (itemIndex === 1) {
        this.eventEmitter.emit(TableEvents.ROW_ADD_BELOW, rowIndex);
      } else if (itemIndex === 2) {
        this.eventEmitter.emit(TableEvents.ROW_DELETE, rowIndex);
      }

      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
      return true;
    }

    return false;
  }

  private handleContextMenuHover(e: MouseEvent): void {
    if (!this.state.contextMenu) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, hoveredIndex: prevHoveredIndex } = this.state.contextMenu;
    const menuWidth = 140;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const menuItems = 3;
    const menuHeight = menuItems * itemHeight;

    let newHoveredIndex = -1;

    if (
      viewportX >= x &&
      viewportX <= x + menuWidth &&
      viewportY >= y &&
      viewportY <= y + menuHeight
    ) {
      const relativeY = viewportY - y;
      newHoveredIndex = Math.floor(relativeY / itemHeight);
    }

    if (newHoveredIndex !== prevHoveredIndex) {
      this.state.contextMenu.hoveredIndex = newHoveredIndex;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_HOVER);
    }
  }

  getContextMenu(): ContextMenuState | null {
    return this.state.contextMenu;
  }

  getHeaderContextMenu(): HeaderContextMenuState | null {
    return this.state.headerContextMenu;
  }

  private handleHeaderContextMenuClick(e: MouseEvent): boolean {
    if (!this.state.headerContextMenu) return false;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, columnKey } = this.state.headerContextMenu;
    const menuWidth = 120;
    const menuHeight = 32;

    if (
      viewportX >= x &&
      viewportX <= x + menuWidth &&
      viewportY >= y &&
      viewportY <= y + menuHeight
    ) {
      // 隐藏此列
      this.eventEmitter.emit(TableEvents.COLUMN_HIDE, columnKey);

      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
      return true;
    }

    return false;
  }

  private handleHeaderContextMenuHover(e: MouseEvent): void {
    if (!this.state.headerContextMenu) return;

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const { x, y, hoveredIndex: prevHoveredIndex } = this.state.headerContextMenu;
    const menuWidth = 120;
    const menuHeight = 32;

    let newHoveredIndex = -1;

    if (
      viewportX >= x &&
      viewportX <= x + menuWidth &&
      viewportY >= y &&
      viewportY <= y + menuHeight
    ) {
      newHoveredIndex = 0;
    }

    if (newHoveredIndex !== prevHoveredIndex) {
      this.state.headerContextMenu.hoveredIndex = newHoveredIndex;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_HOVER);
    }
  }

  private handleDocumentMouseMove = (e: MouseEvent): void => {
    if (this.state.filterDropdown?.isScrollbarDragging) {
      const { options, scrollbarDragStartY, scrollbarDragStartScrollTop } =
        this.state.filterDropdown;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
      const visibleCount = Math.min(options.length, maxVisibleItems);
      const listHeight = visibleCount * itemHeight;
      const totalHeight = options.length * itemHeight;
      const thumbHeight = Math.max(20, (listHeight / totalHeight) * listHeight);
      const maxThumbY = listHeight - thumbHeight;

      const deltaY = e.clientY - (scrollbarDragStartY ?? 0);
      const scrollRatio = deltaY / maxThumbY;
      const maxScrollTop = totalHeight - listHeight;
      const newScrollTop = (scrollbarDragStartScrollTop ?? 0) + scrollRatio * maxScrollTop;

      this.state.filterDropdown.scrollTop = clamp(newScrollTop, 0, maxScrollTop);
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      return;
    }

    if (this.scrollbarState.verticalDragging) {
      const layoutInfo = this.layoutManager.getLayoutInfo();
      const headerHeight = layoutInfo.headerHeight;
      const viewportHeight = this.canvas.height / (window.devicePixelRatio || 1);
      const trackHeight = viewportHeight - headerHeight;
      const thumbHeight = Math.max(30, (viewportHeight / layoutInfo.totalHeight) * trackHeight);
      const maxThumbY = trackHeight - thumbHeight;

      const deltaY = e.clientY - this.scrollbarState.dragStartY;
      const scrollRatio = deltaY / maxThumbY;
      const newScrollTop =
        this.scrollbarState.dragStartScrollTop + scrollRatio * this.scrollState.maxScrollTop;

      this.scrollState.scrollTop = clamp(newScrollTop, 0, this.scrollState.maxScrollTop);
      this.eventEmitter.emit(
        TableEvents.SCROLL,
        this.scrollState.scrollLeft,
        this.scrollState.scrollTop,
      );
      return;
    }

    if (this.scrollbarState.horizontalDragging) {
      const layoutInfo = this.layoutManager.getLayoutInfo();
      const viewportWidth = this.canvas.width / (window.devicePixelRatio || 1);
      const thumbWidth = Math.max(30, (viewportWidth / layoutInfo.totalWidth) * viewportWidth);
      const maxThumbX = viewportWidth - thumbWidth;

      const deltaX = e.clientX - this.scrollbarState.dragStartX;
      const scrollRatio = deltaX / maxThumbX;
      const newScrollLeft =
        this.scrollbarState.dragStartScrollLeft + scrollRatio * this.scrollState.maxScrollLeft;

      this.scrollState.scrollLeft = clamp(newScrollLeft, 0, this.scrollState.maxScrollLeft);
      this.eventEmitter.emit(
        TableEvents.SCROLL,
        this.scrollState.scrollLeft,
        this.scrollState.scrollTop,
      );
      return;
    }
  };

  private handleDocumentMouseUp = (): void => {
    if (this.state.filterDropdown?.isScrollbarDragging) {
      this.state.filterDropdown.isScrollbarDragging = false;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      return;
    }

    if (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging) {
      this.scrollbarState.verticalDragging = false;
      this.scrollbarState.horizontalDragging = false;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    if (this.scrollbarState.verticalDragging || this.scrollbarState.horizontalDragging) {
      return;
    }

    if (this.state.contextMenu) {
      this.handleContextMenuHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.headerContextMenu) {
      this.handleHeaderContextMenuHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.dropdown) {
      this.handleDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.buttonsDropdown) {
      this.handleButtonsDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.imageTooltip) {
      const inDropdown = this.handleImageTooltipHover(e);
      if (inDropdown) {
        this.canvas.style.cursor = "pointer";
        return;
      }
      // 鼠标不在 dropdown 区域内，关闭 dropdown
      this.state.imageTooltip = null;
      // 继续处理其他事件
    }

    if (this.state.imageEditor) {
      const inEditor = this.handleImageEditorHover(e);
      if (inEditor) {
        // 只在上传区域或图片上显示 pointer cursor
        const { y, hoveredIndex } = this.state.imageEditor;
        const uploadAreaHeight = 60;
        const viewportY = e.clientY - this.canvas.getBoundingClientRect().top;
        const inUploadArea = viewportY >= y && viewportY <= y + uploadAreaHeight;
        const onImage = hoveredIndex >= 0;

        this.canvas.style.cursor = inUploadArea || onImage ? "pointer" : "default";
        return;
      }
      // 鼠标移出编辑器，但不关闭
    }

    if (this.state.filterDropdown) {
      this.handleFilterDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.dateDropdown) {
      this.handleDateDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.isDragging && this.state.dragType === "column-resize") {
      const column = this.layoutManager.getLeafColumn(this.resizeColumnIndex);
      if (column) {
        let deltaX = e.clientX - this.resizeStartX;

        if (column.fixed === "right") {
          deltaX = -deltaX;
        }

        const newWidth = Math.max(50, this.resizeStartWidth + deltaX);
        this.layoutManager.setColumnWidth(column.key, newWidth);
        this.eventEmitter.emit(TableEvents.COLUMN_RESIZE, column.key, newWidth);
      }
      return;
    }

    if (this.state.columnReorderState && !this.state.isDragging) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const dragDistance = Math.abs(viewportX - this.state.columnReorderState.dragStartX);

      if (dragDistance > 5) {
        this.state.isDragging = true;
        this.state.dragType = "column-reorder";
        this.bindDocumentEvents();
      }
    }

    if (
      this.state.isDragging &&
      this.state.dragType === "column-reorder" &&
      this.state.columnReorderState
    ) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      this.state.columnReorderState.currentX = viewportX;

      const reorderState = this.state.columnReorderState;
      const siblingColumns = reorderState.siblingColumns;
      const dragSiblingIndex = reorderState.dragSiblingIndex;

      // 如果没有同级列信息，重新计算（兼容旧逻辑）
      if (!siblingColumns || siblingColumns.length === 0) {
        this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
        return;
      }

      // 防抖：检查是否在冷却期内（50ms）
      const now = Date.now();
      if (reorderState.lastSwapTime && now - reorderState.lastSwapTime < 50) {
        this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
        return;
      }

      // 在同级列中找到当前鼠标位置对应的列
      let targetSiblingIndex = -1;
      let targetCenter = 0;

      for (let i = 0; i < siblingColumns.length; i++) {
        const sibling = siblingColumns[i]!;
        if (viewportX >= sibling.left && viewportX < sibling.right) {
          targetSiblingIndex = i;
          targetCenter = sibling.center;
          break;
        }
      }

      // 如果鼠标不在任何同级列上，清除上次交换的目标
      if (targetSiblingIndex === -1) {
        reorderState.lastSwapTargetKey = undefined;
      }

      // 执行交换检测
      if (targetSiblingIndex !== -1 && targetSiblingIndex !== dragSiblingIndex) {
        const dragSibling = siblingColumns[dragSiblingIndex];
        const targetSibling = siblingColumns[targetSiblingIndex];

        if (dragSibling && targetSibling) {
          // 防止与同一个目标重复交换
          if (reorderState.lastSwapTargetKey === targetSibling.key) {
            this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
            return;
          }

          // 判断是否越过中线
          let shouldSwap = false;
          const direction = targetSiblingIndex > dragSiblingIndex ? "right" : "left";

          if (direction === "right") {
            shouldSwap = viewportX >= targetCenter;
          } else {
            shouldSwap = viewportX < targetCenter;
          }

          if (shouldSwap) {
            // 同级列已确保在同一区域，直接交换
            this.eventEmitter.emit(TableEvents.COLUMN_SWAP, dragSibling.key, targetSibling.key);

            // 更新状态
            reorderState.lastSwapTime = now;
            reorderState.lastSwapTargetKey = undefined;

            // 更新同级列信息（交换后重新计算位置）
            const dragColumn = this.layoutManager.getColumnByKey(reorderState.dragColumnKey);

            if (dragColumn) {
              const newSiblingColumns = this.calculateSiblingColumns(dragColumn);
              const newDragSiblingIndex = newSiblingColumns.findIndex(
                (s) => s.key === reorderState.dragColumnKey,
              );

              reorderState.siblingColumns = newSiblingColumns;
              reorderState.dragSiblingIndex =
                newDragSiblingIndex >= 0 ? newDragSiblingIndex : dragSiblingIndex;

              const newDragSibling = newSiblingColumns[reorderState.dragSiblingIndex];
              if (newDragSibling) {
                reorderState.dragColumnIndex = newDragSibling.firstLeafIndex;
              }
            }
          }
        }
      } else if (targetSiblingIndex === dragSiblingIndex) {
        // 鼠标回到了被拖拽列的新位置，清除上次交换目标
        reorderState.lastSwapTargetKey = undefined;
      }

      // 更新目标列索引（用于渲染指示器）
      if (targetSiblingIndex !== -1) {
        const targetSibling = siblingColumns[targetSiblingIndex];
        if (targetSibling) {
          reorderState.targetColumnIndex = targetSibling.firstLeafIndex;
        }
      } else {
        // 鼠标不在任何同级列上，使用被拖拽列作为目标
        const dragSibling = siblingColumns[dragSiblingIndex];
        if (dragSibling) {
          reorderState.targetColumnIndex = dragSibling.firstLeafIndex;
        }
      }

      this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
      return;
    }

    if (this.state.isSelecting && this.state.selectionStart) {
      const hitResult = this.layoutManager.hitTest(viewportX, viewportY, this.getScrollbarBounds());
      if (hitResult.region === "cell" && hitResult.cell && hitResult.cell.rowIndex >= 0) {
        this.handleRangeSelection(hitResult.cell);
      }
      return;
    }

    // 统一命中测试
    const hitResult = this.layoutManager.hitTest(viewportX, viewportY, this.getScrollbarBounds());

    switch (hitResult.region) {
      case "scrollbar-vertical":
        this.scrollbarState.verticalHovered = true;
        this.scrollbarState.horizontalHovered = false;
        this.canvas.style.cursor = "grab";
        this.state.tooltip = null;
        return;

      case "scrollbar-horizontal":
        this.scrollbarState.horizontalHovered = true;
        this.scrollbarState.verticalHovered = false;
        this.canvas.style.cursor = "grab";
        this.state.tooltip = null;
        return;
    }

    // 清除滚动条悬浮状态
    this.scrollbarState.verticalHovered = false;
    this.scrollbarState.horizontalHovered = false;

    if (hitResult.region === "header") {
      if (hitResult.isResizeHandle) {
        this.canvas.style.cursor = "col-resize";
        this.state.tooltip = null;
        this.state.hoveredHeaderColumnKey = undefined;
        return;
      }

      if (hitResult.headerCell) {
        this.handleHeaderHover(hitResult.headerCell, viewportX, viewportY);
      }
      return;
    }

    if (hitResult.region === "cell" && hitResult.cell) {
      const cell = hitResult.cell;
      this.updateButtonHoverState(cell, viewportX, viewportY);

      const leafColumns = this.layoutManager.getLeafColumns();
      const column = cell.columnIndex >= 0 ? leafColumns[cell.columnIndex] : undefined;
      const row = cell.rowIndex >= 0 ? this.rows[cell.rowIndex] : undefined;
      const isDisabled = column && row ? resolveDisabled(column.disabled, row, column) : false;

      if (isDisabled) {
        this.canvas.style.cursor = "not-allowed";
      } else if (this.isClickableElement(cell, viewportX, viewportY)) {
        this.canvas.style.cursor = "pointer";
      } else if (column && column.key.startsWith("__hidden_placeholder__")) {
        this.canvas.style.cursor = "pointer";
      } else {
        this.canvas.style.cursor = "default";
      }

      if (
        this.state.hoveredCell?.rowIndex !== cell.rowIndex ||
        this.state.hoveredCell?.columnIndex !== cell.columnIndex
      ) {
        this.state.hoveredCell = cell.rowIndex >= 0 ? cell : null;
        const cellInfo = this.state.hoveredCell ? this.getCellInfo(this.state.hoveredCell) : null;
        this.eventEmitter.emit(TableEvents.CELL_HOVER, cellInfo, e);
      }

      this.updateImageHoverIndex(cell, viewportX, viewportY);
      this.updateButtonsHoverIndex(cell, viewportX, viewportY);

      if (this.state.hoveredHeaderColumnKey !== undefined) {
        this.state.hoveredHeaderColumnKey = undefined;
        this.eventEmitter.emit(TableEvents.HEADER_HOVER, undefined);
      }
      this.checkTooltip(cell, viewportX, viewportY);
    }
  };

  private handleHeaderHover(
    headerCell: import("../types").HeaderCell,
    viewportX: number,
    viewportY: number,
  ): void {
    const column = headerCell.column;
    const prevHoveredHeader = this.state.hoveredHeaderColumnKey;

    // 计算列头的视口位置
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

    // 检查是否允许拖拽排序（默认允许，除非明确设置 reorderable: false）
    const isReorderable = column.reorderable !== false;

    // 只有允许拖拽的列才检测 drag handle
    const isOnDragHandle =
      isReorderable &&
      viewportX >= dragHandleX &&
      viewportX <= dragHandleX + dragHandleWidth &&
      viewportY >= dragHandleY &&
      viewportY <= dragHandleY + dragHandleHeight;

    // 设置当前悬浮的列头 key（支持父级列头）
    this.state.hoveredHeaderColumnKey = column.key;

    const showFilterIndicator = column?.filterable && headerCell.isLeaf;

    let filterIconX: number | undefined = undefined;
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

    // 只有叶子节点才显示排序/筛选的悬浮效果
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

  private updateButtonHoverState(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): void {
    const currentHoveredCellKey =
      cell && cell.rowIndex >= 0 ? `${cell.rowIndex}-${cell.columnIndex}` : null;

    this.state.buttonHoverStates.forEach((state, key) => {
      if (key !== currentHoveredCellKey && state.progress > 0) {
        this.state.buttonHoverStates.set(key, {
          ...state,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: state.progress,
        });
      }
    });

    if (!cell || cell.rowIndex < 0) {
      if (this.state.buttonHoverStates.size > 0) {
        this.startButtonHoverAnimationLoop();
      }
      return;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) {
      this.startButtonHoverAnimationLoop();
      return;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);

    if (
      renderResult.type !== "button" ||
      !renderResult.button ||
      resolveDisabled(column.disabled, row, column)
    ) {
      this.startButtonHoverAnimationLoop();
      return;
    }

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = cellPos.y - this.scrollState.scrollTop;

    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;

    const buttonHeight =
      renderResult.button.size === "small" ? 24 : renderResult.button.size === "large" ? 40 : 32;
    const buttonY = (cellPos.height - buttonHeight) / 2;

    // 计算按钮宽度：与 Renderer 保持一致
    const text = renderResult.button.text ?? "Button";
    // 使用默认字体大小计算
    const fontSize = 13;
    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textWidth = this.ctx.measureText(text).width;
    const buttonPadding = 16;
    const cellPadding = 8;
    const buttonWidth = Math.min(
      Math.max(textWidth + buttonPadding * 2, 60),
      cellPos.width - cellPadding * 2,
    );
    // 水平居中
    const buttonX = (cellPos.width - buttonWidth) / 2;

    const isOnButton =
      relativeY >= buttonY &&
      relativeY <= buttonY + buttonHeight &&
      relativeX >= buttonX &&
      relativeX <= buttonX + buttonWidth;

    const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;

    if (isOnButton) {
      const existingState = this.state.buttonHoverStates.get(cellKey);
      if (!existingState || existingState.targetProgress !== 1) {
        const currentProgress = existingState ? existingState.progress : 0;
        this.state.buttonHoverStates.set(cellKey, {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          progress: currentProgress,
          targetProgress: 1,
          startTime: Date.now(),
          startProgress: currentProgress,
        });
        this.startButtonHoverAnimationLoop();
      }
    } else {
      const existingState = this.state.buttonHoverStates.get(cellKey);
      if (existingState && existingState.progress > 0) {
        this.state.buttonHoverStates.set(cellKey, {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          progress: existingState.progress,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: existingState.progress,
        });
        this.startButtonHoverAnimationLoop();
      }
    }
  }

  private clearAllButtonHoverStates(): void {
    let hasChanges = false;
    this.state.buttonHoverStates.forEach((state, key) => {
      if (state.progress > 0 || state.targetProgress !== 0) {
        this.state.buttonHoverStates.set(key, {
          ...state,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: state.progress,
        });
        hasChanges = true;
      }
    });
    if (hasChanges) {
      this.startButtonHoverAnimationLoop();
    }
  }

  private buttonHoverAnimationRunning = false;

  private startButtonHoverAnimationLoop(): void {
    if (this.buttonHoverAnimationRunning) return;
    this.buttonHoverAnimationRunning = true;
    this.runButtonHoverAnimationLoop();
  }

  private runButtonHoverAnimationLoop(): void {
    if (!this.buttonHoverAnimationRunning || this.isDestroyed) return;

    const animationDuration = 150;
    const now = Date.now();
    let hasActiveAnimations = false;

    this.state.buttonHoverStates.forEach((animation, key) => {
      const elapsed = now - animation.startTime;
      const totalDistance = Math.abs(animation.targetProgress - animation.startProgress);
      if (totalDistance === 0) {
        this.state.buttonHoverStates.delete(key);
        return;
      }
      const fullDuration = animationDuration * totalDistance;
      let rawProgress = elapsed / fullDuration;
      rawProgress = Math.max(0, Math.min(1, rawProgress));

      const displayProgress =
        animation.startProgress +
        (animation.targetProgress - animation.startProgress) * rawProgress;
      animation.progress = displayProgress;

      if (rawProgress >= 1) {
        if (animation.targetProgress === 0) {
          this.state.buttonHoverStates.delete(key);
        }
      } else {
        hasActiveAnimations = true;
      }
    });

    this.eventEmitter.emit(TableEvents.BUTTON_HOVER_ANIMATION_UPDATE);

    if (hasActiveAnimations) {
      requestAnimationFrame(() => this.runButtonHoverAnimationLoop());
    } else {
      this.buttonHoverAnimationRunning = false;
    }
  }

  getButtonHoverStates(): Map<string, ButtonHoverState> {
    return this.state.buttonHoverStates;
  }

  getHoveredImageIndex(): number {
    return this.state.hoveredImageIndex ?? -1;
  }

  getHoveredButtonIndex(): number {
    return this.state.hoveredButtonIndex ?? -1;
  }

  private updateImageHoverIndex(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): void {
    if (!cell || cell.rowIndex < 0) {
      this.state.hoveredImageIndex = -1;
      return;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) {
      this.state.hoveredImageIndex = -1;
      return;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);

    // 检查是否是图片列
    if (renderResult.type !== "image" || !renderResult.image) {
      this.state.hoveredImageIndex = -1;
      return;
    }

    const config = renderResult.image;
    const images = config.images;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = cellPos.y - this.scrollState.scrollTop;

    // 计算相对位置
    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;

    // 与 Renderer 保持一致的计算逻辑
    const padding = 4;
    const maxImgSize = Math.min(cellPos.width, cellPos.height) - padding * 2;
    const configWidth = config.width ?? 32;
    const configHeight = config.height ?? 32;
    const imgWidth = Math.min(configWidth, maxImgSize);
    const imgHeight = Math.min(configHeight, maxImgSize);
    const gap = config.gap ?? 4;

    // 单图模式 - 也需要检查是否在图片区域内
    if (!images || images.length <= 1) {
      const imgX = (cellPos.width - imgWidth) / 2;
      const imgY = (cellPos.height - imgHeight) / 2;

      const isInImage =
        relativeX >= imgX &&
        relativeX <= imgX + imgWidth &&
        relativeY >= imgY &&
        relativeY <= imgY + imgHeight;

      this.state.hoveredImageIndex = isInImage && config.hoverable !== false ? 0 : -1;
      return;
    }

    // 根据单元格宽度计算能显示的图片数量
    const availableWidth = cellPos.width - padding * 2;
    const showMoreCount = config.showMoreCount !== false;
    const userMaxVisible = config.maxVisible;

    let calculatedMaxVisible: number;
    if (images.length === 1) {
      calculatedMaxVisible = 1;
    } else {
      const maxByWidth = Math.floor((availableWidth + gap) / (imgWidth + gap));
      const reservedForMore = showMoreCount ? 1 : 0;
      calculatedMaxVisible = Math.max(1, maxByWidth - reservedForMore);
    }

    const maxVisible =
      userMaxVisible !== undefined
        ? Math.min(userMaxVisible, calculatedMaxVisible)
        : calculatedMaxVisible;

    const hasMore = images.length > maxVisible;
    const displayCount = hasMore ? maxVisible : images.length;

    // 计算内容宽度
    let contentWidth: number;
    if (hasMore && showMoreCount) {
      contentWidth = displayCount * imgWidth + displayCount * gap + imgWidth;
    } else {
      contentWidth = displayCount * imgWidth + Math.max(0, displayCount - 1) * gap;
    }

    let startX = cellViewportX + (cellPos.width - contentWidth) / 2;
    startX = Math.max(cellViewportX + padding, startX);
    const imgY = cellViewportY + (cellPos.height - imgHeight) / 2;

    const relX = mouseX - startX;
    const relY = mouseY - imgY;

    // 检查是否在图片Y范围内
    if (relY < 0 || relY > imgHeight) {
      this.state.hoveredImageIndex = -1;
      return;
    }

    // 检查鼠标在哪个图片上
    for (let i = 0; i < displayCount; i++) {
      const imgStartX = i * (imgWidth + gap);
      const imgEndX = imgStartX + imgWidth;

      if (relX >= imgStartX && relX < imgEndX) {
        this.state.hoveredImageIndex = config.hoverable !== false ? i : -1;
        return;
      }
    }

    // 检查是否在 +N 块上
    if (hasMore && showMoreCount) {
      const moreStartX = displayCount * (imgWidth + gap);
      const moreEndX = moreStartX + imgWidth;

      if (relX >= moreStartX && relX < moreEndX) {
        this.state.hoveredImageIndex = config.hoverable !== false ? displayCount : -1; // displayCount 表示 +N 块
        return;
      }
    }

    this.state.hoveredImageIndex = -1;
  }

  private updateButtonsHoverIndex(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): void {
    if (!cell || cell.rowIndex < 0) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);

    // 检查是否是 buttons 类型
    if (renderResult.type !== "buttons" || !renderResult.buttons) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    const config = renderResult.buttons;
    const visibleButtons = config.buttons.filter((btn) => btn.visible !== false);
    const maxVisible = config.maxVisible ?? 3;
    const gap = config.gap ?? 4;
    const padding = 8;
    const buttonHeight = 24;

    const displayButtons = visibleButtons.slice(0, maxVisible);
    const moreButtons = visibleButtons.slice(maxVisible);

    // 获取单元格位置
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = cellPos.y - this.scrollState.scrollTop;
    const buttonY = cellViewportY + (cellPos.height - buttonHeight) / 2;

    const relativeY = mouseY - buttonY;

    // 检查是否在按钮Y范围内
    if (relativeY < 0 || relativeY > buttonHeight) {
      this.state.hoveredButtonIndex = -1;
      return;
    }

    // 计算每个按钮的位置
    let currentX = cellViewportX + padding;
    const fontSize = 13;
    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    // 检查显示的按钮
    for (let i = 0; i < displayButtons.length; i++) {
      const btn = displayButtons[i]!;
      const text = btn.text ?? "Button";
      const textWidth = this.ctx.measureText(text).width;
      const buttonWidth = Math.max(textWidth + 16, 40);

      if (mouseX >= currentX && mouseX < currentX + buttonWidth) {
        this.state.hoveredButtonIndex = i;
        return;
      }

      currentX += buttonWidth + gap;
    }

    // 检查"更多"按钮
    if (moreButtons.length > 0) {
      const moreText = config.moreButtonText ?? "···";
      const textWidth = this.ctx.measureText(moreText).width;
      const buttonWidth = Math.max(textWidth + 16, 32);

      if (mouseX >= currentX && mouseX < currentX + buttonWidth) {
        // "更多"按钮的索引是 maxVisible
        this.state.hoveredButtonIndex = maxVisible;
        return;
      }
    }

    this.state.hoveredButtonIndex = -1;
  }

  private checkTooltip(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): void {
    if (!cell || cell.rowIndex < 0) {
      this.state.tooltip = null;
      return;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) {
      this.state.tooltip = null;
      return;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = cellPos.y - this.scrollState.scrollTop;

    if (renderResult.type === "tag" && renderResult.tags) {
      const tags = renderResult.tags.tags;
      const padding = 8;
      const tagPadding = 4;
      const gap = 4;
      const availableWidth = cellPos.width - padding * 2;

      let currentX = cellViewportX + padding;
      const relativeX = mouseX - cellViewportX;

      let visibleCount = 0;
      let usedWidth = 0;
      let hasTruncation = false;

      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i]!;
        const tagWidth = this.ctx.measureText(tag.text).width + tagPadding * 2;

        const remaining = tags.length - visibleCount;
        const needMoreTag = remaining > 1;
        const moreWidth = needMoreTag
          ? this.ctx.measureText(`+${remaining - 1}`).width + tagPadding * 2 + gap
          : 0;
        const remainingSpace = availableWidth - usedWidth - moreWidth;

        if (tagWidth <= remainingSpace) {
          visibleCount++;
          usedWidth += tagWidth + gap;
          currentX += tagWidth + gap;
        } else {
          hasTruncation = true;
          break;
        }
      }

      if (visibleCount < tags.length) {
        hasTruncation = true;
      }

      if (!hasTruncation) {
        this.state.tooltip = null;
        return;
      }

      this.state.tooltip = {
        cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
        x: cellViewportX,
        y: cellPos.y - this.scrollState.scrollTop,
        width: cellPos.width,
        content: { type: "tags", tags: tags },
      };
      return;
    }

    if (renderResult.type === "select" && renderResult.select) {
      const padding = 8;
      const arrowWidth = 20;
      const maxTextWidth = cellPos.width - padding * 2 - arrowWidth;

      let displayText = "";
      const config = renderResult.select;
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

      if (displayText) {
        const textWidth = this.ctx.measureText(displayText).width;
        if (textWidth > maxTextWidth) {
          this.state.tooltip = {
            cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
            x: cellViewportX,
            y: cellPos.y - this.scrollState.scrollTop,
            width: cellPos.width,
            content: { type: "text", text: displayText },
          };
          return;
        }
      }
    }

    // 图片列处理
    if (renderResult.type === "image" && renderResult.image) {
      const config = renderResult.image;
      const images = config.images;

      // 单图模式不需要 dropdown
      if (!images || images.length <= 1) {
        this.state.tooltip = null;
        return;
      }

      // 多图模式 - 显示图片预览 dropdown
      const canvasRect = this.canvas.getBoundingClientRect();
      const imgSize = InteractionManager.IMAGE_SIZE; // dropdown 中图片大小
      const dropdownPadding = 8;
      const dropdownGap = 8;
      const imagesPerRow = 4;
      const rowCount = Math.ceil(images.length / imagesPerRow);

      // 动态计算行数：默认一行，超过一行显示两行，最大三行
      let maxRows: number;
      if (rowCount <= 1) {
        maxRows = 1;
      } else if (rowCount <= 2) {
        maxRows = 2;
      } else {
        maxRows = 3;
      }

      const dropdownWidth =
        imagesPerRow * imgSize + (imagesPerRow - 1) * dropdownGap + dropdownPadding * 2;
      const rowHeight = imgSize + dropdownGap;
      const dropdownHeight = maxRows * rowHeight + dropdownPadding * 2 - dropdownGap;

      let dropdownY = cellViewportY + cellPos.height;
      let showAbove = false;

      if (dropdownY + dropdownHeight > canvasRect.height) {
        dropdownY = cellViewportY - dropdownHeight;
        showAbove = true;
      }

      let dropdownX = cellViewportX;
      if (dropdownX + dropdownWidth > canvasRect.width) {
        dropdownX = canvasRect.width - dropdownWidth - 4;
      }
      if (dropdownX < 0) {
        dropdownX = 4;
      }

      this.state.imageTooltip = {
        cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
        x: dropdownX,
        y: dropdownY,
        images: images,
        hoveredIndex: -1,
        scrollTop: 0,
        maxRows: maxRows,
        showAbove: showAbove,
      };
      return;
    }

    if (renderResult.text) {
      const padding = 8;
      const maxTextWidth = cellPos.width - padding * 2;
      const textWidth = this.ctx.measureText(renderResult.text).width;

      if (textWidth > maxTextWidth) {
        this.state.tooltip = {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          x: cellViewportX,
          y: cellPos.y - this.scrollState.scrollTop,
          width: cellPos.width,
          content: { type: "text", text: renderResult.text },
        };
        return;
      }
    }

    this.state.tooltip = null;
  }

  private isClickableElement(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): boolean {
    if (!cell) return false;

    if (cell.rowIndex === -1) {
      return true;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) return false;

    const renderResult = getRenderResult(column, row, cell.rowIndex);
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    // Check column-level disabled
    const isDisabled = resolveDisabled(column.disabled, row, column);

    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = cellPos.y - this.scrollState.scrollTop;

    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;

    if (renderResult.type === "checkbox" && renderResult.checkbox) {
      if (isDisabled) return false;
      const size = 16;
      const checkboxX = (cellPos.width - size) / 2;
      const checkboxY = (cellPos.height - size) / 2;
      return (
        relativeX >= checkboxX &&
        relativeX <= checkboxX + size &&
        relativeY >= checkboxY &&
        relativeY <= checkboxY + size
      );
    }

    if (renderResult.type === "radio" && renderResult.radio) {
      if (isDisabled) return false;
      const size = 16;

      if (renderResult.radio.options && renderResult.radio.options.length > 0) {
        const padding = 8;
        const gap = 4;
        const maxX = cellPos.width - padding;

        this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

        let currentX = padding;

        for (let i = 0; i < renderResult.radio.options.length; i++) {
          const option = renderResult.radio.options[i]!;
          if (option.disabled) {
            const textWidth = this.ctx.measureText(option.label).width;
            currentX += size + gap + textWidth + padding;
            continue;
          }

          const textWidth = this.ctx.measureText(option.label).width;
          const optionWidth = size + gap + textWidth + padding;

          if (currentX + optionWidth - padding > maxX) {
            break;
          }

          const radioX = currentX;
          const radioY = (cellPos.height - size) / 2;
          const centerY = radioY + size / 2;

          const inRadioCircle =
            relativeX >= radioX &&
            relativeX <= radioX + size &&
            relativeY >= radioY &&
            relativeY <= radioY + size;

          const textX = radioX + size + gap;
          const inText =
            relativeX >= textX &&
            relativeX <= textX + textWidth &&
            relativeY >= centerY - 10 &&
            relativeY <= centerY + 10;

          if (inRadioCircle || inText) {
            return true;
          }

          currentX += optionWidth;
        }

        return false;
      } else {
        const radioX = (cellPos.width - size) / 2;
        const radioY = (cellPos.height - size) / 2;
        return (
          relativeX >= radioX &&
          relativeX <= radioX + size &&
          relativeY >= radioY &&
          relativeY <= radioY + size
        );
      }
    }

    if (renderResult.type === "button" && renderResult.button) {
      if (isDisabled) return false;
      const buttonHeight =
        renderResult.button.size === "small" ? 24 : renderResult.button.size === "large" ? 40 : 32;
      const buttonY = (cellPos.height - buttonHeight) / 2;
      const padding = 8;
      return (
        relativeY >= buttonY &&
        relativeY <= buttonY + buttonHeight &&
        relativeX >= padding &&
        relativeX <= cellPos.width - padding
      );
    }

    if (renderResult.type === "buttons" && renderResult.buttons) {
      const padding = 8;
      const gap = renderResult.buttons.gap ?? 4;
      const maxVisible = renderResult.buttons.maxVisible ?? 3;
      const buttonHeight = 24;
      const buttonY = (cellPos.height - buttonHeight) / 2;

      const visibleButtons = renderResult.buttons.buttons.filter((btn) => btn.visible !== false);
      const displayButtons = visibleButtons.slice(0, maxVisible);

      let currentX = padding;
      for (const btn of displayButtons) {
        const text = btn.text ?? "Button";
        this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const textWidth = this.ctx.measureText(text).width;
        const buttonWidth = Math.max(textWidth + 16, 40);

        if (
          relativeY >= buttonY &&
          relativeY <= buttonY + buttonHeight &&
          relativeX >= currentX &&
          relativeX <= currentX + buttonWidth
        ) {
          return true;
        }

        currentX += buttonWidth + gap;
      }

      if (visibleButtons.length > maxVisible) {
        const moreText = renderResult.buttons.moreButtonText ?? "···";
        this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const textWidth = this.ctx.measureText(moreText).width;
        const buttonWidth = Math.max(textWidth + 16, 32);

        if (
          relativeY >= buttonY &&
          relativeY <= buttonY + buttonHeight &&
          relativeX >= currentX &&
          relativeX <= currentX + buttonWidth
        ) {
          return true;
        }
      }

      return false;
    }

    if (renderResult.type === "switch" && renderResult.switch) {
      if (isDisabled) return false;
      const switchWidth = 44;
      const switchHeight = 22;
      const switchX = (cellPos.width - switchWidth) / 2;
      const switchY = (cellPos.height - switchHeight) / 2;
      return (
        relativeX >= switchX &&
        relativeX <= switchX + switchWidth &&
        relativeY >= switchY &&
        relativeY <= switchY + switchHeight
      );
    }

    if (renderResult.type === "select" && renderResult.select) {
      if (isDisabled) return false;
      return true;
    }

    if (renderResult.type === "tag" && renderResult.tags) {
      return true;
    }

    if (renderResult.type === "input" && renderResult.input) {
      if (isDisabled || renderResult.input.readonly) return false;
      return true;
    }

    if (renderResult.type === "link" && renderResult.link) {
      const link = renderResult.link;
      const linkText = link.text || link.link;
      if (!linkText) return false;

      // 精确检测点击位置是否在链接文字上
      const padding = 8;
      const fontSize = 13;

      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

      // 计算文字宽度（考虑截断）
      const maxTextWidth = cellPos.width - padding * 2;
      let textWidth = this.ctx.measureText(linkText).width;
      let displayText = linkText;

      if (textWidth > maxTextWidth) {
        const ellipsis = "...";
        while (
          displayText.length > 0 &&
          this.ctx.measureText(displayText + ellipsis).width > maxTextWidth
        ) {
          displayText = displayText.slice(0, -1);
        }
        displayText += ellipsis;
        textWidth = this.ctx.measureText(displayText).width;
      }

      // 计算文字位置（与 Renderer 保持一致）
      const align = column.align ?? "left";
      let textX: number;
      switch (align) {
        case "center":
          textX = (cellPos.width - textWidth) / 2;
          break;
        case "right":
          textX = cellPos.width - padding - textWidth;
          break;
        default:
          textX = padding;
      }
      const textY = (cellPos.height - fontSize) / 2;

      return (
        relativeX >= textX &&
        relativeX <= textX + textWidth &&
        relativeY >= textY &&
        relativeY <= textY + fontSize
      );
    }

    if (renderResult.type === "image" && renderResult.image) {
      const config = renderResult.image;
      if (config.clickable === false) return false;

      // 单图模式
      const images = config.images;
      if (!images || images.length <= 1) {
        const src = config.src || (images && images[0]);
        return !!src;
      }

      // 多图模式 - 检查是否 hover 在某张图片上
      const hoveredImageIndex = this.state.hoveredImageIndex ?? -1;
      return hoveredImageIndex >= 0 && hoveredImageIndex < images.length;
    }

    if (renderResult.type === "progress" && renderResult.progress) {
      const config = renderResult.progress;
      // 只有 interactive 进度条才可点击
      if (config.interactive !== true) return false;
      if (isDisabled) return false;

      const shape = config.shape ?? "line";

      if (shape === "line") {
        // 线形进度条热区检测
        const padding = 8;
        const size = config.size ?? "medium";
        const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
        const textPosition = config.textPosition ?? "right";
        const showText = config.showText ?? true;
        const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
        const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;

        const barX = padding;
        const barY = (cellPos.height - barHeight) / 2;

        return (
          relativeX >= barX &&
          relativeX <= barX + barWidth &&
          relativeY >= barY &&
          relativeY <= barY + barHeight
        );
      }

      if (shape === "circle" || shape === "dashboard") {
        // 圆环/仪表盘热区检测
        const size = config.size ?? "medium";
        let sizeRatio: number;
        let centerYOffset = 0;

        if (shape === "circle") {
          sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
        } else {
          sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
          centerYOffset = cellPos.height * 0.05; // 仪表盘有偏移
        }

        const defaultDiameter = Math.floor(cellPos.height * sizeRatio);
        const diameter = config.width ?? defaultDiameter;
        const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));

        const centerX = cellPos.width / 2;
        const centerY = cellPos.height / 2 + centerYOffset;
        const radius = (diameter - strokeWidth) / 2;

        // 检测是否在圆环范围内
        const dx = relativeX - centerX;
        const dy = relativeY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 在圆环范围内（考虑 strokeWidth）
        return distance >= radius - strokeWidth && distance <= radius + strokeWidth;
      }
    }

    return false;
  }

  private handleMouseUp = (_e: MouseEvent): void => {
    if (
      this.state.isDragging &&
      this.state.dragType === "column-reorder" &&
      this.state.columnReorderState
    ) {
      const { dragColumnIndex, targetColumnIndex } = this.state.columnReorderState;

      if (dragColumnIndex !== targetColumnIndex && targetColumnIndex >= 0) {
        this.eventEmitter.emit(TableEvents.COLUMN_REORDER, dragColumnIndex, targetColumnIndex);
      }

      this.state.isDragging = false;
      this.state.dragType = null;
      this.state.columnReorderState = undefined;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      this.eventEmitter.emit(TableEvents.COLUMN_REORDER_DRAG);
      return;
    }

    if (this.state.columnReorderState && !this.state.isDragging) {
      this.state.columnReorderState = undefined;
      return;
    }

    if (this.state.isDragging) {
      this.state.isDragging = false;
      this.state.dragType = null;
      this.canvas.style.cursor = "default";
      return;
    }

    if (this.state.isSelecting) {
      this.state.isSelecting = false;
      this.state.selectionStart = null;
    }
  };

  private handleMouseLeave = (): void => {
    const hadHoveredHeader = this.state.hoveredHeaderColumnKey !== undefined;
    this.state.hoveredCell = null;
    this.state.hoveredHeaderColumnKey = undefined;
    this.state.hoveredImageIndex = -1;
    this.state.hoveredButtonIndex = -1;
    this.state.isSelecting = false;
    this.state.selectionStart = null;
    this.state.columnReorderState = undefined;
    this.scrollbarState.verticalHovered = false;
    this.scrollbarState.horizontalHovered = false;
    this.clearAllButtonHoverStates();
    if (hadHoveredHeader) {
      this.eventEmitter.emit(TableEvents.HEADER_HOVER, undefined);
    }
  };

  private handleDblClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    if (this.state.dateDropdown) {
      const { x, y, width } = this.state.dateDropdown;
      const headerHeight = 40;
      const weekdayHeight = 28;
      const dayHeight = 28;
      const rowPadding = 8;
      const rows = 6;
      const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        return;
      }

      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE);
    }

    if (this.state.dropdown) {
      const { x, y, width, type, tagsConfig, config } = this.state.dropdown;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
      let optionsLength: number;
      if (type === "tags" && tagsConfig) {
        optionsLength = tagsConfig.options?.length ?? 0;
      } else {
        optionsLength = config.options.length;
      }
      const visibleCount = Math.min(optionsLength, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        return;
      }

      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
    }

    if (this.state.filterDropdown) {
      const { x, y, width, options } = this.state.filterDropdown;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
      const visibleCount = Math.min(options.length, maxVisibleItems);
      const buttonHeight = 36;
      const dropdownHeight = visibleCount * itemHeight + buttonHeight;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        return;
      }

      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
    }

    const x = viewportX + this.scrollState.scrollLeft;
    const y = viewportY + this.scrollState.scrollTop;

    const cell = this.layoutManager.getCellAtPosition(x, y, this.scrollState.scrollTop);
    if (!cell || cell.rowIndex < 0) return;

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    const controlTypes = ["checkbox", "radio", "button", "switch"];

    if (column && row) {
      const renderResult = getRenderResult(column, row, cell.rowIndex);

      if (renderResult.type && controlTypes.includes(renderResult.type)) {
        return;
      }

      // 统一检查 editable
      if (column.editable === false) return;

      if (resolveDisabled(column.disabled, row, column)) return;

      this.eventEmitter.emit(TableEvents.CELL_DBL_CLICK, this.getCellInfo(cell)!, e);
      this.eventEmitter.emit(TableEvents.ROW_DBL_CLICK, cell.rowIndex, e);

      if (this.editingConfig.enabled !== false) {
        // 优先使用 editRender 返回的编辑配置
        const editConfig = this.getEditConfig(column, row, cell.rowIndex);

        if (editConfig) {
          // 使用 editRender 返回的配置
          if (editConfig.type === "select" && editConfig.select) {
            this.startSelectEditing(cell, editConfig.select);
          } else if (editConfig.type === "tag" && editConfig.tags) {
            this.startTagsEditing(cell, editConfig.tags);
          } else if (editConfig.type === "date" && editConfig.date) {
            this.startDateEditing(cell, editConfig.date);
          } else if (editConfig.type === "input" || !editConfig.type) {
            this.startEditing(cell, editConfig.input);
          } else {
            // 其他类型，使用 input 编辑器
            this.startEditing(cell, editConfig.input);
          }
        } else {
          // 走原有逻辑
          if (renderResult.type === "select" && renderResult.select) {
            this.startSelectEditing(cell, renderResult.select);
          } else if (
            renderResult.type === "tag" &&
            renderResult.tags &&
            renderResult.tags.editable
          ) {
            this.startTagsEditing(cell, renderResult.tags);
          } else if (renderResult.type === "date" && renderResult.date) {
            this.startDateEditing(cell, renderResult.date);
          } else if (renderResult.type === "image" && renderResult.image) {
            this.startImageEditing(cell, renderResult.image);
          } else {
            this.startEditing(cell, renderResult.input);
          }
        }
      }
    }
  };

  private handleControlClick = (cell: CellPosition, e: MouseEvent): boolean => {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) return false;

    // 处理占位列点击 - 显示对应的隐藏列
    if (column.key.startsWith("__hidden_placeholder__")) {
      const hiddenColumnKey = (column as Column & { _hiddenColumnKey?: string })._hiddenColumnKey;
      if (hiddenColumnKey) {
        this.eventEmitter.emit(TableEvents.COLUMN_SHOW, hiddenColumnKey);
        return true;
      }
    }

    if (this.expandColumnKey === column.key && row.children && row.children.length > 0) {
      const expandClick = this.handleExpandIconClick(cell, e, row);
      if (expandClick) return true;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);

    // Check column-level disabled
    const isDisabled = resolveDisabled(column.disabled, row, column);

    if (renderResult.type === "checkbox" && renderResult.checkbox) {
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = cellPos.y - this.scrollState.scrollTop;

      const checkboxSize = 16;
      const checkboxX = cellViewportX + (cellPos.width - checkboxSize) / 2;
      const checkboxY = cellViewportY + (cellPos.height - checkboxSize) / 2;

      const isOnCheckbox =
        viewportX >= checkboxX &&
        viewportX <= checkboxX + checkboxSize &&
        viewportY >= checkboxY &&
        viewportY <= checkboxY + checkboxSize;

      if (isOnCheckbox && !isDisabled) {
        const newChecked = !renderResult.checkbox.checked;
        // 自动更新 row.data
        row.data[getColumnField(column)] = newChecked;
        this.eventEmitter.emit(TableEvents.CHECKBOX_CHANGE, this.getCellInfo(cell)!, newChecked);
        return true;
      }

      return false;
    }

    if (renderResult.type === "radio" && renderResult.radio) {
      if (isDisabled) return false;

      if (renderResult.radio.options && renderResult.radio.options.length > 0) {
        const clickedOption = this.getClickedRadioOption(cell, e, renderResult.radio.options);
        if (clickedOption && !clickedOption.disabled) {
          // 自动更新 row.data
          row.data[getColumnField(column)] = clickedOption.value;
          this.eventEmitter.emit(
            TableEvents.RADIO_CHANGE,
            this.getCellInfo(cell)!,
            clickedOption.value,
          );
          return true;
        }
        return false;
      } else {
        // 自动更新 row.data
        row.data[getColumnField(column)] = renderResult.radio.value;
        this.eventEmitter.emit(
          TableEvents.RADIO_CHANGE,
          this.getCellInfo(cell)!,
          renderResult.radio.value,
        );
        return true;
      }
    }

    if (renderResult.type === "button" && renderResult.button) {
      if (isDisabled) return false;

      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = cellPos.y - this.scrollState.scrollTop;

      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;

      const buttonHeight =
        renderResult.button.size === "small" ? 24 : renderResult.button.size === "large" ? 40 : 32;
      const buttonY = (cellPos.height - buttonHeight) / 2;

      // 计算按钮宽度：与 Renderer 保持一致
      const text = renderResult.button.text ?? "Button";
      const fontSize = 13;
      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = this.ctx.measureText(text).width;
      const buttonPadding = 16;
      const cellPadding = 8;
      const buttonWidth = Math.min(
        Math.max(textWidth + buttonPadding * 2, 60),
        cellPos.width - cellPadding * 2,
      );
      const buttonX = (cellPos.width - buttonWidth) / 2;

      const isOnButton =
        relativeY >= buttonY &&
        relativeY <= buttonY + buttonHeight &&
        relativeX >= buttonX &&
        relativeX <= buttonX + buttonWidth;

      if (!isOnButton) return false;

      this.eventEmitter.emit(
        TableEvents.BUTTON_CLICK,
        this.getCellInfo(cell)!,
        renderResult.button.actionKey,
      );
      return true;
    }

    if (renderResult.type === "buttons" && renderResult.buttons) {
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = cellPos.y - this.scrollState.scrollTop;

      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;

      const padding = 8;
      const gap = renderResult.buttons.gap ?? 4;
      const maxVisible = renderResult.buttons.maxVisible ?? 3;
      const buttonHeight = 24;
      const buttonY = (cellPos.height - buttonHeight) / 2;

      const visibleButtons = renderResult.buttons.buttons.filter((btn) => btn.visible !== false);
      const displayButtons = visibleButtons.slice(0, maxVisible);
      const moreButtons = visibleButtons.slice(maxVisible);

      let currentX = padding;
      for (let i = 0; i < displayButtons.length; i++) {
        const btn = displayButtons[i]!;
        const text = btn.text ?? "Button";
        this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const textWidth = this.ctx.measureText(text).width;
        const buttonWidth = Math.max(textWidth + 16, 40);

        if (
          relativeY >= buttonY &&
          relativeY <= buttonY + buttonHeight &&
          relativeX >= currentX &&
          relativeX <= currentX + buttonWidth
        ) {
          this.eventEmitter.emit(TableEvents.BUTTON_CLICK, this.getCellInfo(cell)!, btn.actionKey);
          return true;
        }

        currentX += buttonWidth + gap;
      }

      if (moreButtons.length > 0) {
        const moreText = renderResult.buttons.moreButtonText ?? "···";
        this.ctx.font = `13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        const textWidth = this.ctx.measureText(moreText).width;
        const buttonWidth = Math.max(textWidth + 16, 32);

        if (
          relativeY >= buttonY &&
          relativeY <= buttonY + buttonHeight &&
          relativeX >= currentX &&
          relativeX <= currentX + buttonWidth
        ) {
          const dropdownX = cellViewportX + currentX;
          const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
          const dropdownHeight = moreButtons.length * itemHeight;
          const canvasRect = this.canvas.getBoundingClientRect();

          let dropdownY = cellViewportY + buttonY + buttonHeight + 4;
          let showAbove = false;

          if (dropdownY + dropdownHeight > canvasRect.height) {
            dropdownY = cellViewportY + buttonY - dropdownHeight - 4;
            showAbove = true;
          }

          this.state.buttonsDropdown = {
            cell,
            x: dropdownX,
            y: dropdownY,
            buttons: moreButtons,
            hoveredIndex: -1,
            buttonRelativeX: currentX,
            buttonY: buttonY,
            buttonHeight: buttonHeight,
            showAbove,
          };
          this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
          return true;
        }
      }

      return false;
    }

    if (renderResult.type === "switch" && renderResult.switch) {
      if (isDisabled) return false;

      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = cellPos.y - this.scrollState.scrollTop;

      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;

      const switchWidth = 44;
      const switchHeight = 22;
      const switchX = (cellPos.width - switchWidth) / 2;
      const switchY = (cellPos.height - switchHeight) / 2;

      const isOnSwitch =
        relativeX >= switchX &&
        relativeX <= switchX + switchWidth &&
        relativeY >= switchY &&
        relativeY <= switchY + switchHeight;

      if (!isOnSwitch) return false;

      const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
      const existingAnimation = this.state.switchAnimations.get(cellKey);
      const currentChecked = renderResult.switch.checked ?? false;
      const currentProgress = existingAnimation
        ? existingAnimation.progress
        : currentChecked
          ? 1
          : 0;
      const targetProgress = currentProgress < 0.5 ? 1 : 0;
      const targetChecked = targetProgress === 1;

      if (currentChecked !== targetChecked) {
        // 自动更新 row.data
        row.data[getColumnField(column)] = targetChecked;
        this.eventEmitter.emit(TableEvents.SWITCH_CHANGE, this.getCellInfo(cell)!, targetChecked);
      }

      this.state.switchAnimations.set(cellKey, {
        cell,
        progress: currentProgress,
        targetProgress,
        startTime: Date.now(),
        startProgress: currentProgress,
      });

      this.startSwitchAnimationLoop();
      return true;
    }

    if (renderResult.type === "input" && renderResult.input) {
      if (isDisabled || renderResult.input.readonly) return false;

      return false;
    }

    if (renderResult.type === "link" && renderResult.link) {
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = cellPos.y - this.scrollState.scrollTop;

      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;

      const link = renderResult.link;
      const linkUrl = link.link;
      const linkText = link.text || link.link;
      if (!linkUrl || !linkText) return false;

      // 精确检测点击位置是否在链接文字上
      const padding = 8;
      const fontSize = 13;

      this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

      // 计算文字宽度（考虑截断）
      const maxTextWidth = cellPos.width - padding * 2;
      let textWidth = this.ctx.measureText(linkText).width;
      let displayText = linkText;

      if (textWidth > maxTextWidth) {
        const ellipsis = "...";
        while (
          displayText.length > 0 &&
          this.ctx.measureText(displayText + ellipsis).width > maxTextWidth
        ) {
          displayText = displayText.slice(0, -1);
        }
        displayText += ellipsis;
        textWidth = this.ctx.measureText(displayText).width;
      }

      // 计算文字位置（与 Renderer 保持一致）
      const align = column.align ?? "left";
      let textX: number;
      switch (align) {
        case "center":
          textX = (cellPos.width - textWidth) / 2;
          break;
        case "right":
          textX = cellPos.width - padding - textWidth;
          break;
        default:
          textX = padding;
      }
      const textY = (cellPos.height - fontSize) / 2;

      const isOnLink =
        relativeX >= textX &&
        relativeX <= textX + textWidth &&
        relativeY >= textY &&
        relativeY <= textY + fontSize;

      if (!isOnLink) return false;

      // 检测是否为双击，如果是双击则不跳转链接（让 dblclick 事件处理编辑）
      const now = Date.now();
      const isDoubleClick =
        this._lastClickCell?.rowIndex === cell.rowIndex &&
        this._lastClickCell?.columnIndex === cell.columnIndex &&
        now - this._lastClickTime < 350;

      // 更新点击记录
      this._lastClickTime = now;
      this._lastClickCell = { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex };

      if (isDoubleClick) {
        return false; // 不跳转，让 dblclick 事件处理
      }

      window.open(linkUrl, "_blank", "noopener,noreferrer");
      return true;
    }

    if (renderResult.type === "progress" && renderResult.progress) {
      return this.handleProgressClick(cell, e, renderResult.progress, column, row);
    }

    if (renderResult.type === "image" && renderResult.image) {
      if (renderResult.image.clickable === false) return false;

      const config = renderResult.image;
      const images = config.images;

      // 获取点击位置
      const rect = this.canvas.getBoundingClientRect();
      const clickViewportX = e.clientX - rect.left;
      const clickViewportY = e.clientY - rect.top;

      // 计算单元格视口位置
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = cellPos.y - this.scrollState.scrollTop;

      // 计算相对位置
      const relativeX = clickViewportX - cellViewportX;
      const relativeY = clickViewportY - cellViewportY;

      // 与 updateImageHoverIndex 保持一致的计算逻辑
      const padding = 4;
      const maxImgSize = Math.min(cellPos.width, cellPos.height) - padding * 2;
      const configWidth = config.width ?? 32;
      const configHeight = config.height ?? 32;
      const imgWidth = Math.min(configWidth, maxImgSize);
      const imgHeight = Math.min(configHeight, maxImgSize);
      const gap = config.gap ?? 4;

      // 多图模式
      if (images && images.length > 1) {
        const maxVisible = config.maxVisible ?? 3;
        const showMoreCount = config.showMoreCount !== false;
        const availableWidth = cellPos.width - padding * 2;
        const maxByWidth = Math.floor((availableWidth + gap) / (imgWidth + gap));
        const reservedForMore = showMoreCount ? 1 : 0;
        const calculatedMaxVisible = Math.max(1, maxByWidth - reservedForMore);
        const actualMaxVisible = Math.min(maxVisible, calculatedMaxVisible);
        const displayCount = images.length > actualMaxVisible ? actualMaxVisible : images.length;
        const hasMore = images.length > actualMaxVisible;

        // 计算内容宽度
        let contentWidth: number;
        if (hasMore && showMoreCount) {
          contentWidth = displayCount * imgWidth + displayCount * gap + imgWidth;
        } else {
          contentWidth = displayCount * imgWidth + Math.max(0, displayCount - 1) * gap;
        }

        let startX = (cellPos.width - contentWidth) / 2;
        startX = Math.max(padding, startX);
        const imgY = (cellPos.height - imgHeight) / 2;

        const relX = relativeX - startX;
        const relY = relativeY - imgY;

        // 检查是否在图片区域内
        if (relX < 0 || relX > contentWidth || relY < 0 || relY > imgHeight) {
          return false;
        }

        // 计算点击的图片索引
        const clickedIndex = Math.floor(relX / (imgWidth + gap));

        // 点击的是 +N 块
        if (hasMore && showMoreCount && clickedIndex === displayCount) {
          return false;
        }

        // 点击的是显示的图片
        if (clickedIndex >= 0 && clickedIndex < images.length) {
          const clickedSrc = images[clickedIndex];
          if (clickedSrc) {
            this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell)!, clickedSrc, e);
            return true;
          }
        }
        return false;
      }

      // 单图模式或只有一张图片的情况
      const imgX = (cellPos.width - imgWidth) / 2;
      const imgY = (cellPos.height - imgHeight) / 2;

      const isInImage =
        relativeX >= imgX &&
        relativeX <= imgX + imgWidth &&
        relativeY >= imgY &&
        relativeY <= imgY + imgHeight;

      if (!isInImage) return false;

      const src = config.src || (images && images[0]);
      if (!src) return false;

      this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell)!, src, e);
      return true;
    }

    return false;
  };

  private handleProgressClick(
    cell: CellPosition,
    e: MouseEvent,
    config: import("../types").ProgressConfig,
    column: Column | undefined,
    row: Row | undefined,
  ): boolean {
    // 检查是否可交互
    if (!config.interactive) return false;

    // 检查是否禁用
    if (row && column && resolveDisabled(column.disabled, row, column)) return false;

    // 获取点击位置
    const rect = this.canvas.getBoundingClientRect();
    const clickViewportX = e.clientX - rect.left;

    // 计算单元格视口位置
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);

    const shape = config.shape ?? "line";

    if (shape === "line") {
      // 线型进度条：根据点击位置计算进度
      const padding = 8;
      const size = config.size ?? "medium";
      const barHeight = config.height ?? (size === "small" ? 6 : size === "large" ? 16 : 10);
      const textPosition = config.textPosition ?? "right";
      const showText = config.showText ?? true;
      const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
      const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;

      const barX = cellViewportX + padding;
      const barY = cellPos.y - this.scrollState.scrollTop + (cellPos.height - barHeight) / 2;

      const clickViewportY = e.clientY - rect.top;
      const relativeX = clickViewportX - barX;
      const relativeY = clickViewportY - barY;

      // 检测点击是否在进度条范围内
      if (relativeX >= 0 && relativeX <= barWidth && relativeY >= 0 && relativeY <= barHeight) {
        const newValue = Math.max(0, Math.min(100, (relativeX / barWidth) * 100));

        // 自动更新 row.data
        if (column && row) {
          row.data[getColumnField(column)] = newValue;
        }

        this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell)!, newValue);
        return true;
      }
    } else if (shape === "circle" || shape === "dashboard") {
      // 环型/仪表盘：根据点击角度计算进度
      const clickViewportY = e.clientY - rect.top;
      const cellViewportY = cellPos.y - this.scrollState.scrollTop;

      const size = config.size ?? "medium";
      let sizeRatio: number;
      let centerYOffset = 0;

      if (shape === "circle") {
        sizeRatio = size === "small" ? 0.6 : size === "large" ? 0.9 : 0.75;
      } else {
        sizeRatio = size === "small" ? 0.7 : size === "large" ? 0.95 : 0.85;
        centerYOffset = cellPos.height * 0.05; // 仪表盘有偏移
      }

      const defaultDiameter = Math.floor(cellPos.height * sizeRatio);
      const diameter = config.width ?? defaultDiameter;
      const strokeWidth = config.strokeWidth ?? Math.max(2, Math.round(diameter * 0.12));
      const radius = (diameter - strokeWidth) / 2;

      const cellCenterX = cellViewportX + cellPos.width / 2;
      const cellCenterY = cellViewportY + cellPos.height / 2 + centerYOffset;

      const dx = clickViewportX - cellCenterX;
      const dy = clickViewportY - cellCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 检查点击是否在圆环范围内
      if (distance >= radius - strokeWidth && distance <= radius + strokeWidth) {
        let angle = Math.atan2(dy, dx);
        let newValue: number;

        if (shape === "circle") {
          // 圆环：从顶部开始计算
          angle = angle + Math.PI / 2; // 调整为从顶部开始
          if (angle < 0) angle += Math.PI * 2;
          newValue = (angle / (Math.PI * 2)) * 100;
        } else {
          // 仪表盘：缺口在底部中间 (45° 到 135° 的 90° 范围)
          // 进度从 135° 开始，顺时针增长到 45°
          // 135° = 右下偏右, 45° = 右下偏左
          const startAngle = Math.PI * 0.75; // 135°
          const totalAngle = Math.PI * 1.5; // 270°

          // 统一角度到 [0, 2π]
          if (angle < 0) angle += Math.PI * 2;

          // 计算相对于 startAngle 的顺时针偏移量
          // 顺时针方向角度增加，所以 offset = angle - startAngle
          let offset = angle - startAngle;
          if (offset < 0) offset += Math.PI * 2;

          // 检查是否在有效范围内 (0 到 270°)
          // offset 在 [0, 270°] 表示点击在弧上
          // offset 在 (270°, 360°) 表示点击在缺口（底部中间）
          if (offset > totalAngle) return false;

          newValue = (offset / totalAngle) * 100;
        }

        newValue = Math.max(0, Math.min(100, newValue));

        // 自动更新 row.data
        if (column && row) {
          row.data[getColumnField(column)] = newValue;
        }

        this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell)!, newValue);
        return true;
      }
    }

    return false;
  }

  private handleExpandIconClick = (cell: CellPosition, e: MouseEvent, row: Row): boolean => {
    const rect = this.canvas.getBoundingClientRect();
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellViewportX = this.getCellViewportX(cellPos, column);

    const relativeX = clickX - cellViewportX;
    const level = row.level ?? 0;
    const padding = 8;
    const iconSize = 8;
    const levelIndent = level * 16;
    const iconX = padding + levelIndent;
    const iconEndX = iconX + iconSize + 4;

    if (relativeX >= iconX && relativeX <= iconEndX) {
      this.eventEmitter.emit(TableEvents.EXPAND, cell.rowIndex, !row.expanded);
      return true;
    }

    return false;
  };

  private getClickedRadioOption(
    cell: CellPosition,
    e: MouseEvent,
    options: { label: string; value: unknown; disabled?: boolean }[],
  ): { label: string; value: unknown; disabled?: boolean } | null {
    const rect = this.canvas.getBoundingClientRect();
    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellViewportX = this.getCellViewportX(cellPos, column);

    const relativeX = clickX - cellViewportX;
    const relativeY = clickY - (cellPos.y - this.scrollState.scrollTop);

    const padding = 8;
    const size = 16;
    const gap = 4;
    const maxX = cellPos.width - padding;

    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

    let currentX = padding;

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
      const textWidth = this.ctx.measureText(option.label).width;
      const optionWidth = size + gap + textWidth + padding;

      if (currentX + optionWidth - padding > maxX) {
        break;
      }

      const radioX = currentX;
      const radioY = (cellPos.height - size) / 2;
      const centerY = radioY + size / 2;

      const inRadioCircle =
        relativeX >= radioX &&
        relativeX <= radioX + size &&
        relativeY >= radioY &&
        relativeY <= radioY + size;

      const textX = radioX + size + gap;
      const inText =
        relativeX >= textX &&
        relativeX <= textX + textWidth &&
        relativeY >= centerY - 10 &&
        relativeY <= centerY + 10;

      if (inRadioCircle || inText) {
        return option;
      }

      currentX += optionWidth;
    }

    return null;
  }

  private handleWheel = (e: WheelEvent): void => {
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
      return;
    }

    if (this.state.imageTooltip) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, images, maxRows, scrollTop } = this.state.imageTooltip;
      const imgSize = InteractionManager.IMAGE_SIZE;
      const padding = 8;
      const gap = 8;
      const imagesPerRow = 4;
      const scrollbarWidth = 4;
      const scrollbarGap = 4;
      const dropdownWidth =
        imagesPerRow * imgSize +
        (imagesPerRow - 1) * gap +
        padding * 2 +
        scrollbarGap +
        scrollbarWidth;
      const rowHeight = imgSize + gap;
      const visibleHeight = maxRows * rowHeight + padding * 2 - gap;

      const isInDropdown =
        viewportX >= x &&
        viewportX <= x + dropdownWidth &&
        viewportY >= y &&
        viewportY <= y + visibleHeight;

      if (isInDropdown) {
        const totalRows = Math.ceil(images.length / imagesPerRow);
        const maxScrollTop = Math.max(0, (totalRows - maxRows) * rowHeight);

        // 有滚动条且主要是纵向滚动（deltaY 绝对值大于 deltaX）
        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        if (maxScrollTop > 0 && isMainlyVertical) {
          // 检查是否滚动到边界
          const epsilon = 0.5;
          const atTop = scrollTop <= epsilon && e.deltaY < 0;
          const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;

          if (!atTop && !atBottom) {
            // 未到边界，dropdown 消费滚动事件
            this.state.imageTooltip.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
            return;
          }
          // 到达边界，事件传递到表格
        }
        // 没有滚动条或主要横向滚动或到达边界，事件传递到表格
      }
      // 鼠标不在 dropdown 区域内或事件传递到表格，更新 dropdown 位置
      this.updateImageTooltipPosition();
      // 继续执行，让表格处理滚动
    }

    if (this.state.imageEditor) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, images, maxRows, scrollTop, pendingImages } = this.state.imageEditor;
      const imgSize = InteractionManager.IMAGE_SIZE;
      const padding = 8;
      const gap = 8;
      const imagesPerRow = 4;
      const uploadAreaHeight = 60;
      const rowHeight = imgSize + gap;
      const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
      const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
      const editorHeight = uploadAreaHeight + imagesHeight;

      const isInEditor =
        viewportX >= x &&
        viewportX <= x + editorWidth &&
        viewportY >= y &&
        viewportY <= y + editorHeight;

      if (isInEditor) {
        const totalImages = images.length + pendingImages.length;
        const totalRows = Math.ceil(totalImages / imagesPerRow);
        const maxScrollTop = Math.max(0, (totalRows - maxRows) * rowHeight);

        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        if (maxScrollTop > 0 && isMainlyVertical) {
          const epsilon = 0.5;
          const atTop = scrollTop <= epsilon && e.deltaY < 0;
          const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;

          if (!atTop && !atBottom) {
            this.state.imageEditor.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
            return;
          }
        }
      }
      // 更新编辑器位置
      this.updateImageEditorPosition();
    }

    if (this.state.filterDropdown) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, width, options } = this.state.filterDropdown;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
      const visibleCount = Math.min(options.length, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        const deltaY = e.deltaY;
        const maxScrollTop = Math.max(0, options.length * itemHeight - dropdownHeight);
        this.state.filterDropdown.scrollTop = clamp(
          this.state.filterDropdown.scrollTop + deltaY,
          0,
          maxScrollTop,
        );
        e.preventDefault();
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
        return;
      }

      this.updateFilterDropdownPosition();
    }

    if (this.state.dropdown) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, width, type, tagsConfig, config } = this.state.dropdown;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;

      let optionsLength: number;
      if (type === "tags" && tagsConfig) {
        optionsLength = tagsConfig.options?.length ?? 0;
      } else {
        optionsLength = config.options.length;
      }

      const visibleCount = Math.min(optionsLength, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        const deltaY = e.deltaY;
        const maxScrollTop = Math.max(0, optionsLength * itemHeight - dropdownHeight);
        this.state.dropdown.scrollTop = clamp(
          (this.state.dropdown.scrollTop ?? 0) + deltaY,
          0,
          maxScrollTop,
        );
        e.preventDefault();
        this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
        return;
      }

      this.updateDropdownPosition();
    }

    if (this.state.dateDropdown) {
      this.updateDateDropdownPosition();
    }

    if (this.state.buttonsDropdown) {
      this.updateButtonsDropdownPosition();
    }

    if (this.state.tooltip) {
      this.updateTooltipPosition();
    }

    e.preventDefault();

    const deltaX = e.deltaX;
    const deltaY = e.deltaY;

    const newScrollLeft = clamp(
      this.scrollState.scrollLeft + deltaX,
      0,
      this.scrollState.maxScrollLeft,
    );

    const newScrollTop = clamp(
      this.scrollState.scrollTop + deltaY,
      0,
      this.scrollState.maxScrollTop,
    );

    if (
      newScrollLeft !== this.scrollState.scrollLeft ||
      newScrollTop !== this.scrollState.scrollTop
    ) {
      this.scrollState.scrollLeft = newScrollLeft;
      this.scrollState.scrollTop = newScrollTop;
      this.scrollState.isScrolling = true;

      this.eventEmitter.emit(TableEvents.SCROLL, newScrollLeft, newScrollTop);

      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = false;
      }, 150);
    }
  };

  private updateDropdownPosition(): void {
    if (!this.state.dropdown) return;

    const { cell, showAbove } = this.state.dropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    let dropdownX: number;
    if (column.fixed === "left") {
      dropdownX = cellPos.x;
    } else if (column.fixed === "right") {
      dropdownX = cellPos.x;
    } else {
      dropdownX = cellPos.x - this.scrollState.scrollLeft;
    }

    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
    let optionsCount: number;

    if (this.state.dropdown.type === "tags" && this.state.dropdown.tagsConfig) {
      optionsCount = this.state.dropdown.tagsConfig.options?.length ?? 0;
    } else {
      optionsCount = this.state.dropdown.config.options?.length ?? 0;
    }
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    let dropdownY: number;
    if (showAbove) {
      dropdownY = cellPos.y - this.scrollState.scrollTop - dropdownHeight;
    } else {
      dropdownY = cellPos.y - this.scrollState.scrollTop + cellPos.height;
    }

    this.state.dropdown.x = dropdownX;
    this.state.dropdown.y = dropdownY;

    this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
  }

  private updateFilterDropdownPosition(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey } = this.state.filterDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const columnIndex = leafColumns.findIndex((col) => col.key === columnKey);
    if (columnIndex < 0) return;

    const column = leafColumns[columnIndex];
    if (!column) return;

    const cellPos = this.layoutManager.getCellPosition(-1, columnIndex);
    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;

    let dropdownX: number;
    if (column.fixed === "left") {
      dropdownX = cellPos.x;
    } else if (column.fixed === "right") {
      dropdownX = cellPos.x;
    } else {
      dropdownX = cellPos.x - this.scrollState.scrollLeft;
    }

    this.state.filterDropdown.x = dropdownX;
    this.state.filterDropdown.y = headerHeight;
    this.state.filterDropdown.width = Math.max(cellPos.width, 200);

    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  private updateDateDropdownPosition(): void {
    if (!this.state.dateDropdown) return;

    const { cell } = this.state.dateDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const canvasRect = this.canvas.getBoundingClientRect();

    let dropdownX: number;
    if (column.fixed === "left") {
      dropdownX = cellPos.x;
    } else if (column.fixed === "right") {
      dropdownX = cellPos.x;
    } else {
      dropdownX = cellPos.x - this.scrollState.scrollLeft;
    }

    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
    const dropdownHeight = 40 + 28 + 6 * 28 + 16;
    let dropdownY = cellPos.y - this.scrollState.scrollTop + cellPos.height;

    const dropdownWidth = Math.max(cellPos.width, 280);

    if (dropdownX + dropdownWidth > canvasRect.width) {
      dropdownX = canvasRect.width - dropdownWidth - 8;
    }
    if (dropdownX < 0) {
      dropdownX = 8;
    }

    if (dropdownY + dropdownHeight > canvasRect.height) {
      dropdownY = cellPos.y - this.scrollState.scrollTop - dropdownHeight;
    }

    this.state.dateDropdown.x = dropdownX;
    this.state.dateDropdown.y = dropdownY;
    this.state.dateDropdown.width = dropdownWidth;

    this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
  }

  private updateButtonsDropdownPosition(): void {
    if (!this.state.buttonsDropdown) return;

    const { cell, buttonRelativeX, buttonY, buttonHeight, showAbove, buttons } =
      this.state.buttonsDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.state.buttonsDropdown = null;
      return;
    }

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = cellPos.y - this.scrollState.scrollTop;

    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
    if (cellViewportY < headerHeight || cellViewportY + cellPos.height > this.canvas.height) {
      this.state.buttonsDropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
      return;
    }

    const dropdownX = cellViewportX + buttonRelativeX;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;

    let dropdownY: number;
    if (showAbove) {
      dropdownY = cellViewportY + buttonY - dropdownHeight - 4;
    } else {
      dropdownY = cellViewportY + buttonY + buttonHeight + 4;
    }

    this.state.buttonsDropdown.x = dropdownX;
    this.state.buttonsDropdown.y = dropdownY;

    this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
  }

  private updateImageTooltipPosition(): void {
    if (!this.state.imageTooltip) return;

    const { cell, showAbove, maxRows } = this.state.imageTooltip;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.state.imageTooltip = null;
      return;
    }

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = cellPos.y - this.scrollState.scrollTop;

    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
    if (cellViewportY < headerHeight || cellViewportY + cellPos.height > this.canvas.height) {
      this.state.imageTooltip = null;
      return;
    }

    const tooltipGap = 4;
    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const tooltipWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2;
    const rowHeight = imgSize + gap;
    const tooltipHeight = maxRows * rowHeight + padding * 2 - gap;

    let tooltipX = cellViewportX;
    if (tooltipX + tooltipWidth > this.canvas.width) {
      tooltipX = this.canvas.width - tooltipWidth - 4;
    }
    if (tooltipX < 0) {
      tooltipX = 4;
    }

    let tooltipY: number;
    if (showAbove) {
      tooltipY = cellViewportY - tooltipHeight - tooltipGap;
    } else {
      tooltipY = cellViewportY + cellPos.height + tooltipGap;
    }

    this.state.imageTooltip.x = tooltipX;
    this.state.imageTooltip.y = tooltipY;
  }

  private updateImageEditorPosition(): void {
    if (!this.state.imageEditor) return;

    const { cell, showAbove, maxRows } = this.state.imageEditor;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.commitImageEditorChanges();
      return;
    }

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = cellPos.y - this.scrollState.scrollTop;

    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;
    if (cellViewportY < headerHeight || cellViewportY + cellPos.height > this.canvas.height) {
      this.commitImageEditorChanges();
      return;
    }

    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    let editorX = cellViewportX;
    if (editorX + editorWidth > this.canvas.width) {
      editorX = this.canvas.width - editorWidth - 4;
    }
    if (editorX < 0) {
      editorX = 4;
    }

    let editorY: number;
    if (showAbove) {
      editorY = cellViewportY - editorHeight;
    } else {
      editorY = cellViewportY + cellPos.height;
    }

    this.state.imageEditor.x = editorX;
    this.state.imageEditor.y = editorY;
  }

  handleExternalWheel(deltaX: number, deltaY: number): void {
    if (this.state.dropdown) {
      this.updateDropdownPosition();
    }

    if (this.state.tooltip) {
      this.updateTooltipPosition();
    }

    const newScrollLeft = clamp(
      this.scrollState.scrollLeft + deltaX,
      0,
      this.scrollState.maxScrollLeft,
    );

    const newScrollTop = clamp(
      this.scrollState.scrollTop + deltaY,
      0,
      this.scrollState.maxScrollTop,
    );

    if (
      newScrollLeft !== this.scrollState.scrollLeft ||
      newScrollTop !== this.scrollState.scrollTop
    ) {
      this.scrollState.scrollLeft = newScrollLeft;
      this.scrollState.scrollTop = newScrollTop;
      this.scrollState.isScrolling = true;

      this.eventEmitter.emit(TableEvents.SCROLL, newScrollLeft, newScrollTop);

      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = false;
      }, 150);
    }
  }

  private updateTooltipPosition(): void {
    if (!this.state.tooltip) return;

    const { cell } = this.state.tooltip;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);

    let tooltipX: number;
    if (column.fixed === "left") {
      tooltipX = cellPos.x;
    } else if (column.fixed === "right") {
      tooltipX = cellPos.x;
    } else {
      tooltipX = cellPos.x - this.scrollState.scrollLeft;
    }

    const tooltipY = cellPos.y - this.scrollState.scrollTop;

    this.state.tooltip.x = tooltipX;
    this.state.tooltip.y = tooltipY;
    this.state.tooltip.width = cellPos.width;
  }

  private scrollTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.state.editingCell) {
      this.handleEditingKeyDown(e);
      return;
    }

    if (this.state.dropdown) {
      if (e.key === "Escape") {
        this.state.dropdown = null;
        this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
      }
      return;
    }

    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        this.handleArrowNavigation(e);
        break;
      case "Enter":
        this.handleEnterKey(e);
        break;
      case "Escape":
        this.clearSelection();
        break;
      case "a":
      case "A":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.selectAll();
        }
        break;
      case "c":
      case "C":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.copySelection();
        }
        break;
      case "z":
      case "Z":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.eventEmitter.emit(TableEvents.UNDO);
        }
        break;
      case "y":
      case "Y":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.eventEmitter.emit(TableEvents.REDO);
        }
        break;
      case " ":
        if (this.state.selectedCells.length > 0) {
          const cell = this.state.selectedCells[0]!.start;
          this.toggleRowExpand(cell.rowIndex);
        }
        break;
    }
  };

  private handleEditingKeyDown(e: KeyboardEvent): void {
    if (!this.state.editingCell) return;

    switch (e.key) {
      case "Enter":
        this.endEditing(true);
        break;
      case "Escape":
        this.endEditing(false);
        break;
      case "Tab":
        e.preventDefault();
        this.endEditing(true);
        const nextCol = e.shiftKey ? -1 : 1;
        this.moveSelection(0, nextCol);
        break;
    }
  }

  private handleArrowNavigation(e: KeyboardEvent): void {
    e.preventDefault();

    const leafColumns = this.layoutManager.getLeafColumns();

    let currentCell: CellPosition;

    if (this.state.selectedCells.length > 0) {
      const range = this.state.selectedCells[0]!;
      currentCell = e.key === "ArrowUp" || e.key === "ArrowLeft" ? range.start : range.end;
    } else {
      currentCell = { rowIndex: 0, columnIndex: 0 };
    }

    let newRow = currentCell.rowIndex;
    let newCol = currentCell.columnIndex;

    switch (e.key) {
      case "ArrowUp":
        newRow = Math.max(0, newRow - 1);
        break;
      case "ArrowDown":
        newRow = Math.min(this.rows.length - 1, newRow + 1);
        break;
      case "ArrowLeft":
        newCol = Math.max(0, newCol - 1);
        break;
      case "ArrowRight":
        newCol = Math.min(leafColumns.length - 1, newCol + 1);
        break;
    }

    const newCell: CellPosition = { rowIndex: newRow, columnIndex: newCol };
    this.handleSingleSelection(newCell);

    this.scrollToCell(newCell);
  }

  private handleEnterKey(e: KeyboardEvent): void {
    if (this.state.selectedCells.length === 0) return;

    e.preventDefault();
    e.stopPropagation();

    const cell = this.state.selectedCells[0]!.start;

    if (this.editingConfig.enabled !== false) {
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[cell.columnIndex];
      const row = this.rows[cell.rowIndex];

      if (column && row) {
        const renderResult = getRenderResult(column, row, cell.rowIndex);
        const controlTypes = ["checkbox", "radio", "button", "switch"];
        if (renderResult.type && controlTypes.includes(renderResult.type)) {
          if (renderResult.type === "switch" && renderResult.switch) {
            if (!resolveDisabled(column.disabled, row, column)) {
              // 自动更新 row.data
              row.data[getColumnField(column)] = !renderResult.switch.checked;
              this.eventEmitter.emit(
                TableEvents.SWITCH_CHANGE,
                this.getCellInfo(cell)!,
                !renderResult.switch.checked,
              );
            }
            return;
          }
          this.toggleRowExpand(cell.rowIndex);
          return;
        }

        // 统一检查 editable
        if (column.editable === false) return;

        // 统一检查 column 级别的 disabled
        if (resolveDisabled(column.disabled, row, column)) return;

        // 检查 input 的 readonly
        if (renderResult.input?.readonly) return;

        // 优先使用 editRender 返回的编辑配置
        const editConfig = this.getEditConfig(column, row, cell.rowIndex);

        if (editConfig) {
          // 使用 editRender 返回的配置
          if (editConfig.type === "select" && editConfig.select) {
            this.startSelectEditing(cell, editConfig.select);
            return;
          }
          if (editConfig.type === "tag" && editConfig.tags) {
            this.startTagsEditing(cell, editConfig.tags);
            return;
          }
          if (editConfig.type === "date" && editConfig.date) {
            this.startDateEditing(cell, editConfig.date);
            return;
          }
          this.startEditing(cell, editConfig.input);
          return;
        }

        // 走原有逻辑
        if (renderResult.type === "select" && renderResult.select) {
          this.startSelectEditing(cell, renderResult.select);
          return;
        }

        if (renderResult.type === "tag" && renderResult.tags && renderResult.tags.editable) {
          this.startTagsEditing(cell, renderResult.tags);
          return;
        }

        if (renderResult.type === "date" && renderResult.date) {
          this.startDateEditing(cell, renderResult.date);
          return;
        }

        if (renderResult.type === "image" && renderResult.image) {
          this.startImageEditing(cell, renderResult.image);
          return;
        }

        this.startEditing(cell, renderResult.input);
      }
    } else {
      this.toggleRowExpand(cell.rowIndex);
    }
  }

  private handleHeaderMouseDown(columnIndex: number, e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const headerCell = this.layoutManager.getHeaderCellAtPosition(viewportX, viewportY);

    if (!headerCell) return;

    const column = headerCell.column;

    // 不允许拖拽 reorderable: false 的列
    if (column.reorderable === false) {
      return;
    }

    const resizeColIndex = this.layoutManager.isResizeHandleAtPosition(
      viewportX + this.scrollState.scrollLeft,
      0,
    );

    if (resizeColIndex >= 0) {
      return;
    }

    // 计算视口坐标，固定列不需要减去 scrollLeft
    let cellViewportX: number;
    if (column.fixed === "left") {
      cellViewportX = headerCell.x;
    } else if (column.fixed === "right") {
      // 右固定列需要计算偏移
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

    // 只有叶子节点才支持排序/筛选点击
    if (headerCell.isLeaf && !isOnDragHandle) {
      this.handleHeaderClick(columnIndex, e);
      return;
    }

    // 非叶子节点点击在非拖拽区域，不做任何处理
    if (!headerCell.isLeaf && !isOnDragHandle) {
      return;
    }

    // 在拖拽手柄上，开始拖拽
    let dragColumnKey = column.key;
    let dragColumnIndex = columnIndex;

    if (!headerCell.isLeaf && column.children && column.children.length > 0) {
      const firstLeaf = this.getFirstLeaf(column);
      if (firstLeaf) {
        dragColumnKey = column.key;
        // 使用列对象引用查找索引，避免相同 key 的列返回错误索引
        dragColumnIndex = this.layoutManager.getLeafColumnIndex(firstLeaf);
        if (dragColumnIndex < 0) dragColumnIndex = columnIndex;
      }
    }

    // 计算同级列信息
    const siblingColumns = this.calculateSiblingColumns(column);

    // 找到被拖拽列在同级列中的索引
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
  }

  /**
   * 计算同级列信息
   * 同级列定义：
   * 1. 有相同父列的列（同一父列的 children）
   * 2. 都是顶级列，且 fixed 属性相同
   */
  private calculateSiblingColumns(column: Column): Array<{
    key: string;
    left: number;
    right: number;
    center: number;
    width: number;
    leafCount: number;
    firstLeafIndex: number;
    fixed: FixedType;
  }> {
    const siblings: Array<{
      key: string;
      left: number;
      right: number;
      center: number;
      width: number;
      leafCount: number;
      firstLeafIndex: number;
      fixed: FixedType;
    }> = [];

    const scrollLeft = this.scrollState.scrollLeft;
    let siblingColumns: Column[] = [];

    if (column.parentKey) {
      // 有父列，只获取同一父列下的兄弟列
      const parentColumn = this.layoutManager.getColumnByKey(column.parentKey);
      if (parentColumn && parentColumn.children) {
        siblingColumns = parentColumn.children;
      }
    } else {
      // 顶级列，只获取相同 fixed 属性且允许 reorder 的顶级列
      const allColumns = this.layoutManager.getColumns();
      siblingColumns = allColumns.filter((col: Column) => {
        // 排除不允许 reorder 的列
        if (col.reorderable === false) return false;
        // 只保留相同 fixed 属性的列
        return col.fixed === column.fixed;
      });
    }

    // 计算每个同级列的位置信息
    const leftFixedWidth = this.layoutManager.getLeftFixedWidth();
    const rightFixedWidth = this.layoutManager.getRightFixedWidth();
    const viewportWidth = this.layoutManager.getViewportWidth();

    for (const sibling of siblingColumns) {
      const leafCount = this.getChildLeafCount(sibling);
      const firstLeaf = this.getFirstLeaf(sibling);
      // 使用列对象引用查找索引，避免相同 key 的列返回错误索引
      const firstLeafIndex = firstLeaf ? this.layoutManager.getLeafColumnIndex(firstLeaf) : -1;

      if (firstLeafIndex < 0) continue;

      const width = this.layoutManager.getColumnWidth(sibling);
      const siblingFixed = sibling.fixed;

      // 计算左边界（视口坐标）- 根据每个列自己的 fixed 属性
      let left = 0;

      if (siblingFixed === "left") {
        // 左固定列：从左到右累积
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (col?.fixed === "left") {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
      } else if (siblingFixed === "right") {
        // 右固定列：从右边界开始
        left = viewportWidth - rightFixedWidth;
        for (let i = 0; i < firstLeafIndex; i++) {
          const col = this.layoutManager.getLeafColumn(i);
          if (col?.fixed === "right") {
            left += this.layoutManager.getColumnWidthByIndex(i);
          }
        }
      } else {
        // 普通列：考虑滚动和左固定列
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

  private getFirstLeafKey(column: Column): string | null {
    if (!column.children || column.children.length === 0) {
      return column.key;
    }
    return this.getFirstLeafKey(column.children[0]!);
  }

  private getFirstLeaf(column: Column): Column | null {
    if (!column.children || column.children.length === 0) {
      return column;
    }
    return this.getFirstLeaf(column.children[0]!);
  }

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

  private findParentColumn(leafColumn: Column, targetDepth: number): Column | null {
    if (leafColumn.depth === targetDepth) {
      return leafColumn;
    }

    if (leafColumn.parentKey) {
      const parent = this.layoutManager.getColumnByKey(leafColumn.parentKey);
      if (parent) {
        return this.findParentColumn(parent, targetDepth);
      }
    }

    return null;
  }

  private handleHeaderClick(columnIndex: number, e: MouseEvent): void {
    const column = this.layoutManager.getLeafColumn(columnIndex);
    if (!column) return;

    this.eventEmitter.emit(TableEvents.HEADER_CLICK, column, columnIndex, e);

    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    const viewportPos = this.layoutManager.getLeafHeaderCellViewportPosition(columnIndex);
    if (!viewportPos) return;

    const cellViewportX = viewportPos.x;
    const cellViewportY = viewportPos.y;
    const cellWidth = viewportPos.width;
    const cellHeight = viewportPos.height;

    const hasFilter = this.filterConfig.some((f) => f.column === column.key);
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

  private openFilterDropdown(column: Column, columnIndex: number): void {
    const cellPos = this.layoutManager.getCellPosition(-1, columnIndex);
    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;

    let dropdownX: number;
    if (column.fixed === "left") {
      dropdownX = cellPos.x;
    } else if (column.fixed === "right") {
      dropdownX = cellPos.x;
    } else {
      dropdownX = cellPos.x - this.scrollState.scrollLeft;
    }

    const rowsToUse = this.allRows.length > 0 ? this.allRows : this.rows;
    const uniqueValues = new Map<unknown, { label: string; value: unknown }>();
    for (const row of rowsToUse) {
      const value = row.data[getColumnField(column)];
      if (value !== undefined && value !== null) {
        const key = String(value);
        if (!uniqueValues.has(key)) {
          uniqueValues.set(key, { label: String(value), value });
        }
      }
    }

    const existingFilter = this.filterConfig.find((f) => f.column === column.key);
    const selectedValues = existingFilter ? (existingFilter.value as unknown[]) : [];

    const options = Array.from(uniqueValues.values()).map((item) => ({
      label: item.label,
      value: item.value,
      checked: selectedValues.includes(item.value),
    }));

    this.state.filterDropdown = {
      columnKey: column.key,
      x: dropdownX,
      y: headerHeight,
      width: Math.max(cellPos.width, 200),
      options,
      scrollTop: 0,
      hoveredIndex: -1,
      searchText: "",
    };

    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  private handleSingleSelection(cell: CellPosition): void {
    this.state.selectedCells = [
      {
        start: cell,
        end: cell,
      },
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  private handleRangeSelection(cell: CellPosition): void {
    if (!this.state.selectionStart) {
      this.handleSingleSelection(cell);
      return;
    }

    this.state.selectedCells = [
      {
        start: this.state.selectionStart,
        end: cell,
      },
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  private handleToggleSelection(cell: CellPosition): void {
    const existingIndex = this.state.selectedCells.findIndex((range) => {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);

      return (
        cell.rowIndex >= minRow &&
        cell.rowIndex <= maxRow &&
        cell.columnIndex >= minCol &&
        cell.columnIndex <= maxCol
      );
    });

    if (existingIndex >= 0) {
      this.state.selectedCells.splice(existingIndex, 1);
    } else {
      this.state.selectedCells.push({ start: cell, end: cell });
    }

    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  private scrollToCell(cell: CellPosition): void {
    const targetScrollTop = this.layoutManager.getScrollOffsetForRow(cell.rowIndex);
    const targetScrollLeft = this.layoutManager.getScrollOffsetForColumn(cell.columnIndex);

    if (
      targetScrollTop !== this.scrollState.scrollTop ||
      targetScrollLeft !== this.scrollState.scrollLeft
    ) {
      this.scrollState.scrollLeft = targetScrollLeft;
      this.scrollState.scrollTop = targetScrollTop;
      this.eventEmitter.emit(TableEvents.SCROLL, targetScrollLeft, targetScrollTop);
    }
  }

  private moveSelection(rowDelta: number, colDelta: number): void {
    if (this.state.selectedCells.length === 0) return;

    const leafColumns = this.layoutManager.getLeafColumns();
    const cell = this.state.selectedCells[0]!.start;
    const newRow = clamp(cell.rowIndex + rowDelta, 0, this.rows.length - 1);
    const newCol = clamp(cell.columnIndex + colDelta, 0, leafColumns.length - 1);

    const newCell: CellPosition = { rowIndex: newRow, columnIndex: newCol };
    this.handleSingleSelection(newCell);
    this.scrollToCell(newCell);
  }

  /**
   * 获取编辑配置
   * 优先级：editRender > render 返回的编辑配置 > null（走默认逻辑）
   */
  private getEditConfig(column: Column, row: Row, rowIndex: number): EditRenderResult | null {
    const value = row.data[getColumnField(column)];

    // 优先使用 editRender
    if (column.editRender) {
      try {
        const result = column.editRender(value, row, rowIndex);
        if (result) return result;
      } catch (error) {
        console.error("Error in editRender:", error);
      }
    }

    // 其次使用 render 返回的结果中的编辑配置
    if (column.render) {
      try {
        const result = column.render(value, row, column, rowIndex);
        if (
          result &&
          result.type &&
          result.type !== "custom" &&
          result.type !== "button" &&
          result.type !== "buttons" &&
          result.type !== "image" &&
          result.type !== "progress" &&
          result.type !== "link"
        ) {
          return {
            type: result.type,
            input: result.input,
            select: result.select,
            tags: result.tags,
            date: result.date,
            checkbox: result.checkbox,
            radio: result.radio,
            switch: result.switch,
          };
        }
      } catch (error) {
        console.error("Error in render:", error);
      }
    }

    // 返回 null，走默认逻辑（根据 column.type 推断）
    return null;
  }

  startEditing(cell: CellPosition, inputConfig?: InputConfig): void {
    const validated = this.validateCellForEditing(cell);
    if (!validated) return;

    this.state.editingCell = cell;
    this.eventEmitter.emit(TableEvents.EDIT_START, this.getCellInfo(cell)!, inputConfig);
  }

  startSelectEditing(cell: CellPosition, selectConfig?: SelectConfig): void {
    const validated = this.validateCellForEditing(cell);
    if (!validated) return;

    if (!selectConfig) return;

    this.state.tooltip = null;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const canvasRect = this.canvas.getBoundingClientRect();

    const dropdownX = this.getCellViewportX(cellPos, validated.column);

    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
    const optionsCount = selectConfig.options?.length ?? 0;
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    let dropdownY = cellPos.y - this.scrollState.scrollTop + cellPos.height;
    let showAbove = false;

    if (dropdownY + dropdownHeight > canvasRect.height) {
      dropdownY = cellPos.y - this.scrollState.scrollTop - dropdownHeight;
      showAbove = true;
    }

    this.state.dropdown = {
      cell,
      config: selectConfig,
      x: dropdownX,
      y: dropdownY,
      width: cellPos.width,
      scrollTop: 0,
      hoveredIndex: -1,
      showAbove,
    };

    this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
  }

  startTagsEditing(cell: CellPosition, tagsConfig: TagsConfig): void {
    const validated = this.validateCellForEditing(cell);
    if (!validated) return;

    if (!tagsConfig.options || tagsConfig.options.length === 0) return;

    this.state.tooltip = null;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const canvasRect = this.canvas.getBoundingClientRect();

    const dropdownX = this.getCellViewportX(cellPos, validated.column);

    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
    const optionsCount = tagsConfig.options.length;
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    let dropdownY = cellPos.y - this.scrollState.scrollTop + cellPos.height;
    let showAbove = false;

    if (dropdownY + dropdownHeight > canvasRect.height) {
      dropdownY = cellPos.y - this.scrollState.scrollTop - dropdownHeight;
      showAbove = true;
    }

    this.state.dropdown = {
      cell,
      config: { value: null, options: [] },
      x: dropdownX,
      y: dropdownY,
      width: cellPos.width,
      scrollTop: 0,
      hoveredIndex: -1,
      type: "tags",
      tagsConfig: {
        ...tagsConfig,
        selectedValues: tagsConfig.selectedValues ?? [],
      },
      showAbove,
    };

    this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
  }

  startDateEditing(cell: CellPosition, dateConfig: DateConfig): void {
    const validated = this.validateCellForEditing(cell);
    if (!validated) return;

    this.state.tooltip = null;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const canvasRect = this.canvas.getBoundingClientRect();

    let dropdownX = this.getCellViewportX(cellPos, validated.column);

    const dropdownHeight = 40 + 28 + 6 * 28 + 16;
    let dropdownY = cellPos.y - this.scrollState.scrollTop + cellPos.height;

    const dropdownWidth = Math.max(cellPos.width, 280);

    if (dropdownX + dropdownWidth > canvasRect.width) {
      dropdownX = canvasRect.width - dropdownWidth - 8;
    }
    if (dropdownX < 0) {
      dropdownX = 8;
    }

    if (dropdownY + dropdownHeight > canvasRect.height) {
      dropdownY = cellPos.y - this.scrollState.scrollTop - dropdownHeight;
    }

    let selectedDate: Date | null = null;
    if (dateConfig.value) {
      selectedDate =
        dateConfig.value instanceof Date ? dateConfig.value : new Date(dateConfig.value);
      if (isNaN(selectedDate.getTime())) {
        selectedDate = null;
      }
    } else if (validated.row.data[getColumnField(validated.column)]) {
      const date = new Date(validated.row.data[getColumnField(validated.column)] as string);
      if (!isNaN(date.getTime())) {
        selectedDate = date;
      }
    }

    const today = new Date();
    const currentYear = selectedDate?.getFullYear() ?? today.getFullYear();
    const currentMonth = selectedDate?.getMonth() ?? today.getMonth();

    this.state.dateDropdown = {
      cell,
      config: dateConfig,
      x: dropdownX,
      y: dropdownY,
      width: dropdownWidth,
      currentYear,
      currentMonth,
      selectedDate,
      hoveredDate: null,
    };

    this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
  }

  startImageEditing(cell: CellPosition, imageConfig: ImageConfig): void {
    const validated = this.validateCellForEditing(cell);
    if (!validated) return;

    this.state.tooltip = null;
    this.state.imageTooltip = null;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const canvasRect = this.canvas.getBoundingClientRect();

    // 计算编辑器位置
    const imgSize = InteractionManager.IMAGE_SIZE;
    const padding = InteractionManager.IMAGE_PADDING;
    const gap = InteractionManager.IMAGE_GAP;
    const imagesPerRow = InteractionManager.IMAGES_PER_ROW;
    const uploadAreaHeight = InteractionManager.IMAGE_UPLOAD_AREA_HEIGHT;
    const maxRows = InteractionManager.IMAGE_MAX_ROWS;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const editorHeight = uploadAreaHeight + maxRows * rowHeight + padding * 2 - gap;

    let editorX = this.getCellViewportX(cellPos, validated.column);

    // 水平位置调整
    if (editorX + editorWidth > canvasRect.width) {
      editorX = canvasRect.width - editorWidth - 8;
    }
    if (editorX < 0) {
      editorX = 8;
    }

    // 垂直位置调整
    let editorY = cellPos.y - this.scrollState.scrollTop + cellPos.height;
    let showAbove = false;
    if (editorY + editorHeight > canvasRect.height) {
      editorY = cellPos.y - this.scrollState.scrollTop - editorHeight;
      showAbove = true;
    }

    // 获取已有图片，判断是单图还是多图模式
    const isSingleImage = !imageConfig.images && !!imageConfig.src;
    const images = imageConfig.images
      ? [...imageConfig.images]
      : imageConfig.src
        ? [imageConfig.src]
        : [];

    this.state.imageEditor = {
      cell,
      x: editorX,
      y: editorY,
      images,
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows,
      showAbove,
      isDragging: false,
      pendingImages: [],
      isSingleImage,
    };

    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_OPEN);
  }

  endEditing(save: boolean): void {
    if (!this.state.editingCell) return;

    const cell = this.state.editingCell;
    const value = this.state.editingValue;

    this.state.editingCell = null;
    this.state.editingValue = null;

    if (save) {
      this.eventEmitter.emit(TableEvents.EDIT_END, this.getCellInfo(cell)!, value);
    }
  }

  clearEditingState(): void {
    this.state.editingCell = null;
    this.state.editingValue = null;
  }

  isEditing(): boolean {
    return this.state.editingCell !== null;
  }

  getDropdown(): DropdownState | null {
    return this.state.dropdown;
  }

  private toggleRowExpand(rowIndex: number): void {
    const row = this.rows[rowIndex];
    if (!row || !row.children) return;

    row.expanded = !row.expanded;
    this.eventEmitter.emit(TableEvents.EXPAND, rowIndex, row.expanded);
  }

  private selectAll(): void {
    if (this.rows.length === 0) return;

    const leafColumns = this.layoutManager.getLeafColumns();
    if (leafColumns.length === 0) return;

    this.state.selectedCells = [
      {
        start: { rowIndex: 0, columnIndex: 0 },
        end: { rowIndex: this.rows.length - 1, columnIndex: leafColumns.length - 1 },
      },
    ];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  clearSelection(): void {
    this.state.selectedCells = [];
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, []);
  }

  resetState(): void {
    this.state.selectedCells = [];
    this.state.editingCell = null;
    this.state.editingValue = null;
    this.state.hoveredCell = null;
    this.state.isSelecting = false;
    this.state.selectionStart = null;
    this.state.isDragging = false;
    this.state.dragType = null;
    this.state.dragTarget = null;
    this.state.tooltip = null;
    this.state.dropdown = null;
    this.state.filterDropdown = null;
    this.state.dateDropdown = null;
    this.sortConfig = [];
    this.filterConfig = [];

    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, []);
  }

  private copySelection(): void {
    if (this.state.selectedCells.length === 0) return;

    const text = this.getSelectedText();
    navigator.clipboard.writeText(text).catch(() => {});
  }

  private getSelectedText(): string {
    const lines: string[] = [];
    const leafColumns = this.layoutManager.getLeafColumns();

    for (const range of this.state.selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);

      for (let row = minRow; row <= maxRow; row++) {
        const rowData: string[] = [];
        for (let col = minCol; col <= maxCol; col++) {
          const column = leafColumns[col];
          if (!column) {
            rowData.push("");
            continue;
          }

          const row_ = this.rows[row];
          if (!row_) {
            rowData.push("");
            continue;
          }

          const cellText = getCellDisplayText(column, row_, row);
          rowData.push(cellText);
        }
        lines.push(rowData.join("\t"));
      }
    }

    return lines.join("\n");
  }

  setScrollPosition(scrollLeft: number, scrollTop: number): void {
    this.scrollState.scrollLeft = clamp(scrollLeft, 0, this.scrollState.maxScrollLeft);
    this.scrollState.scrollTop = clamp(scrollTop, 0, this.scrollState.maxScrollTop);
    this.eventEmitter.emit(
      TableEvents.SCROLL,
      this.scrollState.scrollLeft,
      this.scrollState.scrollTop,
    );
  }

  updateMaxScroll(maxScrollLeft: number, maxScrollTop: number): void {
    this.scrollState.maxScrollLeft = maxScrollLeft;
    this.scrollState.maxScrollTop = maxScrollTop;
  }

  setColumns(columns: Column[]): void {
    this.columns = columns;
  }

  setRows(rows: Row[]): void {
    this.rows = rows;
  }

  setAllRows(rows: Row[]): void {
    this.allRows = rows;
  }

  setSortConfig(config: SortConfig[]): void {
    this.sortConfig = config;
  }

  setFilterConfig(config: FilterConfig[]): void {
    this.filterConfig = config;
  }

  setExpandColumnKey(key: string | null): void {
    this.expandColumnKey = key;
  }

  getFilterDropdown(): FilterDropdownState | null {
    return this.state.filterDropdown;
  }

  getDateDropdown(): DateDropdownState | null {
    return this.state.dateDropdown;
  }

  getButtonsDropdown(): ButtonsDropdownState | null {
    return this.state.buttonsDropdown;
  }

  getImageTooltip(): ImageTooltipState | null {
    return this.state.imageTooltip;
  }

  getImageEditor(): ImageEditorState | null {
    return this.state.imageEditor;
  }

  applyFilter(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey, options } = this.state.filterDropdown;
    const checkedOptions = options.filter((o) => o.checked);

    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
    }

    if (checkedOptions.length > 0 && checkedOptions.length < options.length) {
      this.filterConfig.push({
        column: columnKey,
        operator: "in",
        value: checkedOptions.map((o) => o.value),
      });
    }

    this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    this.state.filterDropdown = null;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
  }

  clearFilter(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey } = this.state.filterDropdown;
    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
    }

    this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    this.state.filterDropdown = null;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
  }

  getScrollState(): ScrollState {
    return { ...this.scrollState };
  }

  getInteractionState(): InteractionState {
    return { ...this.state };
  }

  getSelectedCells(): CellPosition[] {
    const cells: CellPosition[] = [];

    for (const range of this.state.selectedCells) {
      const { minRow, maxRow, minCol, maxCol } = this.getNormalizedRange(range);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          cells.push({ rowIndex: row, columnIndex: col });
        }
      }
    }

    return cells;
  }

  getSelectedRows(): number[] {
    const rows = new Set<number>();

    for (const range of this.state.selectedCells) {
      const { minRow, maxRow } = this.getNormalizedRange(range);

      for (let row = minRow; row <= maxRow; row++) {
        rows.add(row);
      }
    }

    return Array.from(rows);
  }

  setSelectedCells(cells: CellPosition[]): void {
    this.state.selectedCells = cells.map((cell) => ({
      start: cell,
      end: cell,
    }));
    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, [...this.state.selectedCells]);
  }

  updateConfig(_selection: SelectionConfig, editing: EditingConfig): void {
    this.editingConfig = editing;
  }

  private switchAnimationRunning = false;

  private startSwitchAnimationLoop(): void {
    if (this.switchAnimationRunning) return;
    this.switchAnimationRunning = true;
    this.runSwitchAnimationLoop();
  }

  private runSwitchAnimationLoop(): void {
    if (!this.switchAnimationRunning || this.isDestroyed) return;

    const animationDuration = 200;
    const now = Date.now();
    let hasActiveAnimations = false;

    this.state.switchAnimations.forEach((animation, key) => {
      const elapsed = now - animation.startTime;
      const totalDistance = Math.abs(animation.targetProgress - animation.startProgress);
      const fullDuration = animationDuration * totalDistance;
      let rawProgress = elapsed / fullDuration;
      rawProgress = Math.max(0, Math.min(1, rawProgress));

      const displayProgress =
        animation.startProgress +
        (animation.targetProgress - animation.startProgress) * rawProgress;
      animation.progress = displayProgress;

      if (rawProgress >= 1) {
        this.state.switchAnimations.delete(key);
      } else {
        hasActiveAnimations = true;
      }
    });

    this.eventEmitter.emit(TableEvents.SWITCH_ANIMATION_UPDATE);

    if (hasActiveAnimations) {
      requestAnimationFrame(() => this.runSwitchAnimationLoop());
    } else {
      this.switchAnimationRunning = false;
    }
  }

  getSwitchAnimations(): Map<string, SwitchAnimationState> {
    return this.state.switchAnimations;
  }

  destroy(): void {
    this.isDestroyed = true;
    this.unbindEvents();
    this.unbindDocumentEvents();
    // 清理动画状态，防止内存泄漏
    this.state.switchAnimations.clear();
    this.state.buttonHoverStates.clear();
    // 重置动画运行标志
    this.switchAnimationRunning = false;
    this.buttonHoverAnimationRunning = false;
  }
}
