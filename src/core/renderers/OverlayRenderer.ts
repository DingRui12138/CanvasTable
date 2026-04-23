import {
  ColorPickerDropdownState,
  ContextMenuState,
  DateDropdownState,
  HeaderContextMenuState,
  ScrollbarState,
  TableTheme,
  TagItem,
  TooltipState,
  WatermarkConfig,
} from "../../types";
import { LayoutManager } from "../LayoutManager";
import { drawOverlayPanel } from "./OverlayRenderUtils";

export class OverlayRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private theme: TableTheme;
  private layoutManager: LayoutManager;
  private dpr: number;
  private watermarkConfig: WatermarkConfig | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    theme: TableTheme,
    layoutManager: LayoutManager,
    dpr: number,
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.theme = theme;
    this.layoutManager = layoutManager;
    this.dpr = dpr;
  }

  setCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
  }

  setDpr(dpr: number): void {
    this.dpr = dpr;
  }

  setWatermarkConfig(config: WatermarkConfig | null): void {
    this.watermarkConfig = config;
  }

  renderColorDropdown(dropdown: ColorPickerDropdownState): void {
    const { config, x, y, width, hoveredColor } = dropdown;
    const presetColors = config.presetColors || this.getDefaultPresetColors();

    const columns = 8;
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const rows = Math.ceil(presetColors.length / columns);
    const dropdownHeight = padding * 2 + rows * (cellSize + gap) - gap;

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.fill();

    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.stroke();

    for (let i = 0; i < presetColors.length; i++) {
      const color = presetColors[i]!;
      const col = i % columns;
      const row = Math.floor(i / columns);
      const cellX = x + padding + col * (cellSize + gap);
      const cellY = y + padding + row * (cellSize + gap);

      this.ctx.fillStyle = color;
      this.ctx.fillRect(cellX, cellY, cellSize, cellSize);

      if (color === hoveredColor) {
        this.ctx.strokeStyle = "#1890ff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(cellX - 1, cellY - 1, cellSize + 2, cellSize + 2);
      } else {
        this.ctx.strokeStyle = "#d9d9d9";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(cellX, cellY, cellSize, cellSize);
      }
    }
  }

  renderTooltip(tooltip: TooltipState): void {
    const { x, y, width: cellWidth, content } = tooltip;
    const padding = 8;
    const lineHeight = 20;
    const tagGap = 4;
    const tagPadding = 4;
    const tagRadius = 4;

    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    let tooltipHeight = padding * 2;
    const lines: string[] = [];
    const tagLines: TagItem[][] = [];

    const minTooltipWidth = 140;
    const maxTooltipWidth = 300;
    const availableWidth = cellWidth ?? maxTooltipWidth;

    let contentWidth = 0;

    if (content.type === "text") {
      const textWidth = this.ctx.measureText(content.text).width;
      contentWidth = Math.min(textWidth + padding * 2, maxTooltipWidth);

      const maxWidth = Math.max(minTooltipWidth, Math.min(contentWidth, availableWidth));

      let currentLine = "";
      for (const char of content.text.split("")) {
        const testLine = currentLine + char;
        const testWidth = this.ctx.measureText(testLine).width;

        if (testWidth > maxWidth - padding * 2) {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      tooltipHeight += lines.length * lineHeight;
    } else if (content.type === "tags") {
      const tags = content.tags;
      let currentTagLine: TagItem[] = [];
      let currentLineWidth = padding;

      for (const tag of tags) {
        const tagWidth = this.ctx.measureText(tag.text).width + tagPadding * 2;
        contentWidth = Math.max(contentWidth, currentLineWidth + tagWidth + padding);

        if (currentLineWidth + tagWidth + tagGap > availableWidth - padding) {
          if (currentTagLine.length > 0) {
            tagLines.push(currentTagLine);
            currentTagLine = [];
            currentLineWidth = padding;
          }
        }

        currentTagLine.push(tag);
        currentLineWidth += tagWidth + tagGap;
      }

      if (currentTagLine.length > 0) {
        tagLines.push(currentTagLine);
      }

      tooltipHeight +=
        tagLines.length * (this.theme.font.size + tagPadding * 2) + (tagLines.length - 1) * tagGap;
    }

    const tooltipWidth = Math.max(minTooltipWidth, Math.min(contentWidth, availableWidth));

    let tooltipX = x + (availableWidth - tooltipWidth) / 2;
    const viewportWidth = this.canvas.width / this.dpr;
    if (tooltipX < 0) {
      tooltipX = 4;
    } else if (tooltipX + tooltipWidth > viewportWidth) {
      tooltipX = viewportWidth - tooltipWidth - 4;
    }
    const tooltipY = y - tooltipHeight - this.theme.colors.tooltip.gap;

    this.ctx.save();
    this.ctx.fillStyle = this.theme.colors.tooltip.background;
    this.ctx.shadowColor = this.theme.colors.shadow.color;
    this.ctx.shadowBlur = this.theme.colors.shadow.blur;
    this.ctx.shadowOffsetX = this.theme.colors.shadow.offsetX;
    this.ctx.shadowOffsetY = this.theme.colors.shadow.offsetY;

    this.ctx.beginPath();
    this.ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.fillStyle = this.theme.colors.tooltip.text;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textBaseline = "top";

    if (content.type === "text") {
      let textY = tooltipY + padding;
      for (const line of lines) {
        this.ctx.fillText(line, tooltipX + padding, textY);
        textY += lineHeight;
      }
    } else if (content.type === "tags") {
      let tagY = tooltipY + padding;
      const tagHeight = this.theme.font.size + tagPadding * 2;

      for (const tagLine of tagLines) {
        let tagX = tooltipX + padding;

        for (const tag of tagLine) {
          const tagWidth = this.ctx.measureText(tag.text).width + tagPadding * 2;

          this.ctx.fillStyle = tag.bgColor ?? (this.theme.colors.tagColors.default || "#f0f0f0");
          this.ctx.beginPath();
          this.ctx.roundRect(tagX, tagY, tagWidth, tagHeight, tagRadius);
          this.ctx.fill();

          this.ctx.fillStyle = tag.color ?? this.theme.colors.cellText ?? "#333";
          this.ctx.textBaseline = "middle";
          const textX = tagX + (tagWidth - this.ctx.measureText(tag.text).width) / 2;
          this.ctx.fillText(tag.text, textX, tagY + tagHeight / 2);

          tagX += tagWidth + tagGap;
        }

        tagY += tagHeight + tagGap;
      }
    }
  }

  renderScrollbars(
    scrollLeft: number,
    scrollTop: number,
    maxScrollLeft: number,
    maxScrollTop: number,
    scrollbarState: ScrollbarState,
  ): void {
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;

    const scrollbarWidth = 10;
    const scrollbarMinSize = 30;

    if (maxScrollTop > 0) {
      const trackHeight = viewportHeight - headerHeight;
      const thumbHeight = Math.max(
        scrollbarMinSize,
        (viewportHeight / layoutInfo.totalHeight) * trackHeight,
      );
      const thumbY = headerHeight + (scrollTop / maxScrollTop) * (trackHeight - thumbHeight);
      const thumbX = viewportWidth - scrollbarWidth;

      let thumbColor = this.theme.colors.scrollbar.thumb;
      if (scrollbarState.verticalDragging) {
        thumbColor = this.theme.colors.scrollbar.thumbActive;
      } else if (scrollbarState.verticalHovered) {
        thumbColor = this.theme.colors.scrollbar.thumbHover;
      }

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = thumbColor;
      this.ctx.beginPath();
      this.ctx.roundRect(thumbX, thumbY, scrollbarWidth - 2, thumbHeight, 4);
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }

    if (maxScrollLeft > 0) {
      const trackWidth = viewportWidth;
      const thumbWidth = Math.max(
        scrollbarMinSize,
        (viewportWidth / layoutInfo.totalWidth) * trackWidth,
      );
      const thumbX = (scrollLeft / maxScrollLeft) * (trackWidth - thumbWidth);
      const thumbY = viewportHeight - scrollbarWidth;

      let thumbColor = this.theme.colors.scrollbar.thumb;
      if (scrollbarState.horizontalDragging) {
        thumbColor = this.theme.colors.scrollbar.thumbActive;
      } else if (scrollbarState.horizontalHovered) {
        thumbColor = this.theme.colors.scrollbar.thumbHover;
      }

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = this.theme.colors.scrollbar.opacity;
      this.ctx.fillStyle = thumbColor;
      this.ctx.beginPath();
      this.ctx.roundRect(thumbX, thumbY, thumbWidth, scrollbarWidth - 2, 4);
      this.ctx.fill();
      this.ctx.globalAlpha = prevAlpha;
    }
  }

  getScrollbarBounds(
    scrollLeft: number,
    scrollTop: number,
    maxScrollLeft: number,
    maxScrollTop: number,
  ): {
    vertical: { x: number; y: number; width: number; height: number } | null;
    horizontal: { x: number; y: number; width: number; height: number } | null;
  } {
    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;
    const layoutInfo = this.layoutManager.getLayoutInfo();
    const headerHeight = layoutInfo.headerHeight;

    const scrollbarWidth = 10;
    const scrollbarMinSize = 30;

    let vertical: { x: number; y: number; width: number; height: number } | null = null;
    let horizontal: { x: number; y: number; width: number; height: number } | null = null;

    if (maxScrollTop > 0) {
      const trackHeight = viewportHeight - headerHeight;
      const thumbHeight = Math.max(
        scrollbarMinSize,
        (viewportHeight / layoutInfo.totalHeight) * trackHeight,
      );
      const thumbY = headerHeight + (scrollTop / maxScrollTop) * (trackHeight - thumbHeight);
      const thumbX = viewportWidth - scrollbarWidth;

      vertical = {
        x: thumbX,
        y: thumbY,
        width: scrollbarWidth - 2,
        height: thumbHeight,
      };
    }

    if (maxScrollLeft > 0) {
      const trackWidth = viewportWidth;
      const thumbWidth = Math.max(
        scrollbarMinSize,
        (viewportWidth / layoutInfo.totalWidth) * trackWidth,
      );
      const thumbX = (scrollLeft / maxScrollLeft) * (trackWidth - thumbWidth);
      const thumbY = viewportHeight - scrollbarWidth;

      horizontal = {
        x: thumbX,
        y: thumbY,
        width: thumbWidth,
        height: scrollbarWidth - 2,
      };
    }

    return { vertical, horizontal };
  }

  renderWatermark(): void {
    if (!this.watermarkConfig) return;

    const enabled = this.watermarkConfig.enabled ?? true;
    if (!enabled) return;

    const content = this.watermarkConfig.content ?? "Watermark";
    if (!content) return;

    const viewportWidth = this.canvas.width / this.dpr;
    const viewportHeight = this.canvas.height / this.dpr;

    const themeWatermark = this.theme.colors.watermark;
    const fontSize = this.watermarkConfig.fontSize ?? themeWatermark.fontSize;
    const fontFamily =
      this.watermarkConfig.fontFamily ?? themeWatermark.fontFamily ?? this.theme.font.family;
    const color = this.watermarkConfig.color ?? themeWatermark.color;
    const rotation = this.watermarkConfig.rotation ?? -22;
    const gapX = this.watermarkConfig.gapX ?? 100;
    const gapY = this.watermarkConfig.gapY ?? 100;
    const opacity = this.watermarkConfig.opacity ?? themeWatermark.opacity;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const radians = (rotation * Math.PI) / 180;
    const textWidth = this.ctx.measureText(content).width;
    const cellWidth = textWidth + gapX;
    const cellHeight = fontSize + gapY;

    const cols = Math.ceil(viewportWidth / cellWidth) + 2;
    const rows = Math.ceil(viewportHeight / cellHeight) + 2;

    for (let row = -1; row <= rows; row++) {
      for (let col = -1; col <= cols; col++) {
        const x = col * cellWidth + (row % 2 === 0 ? 0 : cellWidth / 2);
        const y = row * cellHeight;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(radians);
        this.ctx.fillText(content, 0, 0);
        this.ctx.restore();
      }
    }

    this.ctx.restore();
  }

  renderContextMenu(contextMenu: ContextMenuState): void {
    const { x, y, hoveredIndex } = contextMenu;
    const menuWidth = 140;
    const itemHeight = 32;
    const menuItems = [{ text: "上方添加行" }, { text: "下方添加行" }, { text: "删除行" }];
    const menuHeight = menuItems.length * itemHeight;

    this.ctx.save();
    this.drawMenuPanel(x, y, menuWidth, menuHeight);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i]!;
      const itemY = y + i * itemHeight;

      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, menuWidth, itemHeight);
      }

      this.ctx.fillStyle = i === 2 ? "#f56c6c" : this.theme.colors.dropdown.text;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(item.text, x + 12, itemY + itemHeight / 2);
    }

    this.ctx.restore();
  }

  renderHeaderContextMenu(headerContextMenu: HeaderContextMenuState): void {
    const { x, y, hoveredIndex } = headerContextMenu;
    const menuWidth = 120;
    const itemHeight = 32;
    const menuItems = [{ text: "隐藏此列" }];
    const menuHeight = menuItems.length * itemHeight;

    this.ctx.save();
    this.drawMenuPanel(x, y, menuWidth, menuHeight);
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;

    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i]!;
      const itemY = y + i * itemHeight;

      if (i === hoveredIndex) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.fillRect(x, itemY, menuWidth, itemHeight);
      }

      this.ctx.fillStyle = this.theme.colors.dropdown.text;
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(item.text, x + 12, itemY + itemHeight / 2);
    }

    this.ctx.restore();
  }

  renderDateDropdown(dateDropdown: DateDropdownState): void {
    const { x, y, width, currentYear, currentMonth, selectedDate, hoveredDate } = dateDropdown;

    const headerHeight = 40;
    const weekdayHeight = 28;
    const dayHeight = 28;
    const rowPadding = 8;
    const rows = 6;
    const dropdownHeight = headerHeight + weekdayHeight + rows * dayHeight + rowPadding * 2;

    this.ctx.save();

    drawOverlayPanel(this.ctx, this.theme, {
      x,
      y,
      width,
      height: dropdownHeight,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: true,
    });

    this.ctx.fillStyle = this.theme.colors.dropdown.background;
    this.ctx.fillRect(x, y, width, dropdownHeight);

    const monthNames = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ];
    const headerText = `${currentYear}年 ${monthNames[currentMonth]}`;

    this.ctx.fillStyle = this.theme.colors.dropdown.text;
    this.ctx.font = `bold ${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(headerText, x + width / 2, y + headerHeight / 2);

    const arrowSize = 6;
    const leftArrowX = x + 20;
    const rightArrowX = x + width - 20;
    const arrowY = y + headerHeight / 2;

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

    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const dayWidth = (width - rowPadding * 2) / 7;

    this.ctx.font = `${this.theme.font.size - 1}px ${this.theme.font.family}`;
    this.ctx.fillStyle = this.theme.colors.placeholderText;

    for (let i = 0; i < 7; i++) {
      const dayX = x + rowPadding + i * dayWidth + dayWidth / 2;
      const dayY = y + headerHeight + weekdayHeight / 2;
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

      const cellX = x + rowPadding + col * dayWidth;
      const cellY = y + headerHeight + weekdayHeight + row * dayHeight;

      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.getTime() === today.getTime();
      const isSelected =
        selectedDate &&
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate();
      const isHovered =
        hoveredDate &&
        date.getFullYear() === hoveredDate.getFullYear() &&
        date.getMonth() === hoveredDate.getMonth() &&
        date.getDate() === hoveredDate.getDate();

      if (isSelected) {
        this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
        this.ctx.fillStyle = "#ffffff";
      } else if (isHovered) {
        this.ctx.fillStyle = this.theme.colors.dropdown.hoverBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      } else if (isToday) {
        this.ctx.fillStyle = this.theme.colors.checkbox.checkedBg;
        this.ctx.beginPath();
        this.ctx.arc(
          cellX + dayWidth / 2,
          cellY + dayHeight / 2,
          Math.min(dayWidth, dayHeight) / 2 - 2,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
        this.ctx.fillStyle = "#ffffff";
      } else {
        this.ctx.fillStyle = this.theme.colors.dropdown.text;
      }

      this.ctx.fillText(String(day), cellX + dayWidth / 2, cellY + dayHeight / 2);
    }

    this.ctx.strokeStyle = this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, dropdownHeight, 6);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawMenuPanel(x: number, y: number, width: number, height: number): void {
    drawOverlayPanel(this.ctx, this.theme, {
      x,
      y,
      width,
      height,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: true,
    });
  }

  private getDefaultPresetColors(): string[] {
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
}
