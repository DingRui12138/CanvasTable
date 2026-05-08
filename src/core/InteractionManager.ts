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
  InputConfig,
  SelectConfig,
  DropdownState,
  TagsConfig,
  ScrollbarState,
  FilterConfig,
  FilterDropdownState,
  FilterMode,
  ButtonsDropdownState,
  ImageTooltipState,
  ImageEditorState,
  ContextMenuState,
  HeaderContextMenuState,
  ButtonHoverState,
  DateConfig,
  DateDropdownState,
  SwitchAnimationState,
  ImageConfig,
  EditRenderResult,
  ColorPickerConfig,
  ColorPickerDropdownState,
  ContextMenuItem,
  CanvasTableLocale,
} from "../types";
import { LayoutManager } from "./LayoutManager";
import { DataManager } from "./DataManager";
import { EventEmitter } from "./EventEmitter";
import {
  clamp,
  getCellDisplayText,
  getRenderResult,
  resolveDisabled,
  getColumnField,
  getColumnFilterOptions,
  searchFilterOptions,
} from "../utils";
import { TableEvents } from "../constants/events";
import {
  EditingHandler,
  DropdownHandler,
  SelectionHandler,
  NavigationHandler,
  ContextMenuHandler,
  ImageHandler,
  HeaderHandler,
  ControlClickHandler,
  ButtonAnimationHandler,
  TooltipHandler,
  HandlerContext,
} from "./handlers";
import { zhCN } from "../locale";

interface InteractionEvents {
  cellClick: [CellInfo, MouseEvent];
  cellDblClick: [CellInfo, MouseEvent];
  cellHover: [CellInfo | null, MouseEvent];
  headerHover: [string | undefined];
  rowClick: [Row, number, MouseEvent];
  rowDblClick: [Row, number, MouseEvent];
  selectionChange: [CellRange[]];
  editStart: [CellInfo, InputConfig?];
  selectEditStart: [CellInfo, SelectConfig?];
  editEnd: [CellInfo, unknown];
  scroll: [number, number];
  columnResize: [Column, number];
  sortChange: [SortConfig[]];
  filterChange: [FilterConfig[]];
  expand: [Row, number, boolean];
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
  rowAddAbove: [Row];
  rowAddBelow: [Row];
  rowDelete: [Row];
  rowPinChange: [Row, "top" | "bottom" | null];
  columnReorder: [number, number];
  columnReorderDrag: [];
  rowResizeDrag: [];
  rowHeightChange: [Row, number, number];
  columnSwap: [string, string]; // fromKey, toKey
  imageClick: [CellInfo, string, MouseEvent];
  progressChange: [CellInfo, number];
  ratingChange: [CellInfo, number];
  loadMore: [{ startIndex: number; scrollTop: number; direction: "down" | "up" }];
  [key: string]: unknown[];
}

export class InteractionManager {
  // 下拉菜单常量
  private static readonly DROPDOWN_ITEM_HEIGHT = 32;
  private static readonly DROPDOWN_MAX_VISIBLE = 8;

  // 图片编辑器常量 (用于 ImageHandler 和其他图片相关操作)
  static readonly IMAGE_SIZE = 64;
  static readonly IMAGE_PADDING = 8;
  static readonly IMAGE_GAP = 8;
  static readonly IMAGES_PER_ROW = 4;
  static readonly IMAGE_UPLOAD_AREA_HEIGHT = 60;
  static readonly IMAGE_MAX_ROWS = 3;

  private state: InteractionState;
  private scrollState: ScrollState;
  private scrollbarState: ScrollbarState;
  private layoutManager: LayoutManager;
  private eventEmitter: EventEmitter<InteractionEvents>;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private editingConfig: EditingConfig;
  private dataManager!: DataManager;
  private sortConfig: SortConfig[] = [];
  private filterConfig: FilterConfig[] = [];
  private expandColumnKey: string | null = null;
  private isDestroyed = false;

  // Handler instances
  private editingHandler!: EditingHandler;
  private dropdownHandler!: DropdownHandler;
  private selectionHandler!: SelectionHandler;
  private navigationHandler!: NavigationHandler;
  private contextMenuHandler!: ContextMenuHandler;
  private imageHandler!: ImageHandler;
  private headerHandler!: HeaderHandler;
  private controlClickHandler!: ControlClickHandler;
  private buttonAnimationHandler!: ButtonAnimationHandler;
  private tooltipHandler!: TooltipHandler;

  // Data accessors via DataManager
  private get rows(): Row[] {
    return this.dataManager.getRows();
  }

  private get allRows(): Row[] {
    return this.dataManager.getAllRows();
  }

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

  // 懒加载相关
  private lazyLoadEnabled: boolean = false;
  private lazyLoadThreshold: number = 5;
  private isLoadingMore: boolean = false;
  private hasMoreData: boolean = true; // 是否还有更多数据
  private rowHeightResizeEnabled: boolean = false;
  private rowResizable: boolean | ((row: Row, rowIndex: number) => boolean) = true;
  private enableRowPinning: boolean = false;
  private rowPinnable: boolean | ((row: Row) => boolean) = true;
  private locale: CanvasTableLocale;
  private handlerContext: HandlerContext | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    layoutManager: LayoutManager,
    dataManager: DataManager,
    eventEmitter: EventEmitter<InteractionEvents>,
    _selectionConfig: SelectionConfig,
    editingConfig: EditingConfig,
    locale: CanvasTableLocale = zhCN,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.layoutManager = layoutManager;
    this.dataManager = dataManager;
    this.eventEmitter = eventEmitter;
    this.editingConfig = editingConfig;
    this.locale = locale;

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
      colorDropdown: null,
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

    // Initialize handlers
    this.initHandlers();

    this.bindEvents();
  }

  /**
   * Initialize handler instances
   */
  private initHandlers(): void {
    const context: HandlerContext = {
      state: this.state,
      scrollState: this.scrollState,
      layoutManager: this.layoutManager,
      dataManager: this.dataManager,
      canvas: this.canvas,
      ctx: this.ctx,
      expandColumnKey: this.expandColumnKey,
      locale: this.locale,
    };
    this.handlerContext = context;

    this.editingHandler = new EditingHandler(context, this.eventEmitter, this.editingConfig);
    this.dropdownHandler = new DropdownHandler(context, this.eventEmitter);
    this.selectionHandler = new SelectionHandler(context, this.eventEmitter);
    this.navigationHandler = new NavigationHandler(
      context,
      this.eventEmitter,
      this.selectionHandler,
      this.editingConfig,
    );
    this.contextMenuHandler = new ContextMenuHandler(context, this.eventEmitter);
    this.imageHandler = new ImageHandler(context, this.eventEmitter);
    this.headerHandler = new HeaderHandler(
      context,
      this.eventEmitter,
      this.sortConfig,
      this.filterConfig,
    );
    this.controlClickHandler = new ControlClickHandler(context, this.eventEmitter);
    this.buttonAnimationHandler = new ButtonAnimationHandler(context, this.eventEmitter);
    this.tooltipHandler = new TooltipHandler(context, this.eventEmitter);
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

  private getCellViewportY(rowIndex: number): number {
    return this.layoutManager.getCellViewportY(rowIndex, this.scrollState.scrollTop);
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
      const menuClick = this.contextMenuHandler.handleContextMenuClick(e);
      if (menuClick) return;
      this.state.contextMenu = null;
      this.eventEmitter.emit(TableEvents.CONTEXT_MENU_CLOSE);
      return;
    }

    if (this.state.headerContextMenu) {
      const menuClick = this.contextMenuHandler.handleHeaderContextMenuClick(e);
      if (menuClick) return;
      this.state.headerContextMenu = null;
      this.eventEmitter.emit(TableEvents.HEADER_CONTEXT_MENU_CLOSE);
      return;
    }

    if (this.state.filterDropdown) {
      const filterClick = this.dropdownHandler.handleFilterDropdownClick(e);
      if (filterClick) return;
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
      return;
    }

    if (this.state.dateDropdown) {
      const dateClick = this.dropdownHandler.handleDateDropdownClick(e);
      if (dateClick) return;
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE);
      return;
    }

    if (this.state.colorDropdown) {
      const colorClick = this.dropdownHandler.handleColorDropdownClick(e);
      if (colorClick) return;
      this.state.colorDropdown = null;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE);
      return;
    }

    if (this.state.dropdown) {
      const dropdownClick = this.dropdownHandler.handleDropdownClick(e);
      if (dropdownClick) return;
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
      return;
    }

    if (this.state.buttonsDropdown) {
      const dropdownClick = this.dropdownHandler.handleButtonsDropdownClick(e);
      if (dropdownClick) return;
      this.state.buttonsDropdown = null;
      return;
    }

    if (this.state.imageTooltip) {
      const dropdownClick = this.imageHandler.handleImageTooltipClick(e);
      if (dropdownClick) return;
      this.state.imageTooltip = null;
      // 不 return，继续处理后续点击逻辑
    }

    if (this.state.imageEditor) {
      const editorClick = this.imageHandler.handleImageEditorClick(e);
      if (editorClick === "upload") {
        this.triggerFileInput();
        return;
      }
      if (editorClick === "inside") {
        return;
      }
      // editorClick === "outside" - close editor
      this.imageHandler.commitImageEditorChanges();
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
          const handled = this.headerHandler.handleHeaderMouseDown(
            hitResult.headerCell.colIndex ?? -1,
            e,
          );
          if (!handled) {
            // Leaf header click outside drag handle - handle header click
            this.headerHandler.handleHeaderClick(hitResult.headerCell.colIndex ?? -1, e);
          }
        }
        return;

      case "cell":
        if (
          this.rowHeightResizeEnabled &&
          hitResult.isRowResizeHandle &&
          hitResult.resizeRowIndex !== undefined &&
          this.isRowResizable(hitResult.resizeRowIndex)
        ) {
          const row = this.rows[hitResult.resizeRowIndex];
          if (!row) return;

          const startHeight = this.layoutManager.getRowHeightByIndex(hitResult.resizeRowIndex);
          this.state.isDragging = true;
          this.state.dragType = "row-resize";
          this.state.rowResizeState = {
            rowIndex: hitResult.resizeRowIndex,
            startY: e.clientY,
            startHeight,
            displayHeight: startHeight,
          };
          this.canvas.style.cursor = "ns-resize";
          this.bindDocumentEvents();
          return;
        }
        if (hitResult.cell && this.handleControlClick(hitResult.cell, e)) {
          return;
        }
        if (hitResult.cell) {
          if (e.shiftKey && this.state.selectedCells.length > 0) {
            this.selectionHandler.handleRangeSelection(hitResult.cell);
          } else if (e.ctrlKey || e.metaKey) {
            this.selectionHandler.handleToggleSelection(hitResult.cell);
          } else {
            this.selectionHandler.handleSingleSelection(hitResult.cell);
            this.state.isSelecting = true;
            this.state.selectionStart = hitResult.cell;
          }
        }
        return;

      case "outside":
        return;
    }
  };

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

      await this.imageHandler.handleFileUpload(Array.from(files));
    };

    input.click();
  }

  private handleDragOver = (e: DragEvent): void => {
    this.imageHandler.handleDragOver(e);
  };

  private handleDragLeave = (e: DragEvent): void => {
    this.imageHandler.handleDragLeave(e);
  };

  private handleDrop = async (e: DragEvent): Promise<void> => {
    await this.imageHandler.handleDrop(e);
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

    this.closeAllDropdowns();

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
    const hit = this.layoutManager.getRowHitAtViewportPosition(
      viewportX,
      viewportY,
      this.scrollState.scrollTop,
    );

    if (!hit) return;
    if (hit.band === "summary-top" || hit.band === "summary-bottom") return;

    const row = hit.row as Row;
    const items = this.getRowContextMenuItems(row);

    const canvasRect = this.canvas.getBoundingClientRect();
    const menuWidth = 140;
    const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
    const menuHeight = items.length * itemHeight;

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
      row,
      hoveredIndex: -1,
      items,
    };

    this.eventEmitter.emit(TableEvents.CONTEXT_MENU_OPEN);
  };

  getContextMenu(): ContextMenuState | null {
    return this.contextMenuHandler.getContextMenu();
  }

  getHeaderContextMenu(): HeaderContextMenuState | null {
    return this.contextMenuHandler.getHeaderContextMenu();
  }

  private handleDocumentMouseMove = (e: MouseEvent): void => {
    if (
      this.state.isDragging &&
      this.state.dragType === "row-resize" &&
      this.state.rowResizeState
    ) {
      const { min, max } = this.layoutManager.getRowHeightBounds();
      const deltaY = e.clientY - this.state.rowResizeState.startY;
      this.state.rowResizeState.displayHeight = clamp(
        this.state.rowResizeState.startHeight + deltaY,
        min,
        max,
      );
      this.eventEmitter.emit(TableEvents.ROW_RESIZE_DRAG);
      return;
    }

    if (this.state.filterDropdown?.isScrollbarDragging) {
      const { options, scrollbarDragStartY, scrollbarDragStartScrollTop } =
        this.state.filterDropdown;
      if (!options) return;

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
    if (
      this.state.isDragging &&
      this.state.dragType === "row-resize" &&
      this.state.rowResizeState
    ) {
      const { rowIndex, displayHeight } = this.state.rowResizeState;
      const row = this.rows[rowIndex];
      if (row) {
        this.eventEmitter.emit(TableEvents.ROW_HEIGHT_CHANGE, row, displayHeight, rowIndex);
      }
      this.state.isDragging = false;
      this.state.dragType = null;
      this.state.rowResizeState = undefined;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      return;
    }

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
      this.contextMenuHandler.handleContextMenuHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.headerContextMenu) {
      this.contextMenuHandler.handleHeaderContextMenuHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.dropdown) {
      this.dropdownHandler.handleDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.buttonsDropdown) {
      this.dropdownHandler.handleButtonsDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.imageTooltip) {
      const inDropdown = this.imageHandler.handleImageTooltipHover(e);
      if (inDropdown) {
        this.canvas.style.cursor = "pointer";
        return;
      }
      // 鼠标不在 dropdown 区域内，关闭 dropdown
      this.state.imageTooltip = null;
      // 继续处理其他事件
    }

    if (this.state.imageEditor) {
      const inEditor = this.imageHandler.handleImageEditorHover(e);
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
      this.dropdownHandler.handleFilterDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.dateDropdown) {
      this.dropdownHandler.handleDateDropdownHover(e);
      this.canvas.style.cursor = "pointer";
      return;
    }

    if (this.state.colorDropdown) {
      this.dropdownHandler.handleColorDropdownHover(e);
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
        this.eventEmitter.emit(TableEvents.COLUMN_RESIZE, column, newWidth);
      }
      return;
    }

    // 进度条拖拽处理
    if (
      this.state.isDragging &&
      this.state.dragType === "progress-drag" &&
      this.state.progressDragState
    ) {
      this.handleProgressDragMove(e);
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
              const newSiblingColumns = this.headerHandler.calculateSiblingColumns(dragColumn);
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
        this.selectionHandler.handleRangeSelection(hitResult.cell);
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
        this.headerHandler.handleHeaderHover(hitResult.headerCell, viewportX, viewportY);
      }
      return;
    }

    if (
      hitResult.region === "cell" &&
      hitResult.rowHit &&
      (hitResult.rowHit.band === "summary-top" || hitResult.rowHit.band === "summary-bottom")
    ) {
      this.canvas.style.cursor = "default";
      this.state.hoveredCell = null;
      this.tooltipHandler.checkSummaryTooltip(hitResult.rowHit);
      return;
    }

    if (hitResult.region === "cell" && hitResult.cell) {
      if (
        this.rowHeightResizeEnabled &&
        hitResult.isRowResizeHandle &&
        hitResult.resizeRowIndex !== undefined &&
        this.isRowResizable(hitResult.resizeRowIndex)
      ) {
        this.canvas.style.cursor = "ns-resize";
        this.state.tooltip = null;
        return;
      }

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
      this.checkTooltip(cell);
    }
  };

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
    const cellViewportY = this.getCellViewportY(cell.rowIndex);

    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;

    const buttonHeight =
      renderResult.button.size === "small" ? 24 : renderResult.button.size === "large" ? 40 : 32;
    const buttonY = (cellPos.height - buttonHeight) / 2;

    // 计算按钮宽度：与 Renderer 保持一致
    const text = renderResult.button.text ?? this.locale.cell.buttonText;
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

  private startButtonHoverAnimationLoop = (): void => {
    this.buttonAnimationHandler.startButtonHoverAnimationLoop();
  };

  getButtonHoverStates = (): Map<string, ButtonHoverState> => {
    return this.buttonAnimationHandler.getButtonHoverStates();
  };

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
    const cellViewportY = this.getCellViewportY(cell.rowIndex);

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

    if (resolveDisabled(column.disabled, row, column)) {
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
    const cellViewportY = this.getCellViewportY(cell.rowIndex);
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
      const text = btn.text ?? this.locale.cell.buttonText;
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

  private checkTooltip = (cell: { rowIndex: number; columnIndex: number } | null): void => {
    this.tooltipHandler.checkTooltip(cell);
  };

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
    const cellViewportY = this.getCellViewportY(cell.rowIndex);

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
      if (isDisabled) return false;
      const padding = 8;
      const gap = renderResult.buttons.gap ?? 4;
      const maxVisible = renderResult.buttons.maxVisible ?? 3;
      const buttonHeight = 24;
      const buttonY = (cellPos.height - buttonHeight) / 2;

      const visibleButtons = renderResult.buttons.buttons.filter((btn) => btn.visible !== false);
      const displayButtons = visibleButtons.slice(0, maxVisible);

      let currentX = padding;
      for (const btn of displayButtons) {
        const text = btn.text ?? this.locale.cell.buttonText;
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

    if (renderResult.type === "rating" && renderResult.rating) {
      if (isDisabled) return false;

      const config = renderResult.rating;
      const max = config.max ?? 5;
      const starSize = config.starSize ?? 16;

      // 计算星星起始位置（与 Renderer.renderRating 保持一致）
      const totalWidth = max * starSize;
      const startX = (cellPos.width - totalWidth) / 2;
      const startY = (cellPos.height - starSize) / 2;

      // 检测是否在星星区域内
      return (
        relativeX >= startX &&
        relativeX <= startX + totalWidth &&
        relativeY >= startY &&
        relativeY <= startY + starSize
      );
    }

    if (renderResult.type === "color" && renderResult.color) {
      if (isDisabled) return false;

      // 检测是否在颜色块区域内
      const padding = 8;
      const colorBoxSize = Math.min(cellPos.height - padding * 2, 24);
      const colorBoxX = (cellPos.width - colorBoxSize) / 2;
      const colorBoxY = (cellPos.height - colorBoxSize) / 2;

      return (
        relativeX >= colorBoxX &&
        relativeX <= colorBoxX + colorBoxSize &&
        relativeY >= colorBoxY &&
        relativeY <= colorBoxY + colorBoxSize
      );
    }

    return false;
  }

  private handleMouseUp = (_e: MouseEvent): void => {
    if (
      this.state.isDragging &&
      this.state.dragType === "row-resize" &&
      this.state.rowResizeState
    ) {
      const { rowIndex, displayHeight } = this.state.rowResizeState;
      const row = this.rows[rowIndex];
      if (row) {
        this.eventEmitter.emit(TableEvents.ROW_HEIGHT_CHANGE, row, displayHeight, rowIndex);
      }
      this.state.isDragging = false;
      this.state.dragType = null;
      this.state.rowResizeState = undefined;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      return;
    }

    // 进度条拖拽结束
    if (
      this.state.isDragging &&
      this.state.dragType === "progress-drag" &&
      this.state.progressDragState
    ) {
      const { cell, column, row, displayValue } = this.state.progressDragState;

      // 拖拽结束时才更新数据
      if (column && row) {
        row.data[getColumnField(column)] = displayValue;
      }

      this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell)!, displayValue);

      this.state.isDragging = false;
      this.state.dragType = null;
      this.state.progressDragState = undefined;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();
      return;
    }

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
      const { x, y, width, mode, options } = this.state.filterDropdown;

      // Calculate dropdown height based on mode
      const padding = 8;
      const buttonHeight = 36;
      const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;

      let dropdownHeight: number;
      switch (mode) {
        case "search": {
          const inputHeight = 36;
          dropdownHeight = inputHeight + buttonHeight + padding;
          break;
        }
        case "select": {
          const searchHeight = 36;
          const visibleCount = Math.min(options?.length ?? 0, maxVisibleItems);
          const listHeight = visibleCount * itemHeight;
          dropdownHeight = searchHeight + listHeight + buttonHeight;
          break;
        }
        case "range": {
          const inputHeight = 32;
          const gap = 8;
          dropdownHeight = padding + inputHeight + gap + buttonHeight + padding;
          break;
        }
        case "boolean": {
          const boolItemHeight = 32;
          dropdownHeight = boolItemHeight * 3 + buttonHeight;
          break;
        }
        case "dateRange": {
          const inputHeight = 32;
          const gap = 8;
          dropdownHeight = padding + inputHeight + gap + buttonHeight + padding;
          break;
        }
        default:
          dropdownHeight = 200;
      }

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

    const cell = this.layoutManager.getCellAtViewportPosition(
      viewportX,
      viewportY,
      this.scrollState.scrollTop,
    );
    if (!cell || cell.rowIndex < 0) return;

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    const controlTypes = ["checkbox", "radio", "button", "buttons", "switch", "rating"];

    if (column && row) {
      const renderResult = getRenderResult(column, row, cell.rowIndex);

      if (renderResult.type && controlTypes.includes(renderResult.type)) {
        return;
      }

      // progress 类型：可交互时支持双击编辑
      if (renderResult.type === "progress" && renderResult.progress) {
        if (renderResult.progress.interactive !== true) return;
        if (column.editable === false) return;
        if (resolveDisabled(column.disabled, row, column)) return;

        // 进入数值编辑模式
        this.eventEmitter.emit(TableEvents.CELL_DBL_CLICK, this.getCellInfo(cell)!, e);
        this.eventEmitter.emit(TableEvents.ROW_DBL_CLICK, row, cell.rowIndex, e);

        if (this.editingConfig.enabled !== false) {
          this.startEditing(cell, {
            value: String(renderResult.progress.value),
            type: "number",
            placeholder: "0-100",
          });
        }
        return;
      }

      // 颜色类型需要检测点击位置是否在颜色块上
      if (renderResult.type === "color" && renderResult.color) {
        const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
        const cellViewportX = this.getCellViewportX(cellPos, column);
        const cellViewportY = this.getCellViewportY(cell.rowIndex);

        const padding = 8;
        const colorBoxSize = Math.min(cellPos.height - padding * 2, 24);
        const colorBoxX = cellViewportX + (cellPos.width - colorBoxSize) / 2;
        const colorBoxY = cellViewportY + (cellPos.height - colorBoxSize) / 2;

        const isOnColorBox =
          viewportX >= colorBoxX &&
          viewportX <= colorBoxX + colorBoxSize &&
          viewportY >= colorBoxY &&
          viewportY <= colorBoxY + colorBoxSize;

        if (!isOnColorBox) return;
      }

      // 统一检查 editable
      if (column.editable === false) return;

      if (resolveDisabled(column.disabled, row, column)) return;

      this.eventEmitter.emit(TableEvents.CELL_DBL_CLICK, this.getCellInfo(cell)!, e);
      this.eventEmitter.emit(TableEvents.ROW_DBL_CLICK, row, cell.rowIndex, e);

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
          } else if (editConfig.type === "color" && editConfig.color) {
            this.startColorEditing(cell, editConfig.color);
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
          } else if (renderResult.type === "color" && renderResult.color) {
            this.startColorEditing(cell, renderResult.color);
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
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

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
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      const relativeX = viewportX - cellViewportX;
      const relativeY = viewportY - cellViewportY;

      const buttonHeight =
        renderResult.button.size === "small" ? 24 : renderResult.button.size === "large" ? 40 : 32;
      const buttonY = (cellPos.height - buttonHeight) / 2;

      // 计算按钮宽度：与 Renderer 保持一致
      const text = renderResult.button.text ?? this.locale.cell.buttonText;
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
      if (isDisabled) return false;

      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

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
        const text = btn.text ?? this.locale.cell.buttonText;
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
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

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
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

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
      const result = this.handleProgressClick(cell, e, renderResult.progress, column, row);
      if (result) {
        // 点击成功后启动拖拽状态，只更新显示值不更新数据
        const precision = renderResult.progress.precision ?? 0;
        const displayValue =
          precision === 0
            ? Math.round(renderResult.progress.value)
            : Number(renderResult.progress.value.toFixed(precision));
        this.state.isDragging = true;
        this.state.dragType = "progress-drag";
        this.state.progressDragState = {
          cell,
          config: renderResult.progress,
          column,
          row,
          startX: e.clientX,
          startValue: renderResult.progress.value,
          displayValue: displayValue,
        };
        this.canvas.style.cursor = "grabbing";
        this.bindDocumentEvents();
      }
      return result;
    }

    if (renderResult.type === "rating" && renderResult.rating) {
      return this.handleRatingClick(cell, e, renderResult.rating, column, row);
    }

    if (renderResult.type === "color" && renderResult.color) {
      if (isDisabled) return false;

      // 计算颜色块位置，只有点击颜色块才触发
      const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
      const cellViewportX = this.getCellViewportX(cellPos, column);
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      const rect = this.canvas.getBoundingClientRect();
      const clickViewportX = e.clientX - rect.left;
      const clickViewportY = e.clientY - rect.top;

      const padding = 8;
      const colorBoxSize = Math.min(cellPos.height - padding * 2, 24);
      const colorBoxX = cellViewportX + (cellPos.width - colorBoxSize) / 2;
      const colorBoxY = cellViewportY + (cellPos.height - colorBoxSize) / 2;

      // 检查点击是否在颜色块区域内
      if (
        clickViewportX >= colorBoxX &&
        clickViewportX <= colorBoxX + colorBoxSize &&
        clickViewportY >= colorBoxY &&
        clickViewportY <= colorBoxY + colorBoxSize
      ) {
        this.startColorEditing(cell, renderResult.color);
        return true;
      }

      return false;
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
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

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

  private handleProgressClick = (
    cell: CellPosition,
    e: MouseEvent,
    config: import("../types").ProgressConfig,
    column: Column | undefined,
    row: Row | undefined,
  ): boolean => {
    return this.controlClickHandler.handleProgressClick(cell, e, config, column, row);
  };

  private handleProgressDragMove = (e: MouseEvent): void => {
    const dragState = this.state.progressDragState;
    if (!dragState) return;

    const { cell, config, column } = dragState;
    const rect = this.canvas.getBoundingClientRect();
    const clickViewportX = e.clientX - rect.left;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);

    const shape = config.shape ?? "line";

    if (shape === "line") {
      const padding = 8;
      const textPosition = config.textPosition ?? "right";
      const showText = config.showText ?? true;
      const textReservedWidth = showText && textPosition === "right" ? 40 : 0;
      const barWidth = config.width ?? cellPos.width - padding * 2 - textReservedWidth;

      const barX = cellViewportX + padding;
      const relativeX = clickViewportX - barX;

      const precision = config.precision ?? 0;
      const rawValue = Math.max(0, Math.min(100, (relativeX / barWidth) * 100));
      const newValue = precision === 0 ? Math.round(rawValue) : Number(rawValue.toFixed(precision));

      // 只更新显示值，不更新数据
      dragState.displayValue = newValue;
      this.eventEmitter.emit(TableEvents.PROGRESS_DRAG);
    } else if (shape === "circle" || shape === "dashboard") {
      const clickViewportY = e.clientY - rect.top;
      const cellViewportY = this.getCellViewportY(cell.rowIndex);

      let centerYOffset = 0;
      if (shape === "dashboard") {
        centerYOffset = cellPos.height * 0.05;
      }

      const cellCenterX = cellViewportX + cellPos.width / 2;
      const cellCenterY = cellViewportY + cellPos.height / 2 + centerYOffset;

      const dx = clickViewportX - cellCenterX;
      const dy = clickViewportY - cellCenterY;

      let angle = Math.atan2(dy, dx);
      let newValue: number;

      if (shape === "circle") {
        angle = angle + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        newValue = (angle / (Math.PI * 2)) * 100;
      } else {
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;

        if (angle < 0) angle += Math.PI * 2;

        let offset = angle - startAngle;
        if (offset < 0) offset += Math.PI * 2;

        newValue = (offset / totalAngle) * 100;
      }

      newValue = Math.max(0, Math.min(100, newValue));

      const precision = config.precision ?? 0;
      newValue = precision === 0 ? Math.round(newValue) : Number(newValue.toFixed(precision));

      // 只更新显示值，不更新数据
      dragState.displayValue = newValue;
      this.eventEmitter.emit(TableEvents.PROGRESS_DRAG);
    }
  };

  private handleRatingClick = (
    cell: CellPosition,
    e: MouseEvent,
    config: import("../types").RatingConfig,
    column: Column | undefined,
    row: Row | undefined,
  ): boolean => {
    return this.controlClickHandler.handleRatingClick(cell, e, config, column, row);
  };

  private handleExpandIconClick = (cell: CellPosition, e: MouseEvent, row: Row): boolean => {
    return this.controlClickHandler.handleExpandIconClick(cell, e, row);
  };

  private getClickedRadioOption = (
    cell: CellPosition,
    e: MouseEvent,
    options: { label: string; value: unknown; disabled?: boolean }[],
  ): { label: string; value: unknown; disabled?: boolean } | null => {
    return this.controlClickHandler.getClickedRadioOption(cell, e, options);
  };

  private handleWheel = (e: WheelEvent): void => {
    const target = e.target as HTMLElement;
    // 只有鼠标悬停在 TEXTAREA 或 INPUT 上时才不处理表格滚动
    // 这样用户可以在输入时把鼠标移到表格区域滚动查看数据
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
      // 检查输入框是否真的有滚动条且可以滚动
      const element = target as HTMLTextAreaElement | HTMLInputElement;
      const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
      const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;

      if (hasVerticalScrollbar || hasHorizontalScrollbar) {
        // 输入框有滚动条，让输入框自己处理滚动
        return;
      }
      // 输入框没有滚动条，继续处理表格滚动
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
      this.imageHandler.updateImageTooltipPosition();
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
      this.imageHandler.updateImageEditorPosition();
    }

    if (this.state.filterDropdown) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, width, mode, options, scrollTop } = this.state.filterDropdown;

      // 只处理 select 模式的 dropdown 内部滚动
      if (mode === "select" && options) {
        const padding = 8;
        const itemHeight = InteractionManager.DROPDOWN_ITEM_HEIGHT;
        const maxVisibleItems = InteractionManager.DROPDOWN_MAX_VISIBLE;
        const visibleCount = Math.min(options.length, maxVisibleItems);
        const searchHeight = 32;
        const gap = 4;
        const listHeight = visibleCount * itemHeight;
        const dropdownHeight = padding + searchHeight + gap + listHeight + gap + 36;

        const isInDropdown =
          viewportX >= x &&
          viewportX <= x + width &&
          viewportY >= y &&
          viewportY <= y + dropdownHeight;

        if (isInDropdown) {
          // 检查是否主要是纵向滚动
          const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
          const maxScrollTop = Math.max(0, options.length * itemHeight - listHeight);

          if (maxScrollTop > 0 && isMainlyVertical) {
            // 检查是否滚动到边界
            const epsilon = 0.5;
            const atTop = scrollTop <= epsilon && e.deltaY < 0;
            const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;

            if (!atTop && !atBottom) {
              // 未到边界，dropdown 消费滚动事件
              this.state.filterDropdown.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
              e.preventDefault();
              e.stopPropagation();
              this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
              return;
            }
            // 到达边界，事件传递到表格
          }
          // 没有滚动条或主要横向滚动或到达边界，事件传递到表格
        }
      }

      // 其他模式（search、range、boolean、dateRange）继续执行表格滚动
      this.dropdownHandler.updateFilterDropdownPosition();
    }

    if (this.state.dropdown) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, width, type, tagsConfig, config, scrollTop } = this.state.dropdown;
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

      const isInDropdown =
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight;

      if (isInDropdown) {
        // 检查是否主要是纵向滚动
        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        const maxScrollTop = Math.max(0, optionsLength * itemHeight - dropdownHeight);

        if (maxScrollTop > 0 && isMainlyVertical) {
          // 检查是否滚动到边界
          const epsilon = 0.5;
          const currentScrollTop = scrollTop ?? 0;
          const atTop = currentScrollTop <= epsilon && e.deltaY < 0;
          const atBottom = currentScrollTop >= maxScrollTop - epsilon && e.deltaY > 0;

          if (!atTop && !atBottom) {
            // 未到边界，dropdown 消费滚动事件
            this.state.dropdown.scrollTop = clamp(currentScrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
            return;
          }
          // 到达边界，事件传递到表格
        }
        // 没有滚动条或主要横向滚动或到达边界，事件传递到表格
      }

      this.dropdownHandler.updateDropdownPosition();
    }

    // 更新其他 dropdown 位置
    this.updateAllDropdownPositions();

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

      // 懒加载检测
      this.checkLazyLoad(newScrollTop, deltaY);

      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = false;
      }, 150);
    }
  };

  /**
   * 检查是否需要触发懒加载
   */
  private checkLazyLoad(newScrollTop: number, deltaY: number): void {
    if (!this.lazyLoadEnabled) return;
    if (this.isLoadingMore) return;
    if (!this.hasMoreData) return; // 没有更多数据时不再触发
    if (deltaY <= 0) return; // 只在向下滚动时触发

    const rows = this.rows;
    if (rows.length === 0) return;

    const layoutInfo = this.layoutManager.getLayoutInfo();
    const viewportHeight = layoutInfo.viewportHeight;
    const headerHeight = layoutInfo.headerHeight;

    // 动态行高模式：使用实际的 totalHeight
    const totalContentHeight = layoutInfo.totalHeight - headerHeight;
    const scrollBottom = newScrollTop + viewportHeight - headerHeight;
    const distanceToBottom = totalContentHeight - scrollBottom;

    // 使用最后一行的高度作为估算单位
    const lastRowHeight = this.layoutManager.getRowHeightByIndex(rows.length - 1);
    const rowsToBottom = Math.ceil(distanceToBottom / lastRowHeight);

    // 当距离底部小于阈值时触发加载
    if (rowsToBottom <= this.lazyLoadThreshold) {
      this.isLoadingMore = true;
      this.eventEmitter.emit(TableEvents.LOAD_MORE, {
        startIndex: rows.length,
        scrollTop: newScrollTop,
        direction: "down",
      });
    }
  }

  handleExternalWheel(deltaX: number, deltaY: number): void {
    if (this.state.dropdown) {
      this.dropdownHandler.updateDropdownPosition();
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

  private updateTooltipPosition = (): void => {
    this.tooltipHandler.updateTooltipPosition();
  };

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
        this.navigationHandler.handleArrowNavigation(e);
        break;
      case "Enter":
        this.handleEnterKey(e);
        break;
      case "Escape":
        this.selectionHandler.clearSelection();
        break;
      case "a":
      case "A":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.selectionHandler.selectAll();
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
        this.selectionHandler.moveSelection(0, nextCol);
        break;
    }
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
        const controlTypes = [
          "checkbox",
          "radio",
          "button",
          "buttons",
          "switch",
          "rating",
          "progress",
        ];
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

          if (editConfig.type === "color" && editConfig.color) {
            this.startColorEditing(cell, editConfig.color);
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

        if (renderResult.type === "color" && renderResult.color) {
          this.startColorEditing(cell, renderResult.color);
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

  // === Editing methods - delegated to EditingHandler ===

  startEditing(cell: CellPosition, inputConfig?: InputConfig): void {
    this.editingHandler.startEditing(cell, inputConfig);
  }

  startSelectEditing(cell: CellPosition, selectConfig?: SelectConfig): void {
    this.editingHandler.startSelectEditing(cell, selectConfig);
  }

  startTagsEditing(cell: CellPosition, tagsConfig: TagsConfig): void {
    this.editingHandler.startTagsEditing(cell, tagsConfig);
  }

  startDateEditing(cell: CellPosition, dateConfig: DateConfig): void {
    this.editingHandler.startDateEditing(cell, dateConfig);
  }

  startColorEditing(cell: CellPosition, colorConfig: ColorPickerConfig): void {
    this.editingHandler.startColorEditing(cell, colorConfig);
  }

  startImageEditing(cell: CellPosition, imageConfig: ImageConfig): void {
    this.editingHandler.startImageEditing(cell, imageConfig);
  }

  endEditing(save: boolean): void {
    this.editingHandler.endEditing(save);
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
    this.eventEmitter.emit(TableEvents.EXPAND, row, rowIndex, row.expanded);
  }

  clearSelection(): void {
    this.selectionHandler.clearSelection();
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
    this.state.rowResizeState = undefined;
    this.state.dragTarget = null;
    this.state.tooltip = null;
    this.closeAllDropdowns();
    this.sortConfig = [];
    this.filterConfig = [];

    // 清理 Map 缓存，防止内存泄漏
    this.state.switchAnimations.clear();
    this.state.buttonHoverStates.clear();

    this.eventEmitter.emit(TableEvents.SELECTION_CHANGE, []);
  }

  // ==================== Dropdown 公共方法 ====================

  /** 关闭 select/tags dropdown */
  private closeDropdown(): void {
    if (this.state.dropdown) {
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
    }
  }

  /** 关闭 filter dropdown */
  private closeFilterDropdown(): void {
    if (this.state.filterDropdown) {
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
    }
  }

  /** 关闭 date dropdown */
  private closeDateDropdown(): void {
    if (this.state.dateDropdown) {
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE);
    }
  }

  /** 关闭 color dropdown */
  private closeColorDropdown(): void {
    if (this.state.colorDropdown) {
      this.state.colorDropdown = null;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE);
    }
  }

  /** 关闭 buttons dropdown */
  private closeButtonsDropdown(): void {
    if (this.state.buttonsDropdown) {
      this.state.buttonsDropdown = null;
    }
  }

  /** 关闭所有 dropdown */
  private closeAllDropdowns(): void {
    this.closeDropdown();
    this.closeFilterDropdown();
    this.closeDateDropdown();
    this.closeColorDropdown();
    this.closeButtonsDropdown();
  }

  /** 更新所有 dropdown 位置（滚动时调用） */
  private updateAllDropdownPositions(): void {
    // 只更新没有内部滚动逻辑的 dropdown
    // imageTooltip, imageEditor, filterDropdown, dropdown 已在 handleWheel 中单独处理
    if (this.state.dateDropdown) this.dropdownHandler.updateDateDropdownPosition();
    if (this.state.colorDropdown) this.dropdownHandler.updateColorDropdownPosition();
    if (this.state.buttonsDropdown) this.dropdownHandler.updateButtonsDropdownPosition();
    if (this.state.tooltip) this.updateTooltipPosition();
  }

  // ==================== End Dropdown 公共方法 ====================

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

  setSortConfig(config: SortConfig[]): void {
    this.sortConfig = config;
    this.headerHandler.updateSortConfig(config);
  }

  setFilterConfig(config: FilterConfig[]): void {
    this.filterConfig = config;
    this.headerHandler.updateFilterConfig(config);
  }

  setExpandColumnKey(key: string | null): void {
    this.expandColumnKey = key;
  }

  setLazyLoadConfig(enabled: boolean, threshold: number = 5): void {
    this.lazyLoadEnabled = enabled;
    this.lazyLoadThreshold = threshold;
    this.hasMoreData = true; // 重置状态
  }

  setLoadingMore(loading: boolean): void {
    this.isLoadingMore = loading;
  }

  /**
   * 设置是否还有更多数据
   * @param hasMore 是否还有更多数据，false 表示加载完成
   */
  setHasMore(hasMore: boolean): void {
    this.hasMoreData = hasMore;
    if (!hasMore) {
      this.isLoadingMore = true; // 没有更多数据时也停止加载状态
    }
  }

  getFilterDropdown(): FilterDropdownState | null {
    return this.state.filterDropdown;
  }

  getDateDropdown(): DateDropdownState | null {
    return this.state.dateDropdown;
  }

  getColorDropdown(): ColorPickerDropdownState | null {
    return this.state.colorDropdown;
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

    const { columnKey, mode } = this.state.filterDropdown;

    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
    }

    // 根据筛选模式处理不同的筛选值
    let filterValue: unknown = null;
    let hasFilter = false;

    switch (mode) {
      case "search": {
        // 关键字搜索模式
        const searchValue = this.state.filterDropdown.searchValue?.trim();
        if (searchValue) {
          filterValue = searchValue;
          hasFilter = true;
        }
        break;
      }

      case "select": {
        // 多选模式
        const options = this.state.filterDropdown.options;
        if (options) {
          const checkedOptions = options.filter((o) => o.checked);
          if (checkedOptions.length > 0 && checkedOptions.length < options.length) {
            filterValue = checkedOptions.map((o) => o.value);
            hasFilter = true;
          }
        }
        break;
      }

      case "range": {
        // 范围筛选模式
        const minVal = this.state.filterDropdown.minValue;
        const maxVal = this.state.filterDropdown.maxValue;
        if (minVal !== "" || maxVal !== "") {
          filterValue = {
            min: minVal !== "" ? Number(minVal) : undefined,
            max: maxVal !== "" ? Number(maxVal) : undefined,
          };
          hasFilter = true;
        }
        break;
      }

      case "dateRange": {
        // 日期范围筛选模式
        const startDate = this.state.filterDropdown.startDate;
        const endDate = this.state.filterDropdown.endDate;
        if (startDate || endDate) {
          filterValue = {
            start: startDate,
            end: endDate,
          };
          hasFilter = true;
        }
        break;
      }

      case "boolean": {
        // 布尔筛选模式
        const boolValue = this.state.filterDropdown.boolValue;
        if (boolValue !== "all") {
          filterValue = boolValue;
          hasFilter = true;
        }
        break;
      }
    }

    if (hasFilter) {
      this.filterConfig.push({
        column: columnKey,
        operator: this.getOperatorByMode(mode),
        value: filterValue,
      });
    }

    this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    this.state.filterDropdown = null;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
  }

  /**
   * 根据筛选模式获取操作符
   */
  private getOperatorByMode(mode: FilterMode): string {
    switch (mode) {
      case "search":
        return "contains";
      case "select":
        return "in";
      case "range":
        return "between";
      case "dateRange":
        return "dateRange";
      case "boolean":
        return "equals";
      default:
        return "contains";
    }
  }

  clearFilter(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey } = this.state.filterDropdown;
    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
    }

    this.headerHandler.updateFilterConfig(this.filterConfig);
    this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    this.state.filterDropdown = null;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
  }

  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey } = this.state.filterDropdown;

    // 清除 filterConfig 中该列的筛选条件
    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
      this.headerHandler.updateFilterConfig(this.filterConfig);
      this.dataManager.filter(this.filterConfig);
      this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    }

    // 保持 dropdown 打开，只触发重新渲染
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * 处理筛选下拉框的搜索输入
   * 用于延迟加载模式下的选项搜索
   */
  handleFilterDropdownSearch(searchText: string): void {
    if (!this.state.filterDropdown) return;

    const { mode, columnKey } = this.state.filterDropdown;

    if (mode === "select") {
      // 更新搜索文本
      this.state.filterDropdown.searchText = searchText;

      // 查找列配置
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns.find((col) => col.key === columnKey);
      if (!column) return;

      const rowsToUse = this.allRows.length > 0 ? this.allRows : this.rows;

      if (searchText.trim()) {
        // 有搜索文本时，搜索匹配的选项
        const matchedOptions = searchFilterOptions(column, rowsToUse, searchText);
        this.state.filterDropdown.options = matchedOptions.map((opt) => ({
          label: opt.label,
          value: opt.value,
          checked: false,
        }));
        this.state.filterDropdown.isLoading = false;
      } else {
        // 无搜索文本时，使用采样策略
        const sampledOptions = getColumnFilterOptions(column, rowsToUse, 0);
        if (sampledOptions.length === 0 && rowsToUse.length > 0) {
          this.state.filterDropdown.isLoading = true;
          this.state.filterDropdown.options = undefined;
        } else {
          this.state.filterDropdown.options = sampledOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
            checked: false,
          }));
          this.state.filterDropdown.isLoading = false;
        }
      }

      this.state.filterDropdown.scrollTop = 0;
      this.state.filterDropdown.hoveredIndex = -1;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
    } else if (mode === "search") {
      // 关键字搜索模式 - 直接更新搜索值
      this.state.filterDropdown.searchValue = searchText;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
    }
  }

  /**
   * 处理筛选下拉框的范围值更新
   */
  handleFilterDropdownRangeUpdate(minValue: string, maxValue: string): void {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "range") return;

    this.state.filterDropdown.minValue = minValue;
    this.state.filterDropdown.maxValue = maxValue;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * 处理筛选下拉框的布尔值更新
   */
  handleFilterDropdownBooleanUpdate(value: "all" | "true" | "false"): void {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "boolean") return;

    this.state.filterDropdown.boolValue = value;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * 处理筛选下拉框的日期范围更新
   */
  handleFilterDropdownDateRangeUpdate(startDate: Date | null, endDate: Date | null): void {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "dateRange") return;

    this.state.filterDropdown.startDate = startDate;
    this.state.filterDropdown.endDate = endDate;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
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

  setRowHeightResizeEnabled(enabled: boolean): void {
    this.rowHeightResizeEnabled = enabled;
  }

  setRowResizable(
    resizable: boolean | ((row: Row, rowIndex: number) => boolean) | undefined,
  ): void {
    this.rowResizable = resizable ?? true;
  }

  setRowPinningEnabled(enabled: boolean): void {
    this.enableRowPinning = enabled;
  }

  setRowPinnable(pinnable: boolean | ((row: Row) => boolean) | undefined): void {
    this.rowPinnable = pinnable ?? true;
  }

  setLocale(locale: CanvasTableLocale): void {
    this.locale = locale;
    if (this.handlerContext) {
      this.handlerContext.locale = locale;
    }
  }

  private isRowPinnable(row: Row): boolean {
    if (typeof this.rowPinnable === "function") {
      return this.rowPinnable(row);
    }
    return this.rowPinnable;
  }

  private getRowContextMenuItems(row: Row): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];
    const pinPosition = this.layoutManager.getRowPinPosition(row);

    if (this.enableRowPinning && this.isRowPinnable(row)) {
      if (pinPosition !== "top") {
        items.push({ key: "pin-top", text: this.locale.contextMenu.pinTop });
      }
      if (pinPosition !== "bottom") {
        items.push({ key: "pin-bottom", text: this.locale.contextMenu.pinBottom });
      }
      if (pinPosition) {
        items.push({ key: "unpin", text: this.locale.contextMenu.unpin });
      }
    }

    items.push(
      { key: "add-above", text: this.locale.contextMenu.addRowAbove },
      { key: "add-below", text: this.locale.contextMenu.addRowBelow },
      { key: "delete", text: this.locale.contextMenu.deleteRow, danger: true },
    );

    return items;
  }

  private isRowResizable(rowIndex: number): boolean {
    if (this.rowResizable === false) {
      return false;
    }

    if (this.rowResizable === true) {
      return true;
    }

    const row = this.rows[rowIndex];
    return row ? this.rowResizable(row, rowIndex) : false;
  }

  private startSwitchAnimationLoop = (): void => {
    this.buttonAnimationHandler.startSwitchAnimationLoop();
  };

  getSwitchAnimations = (): Map<string, SwitchAnimationState> => {
    return this.buttonAnimationHandler.getSwitchAnimations();
  };

  destroy(): void {
    this.isDestroyed = true;
    this.unbindEvents();
    this.unbindDocumentEvents();
    this.buttonAnimationHandler.setDestroyed(true);
    this.buttonAnimationHandler.clearAllAnimations();
  }
}
