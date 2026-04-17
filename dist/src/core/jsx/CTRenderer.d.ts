import type { CTElement, CTLayoutInfo } from './types';
import type { TableTheme } from '../../types/index';
import { LayoutEngine } from './LayoutEngine';
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
export declare class CTRenderer {
    private ctx;
    private layoutEngine;
    private theme;
    private layouts;
    constructor(ctx: CanvasRenderingContext2D, layoutEngine: LayoutEngine, theme: TableTheme);
    /**
     * Render element tree
     */
    render(root: CTElement, x: number, y: number): void;
    getLayouts(): CTLayoutInfo[];
    private renderElement;
    private renderGroup;
    private renderRect;
    private renderCircle;
    private renderText;
    private renderImage;
    private renderLine;
    private calculateGroupBounds;
}
//# sourceMappingURL=CTRenderer.d.ts.map