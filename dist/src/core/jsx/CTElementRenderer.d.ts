import type { CTElement, CTLayoutInfo, CTRenderContext } from './types';
import type { TableTheme } from '../../types/index';
import { LayoutEngine } from './LayoutEngine';
import { type JSXRenderCacheStats } from './JSXRenderCache';
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
export declare class CTElementRenderer {
    private ctx;
    private layoutEngine;
    private theme;
    private renderContext?;
    private layouts;
    private layoutTree;
    private renderCache;
    private gradientCache;
    private static readonly GRADIENT_CACHE_MAX;
    private cellX;
    private cellY;
    constructor(ctx: CanvasRenderingContext2D, layoutEngine: LayoutEngine, theme: TableTheme, renderContext?: CTRenderContext);
    render(root: CTElement, x: number, y: number, parentSize?: {
        width: number;
        height: number;
    }, layoutCacheKey?: string | null): void;
    getRenderCacheStats(): JSXRenderCacheStats;
    invalidateOffscreen(_scope: 'all' | {
        oldSize: string | string[];
    }): void;
    getLayouts(): CTLayoutInfo[];
    setContext(ctx: CanvasRenderingContext2D): void;
    setTheme(theme: TableTheme): void;
    setRenderContext(renderContext?: CTRenderContext): void;
    private buildRenderPlanKey;
    private flattenLayoutTree;
    private getLayoutOrderedChildren;
    private renderLayoutNode;
    private renderInteractiveWrapperNode;
    private getBorderRadiusArray;
    private drawRoundedRect;
    private createGradientFill;
    private getGradientCacheKey;
    private createRelativeGradientFill;
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
//# sourceMappingURL=CTElementRenderer.d.ts.map