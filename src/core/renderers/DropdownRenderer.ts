import { ButtonsDropdownState, CanvasTableLocale, DropdownState, TableTheme } from "../../types";
import { truncateText } from "../../utils";
import { zhCN } from "../../locale";

export class DropdownRenderer {
  private ctx: CanvasRenderingContext2D;
  private theme: TableTheme;
  private locale: CanvasTableLocale;
  private measureTextWidth: (text: string) => number;

  constructor(
    ctx: CanvasRenderingContext2D,
    theme: TableTheme,
    measureTextWidth: (text: string) => number,
    locale: CanvasTableLocale = zhCN,
  ) {
    this.ctx = ctx;
    this.theme = theme;
    this.measureTextWidth = measureTextWidth;
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

  renderButtonsDropdown(dropdown: ButtonsDropdownState): void {
    const itemHeight = 32;
    const minWidth = 100;
    const padding = 8;

    let maxWidth = minWidth;
    for (const btn of dropdown.buttons) {
      const text = btn.text ?? this.locale.cell.buttonText;
      const textWidth = this.measureTextWidth(text);
      maxWidth = Math.max(maxWidth, textWidth + padding * 2 + 16);
    }

    const dropdownHeight = dropdown.buttons.length * itemHeight;

    this.ctx.save();

    this.ctx.fillStyle = this.theme.colors.background;
    this.ctx.strokeStyle = this.theme.colors.cellBorder;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(dropdown.x, dropdown.y, maxWidth, dropdownHeight, 4);
    this.ctx.fill();
    this.ctx.stroke();

    for (let i = 0; i < dropdown.buttons.length; i++) {
      const btn = dropdown.buttons[i]!;
      const itemY = dropdown.y + i * itemHeight;
      const isHovered = i === dropdown.hoveredIndex;

      if (isHovered) {
        this.ctx.fillStyle = this.theme.colors.rowHoverBackground;
        this.ctx.fillRect(dropdown.x, itemY, maxWidth, itemHeight);
      }

      let textColor: string;
      switch (btn.variant) {
        case "primary":
          textColor = this.theme.colors.button.primaryBg;
          break;
        case "danger":
          textColor = this.theme.colors.button.dangerBg;
          break;
        case "warning":
          textColor = this.theme.colors.button.warningBg;
          break;
        case "link":
          textColor = this.theme.colors.button.linkText;
          break;
        default:
          textColor = this.theme.colors.cellText;
      }

      this.ctx.fillStyle = textColor;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(
        btn.text ?? this.locale.cell.buttonText,
        dropdown.x + padding,
        itemY + itemHeight / 2,
      );
    }

    this.ctx.restore();
  }

  renderDropdown(dropdown: DropdownState): void {
    if (dropdown.type === "tags" && dropdown.tagsConfig) {
      this.renderTagsDropdown(dropdown);
      return;
    }

    const { config, x, y, width, scrollTop, hoveredIndex } = dropdown;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const visibleCount = Math.min(config.options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    this.ctx.save();
    this.drawDropdownPanel(x, y, width, dropdownHeight);

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, dropdownHeight);
    this.ctx.clip();

    const selectedValues =
      config.multiple && Array.isArray(config.value)
        ? config.value
        : config.value !== undefined
          ? [config.value]
          : [];

    for (let i = 0; i < config.options.length; i++) {
      const option = config.options[i]!;
      const itemY = y + i * itemHeight - scrollTop;

      if (itemY + itemHeight < y || itemY > y + dropdownHeight) continue;

      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      const isSelected = selectedValues.includes(option.value);

      if (isSelected && !config.multiple) {
        this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      if (config.multiple) {
        this.renderMultipleOption(option.label, option.disabled, isSelected, x, itemY, width);
      } else {
        this.renderSingleOption(option.label, option.disabled, isSelected, x, itemY, width);
      }
    }

    this.renderDropdownScrollbar(
      config.options.length,
      maxVisibleItems,
      x,
      y,
      width,
      dropdownHeight,
      scrollTop,
    );
    this.ctx.restore();
  }

  private renderTagsDropdown(dropdown: DropdownState): void {
    const { x, y, width, scrollTop, hoveredIndex, tagsConfig } = dropdown;
    if (!tagsConfig || !tagsConfig.options) return;

    const { options, selectedValues = [] } = tagsConfig;
    const itemHeight = 32;
    const maxVisibleItems = 8;
    const visibleCount = Math.min(options.length, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;

    this.ctx.save();
    this.drawDropdownPanel(x, y, width, dropdownHeight);

    this.ctx.beginPath();
    this.ctx.rect(x, y, width, dropdownHeight);
    this.ctx.clip();

    for (let i = 0; i < options.length; i++) {
      const option = options[i]!;
      const itemY = y + i * itemHeight - scrollTop;

      if (itemY + itemHeight < y || itemY > y + dropdownHeight) continue;

      const isSelected = selectedValues.includes(option.value ?? option.text);

      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.dropdown.selectedBg;
        this.ctx.fillRect(x, itemY, width, itemHeight);
      }

      const checkboxSize = 14;
      const checkboxX = x + 10;
      const checkboxY = itemY + (itemHeight - checkboxSize) / 2;

      this.ctx.fillStyle = isSelected
        ? this.theme.colors.checkbox.checkedBg
        : this.theme.colors.button.background;
      this.ctx.strokeStyle = isSelected
        ? this.theme.colors.checkbox.checkedBg
        : this.theme.colors.checkbox.border;
      this.ctx.lineWidth = 1;

      this.ctx.beginPath();
      this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
      this.ctx.fill();
      this.ctx.stroke();

      if (isSelected) {
        this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(checkboxX + 3, checkboxY + 7);
        this.ctx.lineTo(checkboxX + 6, checkboxY + 10);
        this.ctx.lineTo(checkboxX + 11, checkboxY + 4);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = option.disabled
        ? this.theme.colors.placeholderText
        : this.theme.colors.dropdown.text;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
      this.ctx.textBaseline = "middle";

      const textX = checkboxX + checkboxSize + 8;
      const textY = itemY + itemHeight / 2;
      const maxTextWidth = width - (checkboxSize + 28);
      const truncatedText = truncateText(
        option.text,
        Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
      );
      this.ctx.fillText(truncatedText, textX, textY);
    }

    this.renderDropdownScrollbar(
      options.length,
      maxVisibleItems,
      x,
      y,
      width,
      dropdownHeight,
      scrollTop,
    );
    this.ctx.restore();
  }

  private renderMultipleOption(
    label: string,
    disabled: boolean | undefined,
    isSelected: boolean,
    x: number,
    itemY: number,
    width: number,
  ): void {
    const itemHeight = 32;
    const checkboxSize = 14;
    const checkboxX = x + 10;
    const checkboxY = itemY + (itemHeight - checkboxSize) / 2;

    this.ctx.strokeStyle = isSelected
      ? this.theme.colors.checkbox.checkedBg
      : this.theme.colors.checkbox.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
    this.ctx.stroke();

    if (isSelected) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
      this.ctx.beginPath();
      this.ctx.roundRect(checkboxX, checkboxY, checkboxSize, checkboxSize, 2);
      this.ctx.fill();

      this.ctx.strokeStyle = this.theme.colors.checkbox.checkmark;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.beginPath();
      this.ctx.moveTo(checkboxX + 3, checkboxY + checkboxSize / 2);
      this.ctx.lineTo(checkboxX + checkboxSize / 2, checkboxY + checkboxSize - 4);
      this.ctx.lineTo(checkboxX + checkboxSize - 3, checkboxY + 4);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = disabled
      ? this.theme.colors.placeholderText
      : this.theme.colors.dropdown.text;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "middle";
    const textX = checkboxX + checkboxSize + 8;
    const textY = itemY + itemHeight / 2;
    const maxTextWidth = width - (checkboxSize + 28);
    const truncatedText = truncateText(
      label,
      Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
    );
    this.ctx.fillText(truncatedText, textX, textY);
  }

  private renderSingleOption(
    label: string,
    disabled: boolean | undefined,
    isSelected: boolean,
    x: number,
    itemY: number,
    width: number,
  ): void {
    const itemHeight = 32;
    if (isSelected) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
      this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`;
    } else {
      this.ctx.fillStyle = disabled
        ? this.theme.colors.placeholderText
        : this.theme.colors.dropdown.text;
      this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    }

    this.ctx.textBaseline = "middle";
    const textX = x + 12;
    const textY = itemY + itemHeight / 2;
    const maxTextWidth = width - 24;
    const truncatedText = truncateText(
      label,
      Math.floor(maxTextWidth / (this.theme.font.size * 0.6)),
    );
    this.ctx.fillText(truncatedText, textX, textY);

    if (isSelected) {
      this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
      this.ctx.beginPath();
      const checkX = x + width - 20;
      const checkY = textY;
      this.ctx.moveTo(checkX - 6, checkY);
      this.ctx.lineTo(checkX - 2, checkY + 4);
      this.ctx.lineTo(checkX + 6, checkY - 4);
      this.ctx.strokeStyle = this.theme.colors.checkbox.checkedBg;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private renderDropdownScrollbar(
    itemCount: number,
    maxVisibleItems: number,
    x: number,
    y: number,
    width: number,
    dropdownHeight: number,
    scrollTop: number,
  ): void {
    if (itemCount <= maxVisibleItems) return;

    const scrollbarWidth = 6;
    const scrollbarX = x + width - scrollbarWidth - 2;
    const totalHeight = itemCount * 32;
    const scrollbarHeight = Math.max(20, (dropdownHeight / totalHeight) * dropdownHeight);
    const scrollbarY = y + (scrollTop / totalHeight) * dropdownHeight;

    const prevAlpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
    this.ctx.fillStyle = this.theme.colors.scrollbar.thumb;
    this.ctx.beginPath();
    this.ctx.roundRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight, 3);
    this.ctx.fill();
    this.ctx.globalAlpha = prevAlpha;
  }

  private drawDropdownPanel(x: number, y: number, width: number, height: number): void {
    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 4);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowColor = "transparent";
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }
}
