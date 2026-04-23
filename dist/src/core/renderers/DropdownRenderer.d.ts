import { ButtonsDropdownState, DropdownState, TableTheme } from "../../types";
export declare class DropdownRenderer {
    private ctx;
    private theme;
    private measureTextWidth;
    constructor(ctx: CanvasRenderingContext2D, theme: TableTheme, measureTextWidth: (text: string) => number);
    setContext(ctx: CanvasRenderingContext2D): void;
    setTheme(theme: TableTheme): void;
    renderButtonsDropdown(dropdown: ButtonsDropdownState): void;
    renderDropdown(dropdown: DropdownState): void;
    private renderTagsDropdown;
    private renderMultipleOption;
    private renderSingleOption;
    private renderDropdownScrollbar;
    private drawDropdownPanel;
}
//# sourceMappingURL=DropdownRenderer.d.ts.map