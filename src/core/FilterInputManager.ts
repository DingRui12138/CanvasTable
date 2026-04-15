import { TableTheme, FilterDropdownState } from "../types";
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
export class FilterInputManager {
  private wrapper: HTMLElement;
  private eventEmitter: EventEmitter<FilterInputEvents>;
  private theme: TableTheme;

  // 输入元素
  private searchInput: HTMLInputElement | null = null;
  private minInput: HTMLInputElement | null = null;
  private maxInput: HTMLInputElement | null = null;

  private currentMode: string | null = null;
  private currentColumnKey: string | null = null;
  private onInputChange: ((value: string, field: string) => void) | null = null;

  // 标记是否正在从外部更新，避免触发 input 事件导致循环
  private isUpdatingFromExternal = false;

  constructor(
    wrapper: HTMLElement,
    eventEmitter: EventEmitter<FilterInputEvents>,
    theme: TableTheme,
  ) {
    this.wrapper = wrapper;
    this.eventEmitter = eventEmitter;
    this.theme = theme;
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
  }

  setOnInputChange(callback: (value: string, field: string) => void): void {
    this.onInputChange = callback;
  }

  /**
   * 更新筛选下拉框状态并创建/更新输入框
   */
  updateFilterDropdown(filterDropdown: FilterDropdownState | null): void {
    if (!filterDropdown) {
      // 关闭下拉框，移除输入框
      this.removeInputs();
      this.currentMode = null;
      this.currentColumnKey = null;
      return;
    }

    const { mode, columnKey } = filterDropdown;

    // 判断是否需要重新创建输入框（模式变化或列变化时才重新创建）
    const needRecreate = this.currentMode !== mode || this.currentColumnKey !== columnKey;

    if (needRecreate) {
      // 模式或列变化，先移除现有的输入框
      this.removeInputs();

      this.currentMode = mode;
      this.currentColumnKey = columnKey;

      switch (mode) {
        case "search":
          this.createSearchInput(filterDropdown);
          break;
        case "select":
          this.createSelectSearchInput(filterDropdown);
          break;
        case "range":
          this.createRangeInputs(filterDropdown);
          break;
        case "dateRange":
          // 日期范围使用日历选择器，不需要 HTML 输入框
          break;
      }
    } else {
      // 模式没变，只更新位置和值
      this.updatePositions(filterDropdown);
      // 强制更新输入框值，确保与 filterDropdown 状态同步
      // 这解决了二次打开同一筛选器时输入框内容没清空的问题
      this.forceUpdateValues(filterDropdown);
    }
  }

  /**
   * 更新输入框位置和值（不重新创建）
   */
  private updatePositions(filterDropdown: FilterDropdownState): void {
    const { x, y, width } = filterDropdown;
    const padding = 8;

    this.isUpdatingFromExternal = true;

    switch (filterDropdown.mode) {
      case "search": {
        const inputX = x + padding;
        const inputY = y + padding;
        const inputWidth = width - padding * 2;

        if (this.searchInput) {
          this.searchInput.style.left = `${inputX}px`;
          this.searchInput.style.top = `${inputY}px`;
          this.searchInput.style.width = `${inputWidth}px`;
          // 只在输入框没有焦点时才更新值，避免打断拼音输入
          if (document.activeElement !== this.searchInput) {
            const newValue = filterDropdown.searchValue ?? "";
            if (this.searchInput.value !== newValue) {
              this.searchInput.value = newValue;
            }
          }
        }
        break;
      }

      case "select": {
        const inputX = x + padding;
        const inputY = y + padding;
        const inputWidth = width - padding * 2;

        if (this.searchInput) {
          this.searchInput.style.left = `${inputX}px`;
          this.searchInput.style.top = `${inputY}px`;
          this.searchInput.style.width = `${inputWidth}px`;
          // 只在输入框没有焦点时才更新值，避免打断拼音输入
          if (document.activeElement !== this.searchInput) {
            const newValue = filterDropdown.searchText ?? "";
            if (this.searchInput.value !== newValue) {
              this.searchInput.value = newValue;
            }
          }
        }
        break;
      }

      case "range": {
        const gap = 8;
        const inputWidth = (width - padding * 3) / 2;
        const inputY = y + padding;

        if (this.minInput) {
          this.minInput.style.left = `${x + padding}px`;
          this.minInput.style.top = `${inputY}px`;
          this.minInput.style.width = `${inputWidth}px`;
          // 只在输入框没有焦点时才更新值
          if (document.activeElement !== this.minInput) {
            const newMinValue =
              filterDropdown.minValue !== undefined && filterDropdown.minValue !== ""
                ? String(filterDropdown.minValue)
                : "";
            if (this.minInput.value !== newMinValue) {
              this.minInput.value = newMinValue;
            }
          }
        }

        if (this.maxInput) {
          this.maxInput.style.left = `${x + padding + inputWidth + gap}px`;
          this.maxInput.style.top = `${inputY}px`;
          this.maxInput.style.width = `${inputWidth}px`;
          // 只在输入框没有焦点时才更新值
          if (document.activeElement !== this.maxInput) {
            const newMaxValue =
              filterDropdown.maxValue !== undefined && filterDropdown.maxValue !== ""
                ? String(filterDropdown.maxValue)
                : "";
            if (this.maxInput.value !== newMaxValue) {
              this.maxInput.value = newMaxValue;
            }
          }
        }
        break;
      }
    }

    this.isUpdatingFromExternal = false;
  }

  /**
   * 创建 search 模式的输入框
   */
  private createSearchInput(filterDropdown: FilterDropdownState): void {
    const { x, y, width } = filterDropdown;
    const padding = 8;
    const inputHeight = 36;

    const inputX = x + padding;
    const inputY = y + padding;
    const inputWidth = width - padding * 2;

    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.value = filterDropdown.searchValue ?? "";
    this.searchInput.placeholder = "输入关键字筛选...";

    this.searchInput.style.cssText = `
      position: absolute;
      left: ${inputX}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 12px;
      border: 1px solid ${this.theme.colors.input.border};
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.theme.colors.input.background};
      color: ${this.theme.colors.input.text};
      outline: none;
      box-sizing: border-box;
      z-index: 1001;
    `;

    this.searchInput.addEventListener("input", () => {
      if (!this.isUpdatingFromExternal && this.onInputChange && this.searchInput) {
        this.onInputChange(this.searchInput.value, "searchValue");
      }
    });

    this.searchInput.addEventListener("focus", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = this.theme.colors.input.focusBorder;
      }
    });

    this.searchInput.addEventListener("blur", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = this.theme.colors.input.border;
      }
    });

    this.wrapper.appendChild(this.searchInput);

    requestAnimationFrame(() => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    });
  }

  /**
   * 创建 select 模式的搜索输入框
   */
  private createSelectSearchInput(filterDropdown: FilterDropdownState): void {
    const { x, y, width } = filterDropdown;
    const padding = 8;
    const inputHeight = 36 - padding;

    const inputX = x + padding;
    const inputY = y + padding;
    const inputWidth = width - padding * 2;

    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.value = filterDropdown.searchText ?? "";
    this.searchInput.placeholder = "搜索...";

    this.searchInput.style.cssText = `
      position: absolute;
      left: ${inputX}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 12px;
      border: 1px solid ${this.theme.colors.input.border};
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.theme.colors.input.background};
      color: ${this.theme.colors.input.text};
      outline: none;
      box-sizing: border-box;
      z-index: 1001;
    `;

    this.searchInput.addEventListener("input", () => {
      if (!this.isUpdatingFromExternal && this.onInputChange && this.searchInput) {
        this.onInputChange(this.searchInput.value, "searchText");
      }
    });

    this.searchInput.addEventListener("focus", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = this.theme.colors.input.focusBorder;
      }
    });

    this.searchInput.addEventListener("blur", () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = this.theme.colors.input.border;
      }
    });

    this.wrapper.appendChild(this.searchInput);

    requestAnimationFrame(() => {
      if (this.searchInput) {
        this.searchInput.focus();
      }
    });
  }

  /**
   * 创建 range 模式的两个输入框
   */
  private createRangeInputs(filterDropdown: FilterDropdownState): void {
    const { x, y, width, minValue, maxValue } = filterDropdown;
    const padding = 8;
    const inputHeight = 32;
    const gap = 8;
    const inputWidth = (width - padding * 3) / 2;

    const inputY = y + padding;

    // 最小值输入框
    this.minInput = document.createElement("input");
    this.minInput.type = "number";
    this.minInput.value = minValue !== undefined && minValue !== "" ? String(minValue) : "";
    this.minInput.placeholder = "最小值";

    this.minInput.style.cssText = `
      position: absolute;
      left: ${x + padding}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 8px;
      border: 1px solid ${this.theme.colors.input.border};
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.theme.colors.input.background};
      color: ${this.theme.colors.input.text};
      outline: none;
      box-sizing: border-box;
      z-index: 1001;
    `;

    this.minInput.addEventListener("input", () => {
      if (!this.isUpdatingFromExternal && this.onInputChange && this.minInput) {
        this.onInputChange(this.minInput.value, "minValue");
      }
    });

    this.minInput.addEventListener("focus", () => {
      if (this.minInput) {
        this.minInput.style.borderColor = this.theme.colors.input.focusBorder;
      }
    });

    this.minInput.addEventListener("blur", () => {
      if (this.minInput) {
        this.minInput.style.borderColor = this.theme.colors.input.border;
      }
    });

    // 最大值输入框
    this.maxInput = document.createElement("input");
    this.maxInput.type = "number";
    this.maxInput.value = maxValue !== undefined && maxValue !== "" ? String(maxValue) : "";
    this.maxInput.placeholder = "最大值";

    this.maxInput.style.cssText = `
      position: absolute;
      left: ${x + padding + inputWidth + gap}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 8px;
      border: 1px solid ${this.theme.colors.input.border};
      border-radius: 4px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.theme.colors.input.background};
      color: ${this.theme.colors.input.text};
      outline: none;
      box-sizing: border-box;
      z-index: 1001;
    `;

    this.maxInput.addEventListener("input", () => {
      if (!this.isUpdatingFromExternal && this.onInputChange && this.maxInput) {
        this.onInputChange(this.maxInput.value, "maxValue");
      }
    });

    this.maxInput.addEventListener("focus", () => {
      if (this.maxInput) {
        this.maxInput.style.borderColor = this.theme.colors.input.focusBorder;
      }
    });

    this.maxInput.addEventListener("blur", () => {
      if (this.maxInput) {
        this.maxInput.style.borderColor = this.theme.colors.input.border;
      }
    });

    this.wrapper.appendChild(this.minInput);
    this.wrapper.appendChild(this.maxInput);

    requestAnimationFrame(() => {
      if (this.minInput) {
        this.minInput.focus();
      }
    });
  }

  /**
   * 移除所有输入框
   */
  removeInputs(): void {
    if (this.searchInput) {
      this.searchInput.remove();
      this.searchInput = null;
    }
    if (this.minInput) {
      this.minInput.remove();
      this.minInput = null;
    }
    if (this.maxInput) {
      this.maxInput.remove();
      this.maxInput = null;
    }
  }

  /**
   * 强制重置所有输入框的值
   * 用于重置按钮点击时，即使输入框有焦点也要清空
   */
  forceReset(): void {
    this.isUpdatingFromExternal = true;

    if (this.searchInput) {
      this.searchInput.value = "";
    }
    if (this.minInput) {
      this.minInput.value = "";
    }
    if (this.maxInput) {
      this.maxInput.value = "";
    }

    this.isUpdatingFromExternal = false;
  }

  /**
   * 强制更新输入框的值
   * 用于重新打开筛选器时同步状态
   */
  forceUpdateValues(filterDropdown: FilterDropdownState): void {
    this.isUpdatingFromExternal = true;

    switch (filterDropdown.mode) {
      case "search":
        if (this.searchInput) {
          const newValue = filterDropdown.searchValue ?? "";
          this.searchInput.value = newValue;
        }
        break;

      case "select":
        if (this.searchInput) {
          const newValue = filterDropdown.searchText ?? "";
          this.searchInput.value = newValue;
        }
        break;

      case "range":
        if (this.minInput) {
          const newMinValue =
            filterDropdown.minValue !== undefined && filterDropdown.minValue !== ""
              ? String(filterDropdown.minValue)
              : "";
          this.minInput.value = newMinValue;
        }
        if (this.maxInput) {
          const newMaxValue =
            filterDropdown.maxValue !== undefined && filterDropdown.maxValue !== ""
              ? String(filterDropdown.maxValue)
              : "";
          this.maxInput.value = newMaxValue;
        }
        break;
    }

    this.isUpdatingFromExternal = false;
  }

  /**
   * 更新输入框位置（滚动时调用）
   */
  updatePosition(filterDropdown: FilterDropdownState): void {
    this.updatePositions(filterDropdown);
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.removeInputs();
  }
}
