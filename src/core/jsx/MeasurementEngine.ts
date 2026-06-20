import type { CTElement, CTLayoutInfo } from "./types";
import type { CellRenderTrace } from "../renderers/CellRenderer";

/**
 * 尺寸测量引擎
 * CTText: 自动测量宽度，高度由 fontSize/lineHeight 决定
 * 其他图元: 直接读取 width/height 属性
 */
export class MeasurementEngine {
  private ctx: CanvasRenderingContext2D;
  private trace?: CellRenderTrace;

  constructor(ctx: CanvasRenderingContext2D, trace?: CellRenderTrace) {
    this.ctx = ctx;
    this.trace = trace;
  }

  private traceStep<T>(name: string, fn: () => T): T {
    return this.trace ? this.trace.measure(name, fn) : fn();
  }

  measureTextWidth(
    text: string,
    fontSize: number,
    fontFamily: string,
    fontWeight?: string,
    fontStyle?: string,
  ): number {
    this.ctx.font = `${fontStyle ?? "normal"} ${fontWeight ?? "normal"} ${fontSize}px ${fontFamily}`;
    return this.traceStep(
      "jsx.measurement.measureTextWidth",
      () => this.ctx.measureText(text).width,
    );
  }

  measureElement(element: CTElement): CTLayoutInfo {
    return this.traceStep(`jsx.measurement.measureElement.${element.type}`, () => {
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
        default:
          return { x: 0, y: 0, width: 0, height: 0 };
      }
    });
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
