import type { CTElement, CTLayoutInfo, CTRenderContext } from "./types";
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
export declare class CTRenderer {
    private ctx;
    private layoutEngine;
    private theme;
    private trace?;
    private renderContext?;
    private layouts;
    private layoutTree;
    constructor(ctx: CanvasRenderingContext2D, layoutEngine: LayoutEngine, theme: TableTheme, trace?: CellRenderTrace, renderContext?: CTRenderContext);
    private traceStep;
    render(root: CTElement, x: number, y: number, parentSize?: {
        width: number;
        height: number;
    }, layoutCacheKey?: string | null): void;
    getLayouts(): CTLayoutInfo[];
    setContext(ctx: CanvasRenderingContext2D): void;
    setTheme(theme: TableTheme): void;
    setRenderContext(renderContext?: CTRenderContext): void;
    setTrace(trace?: CellRenderTrace): void;
    private flattenLayoutTree;
    private getLayoutOrderedChildren;
    private renderLayoutNode;
    private renderInteractiveWrapperNode;
    private getBorderRadiusArray;
    private drawRoundedRect;
    private createGradientFill;
    private normalizeBorderSide;
    private renderBoxNode;
    private normalizeShadow;
    private renderCircle;
    private renderText;
    private measureCharWidth;
    private getTextWidthWithSpacing;
    private renderImage;
    private drawImagePlaceholder;
    private renderImageFallback;
    private drawImageWithFit;
    private renderLine;
}
//# sourceMappingURL=CTRenderer.d.ts.map