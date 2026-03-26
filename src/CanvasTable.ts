import {
  CanvasTableProps,
  CanvasTableAPI,
  TableData,
  Row,
  Column,
  CellPosition,
  CellInfo,
  CellRange,
  SortConfig,
  FilterConfig,
  ViewConfig,
  ExportOptions,
  LayoutInfo,
  TableTheme,
  SelectionConfig,
  EditingConfig,
  VirtualScrollConfig,
  ThemeMode,
  WatermarkConfig,
} from "./types";
import { DataManager } from "./core/DataManager";
import { LayoutManager } from "./core/LayoutManager";
import { Renderer } from "./core/Renderer";
import { InteractionManager } from "./core/InteractionManager";
import { EditorManager } from "./core/EditorManager";
import { EventEmitter } from "./core/EventEmitter";
import { DEFAULT_THEME, DARK_THEME } from "./theme";
import { arrayToCsv, debounce, getColumnField } from "./utils";
import { TableEvents as Events } from "./constants/events";

interface TableEvents {
  load: [TableData];
  error: [Error];
  change: [unknown[]];
  sort: [SortConfig[]];
  filter: [FilterConfig[]];
  select: [CellRange[]];
  cellClick: [CellInfo, MouseEvent];
  cellDblClick: [CellInfo, MouseEvent];
  cellHover: [CellInfo | null, MouseEvent];
  headerHover: [string | undefined];
  rowClick: [number, MouseEvent];
  rowDblClick: [number, MouseEvent];
  headerClick: [Column, number, MouseEvent];
  scroll: [number, number];
  columnResize: [string, number];
  columnReorder: [number, number];
  columnReorderDrag: [];
  columnHide: [string];
  columnShow: [string];
  editStart: [CellInfo, import("./types").InputConfig?];
  editEnd: [CellInfo, unknown];
  dateEditStart: [CellInfo, import("./types").DateConfig?];
  dateEditEnd: [CellInfo, string];
  dateDropdownOpen: [];
  dateDropdownClose: [];
  dateDropdownHover: [];
  dateSelect: [CellInfo, string];
  contextMenuOpen: [];
  contextMenuClose: [];
  contextMenuHover: [];
  switchAnimationUpdate: [];
  buttonHoverAnimationUpdate: [];
  rowAddAbove: [number];
  rowAddBelow: [number];
  rowDelete: [number];
  expand: [number, boolean];
  checkboxChange: [CellInfo, boolean];
  radioChange: [CellInfo, unknown];
  switchChange: [CellInfo, boolean];
  buttonClick: [CellInfo, string | undefined];
  imageClick: [CellInfo, string, MouseEvent];
  progressChange: [CellInfo, number];
  undo: [];
  redo: [];
  [key: string]: unknown[];
}

export class CanvasTable implements CanvasTableAPI {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private props: CanvasTableProps;

  private dataManager: DataManager;
  private layoutManager: LayoutManager;
  private renderer: Renderer;
  private interactionManager: InteractionManager;
  private editorManager: EditorManager;
  private eventEmitter: EventEmitter<TableEvents>;

  private theme: TableTheme;
  private themeMode: ThemeMode;
  private mediaQuery: MediaQueryList | null = null;
  private isDestroyed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  private scheduledRender: (() => void) | null = null;

  constructor(container: HTMLElement | string, props: CanvasTableProps) {
    if (typeof container === "string") {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = container;
    }

    this.props = props;
    this.themeMode = props.themeMode ?? "light";
    this.theme = this.resolveTheme();

    if (this.themeMode === "auto") {
      this.setupAutoThemeDetection();
    }

    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "block";
    this.container.appendChild(this.canvas);

    this.eventEmitter = new EventEmitter<TableEvents>();
    this.setupEventHandlers();

    const virtualScrollConfig: VirtualScrollConfig = {
      enabled: props.virtualScroll?.enabled ?? true,
      rowBufferSize: props.virtualScroll?.rowBufferSize ?? props.bufferSize ?? 5,
      columnBufferSize: props.virtualScroll?.columnBufferSize ?? 2,
    };
    if (props.virtualScroll?.estimatedRowHeight !== undefined) {
      virtualScrollConfig.estimatedRowHeight = props.virtualScroll.estimatedRowHeight;
    }
    if (props.virtualScroll?.estimatedColumnWidth !== undefined) {
      virtualScrollConfig.estimatedColumnWidth = props.virtualScroll.estimatedColumnWidth;
    }

    const selectionConfig: SelectionConfig = props.selection ?? {
      mode: "cell",
      multi: true,
    };

    const editingConfig: EditingConfig = props.editing ?? {
      enabled: true,
      mode: "dblclick",
    };

    this.dataManager = new DataManager(props.rowKey);
    this.layoutManager = new LayoutManager(virtualScrollConfig, this.theme);
    this.layoutManager.setShowRowNumbers(props.showRowNumbers === true);
    this.renderer = new Renderer(this.canvas, this.theme, this.layoutManager);

    if (props.watermark) {
      this.renderer.setWatermarkConfig(props.watermark);
    }

    this.interactionManager = new InteractionManager(
      this.canvas,
      this.layoutManager,
      this.eventEmitter as unknown as EventEmitter,
      selectionConfig,
      editingConfig,
    );
    this.interactionManager.setGetScrollbarBounds(() => {
      const scrollState = this.interactionManager.getScrollState();
      return this.renderer.getScrollbarBounds(
        scrollState.scrollLeft,
        scrollState.scrollTop,
        scrollState.maxScrollLeft,
        scrollState.maxScrollTop,
      );
    });
    this.editorManager = new EditorManager(
      this.container,
      this.canvas,
      this.layoutManager,
      this.eventEmitter as unknown as EventEmitter,
      this.theme,
    );

    this.editorManager.setOnScrollCallback((deltaX: number, deltaY: number) => {
      this.interactionManager.handleExternalWheel(deltaX, deltaY);
    });

    this.setupInternalEventListeners();
    this.setupResizeObserver();
    this.initialize();
  }

  private setupInternalEventListeners(): void {
    this.eventEmitter.on(Events.SCROLL, (scrollLeft: unknown, scrollTop: unknown) => {
      this.editorManager.setScroll(scrollLeft as number, scrollTop as number);
      this.editorManager.updatePosition();
      this.render();
    });

    this.eventEmitter.on(Events.COLUMN_RESIZE, () => {
      const columns = this.dataManager.getColumns();
      const rows = this.dataManager.getRows();
      this.layoutManager.calculateLayout(columns, rows);
      this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop(),
      );
      this.render();
    });

    this.eventEmitter.on(Events.COLUMN_REORDER, (_fromIndex: unknown, _toIndex: unknown) => {
      const fromIndex = _fromIndex as number;
      const toIndex = _toIndex as number;

      this.dataManager.reorderColumns(fromIndex, toIndex);

      const columns = this.dataManager.getColumns();
      const rows = this.dataManager.getRows();
      this.layoutManager.calculateLayout(columns, rows);

      if (this.props.onColumnReorder) {
        const columnKeys = columns.map((col) => col.key);
        this.props.onColumnReorder(columnKeys);
      }

      this.render();
    });

    this.eventEmitter.on(Events.COLUMN_REORDER_DRAG, () => {
      this.render();
    });

    this.eventEmitter.on(Events.COLUMN_SWAP, (_fromKey: unknown, _toKey: unknown) => {
      const fromKey = _fromKey as string;
      const toKey = _toKey as string;

      this.dataManager.swapColumnsByKey(fromKey, toKey);

      const columns = this.dataManager.getColumns();
      const rows = this.dataManager.getRows();
      this.layoutManager.calculateLayout(columns, rows);

      this.render();
    });

    this.eventEmitter.on(Events.SORT_CHANGE, (sortConfig: unknown) => {
      const config = sortConfig as SortConfig[];
      this.dataManager.sort(config);
      this.interactionManager.setSortConfig(config);
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.FILTER_CHANGE, (filterConfig: unknown) => {
      const config = filterConfig as FilterConfig[];
      this.dataManager.filter(config);
      this.interactionManager.setFilterConfig(config);
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.FILTER_DROPDOWN_OPEN, () => {
      this.render();
    });

    this.eventEmitter.on(Events.FILTER_DROPDOWN_CLOSE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.SELECTION_CHANGE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.CELL_CLICK, (cell, _event) => {
      if (cell.rowIndex >= 0) {
        this.eventEmitter.emit(Events.ROW_CLICK, cell.rowIndex, _event);
      }
    });

    this.eventEmitter.on(Events.CELL_DBL_CLICK, (cell, _event) => {
      if (cell.rowIndex >= 0) {
        this.eventEmitter.emit(Events.ROW_DBL_CLICK, cell.rowIndex, _event);
      }
    });

    this.eventEmitter.on(Events.CELL_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.HEADER_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.CHECKBOX_CHANGE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.RADIO_CHANGE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.SWITCH_CHANGE, (_cell: unknown, _checked: unknown) => {
      const cell = _cell as CellPosition;
      const checked = _checked as boolean;
      if (this.props.onSwitchChange) {
        this.props.onSwitchChange(cell, checked);
      }
      this.render();
    });

    this.eventEmitter.on(Events.SWITCH_ANIMATION_UPDATE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.BUTTON_HOVER_ANIMATION_UPDATE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.EDIT_START, (_cell: unknown, _inputConfig: unknown) => {
      const cell = _cell as CellPosition;
      const inputConfig = _inputConfig as import("./types").InputConfig | undefined;
      this.editorManager.startEditing(cell, inputConfig);
      this.render();
    });

    this.eventEmitter.on(Events.SELECT_CHANGE, (_cell: unknown, _value: unknown) => {
      const cell = _cell as CellPosition;
      const value = _value;
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[cell.columnIndex];

      if (column) {
        this.dataManager.updateCell(cell.rowIndex, column.key, value, getColumnField(column));
      }

      if (this.props.onSelectChange) {
        this.props.onSelectChange(cell, value);
      }

      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(
      Events.TAGS_CHANGE,
      (_cell: unknown, _values: unknown, _multiple?: unknown) => {
        const cell = _cell as CellPosition;
        const values = _values as string[];
        const isMultiple = _multiple as boolean;
        const leafColumns = this.layoutManager.getLeafColumns();
        const column = leafColumns[cell.columnIndex];

        if (column) {
          const valueToStore = isMultiple ? values : (values[0] ?? "");
          this.dataManager.updateCell(
            cell.rowIndex,
            column.key,
            valueToStore,
            getColumnField(column),
          );
        }

        if (this.props.onTagsChange) {
          this.props.onTagsChange(cell, values);
        }

        this.updateLayout();
        this.render();
      },
    );

    this.eventEmitter.on(Events.EXPAND, (_rowIndex: unknown, _expanded: unknown) => {
      this.dataManager.toggleRowExpand(_rowIndex as number);
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.DROPDOWN_OPEN, () => {
      this.render();
    });

    this.eventEmitter.on(Events.DROPDOWN_CLOSE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.DROPDOWN_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.DATE_DROPDOWN_OPEN, () => {
      this.render();
    });

    this.eventEmitter.on(Events.DATE_DROPDOWN_CLOSE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.DATE_DROPDOWN_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.DATE_SELECT, (_cell: unknown, _value: unknown) => {
      const cell = _cell as CellPosition;
      const value = _value as string;
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[cell.columnIndex];

      if (column) {
        this.dataManager.updateCell(cell.rowIndex, column.key, value, getColumnField(column));
      }

      this.interactionManager.clearEditingState();
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.CONTEXT_MENU_OPEN, () => {
      this.render();
    });

    this.eventEmitter.on(Events.CONTEXT_MENU_CLOSE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.CONTEXT_MENU_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.HEADER_CONTEXT_MENU_OPEN, () => {
      this.render();
    });

    this.eventEmitter.on(Events.HEADER_CONTEXT_MENU_CLOSE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.HEADER_CONTEXT_MENU_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.COLUMN_HIDE, (_columnKey: unknown) => {
      const columnKey = _columnKey as string;
      this.hideColumnInternal(columnKey);
    });

    this.eventEmitter.on(Events.COLUMN_SHOW, (_columnKey: unknown) => {
      const columnKey = _columnKey as string;
      this.showColumnInternal(columnKey);
    });

    this.eventEmitter.on(Events.ROW_ADD_ABOVE, (_rowIndex: unknown) => {
      const rowIndex = _rowIndex as number;
      const columns = this.dataManager.getColumns();
      const emptyRow = this.props.createRowData
        ? this.props.createRowData(columns)
        : this.createDefaultRowData(columns);
      this.dataManager.addRow(emptyRow, rowIndex);
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.ROW_ADD_BELOW, (_rowIndex: unknown) => {
      const rowIndex = _rowIndex as number;
      const columns = this.dataManager.getColumns();
      const emptyRow = this.props.createRowData
        ? this.props.createRowData(columns)
        : this.createDefaultRowData(columns);
      this.dataManager.addRow(emptyRow, rowIndex + 1);
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.ROW_DELETE, (_rowIndex: unknown) => {
      const rowIndex = _rowIndex as number;
      this.dataManager.deleteRow(rowIndex);
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.UNDO, () => {
      this.undo();
    });

    this.eventEmitter.on(Events.REDO, () => {
      this.redo();
    });

    this.eventEmitter.on(
      Events.IMAGE_CLICK,
      (_cell: unknown, _imageSrc: unknown, _event: unknown) => {
        const cell = _cell as CellPosition;
        const imageSrc = _imageSrc as string;
        const event = _event as MouseEvent;
        if (this.props.onImageClick) {
          this.props.onImageClick(cell, imageSrc, event);
        }
      },
    );

    this.eventEmitter.on(Events.IMAGE_TOOLTIP_SCROLL, () => {
      this.render();
    });

    this.eventEmitter.on(Events.IMAGE_TOOLTIP_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.IMAGE_EDITOR_SCROLL, () => {
      this.render();
    });

    this.eventEmitter.on(Events.IMAGE_EDITOR_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.IMAGE_EDITOR_OPEN, () => {
      this.render();
    });

    this.eventEmitter.on(Events.IMAGE_UPLOAD, (_cell: unknown, _url: unknown) => {
      const cell = _cell as CellPosition;
      const url = _url as string;
      if (this.props.onImageUpload) {
        this.props.onImageUpload(cell, url);
      }
    });

    this.eventEmitter.on(
      Events.IMAGE_DELETE,
      (_cell: unknown, _deletedImage: unknown, _index: unknown) => {
        const cell = _cell as CellPosition;
        const deletedImage = _deletedImage as string;
        const index = _index as number;
        if (this.props.onImageDelete) {
          this.props.onImageDelete(cell, deletedImage, index);
        }
      },
    );

    this.eventEmitter.on(Events.EDIT_END, (_cell: unknown, _value: unknown) => {
      const cell = _cell as CellPosition;
      const value = _value;
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[cell.columnIndex];

      if (column) {
        this.dataManager.updateCell(cell.rowIndex, column.key, value, getColumnField(column));
      }

      this.interactionManager.clearEditingState();
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.DATE_EDIT_START, (_cell: unknown, _config: unknown) => {
      const cell = _cell as CellPosition;
      const config = _config as import("./types").DateConfig;
      this.editorManager.startDateEditing(cell, config);
    });

    this.eventEmitter.on(Events.DATE_EDIT_END, (_cell: unknown, _value: unknown) => {
      const cell = _cell as CellPosition;
      const value = _value as string;
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[cell.columnIndex];

      if (column && value) {
        const rows = this.dataManager.getRows();
        const row = rows[cell.rowIndex];
        if (row) {
          row.data[getColumnField(column)] = value;
        }
      }

      this.interactionManager.clearEditingState();
      this.render();
    });
  }

  private setupEventHandlers(): void {
    const handlers = {
      onLoad: this.props.onLoad,
      onError: this.props.onError,
      onChange: this.props.onChange,
      onSort: this.props.onSort,
      onFilter: this.props.onFilter,
      onSelect: this.props.onSelect,
      onCellClick: this.props.onCellClick,
      onCellDblClick: this.props.onCellDblClick,
      onCellHover: this.props.onCellHover,
      onRowClick: this.props.onRowClick,
      onRowDblClick: this.props.onRowDblClick,
      onHeaderClick: this.props.onHeaderClick,
      onScroll: this.props.onScroll,
      onColumnResize: this.props.onColumnResize,
      onColumnReorder: this.props.onColumnReorder,
      onEditStart: this.props.onEditStart,
      onEditEnd: this.props.onEditEnd,
      onExpand: this.props.onExpand,
      onCheckboxChange: this.props.onCheckboxChange,
      onRadioChange: this.props.onRadioChange,
      onButtonClick: this.props.onButtonClick,
      onColumnHide: this.props.onColumnHide,
      onColumnShow: this.props.onColumnShow,
    };

    for (const [event, handler] of Object.entries(handlers)) {
      if (handler) {
        const eventName = event.replace("on", "").replace(/^./, (c) => c.toLowerCase());
        this.eventEmitter.on(eventName as keyof TableEvents, handler as never);
      }
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.container);
    }

    window.addEventListener("resize", this.handleResize);
  }

  private handleResize = debounce((): void => {
    this.resize();
  }, 100);

  private async initialize(): Promise<void> {
    try {
      const rect = this.container.getBoundingClientRect();
      const width = rect.width || (this.props.width as number) || 800;
      const height = rect.height || (this.props.height as number) || 400;

      this.renderer.resize(width, height);
      this.layoutManager.setViewportSize(width, height);

      await this.dataManager.loadData(this.props.data);
      this.dataManager.setColumns(this.props.columns);

      if (this.props.expandColumnKey) {
        this.renderer.setExpandColumnKey(this.props.expandColumnKey);
        this.interactionManager.setExpandColumnKey(this.props.expandColumnKey);
      }

      this.updateLayout();

      const data = {
        rows: this.dataManager.getRows(),
        columns: this.dataManager.getColumns(),
      };
      this.eventEmitter.emit(Events.LOAD, data);

      this.render();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit(Events.ERROR, err);
    }
  }

  private updateLayout(): void {
    const columns = this.dataManager.getColumns();
    const rows = this.dataManager.getRows();
    const allRows = this.dataManager.getAllRows();

    this.layoutManager.calculateLayout(columns, rows);
    this.interactionManager.setColumns(columns);
    this.interactionManager.setRows(rows);
    this.interactionManager.setAllRows(allRows);
    this.editorManager.setColumns(columns);
    this.editorManager.setRows(rows);

    this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop(),
    );
  }

  private render(): void {
    if (this.isDestroyed) return;

    if (this.scheduledRender) {
      return;
    }

    this.scheduledRender = () => {
      this.performRender();
      this.scheduledRender = null;
    };

    requestAnimationFrame(() => {
      if (this.scheduledRender) {
        this.scheduledRender();
      }
    });
  }

  private performRender(): void {
    const columns = this.dataManager.getColumns();
    const rows = this.dataManager.getRows();
    const interactionState = this.interactionManager.getInteractionState();

    if (rows.length === 0) {
      this.renderer.renderEmptyState(
        this.props.emptyText ?? "No data",
        this.dataManager.getSort(),
        this.dataManager.getFilters(),
        interactionState.hoveredHeaderColumnKey,
      );

      const filterDropdown = this.interactionManager.getFilterDropdown();
      if (filterDropdown) {
        this.renderer.renderFilterDropdown(filterDropdown);
      }
      this.renderer.renderWatermark();
      return;
    }

    if (this.dataManager.isLoading()) {
      this.renderer.renderLoadingOverlay();
      this.renderer.renderWatermark();
      return;
    }

    const scrollState = this.interactionManager.getScrollState();

    this.layoutManager.setScrollPosition(scrollState.scrollLeft, scrollState.scrollTop);
    const visibleRange = this.layoutManager.getVisibleRange();

    this.renderer.render(
      columns,
      rows,
      visibleRange,
      scrollState.scrollLeft,
      scrollState.scrollTop,
      {
        hoveredCell: interactionState.hoveredCell,
        selectedCells: interactionState.selectedCells,
        editingCell: interactionState.editingCell,
        sortConfig: this.dataManager.getSort(),
        filterConfig: this.dataManager.getFilters(),
        showHeader: this.props.showHeader !== false,
        stripeRows: this.props.stripeRows !== false,
        dropdown: interactionState.dropdown,
        hoveredHeaderColumnKey: interactionState.hoveredHeaderColumnKey,
        switchAnimations: interactionState.switchAnimations,
        buttonHoverStates: interactionState.buttonHoverStates,
        columnReorderState: interactionState.columnReorderState,
        headerContextMenu: interactionState.headerContextMenu,
        hoveredImageIndex: this.interactionManager.getHoveredImageIndex(),
        hoveredButtonIndex: this.interactionManager.getHoveredButtonIndex(),
      },
    );

    const scrollbarState = this.interactionManager.getScrollbarState();
    this.renderer.renderScrollbars(
      scrollState.scrollLeft,
      scrollState.scrollTop,
      scrollState.maxScrollLeft,
      scrollState.maxScrollTop,
      scrollbarState,
    );

    if (interactionState.tooltip) {
      this.renderer.renderTooltip(interactionState.tooltip);
    }

    const filterDropdown = this.interactionManager.getFilterDropdown();
    if (filterDropdown) {
      this.renderer.renderFilterDropdown(filterDropdown);
    }

    const dateDropdown = this.interactionManager.getDateDropdown();
    if (dateDropdown) {
      this.renderer.renderDateDropdown(dateDropdown);
    }

    const buttonsDropdown = this.interactionManager.getButtonsDropdown();
    if (buttonsDropdown) {
      this.renderer.renderButtonsDropdown(buttonsDropdown);
    }

    const imageTooltip = this.interactionManager.getImageTooltip();
    if (imageTooltip) {
      this.renderer.renderImageTooltip(imageTooltip);
    }

    const imageEditor = this.interactionManager.getImageEditor();
    if (imageEditor) {
      this.renderer.renderImageEditor(imageEditor);
    }

    const contextMenu = this.interactionManager.getContextMenu();
    if (contextMenu) {
      this.renderer.renderContextMenu(contextMenu);
    }

    this.renderer.renderWatermark();
  }

  resize(): void {
    if (this.isDestroyed) return;

    const rect = this.container.getBoundingClientRect();
    const width = rect.width || (this.props.width as number) || 800;
    const height = rect.height || (this.props.height as number) || 400;

    this.renderer.resize(width, height);
    this.layoutManager.setViewportSize(width, height);
    this.updateLayout();
    this.render();
  }

  setData(data: TableData): void {
    this.dataManager
      .loadData(data)
      .then(() => {
        this.interactionManager.setScrollPosition(0, 0);
        this.interactionManager.resetState();
        this.editorManager.destroy();
        this.updateLayout();
        this.render();
      })
      .catch((error) => {
        this.eventEmitter.emit(Events.ERROR, error);
      });
  }

  getData(): TableData {
    return {
      rows: this.dataManager.getRows(),
      columns: this.dataManager.getColumns(),
    };
  }

  getRows(): Row[] {
    return this.dataManager.getRows();
  }

  getRow(rowIndex: number): Row | undefined {
    const rows = this.dataManager.getRows();
    return rows[rowIndex];
  }

  getColumns(): Column[] {
    return this.dataManager.getColumns();
  }

  setColumns(columns: Column[]): void {
    this.dataManager.setColumns(columns);
    this.updateLayout();
    this.render();
  }

  async scrollToRow(rowIndex: number, column?: number): Promise<void> {
    const scrollOffset = this.layoutManager.getScrollOffsetForRow(rowIndex);
    let scrollLeft = this.interactionManager.getScrollState().scrollLeft;

    if (column !== undefined) {
      scrollLeft = this.layoutManager.getScrollOffsetForColumn(column);
    }

    this.interactionManager.setScrollPosition(scrollLeft, scrollOffset);
    this.render();
  }

  scrollTo(scrollLeft: number, scrollTop: number): void {
    this.interactionManager.setScrollPosition(scrollLeft, scrollTop);
    this.render();
  }

  getScrollPosition(): { scrollLeft: number; scrollTop: number } {
    const state = this.interactionManager.getScrollState();
    return {
      scrollLeft: state.scrollLeft,
      scrollTop: state.scrollTop,
    };
  }

  getSelectedCells(): CellPosition[] {
    return this.interactionManager.getSelectedCells();
  }

  getSelectedRows(): number[] {
    return this.interactionManager.getSelectedRows();
  }

  setSelectedCells(cells: CellPosition[]): void {
    this.interactionManager.setSelectedCells(cells);
    this.render();
  }

  setSelectedRows(rows: number[]): void {
    rows.forEach((rowIndex) => {
      this.dataManager.setRowSelected(rowIndex, true);
    });
    this.render();
  }

  clearSelection(): void {
    this.interactionManager.clearSelection();
    this.dataManager.selectAll(false);
    this.render();
  }

  updateCell(rowIndex: number, column: string, value: unknown): void {
    const change = this.dataManager.updateCell(rowIndex, column, value);
    this.eventEmitter.emit(Events.CHANGE, [change]);
    this.render();
  }

  updateRow(rowIndex: number, data: Record<string, unknown>): void {
    const changes = this.dataManager.updateRow(rowIndex, data);
    this.eventEmitter.emit(Events.CHANGE, changes);
    this.render();
  }

  addRow(data: Record<string, unknown>, index?: number): void {
    const change = this.dataManager.addRow(data, index);
    this.eventEmitter.emit(Events.CHANGE, [change]);
    this.updateLayout();
    this.render();
  }

  deleteRow(rowIndex: number): void {
    const change = this.dataManager.deleteRow(rowIndex);
    this.eventEmitter.emit(Events.CHANGE, [change]);
    this.updateLayout();
    this.render();
  }

  sort(configs: SortConfig[]): void {
    this.dataManager.sort(configs);
    this.interactionManager.setSortConfig(configs);
    this.eventEmitter.emit(Events.SORT, configs);
    this.render();
  }

  getSort(): SortConfig[] {
    return this.dataManager.getSort();
  }

  filter(filters: FilterConfig[]): void {
    this.dataManager.filter(filters);
    this.eventEmitter.emit(Events.FILTER, filters);
    this.updateLayout();
    this.render();
  }

  getFilters(): FilterConfig[] {
    return this.dataManager.getFilters();
  }

  clearFilters(): void {
    this.dataManager.clearFilters();
    this.eventEmitter.emit(Events.FILTER, []);
    this.updateLayout();
    this.render();
  }

  async export(options: ExportOptions): Promise<Blob> {
    const data = this.dataManager.exportData({
      includeHeaders: options.includeHeaders ?? true,
      includeHidden: options.includeHidden ?? false,
      selectedOnly: options.selectedOnly ?? false,
    });

    let content: string;
    let mimeType: string;

    switch (options.format) {
      case "csv":
        content = arrayToCsv(data);
        mimeType = "text/csv";
        break;
      case "json":
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        break;
      case "excel":
        content = arrayToCsv(data, "\t");
        mimeType = "application/vnd.ms-excel";
        break;
      default:
        content = arrayToCsv(data);
        mimeType = "text/csv";
    }

    return new Blob([content], { type: mimeType });
  }

  // === 历史记录方法 ===

  /**
   * 撤销上一步操作
   * @returns 是否撤销成功
   */
  undo(): boolean {
    const result = this.dataManager.undo();
    if (result) {
      this.updateLayout();
      this.render();
    }
    return result;
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.dataManager.canUndo();
  }

  /**
   * 重做上一步撤销的操作
   * @returns 是否重做成功
   */
  redo(): boolean {
    const result = this.dataManager.redo();
    if (result) {
      this.updateLayout();
      this.render();
    }
    return result;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.dataManager.canRedo();
  }

  /**
   * 获取历史记录数量
   */
  getHistoryLength(): number {
    return this.dataManager.getHistoryLength();
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.dataManager.clearHistory();
  }

  /**
   * 设置历史记录配置
   */
  setHistoryOptions(options: { maxActions?: number }): void {
    this.dataManager.setHistoryOptions(options);
  }

  hideColumn(columnKey: string): void {
    this.hideColumnInternal(columnKey);
  }

  showColumn(columnKey: string): void {
    this.showColumnInternal(columnKey);
  }

  private showColumnInternal(columnKey: string): void {
    const columns = this.dataManager.getColumns();

    // 查找列并收集所有需要显示的父列 key
    const parentKeys: string[] = [];
    const findColumnAndParents = (cols: Column[], parents: Column[] = []): boolean => {
      for (const col of cols) {
        if (col.key === columnKey) {
          // 收集所有父列的 key
          for (const parent of parents) {
            parentKeys.push(parent.key);
          }
          return true;
        }
        if (col.children && findColumnAndParents(col.children, [...parents, col])) {
          return true;
        }
      }
      return false;
    };

    // 查找前后可见列的 fixed 属性
    const findAdjacentFixed = (
      cols: Column[],
      targetKey: string,
    ): { prevFixed?: "left" | "right"; nextFixed?: "left" | "right" } => {
      let prevFixed: "left" | "right" | undefined;
      let nextFixed: "left" | "right" | undefined;
      let foundTarget = false;

      const traverse = (columns: Column[]): void => {
        for (const col of columns) {
          if (foundTarget && nextFixed === undefined && !col.hidden) {
            if (col.fixed === "left" || col.fixed === "right") {
              nextFixed = col.fixed;
            }
          }
          if (col.key === targetKey) {
            foundTarget = true;
          }
          if (!foundTarget && !col.hidden && col.key !== targetKey) {
            if (col.fixed === "left" || col.fixed === "right") {
              prevFixed = col.fixed;
            }
          }
          if (col.children) {
            traverse(col.children);
          }
          if (foundTarget && nextFixed !== undefined) {
            return; // 已经找到目标列和下一个固定列，停止遍历
          }
        }
      };

      traverse(cols);
      return { prevFixed, nextFixed };
    };

    const setColumnVisible = (cols: Column[]): boolean => {
      for (const col of cols) {
        if (col.key === columnKey || parentKeys.includes(col.key)) {
          col.hidden = false;

          // 如果前后可见列都有相同的 fixed 属性，自动设置该列的 fixed 属性
          if (col.key === columnKey && col.fixed === undefined) {
            const { prevFixed, nextFixed } = findAdjacentFixed(columns, columnKey);
            if (prevFixed !== undefined && prevFixed === nextFixed) {
              col.fixed = prevFixed;
            }
          }

          // 显示该列的所有子列
          const showChildren = (children: Column[]): void => {
            for (const child of children) {
              child.hidden = false;
              if (child.children) {
                showChildren(child.children);
              }
            }
          };
          if (col.children) {
            showChildren(col.children);
          }
          return true;
        }
        if (col.children && setColumnVisible(col.children)) {
          return true;
        }
      }
      return false;
    };

    findColumnAndParents(columns);
    if (setColumnVisible(columns)) {
      this.updateLayout();
      this.render();
      if (this.props.onColumnShow) {
        this.props.onColumnShow(columnKey);
      }
    }
  }

  private hideColumnInternal(columnKey: string): void {
    const columns = this.dataManager.getColumns();

    // 递归隐藏列及其所有子列
    const hideColumnAndChildren = (col: Column): void => {
      col.hidden = true;
      if (col.children) {
        for (const child of col.children) {
          hideColumnAndChildren(child);
        }
      }
    };

    const findAndHideColumn = (cols: Column[]): boolean => {
      for (const col of cols) {
        if (col.key === columnKey) {
          hideColumnAndChildren(col);
          return true;
        }
        if (col.children && findAndHideColumn(col.children)) {
          return true;
        }
      }
      return false;
    };

    if (findAndHideColumn(columns)) {
      this.updateLayout();
      this.render();
      if (this.props.onColumnHide) {
        this.props.onColumnHide(columnKey);
      }
    }
  }

  getViewConfig(): ViewConfig {
    const columns = this.dataManager.getColumns();
    const columnWidths: Record<string, number> = {};

    columns.forEach((col, index) => {
      columnWidths[col.key] = this.layoutManager.getColumnWidthByIndex(index);
    });

    // 收集隐藏的列
    const collectHiddenColumns = (cols: Column[]): string[] => {
      const hidden: string[] = [];
      for (const col of cols) {
        if (col.hidden) {
          hidden.push(col.key);
        }
        if (col.children) {
          hidden.push(...collectHiddenColumns(col.children));
        }
      }
      return hidden;
    };

    return {
      columnWidths,
      columnOrder: columns.map((c) => c.key),
      hiddenColumns: collectHiddenColumns(columns),
      fixedColumns: { left: [], right: [] },
      sort: this.dataManager.getSort(),
      filters: this.dataManager.getFilters(),
    };
  }

  setViewConfig(config: ViewConfig): void {
    if (config.sort) {
      this.dataManager.sort(config.sort);
    }
    if (config.filters) {
      this.dataManager.filter(config.filters);
    }
    if (config.hiddenColumns) {
      const columns = this.dataManager.getColumns();
      const setHidden = (cols: Column[], hiddenKeys: string[]): void => {
        for (const col of cols) {
          col.hidden = hiddenKeys.includes(col.key);
          if (col.children) {
            setHidden(col.children, hiddenKeys);
          }
        }
      };
      setHidden(columns, config.hiddenColumns);
    }
    this.updateLayout();
    this.render();
  }

  refresh(): void {
    this.updateLayout();
    this.render();
  }

  private createDefaultRowData(columns: Column[]): Record<string, unknown> {
    const emptyRow: Record<string, unknown> = {};
    for (const col of columns) {
      const field = getColumnField(col);
      switch (col.type) {
        case "number":
          emptyRow[field] = 0;
          break;
        case "checkbox":
        case "switch":
          emptyRow[field] = false;
          break;
        case "date":
          emptyRow[field] = "";
          break;
        default:
          emptyRow[field] = "";
      }
    }
    return emptyRow;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getLayoutInfo(): LayoutInfo {
    return this.layoutManager.getLayoutInfo();
  }

  getTheme(): TableTheme {
    return { ...this.theme };
  }

  getThemeMode(): ThemeMode {
    return this.themeMode;
  }

  setThemeMode(mode: ThemeMode): void {
    if (this.themeMode === mode) return;

    const wasAuto = this.themeMode === "auto";
    const isAuto = mode === "auto";

    this.themeMode = mode;

    if (wasAuto && !isAuto) {
      this.teardownAutoThemeDetection();
    } else if (!wasAuto && isAuto) {
      this.setupAutoThemeDetection();
    }

    this.theme = this.resolveTheme();
    this.applyTheme();
    this.render();
  }

  setTheme(theme: Partial<TableTheme>): void {
    this.theme = this.resolveTheme(theme);
    this.applyTheme();
    this.render();
  }

  setWatermark(config: WatermarkConfig | null): void {
    this.renderer.setWatermarkConfig(config);
    this.render();
  }

  setExpandColumnKey(key: string | null): void {
    this.renderer.setExpandColumnKey(key);
    this.interactionManager.setExpandColumnKey(key);
    this.render();
  }

  private resolveTheme(customTheme?: Partial<TableTheme>): TableTheme {
    let baseTheme: TableTheme;

    if (this.themeMode === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      baseTheme = isDark ? DARK_THEME : DEFAULT_THEME;
    } else if (this.themeMode === "dark") {
      baseTheme = DARK_THEME;
    } else {
      baseTheme = DEFAULT_THEME;
    }

    const mergedCustomTheme = customTheme ?? this.props.theme;
    if (mergedCustomTheme) {
      return {
        ...baseTheme,
        ...mergedCustomTheme,
        colors: {
          ...baseTheme.colors,
          ...mergedCustomTheme.colors,
          tagColors: {
            ...baseTheme.colors.tagColors,
            ...mergedCustomTheme.colors?.tagColors,
          },
          date: {
            ...baseTheme.colors.date,
            ...mergedCustomTheme.colors?.date,
          },
          input: {
            ...baseTheme.colors.input,
            ...mergedCustomTheme.colors?.input,
          },
          checkbox: {
            ...baseTheme.colors.checkbox,
            ...mergedCustomTheme.colors?.checkbox,
          },
          radio: {
            ...baseTheme.colors.radio,
            ...mergedCustomTheme.colors?.radio,
          },
          button: {
            ...baseTheme.colors.button,
            ...mergedCustomTheme.colors?.button,
          },
          dropdown: {
            ...baseTheme.colors.dropdown,
            ...mergedCustomTheme.colors?.dropdown,
          },
          scrollbar: {
            ...baseTheme.colors.scrollbar,
            ...mergedCustomTheme.colors?.scrollbar,
          },
          indicator: {
            ...baseTheme.colors.indicator,
            ...mergedCustomTheme.colors?.indicator,
          },
          tooltip: {
            ...baseTheme.colors.tooltip,
            ...mergedCustomTheme.colors?.tooltip,
          },
        },
        font: {
          ...baseTheme.font,
          ...mergedCustomTheme.font,
        },
        row: {
          ...baseTheme.row,
          ...mergedCustomTheme.row,
        },
        border: {
          ...baseTheme.border,
          ...mergedCustomTheme.border,
        },
      };
    }

    return { ...baseTheme };
  }

  private applyTheme(): void {
    this.layoutManager.setTheme(this.theme);
    this.renderer.setTheme(this.theme);
    this.editorManager.setTheme(this.theme);
  }

  private setupAutoThemeDetection(): void {
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaQuery.addEventListener("change", this.handleThemeChange);
  }

  private teardownAutoThemeDetection(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener("change", this.handleThemeChange);
      this.mediaQuery = null;
    }
  }

  private handleThemeChange = (): void => {
    if (this.themeMode !== "auto") return;

    this.theme = this.resolveTheme();
    this.applyTheme();
    this.render();
  };

  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    this.teardownAutoThemeDetection();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    window.removeEventListener("resize", this.handleResize);

    this.interactionManager.destroy();
    this.renderer.destroy();
    this.editorManager.destroy();

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.eventEmitter.removeAllListeners();
  }

  on<K extends keyof TableEvents>(event: K, callback: (...args: TableEvents[K]) => void): void {
    this.eventEmitter.on(event, callback as never);
  }

  off<K extends keyof TableEvents>(event: K, callback: (...args: TableEvents[K]) => void): void {
    this.eventEmitter.off(event, callback as never);
  }
}

export default CanvasTable;
