import { CanvasTableLocale, FilterDropdownState, TableTheme } from "../../types";
import { truncateText } from "../../utils";
import { zhCN } from "../../locale";

export class FilterDropdownRenderer {
  private ctx: CanvasRenderingContext2D;
  private theme: TableTheme;
  private locale: CanvasTableLocale;

  constructor(ctx: CanvasRenderingContext2D, theme: TableTheme, locale: CanvasTableLocale = zhCN) {
    this.ctx = ctx;
    this.theme = theme;
    this.locale = locale;
  }

  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
  }

  setLocale(locale: CanvasTableLocale): void {
    this.locale = locale;
  }

  render(filterDropdown: FilterDropdownState): void {
    switch (filterDropdown.mode) {
      case "search":
        this.renderSearchFilterDropdown(filterDropdown);
        break;
      case "select":
        this.renderSelectFilterDropdown(filterDropdown);
        break;
      case "range":
        this.renderRangeFilterDropdown(filterDropdown);
        break;
      case "boolean":
        this.renderBooleanFilterDropdown(filterDropdown);
        break;
      case "dateRange":
        this.renderDateRangeFilterDropdown(filterDropdown);
        if (
          filterDropdown.activeDateField &&
          filterDropdown.currentYear !== undefined &&
          filterDropdown.currentMonth !== undefined
        ) {
          this.renderDateRangeCalendarPopover(filterDropdown);
        }
        break;
    }
  }

  private renderSearchFilterDropdown(filterDropdown: FilterDropdownState): void {
    const { x, y, width, searchValue } = filterDropdown;
    const padding = 8;
    const gap = 4;
    const inputHeight = 36;
    const buttonHeight = 36;
    const dropdownHeight = padding + inputHeight + gap + buttonHeight;

    this.drawPanelBackground(x, y, width, dropdownHeight);

    const inputY = y + padding;
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x + padding, inputY, width - padding * 2, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const textY = inputY + inputHeight / 2;
    const textX = x + padding + 12;

    if (searchValue) {
      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.fillText(searchValue, textX, textY);
    } else {
      this.ctx.fillStyle = this.theme.colors.placeholderText;
      this.ctx.fillText(this.locale.filter.searchPlaceholder, textX, textY);
    }

    this.renderFilterButtons(x, y + padding + inputHeight + gap, width, buttonHeight);
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }

  private renderSelectFilterDropdown(filterDropdown: FilterDropdownState): void {
    const { x, y, width, options, scrollTop, hoveredIndex, isLoading } = filterDropdown;
    if (!options && !isLoading) return;

    const padding = 8;
    const gap = 4;
    const searchHeight = 32;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const buttonHeight = 36;

    const visibleOptions = options?.length ?? 0;
    const visibleCount = Math.min(visibleOptions, maxVisibleItems);
    const listHeight = visibleCount * itemHeight;
    const dropdownHeight = padding + searchHeight + gap + listHeight + gap + buttonHeight;

    this.drawPanelBackground(x, y, width, dropdownHeight);

    const searchY = y + padding;
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x + padding, searchY, width - padding * 2, searchHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    if (filterDropdown.searchText) {
      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.fillText(filterDropdown.searchText, x + padding + 12, searchY + searchHeight / 2);
    } else {
      this.ctx.fillStyle = this.theme.colors.placeholderText;
      this.ctx.fillText(
        this.locale.filter.selectSearchPlaceholder,
        x + padding + 12,
        searchY + searchHeight / 2,
      );
    }

    const listY = y + padding + searchHeight + gap;
    if (isLoading) {
      this.ctx.fillStyle = this.theme.colors.placeholderText;
      this.ctx.fillText(this.locale.filter.loading, x + padding, listY + itemHeight / 2);
    } else if (options && options.length > 0) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(x, listY, width, listHeight);
      this.ctx.clip();

      const checkboxSize = 14;
      const checkboxGap = 8;
      const startIndex = Math.floor(scrollTop / itemHeight);
      const offsetY = -(scrollTop % itemHeight);

      for (let i = 0; i <= visibleCount + 1; i++) {
        const optionIndex = startIndex + i;
        if (optionIndex < 0 || optionIndex >= options.length) continue;

        const option = options[optionIndex];
        if (!option) continue;

        const itemY = listY + i * itemHeight + offsetY;

        if (optionIndex === hoveredIndex) {
          this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
          this.ctx.fillRect(x, itemY, width, itemHeight);
        }

        const checkboxX = x + padding;
        const checkboxY = itemY + (itemHeight - checkboxSize) / 2;

        this.ctx.strokeStyle = option.checked
          ? this.theme.colors.checkbox.checkedBg
          : this.theme.colors.checkbox.border;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
        this.ctx.stroke();

        if (option.checked) {
          this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
          this.ctx.beginPath();
          this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
          this.ctx.fill();

          this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(checkboxX + 3, checkboxY + 7);
          this.ctx.lineTo(checkboxX + 6, checkboxY + 10);
          this.ctx.lineTo(checkboxX + 11, checkboxY + 4);
          this.ctx.stroke();
        }

        this.ctx.fillStyle = this.theme.colors.dropdown.text;
        this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
        this.ctx.textBaseline = "middle";
        const textX = checkboxX + checkboxSize + checkboxGap;
        const maxTextWidth = width - padding * 2 - checkboxSize - checkboxGap;

        const colorValue = String(option.value);
        const isColorOption = /^#[0-9A-Fa-f]{6}$/.test(colorValue);

        if (isColorOption) {
          const colorBoxSize = 16;
          const colorBoxY = itemY + (itemHeight - colorBoxSize) / 2;
          const colorBoxX = textX;

          this.ctx.fillStyle = colorValue;
          this.ctx.beginPath();
          this.ctx.roundRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize, 2);
          this.ctx.fill();

          this.ctx.strokeStyle = this.theme.colors.dropdown.border;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();

          this.ctx.fillStyle = this.theme.colors.dropdown.text;
          const colorTextX = colorBoxX + colorBoxSize + 6;
          const colorMaxWidth = maxTextWidth - colorBoxSize - 6;
          const colorText = truncateText(
            colorValue.toUpperCase(),
            Math.floor(colorMaxWidth / (this.theme.font.size * 0.6)),
          );
          this.ctx.fillText(colorText, colorTextX, itemY + itemHeight / 2);
        } else {
          const text = truncateText(
            option.label,
            Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
          );
          this.ctx.fillText(text, textX, itemY + itemHeight / 2);
        }
      }

      this.ctx.restore();

      if (options.length > maxVisibleItems) {
        const scrollbarWidth = 6;
        const totalHeight = options.length * itemHeight;
        const thumbHeight = Math.max(20, (listHeight / totalHeight) * listHeight);
        const maxThumbY = listHeight - thumbHeight;
        const thumbY = (scrollTop / (totalHeight - listHeight)) * maxThumbY;

        const prevAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
        this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
        this.ctx.beginPath();
        this.ctx.roundRect(
          x + width - scrollbarWidth - 2,
          listY + thumbY + 2,
          scrollbarWidth,
          thumbHeight,
          3,
        );
        this.ctx.fill();
        this.ctx.globalAlpha = prevAlpha;
      }
    } else {
      this.ctx.fillStyle = this.theme.colors.placeholderText;
      this.ctx.fillText(this.locale.filter.noData, x + padding, listY + itemHeight / 2);
    }

    this.renderFilterButtons(
      x,
      y + padding + searchHeight + gap + listHeight + gap,
      width,
      buttonHeight,
    );

    this.drawPanelBorder(x, y, width, dropdownHeight);
  }

  private renderRangeFilterDropdown(filterDropdown: FilterDropdownState): void {
    const { x, y, width, minValue, maxValue } = filterDropdown;
    const padding = 8;
    const gap = 4;
    const inputHeight = 32;
    const inputGap = 8;
    const buttonHeight = 36;
    const dropdownHeight = padding + inputHeight + gap + buttonHeight;

    this.drawPanelBackground(x, y, width, dropdownHeight);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    const input1Y = y + padding;
    const inputWidth = (width - padding * 3) / 2;
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x + padding, input1Y, inputWidth, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = minValue
      ? this.theme.colors.dropdown.text
      : this.theme.colors.placeholderText;
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      minValue ? String(minValue) : this.locale.filter.minPlaceholder,
      x + padding + 8,
      input1Y + inputHeight / 2,
    );

    const input2X = x + padding + inputWidth + inputGap;
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = this.theme.colors.input.border;
    this.ctx.beginPath();
    this.ctx.roundRect(input2X, input1Y, inputWidth, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = maxValue
      ? this.theme.colors.dropdown.text
      : this.theme.colors.placeholderText;
    this.ctx.fillText(
      maxValue ? String(maxValue) : this.locale.filter.maxPlaceholder,
      input2X + 8,
      input1Y + inputHeight / 2,
    );

    this.renderFilterButtons(x, y + padding + inputHeight + gap, width, buttonHeight);
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }

  private renderBooleanFilterDropdown(filterDropdown: FilterDropdownState): void {
    const { x, y, width, boolValue } = filterDropdown;
    const padding = 8;
    const gap = 4;
    const itemHeight = 32;
    const buttonHeight = 36;
    const dropdownHeight = padding + itemHeight * 3 + gap + buttonHeight;

    this.drawPanelBackground(x, y, width, dropdownHeight);

    const options = [
      { value: "all", label: this.locale.filter.all },
      { value: "true", label: this.locale.filter.selected },
      { value: "false", label: this.locale.filter.unselected },
    ];

    const radioSize = 14;
    const radioGap = 8;

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
      const itemY = y + padding + i * itemHeight;
      const isSelected = boolValue === option.value;

      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      const radioX = x + padding;
      const radioY = itemY + (itemHeight - radioSize) / 2;

      this.ctx.strokeStyle = isSelected
        ? this.theme.colors.button.primaryBg
        : this.theme.colors.checkbox.border;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(radioX + radioSize / 2, radioY + radioSize / 2, radioSize / 2, 0, Math.PI * 2);
      this.ctx.stroke();

      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.button.primaryBg;
        this.ctx.beginPath();
        this.ctx.arc(radioX + radioSize / 2, radioY + radioSize / 2, radioSize / 4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(option.label, radioX + radioSize + radioGap, itemY + itemHeight / 2);
    }

    this.renderFilterButtons(x, y + padding + itemHeight * 3 + gap, width, buttonHeight);
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }

  private renderDateRangeFilterDropdown(filterDropdown: FilterDropdownState): void {
    const { x, y, width, startDate, endDate, activeDateField } = filterDropdown;
    const padding = 8;
    const gap = 4;
    const inputHeight = 32;
    const inputGap = 8;
    const buttonHeight = 36;
    const dropdownHeight = padding + inputHeight + gap + buttonHeight;

    this.drawPanelBackground(x, y, width, dropdownHeight);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    const input1Y = y + padding;
    const inputWidth = (width - padding * 3) / 2;
    const input1X = x + padding;

    const isStartActive = activeDateField === "startDate";
    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = isStartActive
      ? this.theme.colors.primary
      : this.theme.colors.input.border;
    this.ctx.lineWidth = isStartActive ? 2 : 1;
    this.ctx.beginPath();
    this.ctx.roundRect(input1X, input1Y, inputWidth, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    const startText = startDate ? this.formatDate(startDate, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = startText
      ? this.theme.colors.dropdown.text
      : this.theme.colors.placeholderText;
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      startText || this.locale.filter.startDatePlaceholder,
      input1X + 8,
      input1Y + inputHeight / 2,
    );

    const input2X = x + padding + inputWidth + inputGap;
    const isEndActive = activeDateField === "endDate";

    this.ctx.fillStyle = this.theme.colors.input.background;
    this.ctx.strokeStyle = isEndActive ? this.theme.colors.primary : this.theme.colors.input.border;
    this.ctx.lineWidth = isEndActive ? 2 : 1;
    this.ctx.beginPath();
    this.ctx.roundRect(input2X, input1Y, inputWidth, inputHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    const endText = endDate ? this.formatDate(endDate, "YYYY-MM-DD") : "";
    this.ctx.fillStyle = endText
      ? this.theme.colors.dropdown.text
      : this.theme.colors.placeholderText;
    this.ctx.fillText(
      endText || this.locale.filter.endDatePlaceholder,
      input2X + 8,
      input1Y + inputHeight / 2,
    );

    this.renderFilterButtons(x, y + padding + inputHeight + gap, width, buttonHeight);
    this.drawPanelBorder(x, y, width, dropdownHeight);
  }

  private renderDateRangeCalendarPopover(filterDropdown: FilterDropdownState): void {
    const {
      x,
      y,
      width,
      startDate,
      endDate,
      activeDateField,
      currentYear,
      currentMonth,
      hoveredDate,
    } = filterDropdown;

    if (!activeDateField || currentYear === undefined || currentMonth === undefined) return;

    const padding = 8;
    const inputHeight = 32;
    const gap = 8;
    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const calendarRows = 6;
    const calendarHeight = headerHeight + weekdayHeight + calendarRows * dayHeight + rowPadding * 2;
    const calendarWidth = 240;

    const inputWidth = (width - padding * 3) / 2;
    const input1X = x + padding;
    const input2X = x + padding + inputWidth + gap;
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

    const calendarY = input1Y + inputHeight + gap;
    const selectedDate = activeDateField === "startDate" ? startDate : endDate;

    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(calendarX, calendarY, calendarWidth, calendarHeight, 6);
    this.ctx.fill();

    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    const monthText = this.locale.calendar.months[currentMonth] ?? String(currentMonth + 1);
    const headerText = this.locale.calendar.yearMonthFormat
      .replace("{year}", String(currentYear))
      .replace("{month}", monthText);

    this.ctx.fillStyle = this.theme.colors.dropdown.text;
    this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(headerText, calendarX + calendarWidth / 2, calendarY + headerHeight / 2);

    const arrowSize = 6;
    const leftArrowX = calendarX + 20;
    const rightArrowX = calendarX + calendarWidth - 20;
    const arrowY = calendarY + headerHeight / 2;

    this.ctx.fillStyle = this.theme.colors.placeholderText;
    this.ctx.beginPath();
    this.ctx.moveTo(leftArrowX + arrowSize, arrowY - arrowSize);
    this.ctx.lineTo(leftArrowX - arrowSize, arrowY);
    this.ctx.lineTo(leftArrowX + arrowSize, arrowY + arrowSize);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(rightArrowX - arrowSize, arrowY - arrowSize);
    this.ctx.lineTo(rightArrowX + arrowSize, arrowY);
    this.ctx.lineTo(rightArrowX - arrowSize, arrowY + arrowSize);
    this.ctx.closePath();
    this.ctx.fill();

    const weekdays = this.locale.calendar.weekdays;
    const dayWidth = (calendarWidth - rowPadding * 2) / 7;

    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`;
    this.ctx.fillStyle = this.theme.colors.placeholderText;

    for (let i = 0; i < 7; i++) {
      const dayX = calendarX + rowPadding + i * dayWidth + dayWidth / 2;
      const dayY = calendarY + headerHeight + weekdayHeight / 2;
      this.ctx.fillText(weekdays[i]!, dayX, dayY);
    }

    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const index = startWeekday + day - 1;
      const row = Math.floor(index / 7);
      const col = index % 7;

      const cellX = calendarX + rowPadding + col * dayWidth;
      const cellY = calendarY + headerHeight + weekdayHeight + row * dayHeight;
      const cellCenterX = cellX + dayWidth / 2;
      const cellCenterY = cellY + dayHeight / 2;

      const currentDate = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate && currentDate.getTime() === selectedDate.getTime();
      const isHovered = hoveredDate && currentDate.getTime() === hoveredDate.getTime();
      const isToday = currentDate.getTime() === today.getTime();

      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.primary;
        this.ctx.beginPath();
        this.ctx.arc(cellCenterX, cellCenterY, dayHeight / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#ffffff";
      } else if (isHovered) {
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
        this.ctx.beginPath();
        this.ctx.arc(cellCenterX, cellCenterY, dayHeight / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      } else if (isToday) {
        this.ctx.fillStyle = this.theme.colors.primary;
        this.ctx.fillText(String(day), cellCenterX, cellCenterY);
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
        continue;
      } else {
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      }

      this.ctx.textAlign = "center";
      this.ctx.fillText(String(day), cellCenterX, cellCenterY);
    }

    this.ctx.restore();
  }

  private renderFilterButtons(x: number, y: number, width: number, buttonHeight: number): void {
    const padding = 8;
    const fontSize = 14;

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.fillRect(x, y, width, buttonHeight);
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width, y);
    this.ctx.stroke();

    this.ctx.font = `${fontSize}px ${this.theme.font.family}`;
    const resetText = this.locale.filter.reset;
    const confirmText = this.locale.filter.confirm;
    const confirmWidth = this.ctx.measureText(confirmText).width;

    const resetX = x + padding;
    const confirmX = x + width - padding - confirmWidth;
    const textY = y + buttonHeight / 2;

    this.ctx.fillStyle = this.theme.colors.placeholderText;
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(resetText, resetX, textY);

    this.ctx.fillStyle = this.theme.colors.linkColor;
    this.ctx.fillText(confirmText, confirmX, textY);
  }

  private drawPanelBackground(x: number, y: number, width: number, height: number): void {
    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 6);
    this.ctx.fill();
    this.ctx.restore();
  }

  private drawPanelBorder(x: number, y: number, width: number, height: number): void {
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 6);
    this.ctx.stroke();
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day);
  }
}
