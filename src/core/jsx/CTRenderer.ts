// src/core/jsx/CTRenderer.ts
import type {
  CTElement,
  CTLayoutInfo,
  CTLayoutNode,
  CTBoxProps,
  CTBoxShadow,
  CTBorderSide,
  CTBackgroundGradient,
} from "./types";
import type { TableTheme } from "../../types/index";
import type { CellRenderTrace } from "../renderers/CellRenderer";
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
 */
export class CTRenderer {
  private ctx: CanvasRenderingContext2D;
  private layoutEngine: LayoutEngine;
  private theme: TableTheme;
  private trace?: CellRenderTrace;
  private layouts: CTLayoutInfo[] = [];

  constructor(
    ctx: CanvasRenderingContext2D,
    layoutEngine: LayoutEngine,
    theme: TableTheme,
    trace?: CellRenderTrace,
  ) {
    this.ctx = ctx;
    this.layoutEngine = layoutEngine;
    this.theme = theme;
    this.trace = trace;
  }

  private traceStep<T>(name: string, fn: () => T): T {
    return this.trace ? this.trace.measure(name, fn) : fn();
  }

  render(
    root: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
  ): void {
    const layoutTree = this.traceStep("jsx.ctRenderer.layoutTree", () =>
      this.layoutEngine.layoutTree(root, x, y, parentSize),
    );
    this.layouts = this.traceStep("jsx.ctRenderer.flattenLayoutTree", () =>
      this.flattenLayoutTree(layoutTree),
    );
    this.traceStep("jsx.ctRenderer.ctx.save", () => this.ctx.save());
    try {
      this.renderLayoutNode(layoutTree);
    } finally {
      this.traceStep("jsx.ctRenderer.ctx.restore", () => this.ctx.restore());
    }
  }

  getLayouts(): CTLayoutInfo[] {
    return this.layouts;
  }

  private flattenLayoutTree(node: CTLayoutNode): CTLayoutInfo[] {
    const result: CTLayoutInfo[] = [
      {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex,
        margin: node.margin,
      },
    ];
    for (const child of node.children) {
      result.push(...this.flattenLayoutTree(child));
    }
    return result;
  }

  private renderLayoutNode(node: CTLayoutNode): void {
    switch (node.element.type) {
      case "CTBox":
        this.renderBoxNode(node);
        break;
      case "CTCircle":
        this.traceStep("jsx.ctRenderer.circle", () =>
          this.renderCircle(node.element, node.x, node.y),
        );
        break;
      case "CTText":
        this.renderText(node.element, node.x, node.y, node.width);
        break;
      case "CTImage":
        this.traceStep("jsx.ctRenderer.image", () =>
          this.renderImage(node.element, node.x, node.y),
        );
        break;
      case "CTLine":
        this.traceStep("jsx.ctRenderer.line", () => this.renderLine(node.element, node.x, node.y));
        break;
    }
  }

  private getBorderRadiusArray(
    props: Record<string, unknown>,
    defaultValue: number,
  ): number | number[] {
    const tl = (props.borderTopLeftRadius as number | undefined) ?? defaultValue;
    const tr = (props.borderTopRightRadius as number | undefined) ?? defaultValue;
    const br = (props.borderBottomRightRadius as number | undefined) ?? defaultValue;
    const bl = (props.borderBottomLeftRadius as number | undefined) ?? defaultValue;
    if (tl === tr && tr === br && br === bl) return tl;
    return [tl, tr, br, bl];
  }

  private drawRoundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    radii: number | number[],
  ): void {
    this.ctx.beginPath();
    // Use simple rect when borderRadius is 0 (no per-corner variation)
    if (typeof radii === "number" && radii === 0) {
      this.ctx.rect(x, y, w, h);
    } else {
      (this.ctx as any).roundRect(x, y, w, h, radii);
    }
  }

  private createGradientFill(
    x: number,
    y: number,
    w: number,
    h: number,
    gradient: CTBackgroundGradient,
  ): CanvasGradient {
    if (gradient.type === "linear") {
      const angle = gradient.angle;
      // Convert angle to start/end points
      const rad = ((angle - 90) * Math.PI) / 180; // CSS angle: 0=up, 90=right
      const cx = x + w / 2;
      const cy = y + h / 2;
      const len = Math.max(w, h);
      const x0 = cx - (Math.cos(rad) * len) / 2;
      const y0 = cy - (Math.sin(rad) * len) / 2;
      const x1 = cx + (Math.cos(rad) * len) / 2;
      const y1 = cy + (Math.sin(rad) * len) / 2;

      const grad = this.ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.colors.forEach((color, i) => {
        grad.addColorStop(i / (gradient.colors.length - 1), color);
      });
      return grad;
    } else {
      // radial gradient
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.max(w, h) / 2;
      const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gradient.colors.forEach((color, i) => {
        grad.addColorStop(i / (gradient.colors.length - 1), color);
      });
      return grad;
    }
  }

  private normalizeBorderSide(
    side: CTBorderSide | string | undefined,
  ): { width: number; color: string } | undefined {
    if (!side) return undefined;
    if (typeof side === "string") return { width: 1, color: side };
    if (side.width || side.color) return { width: side.width ?? 1, color: side.color ?? "#000" };
    return undefined;
  }

  private renderBoxNode(node: CTLayoutNode): void {
    const element = node.element;
    const x = node.x;
    const y = node.y;
    const props = element.props as CTBoxProps & Record<string, unknown>;

    const boxWidth = node.width;
    const boxHeight = node.height;
    const borderRadius = props.borderRadius ?? 0;
    const borderRadiusArray = this.getBorderRadiusArray(props, borderRadius);

    // opacity
    const hasOpacity = props.opacity !== undefined;
    if (hasOpacity) {
      this.ctx.save();
      this.ctx.globalAlpha = props.opacity!;
    }

    try {
      // ─── Box Shadow ───
      const hasShadow = !!props.boxShadow;
      if (hasShadow) {
        const shadow = this.normalizeShadow(props.boxShadow!);
        this.ctx.save();
        this.ctx.shadowColor = shadow.color;
        this.ctx.shadowBlur = shadow.blur;
        this.ctx.shadowOffsetX = shadow.offsetX;
        this.ctx.shadowOffsetY = shadow.offsetY;

        // Draw a shape to trigger shadow (use background fill or a rect)
        if (props.backgroundColor || props.backgroundGradient) {
          // Shadow will be applied to the background fill below
        } else {
          // No background: draw invisible rect to trigger shadow
          this.drawRoundedRect(
            x + (shadow.spread ?? 0),
            y + (shadow.spread ?? 0),
            boxWidth + (shadow.spread ?? 0) * 2,
            boxHeight + (shadow.spread ?? 0) * 2,
            borderRadiusArray,
          );
          this.ctx.fillStyle = shadow.color;
          this.ctx.fill();
        }
        // Shadow will carry over to background fill below
      }

      try {
        // ─── Background ───
        if (props.backgroundGradient) {
          this.ctx.fillStyle = this.createGradientFill(
            x,
            y,
            boxWidth,
            boxHeight,
            props.backgroundGradient,
          );
          this.drawRoundedRect(x, y, boxWidth, boxHeight, borderRadiusArray);
          this.ctx.fill();
        } else if (props.backgroundColor) {
          this.ctx.fillStyle = props.backgroundColor;
          this.drawRoundedRect(x, y, boxWidth, boxHeight, borderRadiusArray);
          this.ctx.fill();
        }
      } finally {
        // ─── Clear shadow after background ───
        if (hasShadow) {
          this.ctx.restore(); // restore shadow state
        }
      }

      // ─── Unified Border ───
      if (props.borderColor && props.borderWidth) {
        this.ctx.strokeStyle = props.borderColor;
        this.ctx.lineWidth = props.borderWidth;
        this.drawRoundedRect(x, y, boxWidth, boxHeight, borderRadiusArray);
        this.ctx.stroke();
      }

      // ─── Per-side Borders ───
      const top = this.normalizeBorderSide(props.borderTop);
      const right = this.normalizeBorderSide(props.borderRight);
      const bottom = this.normalizeBorderSide(props.borderBottom);
      const left = this.normalizeBorderSide(props.borderLeft);

      if (top || right || bottom || left) {
        // Draw individual borders as lines
        if (top) {
          this.ctx.strokeStyle = top.color;
          this.ctx.lineWidth = top.width;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x + boxWidth, y);
          this.ctx.stroke();
        }
        if (bottom) {
          this.ctx.strokeStyle = bottom.color;
          this.ctx.lineWidth = bottom.width;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y + boxHeight);
          this.ctx.lineTo(x + boxWidth, y + boxHeight);
          this.ctx.stroke();
        }
        if (left) {
          this.ctx.strokeStyle = left.color;
          this.ctx.lineWidth = left.width;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y);
          this.ctx.lineTo(x, y + boxHeight);
          this.ctx.stroke();
        }
        if (right) {
          this.ctx.strokeStyle = right.color;
          this.ctx.lineWidth = right.width;
          this.ctx.beginPath();
          this.ctx.moveTo(x + boxWidth, y);
          this.ctx.lineTo(x + boxWidth, y + boxHeight);
          this.ctx.stroke();
        }
      }

      // ─── Overflow Clipping ───
      const hasOverflow = props.overflow === "hidden" || props.overflow === "clip";
      if (hasOverflow) {
        this.ctx.save();
        this.drawRoundedRect(x, y, boxWidth, boxHeight, borderRadiusArray);
        this.ctx.clip();
      }

      // ─── Render Children ───
      try {
        for (const childNode of node.children) {
          this.renderLayoutNode(childNode);
        }
      } finally {
        // ─── Restore Clip ───
        if (hasOverflow) {
          this.ctx.restore();
        }
      }
    } finally {
      // ─── Restore Opacity ───
      if (hasOpacity) {
        this.ctx.restore();
      }
    }
  }

  private normalizeShadow(shadow: CTBoxShadow | string): CTBoxShadow & { spread?: number } {
    if (typeof shadow === "string") {
      // Parse "offsetX offsetY blur color" or "offsetX offsetY blur spread color"
      const parts = shadow.trim().split(/\s+/);
      const offsetX = Number(parts[0]) || 0;
      const offsetY = Number(parts[1]) || 0;
      const blur = Number(parts[2]) || 0;
      const numericParts = parts.filter((p) => !isNaN(Number(p)));
      const spread = numericParts.length > 3 ? Number(parts[3]) : 0;
      const color = parts.slice(numericParts.length > 3 ? 4 : 3).join(" ") || "rgba(0,0,0,0.15)";
      return { offsetX, offsetY, blur, spread, color };
    }
    return shadow;
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

  private renderText(element: CTElement, x: number, y: number, layoutWidth: number): void {
    const props = element.props as {
      text: string;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: "normal" | "bold";
      fontStyle?: "normal" | "italic";
      color?: string;
      lineHeight?: number;
      maxWidth?: number;
      textAlign?: "left" | "center" | "right";
      textDecoration?: "underline" | "line-through" | "none";
      letterSpacing?: number;
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
    const textAlign = props.textAlign ?? "left";
    const textDecoration = props.textDecoration ?? "none";
    const letterSpacing = props.letterSpacing ?? 0;

    this.traceStep("jsx.ctRenderer.text.setup", () => {
      this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      this.ctx.fillStyle = color;
    });

    // ─── Text Alignment ───
    let textX = x;
    this.traceStep("jsx.ctRenderer.text.align", () => {
      if (textAlign === "center") {
        textX = x + layoutWidth / 2;
        this.ctx.textAlign = "center";
      } else if (textAlign === "right") {
        textX = x + layoutWidth;
        this.ctx.textAlign = "right";
      } else {
        this.ctx.textAlign = "left";
      }
      this.ctx.textBaseline = "middle";
    });
    const textY = y + lineHeight / 2;

    // ─── Letter Spacing ───
    if (letterSpacing > 0) {
      // Draw each character individually with spacing
      this.ctx.textAlign = "left"; // Reset to left for individual positioning
      let charX =
        textAlign === "center"
          ? x +
            (layoutWidth -
              this.getTextWidthWithSpacing(
                props.text,
                fontSize,
                fontFamily,
                fontWeight,
                fontStyle,
                letterSpacing,
              )) /
              2
          : textAlign === "right"
            ? x +
              layoutWidth -
              this.getTextWidthWithSpacing(
                props.text,
                fontSize,
                fontFamily,
                fontWeight,
                fontStyle,
                letterSpacing,
              )
            : x;

      for (let i = 0; i < props.text.length; i++) {
        const ch = props.text[i]!;
        this.traceStep("jsx.ctRenderer.text.fillChar", () => {
          if (props.maxWidth) {
            this.ctx.fillText(ch, charX, textY, props.maxWidth);
          } else {
            this.ctx.fillText(ch, charX, textY);
          }
        });
        const charWidth = this.measureCharWidth(ch, fontSize, fontFamily, fontWeight, fontStyle);
        charX += charWidth + letterSpacing;
      }
    } else {
      this.traceStep("jsx.ctRenderer.text.fillText", () => {
        if (props.maxWidth) {
          this.ctx.fillText(props.text, textX, textY, props.maxWidth);
        } else {
          this.ctx.fillText(props.text, textX, textY);
        }
      });
    }

    // ─── Text Decoration ───
    if (textDecoration === "underline") {
      const textWidth =
        letterSpacing > 0
          ? this.getTextWidthWithSpacing(
              props.text,
              fontSize,
              fontFamily,
              fontWeight,
              fontStyle,
              letterSpacing,
            )
          : this.ctx.measureText(props.text).width;
      const lineY = textY + fontSize / 2 + 1;
      const lineX =
        textAlign === "center"
          ? textX - textWidth / 2
          : textAlign === "right"
            ? textX - textWidth
            : textX;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(lineX, lineY);
      this.ctx.lineTo(lineX + textWidth, lineY);
      this.ctx.stroke();
    } else if (textDecoration === "line-through") {
      const textWidth =
        letterSpacing > 0
          ? this.getTextWidthWithSpacing(
              props.text,
              fontSize,
              fontFamily,
              fontWeight,
              fontStyle,
              letterSpacing,
            )
          : this.ctx.measureText(props.text).width;
      const lineY = textY;
      const lineX =
        textAlign === "center"
          ? textX - textWidth / 2
          : textAlign === "right"
            ? textX - textWidth
            : textX;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(lineX, lineY);
      this.ctx.lineTo(lineX + textWidth, lineY);
      this.ctx.stroke();
    }

    // Reset
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "alphabetic";
  }

  private measureCharWidth(
    ch: string,
    fontSize: number,
    fontFamily: string,
    fontWeight: string,
    fontStyle: string,
  ): number {
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    return this.ctx.measureText(ch).width;
  }

  private getTextWidthWithSpacing(
    text: string,
    fontSize: number,
    fontFamily: string,
    fontWeight: string,
    fontStyle: string,
    letterSpacing: number,
  ): number {
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    let total = 0;
    for (let i = 0; i < text.length; i++) {
      total += this.ctx.measureText(text[i]!).width;
      if (i < text.length - 1) total += letterSpacing;
    }
    return total;
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
}
