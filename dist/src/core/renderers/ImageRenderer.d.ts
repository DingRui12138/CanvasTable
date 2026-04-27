/**
 * ImageRenderer - Renders image cells
 *
 * Note: Image rendering requires access to image cache and loading state.
 * The actual image loading is handled by the main Renderer class.
 * This renderer focuses on the rendering logic for loaded images.
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class ImageRenderer extends BaseCellRenderer {
    readonly type: CellType;
    /**
     * Image cache reference - set by Renderer during initialization
     */
    static imageCache: Map<string, HTMLImageElement>;
    static loadingImages: Set<string>;
    static failedImages: Set<string>;
    render(context: CellRendererContext): CellRenderResult;
    private renderMultipleImages;
    private renderImagePlaceholder;
    private getMaxImageSize;
    private renderImageError;
    private renderImageHover;
    private renderMoreCount;
    private drawImageWithFit;
    /**
     * Clear all static caches to prevent memory leaks
     */
    static clearCache(): void;
}
//# sourceMappingURL=ImageRenderer.d.ts.map