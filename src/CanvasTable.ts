import {
  CanvasTableProps,
  CanvasTableAPI,
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
  ImageLoadConfig,
  RowPinPosition,
  CanvasTableLocale,
  LocaleConfig,
  ValidationError,
  ValidateResult,
  TooltipState,
} from "./types";
import { DataManager } from "./core/DataManager";
import { LayoutManager } from "./core/LayoutManager";
import { Renderer } from "./core/Renderer";
import { InteractionManager } from "./core/InteractionManager";
import { EditorManager } from "./core/EditorManager";
import { FilterInputManager } from "./core/FilterInputManager";
import { EventEmitter } from "./core/EventEmitter";
import { RenderCache, RowIdManager, ColumnIdManager } from "./core/RenderCache";
import { DEFAULT_THEME, DARK_THEME } from "./theme";
import {
  arrayToCsv,
  buildExcelExportModel,
  createXlsxBlobFromModel,
  debounce,
  getColumnField,
  isPromise,
} from "./utils";
import { TableEvents as Events } from "./constants/events";
import { LoadingOverlay } from "./core/LoadingOverlay";
import { RowPinManager } from "./core/RowPinManager";
import { SummaryManager } from "./core/SummaryManager";
import { EditorRegistry, InteractiveEditorStrategy, DomEditorStrategy } from "./core/editors";
import { resolveLocale } from "./locale";

type CellRenderLocation = {
  rowIndex?: number;
  colIndex?: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type CellRenderSubStepStats = {
  name: string;
  totalTime: number;
  count: number;
  maxTime: number;
};

type CellRenderDetailSnapshot = {
  type: string;
  columnKey: string;
  totalTime: number;
  location: CellRenderLocation;
  branch?: string;
  steps: CellRenderSubStepStats[];
};

type CellRenderStatsSnapshot = {
  totalTime: number;
  count: number;
  maxTime: number;
  maxCell?: CellRenderLocation;
  maxCellDetail?: CellRenderDetailSnapshot;
};

type RendererFrameSnapshot = {
  frameId: number;
  startTime: number;
  totalTime: number;
  cellRenderTime: number;
  nonCellRendererTime: number;
  unaccountedTime: number;
  phases: Map<string, { totalTime: number; count: number; maxTime: number }>;
  rowBandDetails?: Map<
    string,
    {
      totalTime: number;
      count: number;
      maxTime: number;
      maxAt?: CellRenderLocation;
      columnKey?: string;
    }
  >;
  cellsByType: Map<string, Map<string, CellRenderStatsSnapshot>>;
  visibleRows: number;
  visibleColumns: number;
  visibleCells: number;
  scrollTop: number;
  scrollLeft: number;
};

type CanvasTableFrameEntry = {
  frameId: number;
  startTime: number;
  scheduledAt: number;
  scheduledToStartDelay: number;
  rafInterval: number | null;
  totalTime: number;
  dataStateTime: number;
  layoutUpdateTime: number;
  rendererRenderTime: number;
  overlaysTime: number;
  nonRendererTime: number;
  coalescedCount: number;
  phases: Map<string, { totalTime: number; count: number; maxTime: number }>;
  rendererFrame: RendererFrameSnapshot | null;
};

interface TableEvents {
  load: [{ rows: Row[]; columns: Column[] }];
  error: [Error];
  change: [unknown[]];
  sort: [SortConfig[]];
  filter: [FilterConfig[]];
  select: [CellRange[]];
  cellClick: [CellInfo, MouseEvent];
  cellDblClick: [CellInfo, MouseEvent];
  cellHover: [CellInfo | null, MouseEvent];
  headerHover: [string | undefined];
  rowClick: [Row, number, MouseEvent];
  rowDblClick: [Row, number, MouseEvent];
  headerClick: [Column, number, MouseEvent];
  scroll: [number, number];
  columnResize: [Column, number];
  rowResizeDrag: [];
  rowHeightChange: [Row, number, number];
  columnReorder: [number, number];
  columnReorderDrag: [];
  columnHide: [string];
  columnShow: [string];
  editStart: [CellInfo, import("./types").InputConfig?];
  editEnd: [CellInfo, unknown];
  dateEditStart: [CellInfo, import("./types").DateConfig?];
  dateEditEnd: [CellInfo, string];
  dateDropdownOpen: [];
  dateDropdownClose: [CellPosition | null];
  dateDropdownHover: [];
  dateSelect: [CellInfo, string];
  colorDropdownOpen: [];
  colorDropdownClose: [CellPosition | null];
  colorDropdownHover: [];
  dropdownOpen: [];
  dropdownClose: [CellPosition | null];
  dropdownHover: [];
  contextMenuOpen: [];
  contextMenuClose: [];
  contextMenuHover: [];
  switchAnimationUpdate: [];
  buttonHoverAnimationUpdate: [];
  rowAddAbove: [Row];
  rowAddBelow: [Row];
  rowDelete: [Row];
  rowPinChange: [Row, RowPinPosition | null];
  expand: [Row, number, boolean];
  checkboxChange: [CellInfo, boolean];
  radioChange: [CellInfo, unknown];
  switchChange: [CellInfo, boolean];
  buttonClick: [CellInfo, string | undefined];
  imageClick: [CellInfo, string, MouseEvent];
  progressChange: [CellInfo, number];
  ratingChange: [CellInfo, number];
  colorChange: [CellInfo, string];
  selectChange: [CellInfo, unknown, boolean];
  tagsChange: [CellInfo, string[], boolean];
  undo: [];
  redo: [];
  [key: string]: unknown[];
}

export class CanvasTable implements CanvasTableAPI {
  private container: HTMLElement;
  private wrapper: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private props: CanvasTableProps;

  private dataManager: DataManager;
  private layoutManager: LayoutManager;
  private rowPinManager: RowPinManager;
  private renderer: Renderer;
  private interactionManager: InteractionManager;
  private editorManager: EditorManager;
  private editorRegistry: EditorRegistry;
  private filterInputManager: FilterInputManager;
  private eventEmitter: EventEmitter<TableEvents>;
  private loadingOverlay: LoadingOverlay;

  private theme: TableTheme;
  private themeMode: ThemeMode;
  private locale: CanvasTableLocale;
  private mediaQuery: MediaQueryList | null = null;
  private isDestroyed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  private renderCache: RenderCache;
  private rowIdManager: RowIdManager;
  private columnIdManager: ColumnIdManager;

  private scheduledRender: (() => void) | null = null;
  private manualLoading: boolean = false; // 用户手动设置的 loading 状态
  private validationErrorRows: WeakMap<Row, Map<string, ValidationError>> = new WeakMap();
  private pendingValidationCells: Set<string> = new Set();
  private pendingAnimationFrame: number | null = null;
  private forcedValidationTooltipCell: CellPosition | null = null;
  private warningTooltipTimeout: ReturnType<typeof setTimeout> | null = null;

  // CanvasTable 性能监控字段
  private ctPerformanceEnabled: boolean = false;
  private ctFrameHistory: CanvasTableFrameEntry[] = [];
  private static readonly CT_MAX_FRAME_HISTORY = 120;
  private ctFrameCount: number = 0;
  private ctLastRafTime: number | null = null;
  private ctScheduledAt: number | null = null;
  private ctRafInterval: number | null = null;
  private ctScheduledToStartDelay: number = 0;
  private ctCoalescedCount: number = 0;
  private ctCurrentFramePhases: Map<string, { totalTime: number; count: number; maxTime: number }> =
    new Map();

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
    this.locale = resolveLocale(props.locale);
    this.themeMode = props.themeMode ?? "light";
    this.theme = this.resolveTheme();

    if (this.themeMode === "auto") {
      this.setupAutoThemeDetection();
    }

    // 创建 wrapper 容器，用于定位所有浮层元素
    this.wrapper = document.createElement("div");
    this.wrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;
    this.container.appendChild(this.wrapper);

    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = `
      display: block;
      position: relative;
      z-index: 1;
    `;
    this.wrapper.appendChild(this.canvas);

    // 初始化 loading overlay
    this.loadingOverlay = new LoadingOverlay(this.wrapper, this.theme, {
      text: this.props.loadingText ?? this.locale.loadingText,
    });

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
    this.rowPinManager = new RowPinManager();
    this.layoutManager.setRowPinManager(this.rowPinManager);
    this.layoutManager.setShowRowNumbers(props.showRowNumbers === true);
    this.layoutManager.setRowHeightFn(props.rowHeight);
    this.renderer = new Renderer(this.canvas, this.theme, this.layoutManager, this.locale);
    this.renderer.setMultipleSelectSeparator(props.multipleSelectSeparator ?? ", ");
    this.renderer.setJSXUpdateHandlers({
      updateValue: async (rowIndex, column, value) => {
        await this.updateCell(rowIndex, getColumnField(column), value);
      },
      updateField: async (rowIndex, field, value) => {
        await this.updateCell(rowIndex, field, value);
      },
      updateRow: async (rowIndex, data) => {
        await this.updateRow(rowIndex, data);
      },
    });

    // 初始化渲染缓存相关管理器
    this.rowIdManager = this.renderer.getRowIdManager();
    this.columnIdManager = this.renderer.getColumnIdManager();
    this.renderCache = new RenderCache(
      this.rowIdManager,
      this.columnIdManager,
      this.dataManager.getRowVersionManager(),
    );
    this.renderer.setRenderCache(this.renderCache);

    // 设置图片加载完成后的渲染触发回调
    this.renderer.setOnImageLoaded(() => this.render());

    if (props.watermark) {
      this.renderer.setWatermarkConfig(props.watermark);
    }

    if (props.imageLoad) {
      this.renderer.setImageLoadConfig(props.imageLoad);
    }

    this.editorRegistry = new EditorRegistry();
    this.interactionManager = new InteractionManager(
      this.canvas,
      this.layoutManager,
      this.dataManager,
      this.eventEmitter as unknown as EventEmitter,
      selectionConfig,
      editingConfig,
      this.locale,
      this.editorRegistry,
    );
    this.interactionManager.setRowHeightResizeEnabled(props.enableRowHeightResize === true);
    this.interactionManager.setRowResizable(props.rowResizable);
    this.interactionManager.setShouldBlockDropdownClose(async (cell) => {
      // 调用实际校验 hook，使用下拉中的待提交值（而不是 row.data 中已提交的旧值）
      const column = this.layoutManager.getLeafColumn(cell.columnIndex);
      const row = this.dataManager.getRows()[cell.rowIndex];
      if (!column || !row) return false;
      const dropdown = this.interactionManager.getDropdown();
      let value: unknown;
      if (dropdown && dropdown.type === "tags" && dropdown.tagsConfig) {
        // tags 下拉：待提交值是 tagsConfig.selectedValues
        const isMultiple = dropdown.tagsConfig.multiple !== false;
        value = isMultiple
          ? (dropdown.tagsConfig.selectedValues ?? [])
          : (dropdown.tagsConfig.selectedValues?.[0] ?? "");
      } else if (dropdown) {
        // select 下拉（多选）：待提交值是 config.value
        value = dropdown.config.value;
      } else {
        value = row.data[getColumnField(column)];
      }
      const valid = await this.validateEditorCommit(cell, value);
      return !valid;
    });
    this.interactionManager.setShouldBlockEditingClose(async (e?: MouseEvent) => {
      // DOM 编辑器：先 preventDefault 阻止焦点转移（避免 blur），然后手动走 endEditing + beforeCommit
      // beforeCommit 不通过 → 编辑态保持，焦点不丢失
      // beforeCommit 通过 → 编辑态关闭，返回 false 允许后续交互
      const editingCell = this.editorManager.getEditingCell();
      if (editingCell) {
        // 阻止 mousedown 的默认行为（焦点转移），防止 input blur
        if (e) e.preventDefault();
        // 标记跳过后续 handleBlur（防止 blur 竞态触发二次 endEditing）
        this.editorManager.markSkipNextBlur();
        // 手动走提交+校验流程
        const committed = await this.editorManager.endEditing(true);
        if (!committed) {
          // 校验失败：根据 strategy.shouldBlockFocusLoss 决定是否强制取消
          const column = this.layoutManager.getLeafColumn(editingCell.columnIndex);
          if (column) {
            const strategy = this.editorRegistry.getStrategy(column) as DomEditorStrategy;
            const error = this.getValidationError(editingCell);
            if (error && !strategy.shouldBlockFocusLoss(editingCell, error)) {
              // strategy 允许丢失焦点（如 warning 级），强制取消编辑态
              await this.editorManager.endEditing(false);
              return false;
            }
          }
          // 校验失败且不允许关闭 → 编辑态保持，焦点仍在 input
          return true;
        }
        // 校验通过 → 编辑态已关闭，允许后续交互
        return false;
      }
      // 交互式编辑器（select/tags/date/color）：使用下拉中的待提交值校验
      const dropdown = this.interactionManager.getDropdown();
      if (dropdown) {
        const column = this.layoutManager.getLeafColumn(dropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[dropdown.cell.rowIndex];
        if (!column || !row) return false;
        let value: unknown;
        if (dropdown.type === "tags" && dropdown.tagsConfig) {
          const isMultiple = dropdown.tagsConfig.multiple !== false;
          value = isMultiple
            ? (dropdown.tagsConfig.selectedValues ?? [])
            : (dropdown.tagsConfig.selectedValues?.[0] ?? "");
        } else {
          value = dropdown.config.value;
        }
        const valid = await this.validateEditorCommit(dropdown.cell, value);
        return !valid;
      }
      const dateDropdown = this.interactionManager.getDateDropdown();
      if (dateDropdown) {
        const column = this.layoutManager.getLeafColumn(dateDropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[dateDropdown.cell.rowIndex];
        if (!column || !row) return false;
        // date 下拉：待提交值是 selectedDate
        const value = dateDropdown.selectedDate ?? row.data[getColumnField(column)];
        const valid = await this.validateEditorCommit(dateDropdown.cell, value);
        return !valid;
      }
      const colorDropdown = this.interactionManager.getColorDropdown();
      if (colorDropdown) {
        const column = this.layoutManager.getLeafColumn(colorDropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[colorDropdown.cell.rowIndex];
        if (!column || !row) return false;
        // color 下拉：待提交值是 config.value 或 hoveredColor
        const value = colorDropdown.config.value ?? row.data[getColumnField(column)];
        const valid = await this.validateEditorCommit(colorDropdown.cell, value);
        return !valid;
      }
      return false;
    });
    this.interactionManager.setDomEditorActiveChecker(() => this.editorManager.isEditing());
    this.interactionManager.setRowPinningEnabled(props.enableRowPinning === true);
    this.interactionManager.setRowPinnable(props.rowPinnable);
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
      this.wrapper,
      this.canvas,
      this.layoutManager,
      this.eventEmitter as unknown as EventEmitter,
      this.theme,
      this.locale,
      () => this.dataManager.getRows(),
    );

    this.editorManager.setOnScrollCallback((deltaX: number, deltaY: number) => {
      this.interactionManager.handleExternalWheel(deltaX, deltaY);
    });
    this.editorManager.setBeforeCommitCallback((cell, value) =>
      this.validateEditorCommit(cell, value),
    );
    this.editorManager.setCancelCallback((cell) => {
      this.clearValidationErrorForCell(cell);
      // DOM 编辑器生命周期 hook：onCancel
      const column = this.layoutManager.getLeafColumn(cell.columnIndex);
      if (column) {
        const strategy = this.editorRegistry.getStrategy(column) as DomEditorStrategy;
        strategy.onCancel?.(cell);
      }
    });

    this.filterInputManager = new FilterInputManager(
      this.wrapper,
      this.eventEmitter as unknown as EventEmitter,
      this.theme,
      this.locale,
    );

    this.filterInputManager.setOnInputChange((value: string, field: string) => {
      const filterDropdown = this.interactionManager.getFilterDropdown();
      if (filterDropdown) {
        if (field === "searchValue" || field === "searchText") {
          this.interactionManager.handleFilterDropdownSearch(value);
        } else if (field === "minValue") {
          this.interactionManager.handleFilterDropdownRangeUpdate(
            value,
            String(filterDropdown.maxValue ?? ""),
          );
        } else if (field === "maxValue") {
          this.interactionManager.handleFilterDropdownRangeUpdate(
            String(filterDropdown.minValue ?? ""),
            value,
          );
        }
        this.render();
      }
    });

    // 配置懒加载
    if (props.lazyLoad?.enabled) {
      this.interactionManager.setLazyLoadConfig(true, props.lazyLoad.threshold ?? 5);
    }

    this.setupInternalEventListeners();
    this.setupResizeObserver();
    this.initialize();
  }

  private setupInternalEventListeners(): void {
    this.eventEmitter.on(Events.SCROLL, (scrollLeft: unknown, scrollTop: unknown) => {
      this.editorManager.setScroll(scrollLeft as number, scrollTop as number);
      this.editorManager.updatePosition();
      // 滚动时更新筛选输入框位置
      const filterDropdown = this.interactionManager.getFilterDropdown();
      if (filterDropdown) {
        this.filterInputManager.updatePosition(filterDropdown);
      }
      this.render();
    });

    this.eventEmitter.on(Events.COLUMN_RESIZE, () => {
      const columns = this.dataManager.getColumns();
      this.layoutManager.calculateColumnLayoutOnly(columns);
      this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop(),
      );
      this.render();
    });

    this.eventEmitter.on(Events.ROW_RESIZE_DRAG, () => {
      this.render();
    });

    this.eventEmitter.on(
      Events.ROW_HEIGHT_CHANGE,
      (_row: unknown, _newHeight: unknown, _rowIndex: unknown) => {
        const row = _row as Row;
        const newHeight = _newHeight as number;
        void _rowIndex;

        const updatedIncrementally = this.layoutManager.updateRowHeight(row, newHeight);
        if (!updatedIncrementally) {
          const columns = this.dataManager.getColumns();
          const rows = this.dataManager.getRows();
          this.layoutManager.calculateLayout(columns, rows);
        }
        this.interactionManager.updateMaxScroll(
          this.layoutManager.getMaxScrollLeft(),
          this.layoutManager.getMaxScrollTop(),
        );
        this.editorManager.updatePosition();
        this.render();
      },
    );

    this.eventEmitter.on(Events.COLUMN_REORDER, (_fromIndex: unknown, _toIndex: unknown) => {
      const fromIndex = _fromIndex as number;
      const toIndex = _toIndex as number;

      this.dataManager.reorderColumns(fromIndex, toIndex);

      const columns = this.dataManager.getColumns();
      this.updateSummaryRows();
      this.layoutManager.calculateColumnLayoutOnly(columns);

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
      this.updateSummaryRows();
      this.layoutManager.calculateColumnLayoutOnly(columns);

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
      const filterDropdown = this.interactionManager.getFilterDropdown();
      // 只在下拉框打开时创建输入框（通过检查当前是否已有输入框来判断）
      // updateFilterDropdown 会检查模式是否变化，如果没变化就不会重新创建
      this.filterInputManager.updateFilterDropdown(filterDropdown);
      this.render();
    });

    this.eventEmitter.on(Events.FILTER_DROPDOWN_CLOSE, () => {
      this.filterInputManager.updateFilterDropdown(null);
      this.render();
    });

    this.eventEmitter.on(Events.FILTER_DROPDOWN_CONFIRM, () => {
      this.interactionManager.applyFilter();
      this.filterInputManager.updateFilterDropdown(null);
      this.render();
    });

    this.eventEmitter.on(Events.FILTER_DROPDOWN_RESET, () => {
      this.interactionManager.resetFilterValue();
      this.filterInputManager.forceReset();
      this.render();
    });

    this.eventEmitter.on(Events.FILTER_DROPDOWN_CHANGE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.SELECTION_CHANGE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.CELL_CLICK, (cell, _event) => {
      if (cell.rowIndex >= 0) {
        const rows = this.dataManager.getRows();
        const row = rows[cell.rowIndex];
        if (row) {
          this.eventEmitter.emit(Events.ROW_CLICK, row, cell.rowIndex, _event);
        }
      }
    });

    this.eventEmitter.on(Events.CELL_DBL_CLICK, (cell, _event) => {
      if (cell.rowIndex >= 0) {
        const rows = this.dataManager.getRows();
        const row = rows[cell.rowIndex];
        if (row) {
          this.eventEmitter.emit(Events.ROW_DBL_CLICK, row, cell.rowIndex, _event);
        }
      }
    });

    this.eventEmitter.on(Events.CELL_HOVER, (_cell: unknown) => {
      this.render();
    });

    this.eventEmitter.on(Events.HEADER_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.CHECKBOX_CHANGE, async (_cell: unknown, _checked: unknown) => {
      await this.handleEditorCommit(
        _cell as CellPosition,
        _checked as boolean,
        this.props.onCheckboxChange,
      );
    });

    this.eventEmitter.on(Events.RADIO_CHANGE, async (_cell: unknown, _value: unknown) => {
      await this.handleEditorCommit(_cell as CellPosition, _value, this.props.onRadioChange);
    });

    this.eventEmitter.on(Events.SWITCH_CHANGE, async (_cell: unknown, _checked: unknown) => {
      await this.handleEditorCommit(
        _cell as CellPosition,
        _checked as boolean,
        this.props.onSwitchChange,
      );
    });

    this.eventEmitter.on(Events.PROGRESS_CHANGE, async (_cell: unknown, _value: unknown) => {
      await this.handleEditorCommit(
        _cell as CellPosition,
        _value as number,
        this.props.onProgressChange,
      );
    });

    this.eventEmitter.on(Events.PROGRESS_DRAG, () => {
      this.render();
    });

    this.eventEmitter.on(Events.RATING_CHANGE, async (_cell: unknown, _value: unknown) => {
      await this.handleEditorCommit(
        _cell as CellPosition,
        _value as number,
        this.props.onRatingChange,
      );
    });

    this.eventEmitter.on(Events.COLOR_CHANGE, async (_cell: unknown, _color: unknown) => {
      await this.handleEditorCommit(
        _cell as CellPosition,
        _color as string,
        this.props.onColorChange,
      );
    });

    this.eventEmitter.on(Events.COLOR_DROPDOWN_OPEN, () => {
      const colorDropdown = this.interactionManager.getColorDropdown();
      if (colorDropdown) {
        const column = this.layoutManager.getLeafColumn(colorDropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[colorDropdown.cell.rowIndex];
        if (column && row) {
          const strategy = this.editorRegistry.getStrategy(column) as InteractiveEditorStrategy;
          strategy.onDropdownOpen?.(colorDropdown.cell, row, column);
        }
      }
      this.render();
    });

    this.eventEmitter.on(Events.COLOR_DROPDOWN_CLOSE, (_cell: unknown) => {
      const cell = _cell as CellPosition | null;
      if (cell) {
        // 用户取消颜色下拉（点击外部/Escape），调用 onDropdownCancel hook
        const column = this.layoutManager.getLeafColumn(cell.columnIndex);
        if (column) {
          const strategy = this.editorRegistry.getStrategy(column) as InteractiveEditorStrategy;
          strategy.onDropdownCancel?.(cell);
        }
      }
      this.render();
    });

    this.eventEmitter.on(Events.COLOR_DROPDOWN_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.SWITCH_ANIMATION_UPDATE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.BUTTON_HOVER_ANIMATION_UPDATE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.EDIT_START, async (_cell: unknown, _inputConfig: unknown) => {
      const cell = _cell as CellPosition;
      const inputConfig = _inputConfig as import("./types").InputConfig | undefined;
      await this.editorManager.startEditing(cell, inputConfig);
      // DOM 编辑器生命周期 hook：onEditStart
      const column = this.layoutManager.getLeafColumn(cell.columnIndex);
      if (column) {
        const strategy = this.editorRegistry.getStrategy(column);
        if (!strategy.isInteractive && (strategy as DomEditorStrategy).onEditStart) {
          (strategy as DomEditorStrategy).onEditStart!(cell, inputConfig);
        }
      }
      this.render();
    });

    this.eventEmitter.on(
      Events.SELECT_CHANGE,
      async (_cell: unknown, _value: unknown, _multiple?: unknown) => {
        const cell = _cell as CellPosition;
        const isMultiple = _multiple as boolean;
        const committed = await this.handleEditorCommit(cell, _value, this.props.onSelectChange);
        if (committed) {
          // 单选成功后关闭下拉并清除校验 error
          // 多选模式：保持下拉打开，让用户继续选择
          if (!isMultiple) {
            this.clearValidationErrorForCell(cell);
            this.interactionManager.closeSelectDropdown();
          }
        }
      },
    );

    this.eventEmitter.on(
      Events.TAGS_CHANGE,
      async (_cell: unknown, _values: unknown, _multiple?: unknown) => {
        const cell = _cell as CellPosition;
        const values = _values as string[];
        const isMultiple = _multiple as boolean;
        const valueToStore = isMultiple ? values : (values[0] ?? "");
        const committed = await this.handleEditorCommit(
          cell,
          valueToStore,
          this.props.onTagsChange ? (c, _v) => this.props.onTagsChange!(c, values) : undefined,
        );
        // tags 单选模式：成功后关闭下拉并清除校验 error
        if (committed && !isMultiple) {
          this.clearValidationErrorForCell(cell);
          this.interactionManager.closeSelectDropdown();
        }
      },
    );

    this.eventEmitter.on(Events.EXPAND, (_row: unknown, _rowIndex: unknown, _expanded: unknown) => {
      const row = _row as Row;
      const rowIndex = _rowIndex as number;
      const expanded = _expanded as boolean;
      if (this.props.onExpand) {
        this.props.onExpand(row, rowIndex, expanded);
      }
      this.dataManager.toggleRowExpand(rowIndex);
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.DROPDOWN_OPEN, () => {
      // 交互式编辑器生命周期 hook：onDropdownOpen
      const dropdown = this.interactionManager.getDropdown();
      if (dropdown) {
        const column = this.layoutManager.getLeafColumn(dropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[dropdown.cell.rowIndex];
        if (column && row) {
          const strategy = this.editorRegistry.getStrategy(column) as InteractiveEditorStrategy;
          strategy.onDropdownOpen?.(dropdown.cell, row, column);
        }
      }
      this.render();
    });

    this.eventEmitter.on(Events.DROPDOWN_CLOSE, (_cell: unknown) => {
      const cell = _cell as CellPosition | null;
      if (cell) {
        // 用户取消下拉（Escape/点击外部）：清除校验 error 并调用 onCancel hook
        this.clearValidationErrorForCell(cell);
        const column = this.layoutManager.getLeafColumn(cell.columnIndex);
        if (column) {
          const strategy = this.editorRegistry.getStrategy(column) as InteractiveEditorStrategy;
          strategy.onDropdownCancel?.(cell);
        }
      }
      this.render();
    });

    this.eventEmitter.on(Events.DROPDOWN_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.BUTTONS_DROPDOWN_CLOSE, () => {
      this.render();
    });

    this.eventEmitter.on(Events.DATE_DROPDOWN_OPEN, () => {
      const dateDropdown = this.interactionManager.getDateDropdown();
      if (dateDropdown) {
        const column = this.layoutManager.getLeafColumn(dateDropdown.cell.columnIndex);
        const row = this.dataManager.getRows()[dateDropdown.cell.rowIndex];
        if (column && row) {
          const strategy = this.editorRegistry.getStrategy(column) as InteractiveEditorStrategy;
          strategy.onDropdownOpen?.(dateDropdown.cell, row, column);
        }
      }
      this.render();
    });

    this.eventEmitter.on(Events.DATE_DROPDOWN_CLOSE, (_cell: unknown) => {
      const cell = _cell as CellPosition | null;
      if (cell) {
        // 用户取消日期下拉（点击外部/Escape），调用 onDropdownCancel hook
        const column = this.layoutManager.getLeafColumn(cell.columnIndex);
        if (column) {
          const strategy = this.editorRegistry.getStrategy(column) as InteractiveEditorStrategy;
          strategy.onDropdownCancel?.(cell);
        }
      }
      this.render();
    });

    this.eventEmitter.on(Events.DATE_DROPDOWN_HOVER, () => {
      this.render();
    });

    this.eventEmitter.on(Events.DATE_SELECT, async (_cell: unknown, _value: unknown) => {
      await this.handleEditorCommit(_cell as CellPosition, _value as string, this.props.onEditEnd);
      this.interactionManager.clearEditingState();
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

    this.eventEmitter.on(Events.ROW_ADD_ABOVE, (_row: unknown) => {
      const row = _row as Row;
      const columns = this.dataManager.getColumns();
      const emptyRow = this.props.createRowData
        ? this.props.createRowData(columns)
        : this.createDefaultRowData(columns);
      this.dataManager.addRowRelativeTo(row, emptyRow, "above");
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.ROW_ADD_BELOW, (_row: unknown) => {
      const row = _row as Row;
      const columns = this.dataManager.getColumns();
      const emptyRow = this.props.createRowData
        ? this.props.createRowData(columns)
        : this.createDefaultRowData(columns);
      this.dataManager.addRowRelativeTo(row, emptyRow, "below");
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.ROW_DELETE, (_row: unknown) => {
      const row = _row as Row;
      this.rowPinManager.remove(row);
      this.dataManager.deleteRowByRef(row);
      this.updateLayout();
      this.render();
    });

    this.eventEmitter.on(Events.ROW_PIN_CHANGE, (_row: unknown, _position: unknown) => {
      const row = _row as Row;
      const position = _position as RowPinPosition | null;
      const previousPosition = this.rowPinManager.getPosition(row);

      if (position) {
        this.rowPinManager.pin(row, position);
      } else {
        this.rowPinManager.remove(row);
      }

      const updatedIncrementally = this.layoutManager.updateRowPin(row, previousPosition, position);
      if (!updatedIncrementally) {
        this.updateLayout();
      } else {
        this.interactionManager.updateMaxScroll(
          this.layoutManager.getMaxScrollLeft(),
          this.layoutManager.getMaxScrollTop(),
        );
        this.editorManager.updatePosition();
      }
      this.render();
      this.props.onRowPinChange?.(row, position);
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

    this.eventEmitter.on(Events.EDIT_END, async (_cell: unknown, _value: unknown) => {
      await this.handleEditorCommit(_cell as CellPosition, _value, this.props.onEditEnd);
      this.interactionManager.clearEditingState();
      this.render();
    });

    this.eventEmitter.on(Events.LOAD_MORE, (_params: unknown) => {
      const params = _params as import("./types").LoadMoreParams;
      if (this.props.onLoadMore) {
        this.props.onLoadMore(params);
      }
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
      onRowHeightChange: this.props.onRowHeightChange,
      onColumnReorder: this.props.onColumnReorder,
      onEditStart: this.props.onEditStart,
      onExpand: this.props.onExpand,
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

      await this.dataManager.loadRows(this.props.rows);
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

    this.updateSummaryRows();
    this.layoutManager.calculateLayout(columns, rows);

    this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop(),
    );
  }

  private updateSummaryRows(): void {
    const columns = this.dataManager.getColumns();
    const viewRows = this.dataManager.getRows();
    const allRows = this.dataManager.getAllRows();
    const summary = SummaryManager.buildRows(
      this.props.summary,
      {
        columns,
        visibleLeafColumns: this.layoutManager.getVisibleLeafColumnsForLayout(columns),
        viewRows,
        allRows,
        scopeRows: viewRows,
      },
      this.theme.row.height,
    );

    this.layoutManager.setSummaryRows(
      summary.position === "top" ? summary.rows : [],
      summary.position === "bottom" ? summary.rows : [],
    );
  }

  private refreshSummaryRowsAfterDataChange(): void {
    this.updateSummaryRows();
    this.interactionManager.updateMaxScroll(
      this.layoutManager.getMaxScrollLeft(),
      this.layoutManager.getMaxScrollTop(),
    );
    this.editorManager.updatePosition();
  }

  private normalizeValidationResult(result: ValidateResult): {
    valid: boolean;
    message?: string;
    level: "error" | "warning";
  } {
    if (result === true) {
      return { valid: true, level: "error" };
    }

    if (result === false) {
      return { valid: false, message: "Invalid value", level: "error" };
    }

    if (typeof result === "string") {
      return { valid: false, message: result || "Invalid value", level: "error" };
    }

    // object result — undefined/null 意味着 async validator 无显式返回值（校验通过无问题）
    if (!result || typeof result !== "object") {
      return { valid: true, level: "error" };
    }

    const message = result.message || (result.valid ? undefined : "Invalid value");
    return {
      valid: result.valid,
      message,
      level: result.level ?? "error",
    };
  }

  private async handleValidation(
    cell: CellPosition,
    column: Column,
    value: unknown,
  ): Promise<{ valid: boolean; issue: ValidationError | null }> {
    const strategy = this.editorRegistry.getStrategy(column);
    const columnValidator = column.validate ?? column.editor?.validate;
    const strategyValidator = strategy.validate;
    if (!columnValidator && !strategyValidator) return { valid: true, issue: null };

    // 判断 validator 签名：column 级 (value, row, column) vs strategy 级 (cell, value, row, column)
    const row = this.dataManager.getRows()[cell.rowIndex];
    if (!row) return { valid: true, issue: null };

    const rawResult: ValidateResult | Promise<ValidateResult> = columnValidator
      ? columnValidator(value, row, column)
      : strategyValidator!(cell, value, row, column);
    const isAsync = isPromise(rawResult);
    if (isAsync) {
      this.addPendingValidation(cell);
    }

    const result = isAsync ? await rawResult : rawResult;
    const normalized = this.normalizeValidationResult(result);
    const issue =
      normalized.message && (normalized.level === "warning" || !normalized.valid)
        ? {
            cell,
            row,
            column,
            value,
            message: normalized.message,
            level: normalized.level,
          }
        : null;

    if (isAsync) {
      this.removePendingValidation(cell);
    }

    if (issue) {
      const columnErrors = this.validationErrorRows.get(row) ?? new Map<string, ValidationError>();
      columnErrors.set(column.key, issue);
      this.validationErrorRows.set(row, columnErrors);
      // Show tooltip immediately for both error and warning
      this.forcedValidationTooltipCell = issue.cell;
      // Auto-dismiss warning tooltip after 3 seconds (error persists until cleared)
      if (issue.level === "warning") {
        const warningCell = issue.cell;
        if (this.warningTooltipTimeout) clearTimeout(this.warningTooltipTimeout);
        this.warningTooltipTimeout = setTimeout(() => {
          if (this.isDestroyed) return;
          if (
            this.forcedValidationTooltipCell &&
            this.forcedValidationTooltipCell.rowIndex === warningCell.rowIndex &&
            this.forcedValidationTooltipCell.columnIndex === warningCell.columnIndex
          ) {
            this.forcedValidationTooltipCell = null;
            this.render();
          }
        }, 3000);
      }
      this.props.onValidationError?.(issue);
      // 生命周期 hook：通知校验结果
      if (issue.level === "error") {
        strategy.onReject?.(cell, issue);
      } else if (issue.level === "warning") {
        strategy.onWarning?.(cell, issue);
      }
    } else {
      this.deleteValidationError(row, column.key);
    }

    return {
      valid: normalized.valid || normalized.level === "warning",
      issue,
    };
  }

  private addPendingValidation(cell: CellPosition): void {
    const key = `${cell.rowIndex}-${cell.columnIndex}`;
    this.pendingValidationCells.add(key);
    this.startPendingAnimation();
  }

  private removePendingValidation(cell: CellPosition): void {
    const key = `${cell.rowIndex}-${cell.columnIndex}`;
    this.pendingValidationCells.delete(key);
    if (this.pendingValidationCells.size === 0) {
      this.stopPendingAnimation();
    }
  }

  private startPendingAnimation(): void {
    if (this.pendingAnimationFrame !== null) return;
    const animate = () => {
      if (this.pendingValidationCells.size > 0) {
        this.render();
        this.pendingAnimationFrame = requestAnimationFrame(animate);
      } else {
        this.pendingAnimationFrame = null;
      }
    };
    this.pendingAnimationFrame = requestAnimationFrame(animate);
  }

  private stopPendingAnimation(): void {
    if (this.pendingAnimationFrame !== null) {
      cancelAnimationFrame(this.pendingAnimationFrame);
      this.pendingAnimationFrame = null;
    }
  }

  private deleteValidationError(row: Row, columnKey: string): void {
    const columnErrors = this.validationErrorRows.get(row);
    if (columnErrors) {
      columnErrors.delete(columnKey);
      if (columnErrors.size === 0) {
        this.validationErrorRows.delete(row);
      }
    }
    this.clearTooltipForValidation(row, columnKey);
  }

  private clearTooltipForValidation(row: Row | null, columnKey: string): void {
    if (this.forcedValidationTooltipCell) {
      const fRow = this.dataManager.getRows()[this.forcedValidationTooltipCell.rowIndex];
      const fColumn = this.layoutManager.getLeafColumn(
        this.forcedValidationTooltipCell.columnIndex,
      );
      if (fRow === row && fColumn?.key === columnKey) {
        this.forcedValidationTooltipCell = null;
      }
    }
  }

  private async commitCellValue(
    cell: CellPosition,
    column: Column,
    value: unknown,
  ): Promise<boolean> {
    const { valid } = await this.handleValidation(cell, column, value);
    if (!valid) return false;

    const row = this.dataManager.getRows()[cell.rowIndex];
    this.dataManager.updateCell(cell.rowIndex, column.key, value, getColumnField(column));
    this.refreshSummaryRowsAfterDataChange();
    // 生命周期 hook：通知值已写入
    const strategy = this.editorRegistry.getStrategy(column);
    strategy.onCommit?.(cell, value, row!, column);
    return true;
  }

  /**
   * 统一的编辑器提交流程 — 交互式和 DOM 编辑器共用
   *
   * get column → await commitCellValue → if committed call callback → render
   */
  private async handleEditorCommit(
    cell: CellPosition,
    value: unknown,
    callback?: (cell: CellPosition, value: any) => void,
  ): Promise<boolean> {
    const column = this.layoutManager.getLeafColumn(cell.columnIndex);
    if (!column) {
      this.render();
      return false;
    }
    const strategy = this.editorRegistry.getStrategy(column);
    // 交互式编辑器：beforeInteract hook 拦截
    if (strategy.isInteractive) {
      const interactiveStrategy = strategy as InteractiveEditorStrategy;
      if (interactiveStrategy.beforeInteract) {
        const row = this.dataManager.getRows()[cell.rowIndex];
        if (row && !interactiveStrategy.beforeInteract(cell, row, column)) {
          this.render();
          return false;
        }
      }
    }
    const committed = await this.commitCellValue(cell, column, value);
    if (committed) {
      callback?.(cell, value);
    }
    // DOM 编辑器关闭后立即同步渲染，避免一帧 placeholder 闪烁
    this.performRender();
    this.scheduledRender = null;
    return committed;
  }

  private async validateEditorCommit(cell: CellPosition, value: unknown): Promise<boolean> {
    const column = this.layoutManager.getLeafColumn(cell.columnIndex);
    if (!column) return true;

    const { valid } = await this.handleValidation(cell, column, value);
    if (valid) {
      this.clearValidationErrorForCell(cell);
      return true;
    }

    this.render();
    return false;
  }

  private clearValidationErrorForCell(cell: CellPosition): void {
    const row = this.dataManager.getRows()[cell.rowIndex];
    const column = this.layoutManager.getLeafColumn(cell.columnIndex);
    if (row && column) {
      this.deleteValidationError(row, column.key);
    }
    this.render();
  }

  private buildVisibleValidationErrorIndex(): Map<string, ValidationError> {
    const index = new Map<string, ValidationError>();
    const rows = this.dataManager.getRows();
    const visibleRange = this.layoutManager.getVisibleRange();
    const leafColumns = this.layoutManager.getLeafColumns();

    for (let rowIndex = visibleRange.startRow; rowIndex <= visibleRange.endRow; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;
      const columnErrors = this.validationErrorRows.get(row);
      if (!columnErrors) continue;

      for (let columnIndex = 0; columnIndex < leafColumns.length; columnIndex++) {
        const column = leafColumns[columnIndex];
        if (!column) continue;
        const error = columnErrors.get(column.key);
        if (error) {
          index.set(`${rowIndex}-${columnIndex}`, error);
        }
      }
    }
    return index;
  }

  private render(): void {
    if (this.isDestroyed) return;

    if (this.scheduledRender) {
      // 渲染请求被合并
      if (this.ctPerformanceEnabled) {
        this.ctCoalescedCount++;
      }
      return;
    }

    if (this.ctPerformanceEnabled) {
      this.ctScheduledAt = performance.now();
    }

    this.scheduledRender = () => {
      this.performRender();
      this.scheduledRender = null;
    };

    requestAnimationFrame(() => {
      if (this.scheduledRender) {
        if (this.ctPerformanceEnabled) {
          const now = performance.now();
          this.ctScheduledToStartDelay = this.ctScheduledAt ? now - this.ctScheduledAt : 0;
          this.ctRafInterval = this.ctLastRafTime ? now - this.ctLastRafTime : null;
          this.ctLastRafTime = now;
        }
        this.scheduledRender();
      }
    });
  }

  private performRender(): void {
    const totalStart = this.ctPerformanceEnabled ? performance.now() : 0;
    if (this.ctPerformanceEnabled) {
      this.ctCurrentFramePhases.clear();
    }

    const { columns, rows, interactionState, scrollState } = this.measureCanvasPhase(
      "dataState",
      () => ({
        columns: this.dataManager.getColumns(),
        rows: this.dataManager.getRows(),
        interactionState: this.interactionManager.getInteractionState(),
        scrollState: this.interactionManager.getScrollState(),
      }),
    );

    const visibleRange = this.measureCanvasPhase("layoutUpdate", () => {
      // 始终更新滚动位置，确保 getVisibleHeaderCells 能正确计算
      this.layoutManager.setScrollPosition(scrollState.scrollLeft, scrollState.scrollTop);
      return this.layoutManager.getVisibleRange();
    });

    if (rows.length === 0) {
      this.measureCanvasPhase("rendererRender", () => {
        this.loadingOverlay.hide();
        this.renderer.renderEmptyState(
          this.props.emptyText ?? this.locale.emptyText,
          this.dataManager.getSort(),
          this.dataManager.getFilters(),
          interactionState.hoveredHeaderColumnKey,
          scrollState.scrollLeft,
        );
      });

      this.measureCanvasPhase("overlays", () => {
        const filterDropdown = this.interactionManager.getFilterDropdown();
        if (filterDropdown) {
          this.renderer.renderFilterDropdown(filterDropdown);
        }
        this.renderer.renderWatermark();
      });

      this._recordCtFrame(totalStart);
      return;
    }

    if (this.dataManager.isLoading() || this.manualLoading) {
      this.measureCanvasPhase("rendererRender", () => {
        this.loadingOverlay.show(this.props.loadingText ?? this.locale.loadingText);
        this.renderer.renderWatermark();
      });

      this._recordCtFrame(totalStart);
      return;
    }

    // 隐藏 loading overlay（如果正在显示）
    this.loadingOverlay.hide();

    this.measureCanvasPhase("rendererRender", () => {
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
          progressDragState: interactionState.progressDragState,
          rowResizeState: interactionState.rowResizeState,
          validationErrors: this.buildVisibleValidationErrorIndex(),
          pendingValidations: this.pendingValidationCells,
        },
      );
      this.interactionManager.setJSXInteractiveRegions(this.renderer.getJSXInteractiveRegions());
    });

    this.measureCanvasPhase("overlays", () => {
      const scrollbarState = this.interactionManager.getScrollbarState();
      this.renderer.renderScrollbars(
        scrollState.scrollLeft,
        scrollState.scrollTop,
        scrollState.maxScrollLeft,
        scrollState.maxScrollTop,
        scrollbarState,
      );

      const validationTooltipCell =
        this.forcedValidationTooltipCell ?? interactionState.hoveredCell;
      const validationTooltip = this.getValidationTooltip(
        validationTooltipCell,
        scrollState.scrollLeft,
        scrollState.scrollTop,
      );
      if (validationTooltip && interactionState.tooltip) {
        // 同一单元格同时有校验提示和普通 tooltip → 合并显示
        const normalCell = interactionState.tooltip.cell;
        const isSameCell =
          validationTooltip.cell.rowIndex === normalCell.rowIndex &&
          validationTooltip.cell.columnIndex === normalCell.columnIndex;
        const validationText =
          validationTooltip.content.type === "text" ? validationTooltip.content.text : "";
        if (isSameCell && interactionState.tooltip.content.type === "text") {
          const normalText = interactionState.tooltip.content.text;
          this.renderer.renderTooltip({
            ...validationTooltip,
            content: {
              type: "text",
              text: validationText + "\n" + normalText,
            },
          });
        } else {
          this.renderer.renderTooltip(validationTooltip);
        }
      } else if (validationTooltip) {
        this.renderer.renderTooltip(validationTooltip);
      } else if (interactionState.tooltip) {
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

      const colorDropdown = this.interactionManager.getColorDropdown();
      if (colorDropdown) {
        this.renderer.renderColorDropdown(colorDropdown);
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
    });

    this._recordCtFrame(totalStart);
  }

  /**
   * 记录 CanvasTable 帧统计
   */
  private _recordCtFrame(totalStart: number): void {
    if (!this.ctPerformanceEnabled) return;

    const now = performance.now();
    const totalTime = now - totalStart;

    const dataStateTime = this.ctCurrentFramePhases.get("dataState")?.totalTime ?? 0;
    const layoutUpdateTime = this.ctCurrentFramePhases.get("layoutUpdate")?.totalTime ?? 0;
    const rendererRenderTime = this.ctCurrentFramePhases.get("rendererRender")?.totalTime ?? 0;
    const overlaysTime = this.ctCurrentFramePhases.get("overlays")?.totalTime ?? 0;
    const nonRendererTime = Math.max(0, totalTime - rendererRenderTime);
    const phases = new Map<string, { totalTime: number; count: number; maxTime: number }>();
    for (const [name, stats] of this.ctCurrentFramePhases) {
      phases.set(name, { ...stats });
    }

    const frameEntry: CanvasTableFrameEntry = {
      frameId: ++this.ctFrameCount,
      startTime: totalStart,
      scheduledAt: this.ctScheduledAt ?? 0,
      scheduledToStartDelay: this.ctScheduledToStartDelay,
      rafInterval: this.ctRafInterval,
      totalTime,
      dataStateTime,
      layoutUpdateTime,
      rendererRenderTime,
      overlaysTime,
      nonRendererTime,
      coalescedCount: this.ctCoalescedCount,
      phases,
      rendererFrame: this.renderer.getLastFrameDiagnostics() as RendererFrameSnapshot | null,
    };

    this.ctFrameHistory.push(frameEntry);
    if (this.ctFrameHistory.length > CanvasTable.CT_MAX_FRAME_HISTORY) {
      this.ctFrameHistory.shift();
    }

    this.ctScheduledAt = null;
    this.ctScheduledToStartDelay = 0;
    this.ctRafInterval = null;
    this.ctCoalescedCount = 0;
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

  setRows(rows: Row[]): void {
    this.dataManager
      .loadRows(rows)
      .then(() => {
        this.interactionManager.setScrollPosition(0, 0);
        this.interactionManager.resetState();
        this.editorManager.destroy();
        // 清理图片缓存，防止内存泄漏
        this.renderer.clearImageCache();
        // 重置渲染缓存
        this.renderer.resetRowIds();
        this.renderCache.clear();
        this.updateLayout();
        this.render();
      })
      .catch((error) => {
        this.eventEmitter.emit(Events.ERROR, error);
      });
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
    // 重置列 ID 管理器并清空缓存
    this.renderer.resetColumnIds();
    this.renderCache.clear();
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

  getPinnedRows(position: RowPinPosition): Row[] {
    return position === "top"
      ? this.rowPinManager.getTopRows()
      : this.rowPinManager.getBottomRows();
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

  async updateCell(rowIndex: number, column: string, value: unknown): Promise<void> {
    const columnDef = this.layoutManager.getColumnByKey(column);
    const columnIndex = this.layoutManager.getLeafColumnIndexByKey(column);
    if (columnDef && columnIndex !== null) {
      if (!(await this.commitCellValue({ rowIndex, columnIndex }, columnDef, value))) {
        this.render();
        return;
      }
    } else {
      const change = this.dataManager.updateCell(rowIndex, column, value);
      this.eventEmitter.emit(Events.CHANGE, [change]);
      this.refreshSummaryRowsAfterDataChange();
      this.render();
      return;
    }

    const row = this.dataManager.getRows()[rowIndex];
    const dataField = getColumnField(columnDef);
    const change = {
      type: "update" as const,
      rowIndex,
      column: dataField,
      newValue: row?.data[dataField],
    };
    this.eventEmitter.emit(Events.CHANGE, [change]);
    this.render();
  }

  async updateRow(rowIndex: number, data: Record<string, unknown>): Promise<void> {
    const leafColumns = this.layoutManager.getLeafColumns();
    for (let columnIndex = 0; columnIndex < leafColumns.length; columnIndex++) {
      const column = leafColumns[columnIndex];
      if (!column) continue;

      const field = getColumnField(column);
      const hasFieldValue = Object.prototype.hasOwnProperty.call(data, field);
      const hasKeyValue = Object.prototype.hasOwnProperty.call(data, column.key);
      if (!hasFieldValue && !hasKeyValue) {
        continue;
      }

      const value = hasFieldValue ? data[field] : data[column.key];
      const cell = { rowIndex, columnIndex };
      const validation = await this.handleValidation(cell, column, value);

      if (!validation.valid) {
        this.render();
        return;
      }
    }

    const changes = this.dataManager.updateRow(rowIndex, data);
    this.eventEmitter.emit(Events.CHANGE, changes);
    this.refreshSummaryRowsAfterDataChange();
    this.render();
  }

  getValidationErrors(): ValidationError[] {
    const errors: ValidationError[] = [];
    const rows = this.dataManager.getRows();
    for (const row of rows) {
      const columnErrors = this.validationErrorRows.get(row);
      if (columnErrors) {
        for (const error of columnErrors.values()) {
          errors.push(error);
        }
      }
    }
    return errors;
  }

  getValidationError(cell: CellPosition): ValidationError | null {
    const row = this.dataManager.getRows()[cell.rowIndex];
    const column = this.layoutManager.getLeafColumn(cell.columnIndex);
    if (!row || !column) return null;
    return this.validationErrorRows.get(row)?.get(column.key) ?? null;
  }

  clearValidationErrors(): void {
    this.validationErrorRows = new WeakMap();
    this.forcedValidationTooltipCell = null;
    this.render();
  }

  private getValidationTooltip(
    hoveredCell: CellPosition | null,
    scrollLeft: number,
    scrollTop: number,
  ): TooltipState | null {
    if (!hoveredCell) {
      return null;
    }

    const error = this.getValidationError(hoveredCell);
    if (!error) {
      return null;
    }

    const column = this.layoutManager.getLeafColumn(hoveredCell.columnIndex);
    const cellPosition = this.layoutManager.getCellPosition(
      hoveredCell.rowIndex,
      hoveredCell.columnIndex,
    );
    const x =
      column?.fixed === "left" || column?.fixed === "right"
        ? cellPosition.x
        : cellPosition.x - scrollLeft;

    return {
      cell: hoveredCell,
      x,
      y: cellPosition.y - scrollTop,
      width: cellPosition.width,
      content: { type: "text", text: error.message },
    };
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

  /**
   * 追加数据行（用于懒加载）
   * @param rows 要追加的行数据
   */
  appendRows(rows: Row[]): void {
    const currentRows = this.dataManager.getAllRows();
    this.dataManager.setRows([...currentRows, ...rows]);
    this.interactionManager.setLoadingMore(false);
    this.updateLayout();
    this.render();
  }

  /**
   * 设置加载更多状态
   * @param loading 是否正在加载
   */
  setLoadingMore(loading: boolean): void {
    this.interactionManager.setLoadingMore(loading);
  }

  /**
   * 设置是否还有更多数据
   * @param hasMore 是否还有更多数据，false 表示加载完成
   */
  setHasMore(hasMore: boolean): void {
    this.interactionManager.setHasMore(hasMore);
  }

  /**
   * 显示 loading overlay
   * @param text 可选的 loading 文本
   */
  showLoading(text?: string): void {
    this.manualLoading = true;
    this.loadingOverlay.show(text ?? this.props.loadingText ?? this.locale.loadingText);
    this.render(); // 确保触发渲染
  }

  /**
   * 隐藏 loading overlay
   */
  hideLoading(): void {
    this.manualLoading = false;
    this.loadingOverlay.hide();
    this.render(); // 确保触发渲染
  }

  sort(configs: SortConfig[]): void {
    this.dataManager.sort(configs);
    this.interactionManager.setSortConfig(configs);
    this.eventEmitter.emit(Events.SORT, configs);
    this.updateLayout();
    this.render();
  }

  filter(filters: FilterConfig[]): void {
    this.dataManager.filter(filters);
    this.interactionManager.setFilterConfig(filters);
    this.eventEmitter.emit(Events.FILTER, filters);
    this.updateLayout();
    this.render();
  }

  clearFilters(): void {
    this.dataManager.clearFilters();
    this.interactionManager.setFilterConfig([]);
    this.eventEmitter.emit(Events.FILTER, []);
    this.updateLayout();
    this.render();
  }

  async export(options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case "csv":
        return new Blob(
          [
            arrayToCsv(
              this.dataManager.exportData({
                includeHeaders: options.includeHeaders ?? true,
                includeHidden: options.includeHidden ?? false,
                selectedOnly: options.selectedOnly ?? false,
                showRowNumbers: this.props.showRowNumbers === true,
              }),
            ),
          ],
          { type: "text/csv" },
        );
      case "json":
        return new Blob(
          [
            JSON.stringify(
              this.dataManager.exportData({
                includeHeaders: options.includeHeaders ?? true,
                includeHidden: options.includeHidden ?? false,
                selectedOnly: options.selectedOnly ?? false,
                showRowNumbers: this.props.showRowNumbers === true,
              }),
              null,
              2,
            ),
          ],
          { type: "application/json" },
        );
      case "excel": {
        this.updateSummaryRows();
        const rowBands = this.layoutManager.getRowBandsForRender();
        const context = this.dataManager.getExportContext({
          includeHeaders: options.includeHeaders ?? true,
          includeHidden: options.includeHidden ?? false,
          selectedOnly: options.selectedOnly ?? false,
          showRowNumbers: this.props.showRowNumbers === true,
        });
        const model = buildExcelExportModel(
          {
            ...context,
            summaryTopRows: rowBands.summaryTop.rows,
            summaryBottomRows: rowBands.summaryBottom.rows,
          },
          options.excel,
          options.filename?.replace(/\.[^.]+$/, "") ?? "Sheet1",
        );
        return createXlsxBlobFromModel(model);
      }
      default:
        return new Blob(
          [
            arrayToCsv(
              this.dataManager.exportData({
                includeHeaders: options.includeHeaders ?? true,
                includeHidden: options.includeHidden ?? false,
                selectedOnly: options.selectedOnly ?? false,
                showRowNumbers: this.props.showRowNumbers === true,
              }),
            ),
          ],
          { type: "text/csv" },
        );
    }
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
      // 只更新列布局，不需要重新计算行布局
      this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns());
      this.updateSummaryRows();
      this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop(),
      );
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
      // 只更新列布局，不需要重新计算行布局
      this.updateSummaryRows();
      this.layoutManager.calculateColumnLayoutOnly(this.dataManager.getColumns());
      this.interactionManager.updateMaxScroll(
        this.layoutManager.getMaxScrollLeft(),
        this.layoutManager.getMaxScrollTop(),
      );
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

  setLocale(locale: LocaleConfig): void {
    this.props = { ...this.props, locale };
    this.locale = resolveLocale(locale);
    this.loadingOverlay.setConfig({
      text: this.props.loadingText ?? this.locale.loadingText,
    });
    this.renderer.setLocale(this.locale);
    this.interactionManager.setLocale(this.locale);
    this.filterInputManager.setLocale(this.locale);
    this.render();
  }

  getLocale(): CanvasTableLocale {
    return this.locale;
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

  /**
   * 设置图片加载配置
   */
  setImageLoadConfig(config: ImageLoadConfig): void {
    this.renderer.setImageLoadConfig(config);
  }

  /**
   * 获取图片加载队列统计信息
   */
  getImageLoadStats(): { pending: number; loading: number; cached: number; failed: number } {
    return this.renderer.getImageLoadStats();
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
          image: {
            ...baseTheme.colors.image,
            ...mergedCustomTheme.colors?.image,
          },
          hiddenPlaceholder: {
            ...baseTheme.colors.hiddenPlaceholder,
            ...mergedCustomTheme.colors?.hiddenPlaceholder,
          },
          moreCount: {
            ...baseTheme.colors.moreCount,
            ...mergedCustomTheme.colors?.moreCount,
          },
          shadow: {
            ...baseTheme.colors.shadow,
            ...mergedCustomTheme.colors?.shadow,
          },
          watermark: {
            ...baseTheme.colors.watermark,
            ...mergedCustomTheme.colors?.watermark,
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
    this.filterInputManager.setTheme(this.theme);
    this.loadingOverlay.setTheme(this.theme);
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

  // 性能监控 API

  /**
   * 测量 CanvasTable 阶段时间的辅助方法
   */
  private measureCanvasPhase<T>(name: string, fn: () => T): T {
    if (!this.ctPerformanceEnabled) {
      return fn();
    }
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    const stats = this.ctCurrentFramePhases.get(name) ?? { totalTime: 0, count: 0, maxTime: 0 };
    stats.totalTime += duration;
    stats.count++;
    stats.maxTime = Math.max(stats.maxTime, duration);
    this.ctCurrentFramePhases.set(name, stats);
    return result;
  }

  /**
   * 启用或禁用性能监控
   * @param enabled 是否启用
   */
  setPerformanceMonitoring(enabled: boolean): void {
    this.renderer.setPerformanceMonitoring(enabled);
    this.ctPerformanceEnabled = enabled;
  }

  /**
   * 检查性能监控是否启用
   */
  isPerformanceMonitoringEnabled(): boolean {
    return this.renderer.isPerformanceMonitoringEnabled();
  }

  /**
   * 获取性能统计报告
   */
  getPerformanceReport(): string {
    const lines: string[] = [
      "=== CanvasTable Performance Report ===",
      `Status: ${this.ctPerformanceEnabled ? "Enabled" : "Disabled"}`,
    ];

    // Helper to format cell detail steps
    const formatCellDetail = (detail: CellRenderDetailSnapshot, indent: string = "    ") => {
      const detailLines: string[] = [];
      if (detail.branch) {
        detailLines.push(`${indent}Branch: ${detail.branch}`);
      }
      // Take top 8 steps
      const topSteps = detail.steps.slice(0, 8);
      for (const step of topSteps) {
        const percentage = detail.totalTime > 0 ? (step.totalTime / detail.totalTime) * 100 : 0;
        const stepAvg = step.count > 0 ? step.totalTime / step.count : 0;
        detailLines.push(
          `${indent}${step.name.padEnd(35)} | ` +
            `total: ${step.totalTime.toFixed(3).padStart(8)}ms | ` +
            `count: ${step.count.toString().padStart(3)} | ` +
            `avg: ${stepAvg.toFixed(3).padStart(7)}ms | ` +
            `max: ${step.maxTime.toFixed(3).padStart(7)}ms | ` +
            `${percentage.toFixed(1).padStart(5)}%`,
        );
      }
      return detailLines;
    };

    const rendererDiagnostics = this.renderer.getPerformanceDiagnostics();
    const hasData = this.ctFrameHistory.length > 0 || rendererDiagnostics.frameHistory.length > 0;

    if (!hasData) {
      lines.push("");
      lines.push("No performance data collected yet.");
      lines.push("Try scrolling the table while monitoring is enabled.");
      return lines.join("\n");
    }

    // --- Summary section ---
    lines.push("");
    lines.push("=== SUMMARY ===");
    lines.push("-".repeat(70));

    const retainedFrames = this.ctFrameHistory.length;
    const avgCtFrameTime =
      retainedFrames > 0
        ? this.ctFrameHistory.reduce((sum, f) => sum + f.totalTime, 0) / retainedFrames
        : 0;
    const worstFrameTotal =
      retainedFrames > 0 ? Math.max(...this.ctFrameHistory.map((f) => f.totalTime)) : 0;

    const countSlowFrames = (threshold: number) =>
      this.ctFrameHistory.filter((f) => f.totalTime > threshold).length;

    const rafSamples = this.ctFrameHistory
      .map((f) => f.rafInterval)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const avgRafInterval =
      rafSamples.length > 0 ? rafSamples.reduce((sum, v) => sum + v, 0) / rafSamples.length : null;
    const worstRafInterval = rafSamples.length > 0 ? Math.max(...rafSamples) : null;
    const estimatedFps = avgRafInterval && avgRafInterval > 0 ? 1000 / avgRafInterval : null;
    const worstFps = worstRafInterval && worstRafInterval > 0 ? 1000 / worstRafInterval : null;

    lines.push(`Captured CanvasTable Frames: ${this.ctFrameCount}`);
    lines.push(
      `Retained CanvasTable Frames: ${retainedFrames} ` +
        `(last ${CanvasTable.CT_MAX_FRAME_HISTORY} max)`,
    );
    lines.push(`Average CanvasTable Frame Time: ${avgCtFrameTime.toFixed(2)}ms (retained)`);
    lines.push(`Worst Frame Total: ${worstFrameTotal.toFixed(2)}ms (retained)`);
    lines.push(`Slow Retained Frames >16.7ms: ${countSlowFrames(16.7)}`);
    lines.push(`Slow Retained Frames >33.3ms: ${countSlowFrames(33.3)}`);
    lines.push(`Slow Retained Frames >50ms: ${countSlowFrames(50)}`);
    lines.push(`Slow Retained Frames >100ms: ${countSlowFrames(100)}`);
    lines.push(
      `RAF Interval (retained samples=${rafSamples.length}): ` +
        `avg ${avgRafInterval !== null ? `${avgRafInterval.toFixed(2)}ms` : "N/A"}, ` +
        `worst ${worstRafInterval !== null ? `${worstRafInterval.toFixed(2)}ms` : "N/A"}`,
    );
    lines.push(
      `Estimated FPS: ` +
        `avg ${estimatedFps !== null ? estimatedFps.toFixed(1) : "N/A"}, ` +
        `worst ${worstFps !== null ? worstFps.toFixed(1) : "N/A"}`,
    );

    // --- Worst Frame Details ---
    lines.push("");
    lines.push("=== WORST FRAME DETAILS ===");
    lines.push("-".repeat(70));

    const ctWorstFrame = this.getCtWorstFrameDiagnostics();
    if (ctWorstFrame) {
      lines.push(`[CanvasTable]`);
      lines.push(`  Total Time:        ${ctWorstFrame.totalTime.toFixed(2)}ms`);
      lines.push(`  Renderer Time:     ${ctWorstFrame.rendererRenderTime.toFixed(2)}ms`);
      lines.push(`  Non-Renderer Time: ${ctWorstFrame.nonRendererTime.toFixed(2)}ms`);
      lines.push(`  Data State:        ${ctWorstFrame.dataStateTime.toFixed(2)}ms`);
      lines.push(`  Layout Update:     ${ctWorstFrame.layoutUpdateTime.toFixed(2)}ms`);
      lines.push(`  Overlays:          ${ctWorstFrame.overlaysTime.toFixed(2)}ms`);
      lines.push(`  RAF Interval:      ${ctWorstFrame.rafInterval?.toFixed(2) ?? "N/A"}ms`);
      lines.push(`  Scheduled Delay:   ${ctWorstFrame.scheduledToStartDelay.toFixed(2)}ms`);
      lines.push(`  Coalesced Count:   ${ctWorstFrame.coalescedCount}`);

      const matchedRendererFrame = ctWorstFrame.rendererFrame;
      if (matchedRendererFrame) {
        lines.push("");
        lines.push(`[Renderer - matching CanvasTable worst frame]`);
        lines.push(`  Total Time:        ${matchedRendererFrame.totalTime.toFixed(2)}ms`);
        lines.push(`  Cell Render Time:  ${matchedRendererFrame.cellRenderTime.toFixed(2)}ms`);
        lines.push(`  Non-Cell Time:     ${matchedRendererFrame.nonCellRendererTime.toFixed(2)}ms`);
        lines.push(`  Unaccounted Time:  ${matchedRendererFrame.unaccountedTime.toFixed(2)}ms`);
        lines.push(`  Visible Rows:      ${matchedRendererFrame.visibleRows}`);
        lines.push(`  Visible Columns:   ${matchedRendererFrame.visibleColumns}`);
        lines.push(`  Visible Cells:     ${matchedRendererFrame.visibleCells}`);
        lines.push(`  Scroll Top:        ${matchedRendererFrame.scrollTop.toFixed(0)}`);
        lines.push(`  Scroll Left:       ${matchedRendererFrame.scrollLeft.toFixed(0)}`);
      }
    }

    const rendererFrameForBreakdown =
      ctWorstFrame?.rendererFrame ??
      (rendererDiagnostics.worstFrame as RendererFrameSnapshot | null) ??
      (rendererDiagnostics.lastFrame as RendererFrameSnapshot | null);
    const rendererFrameLabel = ctWorstFrame?.rendererFrame
      ? "Matching CanvasTable Worst Frame"
      : "Renderer Worst/Last Frame";
    const rendererFrames = (rendererDiagnostics.frameHistory as RendererFrameSnapshot[]) ?? [];
    const formatCellLocation = (location?: CellRenderLocation) => {
      if (!location) return "row: N/A col: N/A xy: N/A";
      return `row: ${location.rowIndex ?? "N/A"} col: ${location.colIndex ?? "N/A"} xy: (${location.x.toFixed(0)},${location.y.toFixed(0)}) size: ${location.width.toFixed(0)}x${location.height.toFixed(0)}`;
    };
    const formatRowBandDetails = (
      details:
        | Map<
            string,
            {
              totalTime: number;
              count: number;
              maxTime: number;
              maxAt?: CellRenderLocation;
              columnKey?: string;
            }
          >
        | undefined,
      totalTime: number,
      indent = "  ",
    ) => {
      if (!details || details.size === 0) return [];
      return Array.from(details.entries())
        .map(([name, stats]) => ({
          name,
          ...stats,
          avg: stats.count > 0 ? stats.totalTime / stats.count : 0,
          percentage: totalTime > 0 ? (stats.totalTime / totalTime) * 100 : 0,
        }))
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 24)
        .map((detail) => {
          const column = detail.columnKey ? ` | column: ${detail.columnKey}` : "";
          const location = detail.maxAt ? ` | maxAt: ${formatCellLocation(detail.maxAt)}` : "";
          return (
            `${indent}${detail.name.padEnd(42)} | ` +
            `calls: ${detail.count.toString().padStart(5)} | ` +
            `avg: ${detail.avg.toFixed(3).padStart(7)}ms | ` +
            `max: ${detail.maxTime.toFixed(3).padStart(7)}ms | ` +
            `total: ${detail.totalTime.toFixed(2).padStart(8)}ms | ` +
            `${detail.percentage.toFixed(1).padStart(5)}%` +
            column +
            location
          );
        });
    };

    // --- Aggregate Renderer Phase Breakdown ---
    const aggregatePhases = new Map<
      string,
      { totalTime: number; count: number; maxTime: number }
    >();
    for (const frame of rendererFrames) {
      for (const [name, stats] of frame.phases.entries()) {
        const aggregate = aggregatePhases.get(name) ?? { totalTime: 0, count: 0, maxTime: 0 };
        aggregate.totalTime += stats.totalTime;
        aggregate.count += stats.count;
        aggregate.maxTime = Math.max(aggregate.maxTime, stats.maxTime);
        aggregatePhases.set(name, aggregate);
      }
    }

    if (aggregatePhases.size > 0) {
      lines.push("");
      lines.push(
        "=== AGGREGATE RENDERER PHASE BREAKDOWN (All Retained Renderer Frames; last 120 max) ===",
      );
      lines.push(`Retained Renderer Frames: ${rendererFrames.length}`);
      lines.push("-".repeat(86));

      const phases = Array.from(aggregatePhases.entries())
        .map(([name, stats]) => ({
          name,
          totalTime: stats.totalTime,
          maxTime: stats.maxTime,
          count: stats.count,
          avg: stats.count > 0 ? stats.totalTime / stats.count : 0,
        }))
        .sort((a, b) => b.totalTime - a.totalTime);

      for (const phase of phases) {
        lines.push(
          `${phase.name.padEnd(25)} | ` +
            `calls: ${phase.count.toString().padStart(6)} | ` +
            `avg: ${phase.avg.toFixed(3).padStart(7)}ms | ` +
            `max: ${phase.maxTime.toFixed(3).padStart(7)}ms | ` +
            `total: ${phase.totalTime.toFixed(2).padStart(8)}ms`,
        );
      }

      const aggregateRowBandDetails = new Map<
        string,
        {
          totalTime: number;
          count: number;
          maxTime: number;
          maxAt?: CellRenderLocation;
          columnKey?: string;
        }
      >();
      for (const frame of rendererFrames) {
        for (const [name, stats] of frame.rowBandDetails?.entries() ?? []) {
          const aggregate = aggregateRowBandDetails.get(name) ?? {
            totalTime: 0,
            count: 0,
            maxTime: 0,
          };
          aggregate.totalTime += stats.totalTime;
          aggregate.count += stats.count;
          if (stats.maxTime > aggregate.maxTime) {
            aggregate.maxTime = stats.maxTime;
            aggregate.maxAt = stats.maxAt ? { ...stats.maxAt } : undefined;
            aggregate.columnKey = stats.columnKey;
          }
          aggregateRowBandDetails.set(name, aggregate);
        }
      }
      if (aggregateRowBandDetails.size > 0) {
        const rowBandsTotal = aggregatePhases.get("rowBands")?.totalTime ?? 0;
        const rowBandsFixedTotal = aggregatePhases.get("rowBandsFixed")?.totalTime ?? 0;
        lines.push("");
        lines.push("  rowBands detail (aggregate, top 24):");
        lines.push(
          ...formatRowBandDetails(
            aggregateRowBandDetails,
            rowBandsTotal + rowBandsFixedTotal,
            "    ",
          ),
        );
      }
    }

    // --- Aggregate Cell Renderer Breakdown ---
    const aggregateCells = new Map<string, Map<string, CellRenderStatsSnapshot>>();
    for (const frame of rendererFrames) {
      for (const [type, byKey] of frame.cellsByType.entries()) {
        let aggregateByKey = aggregateCells.get(type);
        if (!aggregateByKey) {
          aggregateByKey = new Map();
          aggregateCells.set(type, aggregateByKey);
        }

        for (const [columnKey, stats] of byKey.entries()) {
          const aggregate = aggregateByKey.get(columnKey) ?? { totalTime: 0, count: 0, maxTime: 0 };
          aggregate.totalTime += stats.totalTime;
          aggregate.count += stats.count;
          if (stats.maxTime > aggregate.maxTime) {
            aggregate.maxTime = stats.maxTime;
            aggregate.maxCell = stats.maxCell ? { ...stats.maxCell } : undefined;
            aggregate.maxCellDetail = stats.maxCellDetail
              ? {
                  ...stats.maxCellDetail,
                  location: { ...stats.maxCellDetail.location },
                  steps: stats.maxCellDetail.steps.map((s) => ({ ...s })),
                }
              : undefined;
          }
          aggregateByKey.set(columnKey, aggregate);
        }
      }
    }

    if (aggregateCells.size > 0) {
      lines.push("");
      lines.push(
        "=== AGGREGATE CELL RENDERER BREAKDOWN (All Retained Renderer Frames; last 120 max) ===",
      );
      lines.push(`Retained Renderer Frames: ${rendererFrames.length}`);
      lines.push(
        "Note: detail % = step total / slow-cell total; partial when only sub-steps are traced.",
      );
      lines.push("-".repeat(92));

      const allCells: Array<{
        type: string;
        columnKey: string;
        totalTime: number;
        count: number;
        maxTime: number;
        maxCell?: CellRenderLocation;
        maxCellDetail?: CellRenderDetailSnapshot;
      }> = [];

      for (const [type, byKey] of aggregateCells.entries()) {
        for (const [columnKey, stats] of byKey.entries()) {
          allCells.push({ type, columnKey, ...stats });
        }
      }

      allCells.sort((a, b) => b.totalTime - a.totalTime);

      for (const cell of allCells) {
        const avg = cell.count > 0 ? cell.totalTime / cell.count : 0;
        lines.push(
          `${`${cell.type}/${cell.columnKey}`.padEnd(30)} | ` +
            `totalCalls: ${cell.count.toString().padStart(6)} | ` +
            `avg: ${avg.toFixed(3).padStart(7)}ms | ` +
            `maxCell: ${cell.maxTime.toFixed(3).padStart(7)}ms | ` +
            `total: ${cell.totalTime.toFixed(2).padStart(8)}ms | ` +
            `maxAt: ${formatCellLocation(cell.maxCell)}`,
        );
        if (cell.maxCellDetail) {
          lines.push(...formatCellDetail(cell.maxCellDetail, "    "));
        }
      }
    }

    // --- Renderer Phase Breakdown ---
    if (rendererFrameForBreakdown && rendererFrameForBreakdown.phases.size > 0) {
      lines.push("");
      lines.push(
        `=== RENDERER PHASE BREAKDOWN (${rendererFrameLabel}; calls are this frame only) ===`,
      );
      lines.push(`Frame ID: ${rendererFrameForBreakdown.frameId}`);
      lines.push("-".repeat(86));

      const phaseEntries = Array.from(
        rendererFrameForBreakdown.phases as Map<
          string,
          { totalTime: number; maxTime: number; count: number }
        >,
      );
      const phases = phaseEntries
        .map(([name, stats]) => ({
          name,
          totalTime: stats.totalTime,
          maxTime: stats.maxTime,
          count: stats.count,
          percentage:
            rendererFrameForBreakdown.totalTime > 0
              ? (stats.totalTime / rendererFrameForBreakdown.totalTime) * 100
              : 0,
        }))
        .sort((a, b) => b.totalTime - a.totalTime);

      for (const phase of phases) {
        lines.push(
          `${phase.name.padEnd(25)} | ` +
            `calls/frame: ${phase.count.toString().padStart(3)} | ` +
            `max: ${phase.maxTime.toFixed(2).padStart(7)}ms | ` +
            `total: ${phase.totalTime.toFixed(2).padStart(7)}ms | ` +
            `${phase.percentage.toFixed(1).padStart(5)}%`,
        );
      }
      if (
        rendererFrameForBreakdown.rowBandDetails &&
        rendererFrameForBreakdown.rowBandDetails.size > 0
      ) {
        const rowBandsTotal = rendererFrameForBreakdown.phases.get("rowBands")?.totalTime ?? 0;
        const rowBandsFixedTotal =
          rendererFrameForBreakdown.phases.get("rowBandsFixed")?.totalTime ?? 0;
        lines.push("");
        lines.push("  rowBands detail (matching frame, top 24):");
        lines.push(
          ...formatRowBandDetails(
            rendererFrameForBreakdown.rowBandDetails,
            rowBandsTotal + rowBandsFixedTotal,
            "    ",
          ),
        );
      }
    }

    // --- Cell Renderer Breakdown ---
    if (rendererFrameForBreakdown && rendererFrameForBreakdown.cellsByType.size > 0) {
      lines.push("");
      lines.push(
        `=== CELL RENDERER BREAKDOWN (${rendererFrameLabel}; calls are this frame only) ===`,
      );
      lines.push(`Frame ID: ${rendererFrameForBreakdown.frameId}`);
      lines.push(
        "Note: detail % = step total / slow-cell total; partial when only sub-steps are traced.",
      );
      lines.push("-".repeat(92));

      const allCells: Array<{
        type: string;
        columnKey: string;
        totalTime: number;
        count: number;
        maxTime: number;
        maxCell?: CellRenderLocation;
        maxCellDetail?: CellRenderDetailSnapshot;
      }> = [];

      const cellsByType = rendererFrameForBreakdown.cellsByType as Map<
        string,
        Map<string, CellRenderStatsSnapshot>
      >;
      for (const [type, byKey] of cellsByType.entries()) {
        for (const [columnKey, stats] of byKey.entries()) {
          allCells.push({ type, columnKey, ...stats });
        }
      }

      allCells.sort((a, b) => b.totalTime - a.totalTime);

      for (const cell of allCells) {
        const avg = cell.count > 0 ? cell.totalTime / cell.count : 0;
        lines.push(
          `${`${cell.type}/${cell.columnKey}`.padEnd(30)} | ` +
            `calls/frame: ${cell.count.toString().padStart(4)} | ` +
            `avg: ${avg.toFixed(3).padStart(7)}ms | ` +
            `maxCell: ${cell.maxTime.toFixed(3).padStart(7)}ms | ` +
            `total: ${cell.totalTime.toFixed(2).padStart(6)}ms | ` +
            `maxAt: ${formatCellLocation(cell.maxCell)}`,
        );
        if (cell.maxCellDetail) {
          lines.push(...formatCellDetail(cell.maxCellDetail, "    "));
        }
      }
    }

    // --- Top Slow CanvasTable Frames ---
    if (this.ctFrameHistory.length > 0) {
      lines.push("");
      lines.push("=== TOP 10 SLOW CANVASTABLE FRAMES ===");
      lines.push("-".repeat(70));

      const topSlow = [...this.ctFrameHistory]
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 10);

      lines.push(
        `${"Frame".padStart(6)} | ` +
          `${"Total".padStart(8)} | ` +
          `${"Renderer".padStart(8)} | ` +
          `${"NonRender".padStart(8)} | ` +
          `${"Overlays".padStart(8)} | ` +
          `${"RAF int".padStart(8)} | ` +
          `${"Coalesced".padStart(8)}`,
      );
      lines.push("-".repeat(70));

      for (const frame of topSlow) {
        lines.push(
          `${frame.frameId.toString().padStart(6)} | ` +
            `${frame.totalTime.toFixed(1).padStart(8)} | ` +
            `${frame.rendererRenderTime.toFixed(1).padStart(8)} | ` +
            `${frame.nonRendererTime.toFixed(1).padStart(8)} | ` +
            `${frame.overlaysTime.toFixed(1).padStart(8)} | ` +
            `${(frame.rafInterval === null ? "N/A" : frame.rafInterval.toFixed(1)).padStart(8)} | ` +
            `${frame.coalescedCount.toString().padStart(8)}`,
        );
      }
    }

    return lines.join("\n");
  }

  /**
   * 打印性能统计报告到控制台
   */
  printPerformanceReport(): void {
    console.log(this.getPerformanceReport());
  }

  /**
   * 重置性能统计数据
   */
  resetPerformanceStats(): void {
    this.renderer.resetPerformanceStats();
    this.ctFrameHistory = [];
    this.ctFrameCount = 0;
    this.ctLastRafTime = null;
    this.ctScheduledAt = null;
    this.ctCoalescedCount = 0;
  }

  /**
   * 获取 CanvasTable 最后一帧的诊断信息
   */
  private getCtLastFrameDiagnostics(): any {
    if (this.ctFrameHistory.length === 0) return null;
    return this.ctFrameHistory[this.ctFrameHistory.length - 1] ?? null;
  }

  /**
   * 获取 CanvasTable 最差帧的诊断信息（总时间最长的帧）
   */
  private getCtWorstFrameDiagnostics(): any {
    if (this.ctFrameHistory.length === 0) return null;
    return this.ctFrameHistory.reduce((worst, frame) =>
      frame.totalTime > worst.totalTime ? frame : worst,
    );
  }

  /**
   * 获取慢帧数组（总时间超过阈值的帧，默认 16ms）
   */
  private getCtSlowFrames(threshold: number = 16): any {
    return this.ctFrameHistory.filter((frame) => frame.totalTime > threshold);
  }

  /**
   * 获取完整的性能诊断信息（包含 CanvasTable 和 Renderer）
   */
  getPerformanceDiagnostics(): any {
    return {
      canvasTable: {
        frameHistory: [...this.ctFrameHistory],
        lastFrame: this.getCtLastFrameDiagnostics(),
        worstFrame: this.getCtWorstFrameDiagnostics(),
        slowFrames: this.getCtSlowFrames(),
      },
      renderer: this.renderer.getPerformanceDiagnostics(),
    };
  }

  // === 渲染缓存 API ===

  /**
   * 清空渲染缓存
   * 当数据外部变化时调用，确保缓存失效
   */
  clearRenderCache(): void {
    this.renderCache.clear();
  }

  /**
   * 获取渲染缓存统计信息
   */
  getRenderCacheStats(): {
    cellCacheSize: number;
    valueCacheSize: number;
    maxCellCacheSize: number;
  } {
    return this.renderCache.getStats();
  }

  // === 调试方法 ===

  /**
   * 获取当前的筛选配置
   * @returns 筛选配置数组
   */
  getFilterConfig(): FilterConfig[] {
    return this.dataManager.getFilters();
  }

  /**
   * 获取当前的排序配置
   * @returns 排序配置数组
   */
  getSortConfig(): SortConfig[] {
    return this.dataManager.getSort();
  }

  /**
   * 打印当前的筛选和排序状态到控制台
   */
  debugState(): void {
    console.group("CanvasTable State");
    console.log("Filters:", this.getFilterConfig());
    console.log("Sorts:", this.getSortConfig());
    console.groupEnd();
  }

  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    this.stopPendingAnimation();
    if (this.warningTooltipTimeout) {
      clearTimeout(this.warningTooltipTimeout);
      this.warningTooltipTimeout = null;
    }
    this.teardownAutoThemeDetection();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    window.removeEventListener("resize", this.handleResize);

    this.interactionManager.destroy();
    this.renderer.destroy();
    this.editorManager.destroy();
    this.filterInputManager.destroy();
    this.loadingOverlay.destroy();
    this.dataManager.destroy();

    if (this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
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
