import type { CTElement, CTLayoutInfo } from "./types";
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
    private layouts;
    constructor(ctx: CanvasRenderingContext2D, layoutEngine: LayoutEngine, theme: TableTheme, trace?: CellRenderTrace);
    private traceStep;
    render(root: CTElement, x: number, y: number, parentSize?: {
        width: number;
        height: number;
    }): void;
    getLayouts(): CTLayoutInfo[];
    private flattenLayoutTree;
    private renderLayoutNode;
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
    private renderLine;
}
//# sourceMappingURL=CTRenderer.d.ts.map