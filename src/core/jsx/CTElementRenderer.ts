// src/core/jsx/CTElementRenderer.ts
import type {
  CTElement,
  CTLayoutInfo,
  CTLayoutNode,
  CTBoxProps,
  CTBoxShadow,
  CTBorderSide,
  CTBackgroundGradient,
  CTRenderContext,
} from "./types";
import type { TableTheme } from "../../types/index";
import { LayoutEngine } from "./LayoutEngine";
import { JSXElementSignature } from "./JSXElementSignature";
import { JSXRenderCache, type JSXRenderCacheStats } from "./JSXRenderCache";

/**
 * CTElement Canvas Renderer
 *
 * Coordinate system design:
 * - Flex mode (display='flex'): all elements' x, y represent top-left corner (Box model)
 *   - alignItems: 'center' is calculated by LayoutEngine to make different height elements visually centered
 *   - CTText: y is box top, text is centered within lineHeight box
 *   - CTCircle: y is circle top, center is at y + radius
 *
 * - Position mode (position='relative'): children's x, y are relative to parent container
 */
export class CTElementRenderer {
  private ctx: CanvasRenderingContext2D;
  private layoutEngine: LayoutEngine;
  private theme: TableTheme;
  private renderContext?: CTRenderContext;
  private layouts: CTLayoutInfo[] | undefined;
  private layoutTree: CTLayoutNode | undefined;
  private renderCache = new JSXRenderCache();
  private gradientCache = new Map<string, CanvasGradient>();
  private static readonly GRADIENT_CACHE_MAX = 200;

  // Store render position for cell offscreen cache
  private cellX = 0;
  private cellY = 0;

  constructor(
    ctx: CanvasRenderingContext2D,
    layoutEngine: LayoutEngine,
    theme: TableTheme,
    renderContext?: CTRenderContext,
  ) {
    this.ctx = ctx;
    this.layoutEngine = layoutEngine;
    this.theme = theme;
    this.renderContext = renderContext;
  }

  render(
    root: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
    layoutCacheKey?: string | null,
  ): void {
    this.cellX = x;
    this.cellY = y;

    const planKey = this.buildRenderPlanKey(root, parentSize, layoutCacheKey);
    const layoutTree = this.renderCache.getOrCreatePlan(planKey, () => {
      return this.layoutEngine.layoutTree(root, 0, 0, parentSize, layoutCacheKey);
    });

    this.layoutTree = layoutTree;
    this.layouts = undefined;
    this.ctx.save();
    this.ctx.translate(x, y);
    try {
      this.renderLayoutNode(layoutTree, root, 0, 0);
    } finally {
      this.ctx.restore();
    }
  }

  getRenderCacheStats(): JSXRenderCacheStats {
    return this.renderCache.getStats();
  }

  invalidateOffscreen(_scope: "all" | { oldSize: string | string[] }): void {
    // Layer 3 offscreen cache removed; clear plan cache for lifecycle events
    this.renderCache.clear();
    this.gradientCache.clear();
  }

  getLayouts(): CTLayoutInfo[] {
    if (!this.layouts && this.layoutTree) {
      this.layouts = this.flattenLayoutTree(this.layoutTree!, this.cellX, this.cellY);
    }
    return this.layouts ?? [];
  }

  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
    this.renderCache.clear();
    this.gradientCache.clear();
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
    this.renderCache.clear();
    this.gradientCache.clear();
  }

  setRenderContext(renderContext?: CTRenderContext): void {
    this.renderContext = renderContext;
  }

  private buildRenderPlanKey(
    root: CTElement,
    parentSize?: { width: number; height: number },
    layoutCacheKey?: string | null,
  ): string {
    const sizeKey = parentSize ? `${parentSize.width}x${parentSize.height}` : "auto";
    // When an explicit layoutCacheKey is provided, the layout tree is shared
    // across all rows with the same key (LayoutEngine caches by explicit key
    // alone). Including the full signature here would defeat that sharing —
    // every row with unique visual props would miss the plan cache. So we
    // trust the explicit key and skip signature computation.
    if (layoutCacheKey) {
      return `${layoutCacheKey}|${sizeKey}`;
    }
    return `${sizeKey}|${JSXElementSignature.layout(root)}|${JSXElementSignature.visual(root)}`;
  }

  private flattenLayoutTree(node: CTLayoutNode, offsetX = 0, offsetY = 0): CTLayoutInfo[] {
    const result: CTLayoutInfo[] = [
      {
        x: node.x + offsetX,
        y: node.y + offsetY,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex,
        margin: node.margin,
      },
    ];
    for (const child of node.children) {
      result.push(...this.flattenLayoutTree(child, offsetX, offsetY));
    }
    return result;
  }

  private getLayoutOrderedChildren(element: CTElement): CTElement[] {
    const children = element.children || [];
    if (element.type === "CTBox" && element.props.position === "relative") {
      return [...children].sort((a, b) => {
        const aZ = (a.props.zIndex as number | undefined) ?? 0;
        const bZ = (b.props.zIndex as number | undefined) ?? 0;
        return aZ - bZ;
      });
    }
    return children;
  }

  private renderLayoutNode(
    node: CTLayoutNode,
    currentElement: CTElement = node.currentElement ?? node.element,
    offsetX = 0,
    offsetY = 0,
  ): void {
    const x = node.x + offsetX;
    const y = node.y + offsetY;
    switch (currentElement.type) {
      case "CTBox":
        this.renderBoxNode(node, currentElement, x, y, offsetX, offsetY);
        break;
      case "CTCircle":
        this.renderCircle(currentElement, x, y);
        break;
      case "CTText":
        this.renderText(currentElement, x, y, node.width);
        break;
      case "CTImage":
        this.renderImage(currentElement, x, y);
        break;
      case "CTLine":
        this.renderLine(currentElement, x, y);
        break;
      case "CTProgress":
        this.renderProgress(currentElement, x, y, node.width, node.height);
        break;
      case "CTTooltip":
      case "CTDropdown":
        this.renderInteractiveWrapperNode(node, currentElement, x, y, offsetX, offsetY);
        break;
    }
  }

  private renderInteractiveWrapperNode(
    node: CTLayoutNode,
    element: CTElement,
    x: number,
    y: number,
    offsetX: number,
    offsetY: number,
  ): void {
    const regionType = element.type === "CTTooltip" ? "tooltip" : "dropdown";
    this.renderContext?.collectInteractiveRegion?.({
      type: regionType,
      rect: {
        x: x + this.cellX,
        y: y + this.cellY,
        width: node.width,
        height: node.height,
      },
      element,
      props: element.props,
      row: this.renderContext.row,
      column: this.renderContext.column,
      rowIndex: this.renderContext.rowIndex,
      colIndex: this.renderContext.colIndex,
    });

    const currentChildren = this.getLayoutOrderedChildren(element);
    const childOffsetX = offsetX + (node.offsetX ?? 0);
    const childOffsetY = offsetY + (node.offsetY ?? 0);
    for (let index = 0; index < node.children.length; index++) {
      const childNode = node.children[index]!;
      const childElement = currentChildren[index];
      if (!childElement) continue;
      this.renderLayoutNode(childNode, childElement, childOffsetX, childOffsetY);
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

  private createGradientFill(w: number, h: number, gradient: CTBackgroundGradient): CanvasGradient {
    const cacheKey = this.getGradientCacheKey(w, h, gradient);
    const cached = this.gradientCache.get(cacheKey);
    if (cached) {
      this.gradientCache.delete(cacheKey);
      this.gradientCache.set(cacheKey, cached);
      return cached;
    }

    const created = this.createRelativeGradientFill(w, h, gradient);
    this.gradientCache.set(cacheKey, created);
    if (this.gradientCache.size > CTElementRenderer.GRADIENT_CACHE_MAX) {
      const oldest = this.gradientCache.keys().next().value;
      if (oldest) this.gradientCache.delete(oldest);
    }
    return created;
  }

  private getGradientCacheKey(w: number, h: number, gradient: CTBackgroundGradient): string {
    return `${w}x${h}|${gradient.type}|${gradient.type === "linear" ? gradient.angle : "_"}|${gradient.colors.join(",")}`;
  }

  private createRelativeGradientFill(
    w: number,
    h: number,
    gradient: CTBackgroundGradient,
  ): CanvasGradient {
    if (gradient.type === "linear") {
      const angle = gradient.angle;
      const rad = ((angle - 90) * Math.PI) / 180;
      const cx = w / 2;
      const cy = h / 2;
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
    }

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.max(w, h) / 2;
    const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.colors.forEach((color, i) => {
      grad.addColorStop(i / (gradient.colors.length - 1), color);
    });
    return grad;
  }

  private normalizeBorderSide(
    side: CTBorderSide | string | undefined,
  ): { width: number; color: string } | undefined {
    if (!side) return undefined;
    if (typeof side === "string") return { width: 1, color: side };
    if (side.width || side.color) return { width: side.width ?? 1, color: side.color ?? "#000" };
    return undefined;
  }

  private renderBoxNode(
    node: CTLayoutNode,
    element: CTElement = node.element,
    x = node.x,
    y = node.y,
    offsetX = 0,
    offsetY = 0,
  ): void {
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
          this.ctx.save();
          this.ctx.translate(x, y);
          this.ctx.fillStyle = this.createGradientFill(
            boxWidth,
            boxHeight,
            props.backgroundGradient,
          );
          this.drawRoundedRect(0, 0, boxWidth, boxHeight, borderRadiusArray);
          this.ctx.fill();
          this.ctx.restore();
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
        const currentChildren = this.getLayoutOrderedChildren(element);
        const childOffsetX = offsetX + (node.offsetX ?? 0);
        const childOffsetY = offsetY + (node.offsetY ?? 0);
        for (let index = 0; index < node.children.length; index++) {
          const childNode = node.children[index]!;
          const childElement = currentChildren[index];
          if (!childElement) continue;
          this.renderLayoutNode(childNode, childElement, childOffsetX, childOffsetY);
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

    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;

    // ─── Text Alignment ───
    let textX = x;
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
        if (props.maxWidth) {
          this.ctx.fillText(ch, charX, textY, props.maxWidth);
        } else {
          this.ctx.fillText(ch, charX, textY);
        }
        const charWidth = this.measureCharWidth(ch, fontSize, fontFamily, fontWeight, fontStyle);
        charX += charWidth + letterSpacing;
      }
    } else {
      if (props.maxWidth) {
        this.ctx.fillText(props.text, textX, textY, props.maxWidth);
      } else {
        this.ctx.fillText(props.text, textX, textY);
      }
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
    const props = element.props as {
      src?: string;
      width: number;
      height: number;
      borderRadius?: number;
      radius?: number;
      objectFit?: "fill" | "contain" | "cover" | "none";
      fit?: "fill" | "contain" | "cover" | "none";
      circle?: boolean;
      placeholder?: string;
      errorImage?: string;
      lazy?: boolean;
      lazyThreshold?: number;
    };
    const width = props.width;
    const height = props.height;
    const radius = props.circle
      ? Math.min(width, height) / 2
      : (props.radius ?? props.borderRadius ?? 0);
    const imageRuntime = this.renderContext?.imageRuntime;
    const src = props.src;

    const targetSize = Math.max(width, height);
    if (src && imageRuntime) {
      const cached = imageRuntime.get(src, targetSize);
      if (cached) {
        imageRuntime.collectVisible(src);
        this.drawImageWithFit(
          cached,
          x,
          y,
          width,
          height,
          radius,
          props.fit ?? props.objectFit ?? "cover",
        );
        return;
      }
    }

    this.drawImagePlaceholder(x, y, width, height, radius);
    if (!src || !imageRuntime) return;

    const lazyEnabled = props.lazy !== false;
    const rowIndex = this.renderContext?.rowIndex;
    const threshold = props.lazyThreshold ?? 200;
    if (
      lazyEnabled &&
      rowIndex !== undefined &&
      rowIndex >= 0 &&
      !imageRuntime.isInLazyLoadRange(rowIndex, threshold)
    ) {
      return;
    }

    imageRuntime.collectVisible(src);

    if (imageRuntime.isFailed(src)) {
      this.renderImageFallback(
        props.errorImage,
        x,
        y,
        width,
        height,
        radius,
        props.fit ?? props.objectFit,
      );
      return;
    }

    if (!imageRuntime.isLoading(src)) {
      imageRuntime.load(src, targetSize);
    }
    this.renderImageFallback(
      props.placeholder,
      x,
      y,
      width,
      height,
      radius,
      props.fit ?? props.objectFit,
    );
  }

  private drawImagePlaceholder(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    this.ctx.fillStyle = "#f5f5f5";
    this.drawRoundedRect(x, y, width, height, radius);
    this.ctx.fill();
    this.ctx.strokeStyle = "#d9d9d9";
    this.ctx.lineWidth = 1;
    this.drawRoundedRect(x, y, width, height, radius);
    this.ctx.stroke();
  }

  private renderImageFallback(
    src: string | undefined,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fit: "fill" | "contain" | "cover" | "none" | undefined,
  ): void {
    if (!src || !this.renderContext?.imageRuntime) return;
    const image = this.renderContext.imageRuntime.get(src, Math.max(width, height));
    if (image) {
      this.drawImageWithFit(image, x, y, width, height, radius, fit ?? "cover");
    } else if (!this.renderContext.imageRuntime.isLoading(src)) {
      this.renderContext.imageRuntime.load(src, Math.max(width, height));
    }
  }

  private drawImageWithFit(
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fit: "fill" | "contain" | "cover" | "none",
  ): void {
    this.ctx.save();
    this.drawRoundedRect(x, y, width, height, radius);
    this.ctx.clip();

    const imageWidth = image.width;
    const imageHeight = image.height;
    let drawX = x;
    let drawY = y;
    let drawWidth = width;
    let drawHeight = height;

    if (fit === "contain" || fit === "cover") {
      const scale =
        fit === "contain"
          ? Math.min(width / imageWidth, height / imageHeight)
          : Math.max(width / imageWidth, height / imageHeight);
      drawWidth = imageWidth * scale;
      drawHeight = imageHeight * scale;
      drawX = x + (width - drawWidth) / 2;
      drawY = y + (height - drawHeight) / 2;
    } else if (fit === "none") {
      drawWidth = imageWidth;
      drawHeight = imageHeight;
      drawX = x + (width - drawWidth) / 2;
      drawY = y + (height - drawHeight) / 2;
    }

    this.ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    this.ctx.restore();
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

  /**
   * 进度条是“绘制型”图元：几何来自布局节点（width/height 恒定），
   * value / 颜色 / label 在每次绘制时从当前元素读取，
   * 所以不同进度的单元格可以共享同一棵布局计划。
   */
  private renderProgress(
    element: CTElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const props = element.props as ProgressRenderProps;
    const shape = props.shape ?? "line";
    const max = Number(props.max);
    const safeMax = Number.isFinite(max) && max > 0 ? max : 100;

    // 拖拽中的预览值优先，其余情况读取当前元素的 props
    const override = this.renderContext?.getProgressValueOverride?.(
      this.renderContext.rowIndex ?? -1,
      this.renderContext.colIndex ?? -1,
      typeof props.id === "string" ? props.id : undefined,
    );
    const numericValue = Number(override ?? props.value ?? 0);
    const rawValue = Number.isFinite(numericValue) ? numericValue : 0;
    const ratio = Math.min(1, Math.max(0, rawValue / safeMax));
    const precision = props.precision ?? 0;
    const showLabel = props.showLabel ?? false;

    const lineGeometry =
      shape === "line"
        ? this.renderLineProgress(props, x, y, width, height, ratio, rawValue, safeMax, showLabel)
        : null;
    const radialGeometry = lineGeometry
      ? null
      : this.renderRadialProgress(
          props,
          x,
          y,
          width,
          height,
          ratio,
          rawValue,
          safeMax,
          showLabel,
          shape === "dashboard" ? "dashboard" : "circle",
        );

    if (!props.interactive || !this.renderContext?.collectInteractiveRegion) return;

    // 捕获当前单元格的 updateValue，避免拖拽回调落到最后渲染的单元格上
    const updateValue = this.renderContext.updateValue;
    const base = {
      type: "progress" as const,
      element,
      props: element.props,
      row: this.renderContext.row,
      column: this.renderContext.column,
      rowIndex: this.renderContext.rowIndex,
      colIndex: this.renderContext.colIndex,
      onValueChange: (next: number) => {
        const handler = props.onChange;
        if (typeof handler === "function") return handler(next);
        return updateValue?.(next);
      },
    };

    if (lineGeometry && lineGeometry.trackWidth > 0 && lineGeometry.trackHeight > 0) {
      const trackX = this.cellX + lineGeometry.trackX;
      const trackY = this.cellY + lineGeometry.trackY;
      this.renderContext.collectInteractiveRegion({
        ...base,
        rect: {
          x: trackX,
          y: trackY,
          width: lineGeometry.trackWidth,
          height: lineGeometry.trackHeight,
        },
        progress: {
          shape: "line",
          trackX,
          trackY,
          trackWidth: lineGeometry.trackWidth,
          trackHeight: lineGeometry.trackHeight,
          centerX: 0,
          centerY: 0,
          radius: 0,
          startAngle: 0,
          totalAngle: 0,
          max: safeMax,
          precision,
        },
      });
      return;
    }

    if (radialGeometry && radialGeometry.diameter > 0) {
      const centerX = this.cellX + radialGeometry.centerX;
      const centerY = this.cellY + radialGeometry.centerY;
      const boxRadius = radialGeometry.diameter / 2;
      const startAngle = shape === "dashboard" ? Math.PI * 0.75 : -Math.PI / 2;
      const totalAngle = shape === "dashboard" ? Math.PI * 1.5 : Math.PI * 2;
      this.renderContext.collectInteractiveRegion({
        ...base,
        rect: {
          x: centerX - boxRadius,
          y: centerY - boxRadius,
          width: radialGeometry.diameter,
          height: radialGeometry.diameter,
        },
        progress: {
          shape,
          trackX: 0,
          trackY: 0,
          trackWidth: 0,
          trackHeight: 0,
          centerX,
          centerY,
          radius: radialGeometry.radius,
          startAngle,
          totalAngle,
          max: safeMax,
          precision,
        },
      });
    }
  }

  private renderLineProgress(
    props: ProgressRenderProps,
    x: number,
    y: number,
    width: number,
    height: number,
    ratio: number,
    rawValue: number,
    max: number,
    showLabel: boolean,
  ): { trackX: number; trackY: number; trackWidth: number; trackHeight: number } {
    const labelPosition = props.labelPosition ?? "inside";
    const reservedLabelWidth =
      showLabel && labelPosition === "right" ? Math.max(0, props.labelWidth ?? 34) : 0;
    const trackX = x;
    const trackY = y;
    const trackWidth = Math.max(0, width - reservedLabelWidth);
    const trackHeight = Math.max(0, height);
    const geometry = { trackX, trackY, trackWidth, trackHeight };

    if (trackWidth <= 0 || trackHeight <= 0) return geometry;

    const radius = Math.max(
      0,
      Math.min(
        props.radius ?? props.borderRadius ?? trackHeight / 2,
        trackHeight / 2,
        trackWidth / 2,
      ),
    );
    const minBarWidth = Math.max(0, props.minBarWidth ?? radius * 2);
    const fillWidth =
      ratio > 0 ? Math.min(trackWidth, Math.max(ratio * trackWidth, minBarWidth)) : 0;

    this.ctx.save();

    // 轨道
    this.ctx.fillStyle = props.trackColor ?? this.theme.colors.progress.track;
    this.drawRoundedRect(trackX, trackY, trackWidth, trackHeight, radius);
    this.ctx.fill();

    // 填充（裁剪到轨道，保证右端圆角与轨道一致）
    if (fillWidth > 0) {
      this.ctx.save();
      this.drawRoundedRect(trackX, trackY, trackWidth, trackHeight, radius);
      this.ctx.clip();
      this.ctx.fillStyle = this.resolveProgressColor(props, ratio);
      this.drawRoundedRect(trackX, trackY, fillWidth, trackHeight, radius);
      this.ctx.fill();
      this.ctx.restore();
    }

    if (showLabel) {
      const label = this.getProgressLabel(props, ratio, rawValue, max);
      const fontSize = props.fontSize ?? Math.min(10, Math.max(8, trackHeight - 2));
      const fontFamily = props.fontFamily ?? this.theme.font.family;
      const fontWeight = props.fontWeight ?? "normal";

      this.ctx.save();
      this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      this.ctx.textBaseline = "middle";

      if (labelPosition === "right") {
        this.ctx.textAlign = "left";
        this.ctx.fillStyle = props.color ?? this.theme.colors.cellText;
        this.ctx.fillText(
          label,
          trackX + trackWidth + 4,
          trackY + trackHeight / 2,
          Math.max(0, reservedLabelWidth - 4),
        );
      } else {
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = props.color ?? "#ffffff";
        this.ctx.fillText(label, trackX + trackWidth / 2, trackY + trackHeight / 2, trackWidth);
      }

      this.ctx.restore();
    }

    this.ctx.restore();
    return geometry;
  }

  private renderRadialProgress(
    props: ProgressRenderProps,
    x: number,
    y: number,
    width: number,
    height: number,
    ratio: number,
    rawValue: number,
    max: number,
    showLabel: boolean,
    shape: "circle" | "dashboard",
  ): { centerX: number; centerY: number; radius: number; diameter: number } {
    const diameter = Math.min(width, height);
    const centerX = x + width / 2;
    const centerY = y + height / 2 + (shape === "dashboard" ? height * 0.05 : 0);
    const geometry = { centerX, centerY, radius: 0, diameter };
    if (diameter <= 0) return geometry;

    const strokeWidth = Math.max(
      1,
      props.strokeWidth ?? Math.max(2, Math.round(diameter * (shape === "dashboard" ? 0.1 : 0.12))),
    );
    const radius = Math.max(0, (diameter - strokeWidth) / 2);
    const startAngle = shape === "dashboard" ? Math.PI * 0.75 : -Math.PI / 2;
    const totalAngle = shape === "dashboard" ? Math.PI * 1.5 : Math.PI * 2;

    this.ctx.save();
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = props.strokeLinecap ?? "round";

    // 轨道
    this.ctx.strokeStyle = props.trackColor ?? this.theme.colors.progress.track;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle, false);
    this.ctx.stroke();

    // 进度弧
    if (ratio > 0) {
      this.ctx.strokeStyle = this.resolveProgressColor(props, ratio);
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, startAngle + ratio * totalAngle, false);
      this.ctx.stroke();
    }

    if (showLabel) {
      const label = this.getProgressLabel(props, ratio, rawValue, max);
      const fontSize =
        props.fontSize ?? Math.max(8, Math.round(diameter * (shape === "dashboard" ? 0.28 : 0.32)));
      this.ctx.font = `${props.fontWeight ?? "bold"} ${fontSize}px ${props.fontFamily ?? this.theme.font.family}`;
      this.ctx.fillStyle = props.color ?? this.theme.colors.cellText;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(label, centerX, centerY, Math.max(1, radius * 2));
    }

    this.ctx.restore();
    return { centerX, centerY, radius, diameter };
  }

  private resolveProgressColor(props: ProgressRenderProps, ratio: number): string {
    if (typeof props.barColor === "function") return props.barColor(ratio);
    if (props.barColor) return props.barColor;
    if (props.status === "success") return this.theme.colors.progress.success;
    if (props.status === "warning") return this.theme.colors.progress.warning;
    if (props.status === "error") return this.theme.colors.progress.error;
    return this.theme.colors.progress.default;
  }

  private getProgressLabel(
    props: ProgressRenderProps,
    ratio: number,
    value: number,
    max: number,
  ): string {
    if (props.label !== undefined) {
      return typeof props.label === "function" ? props.label(ratio, value, max) : props.label;
    }
    const precision = props.precision ?? 0;
    const percent = ratio * 100;
    return precision === 0 ? `${Math.round(percent)}%` : `${percent.toFixed(precision)}%`;
  }
}

interface ProgressRenderProps {
  id?: string;
  value?: number;
  max?: number;
  shape?: "line" | "circle" | "dashboard";
  borderRadius?: number;
  radius?: number;
  trackColor?: string;
  barColor?: string | ((ratio: number) => string);
  minBarWidth?: number;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  status?: "normal" | "success" | "warning" | "error";
  showLabel?: boolean;
  label?: string | ((ratio: number, value: number, max: number) => string);
  labelPosition?: "inside" | "right";
  labelWidth?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: "normal" | "bold";
  fontFamily?: string;
  precision?: number;
  interactive?: boolean;
  onChange?: (value: number) => void | Promise<void>;
}
