// src/core/jsx/CTRenderer.ts
import type { CTElement, CTLayoutInfo } from "./types";
import type { TableTheme } from "../../types/index";
import { LayoutEngine } from "./LayoutEngine";

/**
 * CTElement Canvas Renderer
 *
 * 坐标系统设计：
 * - Flex 模式 (display='flex')：所有元素的 x, y 表示左上角（Box 模型）
 *   - alignItems: 'center' 由 LayoutEngine 计算，使不同高度的元素视觉居中
 *   - CTText: y 是框顶部，文字在 lineHeight 框内居中绘制
 *   - CTCircle: y 是圆顶部，圆心在 y + radius
 *
 * - 定位模式 (position='relative')：子元素的 x, y 是相对于父容器的位置
 *   - textAlign/verticalAlign 改变锚点含义
 *   - textAlign='center' + verticalAlign='middle' → x,y 是文字中心锚点
 *   - CTRect/CTCircle: x,y 仍是左上角
 */
export class CTRenderer {
  private ctx: CanvasRenderingContext2D;
  private layoutEngine: LayoutEngine;
  private theme: TableTheme;
  private layouts: CTLayoutInfo[] = [];

  constructor(ctx: CanvasRenderingContext2D, layoutEngine: LayoutEngine, theme: TableTheme) {
    this.ctx = ctx;
    this.layoutEngine = layoutEngine;
    this.theme = theme;
  }

  /**
   * Render element tree
   */
  render(root: CTElement, x: number, y: number): void {
    this.layouts = this.layoutEngine.layout(root, x, y);
    this.ctx.save();
    this.renderElement(root, x, y);
    this.ctx.restore();
  }

  getLayouts(): CTLayoutInfo[] {
    return this.layouts;
  }

  private renderElement(element: CTElement, x: number, y: number): void {
    switch (element.type) {
      case "CTGroup":
        this.renderGroup(element, x, y);
        break;
      case "CTRect":
        this.renderRect(element, x, y);
        break;
      case "CTCircle":
        this.renderCircle(element, x, y);
        break;
      case "CTText":
        this.renderText(element, x, y);
        break;
      case "CTImage":
        this.renderImage(element, x, y);
        break;
      case "CTLine":
        this.renderLine(element, x, y);
        break;
    }
  }

  private renderGroup(group: CTElement, x: number, y: number): void {
    const props = group.props as {
      backgroundColor?: string;
      borderRadius?: number;
      borderColor?: string;
      borderWidth?: number;
      width?: number;
      height?: number;
      display?: string;
      position?: string;
    };

    // Draw background
    if (props.backgroundColor) {
      const groupLayout = this.calculateGroupBounds(
        this.layoutEngine.layout(group, x, y),
        x,
        y,
        props,
      );

      this.ctx.fillStyle = props.backgroundColor;
      if (props.borderRadius) {
        this.ctx.beginPath();
        (this.ctx as any).roundRect(
          x,
          y,
          groupLayout.width,
          groupLayout.height,
          props.borderRadius,
        );
        this.ctx.fill();
      } else {
        this.ctx.fillRect(x, y, groupLayout.width, groupLayout.height);
      }

      if (props.borderColor && props.borderWidth) {
        this.ctx.strokeStyle = props.borderColor;
        this.ctx.lineWidth = props.borderWidth;
        if (props.borderRadius) {
          this.ctx.beginPath();
          (this.ctx as any).roundRect(
            x,
            y,
            groupLayout.width,
            groupLayout.height,
            props.borderRadius,
          );
          this.ctx.stroke();
        } else {
          this.ctx.strokeRect(x, y, groupLayout.width, groupLayout.height);
        }
      }
    }

    const children = group.children || [];

    if (props.position === "relative") {
      // 定位模式：子元素用 x, y 定位，按 zIndex 顺序渲染
      const sortedChildren = [...children].sort((a, b) => {
        const aZ = (a.props.zIndex as number | undefined) ?? 0;
        const bZ = (b.props.zIndex as number | undefined) ?? 0;
        return aZ - bZ;
      });

      for (const child of sortedChildren) {
        const childX = x + ((child.props.x as number | undefined) ?? 0);
        const childY = y + ((child.props.y as number | undefined) ?? 0);
        this.renderElement(child, childX, childY);
      }
    } else if (props.display === "flex") {
      // Flex 模式：使用 LayoutEngine 计算的位置
      const childLayouts = this.layoutEngine.layout(group, x, y);
      for (let i = 0; i < children.length; i++) {
        const childLayout = childLayouts[i];
        if (childLayout) {
          this.renderElement(children[i]!, childLayout.x, childLayout.y);
        }
      }
    }
  }

  private renderRect(element: CTElement, x: number, y: number): void {
    const props = element.props as {
      width: number;
      height: number;
      backgroundColor?: string;
      borderRadius?: number;
      borderColor?: string;
      borderWidth?: number;
      opacity?: number;
    };

    this.ctx.save();

    if (props.opacity !== undefined) {
      this.ctx.globalAlpha = props.opacity;
    }

    // x, y 是矩形左上角
    if (props.backgroundColor) {
      this.ctx.fillStyle = props.backgroundColor;
      if (props.borderRadius) {
        this.ctx.beginPath();
        (this.ctx as any).roundRect(x, y, props.width, props.height, props.borderRadius);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(x, y, props.width, props.height);
      }
    }

    if (props.borderColor && props.borderWidth) {
      this.ctx.strokeStyle = props.borderColor;
      this.ctx.lineWidth = props.borderWidth;
      if (props.borderRadius) {
        this.ctx.beginPath();
        (this.ctx as any).roundRect(x, y, props.width, props.height, props.borderRadius);
        this.ctx.stroke();
      } else {
        this.ctx.strokeRect(x, y, props.width, props.height);
      }
    }

    this.ctx.restore();
  }

  private renderCircle(element: CTElement, x: number, y: number): void {
    const props = element.props as {
      radius: number;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      startAngle?: number;
      endAngle?: number;
    };

    // x, y 是圆形左上角，圆心在 (x + radius, y + radius)
    const centerX = x + props.radius;
    const centerY = y + props.radius;
    const startAngle = props.startAngle ?? 0;
    const endAngle = props.endAngle ?? Math.PI * 2;

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, props.radius, startAngle, endAngle, false);

    if (props.backgroundColor) {
      this.ctx.fillStyle = props.backgroundColor;
      this.ctx.fill();
    }

    if (props.borderColor && props.borderWidth) {
      this.ctx.strokeStyle = props.borderColor;
      this.ctx.lineWidth = props.borderWidth;
      this.ctx.stroke();
    }
  }

  private renderText(element: CTElement, x: number, y: number): void {
    const props = element.props as {
      text: string;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: "normal" | "bold";
      fontStyle?: "normal" | "italic";
      color?: string;
      lineHeight?: number;
      maxWidth?: number;
      // 定位属性（仅在父容器 position='relative' 时生效）
      x?: number;
      y?: number;
      zIndex?: number;
    };

    const fontSize = props.fontSize ?? this.theme.font.size;
    const fontFamily = props.fontFamily ?? this.theme.font.family;
    const fontWeight = props.fontWeight ?? "normal";
    const fontStyle = props.fontStyle ?? "normal";
    const color = props.color ?? this.theme.colors.cellText;
    const lineHeight = props.lineHeight ?? fontSize;

    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;

    // 统一处理：x, y 是元素框左上角，文字在 lineHeight 框内垂直居中绘制
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";

    const textX = x;
    const textY = y + lineHeight / 2;

    if (props.maxWidth) {
      this.ctx.fillText(props.text, textX, textY, props.maxWidth);
    } else {
      this.ctx.fillText(props.text, textX, textY);
    }

    // Reset
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "alphabetic";
  }

  private renderImage(element: CTElement, x: number, y: number): void {
    const props = element.props as { width: number; height: number };
    this.ctx.strokeStyle = "#d9d9d9";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, props.width, props.height);
  }

  private renderLine(element: CTElement, x: number, y: number): void {
    const props = element.props as {
      points: Array<{ x: number; y: number }>;
      strokeWidth?: number;
      strokeColor?: string;
      strokeLinecap?: "butt" | "round" | "square";
    };

    if (props.points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = props.strokeColor ?? "#333333";
    this.ctx.lineWidth = props.strokeWidth ?? 1;
    this.ctx.lineCap = props.strokeLinecap ?? "butt";

    this.ctx.moveTo(x + props.points[0]!.x, y + props.points[0]!.y);
    for (let i = 1; i < props.points.length; i++) {
      this.ctx.lineTo(x + props.points[i]!.x, y + props.points[i]!.y);
    }
    this.ctx.stroke();
  }

  private calculateGroupBounds(
    layouts: CTLayoutInfo[],
    startX: number,
    startY: number,
    props?: { width?: number; height?: number },
  ): CTLayoutInfo {
    if (props?.width && props?.height) {
      return { x: startX, y: startY, width: props.width, height: props.height };
    }

    if (layouts.length === 0) {
      return { x: startX, y: startY, width: 0, height: 0 };
    }

    const minX = Math.min(...layouts.map((l) => l.x));
    const maxX = Math.max(...layouts.map((l) => l.x + l.width));
    const minY = Math.min(...layouts.map((l) => l.y));
    const maxY = Math.max(...layouts.map((l) => l.y + l.height));

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}
