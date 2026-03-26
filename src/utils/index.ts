import type { Column, Row, RenderResult, TagItem, DisabledValue } from "../types";

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
  if (renderResult.type === "checkbox" && !renderResult.checkbox) {
    renderResult.checkbox = {
      checked: Boolean(value),
    };
  }

  if (renderResult.type === "switch" && !renderResult.switch) {
    renderResult.switch = {
      checked: Boolean(value),
    };
  }

  // Resolve column-level disabled
  const columnDisabled = resolveDisabled(column.disabled, row, column);

  return renderResult;
}

export function getCellDisplayText(column: Column, row: Row, rowIndex: number): string {
  const field = getColumnField(column);
  const value = row.data[field];
  const renderResult = getRenderResult(column, row, rowIndex);

  if (renderResult.type === "switch" && renderResult.switch) {
    return renderResult.switch.checked ? "是" : "否";
  }
  if (renderResult.type === "checkbox" && renderResult.checkbox) {
    if (renderResult.checkbox.indeterminate) {
      return "部分选中";
    }
    return renderResult.checkbox.checked ? "是" : "否";
  }
  if (renderResult.type === "radio" && renderResult.radio) {
    const selectedOption = renderResult.radio.options?.find(
      (opt) => opt.value === renderResult.radio?.value,
    );
    return selectedOption?.label || String(renderResult.radio.value ?? "");
  }
  if (renderResult.type === "button" && renderResult.button) {
    return renderResult.button.text || "";
  }
  if (renderResult.tags) {
    return (renderResult.tags.tags as TagItem[]).map((tag) => tag.text).join(", ");
  }
  if (renderResult.type === "select" && renderResult.select) {
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
  if (renderResult.type === "date" && renderResult.date) {
    if (renderResult.date.value) {
      const dateValue = renderResult.date.value;
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      return String(dateValue);
    }
    return "";
  }
  if (renderResult.type === "input" && renderResult.input) {
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
