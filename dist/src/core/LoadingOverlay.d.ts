/**
 * LoadingOverlay - HTML loading overlay element
 *
 * Features:
 * 1. Positioned inside wrapper container
 * 2. Blocks all events during loading (prevents scroll穿透)
 * 3. Configurable text and colors
 */
import type { TableTheme } from "../types";
export interface LoadingOverlayConfig {
    /** Loading text, default "Loading..." */
    text?: string;
}
export declare class LoadingOverlay {
    private element;
    private spinnerElement;
    private textElement;
    private theme;
    private config;
    constructor(wrapper: HTMLElement, theme: TableTheme, config?: LoadingOverlayConfig);
    private applyTheme;
    setTheme(theme: TableTheme): void;
    setConfig(config: LoadingOverlayConfig): void;
    private updateText;
    show(text?: string): void;
    hide(): void;
    isVisible(): boolean;
    destroy(): void;
}
//# sourceMappingURL=LoadingOverlay.d.ts.map