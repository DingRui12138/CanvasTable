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
  CellTypes,
} from "../types";
import { LayoutManager } from "./LayoutManager";
import { DataManager } from "./DataManager";
import { EventEmitter } from "./EventEmitter";
import { EditorRegistry } from "./editors";
import { clamp, getRenderResult, getColumnField, resolveDisabled } from "../utils";
import { TableEvents } from "../constants/events";
import type { CTDropdownOnChange, CTInteractiveRegion } from "./jsx";
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
  ClipboardHandler,
  HoverHandler,
  WheelHandler,
  FilterHandler,
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
  selectChange: [CellInfo, unknown, boolean];
  tagsChange: [CellInfo, string[], boolean];
  dropdownOpen: [];
  dropdownClose: [CellPosition | null];
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
  private clipboardHandler!: ClipboardHandler;
  private hoverHandler!: HoverHandler;
  private wheelHandler!: WheelHandler;
  private filterHandler!: FilterHandler;

  // Data accessors via DataManager
  private get rows(): Row[] {
    return this.dataManager.getRows();
  }

  private resizeColumnIndex: number = -1;
  private resizeStartX: number = 0;
  private resizeStartWidth: number = 0;

  private getScrollbarBounds: () => {
    vertical: { x: number; y: number; width: number; height: number } | null;
    horizontal: { x: number; y: number; width: number; height: number } | null;
  } = () => ({ vertical: null, horizontal: null });

  // 懒加载相关（状态由 WheelHandler 持有）
  private rowHeightResizeEnabled: boolean = false;
  private rowResizable: boolean | ((row: Row, rowIndex: number) => boolean) = true;
  private enableRowPinning: boolean = false;
  private rowPinnable: boolean | ((row: Row) => boolean) = true;
  private locale: CanvasTableLocale;
  private handlerContext: HandlerContext | null = null;
  private editorRegistry: EditorRegistry;
  private jsxInteractiveRegions: CTInteractiveRegion[] = [];
  /** 校验失败时阻止下拉关闭的回调（调用实际 validation hook） */
  private shouldBlockDropdownClose: ((cell: CellPosition) => Promise<boolean>) | null = null;
  /** 校验失败时阻止关闭编辑态的回调（调用实际 commit/validation hook）
   * 接收 mousedown 事件以便在 DOM 编辑器场景下 preventDefault 阻止焦点转移 */
  private shouldBlockEditingClose: ((e?: MouseEvent) => Promise<boolean>) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    layoutManager: LayoutManager,
    dataManager: DataManager,
    eventEmitter: EventEmitter<InteractionEvents>,
    _selectionConfig: SelectionConfig,
    editingConfig: EditingConfig,
    locale: CanvasTableLocale = zhCN,
    editorRegistry: EditorRegistry,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.layoutManager = layoutManager;
    this.dataManager = dataManager;
    this.eventEmitter = eventEmitter;
    this.editingConfig = editingConfig;
    this.locale = locale;
    this.editorRegistry = editorRegistry;

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
      editorRegistry: this.editorRegistry,
      onDragStart: () => this.bindDocumentEvents(),
      onDragEnd: () => this.unbindDocumentEvents(),
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
    this.buttonAnimationHandler = new ButtonAnimationHandler(context, this.eventEmitter);
    this.controlClickHandler = new ControlClickHandler(
      context,
      this.eventEmitter,
      this.editingHandler,
      this.buttonAnimationHandler,
    );
    this.tooltipHandler = new TooltipHandler(context, this.eventEmitter);
    this.clipboardHandler = new ClipboardHandler(context, this.eventEmitter, this.selectionHandler);
    this.hoverHandler = new HoverHandler(context, this.eventEmitter);
    this.wheelHandler = new WheelHandler(
      context,
      this.eventEmitter,
      this.dropdownHandler,
      this.imageHandler,
      this.tooltipHandler,
    );
    this.filterHandler = new FilterHandler(
      context,
      this.eventEmitter,
      this.filterConfig,
      this.headerHandler,
    );
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

  private handleMouseDown = async (e: MouseEvent): Promise<void> => {
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
      // 校验 hook 决定是否阻止关闭日期下拉
      if (this.shouldBlockEditingClose && (await this.shouldBlockEditingClose())) {
        return;
      }
      const dateCell = this.state.dateDropdown.cell;
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE, dateCell);
      return;
    }

    if (this.state.colorDropdown) {
      const colorClick = this.dropdownHandler.handleColorDropdownClick(e);
      if (colorClick) return;
      // 校验 hook 决定是否阻止关闭颜色下拉
      if (this.shouldBlockEditingClose && (await this.shouldBlockEditingClose())) {
        return;
      }
      const colorCell = this.state.colorDropdown.cell;
      this.state.colorDropdown = null;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE, colorCell);
      return;
    }

    if (this.state.dropdown) {
      const dropdownClick = this.dropdownHandler.handleDropdownClick(e);
      if (dropdownClick) return;
      // 校验 hook 决定是否阻止关闭下拉
      const dropdownCell = this.state.dropdown.cell;
      if (
        this.state.dropdown.source !== "jsx" &&
        this.shouldBlockDropdownClose &&
        (await this.shouldBlockDropdownClose(dropdownCell))
      ) {
        return;
      }
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, dropdownCell);
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

    const jsxRegion = this.getJSXInteractiveRegionAt(viewportX, viewportY);
    if (jsxRegion?.type === "dropdown") {
      const config = jsxRegion.props.config as SelectConfig | undefined;
      if (config) {
        this.state.dropdown = {
          cell: {
            rowIndex: jsxRegion.rowIndex ?? -1,
            columnIndex: jsxRegion.colIndex ?? -1,
          },
          config,
          x: jsxRegion.rect.x,
          y: jsxRegion.rect.y + jsxRegion.rect.height,
          width: (jsxRegion.props.width as number | undefined) ?? jsxRegion.rect.width,
          scrollTop: 0,
          hoveredIndex: -1,
          showAbove: jsxRegion.props.placement === "top",
          source: "jsx",
          onChange: jsxRegion.props.onChange as CTDropdownOnChange | undefined,
          row: jsxRegion.row,
          column: jsxRegion.column,
          rowIndex: jsxRegion.rowIndex,
          colIndex: jsxRegion.colIndex,
        };
        this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
        return;
      }
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
        // 校验 hook 决定是否阻止单元格区域交互（不影响滚动条和表头）
        // 只有在编辑态存在时才执行 async 校验，避免每次点击都走 async 流程
        const hadEditingCell = !!this.state.editingCell;
        if (
          hadEditingCell &&
          this.shouldBlockEditingClose &&
          (await this.shouldBlockEditingClose(e))
        ) {
          return;
        }

        // async await 后编辑态可能已关闭（blur/mouseup 在 await 期间触发）
        // 此时不应设置 isSelecting，否则鼠标移动会触发拖拽选区
        const wasInEditing = hadEditingCell;

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
            // 只有从非编辑态进入的点击才开启拖拽选区
            // 从编辑态关闭后进入的点击，用户意图是选择新单元格，不是开始拖拽
            if (!wasInEditing) {
              this.state.isSelecting = true;
              this.state.selectionStart = hitResult.cell;
            }
          }

          const cellInfo = this.getCellInfo(hitResult.cell);
          if (cellInfo) {
            this.eventEmitter.emit(TableEvents.CELL_CLICK, cellInfo, e);
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

  private handleContextMenu = async (e: MouseEvent): Promise<void> => {
    e.preventDefault();

    // 校验 hook 决定是否阻止右键菜单并保留编辑态
    if (this.shouldBlockEditingClose && (await this.shouldBlockEditingClose(e))) {
      return;
    }

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

    const jsxRegion = this.getJSXInteractiveRegionAt(viewportX, viewportY);
    if (jsxRegion?.type === "dropdown") {
      this.canvas.style.cursor = "pointer";
      this.state.tooltip = null;
      return;
    }
    if (jsxRegion?.type === "tooltip") {
      this.canvas.style.cursor = "default";
      const text = String(jsxRegion.props.content ?? "");
      const previous = this.state.tooltip;
      const nextTooltip = {
        cell: {
          rowIndex: jsxRegion.rowIndex ?? -1,
          columnIndex: jsxRegion.colIndex ?? -1,
        },
        x: jsxRegion.rect.x,
        y: jsxRegion.rect.y,
        width: (jsxRegion.props.width as number | undefined) ?? jsxRegion.rect.width,
        content: { type: "text" as const, text },
      };
      this.state.tooltip = nextTooltip;
      const changed =
        !previous ||
        previous.x !== nextTooltip.x ||
        previous.y !== nextTooltip.y ||
        previous.width !== nextTooltip.width ||
        previous.content.type !== "text" ||
        previous.content.text !== text;
      if (changed) {
        this.eventEmitter.emit(TableEvents.CELL_HOVER, null, e);
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
      this.buttonAnimationHandler.updateButtonHoverState(cell, viewportX, viewportY);

      const leafColumns = this.layoutManager.getLeafColumns();
      const column = cell.columnIndex >= 0 ? leafColumns[cell.columnIndex] : undefined;
      const row = cell.rowIndex >= 0 ? this.rows[cell.rowIndex] : undefined;
      const isDisabled = column && row ? resolveDisabled(column.disabled, row, column) : false;

      if (isDisabled) {
        this.canvas.style.cursor = "not-allowed";
      } else if (this.hoverHandler.isClickableElement(cell, viewportX, viewportY)) {
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

      this.hoverHandler.updateImageHoverIndex(cell, viewportX, viewportY);
      this.hoverHandler.updateButtonsHoverIndex(cell, viewportX, viewportY);

      if (this.state.hoveredHeaderColumnKey !== undefined) {
        this.state.hoveredHeaderColumnKey = undefined;
        this.eventEmitter.emit(TableEvents.HEADER_HOVER, undefined);
      }
      this.checkTooltip(cell);
    }
  };

  private clearAllButtonHoverStates(): void {
    this.buttonAnimationHandler.clearAllButtonHoverStates();
  }

  getButtonHoverStates = (): Map<string, ButtonHoverState> => {
    return this.buttonAnimationHandler.getButtonHoverStates();
  };

  getHoveredImageIndex(): number {
    return this.state.hoveredImageIndex ?? -1;
  }

  getHoveredButtonIndex(): number {
    return this.state.hoveredButtonIndex ?? -1;
  }

  private checkTooltip = (cell: { rowIndex: number; columnIndex: number } | null): void => {
    this.tooltipHandler.checkTooltip(cell);
  };

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
      const { cell, displayValue } = this.state.progressDragState;

      this.state.isDragging = false;
      this.state.dragType = null;
      this.canvas.style.cursor = "default";
      this.unbindDocumentEvents();

      // 保留 progressDragState（临时显示值），由提交完成后的 clearProgressDragState 清除。
      // 提交可能包含异步校验，若此处立即清除，期间的重渲染会回退到旧数据造成闪回。
      // 记录本次提交的最终值，用于区分拖拽过程中 mousedown 触发的提前提交（其值不同）。
      this.state.progressDragState.pendingValue = displayValue;
      this.eventEmitter.emit(TableEvents.PROGRESS_CHANGE, this.getCellInfo(cell)!, displayValue);
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

  private handleDblClick = async (e: MouseEvent): Promise<void> => {
    const rect = this.canvas.getBoundingClientRect();
    const viewportX = e.clientX - rect.left;
    const viewportY = e.clientY - rect.top;

    // 校验 hook 决定是否阻止进入新编辑
    if (this.shouldBlockEditingClose && (await this.shouldBlockEditingClose(e))) {
      return;
    }

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

      // 校验 hook 决定是否阻止 dblclick 关闭日期下拉
      if (this.shouldBlockEditingClose && (await this.shouldBlockEditingClose())) {
        return;
      }
      const dateCell = this.state.dateDropdown.cell;
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE, dateCell);
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

      // 校验 hook 决定是否阻止 dblclick 关闭下拉
      const dropdownCell = this.state.dropdown.cell;
      if (
        this.state.dropdown.source !== "jsx" &&
        this.shouldBlockDropdownClose &&
        (await this.shouldBlockDropdownClose(dropdownCell))
      ) {
        return;
      }

      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, null);
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

    const controlTypes = [
      CellTypes.CHECKBOX,
      CellTypes.RADIO,
      CellTypes.BUTTON,
      CellTypes.SWITCH,
      CellTypes.RATING,
    ];

    if (column && row) {
      const renderResult = getRenderResult(column, row, cell.rowIndex);

      if (renderResult.type && controlTypes.includes(renderResult.type)) {
        return;
      }

      // progress 类型：可交互时支持双击编辑
      if (renderResult.type === CellTypes.PROGRESS && renderResult.progress) {
        if (renderResult.progress.interactive !== true) return;
        if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return;

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
      if (renderResult.type === CellTypes.COLOR && renderResult.color) {
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

      // 统一检查 editable + disabled
      if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return;

      this.eventEmitter.emit(TableEvents.CELL_DBL_CLICK, this.getCellInfo(cell)!, e);
      this.eventEmitter.emit(TableEvents.ROW_DBL_CLICK, row, cell.rowIndex, e);

      if (this.editingConfig.enabled !== false) {
        // 优先使用 editRender 返回的编辑配置
        const editConfig = this.getEditConfig(column, row, cell.rowIndex);

        if (editConfig) {
          // 使用 editRender 返回的配置
          if (editConfig.type === CellTypes.SELECT && editConfig.select) {
            this.startSelectEditing(cell, editConfig.select);
          } else if (editConfig.type === CellTypes.TAG && editConfig.tags) {
            this.startTagsEditing(cell, editConfig.tags);
          } else if (editConfig.type === CellTypes.DATE && editConfig.date) {
            this.startDateEditing(cell, editConfig.date);
          } else if (editConfig.type === CellTypes.COLOR && editConfig.color) {
            this.startColorEditing(cell, editConfig.color);
          } else if (editConfig.type === CellTypes.INPUT || !editConfig.type) {
            this.startEditing(cell, editConfig.input);
          } else {
            // 其他类型，使用 input 编辑器
            this.startEditing(cell, editConfig.input);
          }
        } else {
          // 走原有逻辑
          if (renderResult.type === CellTypes.SELECT && renderResult.select) {
            this.startSelectEditing(cell, renderResult.select);
          } else if (
            renderResult.type === CellTypes.TAG &&
            renderResult.tags &&
            renderResult.tags.editable
          ) {
            this.startTagsEditing(cell, renderResult.tags);
          } else if (renderResult.type === CellTypes.DATE && renderResult.date) {
            this.startDateEditing(cell, renderResult.date);
          } else if (renderResult.type === CellTypes.COLOR && renderResult.color) {
            this.startColorEditing(cell, renderResult.color);
          } else if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
            this.startImageEditing(cell, renderResult.image);
          } else {
            this.startEditing(cell, renderResult.input);
          }
        }
      }
    }
  };

  private handleControlClick = (cell: CellPosition, e: MouseEvent): boolean => {
    return this.controlClickHandler.handleControlClick(cell, e);
  };

  private handleProgressDragMove = (e: MouseEvent): void => {
    this.controlClickHandler.handleProgressDragMove(e);
  };

  private handleWheel = (e: WheelEvent): void => {
    this.wheelHandler.handleWheel(e);
  };

  handleExternalWheel(deltaX: number, deltaY: number): void {
    this.wheelHandler.handleExternalWheel(deltaX, deltaY);
  }

  private handleKeyDown = async (e: KeyboardEvent): Promise<void> => {
    if (this.state.editingCell) {
      this.handleEditingKeyDown(e);
      return;
    }

    if (this.state.dropdown) {
      if (e.key === "Escape") {
        const dropdownCell = this.state.dropdown.cell;
        // Escape 总是取消下拉编辑（不提交），与 DOM 编辑器一致
        this.state.dropdown = null;
        this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, dropdownCell);
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
    // DOM 编辑器有自己的 input keydown handler 处理 Enter/Escape/Tab，
    // document keydown 不应重复触发 endEditing，否则会 emit 两个 EDIT_END（第二个用 editingValue=null）
    if (this.isDomEditorActive?.()) {
      // Tab 的 moveSelection 仍需由 InteractionManager 处理（EditorManager 不处理导航）
      if (e.key === "Tab") {
        e.preventDefault();
        const nextCol = e.shiftKey ? -1 : 1;
        this.selectionHandler.moveSelection(0, nextCol);
      }
      return;
    }

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
          CellTypes.CHECKBOX,
          CellTypes.RADIO,
          CellTypes.BUTTON,
          CellTypes.SWITCH,
          CellTypes.RATING,
          CellTypes.PROGRESS,
        ];
        if (renderResult.type && controlTypes.includes(renderResult.type)) {
          if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
            if (this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) {
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
        // 统一检查 editable + disabled
        if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return;

        // 检查 input 的 readonly
        if (renderResult.input?.readonly) return;

        // 优先使用 editRender 返回的编辑配置
        const editConfig = this.getEditConfig(column, row, cell.rowIndex);

        if (editConfig) {
          // 使用 editRender 返回的配置
          if (editConfig.type === CellTypes.SELECT && editConfig.select) {
            this.startSelectEditing(cell, editConfig.select);
            return;
          }
          if (editConfig.type === CellTypes.TAG && editConfig.tags) {
            this.startTagsEditing(cell, editConfig.tags);
            return;
          }
          if (editConfig.type === CellTypes.DATE && editConfig.date) {
            this.startDateEditing(cell, editConfig.date);
            return;
          }

          if (editConfig.type === CellTypes.COLOR && editConfig.color) {
            this.startColorEditing(cell, editConfig.color);
            return;
          }

          this.startEditing(cell, editConfig.input);
          return;
        }

        // 走原有逻辑
        if (renderResult.type === CellTypes.SELECT && renderResult.select) {
          this.startSelectEditing(cell, renderResult.select);
          return;
        }

        if (
          renderResult.type === CellTypes.TAG &&
          renderResult.tags &&
          renderResult.tags.editable
        ) {
          this.startTagsEditing(cell, renderResult.tags);
          return;
        }

        if (renderResult.type === CellTypes.DATE && renderResult.date) {
          this.startDateEditing(cell, renderResult.date);
          return;
        }

        if (renderResult.type === CellTypes.COLOR && renderResult.color) {
          this.startColorEditing(cell, renderResult.color);
          return;
        }

        if (renderResult.type === CellTypes.IMAGE && renderResult.image) {
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
          result.type !== CellTypes.CUSTOM &&
          result.type !== CellTypes.BUTTON &&
          result.type !== CellTypes.IMAGE &&
          result.type !== CellTypes.PROGRESS &&
          result.type !== CellTypes.LINK
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

  /**
   * 清除进度条拖拽的临时显示值（提交完成后调用）
   *
   * 仅在「提交完成的值为拖拽结束时记录的最终值」时才清除，
   * 以避免拖拽过程中 mousedown 触发的提前提交（值不同）或在拖拽进行中误清除。
   *
   * @param cell 提交的单元格；仅当与当前拖拽单元格一致时才清除
   * @param value 提交完成的值；仅当与 pendingValue 一致时才清除
   */
  clearProgressDragState(cell?: CellPosition, value?: number): void {
    const dragState = this.state.progressDragState;
    if (!dragState) return;
    // 拖拽进行中（可能是用户开始的新拖拽）不清理临时显示值
    if (this.state.isDragging && this.state.dragType === "progress-drag") return;
    if (
      cell &&
      (dragState.cell.rowIndex !== cell.rowIndex || dragState.cell.columnIndex !== cell.columnIndex)
    ) {
      return;
    }
    // 只有拖拽结束时的最终提交才清除；mousedown 的提前提交值不同，会被忽略
    if (dragState.pendingValue === undefined || dragState.pendingValue !== value) return;
    this.state.progressDragState = undefined;
  }

  isEditing(): boolean {
    return this.state.editingCell !== null;
  }

  getDropdown(): DropdownState | null {
    return this.state.dropdown;
  }

  setJSXInteractiveRegions(regions: CTInteractiveRegion[]): void {
    this.jsxInteractiveRegions = regions;
  }

  private getJSXInteractiveRegionAt(x: number, y: number): CTInteractiveRegion | undefined {
    for (let i = this.jsxInteractiveRegions.length - 1; i >= 0; i--) {
      const region = this.jsxInteractiveRegions[i]!;
      const rect = region.rect;
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return region;
      }
    }
    return undefined;
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
    this.state.progressDragState = undefined;
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

  /** 关闭 select/tags dropdown（公开方法，供 CanvasTable 在校验成功后调用） */
  closeSelectDropdown(): void {
    this.closeDropdown();
  }

  /** 关闭 select/tags dropdown */
  private closeDropdown(): void {
    if (this.state.dropdown) {
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE, null);
    }
  }

  /** 关闭 filter dropdown */
  private closeFilterDropdown(): void {
    if (this.state.filterDropdown) {
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
    }
  }

  /** 关闭 date dropdown（programmatic，非用户取消） */
  private closeDateDropdown(): void {
    if (this.state.dateDropdown) {
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE, null);
    }
  }

  /** 关闭 color dropdown（programmatic，非用户取消） */
  private closeColorDropdown(): void {
    if (this.state.colorDropdown) {
      this.state.colorDropdown = null;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE, null);
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

  // ==================== End Dropdown 公共方法 ====================

  private copySelection(): void {
    void this.clipboardHandler.copySelection();
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
    // 原地变更，保持与 FilterHandler / HeaderHandler 共享的数组引用
    this.filterConfig.length = 0;
    this.filterConfig.push(...config);
    this.headerHandler.updateFilterConfig(this.filterConfig);
  }

  setExpandColumnKey(key: string | null): void {
    this.expandColumnKey = key;
    // HandlerContext 是构造时的快照，需要同步以保持展开列点击生效
    if (this.handlerContext) {
      this.handlerContext.expandColumnKey = key;
    }
  }

  setLazyLoadConfig(enabled: boolean, threshold: number = 5): void {
    this.wheelHandler.setLazyLoadConfig(enabled, threshold);
  }

  setLoadingMore(loading: boolean): void {
    this.wheelHandler.setLoadingMore(loading);
  }

  /**
   * 设置是否还有更多数据
   * @param hasMore 是否还有更多数据，false 表示加载完成
   */
  setHasMore(hasMore: boolean): void {
    this.wheelHandler.setHasMore(hasMore);
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
    this.filterHandler.applyFilter();
  }

  clearFilter(): void {
    this.filterHandler.clearFilter();
  }

  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue(): void {
    this.filterHandler.resetFilterValue();
  }

  /**
   * 处理筛选下拉框的搜索输入
   * 用于延迟加载模式下的选项搜索
   */
  handleFilterDropdownSearch(searchText: string): void {
    this.filterHandler.handleFilterDropdownSearch(searchText);
  }

  /**
   * 处理筛选下拉框的范围值更新
   */
  handleFilterDropdownRangeUpdate(minValue: string, maxValue: string): void {
    this.filterHandler.handleFilterDropdownRangeUpdate(minValue, maxValue);
  }

  /**
   * 处理筛选下拉框的布尔值更新
   */
  handleFilterDropdownBooleanUpdate(value: "all" | "true" | "false"): void {
    this.filterHandler.handleFilterDropdownBooleanUpdate(value);
  }

  /**
   * 处理筛选下拉框的日期范围更新
   */
  handleFilterDropdownDateRangeUpdate(startDate: Date | null, endDate: Date | null): void {
    this.filterHandler.handleFilterDropdownDateRangeUpdate(startDate, endDate);
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

  setShouldBlockDropdownClose(callback: (cell: CellPosition) => Promise<boolean>): void {
    this.shouldBlockDropdownClose = callback;
  }

  /** 设置 DOM 编辑器活跃状态检查回调，用于避免 keydown 重复触发 endEditing */
  private isDomEditorActive: (() => boolean) | null = null;
  setDomEditorActiveChecker(checker: () => boolean): void {
    this.isDomEditorActive = checker;
  }

  setShouldBlockEditingClose(callback: (e?: MouseEvent) => Promise<boolean>): void {
    this.shouldBlockEditingClose = callback;
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

  getSwitchAnimations = (): Map<string, SwitchAnimationState> => {
    return this.buttonAnimationHandler.getSwitchAnimations();
  };

  destroy(): void {
    this.isDestroyed = true;
    this.wheelHandler.destroy();
    this.unbindEvents();
    this.unbindDocumentEvents();
    this.buttonAnimationHandler.setDestroyed(true);
    this.buttonAnimationHandler.clearAllAnimations();
  }
}
