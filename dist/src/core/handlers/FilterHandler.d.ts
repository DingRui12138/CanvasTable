/**
 * FilterHandler - Handles filter dropdown state and filter application
 *
 * Owns the filter dropdown interaction logic: applying / clearing filters,
 * searching options and updating range / boolean / date-range values.
 */
import { FilterConfig } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { HeaderHandler } from "./HeaderHandler";
export declare class FilterHandler extends BaseHandler {
    private filterConfig;
    private headerHandler;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>, filterConfig: FilterConfig[], headerHandler: HeaderHandler);
    applyFilter(): void;
    clearFilter(): void;
    /**
     * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
     * 用于重置按钮
     */
    resetFilterValue(): void;
    /**
     * 处理筛选下拉框的搜索输入
     * 用于延迟加载模式下的选项搜索
     */
    handleFilterDropdownSearch(searchText: string): void;
    /**
     * 处理筛选下拉框的范围值更新
     */
    handleFilterDropdownRangeUpdate(minValue: string, maxValue: string): void;
    /**
     * 处理筛选下拉框的布尔值更新
     */
    handleFilterDropdownBooleanUpdate(value: "all" | "true" | "false"): void;
    /**
     * 处理筛选下拉框的日期范围更新
     */
    handleFilterDropdownDateRangeUpdate(startDate: Date | null, endDate: Date | null): void;
    /**
     * 根据筛选模式获取操作符
     */
    private getOperatorByMode;
}
//# sourceMappingURL=FilterHandler.d.ts.map