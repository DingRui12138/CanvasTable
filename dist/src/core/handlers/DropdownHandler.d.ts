/**
 * DropdownHandler - Handles dropdown menu interactions
 *
 * Manages select dropdowns, tags dropdowns, filter dropdowns,
 * date dropdowns, and buttons dropdowns.
 */
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
export declare class DropdownHandler extends BaseHandler {
    private static readonly DROPDOWN_ITEM_HEIGHT;
    private static readonly DROPDOWN_MAX_VISIBLE;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    private invokeJSXDropdownChange;
    /**
     * Handle dropdown click
     */
    handleDropdownClick(e: MouseEvent): boolean;
    /**
     * Handle dropdown hover
     */
    handleDropdownHover(e: MouseEvent): void;
    /**
     * Handle buttons dropdown click
     */
    handleButtonsDropdownClick(e: MouseEvent): boolean;
    /**
     * Handle buttons dropdown hover
     */
    handleButtonsDropdownHover(e: MouseEvent): void;
    private isButtonsDropdownSourceDisabled;
    /**
     * Handle filter dropdown click
     */
    handleFilterDropdownClick(e: MouseEvent): boolean;
    /**
     * 获取筛选下拉框高度
     */
    private getFilterDropdownHeight;
    /**
     * 处理 select 模式点击
     */
    private handleSelectModeClick;
    /**
     * 处理 search 模式点击
     */
    private handleSearchModeClick;
    /**
     * 处理 range 模式点击
     */
    private handleRangeModeClick;
    /**
     * 处理 boolean 模式点击
     */
    private handleBooleanModeClick;
    /**
     * 处理 dateRange 模式点击
     */
    private handleDateRangeModeClick;
    /**
     * Handle calendar popover click for date range filter
     */
    private handleDateRangeCalendarClick;
    /**
     * Handle calendar popover hover for date range filter
     */
    private handleDateRangeCalendarHover;
    /**
     * Handle filter dropdown hover
     */
    handleFilterDropdownHover(e: MouseEvent): void;
    /**
     * Update dropdown position after scroll
     */
    updateDropdownPosition(): void;
    /**
     * Close all dropdowns
     */
    closeAllDropdowns(): void;
    /**
     * Update filter dropdown position
     */
    updateFilterDropdownPosition(): void;
    /**
     * Update date dropdown position
     */
    updateDateDropdownPosition(): void;
    /**
     * Update color dropdown position
     */
    updateColorDropdownPosition(): void;
    /**
     * Update buttons dropdown position
     */
    updateButtonsDropdownPosition(): void;
    /**
     * Format date to YYYY-MM-DD
     */
    formatDate(date: Date): string;
    /**
     * Get default preset colors for color picker
     */
    getDefaultPresetColors(): string[];
    /**
     * Handle date dropdown click
     */
    handleDateDropdownClick(e: MouseEvent): boolean;
    /**
     * Handle date dropdown hover
     */
    handleDateDropdownHover(e: MouseEvent): void;
    /**
     * Handle color dropdown click
     */
    handleColorDropdownClick(e: MouseEvent): boolean;
    /**
     * Handle color dropdown hover
     */
    handleColorDropdownHover(e: MouseEvent): void;
}
//# sourceMappingURL=DropdownHandler.d.ts.map