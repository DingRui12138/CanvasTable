/**
 * WheelHandler - Handles wheel / scroll interactions
 *
 * Routes wheel events to inner scrollable overlays (image preview, image editor,
 * filter/select dropdowns) and otherwise scrolls the table. Also owns lazy-load
 * detection and the programmatic scroll entry point.
 */

import { clamp } from "../../utils";
import { TableEvents } from "../../constants/events";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { DropdownHandler } from "./DropdownHandler";
import { ImageHandler } from "./ImageHandler";
import { TooltipHandler } from "./TooltipHandler";

/** 图片预览 / 编辑器中的单张图片尺寸 */
const IMAGE_SIZE = 64;
/** 下拉菜单单项高度 */
const DROPDOWN_ITEM_HEIGHT = 32;
/** 下拉菜单最多可见项数 */
const DROPDOWN_MAX_VISIBLE = 8;

export class WheelHandler extends BaseHandler {
  private dropdownHandler: DropdownHandler;
  private imageHandler: ImageHandler;
  private tooltipHandler: TooltipHandler;

  private lazyLoadEnabled = false;
  private lazyLoadThreshold = 5;
  private isLoadingMore = false;
  private hasMoreData = true;

  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    context: HandlerContext,
    eventEmitter: EventEmitter<InteractionEvents>,
    dropdownHandler: DropdownHandler,
    imageHandler: ImageHandler,
    tooltipHandler: TooltipHandler,
  ) {
    super(context, eventEmitter);
    this.dropdownHandler = dropdownHandler;
    this.imageHandler = imageHandler;
    this.tooltipHandler = tooltipHandler;
  }

  setLazyLoadConfig(enabled: boolean, threshold: number): void {
    this.lazyLoadEnabled = enabled;
    this.lazyLoadThreshold = threshold;
    this.hasMoreData = true; // 重置状态
  }

  setLoadingMore(loading: boolean): void {
    this.isLoadingMore = loading;
  }

  setHasMore(hasMore: boolean): void {
    this.hasMoreData = hasMore;
    if (!hasMore) {
      this.isLoadingMore = true; // 没有更多数据时也停止加载状态
    }
  }

  destroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  handleWheel(e: WheelEvent): void {
    const target = e.target as HTMLElement;
    // 只有鼠标悬停在 TEXTAREA 或 INPUT 上时才不处理表格滚动
    // 这样用户可以在输入时把鼠标移到表格区域滚动查看数据
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
      // 检查输入框是否真的有滚动条且可以滚动
      const element = target as HTMLTextAreaElement | HTMLInputElement;
      const hasVerticalScrollbar = element.scrollHeight > element.clientHeight;
      const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;

      if (hasVerticalScrollbar || hasHorizontalScrollbar) {
        // 输入框有滚动条，让输入框自己处理滚动
        return;
      }
      // 输入框没有滚动条，继续处理表格滚动
    }

    if (this.state.imageTooltip) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, images, maxRows, scrollTop } = this.state.imageTooltip;
      const imgSize = IMAGE_SIZE;
      const padding = 8;
      const gap = 8;
      const imagesPerRow = 4;
      const scrollbarWidth = 4;
      const scrollbarGap = 4;
      const dropdownWidth =
        imagesPerRow * imgSize +
        (imagesPerRow - 1) * gap +
        padding * 2 +
        scrollbarGap +
        scrollbarWidth;
      const rowHeight = imgSize + gap;
      const visibleHeight = maxRows * rowHeight + padding * 2 - gap;

      const isInDropdown =
        viewportX >= x &&
        viewportX <= x + dropdownWidth &&
        viewportY >= y &&
        viewportY <= y + visibleHeight;

      if (isInDropdown) {
        const totalRows = Math.ceil(images.length / imagesPerRow);
        const maxScrollTop = Math.max(0, (totalRows - maxRows) * rowHeight);

        // 有滚动条且主要是纵向滚动（deltaY 绝对值大于 deltaX）
        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        if (maxScrollTop > 0 && isMainlyVertical) {
          // 检查是否滚动到边界
          const epsilon = 0.5;
          const atTop = scrollTop <= epsilon && e.deltaY < 0;
          const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;

          if (!atTop && !atBottom) {
            // 未到边界，dropdown 消费滚动事件
            this.state.imageTooltip.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
            return;
          }
          // 到达边界，事件传递到表格
        }
        // 没有滚动条或主要横向滚动或到达边界，事件传递到表格
      }
      // 鼠标不在 dropdown 区域内或事件传递到表格，更新 dropdown 位置
      this.imageHandler.updateImageTooltipPosition();
      // 继续执行，让表格处理滚动
    }

    if (this.state.imageEditor) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, images, maxRows, scrollTop, pendingImages } = this.state.imageEditor;
      const imgSize = IMAGE_SIZE;
      const padding = 8;
      const gap = 8;
      const imagesPerRow = 4;
      const uploadAreaHeight = 60;
      const rowHeight = imgSize + gap;
      const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
      const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
      const editorHeight = uploadAreaHeight + imagesHeight;

      const isInEditor =
        viewportX >= x &&
        viewportX <= x + editorWidth &&
        viewportY >= y &&
        viewportY <= y + editorHeight;

      if (isInEditor) {
        const totalImages = images.length + pendingImages.length;
        const totalRows = Math.ceil(totalImages / imagesPerRow);
        const maxScrollTop = Math.max(0, (totalRows - maxRows) * rowHeight);

        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        if (maxScrollTop > 0 && isMainlyVertical) {
          const epsilon = 0.5;
          const atTop = scrollTop <= epsilon && e.deltaY < 0;
          const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;

          if (!atTop && !atBottom) {
            this.state.imageEditor.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
            return;
          }
        }
      }
      // 更新编辑器位置
      this.imageHandler.updateImageEditorPosition();
    }

    if (this.state.filterDropdown) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, width, mode, options, scrollTop } = this.state.filterDropdown;

      // 只处理 select 模式的 dropdown 内部滚动
      if (mode === "select" && options) {
        const padding = 8;
        const itemHeight = DROPDOWN_ITEM_HEIGHT;
        const maxVisibleItems = DROPDOWN_MAX_VISIBLE;
        const visibleCount = Math.min(options.length, maxVisibleItems);
        const searchHeight = 32;
        const gap = 4;
        const listHeight = visibleCount * itemHeight;
        const dropdownHeight = padding + searchHeight + gap + listHeight + gap + 36;

        const isInDropdown =
          viewportX >= x &&
          viewportX <= x + width &&
          viewportY >= y &&
          viewportY <= y + dropdownHeight;

        if (isInDropdown) {
          // 检查是否主要是纵向滚动
          const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
          const maxScrollTop = Math.max(0, options.length * itemHeight - listHeight);

          if (maxScrollTop > 0 && isMainlyVertical) {
            // 检查是否滚动到边界
            const epsilon = 0.5;
            const atTop = scrollTop <= epsilon && e.deltaY < 0;
            const atBottom = scrollTop >= maxScrollTop - epsilon && e.deltaY > 0;

            if (!atTop && !atBottom) {
              // 未到边界，dropdown 消费滚动事件
              this.state.filterDropdown.scrollTop = clamp(scrollTop + e.deltaY, 0, maxScrollTop);
              e.preventDefault();
              e.stopPropagation();
              this.eventEmitter.emit(TableEvents.FILTER_DROPDOWN_OPEN);
              return;
            }
            // 到达边界，事件传递到表格
          }
          // 没有滚动条或主要横向滚动或到达边界，事件传递到表格
        }
      }

      // 其他模式（search、range、boolean、dateRange）继续执行表格滚动
      this.dropdownHandler.updateFilterDropdownPosition();
    }

    if (this.state.dropdown) {
      const rect = this.canvas.getBoundingClientRect();
      const viewportX = e.clientX - rect.left;
      const viewportY = e.clientY - rect.top;

      const { x, y, width, type, tagsConfig, config, scrollTop } = this.state.dropdown;
      const itemHeight = DROPDOWN_ITEM_HEIGHT;
      const maxVisibleItems = DROPDOWN_MAX_VISIBLE;

      let optionsLength: number;
      if (type === "tags" && tagsConfig) {
        optionsLength = tagsConfig.options?.length ?? 0;
      } else {
        optionsLength = config.options.length;
      }

      const visibleCount = Math.min(optionsLength, maxVisibleItems);
      const dropdownHeight = visibleCount * itemHeight;

      const isInDropdown =
        viewportX >= x &&
        viewportX <= x + width &&
        viewportY >= y &&
        viewportY <= y + dropdownHeight;

      if (isInDropdown) {
        // 检查是否主要是纵向滚动
        const isMainlyVertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        const maxScrollTop = Math.max(0, optionsLength * itemHeight - dropdownHeight);

        if (maxScrollTop > 0 && isMainlyVertical) {
          // 检查是否滚动到边界
          const epsilon = 0.5;
          const currentScrollTop = scrollTop ?? 0;
          const atTop = currentScrollTop <= epsilon && e.deltaY < 0;
          const atBottom = currentScrollTop >= maxScrollTop - epsilon && e.deltaY > 0;

          if (!atTop && !atBottom) {
            // 未到边界，dropdown 消费滚动事件
            this.state.dropdown.scrollTop = clamp(currentScrollTop + e.deltaY, 0, maxScrollTop);
            e.preventDefault();
            e.stopPropagation();
            this.eventEmitter.emit(TableEvents.DROPDOWN_HOVER);
            return;
          }
          // 到达边界，事件传递到表格
        }
        // 没有滚动条或主要横向滚动或到达边界，事件传递到表格
      }

      this.dropdownHandler.updateDropdownPosition();
    }

    // 更新其他 dropdown 位置
    this.updateAllDropdownPositions();

    e.preventDefault();

    const deltaX = e.deltaX;
    const deltaY = e.deltaY;

    const newScrollLeft = clamp(
      this.scrollState.scrollLeft + deltaX,
      0,
      this.scrollState.maxScrollLeft,
    );

    const newScrollTop = clamp(
      this.scrollState.scrollTop + deltaY,
      0,
      this.scrollState.maxScrollTop,
    );

    if (
      newScrollLeft !== this.scrollState.scrollLeft ||
      newScrollTop !== this.scrollState.scrollTop
    ) {
      this.scrollState.scrollLeft = newScrollLeft;
      this.scrollState.scrollTop = newScrollTop;
      this.scrollState.isScrolling = true;

      this.eventEmitter.emit(TableEvents.SCROLL, newScrollLeft, newScrollTop);

      // 懒加载检测
      this.checkLazyLoad(newScrollTop, deltaY);

      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = false;
      }, 150);
    }
  }

  handleExternalWheel(deltaX: number, deltaY: number): void {
    if (this.state.dropdown) {
      this.dropdownHandler.updateDropdownPosition();
    }

    if (this.state.tooltip) {
      this.tooltipHandler.updateTooltipPosition();
    }

    const newScrollLeft = clamp(
      this.scrollState.scrollLeft + deltaX,
      0,
      this.scrollState.maxScrollLeft,
    );

    const newScrollTop = clamp(
      this.scrollState.scrollTop + deltaY,
      0,
      this.scrollState.maxScrollTop,
    );

    if (
      newScrollLeft !== this.scrollState.scrollLeft ||
      newScrollTop !== this.scrollState.scrollTop
    ) {
      this.scrollState.scrollLeft = newScrollLeft;
      this.scrollState.scrollTop = newScrollTop;
      this.scrollState.isScrolling = true;

      this.eventEmitter.emit(TableEvents.SCROLL, newScrollLeft, newScrollTop);

      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.scrollState.isScrolling = false;
      }, 150);
    }
  }

  /** 更新所有 dropdown 位置（滚动时调用） */
  updateAllDropdownPositions(): void {
    // 只更新没有内部滚动逻辑的 dropdown
    // imageTooltip, imageEditor, filterDropdown, dropdown 已在 handleWheel 中单独处理
    if (this.state.dateDropdown) this.dropdownHandler.updateDateDropdownPosition();
    if (this.state.colorDropdown) this.dropdownHandler.updateColorDropdownPosition();
    if (this.state.buttonsDropdown) this.dropdownHandler.updateButtonsDropdownPosition();
    if (this.state.tooltip) this.tooltipHandler.updateTooltipPosition();
  }

  /**
   * 检查是否需要触发懒加载
   */
  private checkLazyLoad(newScrollTop: number, deltaY: number): void {
    if (!this.lazyLoadEnabled) return;
    if (this.isLoadingMore) return;
    if (!this.hasMoreData) return; // 没有更多数据时不再触发
    if (deltaY <= 0) return; // 只在向下滚动时触发

    const rows = this.rows;
    if (rows.length === 0) return;

    const layoutInfo = this.layoutManager.getLayoutInfo();
    const viewportHeight = layoutInfo.viewportHeight;
    const headerHeight = layoutInfo.headerHeight;

    // 动态行高模式：使用实际的 totalHeight
    const totalContentHeight = layoutInfo.totalHeight - headerHeight;
    const scrollBottom = newScrollTop + viewportHeight - headerHeight;
    const distanceToBottom = totalContentHeight - scrollBottom;

    // 使用最后一行的高度作为估算单位
    const lastRowHeight = this.layoutManager.getRowHeightByIndex(rows.length - 1);
    const rowsToBottom = Math.ceil(distanceToBottom / lastRowHeight);

    // 当距离底部小于阈值时触发加载
    if (rowsToBottom <= this.lazyLoadThreshold) {
      this.isLoadingMore = true;
      this.eventEmitter.emit(TableEvents.LOAD_MORE, {
        startIndex: rows.length,
        scrollTop: newScrollTop,
        direction: "down",
      });
    }
  }
}
