import { ButtonsDropdownState, CanvasTableLocale, DropdownState, TableTheme } from "../../types";
export declare class DropdownRenderer {
    private ctx;
    private theme;
    private locale;
    private measureTextWidth;
    constructor(ctx: CanvasRenderingContext2D, theme: TableTheme, measureTextWidth: (text: string) => number, locale?: CanvasTableLocale);
    setContext(ctx: CanvasRenderingContext2D): void;
    setTheme(theme: TableTheme): void;
    setLocale(locale: CanvasTableLocale): void;
    renderButtonsDropdown(dropdown: ButtonsDropdownState): void;
    renderDropdown(dropdown: DropdownState): void;
    private renderTagsDropdown;
    private renderMultipleOption;
    private renderSingleOption;
    private renderDropdownScrollbar;
    private drawDropdownPanel;
}
//# sourceMappingURL=DropdownRenderer.d.ts.map