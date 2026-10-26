import { CanvasTableLocale, TableTheme, FilterDropdownState } from "../types";
import { EventEmitter } from "./EventEmitter";
interface FilterInputEvents {
    filterDropdownOpen: [];
    filterDropdownClose: [];
    filterInputChange: [string];
    [key: string]: unknown[];
}
/**
 * FilterInputManager - 管理筛选下拉框中的真实 input 元素
 */
export declare class FilterInputManager {
    private wrapper;
    private eventEmitter;
    private theme;
    private locale;
    private searchInput;
    private minInput;
    private maxInput;
    private currentMode;
    private currentColumnKey;
    private onInputChange;
    private isUpdatingFromExternal;
    constructor(wrapper: HTMLElement, eventEmitter: EventEmitter<FilterInputEvents>, theme: TableTheme, locale?: CanvasTableLocale);
    setTheme(theme: TableTheme): void;
    setLocale(locale: CanvasTableLocale): void;
    private updatePlaceholders;
    setOnInputChange(callback: (value: string, field: string) => void): void;
    /**
     * 更新筛选下拉框状态并创建/更新输入框
     */
    updateFilterDropdown(filterDropdown: FilterDropdownState | null): void;
    /**
     * 更新输入框位置和值（不重新创建）
     */
    private updatePositions;
    /**
     * 创建 search 模式的输入框
     */
    private createSearchInput;
    /**
     * 创建 select 模式的搜索输入框
     */
    private createSelectSearchInput;
    /**
     * 创建 range 模式的两个输入框
     */
    private createRangeInputs;
    /**
     * 移除所有输入框
     */
    removeInputs(): void;
    /**
     * 强制重置所有输入框的值
     * 用于重置按钮点击时，即使输入框有焦点也要清空
     */
    forceReset(): void;
    /**
     * 强制更新输入框的值
     * 用于重新打开筛选器时同步状态
     */
    forceUpdateValues(filterDropdown: FilterDropdownState): void;
    /**
     * 更新输入框位置（滚动时调用）
     */
    updatePosition(filterDropdown: FilterDropdownState): void;
    /**
     * 销毁
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=FilterInputManager.d.ts.map