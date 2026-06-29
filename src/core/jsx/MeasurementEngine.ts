import type { CTElement, CTLayoutInfo } from "./types";

/**
 * 尺寸测量引擎
 * CTText: 自动测量宽度，高度由 fontSize/lineHeight 决定
 * 其他图元: 直接读取 width/height 属性
 */
const TEXT_WIDTH_CACHE = new Map<string, number>();
const TEXT_WIDTH_CACHE_MAX = 2000;

export class MeasurementEngine {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  measureTextWidth(
    text: string,
    fontSize: number,
    fontFamily: string,
    fontWeight?: string,
    fontStyle?: string,
  ): number {
    const normalizedFontStyle = fontStyle ?? "normal";
    const normalizedFontWeight = fontWeight ?? "normal";
    const cacheKey = `${normalizedFontStyle}|${normalizedFontWeight}|${fontSize}|${fontFamily}|${text}`;
    const cached = TEXT_WIDTH_CACHE.get(cacheKey);
    if (cached !== undefined) {
      TEXT_WIDTH_CACHE.delete(cacheKey);
      TEXT_WIDTH_CACHE.set(cacheKey, cached);
      return cached;
    }

    this.ctx.font = `${normalizedFontStyle} ${normalizedFontWeight} ${fontSize}px ${fontFamily}`;
    const width = this.ctx.measureText(text).width;
    if (TEXT_WIDTH_CACHE.size >= TEXT_WIDTH_CACHE_MAX) {
      const oldestKey = TEXT_WIDTH_CACHE.keys().next().value;
      if (oldestKey !== undefined) TEXT_WIDTH_CACHE.delete(oldestKey);
    }
    TEXT_WIDTH_CACHE.set(cacheKey, width);
    return width;
  }

  measureElement(element: CTElement): CTLayoutInfo {
    switch (element.type) {
      case "CTText":
        return this.measureText(element);
      case "CTBox":
        return this.measureBox(element);
      case "CTCircle":
        return this.measureCircle(element);
      case "CTImage":
        return this.measureImage(element);
      case "CTLine":
        return this.measureLine(element);
      case "CTTooltip":
      case "CTDropdown":
        return element.children[0]
          ? this.measureElement(element.children[0])
          : { x: 0, y: 0, width: 0, height: 0 };
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  }

  private measureText(element: CTElement): CTLayoutInfo {
    const props = element.props as {
      text: string;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      fontStyle?: string;
      lineHeight?: number;
      maxWidth?: number;
      letterSpacing?: number;
    };
    const fontSize = props.fontSize ?? 14;
    const fontFamily = props.fontFamily ?? "Arial";
    const lineHeight = props.lineHeight ?? fontSize;
    const fontWeight = props.fontWeight ?? "normal";
    const fontStyle = props.fontStyle ?? "normal";
    const letterSpacing = props.letterSpacing ?? 0;

    let width = this.measureTextWidth(props.text, fontSize, fontFamily, fontWeight, fontStyle);

    // Add letterSpacing contribution
    if (letterSpacing > 0 && props.text.length > 1) {
      width += letterSpacing * (props.text.length - 1);
    }

    if (props.maxWidth && width > props.maxWidth) {
      width = props.maxWidth;
    }

    return { x: 0, y: 0, width, height: lineHeight };
  }

  private measureBox(element: CTElement): CTLayoutInfo {
    const props = element.props as { width?: number; height?: number };
    // CTBox 在无子元素时走 measureBox，有子元素时由 LayoutEngine 处理
    // 如果有显式 width/height 则使用，否则返回 0（交给布局引擎）
    return { x: 0, y: 0, width: props.width ?? 0, height: props.height ?? 0 };
  }

  private measureCircle(element: CTElement): CTLayoutInfo {
    const props = element.props as { radius: number };
    const diameter = props.radius * 2;
    return { x: 0, y: 0, width: diameter, height: diameter };
  }

  private measureImage(element: CTElement): CTLayoutInfo {
    const props = element.props as { width: number; height: number };
    return { x: 0, y: 0, width: props.width, height: props.height };
  }

  private measureLine(element: CTElement): CTLayoutInfo {
    const props = element.props as { points: Array<{ x: number; y: number }> };
    if (props.points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = props.points.map((p) => p.x);
    const ys = props.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}
