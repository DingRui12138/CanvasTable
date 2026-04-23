import { FilterDropdownState, TableTheme } from "../../types";
export declare class FilterDropdownRenderer {
    private ctx;
    private theme;
    constructor(ctx: CanvasRenderingContext2D, theme: TableTheme);
    setContext(ctx: CanvasRenderingContext2D): void;
    setTheme(theme: TableTheme): void;
    render(filterDropdown: FilterDropdownState): void;
    private renderSearchFilterDropdown;
    private renderSelectFilterDropdown;
    private renderRangeFilterDropdown;
    private renderBooleanFilterDropdown;
    private renderDateRangeFilterDropdown;
    private renderDateRangeCalendarPopover;
    private renderFilterButtons;
    private drawPanelBackground;
    private drawPanelBorder;
    private formatDate;
}
//# sourceMappingURL=FilterDropdownRenderer.d.ts.map