import type { CTElement, CTLayoutInfo } from "./types";

/**
 * 尺寸测量引擎
 * CTText: 自动测量宽度，高度由 fontSize/lineHeight 决定
 * 其他图元: 直接读取 width/height 属性
 */
export class MeasurementEngine {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  measureTextWidth(text: string, fontSize: number, fontFamily: string): number {
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    return this.ctx.measureText(text).width;
  }

  measureElement(element: CTElement): CTLayoutInfo {
    switch (element.type) {
      case "CTText":
        return this.measureText(element);
      case "CTRect":
        return this.measureRect(element);
      case "CTCircle":
        return this.measureCircle(element);
      case "CTImage":
        return this.measureImage(element);
      case "CTLine":
        return this.measureLine(element);
      case "CTGroup":
        return { x: 0, y: 0, width: 0, height: 0 };
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  }

  private measureText(element: CTElement): CTLayoutInfo {
    const props = element.props as {
      text: string;
      fontSize?: number;
      fontFamily?: string;
      lineHeight?: number;
      maxWidth?: number;
    };
    const fontSize = props.fontSize ?? 14;
    const fontFamily = props.fontFamily ?? "Arial";
    const lineHeight = props.lineHeight ?? fontSize;

    let width = this.measureTextWidth(props.text, fontSize, fontFamily);

    if (props.maxWidth && width > props.maxWidth) {
      width = props.maxWidth;
    }

    return { x: 0, y: 0, width, height: lineHeight };
  }

  private measureRect(element: CTElement): CTLayoutInfo {
    const props = element.props as { width: number; height: number };
    return { x: 0, y: 0, width: props.width, height: props.height };
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
