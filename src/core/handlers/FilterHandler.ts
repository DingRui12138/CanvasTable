/**
 * FilterHandler - Handles filter dropdown state and filter application
 *
 * Owns the filter dropdown interaction logic: applying / clearing filters,
 * searching options and updating range / boolean / date-range values.
 */

import { FilterConfig, FilterMode } from "../../types";
import { getColumnFilterOptions, searchFilterOptions } from "../../utils";
import { TableEvents } from "../../constants/events";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { HeaderHandler } from "./HeaderHandler";

export class FilterHandler extends BaseHandler {
  private filterConfig: FilterConfig[];
  private headerHandler: HeaderHandler;

  constructor(
    context: HandlerContext,
    eventEmitter: EventEmitter<InteractionEvents>,
    filterConfig: FilterConfig[],
    headerHandler: HeaderHandler,
  ) {
    super(context, eventEmitter);
    this.filterConfig = filterConfig;
    this.headerHandler = headerHandler;
  }

  applyFilter(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey, mode } = this.state.filterDropdown;

    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
    }

    // 根据筛选模式处理不同的筛选值
    let filterValue: unknown = null;
    let hasFilter = false;

    switch (mode) {
      case "search": {
        // 关键字搜索模式
        const searchValue = this.state.filterDropdown.searchValue?.trim();
        if (searchValue) {
          filterValue = searchValue;
          hasFilter = true;
        }
        break;
      }

      case "select": {
        // 多选模式
        const options = this.state.filterDropdown.options;
        if (options) {
          const checkedOptions = options.filter((o) => o.checked);
          if (checkedOptions.length > 0 && checkedOptions.length < options.length) {
            filterValue = checkedOptions.map((o) => o.value);
            hasFilter = true;
          }
        }
        break;
      }

      case "range": {
        // 范围筛选模式
        const minVal = this.state.filterDropdown.minValue;
        const maxVal = this.state.filterDropdown.maxValue;
        if (minVal !== "" || maxVal !== "") {
          filterValue = {
            min: minVal !== "" ? Number(minVal) : undefined,
            max: maxVal !== "" ? Number(maxVal) : undefined,
          };
          hasFilter = true;
        }
        break;
      }

      case "dateRange": {
        // 日期范围筛选模式
        const startDate = this.state.filterDropdown.startDate;
        const endDate = this.state.filterDropdown.endDate;
        if (startDate || endDate) {
          filterValue = {
            start: startDate,
            end: endDate,
          };
          hasFilter = true;
        }
        break;
      }

      case "boolean": {
        // 布尔筛选模式
        const boolValue = this.state.filterDropdown.boolValue;
        if (boolValue !== "all") {
          filterValue = boolValue;
          hasFilter = true;
        }
        break;
      }
    }

    if (hasFilter) {
      this.filterConfig.push({
        column: columnKey,
        operator: this.getOperatorByMode(mode),
        value: filterValue,
      });
    }

    this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    this.state.filterDropdown = null;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
  }

  clearFilter(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey } = this.state.filterDropdown;
    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
    }

    this.headerHandler.updateFilterConfig(this.filterConfig);
    this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    this.state.filterDropdown = null;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
  }

  /**
   * 重置当前筛选 dropdown 的筛选值，但保持 dropdown 打开
   * 用于重置按钮
   */
  resetFilterValue(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey } = this.state.filterDropdown;

    // 清除 filterConfig 中该列的筛选条件
    const existingIndex = this.filterConfig.findIndex((f) => f.column === columnKey);
    if (existingIndex >= 0) {
      this.filterConfig.splice(existingIndex, 1);
      this.headerHandler.updateFilterConfig(this.filterConfig);
      this.dataManager.filter(this.filterConfig);
      this.eventEmitter.emit(TableEvents.FILTER_CHANGE, [...this.filterConfig]);
    }

    // 保持 dropdown 打开，只触发重新渲染
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * 处理筛选下拉框的搜索输入
   * 用于延迟加载模式下的选项搜索
   */
  handleFilterDropdownSearch(searchText: string): void {
    if (!this.state.filterDropdown) return;

    const { mode, columnKey } = this.state.filterDropdown;

    if (mode === "select") {
      // 更新搜索文本
      this.state.filterDropdown.searchText = searchText;

      // 查找列配置
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns.find((col) => col.key === columnKey);
      if (!column) return;

      const rowsToUse = this.allRows.length > 0 ? this.allRows : this.rows;

      if (searchText.trim()) {
        // 有搜索文本时，搜索匹配的选项
        const matchedOptions = searchFilterOptions(column, rowsToUse, searchText);
        this.state.filterDropdown.options = matchedOptions.map((opt) => ({
          label: opt.label,
          value: opt.value,
          checked: false,
        }));
        this.state.filterDropdown.isLoading = false;
      } else {
        // 无搜索文本时，使用采样策略
        const sampledOptions = getColumnFilterOptions(column, rowsToUse, 0);
        if (sampledOptions.length === 0 && rowsToUse.length > 0) {
          this.state.filterDropdown.isLoading = true;
          this.state.filterDropdown.options = undefined;
        } else {
          this.state.filterDropdown.options = sampledOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
            checked: false,
          }));
          this.state.filterDropdown.isLoading = false;
        }
      }

      this.state.filterDropdown.scrollTop = 0;
      this.state.filterDropdown.hoveredIndex = -1;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
    } else if (mode === "search") {
      // 关键字搜索模式 - 直接更新搜索值
      this.state.filterDropdown.searchValue = searchText;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
    }
  }

  /**
   * 处理筛选下拉框的范围值更新
   */
  handleFilterDropdownRangeUpdate(minValue: string, maxValue: string): void {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "range") return;

    this.state.filterDropdown.minValue = minValue;
    this.state.filterDropdown.maxValue = maxValue;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * 处理筛选下拉框的布尔值更新
   */
  handleFilterDropdownBooleanUpdate(value: "all" | "true" | "false"): void {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "boolean") return;

    this.state.filterDropdown.boolValue = value;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * 处理筛选下拉框的日期范围更新
   */
  handleFilterDropdownDateRangeUpdate(startDate: Date | null, endDate: Date | null): void {
    if (!this.state.filterDropdown || this.state.filterDropdown.mode !== "dateRange") return;

    this.state.filterDropdown.startDate = startDate;
    this.state.filterDropdown.endDate = endDate;
    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * 根据筛选模式获取操作符
   */
  private getOperatorByMode(mode: FilterMode): string {
    switch (mode) {
      case "search":
        return "contains";
      case "select":
        return "in";
      case "range":
        return "between";
      case "dateRange":
        return "dateRange";
      case "boolean":
        return "equals";
      default:
        return "contains";
    }
  }
}
