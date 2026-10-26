import { TableTheme } from "../../types";
interface OverlayPanelOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    radius?: number;
    fillStyle: string;
    strokeStyle?: string;
    shadow?: boolean;
    clip?: boolean;
}
export declare function resetShadow(ctx: CanvasRenderingContext2D): void;
export declare function applyThemeShadow(ctx: CanvasRenderingContext2D, theme: TableTheme): void;
export declare function drawOverlayPanel(ctx: CanvasRenderingContext2D, theme: TableTheme, options: OverlayPanelOptions): void;
export declare function renderOverlayVerticalScrollbar(ctx: CanvasRenderingContext2D, theme: TableTheme, x: number, y: number, width: number, trackHeight: number, thumbY: number, thumbHeight: number): void;
export {};
//# sourceMappingURL=OverlayRenderUtils.d.ts.map