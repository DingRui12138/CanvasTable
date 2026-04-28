/**
 * DropdownHandler - Handles dropdown menu interactions
 *
 * Manages select dropdowns, tags dropdowns, filter dropdowns,
 * date dropdowns, and buttons dropdowns.
 */

import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { getColumnField, resolveDisabled } from "../../utils";
import { TableEvents } from "../../constants/events";

export class DropdownHandler extends BaseHandler {
  private static readonly DROPDOWN_ITEM_HEIGHT = 32;
  private static readonly DROPDOWN_MAX_VISIBLE = 8;

  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    super(context, eventEmitter);
  }

  /**
   * Handle dropdown click
   */
  handleDropdownClick(e: MouseEvent): boolean {
    if (!this.state.dropdown) return false;

    const { x, y, width, scrollTop, type, tagsConfig, config } = this.state.dropdown;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;

    if (type === "tags" && tagsConfig) {
      const visibleCount = Math.min(tagsConfig.options?.length ?? 0, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        const relativeY = viewportY - y + scrollTop;
        const itemIndex = Math.floor(relativeY / itemHeight);

        if (itemIndex >= 0 && itemIndex < (tagsConfig.options?.length ?? 0) && tagsConfig.options) {
          const option = tagsConfig.options[itemIndex]!;
          if (!option.disabled) {
            const isMultiple = tagsConfig.multiple !== false;

            if (isMultiple) {
              const selectedValues = [...(tagsConfig.selectedValues ?? [])];
              const optionValue = option.value ?? option.text;
              const existingIndex = selectedValues.indexOf(optionValue);

              if (existingIndex >= 0) {
                selectedValues.splice(existingIndex, 1);
              } else {
                selectedValues.push(optionValue);
              }

              // Auto update row.data
              const dropdownCell = this.state.dropdown.cell;
              const leafColumns = this.layoutManager.getLeafColumns();
              const dropdownColumn = leafColumns[dropdownCell.columnIndex];
              const dropdownRow = this.rows[dropdownCell.rowIndex];
              if (dropdownColumn && dropdownRow) {
                dropdownRow.data[getColumnField(dropdownColumn)] = selectedValues;
              }

              this.eventEmitter.emit(
                TableEvents.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell)!,
                selectedValues,
                true,
              );

              this.state.dropdown.tagsConfig = {
                ...tagsConfig,
                selectedValues,
              };
              this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
            } else {
              const optionValue = option.value ?? option.text;

              // Auto update row.data
              const dropdownCell = this.state.dropdown.cell;
              const leafColumns = this.layoutManager.getLeafColumns();
              const dropdownColumn = leafColumns[dropdownCell.columnIndex];
              const dropdownRow = this.rows[dropdownCell.rowIndex];
              if (dropdownColumn && dropdownRow) {
                dropdownRow.data[getColumnField(dropdownColumn)] = optionValue;
              }

              this.eventEmitter.emit(
                TableEvents.TAGS_CHANGE,
                this.getCellInfo(this.state.dropdown.cell)!,
                [optionValue],
                false,
              );
              this.state.dropdown = null;
              this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
            }
          }
        }
        return true;
      }
      return false;
    }

    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const relativeY = viewportY - y + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < config.options.length) {
        const option = config.options[itemIndex]!;
        if (!option.disabled) {
          if (config.multiple) {
            const currentValues = Array.isArray(config.value) ? [...config.value] : [];
            const optionValue = option.value;
            const existingIndex = currentValues.indexOf(optionValue);

            if (existingIndex >= 0) {
              currentValues.splice(existingIndex, 1);
            } else {
              currentValues.push(optionValue);
            }

            // Auto update row.data
            const dropdownCell = this.state.dropdown.cell;
            const leafColumns = this.layoutManager.getLeafColumns();
            const dropdownColumn = leafColumns[dropdownCell.columnIndex];
            const dropdownRow = this.rows[dropdownCell.rowIndex];
            if (dropdownColumn && dropdownRow) {
              dropdownRow.data[getColumnField(dropdownColumn)] = currentValues;
            }

            this.eventEmitter.emit(
              TableEvents.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell)!,
              currentValues,
            );

            this.state.dropdown.config = {
              ...config,
              value: currentValues,
            };
            this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
          } else {
            // Auto update row.data
            const dropdownCell = this.state.dropdown.cell;
            const leafColumns = this.layoutManager.getLeafColumns();
            const dropdownColumn = leafColumns[dropdownCell.columnIndex];
            const dropdownRow = this.rows[dropdownCell.rowIndex];
            if (dropdownColumn && dropdownRow) {
              dropdownRow.data[getColumnField(dropdownColumn)] = option.value;
            }

            this.eventEmitter.emit(
              TableEvents.SELECT_CHANGE,
              this.getCellInfo(this.state.dropdown.cell)!,
              option.value,
            );
            this.state.dropdown = null;
            this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
          }
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Handle dropdown hover
   */
  handleDropdownHover(e: MouseEvent): void {
    if (!this.state.dropdown) return;

    const { x, y, width, scrollTop, type, tagsConfig, config } = this.state.dropdown;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;

    if (type === "tags" && tagsConfig) {
      const visibleCount = Math.min(tagsConfig.options?.length ?? 0, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;

      if (
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight
      ) {
        const relativeY = viewportY - y + scrollTop;
        const itemIndex = Math.floor(relativeY / itemHeight);

        if (itemIndex >= 0 && itemIndex < (tagsConfig.options?.length ?? 0)) {
          this.state.dropdown.hoveredIndex = itemIndex;
          this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
        }
      } else {
        this.state.dropdown.hoveredIndex = -1;
      }
      return;
    }

    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const relativeY = viewportY - y + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < config.options.length) {
        this.state.dropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
      }
    } else {
      this.state.dropdown.hoveredIndex = -1;
    }
  }

  /**
   * Handle buttons dropdown click
   */
  handleButtonsDropdownClick(e: MouseEvent): boolean {
    if (!this.state.buttonsDropdown) return false;

    const { x, y, buttons, cell } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(cell)) {
      this.state.buttonsDropdown = null;
      this.eventEmitter.emit(TableEvents.BUTTONS_DROPDOWN_CLOSE);
      return true;
    }

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;

    // Calculate max width based on button text
    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    let maxWidth = 100;
    for (const btn of buttons) {
      const text = btn.text ?? this.locale.cell.buttonText;
      const textWidth = this.ctx.measureText(text).width;
      maxWidth = Math.max(maxWidth, textWidth + 24);
    }

    if (
      viewportX >= x &&
      viewportX <= x + maxWidth &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < buttons.length) {
        const btn = buttons[itemIndex]!;
        this.state.buttonsDropdown = null;
        this.eventEmitter.emit(TableEvents.BUTTONS_DROPDOWN_CLOSE);
        this.eventEmitter.emit(TableEvents.BUTTON_CLICK, this.getCellInfo(cell)!, btn.actionKey);
        return true;
      }
    }

    this.state.buttonsDropdown = null;
    this.eventEmitter.emit(TableEvents.BUTTONS_DROPDOWN_CLOSE);
    return true;
  }

  /**
   * Handle buttons dropdown hover
   */
  handleButtonsDropdownHover(e: MouseEvent): void {
    if (!this.state.buttonsDropdown) return;

    const { x, y, buttons } = this.state.buttonsDropdown;
    if (this.isButtonsDropdownSourceDisabled(this.state.buttonsDropdown.cell)) {
      this.state.buttonsDropdown.hoveredIndex = -1;
      this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
      return;
    }

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;

    this.ctx.font = `14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    let maxWidth = 100;
    for (const btn of buttons) {
      const text = btn.text ?? this.locale.cell.buttonText;
      const textWidth = this.ctx.measureText(text).width;
      maxWidth = Math.max(maxWidth, textWidth + 24);
    }

    if (
      viewportX >= x &&
      viewportX <= x + maxWidth &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const relativeY = viewportY - y;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < buttons.length) {
        this.state.buttonsDropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
      }
    } else {
      this.state.buttonsDropdown.hoveredIndex = -1;
    }
  }

  private isButtonsDropdownSourceDisabled(cell: {
    rowIndex: number;
    columnIndex: number;
  }): boolean {
    const column = this.layoutManager.getLeafColumns()[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    return column && row ? resolveDisabled(column.disabled, row, column) : true;
  }

  /**
   * Handle filter dropdown click
   */
  handleFilterDropdownClick(e: MouseEvent): boolean {
    if (!this.state.filterDropdown) return false;

    const { x, y, width, mode } = this.state.filterDropdown;
    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const padding = 8;

    // For dateRange mode, check both dropdown and calendar popover areas
    if (mode === "dateRange") {
      const inputHeight = 32;
      const inputGap = 8;
      const gap = 4;
      const buttonHeight = 36;
      const baseHeight = padding + inputHeight + gap + buttonHeight;

      // Check if click is within base dropdown area
      const isInBaseDropdown =
        viewportX >= x && viewportX <= x + width && viewportY >= y && viewportY <= y + baseHeight;

      // Check if click is within calendar popover (if visible)
      let isInCalendar = false;
      if (
        this.state.filterDropdown.activeDateField &&
        this.state.filterDropdown.currentYear !== undefined &&
        this.state.filterDropdown.currentMonth !== undefined
      ) {
        const calendarWidth = 240;
        const calendarHeight = 40 + 28 + 6 * 28 + 16; // header + weekday + 6 rows + padding

        const inputWidth = (width - padding * 3) / 2;
        const input1X = x + padding;
        const input2X = x + padding + inputWidth + inputGap;
        const input1Y = y + padding;

        const activeInputX =
          this.state.filterDropdown.activeDateField === "startDate" ? input1X : input2X;
        const activeInputCenterX = activeInputX + inputWidth / 2;
        let calendarX = activeInputCenterX - calendarWidth / 2;

        if (calendarX < x) calendarX = x;
        if (calendarX + calendarWidth > x + width) calendarX = x + width - calendarWidth;

        const calendarY = input1Y + inputHeight + inputGap;

        isInCalendar =
          viewportX >= calendarX &&
          viewportX <= calendarX + calendarWidth &&
          viewportY >= calendarY &&
          viewportY <= calendarY + calendarHeight;
      }

      if (isInBaseDropdown || isInCalendar) {
        this.handleDateRangeModeClick(e, viewportX, viewportY);
        return true;
      }

      return false;
    }

    // 根据模式计算下拉框高度
    const dropdownHeight = this.getFilterDropdownHeight();

    // 点击弹窗内部，不关闭
    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      // 根据模式处理不同的点击逻辑
      switch (mode) {
        case "select":
          this.handleSelectModeClick(e, viewportX, viewportY);
          break;
        case "search":
          this.handleSearchModeClick(e, viewportX, viewportY);
          break;
        case "range":
          this.handleRangeModeClick(e, viewportX, viewportY);
          break;
        case "boolean":
          this.handleBooleanModeClick(e, viewportX, viewportY);
          break;
      }
      return true;
    }

    return false;
  }

  /**
   * 获取筛选下拉框高度
   */
  private getFilterDropdownHeight(): number {
    if (!this.state.filterDropdown) return 0;

    const { mode, options } = this.state.filterDropdown;
    const padding = 8;
    const gap = 4; // Reduced gap to match Renderer
    const buttonHeight = 36;

    switch (mode) {
      case "search": {
        const inputHeight = 36;
        return padding + inputHeight + gap + buttonHeight;
      }
      case "select": {
        const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
        const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
        const searchHeight = 32;
        const gapSelect = 4; // Match Renderer
        const visibleCount = Math.min(options?.length ?? 0, maxVisibleItems);
        const listHeight = visibleCount * itemHeight;
        return padding + searchHeight + gapSelect + listHeight + gapSelect + buttonHeight;
      }
      case "range": {
        const inputHeight = 32;
        return padding + inputHeight + gap + buttonHeight;
      }
      case "boolean": {
        const itemHeight = 32;
        return padding + itemHeight * 3 + gap + buttonHeight;
      }
      case "dateRange": {
        const inputHeight = 32;
        return padding + inputHeight + gap + buttonHeight;
      }
      default:
        return 0;
    }
  }

  /**
   * 处理 select 模式点击
   */
  private handleSelectModeClick(e: MouseEvent, viewportX: number, viewportY: number): void {
    if (!this.state.filterDropdown) return;

    const { x, y, width, options, scrollTop } = this.state.filterDropdown;
    if (!options) return;

    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const buttonHeight = 36;
    const searchHeight = 32; // Match Renderer
    const listHeight = visibleCount * itemHeight;
    const padding = 8;
    const gap = 4; // Reduced gap

    // Handle scrollbar dragging
    if (options.length > maxVisibleItems) {
      const scrollbarWidth = 6;
      const totalHeight = options.length * itemHeight;
      const thumbHeight = Math.max(20, (listHeight / totalHeight) * listHeight);
      const maxThumbY = listHeight - thumbHeight;
      const thumbY = (scrollTop / (totalHeight - listHeight)) * maxThumbY;
      const scrollbarX = x + width - scrollbarWidth - 2;

      // Scrollbar is in the list area, which starts at y + padding + searchHeight + gap
      const listY = y + padding + searchHeight + gap;
      if (
        viewportX >= scrollbarX &&
        viewportX <= scrollbarX + scrollbarWidth &&
        viewportY >= listY + thumbY &&
        viewportY <= listY + thumbY + thumbHeight
      ) {
        this.state.filterDropdown.isScrollbarDragging = true;
        this.state.filterDropdown.scrollbarDragStartY = e.clientY;
        this.state.filterDropdown.scrollbarDragStartScrollTop = scrollTop;
        return;
      }
    }

    // Handle button area
    // buttonY = y + padding + searchHeight + gap + listHeight + gap
    const buttonY = y + padding + searchHeight + gap + listHeight + gap;

    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;

      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;

      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        // Reset filter - clear all checked options
        if (this.state.filterDropdown.options) {
          this.state.filterDropdown.options.forEach((opt) => (opt.checked = false));
        }
        // Emit reset event to clear filter config
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }

      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        // Confirm button clicked
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }

    // Handle option click (in list area)
    const listY = y + padding + searchHeight + gap;
    if (viewportY >= listY && viewportY <= listY + listHeight) {
      const relativeY = viewportY - listY + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < options.length) {
        options[itemIndex]!.checked = !options[itemIndex]!.checked;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CHANGE);
      }
    }
  }

  /**
   * 处理 search 模式点击
   */
  private handleSearchModeClick(_e: MouseEvent, viewportX: number, viewportY: number): void {
    if (!this.state.filterDropdown) return;

    const { x, y, width } = this.state.filterDropdown;
    const padding = 8;
    const gap = 4; // Reduced gap
    const inputHeight = 36;
    const buttonHeight = 36;

    // Handle button area
    const buttonY = y + padding + inputHeight + gap;

    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;

      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;

      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        this.state.filterDropdown.searchValue = "";
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }

      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }

  /**
   * 处理 range 模式点击
   */
  private handleRangeModeClick(_e: MouseEvent, viewportX: number, viewportY: number): void {
    if (!this.state.filterDropdown) return;

    const { x, y, width } = this.state.filterDropdown;
    const padding = 8;
    const inputHeight = 32;
    const gap = 4; // Reduced gap
    const buttonHeight = 36;

    // Handle button area
    const buttonY = y + padding + inputHeight + gap;

    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;

      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;

      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        this.state.filterDropdown.minValue = "";
        this.state.filterDropdown.maxValue = "";
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }

      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }

  /**
   * 处理 boolean 模式点击
   */
  private handleBooleanModeClick(_e: MouseEvent, viewportX: number, viewportY: number): void {
    if (!this.state.filterDropdown) return;

    const { x, y, width } = this.state.filterDropdown;
    const padding = 8;
    const gap = 4; // Reduced gap
    const itemHeight = 32;
    const buttonHeight = 36;

    // Handle option click
    const listY = y + padding;
    const listHeight = itemHeight * 3;

    if (viewportY >= listY && viewportY <= listY + listHeight) {
      const itemIndex = Math.floor((viewportY - listY) / itemHeight);
      const values: Array<"all" | "true" | "false"> = ["all", "true", "false"];
      if (itemIndex >= 0 && itemIndex < 3) {
        this.state.filterDropdown.boolValue = values[itemIndex]!;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CHANGE);
      }
      return;
    }

    // Handle button area
    const buttonY = y + padding + listHeight + gap;

    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;

      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;

      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        this.state.filterDropdown.boolValue = "all";
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }

      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }

  /**
   * 处理 dateRange 模式点击
   */
  private handleDateRangeModeClick(_e: MouseEvent, viewportX: number, viewportY: number): void {
    if (!this.state.filterDropdown) return;

    const { x, y, width, startDate, endDate } = this.state.filterDropdown;
    const padding = 8;
    const inputHeight = 32;
    const inputGap = 8; // 两个输入框之间的间距
    const gap = 4; // Reduced gap between input row and buttons
    const buttonHeight = 36;

    // 输入框行位置
    const inputY = y + padding;
    const inputWidth = (width - padding * 3) / 2;
    const input1X = x + padding;
    const input2X = x + padding + inputWidth + inputGap;

    // 检测点击是否在开始日期输入框内
    if (
      viewportX >= input1X &&
      viewportX <= input1X + inputWidth &&
      viewportY >= inputY &&
      viewportY <= inputY + inputHeight
    ) {
      this.state.filterDropdown.activeDateField = "startDate";
      // 初始化日历状态：使用已有的 startDate 或当前日期
      const dateToUse = startDate || new Date();
      this.state.filterDropdown.currentYear = dateToUse.getFullYear();
      this.state.filterDropdown.currentMonth = dateToUse.getMonth();
      this.state.filterDropdown.hoveredDate = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      return;
    }

    // 检测点击是否在结束日期输入框内
    if (
      viewportX >= input2X &&
      viewportX <= input2X + inputWidth &&
      viewportY >= inputY &&
      viewportY <= inputY + inputHeight
    ) {
      this.state.filterDropdown.activeDateField = "endDate";
      // 初始化日历状态：使用已有的 endDate 或当前日期
      const dateToUse = endDate || new Date();
      this.state.filterDropdown.currentYear = dateToUse.getFullYear();
      this.state.filterDropdown.currentMonth = dateToUse.getMonth();
      this.state.filterDropdown.hoveredDate = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      return;
    }

    // Handle calendar popover clicks (if calendar is visible)
    if (
      this.state.filterDropdown.activeDateField &&
      this.state.filterDropdown.currentYear !== undefined &&
      this.state.filterDropdown.currentMonth !== undefined
    ) {
      const calendarHandled = this.handleDateRangeCalendarClick(
        viewportX,
        viewportY,
        x,
        y,
        width,
        padding,
        inputHeight,
        inputGap,
      );
      if (calendarHandled) return;
    }

    // Handle button area
    const buttonY = y + padding + inputHeight + gap;

    if (viewportY >= buttonY && viewportY <= buttonY + buttonHeight) {
      const fontSize = 14;
      this.ctx.font = `${fontSize}px sans-serif`;
      const resetText = this.locale.filter.reset;
      const confirmText = this.locale.filter.confirm;
      const resetWidth = this.ctx.measureText(resetText).width;
      const confirmWidth = this.ctx.measureText(confirmText).width;

      const resetX = x + padding;
      const confirmX = x + width - padding - confirmWidth;

      if (viewportX >= resetX && viewportX <= resetX + resetWidth + 10) {
        this.state.filterDropdown.startDate = null;
        this.state.filterDropdown.endDate = null;
        // Clear calendar state as well
        this.state.filterDropdown.activeDateField = undefined;
        this.state.filterDropdown.currentYear = undefined;
        this.state.filterDropdown.currentMonth = undefined;
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_RESET);
        return;
      }

      if (viewportX >= confirmX - 10 && viewportX <= confirmX + confirmWidth) {
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CONFIRM);
        return;
      }
    }
  }

  /**
   * Handle calendar popover click for date range filter
   */
  private handleDateRangeCalendarClick(
    viewportX: number,
    viewportY: number,
    dropdownX: number,
    dropdownY: number,
    dropdownWidth: number,
    padding: number,
    inputHeight: number,
    inputGap: number,
  ): boolean {
    if (!this.state.filterDropdown) return false;

    const { activeDateField, currentYear, currentMonth } = this.state.filterDropdown;
    if (!activeDateField || currentYear === undefined || currentMonth === undefined) return false;

    // Calendar dimensions (must match Renderer.renderDateRangeCalendarPopover)
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const calendarRows = 6;
    const calendarHeight = headerHeight + weekdayHeight + calendarRows * dayHeight + rowPadding * 2;
    const calendarWidth = 240;

    // Calculate calendar position
    const inputWidth = (dropdownWidth - padding * 3) / 2;
    const input1X = dropdownX + padding;
    const input2X = dropdownX + padding + inputWidth + inputGap;
    const input1Y = dropdownY + padding;

    const activeInputX = activeDateField === "startDate" ? input1X : input2X;
    const activeInputCenterX = activeInputX + inputWidth / 2;
    let calendarX = activeInputCenterX - calendarWidth / 2;

    // Boundary detection
    if (calendarX < dropdownX) {
      calendarX = dropdownX;
    }
    if (calendarX + calendarWidth > dropdownX + dropdownWidth) {
      calendarX = dropdownX + dropdownWidth - calendarWidth;
    }

    const calendarY = input1Y + inputHeight + inputGap;

    // Check if click is within calendar bounds
    if (
      viewportX < calendarX ||
      viewportX > calendarX + calendarWidth ||
      viewportY < calendarY ||
      viewportY > calendarY + calendarHeight
    ) {
      return false;
    }

    // Handle header area (month navigation arrows)
    if (viewportY >= calendarY && viewportY <= calendarY + headerHeight) {
      const arrowSize = 6;
      const leftArrowX = calendarX + 20;
      const rightArrowX = calendarX + calendarWidth - 20;

      // Left arrow (previous month)
      if (viewportX >= leftArrowX - arrowSize - 5 && viewportX <= leftArrowX + arrowSize + 5) {
        if (currentMonth === 0) {
          this.state.filterDropdown.currentYear = currentYear - 1;
          this.state.filterDropdown.currentMonth = 11;
        } else {
          this.state.filterDropdown.currentMonth = currentMonth - 1;
        }
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
        return true;
      }

      // Right arrow (next month)
      if (viewportX >= rightArrowX - arrowSize - 5 && viewportX <= rightArrowX + arrowSize + 5) {
        if (currentMonth === 11) {
          this.state.filterDropdown.currentYear = currentYear + 1;
          this.state.filterDropdown.currentMonth = 0;
        } else {
          this.state.filterDropdown.currentMonth = currentMonth + 1;
        }
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
        return true;
      }
    }

    // Handle date cell clicks
    const dayWidth = (calendarWidth - rowPadding * 2) / 7;
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const dayAreaY = calendarY + headerHeight + weekdayHeight;

    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekday + day - 1;
      const row = Math.floor(index / 7);
      const col = index % 7;

      const cellX = calendarX + rowPadding + col * dayWidth;
      const cellY = dayAreaY + row * dayHeight;

      if (
        viewportX >= cellX &&
        viewportX <= cellX + dayWidth &&
        viewportY >= cellY &&
        viewportY <= cellY + dayHeight
      ) {
        const selectedDate = new Date(currentYear, currentMonth, day);

        // Update the appropriate date field
        if (activeDateField === "startDate") {
          this.state.filterDropdown.startDate = selectedDate;
        } else {
          this.state.filterDropdown.endDate = selectedDate;
        }

        // Clear calendar state
        this.state.filterDropdown.activeDateField = undefined;
        this.state.filterDropdown.currentYear = undefined;
        this.state.filterDropdown.currentMonth = undefined;
        this.state.filterDropdown.hoveredDate = null;

        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CHANGE);
        return true;
      }
    }

    return true; // Click was inside calendar but not on a date
  }

  /**
   * Handle calendar popover hover for date range filter
   */
  private handleDateRangeCalendarHover(e: MouseEvent): void {
    if (!this.state.filterDropdown) return;

    const {
      x,
      y,
      width,
      activeDateField,
      currentYear,
      currentMonth,
      hoveredDate: prevHoveredDate,
    } = this.state.filterDropdown;

    // Only process if calendar is visible
    if (!activeDateField || currentYear === undefined || currentMonth === undefined) {
      return;
    }

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    // Calendar dimensions
    const padding = 8;
    const inputHeight = 32;
    const inputGap = 8;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const calendarRows = 6;
    const calendarHeight = headerHeight + weekdayHeight + calendarRows * dayHeight + rowPadding * 2;
    const calendarWidth = 240;

    // Calculate calendar position
    const inputWidth = (width - padding * 3) / 2;
    const input1X = x + padding;
    const input2X = x + padding + inputWidth + inputGap;
    const input1Y = y + padding;

    const activeInputX = activeDateField === "startDate" ? input1X : input2X;
    const activeInputCenterX = activeInputX + inputWidth / 2;
    let calendarX = activeInputCenterX - calendarWidth / 2;

    if (calendarX < x) {
      calendarX = x;
    }
    if (calendarX + calendarWidth > x + width) {
      calendarX = x + width - calendarWidth;
    }

    const calendarY = input1Y + inputHeight + inputGap;

    // Check if within calendar bounds
    if (
      viewportX < calendarX ||
      viewportX > calendarX + calendarWidth ||
      viewportY < calendarY ||
      viewportY > calendarY + calendarHeight
    ) {
      // Clear hover if outside calendar
      if (this.state.filterDropdown.hoveredDate !== null) {
        this.state.filterDropdown.hoveredDate = null;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      }
      return;
    }

    // Calculate which date cell is being hovered
    const dayWidth = (calendarWidth - rowPadding * 2) / 7;
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const dayAreaY = calendarY + headerHeight + weekdayHeight;
    let newHoveredDate: Date | null = null;

    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekday + day - 1;
      const row = Math.floor(index / 7);
      const col = index % 7;

      const cellX = calendarX + rowPadding + col * dayWidth;
      const cellY = dayAreaY + row * dayHeight;

      if (
        viewportX >= cellX &&
        viewportX <= cellX + dayWidth &&
        viewportY >= cellY &&
        viewportY <= cellY + dayHeight
      ) {
        newHoveredDate = new Date(currentYear, currentMonth, day);
        break;
      }
    }

    // Update hover state if changed
    const prevTime = prevHoveredDate ? prevHoveredDate.getTime() : null;
    const newTime = newHoveredDate ? newHoveredDate.getTime() : null;

    if (prevTime !== newTime) {
      this.state.filterDropdown.hoveredDate = newHoveredDate;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
    }
  }

  /**
   * Handle filter dropdown hover
   */
  handleFilterDropdownHover(e: MouseEvent): void {
    if (!this.state.filterDropdown) return;

    const { mode, x, y, width, options, scrollTop } = this.state.filterDropdown;

    // Handle dateRange mode with calendar popover
    if (mode === "dateRange") {
      this.handleDateRangeCalendarHover(e);
      return;
    }

    // 只在 select 模式下处理 hover
    if (mode !== "select" || !options) return;

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const searchHeight = 36;
    const listHeight = visibleCount * itemHeight;

    // Check scrollbar hover
    if (options.length > maxVisibleItems) {
      const scrollbarWidth = 6;
      const totalHeight = options.length * itemHeight;
      const thumbHeight = Math.max(20, (listHeight / totalHeight) * listHeight);
      const maxThumbY = listHeight - thumbHeight;
      const thumbY = (scrollTop / (totalHeight - listHeight)) * maxThumbY;
      const scrollbarX = x + width - scrollbarWidth - 2;

      if (
        viewportX >= scrollbarX &&
        viewportX <= scrollbarX + scrollbarWidth &&
        viewportY >= y + searchHeight + thumbY &&
        viewportY <= y + searchHeight + thumbY + thumbHeight
      ) {
        this.canvas.style.cursor = "grab";
        return;
      }
    }

    const listY = y + searchHeight;
    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= listY &&
      viewportY <= listY + listHeight
    ) {
      const relativeY = viewportY - listY + scrollTop;
      const itemIndex = Math.floor(relativeY / itemHeight);

      if (itemIndex >= 0 && itemIndex < options.length) {
        this.state.filterDropdown.hoveredIndex = itemIndex;
        this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
      }
    } else {
      this.state.filterDropdown.hoveredIndex = -1;
    }
  }

  /**
   * Update dropdown position after scroll
   */
  updateDropdownPosition(): void {
    if (!this.state.dropdown) return;

    const { cell, width, showAbove } = this.state.dropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;

    // Calculate dropdown height
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = DropdownHandler.DROPDOWN_MAX_VISIBLE;
    let optionsCount: number;

    if (this.state.dropdown.type === "tags" && this.state.dropdown.tagsConfig) {
      optionsCount = this.state.dropdown.tagsConfig.options?.length ?? 0;
    } else {
      optionsCount = this.state.dropdown.config.options?.length ?? 0;
    }
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    // Use calculator to update position
    const yResult = this.updateDropdownY(cell, showAbove ?? false, dropdownHeight, { column });
    const newX = this.updateDropdownX(cell, width, { column });

    this.state.dropdown.x = newX;
    this.state.dropdown.y = yResult.y;
    this.state.dropdown.showAbove = yResult.showAbove;

    this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
  }

  /**
   * Close all dropdowns
   */
  closeAllDropdowns(): void {
    if (this.state.dropdown) {
      this.state.dropdown = null;
      this.eventEmitter.emit(TableEvents.DROPDOWN_CLOSE);
    }
    if (this.state.filterDropdown) {
      this.state.filterDropdown = null;
      this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_CLOSE);
    }
    if (this.state.dateDropdown) {
      this.state.dateDropdown = null;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE);
    }
    if (this.state.buttonsDropdown) {
      this.state.buttonsDropdown = null;
      this.eventEmitter.emit(TableEvents.BUTTONS_DROPDOWN_CLOSE);
    }
    if (this.state.colorDropdown) {
      this.state.colorDropdown = null;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE);
    }
  }

  /**
   * Update filter dropdown position
   */
  updateFilterDropdownPosition(): void {
    if (!this.state.filterDropdown) return;

    const { columnKey } = this.state.filterDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const columnIndex = leafColumns.findIndex((col) => col.key === columnKey);
    if (columnIndex < 0) return;

    const column = leafColumns[columnIndex];
    if (!column) return;

    const cellPos = this.layoutManager.getCellPosition(-1, columnIndex);
    const headerHeight = this.layoutManager.getLayoutInfo().headerHeight;

    let dropdownX: number;
    if (column.fixed === "left") {
      dropdownX = cellPos.x;
    } else if (column.fixed === "right") {
      dropdownX = cellPos.x;
    } else {
      dropdownX = cellPos.x - this.scrollState.scrollLeft;
    }

    this.state.filterDropdown.x = dropdownX;
    this.state.filterDropdown.y = headerHeight;
    // Preserve existing width to avoid jitter; only update position
    // Width is set during initialization based on mode (200 for most, 240 for dateRange)
    // this.state.filterDropdown.width = Math.max(cellPos.width, 200);

    this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
  }

  /**
   * Update date dropdown position
   */
  updateDateDropdownPosition(): void {
    if (!this.state.dateDropdown) return;

    const { cell, showAbove } = this.state.dateDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;

    // Date dropdown has fixed dimensions
    const dropdownHeight = 40 + 28 + 6 * 28 + 16;
    const dropdownWidth = Math.max(column.width ?? 100, 280);

    // Use calculator to update position
    const yResult = this.updateDropdownY(cell, showAbove ?? false, dropdownHeight, { column });
    const newX = this.updateDropdownX(cell, dropdownWidth, { column });

    this.state.dateDropdown.x = newX;
    this.state.dateDropdown.y = yResult.y;
    this.state.dateDropdown.width = dropdownWidth;
    this.state.dateDropdown.showAbove = yResult.showAbove;

    this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
  }

  /**
   * Update color dropdown position
   */
  updateColorDropdownPosition(): void {
    if (!this.state.colorDropdown) return;

    const { cell, config } = this.state.colorDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return;

    // Calculate color dropdown dimensions
    const presetColors = config.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const rows = Math.ceil(presetColors.length / columns);
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const dropdownHeight = rows * (cellSize + gap) + padding * 2 - gap;
    const dropdownWidth = Math.max(
      column.width ?? 100,
      columns * (cellSize + gap) + padding * 2 - gap,
    );

    // Use calculator to update position
    // Note: colorDropdown doesn't have showAbove, so we use false as default and ignore the result
    const yResult = this.updateDropdownY(cell, false, dropdownHeight, { column });
    const newX = this.updateDropdownX(cell, dropdownWidth, { column });

    this.state.colorDropdown.x = newX;
    this.state.colorDropdown.y = yResult.y;
    this.state.colorDropdown.width = dropdownWidth;

    this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_OPEN);
  }

  /**
   * Update buttons dropdown position
   */
  updateButtonsDropdownPosition(): void {
    if (!this.state.buttonsDropdown) return;

    const { cell, buttonRelativeX, buttonY, buttonHeight, buttons, showAbove } =
      this.state.buttonsDropdown;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.state.buttonsDropdown = null;
      return;
    }

    // Calculate buttons dropdown height
    const itemHeight = DropdownHandler.DROPDOWN_ITEM_HEIGHT;
    const dropdownHeight = buttons.length * itemHeight;

    // Use calculator to update position with button anchor
    const yResult = this.updateDropdownY(cell, showAbove, dropdownHeight, {
      column,
      anchorType: "button",
      buttonY,
      buttonHeight,
    });
    const newX = this.updateDropdownX(cell, 120, {
      column,
      anchorType: "button",
      buttonRelativeX,
    });

    this.state.buttonsDropdown.x = newX;
    this.state.buttonsDropdown.y = yResult.y;
    this.state.buttonsDropdown.showAbove = yResult.showAbove;

    this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
  }

  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Get default preset colors for color picker
   */
  getDefaultPresetColors(): string[] {
    return [
      "#ff4d4f",
      "#ff7a45",
      "#ffa940",
      "#ffc53d",
      "#bae637",
      "#73d13d",
      "#36cfc9",
      "#40a9ff",
      "#597ef7",
      "#9254de",
      "#f759ab",
      "#ff85c0",
      "#a0d911",
      "#13c2c2",
      "#1890ff",
      "#722ed1",
      "#eb2f96",
      "#faad14",
      "#52c41a",
      "#2f54eb",
      "#ffffff",
      "#f5f5f5",
      "#d9d9d9",
      "#8c8c8c",
      "#595959",
      "#262626",
      "#000000",
      "#f50",
    ];
  }

  /**
   * Handle date dropdown click
   */
  handleDateDropdownClick(e: MouseEvent): boolean {
    if (!this.state.dateDropdown) return false;

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const { x, y, width, currentYear, currentMonth } = this.state.dateDropdown;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const arrowSize = 6;
      const leftArrowX = x + 20;
      const rightArrowX = x + width - 20;

      if (viewportY >= y && viewportY <= y + headerHeight) {
        if (viewportX >= leftArrowX - arrowSize - 5 && viewportX <= leftArrowX + arrowSize + 5) {
          if (currentMonth === 0) {
            this.state.dateDropdown.currentYear = currentYear - 1;
            this.state.dateDropdown.currentMonth = 11;
          } else {
            this.state.dateDropdown.currentMonth = currentMonth - 1;
          }
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
          return true;
        }

        if (viewportX >= rightArrowX - arrowSize - 5 && viewportX <= rightArrowX + arrowSize + 5) {
          if (currentMonth === 11) {
            this.state.dateDropdown.currentYear = currentYear + 1;
            this.state.dateDropdown.currentMonth = 0;
          } else {
            this.state.dateDropdown.currentMonth = currentMonth + 1;
          }
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
          return true;
        }
      }

      const dayWidth = (width - rowPadding * 2) / 7;
      const firstDay = new Date(currentYear, currentMonth, 1);
      const startWeekday = firstDay.getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const index = startWeekday + day - 1;
        const row = Math.floor(index / 7);
        const col = index % 7;

        const cellX = x + rowPadding + col * dayWidth;
        const cellY = y + headerHeight + weekdayHeight + row * dayHeight;

        if (
          viewportX >= cellX &&
          viewportX <= cellX + dayWidth &&
          viewportY >= cellY &&
          viewportY <= cellY + dayHeight
        ) {
          const selectedDate = new Date(currentYear, currentMonth, day);
          const formattedDate = this.formatDate(selectedDate);

          const cell = this.state.dateDropdown.cell;
          const leafColumns = this.layoutManager.getLeafColumns();
          const column = leafColumns[cell.columnIndex];
          const row = this.rows[cell.rowIndex];

          if (column && row) {
            row.data[getColumnField(column)] = formattedDate;
          }

          this.state.dateDropdown = null;
          this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_CLOSE);
          this.eventEmitter.emit(TableEvents.DATE_SELECT, this.getCellInfo(cell)!, formattedDate);
          return true;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Handle date dropdown hover
   */
  handleDateDropdownHover(e: MouseEvent): void {
    if (!this.state.dateDropdown) return;

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const {
      x,
      y,
      width,
      currentYear,
      currentMonth,
      hoveredDate: prevHoveredDate,
    } = this.state.dateDropdown;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;

    let newHoveredDate: Date | null = null;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const dayWidth = (width - rowPadding * 2) / 7;
      const firstDay = new Date(currentYear, currentMonth, 1);
      const startWeekday = firstDay.getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const index = startWeekday + day - 1;
        const row = Math.floor(index / 7);
        const col = index % 7;

        const cellX = x + rowPadding + col * dayWidth;
        const cellY = y + headerHeight + weekdayHeight + row * dayHeight;

        if (
          viewportX >= cellX &&
          viewportX <= cellX + dayWidth &&
          viewportY >= cellY &&
          viewportY <= cellY + dayHeight
        ) {
          newHoveredDate = new Date(currentYear, currentMonth, day);
          break;
        }
      }
    }

    const prevTime = prevHoveredDate ? prevHoveredDate.getTime() : null;
    const newTime = newHoveredDate ? newHoveredDate.getTime() : null;

    if (prevTime !== newTime) {
      this.state.dateDropdown.hoveredDate = newHoveredDate;
      this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_HOVER);
    }
  }

  /**
   * Handle color dropdown click
   */
  handleColorDropdownClick(e: MouseEvent): boolean {
    if (!this.state.colorDropdown) return false;

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const { cell, config, x, y, width } = this.state.colorDropdown;
    const presetColors = config.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const rows = Math.ceil(presetColors.length / columns);
    const dropdownHeight = rows * (cellSize + gap) + padding * 2 - gap;

    if (
      viewportX >= x &&
      viewportX <= x + width &&
      viewportY >= y &&
      viewportY <= y + dropdownHeight
    ) {
      const col = Math.floor((viewportX - x - padding) / (cellSize + gap));
      const row = Math.floor((viewportY - y - padding) / (cellSize + gap));

      if (col >= 0 && col < columns && row >= 0) {
        const index = row * columns + col;
        if (index >= 0 && index < presetColors.length) {
          const selectedColor = presetColors[index]!;

          // Auto update row.data
          const leafColumns = this.layoutManager.getLeafColumns();
          const column = leafColumns[cell.columnIndex];
          const rowData = this.rows[cell.rowIndex];
          if (column && rowData) {
            rowData.data[getColumnField(column)] = selectedColor;
          }

          this.state.colorDropdown = null;
          this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_CLOSE);
          this.eventEmitter.emit(TableEvents.COLOR_CHANGE, this.getCellInfo(cell)!, selectedColor);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Handle color dropdown hover
   */
  handleColorDropdownHover(e: MouseEvent): void {
    if (!this.state.colorDropdown) return;

    const viewportCoords = this.getViewportCoords(e);
    const viewportX = viewportCoords.x;
    const viewportY = viewportCoords.y;

    const { config, x, y } = this.state.colorDropdown;
    const presetColors = config.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const cellSize = 24;
    const gap = 4;
    const padding = 8;

    const col = Math.floor((viewportX - x - padding) / (cellSize + gap));
    const row = Math.floor((viewportY - y - padding) / (cellSize + gap));

    let hoveredColor: string | null = null;
    if (col >= 0 && col < columns && row >= 0) {
      const index = row * columns + col;
      if (index >= 0 && index < presetColors.length) {
        hoveredColor = presetColors[index]!;
      }
    }

    if (this.state.colorDropdown.hoveredColor !== hoveredColor) {
      this.state.colorDropdown.hoveredColor = hoveredColor;
      this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_HOVER);
    }
  }
}
