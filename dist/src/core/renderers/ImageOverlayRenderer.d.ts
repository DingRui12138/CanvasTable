import { ImageEditorState, ImageTooltipState, TableTheme } from "../../types";
interface ImageOverlayLoader {
    get(src: string, minSize?: number): HTMLImageElement | HTMLCanvasElement | null;
    isLoading(src: string): boolean;
    load(src: string, targetSize?: number): void;
    collectVisible(src: string): void;
}
export declare class ImageOverlayRenderer {
    private ctx;
    private theme;
    private loader;
    constructor(ctx: CanvasRenderingContext2D, theme: TableTheme, loader: ImageOverlayLoader);
    setContext(ctx: CanvasRenderingContext2D): void;
    setTheme(theme: TableTheme): void;
    renderImageTooltip(imageTooltip: ImageTooltipState): void;
    renderImageEditor(editor: ImageEditorState): void;
    private renderUploadArea;
    private renderImageTile;
}
export {};
//# sourceMappingURL=ImageOverlayRenderer.d.ts.map