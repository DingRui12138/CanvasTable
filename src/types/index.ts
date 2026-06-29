import type { CTDropdownOnChange, CTElement, JSXRenderContext } from "../core/jsx/types";

export type CellType =
  | "text"
  | "number"
  | "boolean"
  | "link"
  | "tag"
  | "date"
  | "custom"
  | "checkbox"
  | "radio"
  | "button"
  | "input"
  | "select"
  | "switch"
  | "image"
  | "progress"
  | "rating"
  | "color";

export const CellTypes = {
  TEXT: "text" as CellType,
  NUMBER: "number" as CellType,
  BOOLEAN: "boolean" as CellType,
  LINK: "link" as CellType,
  TAG: "tag" as CellType,
  DATE: "date" as CellType,
  CUSTOM: "custom" as CellType,
  CHECKBOX: "checkbox" as CellType,
  RADIO: "radio" as CellType,
  BUTTON: "button" as CellType,
  INPUT: "input" as CellType,
  SELECT: "select" as CellType,
  SWITCH: "switch" as CellType,
  IMAGE: "image" as CellType,
  PROGRESS: "progress" as CellType,
  RATING: "rating" as CellType,
  COLOR: "color" as CellType,
};

export type SortDirection = "asc" | "desc" | "none";

export type FixedType = "left" | "right" | false;

export type HorizontalAlign = "left" | "center" | "right";

export type VerticalAlign = "top" | "middle" | "bottom";

export type LocalePreset = "zh-CN" | "en-US";

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export interface CanvasTableLocale {
  emptyText: string;
  loadingText: string;
  contextMenu: {
    pinTop: string;
    pinBottom: string;
    unpin: string;
    addRowAbove: string;
    addRowBelow: string;
    deleteRow: string;
    hideColumn: string;
    showColumn: string;
  };
  filter: {
    searchPlaceholder: string;
    selectSearchPlaceholder: string;
    minPlaceholder: string;
    maxPlaceholder: string;
    startDatePlaceholder: string;
    endDatePlaceholder: string;
    reset: string;
    confirm: string;
    noData: string;
    loading: string;
    all: string;
    yes: string;
    no: string;
    selected: string;
    unselected: string;
  };
  cell: {
    selectPlaceholder: string;
    datePlaceholder: string;
    tagPlaceholder: string;
    numberPlaceholder: string;
    buttonText: string;
  };
  image: {
    uploadIdle: string;
    uploadDragging: string;
    uploading: string;
  };
  calendar: {
    months: string[];
    weekdays: string[];
    yearMonthFormat: string;
  };
}

export interface LocaleOptions {
  preset?: LocalePreset;
  messages?: DeepPartial<CanvasTableLocale>;
}

export type LocaleConfig = LocalePreset | DeepPartial<CanvasTableLocale> | LocaleOptions;

export interface CellStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  color?: string;
  backgroundColor?: string;
  horizontalAlign?: HorizontalAlign;
  verticalAlign?: VerticalAlign;
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  borderColor?: string;
  borderWidth?: number;
}

export interface CellAttributes {
  editable?: boolean;
  selectable?: boolean;
  colspan?: number;
  rowspan?: number;
  tooltip?: string;
  link?: string;
}

export interface CustomRenderContext {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
  theme: TableTheme;
  dpr: number;
}

export interface RenderResult {
  text?: string;
  type?: CellType;
  style?: CellStyle;
  attributes?: CellAttributes;
  placeholder?: string;
  checkbox?: CheckboxConfig;
  radio?: RadioConfig;
  button?: ButtonConfig | ButtonConfig[];
  /** 多按钮容器配置（仅当 button 为数组时生效） */
  buttonOptions?: ButtonsOptions;
  input?: InputConfig;
  select?: SelectConfig;
  tags?: TagsConfig;
  date?: DateConfig;
  link?: LinkConfig;
  switch?: SwitchConfig;
  image?: ImageConfig;
  progress?: ProgressConfig;
  rating?: RatingConfig;
  color?: ColorPickerConfig;
  customRender?: (context: CustomRenderContext) => void;
  /** JSX 渲染函数，返回 CTElement 树 */
  jsxRender?: (context: JSXRenderContext) => CTElement;
  /** JSX layout cache key. Use only for layout-affecting inputs; identical keys reuse layout trees. */
  jsxLayoutKey?: string | ((context: JSXRenderContext) => string | null | undefined);
  /** Star bounds for rating click detection */
  starBounds?: Array<{ index: number; x: number; width: number }>;
}

/**
 * 编辑渲染结果
 * 用于 editRender 返回，指定编辑时使用的控件类型和配置
 */
export interface EditRenderResult {
  type: CellType;
  input?: InputConfig;
  select?: SelectConfig;
  tags?: TagsConfig;
  date?: DateConfig;
  checkbox?: CheckboxConfig;
  radio?: RadioConfig;
  switch?: SwitchConfig;
  color?: ColorPickerConfig;
}

export interface TagItem {
  text: string;
  value?: string;
  color?: string;
  bgColor?: string;
  disabled?: boolean;
}

export interface TagsConfig {
  tags: TagItem[];
  maxVisible?: number;
  showMore?: boolean;
  editable?: boolean;
  options?: TagItem[];
  selectedValues?: string[];
  maxRows?: number;
  multiple?: boolean;
  placeholder?: string;
}

export interface CheckboxConfig {
  checked?: boolean;
  indeterminate?: boolean;
}

export interface RadioConfig {
  checked?: boolean;
  name?: string;
  value?: unknown;
  options?: RadioOption[];
}

export interface RadioOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

export interface ButtonConfig {
  text?: string;
  variant?: "default" | "primary" | "secondary" | "danger" | "warning" | "link";
  size?: "small" | "medium" | "large";
  actionKey?: string;
  visible?: boolean;
}

/** 多按钮容器配置（仅当 button 为数组时生效，挂在 RenderResult 上） */
export interface ButtonsOptions {
  maxVisible?: number;
  moreButtonText?: string;
  gap?: number;
}

export interface SwitchConfig {
  checked?: boolean;
  animationProgress?: number;
  animationDirection?: "forward" | "backward";
}

export interface SwitchAnimationState {
  cell: CellPosition;
  progress: number;
  targetProgress: number;
  startTime: number;
  startProgress: number;
}

// === 进度条类型定义 ===

/** 进度条形状类型 */
export type ProgressShape = "line" | "circle" | "dashboard";

/** 进度条预设尺寸 */
export type ProgressSize = "small" | "medium" | "large";

/** 进度条线帽样式 */
export type ProgressStrokeLinecap = "round" | "square" | "butt";

/** 进度条颜色区间配置 */
export interface ProgressColorStop {
  /** 进度值 (0-100) */
  value: number;
  /** 该进度点的颜色 */
  color: string;
}

/** 进度条配置 */
export interface ProgressConfig {
  /** 当前进度值 (0-100)，支持小数 */
  value: number;

  // === 形状与尺寸 ===
  /** 形状类型: 线型 | 圆环 | 仪表盘(半圆) */
  shape?: ProgressShape;
  /** 预设尺寸 */
  size?: ProgressSize;
  /** 自定义宽度（线型时为进度条宽度，环型时为圆环直径） */
  width?: number;
  /** 自定义高度（仅线型有效） */
  height?: number;
  /** 环型/仪表盘时的线条粗细 */
  strokeWidth?: number;
  /** 圆角半径（线型时有效），默认为高度的一半 */
  borderRadius?: number;

  // === 颜色配置 ===
  /** 进度条颜色，支持: 单色 | 渐变色区间 | 函数动态计算 */
  color?: string | ProgressColorStop[] | ((value: number) => string);
  /** 轨道颜色 */
  trackColor?: string;
  /** 线帽样式（环型/仪表盘时有效） */
  strokeLinecap?: ProgressStrokeLinecap;

  // === 文本显示 ===
  /** 是否显示百分比文本 */
  showText?: boolean;
  /** 自定义文本格式化函数 */
  format?: (value: number) => string;
  /** 文本颜色 */
  textColor?: string;
  /** 文本位置（线型时）: inside | right */
  textPosition?: "inside" | "right";

  // === 交互 ===
  /** 是否可交互（点击调整进度） */
  interactive?: boolean;
  /** 小数位数，默认 0（整数百分比，如 45%），设为 1 则显示一位小数（如 45.5%） */
  precision?: number;

  // === 状态 ===
  /** 进度条状态 */
  status?: "normal" | "success" | "warning" | "error";
}

// === 评分类型定义 ===

/** 评分配置 */
export interface RatingConfig {
  /** 当前评分值 (0-max) */
  value: number;
  /** 最大评分，默认 5 */
  max?: number;
  /** 星星大小，默认 16 */
  starSize?: number;
  /** 是否允许半星，默认 false */
  allowHalf?: boolean;
  /** 星星颜色，默认金色 */
  color?: string;
  /** 未激活颜色，默认灰色 */
  inactiveColor?: string;
  /** 禁用状态颜色 */
  disabledColor?: string;
}

// === 颜色选择器类型定义 ===

/** 颜色选择器配置 */
export interface ColorPickerConfig {
  /** 当前颜色值 (hex: #RRGGBB) */
  value: string;
  /** 是否显示颜色值文本，默认 false */
  showText?: boolean;
  /** 预设颜色列表 */
  presetColors?: string[];
}

/** 颜色选择下拉框状态 */
export interface ColorPickerDropdownState {
  cell: CellPosition;
  config: ColorPickerConfig;
  x: number;
  y: number;
  width: number;
  hoveredColor: string | null;
}

// === 其他类型定义 ===

export interface ButtonHoverState {
  cell: CellPosition;
  progress: number;
  targetProgress: number;
  startTime: number;
  startProgress: number;
}

export interface InputConfig {
  value?: string;
  placeholder?: string;
  readonly?: boolean;
  type?: "text" | "number" | "password";
  multiline?: boolean;
  maxRows?: number;
}

export interface SelectOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

export interface SelectConfig {
  value?: unknown;
  options: SelectOption[];
  placeholder?: string;
  multiple?: boolean;
  /** 多选时各项分隔符，不指定则使用表格全局配置或默认 ", " */
  separator?: string;
}

export interface DateConfig {
  value?: string | Date;
  format?: string;
  placeholder?: string;
  min?: string | Date;
  max?: string | Date;
}

export interface LinkConfig {
  text?: string;
  link: string;
}

export interface ImageConfig {
  /** 图片来源 URL 或 base64 */
  src?: string;
  /** 图片宽度，默认 32 */
  width?: number;
  /** 图片高度，默认 32 */
  height?: number;
  /** 是否允许图片尺寸随行高放大，默认 true；设为 false 时按标准行高限制图片尺寸 */
  scaleWithRowHeight?: boolean;
  /** 图片适应方式，默认 'cover' */
  fit?: "fill" | "contain" | "cover" | "none";
  /** 圆角半径，默认 0 */
  borderRadius?: number;
  /** 是否圆形，默认 false */
  circle?: boolean;
  /** 占位图 URL 或 base64 */
  placeholder?: string;
  /** 加载失败时显示的图片 */
  errorImage?: string;
  /** 是否可点击，默认 false */
  clickable?: boolean;
  /** Tooltip 提示文本 */
  tooltip?: string;
  /** 是否启用懒加载，默认 true */
  lazy?: boolean;
  /** 懒加载阈值（距离可视区域多少像素开始加载），默认 200 */
  lazyThreshold?: number;

  // 多图模式配置
  /** 图片数组（多图模式） */
  images?: string[];
  /** 多图模式下最大显示数量。不指定时根据单元格宽高自动计算 */
  maxVisible?: number;
  /** 多图间距，默认 4 */
  gap?: number;
  /** 是否显示 +N 计数，默认 true */
  showMoreCount?: boolean;

  // Hover 效果配置
  /** 是否启用 hover 效果，默认 true */
  hoverable?: boolean;

  // 编辑配置
  /** 上传处理函数，返回上传后的图片 URL */
  onUpload?: (file: File) => Promise<string>;
  /** 是否支持多选上传，默认 true */
  multiple?: boolean;
  /** 最大上传数量 */
  maxCount?: number;
  /** 允许的文件类型，默认 'image/*' */
  accept?: string;
}

export interface Column {
  /** 唯一标识符（必需，必须唯一） */
  key: string;
  /** 数据字段映射（可选，默认等于 key） */
  field?: string;
  title: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  fixed?: FixedType;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  disabled?: DisabledValue;
  hideable?: boolean;
  reorderable?: boolean; // 是否允许拖拽排序，默认 true
  type?: CellType;
  align?: HorizontalAlign;
  hidden?: boolean;
  /** 值为空时显示的提示文字（仅对 text/number 等文字型列生效） */
  placeholder?: string;
  render?: (value: unknown, row: Row, column: Column, rowIndex: number) => RenderResult;
  /** 编辑时使用的渲染函数，返回编辑器类型和配置 */
  editRender?: (value: unknown, row: Row, rowIndex: number) => EditRenderResult;
  formatter?: (value: unknown, row: Row, column: Column) => string;
  /** 提交编辑值前的校验。返回 true 表示通过，返回 string/false/object 表示失败或警告。支持返回 Promise 实现异步校验。 */
  validate?: (value: unknown, row: Row, column: Column) => ValidateResult | Promise<ValidateResult>;
  editor?: CellEditor;
  filter?: ColumnFilter;
  children?: Column[];
  colspan?: number;
  rowspan?: number;
  depth?: number;
  parentKey?: string;

  // ==================== 渲染缓存相关 ====================

  /**
   * 渲染缓存模式
   * - 'cell': 按 row.id + column.id 缓存（默认，安全）
   * - 'value': 按 column.id + value 缓存（高效，但 render 必须只依赖 value）
   * - false: 不缓存
   */
  cacheMode?: "cell" | "value" | false;

  /**
   * 是否缓存渲染结果
   * - true: 缓存（默认）
   * - false: 不缓存
   * @deprecated 请使用 cacheMode 代替
   */
  cacheRender?: boolean;
}

export interface CellMerge {
  rowIndex: number;
  columnIndex: number;
  rowspan: number;
  colspan: number;
}

export interface Row {
  id?: string;
  data: Record<string, unknown>;
  children?: Row[];
  expanded?: boolean;
  selected?: boolean;
  level?: number;
  cellMerges?: CellMerge[];
  expandable?: boolean;
}

export interface SummaryConfig {
  enabled?: boolean;
  position?: "top" | "bottom";
  scope?: "view" | "all";
  rows: SummaryRowConfig[];
  style?: SummaryStyle;
}

export interface SummaryRowConfig {
  key: string;
  height?: number;
  cells?: SummaryCellConfig[];
  build?: (context: SummaryContext) => SummaryCellConfig[] | SummaryRowResult;
}

export interface SummaryRowResult {
  cells: SummaryCellConfig[];
  height?: number;
}

export interface SummaryContext {
  columns: Column[];
  visibleLeafColumns: Column[];
  viewRows: Row[];
  allRows: Row[];
  scopeRows: Row[];
}

export interface SummaryCellConfig {
  columnKey?: string;
  startColumnKey?: string;
  endColumnKey?: string;
  text?: string;
  value?: unknown;
  type?: CellType;
  style?: CellStyle;
  render?: (context: SummaryCellRenderContext) => RenderResult;
}

export interface SummaryCellRenderContext {
  cell: SummaryCellConfig;
  row: ComputedSummaryRow;
  rowIndex: number;
  column: Column;
  columnIndex: number;
  context: SummaryContext;
}

export interface SummaryStyle {
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  fontWeight?: "normal" | "bold";
}

export interface ComputedSummaryRow {
  key: string;
  height: number;
  cells: ComputedSummaryCell[];
  source: SummaryRowConfig;
}

export interface ComputedSummaryCell {
  key: string;
  startColumnIndex: number;
  endColumnIndex: number;
  startColumnKey: string;
  endColumnKey: string;
  config: SummaryCellConfig;
  renderResult: RenderResult;
}

export interface ComputedSummaryResult {
  enabled: boolean;
  position: "top" | "bottom";
  scope: "view" | "all";
  rows: ComputedSummaryRow[];
}

export type DisabledValue = boolean | ((row: Row, column: Column) => boolean);

export interface HeaderCell {
  column: Column;
  x: number;
  y: number;
  width: number;
  height: number;
  rowIndex: number;
  colIndex: number;
  colspan: number;
  rowspan: number;
  isLeaf: boolean;
}

export interface TableData {
  rows: Row[];
  columns: Column[];
  meta?: TableMeta;
}

export interface TableMeta {
  totalCount?: number;
  pageSize?: number;
  pageNumber?: number;
  hasMore?: boolean;
}

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface FilterOperator {
  type: "text" | "number" | "date" | "enum";
  operators: string[];
}

export interface FilterConfig {
  column: string;
  operator: string;
  value: unknown;
}

/** 筛选模式类型 */
export type FilterMode =
  | "search" // 关键字搜索（text, link）
  | "select" // 多选（select, tags, radio, color）
  | "range" // 范围（number, progress）
  | "dateRange" // 日期范围
  | "boolean"; // 布尔（checkbox, switch）

export interface ColumnFilter {
  type: "text" | "number" | "date" | "enum";
  options?: Array<{ label: string; value: unknown }>;
  custom?: (value: unknown, filterValue: unknown, row: Row) => boolean;
  /** 筛选模式，覆盖默认推断的模式 */
  mode?: FilterMode;
  /** 禁用筛选 */
  disabled?: boolean;
}

export interface CellEditor {
  type: "text" | "number" | "select" | "date" | "checkbox";
  options?: Array<{ label: string; value: unknown }>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  validate?: (value: unknown, row: Row, column: Column) => ValidateResult | Promise<ValidateResult>;
}

export interface CellPosition {
  rowIndex: number;
  columnIndex: number;
}

export interface CellInfo extends CellPosition {
  row: Row;
  column: Column;
}

export type ValidationLevel = "error" | "warning";

export type ValidateResult =
  | boolean
  | string
  | {
      valid: boolean;
      message?: string;
      level?: ValidationLevel;
    };

export interface ValidationError {
  cell: CellPosition;
  row: Row;
  column: Column;
  value: unknown;
  message: string;
  level: ValidationLevel;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface SelectionConfig {
  mode: "cell" | "row" | "column" | "range";
  multi?: boolean;
  showCheckbox?: boolean;
}

export interface EditingConfig {
  enabled?: boolean;
  mode?: "click" | "dblclick" | "keyboard";
  validateOnChange?: boolean;
}

export interface WatermarkConfig {
  enabled?: boolean;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  opacity?: number;
  rotation?: number;
  gapX?: number;
  gapY?: number;
  zIndex?: number;
}

export interface VirtualScrollConfig {
  enabled?: boolean;
  rowBufferSize?: number;
  columnBufferSize?: number;
  estimatedRowHeight?: number;
  estimatedColumnWidth?: number;
}

/**
 * 懒加载配置
 */
export interface LazyLoadConfig {
  /** 是否启用懒加载 */
  enabled: boolean;
  /** 触发加载的阈值（距离底部的行数），默认 5 */
  threshold?: number;
}

/**
 * 加载更多参数
 */
export interface LoadMoreParams {
  /** 当前数据量（已有行数） */
  startIndex: number;
  /** 当前滚动位置 */
  scrollTop: number;
  /** 滚动方向 */
  direction: "down" | "up";
}

export interface TableTheme {
  name?: string;
  colors: {
    background: string;
    headerBackground: string;
    headerText: string;
    rowBackground: string;
    rowAltBackground: string;
    rowHoverBackground: string;
    rowSelectedBackground: string;
    cellText: string;
    cellBorder: string;
    selectionBorder: string;
    linkColor: string;
    placeholderText: string;
    primary: string;
    tagColors: Record<string, string>;
    date: {
      border: string;
      icon: string;
    };
    input: {
      border: string;
      focusBorder: string;
      background: string;
      text: string;
      placeholder: string;
    };
    checkbox: {
      border: string;
      checkedBg: string;
      checkmark: string;
      disabledBg: string;
    };
    radio: {
      border: string;
      checkedBg: string;
      dot: string;
      disabledBg: string;
    };
    switch: {
      onBg: string;
      offBg: string;
      thumb: string;
      disabledOnBg: string;
      disabledOffBg: string;
    };
    button: {
      background: string;
      text: string;
      border: string;
      hoverBg: string;
      primaryBg: string;
      primaryText: string;
      dangerBg: string;
      dangerText: string;
      warningBg: string;
      warningText: string;
      linkText: string;
      disabledBg: string;
      disabledText: string;
      disabledBorder: string;
    };
    dropdown: {
      background: string;
      border: string;
      hoverBg: string;
      selectedBg: string;
      text: string;
    };
    scrollbar: {
      track: string;
      thumb: string;
      thumbHover: string;
      thumbActive: string;
      opacity: number;
    };
    progress: {
      track: string;
      default: string;
      success: string;
      warning: string;
      error: string;
    };
    indicator: {
      active: string;
      inactive: string;
    };
    tooltip: {
      background: string;
      text: string;
      gap: number;
    };
    image: {
      hoverBorder: string;
      hoverShadow: string;
      placeholderBg: string;
      errorBg: string;
      errorBorder: string;
    };
    hiddenPlaceholder: {
      hoverBg: string;
    };
    moreCount: {
      background: string;
      text: string;
    };
    shadow: {
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
    watermark: {
      color: string;
      fontSize: number;
      fontFamily?: string;
      opacity: number;
    };
    loading?: {
      background: string;
      spinnerBorder: string;
      spinnerActive: string;
      text: string;
    };
  };
  font: {
    family: string;
    size: number;
    headerSize: number;
  };
  row: {
    height: number;
    headerHeight: number;
    minHeight: number;
    maxHeight: number;
    resizeGuideColor: string;
    resizeGuideWidth: number;
  };
  border: {
    width: number;
    color: string;
  };
}

export interface TableStyles {
  header?: CellStyle;
  cell?: CellStyle;
  oddRow?: CellStyle;
  evenRow?: CellStyle;
  selectedRow?: CellStyle;
  hoverRow?: CellStyle;
}

export interface FeatureConfig {
  sort?: boolean;
  filter?: boolean;
  edit?: boolean;
  select?: boolean;
  export?: boolean;
  resize?: boolean;
  reorder?: boolean;
  fixedColumns?: boolean;
  tree?: boolean;
  aggregate?: boolean;
}

export interface ViewConfig {
  columnWidths: Record<string, number>;
  columnOrder: string[];
  hiddenColumns: string[];
  fixedColumns: { left: string[]; right: string[] };
  sort: SortConfig[];
  filters: FilterConfig[];
}

export interface ExportMerge {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface ExcelExportFormat {
  key: string;
  type?: "number" | "date";
  formatCode: string;
}

export interface ExcelFreezeOptions {
  header?: boolean;
  leftFixedColumns?: boolean;
  xSplit?: number;
  ySplit?: number;
}

export interface ExcelExportOptions {
  hierarchicalHeaders?: boolean;
  columnWidths?: "view" | "schema" | Array<{ key: string; width: number }>;
  merges?: ExportMerge[];
  freeze?: ExcelFreezeOptions;
  formats?: ExcelExportFormat[];
}

export interface ExportCellContext {
  column: Column;
  rawValue: unknown;
  displayValue: string;
}

export interface ExportRowContext {
  row: Row;
  rowIndex: number;
  cells: ExportCellContext[];
}

export interface ExportContext {
  columnTree: Column[];
  leafColumns: Column[];
  rows: ExportRowContext[];
  summaryTopRows?: ComputedSummaryRow[];
  summaryBottomRows?: ComputedSummaryRow[];
  bodyMerges: ExportMerge[];
  headerDepth: number;
  leftFixedLeafColumnCount: number;
}

export interface ExportOptions {
  format: "csv" | "excel" | "json";
  filename?: string;
  includeHeaders?: boolean;
  includeHidden?: boolean;
  selectedOnly?: boolean;
  excel?: ExcelExportOptions;
}

export interface Change {
  type: "update" | "add" | "delete";
  rowIndex: number;
  column?: string;
  oldValue?: unknown;
  newValue?: unknown;
  row?: Row;
}

/** 历史记录操作类型 */
export type HistoryActionType = "update" | "add" | "delete";

/** 更新操作历史数据 */
export interface UpdateHistoryData {
  type: "update";
  row: Row;
  column: string;
  oldValue: unknown;
  newValue: unknown;
}

/** 新增操作历史数据 */
export interface AddHistoryData {
  type: "add";
  row: Row;
  rowIndex: number;
  rowData: Row;
}

/** 删除操作历史数据 */
export interface DeleteHistoryData {
  type: "delete";
  row: Row;
  rowIndex: number;
  rowData: Row;
}

/** 历史记录操作 */
export type HistoryAction = UpdateHistoryData | AddHistoryData | DeleteHistoryData;

/** 历史记录配置 */
export interface HistoryOptions {
  /** 最大保存操作数，默认 200，设为 0 禁用历史记录 */
  maxActions?: number;
}

export interface TableEventHandlers {
  onLoad?: (data: TableData) => void;
  onError?: (error: Error) => void;
  onChange?: (changes: Change[]) => void;
  onSort?: (sort: SortConfig[]) => void;
  onFilter?: (filters: FilterConfig[]) => void;
  onSelect?: (selection: CellRange[]) => void;
  onCellClick?: (cell: CellPosition, event: MouseEvent) => void;
  onCellDblClick?: (cell: CellPosition, event: MouseEvent) => void;
  onCellHover?: (cell: CellPosition | null, event: MouseEvent) => void;
  onRowClick?: (row: Row, rowIndex: number, event: MouseEvent) => void;
  onRowDblClick?: (row: Row, rowIndex: number, event: MouseEvent) => void;
  onRowHeightChange?: (row: Row, newHeight: number, rowIndex: number) => void;
  onRowPinChange?: (row: Row, position: RowPinPosition | null) => void;
  onHeaderClick?: (column: Column, columnIndex: number, event: MouseEvent) => void;
  onScroll?: (scrollLeft: number, scrollTop: number) => void;
  onColumnResize?: (column: Column, width: number) => void;
  onColumnReorder?: (columns: string[]) => void;
  onEditStart?: (cell: CellPosition) => void;
  onEditEnd?: (cell: CellPosition, value: unknown) => void;
  onExpand?: (row: Row, rowIndex: number, expanded: boolean) => void;
  onCheckboxChange?: (cell: CellPosition, checked: boolean) => void;
  onRadioChange?: (cell: CellPosition, value: unknown) => void;
  onButtonClick?: (cell: CellPosition, actionKey?: string) => void;
  onSwitchChange?: (cell: CellPosition, checked: boolean) => void;
  onSelectChange?: (cell: CellPosition, value: unknown) => void;
  onTagsChange?: (cell: CellPosition, values: unknown[]) => void;
  onProgressChange?: (cell: CellPosition, value: number) => void;
  onRatingChange?: (cell: CellPosition, value: number) => void;
  onColorChange?: (cell: CellPosition, color: string) => void;
  onColumnHide?: (columnKey: string) => void;
  onColumnShow?: (columnKey: string) => void;
  onImageClick?: (cell: CellPosition, imageSrc: string, event: MouseEvent) => void;
  /** 图片上传成功回调 */
  onImageUpload?: (cell: CellPosition, url: string) => void;
  /** 图片删除回调 */
  onImageDelete?: (cell: CellPosition, deletedImage: string, index: number) => void;
  /** 懒加载触发回调 */
  onLoadMore?: (params: LoadMoreParams) => void;
  /** 单元格校验失败回调 */
  onValidationError?: (error: ValidationError) => void;
}

export type ThemeMode = "light" | "dark" | "auto";

/**
 * 图片加载队列配置
 */
export interface ImageLoadConfig {
  /** 最大并发加载数，默认 6 */
  maxConcurrent?: number;
  /** 缓存最大数量，默认 200 */
  maxCacheSize?: number;
}

export interface CanvasTableBaseProps {
  rows: Row[] | Promise<Row[]> | (() => Promise<Row[]>);
  columns: Column[];
  width?: number | string;
  height?: number | string;
  virtualScroll?: VirtualScrollConfig;
  bufferSize?: number;
  selection?: SelectionConfig;
  editing?: EditingConfig;
  theme?: Partial<TableTheme>;
  themeMode?: ThemeMode;
  styles?: TableStyles;
  features?: FeatureConfig;
  rowKey?: string;
  showHeader?: boolean;
  showRowNumbers?: boolean;
  stripeRows?: boolean;
  hoverable?: boolean;
  loading?: boolean;
  /** Loading overlay text, defaults to locale.loadingText */
  loadingText?: string;
  emptyText?: string;
  /** 文案配置，默认 zh-CN。可传 "en-US" 或局部覆盖文案 */
  locale?: LocaleConfig;
  watermark?: WatermarkConfig;
  expandColumnKey?: string;
  defaultExpandedRowKeys?: string[];
  createRowData?: (columns: Column[]) => Record<string, unknown>;
  /** 懒加载配置 */
  lazyLoad?: LazyLoadConfig;
  /** 图片加载配置 */
  imageLoad?: ImageLoadConfig;
  /** 行高计算函数，返回每行高度。不指定则使用默认 32px */
  rowHeight?: (row: Row, rowIndex: number) => number;
  /** 是否启用行高拖拽调整 */
  enableRowHeightResize?: boolean;
  /** 是否允许行高拖拽调整。可全局关闭，也可按行动态控制 */
  rowResizable?: boolean | ((row: Row, rowIndex: number) => boolean);
  /** 是否启用行固定到顶部/底部 */
  enableRowPinning?: boolean;
  /** 是否允许行固定。可全局关闭，也可按行动态控制 */
  rowPinnable?: boolean | ((row: Row) => boolean);
  /** 合计行配置 */
  summary?: SummaryConfig;
  /** 多选列分隔符，默认 ", " */
  multipleSelectSeparator?: string;
}

export type CanvasTableProps = CanvasTableBaseProps & TableEventHandlers;

export interface LayoutInfo {
  totalWidth: number;
  totalHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  headerHeight: number;
  rowHeight: number;
  columnWidths: number[];
  rowOffsets: number[];
  columnOffsets: number[];
}

export interface VisibleRange {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  layout: LayoutInfo;
  visibleRange: VisibleRange;
  scrollLeft: number;
  scrollTop: number;
  theme: TableTheme;
  dpi: number;
}

export interface InteractionState {
  hoveredCell: CellPosition | null;
  selectedCells: CellRange[];
  editingCell: CellPosition | null;
  editingValue: unknown;
  isSelecting: boolean;
  selectionStart: CellPosition | null;
  isDragging: boolean;
  dragType:
    | "column-resize"
    | "column-reorder"
    | "row-reorder"
    | "row-resize"
    | "progress-drag"
    | null;
  dragTarget: unknown;
  rowResizeState?: {
    rowIndex: number;
    startY: number;
    startHeight: number;
    displayHeight: number;
  };
  /** 进度条拖拽状态 */
  progressDragState?: {
    cell: CellPosition;
    config: ProgressConfig;
    column: Column;
    row: Row;
    startX: number;
    startValue: number;
    displayValue: number; // 拖拽过程中的临时显示值
  };
  tooltip: TooltipState | null;
  dropdown: DropdownState | null;
  filterDropdown: FilterDropdownState | null;
  dateDropdown: DateDropdownState | null;
  colorDropdown: ColorPickerDropdownState | null;
  buttonsDropdown: ButtonsDropdownState | null;
  imageTooltip: ImageTooltipState | null;
  imageEditor: ImageEditorState | null;
  contextMenu: ContextMenuState | null;
  headerContextMenu: HeaderContextMenuState | null;
  switchAnimations: Map<string, SwitchAnimationState>;
  buttonHoverStates: Map<string, ButtonHoverState>;
  hoveredButtonIndex?: number; // 当前 hover 的多按钮索引（buttons 类型）
  hoveredHeaderColumnKey?: string;
  hoveredImageIndex?: number; // 当前 hover 的图片索引（多图模式）
  columnReorderState?: {
    dragColumnIndex: number;
    dragColumnKey: string;
    dragStartX: number;
    currentX: number;
    targetColumnIndex: number;
    isParentColumn?: boolean;
    isFixedColumn?: boolean;
    // 同级列信息：预先计算，拖拽过程中只在这些列之间判断
    siblingColumns?: Array<{
      key: string; // 列的 key
      left: number; // 左边界（视口坐标）
      right: number; // 右边界（视口坐标）
      center: number; // 中线位置（视口坐标）
      width: number; // 宽度
      leafCount: number; // 包含的叶子列数量（父列>1，普通列=1）
      firstLeafIndex: number; // 第一个叶子列的索引
      fixed: FixedType; // 列的固定属性
    }>;
    dragSiblingIndex: number; // 被拖拽列在同级列中的索引
    lastSwapTime?: number; // 上次交换的时间戳（用于防抖）
    lastSwapTargetKey?: string; // 上次交换的目标列 key（用于防止重复交换）
  };
}

export interface DropdownState {
  cell: CellPosition;
  config: SelectConfig;
  x: number;
  y: number;
  width: number;
  scrollTop: number;
  hoveredIndex: number;
  type?: "select" | "tags";
  tagsConfig?: TagsConfig;
  showAbove?: boolean;
  source?: "cell" | "jsx";
  onChange?: CTDropdownOnChange;
  row?: Row;
  column?: Column;
  rowIndex?: number;
  colIndex?: number;
}

export interface FilterDropdownState {
  columnKey: string;
  mode: FilterMode;
  x: number;
  y: number;
  width: number;
  scrollTop: number;
  hoveredIndex: number;
  // select 模式
  options?: Array<{ label: string; value: unknown; checked: boolean }>;
  searchText: string;
  // search 模式
  searchValue?: string;
  // range 模式
  minValue?: number | string;
  maxValue?: number | string;
  // dateRange 模式
  startDate?: Date | null;
  endDate?: Date | null;
  activeDateField?: "startDate" | "endDate"; // 当前正在编辑的日期字段
  currentYear?: number; // 日历显示的年
  currentMonth?: number; // 日历显示的月
  hoveredDate?: Date | null; // 日历中 hover 的日期
  // boolean 模式
  boolValue?: "all" | "true" | "false";
  // UI 状态
  isScrollbarDragging?: boolean;
  scrollbarDragStartY?: number;
  scrollbarDragStartScrollTop?: number;
  isLoading?: boolean;
}

export interface TooltipState {
  cell: CellPosition;
  x: number;
  y: number;
  width?: number;
  content: TooltipContent;
}

export type TooltipContent = { type: "text"; text: string } | { type: "tags"; tags: TagItem[] };

export interface DateDropdownState {
  cell: CellPosition;
  config: DateConfig;
  x: number;
  y: number;
  width: number;
  currentYear: number;
  currentMonth: number;
  selectedDate: Date | null;
  hoveredDate: Date | null;
  showAbove?: boolean;
}

export interface ButtonsDropdownState {
  cell: CellPosition;
  x: number;
  y: number;
  buttons: ButtonConfig[];
  hoveredIndex: number;
  buttonRelativeX: number;
  buttonY: number;
  buttonHeight: number;
  showAbove: boolean;
}

export interface ImageTooltipState {
  cell: CellPosition;
  x: number;
  y: number;
  images: string[];
  hoveredIndex: number;
  scrollTop: number;
  maxRows: number;
  showAbove: boolean;
}

export interface ImageEditorState {
  cell: CellPosition;
  x: number;
  y: number;
  images: string[];
  hoveredIndex: number;
  scrollTop: number;
  maxRows: number;
  showAbove: boolean;
  isDragging: boolean;
  pendingImages: Array<{ file: File; preview: string }>;
  /** 是否为单图模式 */
  isSingleImage: boolean;
}

export type RowPinPosition = "top" | "bottom";

export type RowBandType =
  | "summary-top"
  | "pinned-top"
  | "body"
  | "pinned-bottom"
  | "summary-bottom";

export interface RowBand<T extends Row | ComputedSummaryRow = Row> {
  type: RowBandType;
  rows: T[];
  height: number;
  y: number;
}

export interface RowBands {
  summaryTop: RowBand<ComputedSummaryRow>;
  pinnedTop: RowBand;
  body: RowBand;
  pinnedBottom: RowBand;
  summaryBottom: RowBand<ComputedSummaryRow>;
}

export interface RowHitResult {
  row: Row | ComputedSummaryRow;
  band: RowBandType;
  columnIndex: number;
}

export interface ContextMenuItem {
  key: string;
  text: string;
  danger?: boolean;
  disabled?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  row: Row;
  hoveredIndex: number;
  items: ContextMenuItem[];
}

export interface HeaderContextMenuState {
  x: number;
  y: number;
  columnKey: string;
  columnIndex: number;
  hoveredIndex: number;
}

export interface ScrollState {
  scrollLeft: number;
  scrollTop: number;
  maxScrollLeft: number;
  maxScrollTop: number;
  isScrolling: boolean;
}

export interface ScrollbarState {
  verticalHovered: boolean;
  horizontalHovered: boolean;
  verticalDragging: boolean;
  horizontalDragging: boolean;
  dragStartY: number;
  dragStartScrollTop: number;
  dragStartX: number;
  dragStartScrollLeft: number;
}

export interface DataManagerState {
  rows: Row[];
  filteredRows: Row[];
  sortedRows: Row[];
  columns: Column[];
  filters: FilterConfig[];
  sort: SortConfig[];
  loading: boolean;
  error: Error | null;
}

export interface CanvasTableAPI {
  setRows(rows: Row[]): void;
  getRows(): Row[];
  getRow(rowIndex: number): Row | undefined;
  getColumns(): Column[];
  setColumns(columns: Column[]): void;
  scrollToRow(rowIndex: number, column?: number): Promise<void>;
  scrollTo(scrollLeft: number, scrollTop: number): void;
  getScrollPosition(): { scrollLeft: number; scrollTop: number };
  getSelectedCells(): CellPosition[];
  getSelectedRows(): number[];
  getPinnedRows(position: RowPinPosition): Row[];
  setSelectedCells(cells: CellPosition[]): void;
  setSelectedRows(rows: number[]): void;
  clearSelection(): void;
  updateCell(rowIndex: number, column: string, value: unknown): Promise<void>;
  updateRow(rowIndex: number, data: Record<string, unknown>): Promise<void>;
  getValidationErrors(): ValidationError[];
  getValidationError(cell: CellPosition): ValidationError | null;
  clearValidationErrors(): void;
  addRow(data: Record<string, unknown>, index?: number): void;
  deleteRow(rowIndex: number): void;
  sort(configs: SortConfig[]): void;
  getSortConfig(): SortConfig[];
  filter(configs: FilterConfig[]): void;
  getFilterConfig(): FilterConfig[];
  clearFilters(): void;
  export(options: ExportOptions): Promise<Blob>;
  getViewConfig(): ViewConfig;
  setViewConfig(config: ViewConfig): void;
  setLocale(locale: LocaleConfig): void;
  getLocale(): CanvasTableLocale;
  hideColumn(columnKey: string): void;
  showColumn(columnKey: string): void;
  refresh(): void;
  resize(): void;
  destroy(): void;
  getCanvas(): HTMLCanvasElement;
  getLayoutInfo(): LayoutInfo;
  /** 追加数据行（用于懒加载） */
  appendRows(rows: Row[]): void;
  /** 设置加载更多状态（用于防止重复触发） */
  setLoadingMore(loading: boolean): void;
  /** 设置是否还有更多数据（false 表示加载完成） */
  setHasMore(hasMore: boolean): void;
}

export type EventCallback<T = unknown> = (data: T) => void;

export interface EventEmitter {
  on<K extends keyof TableEventHandlers>(
    event: K,
    callback: NonNullable<TableEventHandlers[K]>,
  ): void;
  off<K extends keyof TableEventHandlers>(
    event: K,
    callback: NonNullable<TableEventHandlers[K]>,
  ): void;
  emit<K extends keyof TableEventHandlers>(
    event: K,
    ...args: Parameters<NonNullable<TableEventHandlers[K]>>
  ): void;
}

/**
 * 鼠标区域类型
 */
export type MouseRegion = "left-fixed" | "right-fixed" | "scrollable";

/**
 * 滚动条信息
 */
export interface HitTestScrollbar {
  type: "vertical" | "horizontal";
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * 统一命中测试结果
 */
export interface HitTestResult {
  /** 鼠标所在的区域 */
  region: "scrollbar-vertical" | "scrollbar-horizontal" | "header" | "cell" | "outside";

  /** 区域详细信息（固定列/滚动区域） */
  regionDetail?: MouseRegion;

  /** 滚动条信息 */
  scrollbar?: HitTestScrollbar;

  /** 列头单元格 */
  headerCell?: HeaderCell;

  /** 是否在 resize handle 上 */
  isResizeHandle?: boolean;

  /** resize handle 对应的列索引 */
  resizeColumnIndex?: number;

  /** 是否在行高 resize handle 上 */
  isRowResizeHandle?: boolean;

  /** row resize handle 对应的行索引 */
  resizeRowIndex?: number;

  /** 单元格位置 */
  cell?: { rowIndex: number; columnIndex: number };

  /** 行命中信息，包含所属 row band */
  rowHit?: RowHitResult;

  /** 视口坐标 */
  viewport: { x: number; y: number };
}
