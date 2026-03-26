export type CellType = 'text' | 'number' | 'boolean' | 'link' | 'tag' | 'date' | 'custom' | 'checkbox' | 'radio' | 'button' | 'buttons' | 'input' | 'select' | 'switch' | 'image' | 'progress';
export type SortDirection = 'asc' | 'desc' | 'none';
export type FixedType = 'left' | 'right' | false;
export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
export interface CellStyle {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    color?: string;
    backgroundColor?: string;
    horizontalAlign?: HorizontalAlign;
    verticalAlign?: VerticalAlign;
    padding?: number | {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
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
    checkbox?: CheckboxConfig;
    radio?: RadioConfig;
    button?: ButtonConfig;
    buttons?: ButtonsConfig;
    input?: InputConfig;
    select?: SelectConfig;
    tags?: TagsConfig;
    date?: DateConfig;
    link?: LinkConfig;
    switch?: SwitchConfig;
    image?: ImageConfig;
    progress?: ProgressConfig;
    customRender?: (context: CustomRenderContext) => void;
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
    variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'link';
    size?: 'small' | 'medium' | 'large';
    actionKey?: string;
    visible?: boolean;
}
export interface ButtonsConfig {
    buttons: ButtonConfig[];
    maxVisible?: number;
    moreButtonText?: string;
    gap?: number;
}
export interface SwitchConfig {
    checked?: boolean;
    animationProgress?: number;
    animationDirection?: 'forward' | 'backward';
}
export interface SwitchAnimationState {
    cell: CellPosition;
    progress: number;
    targetProgress: number;
    startTime: number;
    startProgress: number;
}
/** 进度条形状类型 */
export type ProgressShape = 'line' | 'circle' | 'dashboard';
/** 进度条预设尺寸 */
export type ProgressSize = 'small' | 'medium' | 'large';
/** 进度条线帽样式 */
export type ProgressStrokeLinecap = 'round' | 'square' | 'butt';
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
    /** 进度条颜色，支持: 单色 | 渐变色区间 | 函数动态计算 */
    color?: string | ProgressColorStop[] | ((value: number) => string);
    /** 轨道颜色 */
    trackColor?: string;
    /** 线帽样式（环型/仪表盘时有效） */
    strokeLinecap?: ProgressStrokeLinecap;
    /** 是否显示百分比文本 */
    showText?: boolean;
    /** 自定义文本格式化函数 */
    format?: (value: number) => string;
    /** 文本颜色 */
    textColor?: string;
    /** 文本位置（线型时）: inside | right */
    textPosition?: 'inside' | 'right';
    /** 是否可交互（点击调整进度） */
    interactive?: boolean;
    /** 进度条状态 */
    status?: 'normal' | 'success' | 'warning' | 'error';
}
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
    type?: 'text' | 'number' | 'password';
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
    /** 图片适应方式，默认 'cover' */
    fit?: 'fill' | 'contain' | 'cover' | 'none';
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
    /** 图片数组（多图模式） */
    images?: string[];
    /** 多图模式下最大显示数量，默认 3 */
    maxVisible?: number;
    /** 多图间距，默认 4 */
    gap?: number;
    /** 是否显示 +N 计数，默认 true */
    showMoreCount?: boolean;
    /** 是否启用 hover 效果，默认 true */
    hoverable?: boolean;
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
    reorderable?: boolean;
    type?: CellType;
    align?: HorizontalAlign;
    hidden?: boolean;
    render?: (value: unknown, row: Row, column: Column, rowIndex: number) => RenderResult;
    /** 编辑时使用的渲染函数，返回编辑器类型和配置 */
    editRender?: (value: unknown, row: Row, rowIndex: number) => EditRenderResult;
    formatter?: (value: unknown, row: Row, column: Column) => string;
    editor?: CellEditor;
    filter?: ColumnFilter;
    children?: Column[];
    colspan?: number;
    rowspan?: number;
    depth?: number;
    parentKey?: string;
}
export interface CellMerge {
    rowIndex: number;
    columnIndex: number;
    rowspan: number;
    colspan: number;
}
export interface Row {
    id: string;
    data: Record<string, unknown>;
    children?: Row[];
    expanded?: boolean;
    selected?: boolean;
    level?: number;
    cellMerges?: CellMerge[];
    expandable?: boolean;
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
    type: 'text' | 'number' | 'date' | 'enum';
    operators: string[];
}
export interface FilterConfig {
    column: string;
    operator: string;
    value: unknown;
}
export interface ColumnFilter {
    type: 'text' | 'number' | 'date' | 'enum';
    options?: Array<{
        label: string;
        value: unknown;
    }>;
    custom?: (value: unknown, filterValue: unknown, row: Row) => boolean;
}
export interface CellEditor {
    type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
    options?: Array<{
        label: string;
        value: unknown;
    }>;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    validate?: (value: unknown, row: Row, column: Column) => string | boolean;
}
export interface CellPosition {
    rowIndex: number;
    columnIndex: number;
}
export interface CellInfo extends CellPosition {
    row: Row;
    column: Column;
}
export interface CellRange {
    start: CellPosition;
    end: CellPosition;
}
export interface SelectionConfig {
    mode: 'cell' | 'row' | 'column' | 'range';
    multi?: boolean;
    showCheckbox?: boolean;
}
export interface EditingConfig {
    enabled?: boolean;
    mode?: 'click' | 'dblclick' | 'keyboard';
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
    };
    font: {
        family: string;
        size: number;
        headerSize: number;
    };
    row: {
        height: number;
        headerHeight: number;
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
    fixedColumns: {
        left: string[];
        right: string[];
    };
    sort: SortConfig[];
    filters: FilterConfig[];
}
export interface ExportOptions {
    format: 'csv' | 'excel' | 'json';
    filename?: string;
    includeHeaders?: boolean;
    includeHidden?: boolean;
    selectedOnly?: boolean;
}
export interface Change {
    type: 'update' | 'add' | 'delete';
    rowIndex: number;
    column?: string;
    oldValue?: unknown;
    newValue?: unknown;
    row?: Row;
}
/** 历史记录操作类型 */
export type HistoryActionType = 'update' | 'add' | 'delete';
/** 更新操作历史数据 */
export interface UpdateHistoryData {
    type: 'update';
    rowId: string;
    column: string;
    oldValue: unknown;
    newValue: unknown;
}
/** 新增操作历史数据 */
export interface AddHistoryData {
    type: 'add';
    rowId: string;
    rowIndex: number;
    rowData: Row;
}
/** 删除操作历史数据 */
export interface DeleteHistoryData {
    type: 'delete';
    rowId: string;
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
    onRowClick?: (rowIndex: number, event: MouseEvent) => void;
    onRowDblClick?: (rowIndex: number, event: MouseEvent) => void;
    onHeaderClick?: (column: Column, columnIndex: number, event: MouseEvent) => void;
    onScroll?: (scrollLeft: number, scrollTop: number) => void;
    onColumnResize?: (column: string, width: number) => void;
    onColumnReorder?: (columns: string[]) => void;
    onEditStart?: (cell: CellPosition) => void;
    onEditEnd?: (cell: CellPosition, value: unknown) => void;
    onExpand?: (rowIndex: number, expanded: boolean) => void;
    onCheckboxChange?: (cell: CellPosition, checked: boolean) => void;
    onRadioChange?: (cell: CellPosition, value: unknown) => void;
    onButtonClick?: (cell: CellPosition, actionKey?: string) => void;
    onSwitchChange?: (cell: CellPosition, checked: boolean) => void;
    onSelectChange?: (cell: CellPosition, value: unknown) => void;
    onTagsChange?: (cell: CellPosition, values: unknown[]) => void;
    onColumnHide?: (columnKey: string) => void;
    onColumnShow?: (columnKey: string) => void;
    onImageClick?: (cell: CellPosition, imageSrc: string, event: MouseEvent) => void;
    /** 图片上传成功回调 */
    onImageUpload?: (cell: CellPosition, url: string) => void;
    /** 图片删除回调 */
    onImageDelete?: (cell: CellPosition, deletedImage: string, index: number) => void;
}
export type ThemeMode = 'light' | 'dark' | 'auto';
export interface CanvasTableBaseProps {
    data: TableData | Promise<TableData> | (() => Promise<TableData>);
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
    emptyText?: string;
    watermark?: WatermarkConfig;
    expandColumnKey?: string;
    defaultExpandedRowKeys?: string[];
    createRowData?: (columns: Column[]) => Record<string, unknown>;
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
    dragType: 'column-resize' | 'column-reorder' | 'row-reorder' | null;
    dragTarget: unknown;
    tooltip: TooltipState | null;
    dropdown: DropdownState | null;
    filterDropdown: FilterDropdownState | null;
    dateDropdown: DateDropdownState | null;
    buttonsDropdown: ButtonsDropdownState | null;
    imageTooltip: ImageTooltipState | null;
    imageEditor: ImageEditorState | null;
    contextMenu: ContextMenuState | null;
    headerContextMenu: HeaderContextMenuState | null;
    switchAnimations: Map<string, SwitchAnimationState>;
    buttonHoverStates: Map<string, ButtonHoverState>;
    hoveredButtonIndex?: number;
    hoveredHeaderColumnKey?: string;
    hoveredImageIndex?: number;
    columnReorderState?: {
        dragColumnIndex: number;
        dragColumnKey: string;
        dragStartX: number;
        currentX: number;
        targetColumnIndex: number;
        isParentColumn?: boolean;
        isFixedColumn?: boolean;
        siblingColumns?: Array<{
            key: string;
            left: number;
            right: number;
            center: number;
            width: number;
            leafCount: number;
            firstLeafIndex: number;
            fixed: FixedType;
        }>;
        dragSiblingIndex: number;
        lastSwapTime?: number;
        lastSwapTargetKey?: string;
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
    type?: 'select' | 'tags';
    tagsConfig?: TagsConfig;
    showAbove?: boolean;
}
export interface FilterDropdownState {
    columnKey: string;
    x: number;
    y: number;
    width: number;
    options: Array<{
        label: string;
        value: unknown;
        checked: boolean;
    }>;
    scrollTop: number;
    hoveredIndex: number;
    searchText: string;
    isScrollbarDragging?: boolean;
    scrollbarDragStartY?: number;
    scrollbarDragStartScrollTop?: number;
}
export interface TooltipState {
    cell: CellPosition;
    x: number;
    y: number;
    width?: number;
    content: TooltipContent;
}
export type TooltipContent = {
    type: 'text';
    text: string;
} | {
    type: 'tags';
    tags: TagItem[];
};
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
    pendingImages: Array<{
        file: File;
        preview: string;
    }>;
    /** 是否为单图模式 */
    isSingleImage: boolean;
}
export interface ContextMenuState {
    x: number;
    y: number;
    rowIndex: number;
    hoveredIndex: number;
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
    setData(data: TableData): void;
    getData(): TableData;
    getRows(): Row[];
    getRow(rowIndex: number): Row | undefined;
    getColumns(): Column[];
    setColumns(columns: Column[]): void;
    scrollToRow(rowIndex: number, column?: number): Promise<void>;
    scrollTo(scrollLeft: number, scrollTop: number): void;
    getScrollPosition(): {
        scrollLeft: number;
        scrollTop: number;
    };
    getSelectedCells(): CellPosition[];
    getSelectedRows(): number[];
    setSelectedCells(cells: CellPosition[]): void;
    setSelectedRows(rows: number[]): void;
    clearSelection(): void;
    updateCell(rowIndex: number, column: string, value: unknown): void;
    updateRow(rowIndex: number, data: Record<string, unknown>): void;
    addRow(data: Record<string, unknown>, index?: number): void;
    deleteRow(rowIndex: number): void;
    sort(configs: SortConfig[]): void;
    getSort(): SortConfig[];
    filter(configs: FilterConfig[]): void;
    getFilters(): FilterConfig[];
    clearFilters(): void;
    export(options: ExportOptions): Promise<Blob>;
    getViewConfig(): ViewConfig;
    setViewConfig(config: ViewConfig): void;
    hideColumn(columnKey: string): void;
    showColumn(columnKey: string): void;
    refresh(): void;
    resize(): void;
    destroy(): void;
    getCanvas(): HTMLCanvasElement;
    getLayoutInfo(): LayoutInfo;
}
export type EventCallback<T = unknown> = (data: T) => void;
export interface EventEmitter {
    on<K extends keyof TableEventHandlers>(event: K, callback: NonNullable<TableEventHandlers[K]>): void;
    off<K extends keyof TableEventHandlers>(event: K, callback: NonNullable<TableEventHandlers[K]>): void;
    emit<K extends keyof TableEventHandlers>(event: K, ...args: Parameters<NonNullable<TableEventHandlers[K]>>): void;
}
/**
 * 鼠标区域类型
 */
export type MouseRegion = 'left-fixed' | 'right-fixed' | 'scrollable';
/**
 * 滚动条信息
 */
export interface HitTestScrollbar {
    type: 'vertical' | 'horizontal';
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
/**
 * 统一命中测试结果
 */
export interface HitTestResult {
    /** 鼠标所在的区域 */
    region: 'scrollbar-vertical' | 'scrollbar-horizontal' | 'header' | 'cell' | 'outside';
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
    /** 单元格位置 */
    cell?: {
        rowIndex: number;
        columnIndex: number;
    };
    /** 视口坐标 */
    viewport: {
        x: number;
        y: number;
    };
}
//# sourceMappingURL=index.d.ts.map