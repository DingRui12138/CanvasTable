import { ColorPickerDropdownState, ContextMenuState, DateDropdownState, HeaderContextMenuState, CanvasTableLocale, ScrollbarState, TableTheme, TooltipState, WatermarkConfig } from "../../types";
import { LayoutManager } from "../LayoutManager";
export declare class OverlayRenderer {
    private ctx;
    private canvas;
    private theme;
    private layoutManager;
    private locale;
    private dpr;
    private watermarkConfig;
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, theme: TableTheme, layoutManager: LayoutManager, dpr: number, locale?: CanvasTableLocale);
    setCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void;
    setTheme(theme: TableTheme): void;
    setLocale(locale: CanvasTableLocale): void;
    setDpr(dpr: number): void;
    setWatermarkConfig(config: WatermarkConfig | null): void;
    renderColorDropdown(dropdown: ColorPickerDropdownState): void;
    renderTooltip(tooltip: TooltipState): void;
    renderScrollbars(scrollLeft: number, scrollTop: number, maxScrollLeft: number, maxScrollTop: number, scrollbarState: ScrollbarState): void;
    getScrollbarBounds(scrollLeft: number, scrollTop: number, maxScrollLeft: number, maxScrollTop: number): {
        vertical: {
            x: number;
            y: number;
            width: number;
            height: number;
        } | null;
        horizontal: {
            x: number;
            y: number;
            width: number;
            height: number;
        } | null;
    };
    renderWatermark(): void;
    renderContextMenu(contextMenu: ContextMenuState): void;
    renderHeaderContextMenu(headerContextMenu: HeaderContextMenuState): void;
    renderDateDropdown(dateDropdown: DateDropdownState): void;
    private drawMenuPanel;
    private getDefaultPresetColors;
}
//# sourceMappingURL=OverlayRenderer.d.ts.map