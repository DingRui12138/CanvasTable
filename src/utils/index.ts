import {
  Column,
  Row,
  RenderResult,
  TagItem,
  TagsConfig,
  DisabledValue,
  FilterMode,
  SelectOption,
  CellTypes,
} from "../types";

/**
 * 获取列的数据字段名
 * 优先使用 field，如果没有则使用 key
 */
export function getColumnField(column: Column): string {
  return column.field ?? column.key;
}

export function formatNumber(
  value: number,
  options?: {
    thousandSeparator?: boolean;
    decimalPlaces?: number;
    prefix?: string;
    suffix?: string;
  },
): string {
  const { thousandSeparator = true, decimalPlaces, prefix = "", suffix = "" } = options ?? {};

  if (!isFinite(value)) {
    return String(value);
  }

  let formatted = decimalPlaces !== undefined ? value.toFixed(decimalPlaces) : String(value);

  if (thousandSeparator) {
    const parts = formatted.split(".");
    parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    formatted = parts.join(".");
  }

  return prefix + formatted + suffix;
}

export function formatPercent(value: number, decimalPlaces: number = 2): string {
  return formatNumber(value * 100, { decimalPlaces, suffix: "%" });
}

export function formatDate(value: Date | number | string, format: string = "YYYY-MM-DD"): string {
  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return String(value);
  }

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

export function formatBoolean(
  value: boolean,
  trueText: string = "Yes",
  falseText: string = "No",
): string {
  return value ? trueText : falseText;
}

export function truncateText(text: string, maxLength: number, ellipsis: string = "..."): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>): void {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (a === null || b === null) {
    return a === b;
  }

  if (typeof a !== "object") {
    return a === b;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) {
      return false;
    }
    if (!isEqual(objA[key], objB[key])) {
      return false;
    }
  }

  return true;
}

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return undefined;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return result;
}

export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]!] = value;
}

export function binarySearch<T>(array: T[], value: number, getValue: (item: T) => number): number {
  let left = 0;
  let right = array.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = getValue(array[mid]!);

    if (midValue === value) {
      return mid;
    }

    if (midValue < value) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return left;
}

export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontFamily: string,
): { width: number; height: number } {
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  return {
    width: metrics.width,
    height: fontSize,
  };
}

export function calculateMaxTextRows(
  cellHeight: number,
  lineHeight: number,
  padding: number = 8,
): number {
  return Math.max(1, Math.floor((cellHeight - padding * 2) / lineHeight));
}

export function layoutWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxRows: number,
): { lines: string[]; isTruncated: boolean } {
  const lines: string[] = [];
  let currentLine = "";

  for (const char of text) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = char;
      if (lines.length >= maxRows) {
        break;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxRows) {
    lines.push(currentLine);
  }

  const visibleText = lines.join("");
  const isTruncated = text.length > visibleText.length;

  if (isTruncated && lines.length === maxRows) {
    const ellipsis = "...";
    let truncated = lines[lines.length - 1] ?? "";
    while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    lines[lines.length - 1] = truncated + ellipsis;
  }

  return { lines, isTruncated };
}

export interface TagLayoutItem {
  tag: TagItem;
  displayText: string;
  width: number;
}

export interface TagLayoutResult {
  lines: TagLayoutItem[][];
  processedTags: number;
  isTruncated: boolean;
}

export function layoutTags(
  ctx: CanvasRenderingContext2D,
  config: TagsConfig,
  width: number,
  height: number,
  fontSize: number,
): TagLayoutResult {
  const padding = 8;
  const tagPadding = 4;
  const gap = 4;
  const lineGap = 2;
  const ellipsis = "...";
  const tagHeight = fontSize + tagPadding * 2;
  const availableWidth = width - padding * 2;
  const autoMaxRows = Math.max(1, Math.floor((height - padding * 2) / (tagHeight + lineGap)));
  const maxLineCount = Math.min(config.maxRows ?? autoMaxRows, autoMaxRows);
  const tags = config.tags ?? [];

  const textWidthCache = new Map<string, number>();
  const measureTextCached = (text: string): number => {
    let measuredWidth = textWidthCache.get(text);
    if (measuredWidth === undefined) {
      measuredWidth = ctx.measureText(text).width;
      textWidthCache.set(text, measuredWidth);
    }
    return measuredWidth;
  };

  const moreTagWidth = (count: number) => {
    const moreText = `+${count}`;
    return measureTextCached(moreText) + tagPadding * 2;
  };

  const calculateTagWidth = (tag: TagItem): number => {
    return measureTextCached(tag.text) + tagPadding * 2;
  };

  const ellipsisWidth = measureTextCached(ellipsis);
  const lines: TagLayoutItem[][] = [];
  let currentLine: TagLayoutItem[] = [];
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
          let left = 0;
          let right = tag.text.length;

          while (left < right) {
            const mid = Math.floor((left + right + 1) / 2);
            const testText = tag.text.slice(0, mid);
            if (measureTextCached(testText) <= maxTextWidth) {
              left = mid;
              truncatedText = testText;
            } else {
              right = mid - 1;
            }
          }

          if (truncatedText.length > 0) {
            const displayText = truncatedText + ellipsis;
            const truncatedWidth = measureTextCached(displayText) + tagPadding * 2;
            currentLine.push({ tag, displayText, width: truncatedWidth });
            processedTags++;
          }
        }
        break;
      }
    } else if (tagWidth <= availableWidth - currentLineWidth) {
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

  if (currentLine.length > 0 && lines.length < maxLineCount) {
    lines.push(currentLine);
  }

  return {
    lines,
    processedTags,
    isTruncated: processedTags < tags.length,
  };
}

export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

export function createCanvas(
  width: number,
  height: number,
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  const dpr = getDevicePixelRatio();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context");
  }

  ctx.scale(dpr, dpr);

  return { canvas, ctx };
}

export function requestAnimationFrameThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs !== null) {
          fn.apply(this, lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

export function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    value !== null && typeof value === "object" && typeof (value as Promise<T>).then === "function"
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function arrayToCsv(data: unknown[][], delimiter: string = ","): string {
  return data
    .map((row) => {
      return (row as unknown[])
        .map((cell) => {
          const str = String(cell ?? "");
          if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(delimiter);
    })
    .join("\n");
}
export { buildExcelExportModel, createXlsxBlob, createXlsxBlobFromModel } from "./xlsx";

export function resolveDisabled(
  disabled: DisabledValue | undefined,
  row: Row,
  column: Column,
): boolean {
  if (disabled === undefined) {
    return false;
  }
  if (typeof disabled === "function") {
    return disabled(row, column);
  }
  return disabled;
}

export function getRenderResult(column: Column, row: Row, rowIndex: number): RenderResult {
  const field = getColumnField(column);
  const value = row.data[field];

  let renderResult: RenderResult = {
    text: String(value ?? ""),
    type: column.type ?? "text",
  };

  if (column.render) {
    try {
      const customResult = column.render(value, row, column, rowIndex);
      if (customResult) {
        renderResult = { ...renderResult, ...customResult };
      }
    } catch (error) {
      console.error(`Error in render function at row ${rowIndex}, column ${column.key}:`, error);
      renderResult = {
        text: "[Error]",
        type: "text",
      };
    }
  }

  // 自动为 checkbox/switch 类型创建默认配置
  if (renderResult.type === CellTypes.CHECKBOX && !renderResult.checkbox) {
    renderResult.checkbox = {
      checked: Boolean(value),
    };
  }

  if (renderResult.type === CellTypes.SWITCH && !renderResult.switch) {
    renderResult.switch = {
      checked: Boolean(value),
    };
  }

  return renderResult;
}

export function getCellDisplayText(column: Column, row: Row, rowIndex: number): string {
  const field = getColumnField(column);
  const value = row.data[field];
  const renderResult = getRenderResult(column, row, rowIndex);

  if (renderResult.type === CellTypes.SWITCH && renderResult.switch) {
    return renderResult.switch.checked ? "是" : "否";
  }
  if (renderResult.type === CellTypes.CHECKBOX && renderResult.checkbox) {
    if (renderResult.checkbox.indeterminate) {
      return "部分选中";
    }
    return renderResult.checkbox.checked ? "是" : "否";
  }
  if (renderResult.type === CellTypes.RADIO && renderResult.radio) {
    const selectedOption = renderResult.radio.options?.find(
      (opt) => opt.value === renderResult.radio?.value,
    );
    return selectedOption?.label || String(renderResult.radio.value ?? "");
  }
  if (renderResult.type === CellTypes.BUTTON && renderResult.button) {
    const buttonConfig = renderResult.button;
    if (Array.isArray(buttonConfig)) {
      return buttonConfig.map((btn) => btn.text ?? "").join(", ");
    }
    return buttonConfig.text || "";
  }
  if (renderResult.tags) {
    return (renderResult.tags.tags as TagItem[]).map((tag) => tag.text).join(", ");
  }
  if (renderResult.type === CellTypes.SELECT && renderResult.select) {
    const selectValue = renderResult.select.value;
    if (Array.isArray(selectValue)) {
      const labels = selectValue
        .map(
          (val) =>
            renderResult.select?.options?.find((opt) => opt.value === val)?.label || String(val),
        )
        .filter(Boolean);
      return labels.join(", ");
    }
    const selectedOption = renderResult.select.options?.find((opt) => opt.value === selectValue);
    return selectedOption?.label || String(selectValue ?? "");
  }
  if (renderResult.type === CellTypes.DATE && renderResult.date) {
    if (renderResult.date.value) {
      const dateValue = renderResult.date.value;
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      return String(dateValue);
    }
    return "";
  }
  if (renderResult.type === CellTypes.INPUT && renderResult.input) {
    return String(renderResult.input.value ?? "");
  }

  if (column.formatter) {
    return column.formatter(value, row, column);
  }

  if (renderResult.text !== undefined) {
    return String(renderResult.text);
  }

  switch (column.type) {
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value ?? "");
    case "boolean":
      return value ? "是" : "否";
    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return String(value ?? "");
    default:
      return String(value ?? "");
  }
}

/**
 * LRU (Least Recently Used) 缓存
 * 用于图片缓存，防止大量图片导致内存溢出
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * 获取缓存值，同时更新访问顺序
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // 删除后重新插入，使其成为最新访问
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果达到最大数量，删除最旧的（第一个）
    else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有键
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
}

// === 筛选相关工具函数 ===

/** 列类型到筛选模式的默认映射 */
const COLUMN_TYPE_FILTER_MODE_MAP: Record<string, FilterMode> = {
  text: "search",
  link: "search",
  number: "range",
  progress: "range",
  select: "select",
  tag: "select",
  radio: "select",
  color: "select",
  date: "dateRange",
  checkbox: "boolean",
  switch: "boolean",
};

/** 不支持筛选的列类型 */
const UNSUPPORTED_FILTER_TYPES = ["button", "image"];

/**
 * 根据列类型获取默认筛选模式
 * @param column 列配置
 * @returns 筛选模式，如果不支持筛选则返回 null
 */
export function getFilterModeByColumnType(column: Column): FilterMode | null {
  // 如果列配置中指定了筛选模式，优先使用
  if (column.filter?.mode) {
    return column.filter.mode;
  }

  // 如果列禁用了筛选
  if (column.filter?.disabled) {
    return null;
  }

  const columnType = column.type ?? "text";

  // 检查是否是不支持的类型
  if (UNSUPPORTED_FILTER_TYPES.includes(columnType)) {
    return null;
  }

  // 返回默认映射的筛选模式
  return COLUMN_TYPE_FILTER_MODE_MAP[columnType] ?? "search";
}

/** 采样获取筛选选项的最大行数 */
const FILTER_SAMPLE_ROWS = 100;

/** 搜索匹配结果的最大数量 */
const FILTER_SEARCH_LIMIT = 100;

/**
 * 获取列的筛选选项（用于 select 模式）
 * 策略：
 * 1. 检查 column.filter.options 或 render 返回的 options
 * 2. 如果没有，采样前 100 行获取
 * 3. 返回去重后的选项列表
 *
 * @param column 列配置
 * @param rows 数据行（可选，用于采样）
 * @param startIndex 开始采样的行索引（默认 0）
 * @returns 筛选选项列表，如果没有可用选项则返回空数组
 */
export function getColumnFilterOptions(
  column: Column,
  rows?: Row[],
  startIndex: number = 0,
): SelectOption[] {
  // 1. 检查 column.filter.options
  if (column.filter?.options && column.filter.options.length > 0) {
    return column.filter.options;
  }

  // 2. 如果没有提供 rows，返回空数组（需要延迟加载）
  if (!rows || rows.length === 0) {
    return [];
  }

  // 3. 采样前 100 行，通过 render 获取选项
  const field = getColumnField(column);
  const sampledRows = rows.slice(startIndex, startIndex + FILTER_SAMPLE_ROWS);
  const optionsMap = new Map<string, SelectOption>();

  for (let i = 0; i < sampledRows.length; i++) {
    const row = sampledRows[i]!;
    const value = row.data[field];
    const renderResult = getRenderResult(column, row, startIndex + i);

    // 从 render 结果中提取 options
    const extractedOptions = extractOptionsFromRenderResult(renderResult, value);
    for (const opt of extractedOptions) {
      const key = String(opt.value);
      if (!optionsMap.has(key)) {
        optionsMap.set(key, opt);
      }
    }
  }

  return Array.from(optionsMap.values());
}

/**
 * 从 RenderResult 中提取筛选选项
 */
function extractOptionsFromRenderResult(
  renderResult: RenderResult,
  rawValue: unknown,
): SelectOption[] {
  const options: SelectOption[] = [];

  // select 类型
  if (renderResult.select?.options) {
    options.push(...renderResult.select.options);
  }

  // tags 类型
  if (renderResult.tags?.options) {
    options.push(
      ...renderResult.tags.options.map((tag) => ({
        label: tag.text,
        value: tag.value ?? tag.text,
      })),
    );
  }

  // radio 类型
  if (renderResult.radio?.options) {
    options.push(...renderResult.radio.options);
  }

  // color 类型 - 使用预设颜色作为选项
  if (renderResult.color?.presetColors) {
    options.push(
      ...renderResult.color.presetColors.map((color) => ({
        label: color,
        value: color,
      })),
    );
  }

  // 如果没有提取到 options，使用原始值创建选项
  if (options.length === 0 && rawValue !== undefined && rawValue !== null) {
    // 对于数组值（如 tags），展开每个元素
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        options.push({
          label: String(item),
          value: item,
        });
      }
    } else {
      options.push({
        label: String(rawValue),
        value: rawValue,
      });
    }
  }

  return options;
}

/**
 * 搜索匹配筛选选项
 * 用于延迟加载场景：用户输入关键字后搜索匹配的选项
 *
 * @param column 列配置
 * @param rows 数据行
 * @param searchText 搜索关键字
 * @param maxResults 最大结果数量（默认 100）
 * @returns 匹配的筛选选项
 */
export function searchFilterOptions(
  column: Column,
  rows: Row[],
  searchText: string,
  maxResults: number = FILTER_SEARCH_LIMIT,
): SelectOption[] {
  if (!searchText || searchText.trim() === "") {
    return [];
  }

  const field = getColumnField(column);
  const keyword = searchText.toLowerCase();
  const optionsMap = new Map<string, SelectOption>();

  for (const row of rows) {
    if (optionsMap.size >= maxResults) {
      break;
    }

    const value = row.data[field];
    const valueStr = String(value ?? "").toLowerCase();

    if (valueStr.includes(keyword)) {
      const key = String(value);
      if (!optionsMap.has(key)) {
        optionsMap.set(key, {
          label: String(value ?? ""),
          value: value,
        });
      }
    }
  }

  return Array.from(optionsMap.values());
}

export { FILTER_SAMPLE_ROWS, FILTER_SEARCH_LIMIT };
