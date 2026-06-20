/**
 * ImageRenderer - Renders image cells (single & multi-image grid).
 *
 * The renderer is stateless: all runtime concerns (image load queue,
 * lazy-load gating, per-frame visibility tracking) live on the host
 * Renderer and are exposed via {@link ImageRuntime} on the context.
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class ImageRenderer extends BaseCellRenderer {
    readonly type: CellType;
    private traceStep;
    render(context: CellRendererContext): CellRenderResult;
    private renderMultipleImages;
    private getMaxImageSize;
    private renderImagePlaceholder;
    private renderImageError;
    private renderImageHover;
    private renderMoreCount;
    private drawImageWithFit;
}
//# sourceMappingURL=ImageRenderer.d.ts.map