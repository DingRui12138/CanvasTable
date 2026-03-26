import { CellPosition, CellInfo, Column, Row, InputConfig, DateConfig, TableTheme } from "../types";
import { LayoutManager } from "./LayoutManager";
import { EventEmitter } from "./EventEmitter";
import { resolveDisabled, getColumnField } from "../utils";

interface EditorEvents {
  editStart: [CellInfo, InputConfig?];
  editEnd: [CellInfo, unknown];
  dateEditEnd: [CellInfo, string];
  [key: string]: unknown[];
}

export class EditorManager {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private layoutManager: LayoutManager;
  private eventEmitter: EventEmitter<EditorEvents>;
  private theme: TableTheme;

  private inputElement: HTMLInputElement | HTMLTextAreaElement | null = null;
  private dateElement: HTMLInputElement | null = null;
  private editingCell: CellPosition | null = null;
  private columns: Column[] = [];
  private rows: Row[] = [];
  private scrollLeft: number = 0;
  private scrollTop: number = 0;
  private dpr: number = 1;
  private onScrollCallback: ((deltaX: number, deltaY: number) => void) | null = null;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private placeholderStyle: HTMLStyleElement | null = null;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    layoutManager: LayoutManager,
    eventEmitter: EventEmitter<EditorEvents>,
    theme: TableTheme,
  ) {
    this.container = container;
    this.canvas = canvas;
    this.layoutManager = layoutManager;
    this.eventEmitter = eventEmitter;
    this.theme = theme;
    this.dpr = window.devicePixelRatio || 1;
  }

  setOnScrollCallback(callback: (deltaX: number, deltaY: number) => void): void {
    this.onScrollCallback = callback;
  }

  setColumns(columns: Column[]): void {
    this.columns = columns;
  }

  setRows(rows: Row[]): void {
    this.rows = rows;
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
  }

  setScroll(scrollLeft: number, scrollTop: number): void {
    this.scrollLeft = scrollLeft;
    this.scrollTop = scrollTop;
  }

  setDpr(dpr: number): void {
    this.dpr = dpr;
  }

  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  private getCellInfo(cell: CellPosition): CellInfo | null {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];
    if (!column || !row) return null;
    return {
      rowIndex: cell.rowIndex,
      columnIndex: cell.columnIndex,
      row,
      column,
    };
  }

  startEditing(cell: CellPosition, config?: InputConfig): void {
    if (this.inputElement) {
      this.endEditing(true);
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) return;

    this.editingCell = cell;

    // Check if this is a merged cell and get the merged cell's position
    const merge = this.layoutManager.getCellMerge(cell.rowIndex, cell.columnIndex);
    let cellPos: { x: number; y: number; width: number; height: number };

    if (merge) {
      // Use the merged cell's position (covers the entire merged area)
      cellPos = this.layoutManager.getMergedCellPosition(merge.rowIndex, merge.columnIndex)!;
    } else {
      cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    }

    const canvasRect = this.canvas.getBoundingClientRect();

    let cellViewportX: number;
    if (column.fixed === "left") {
      cellViewportX = cellPos.x;
    } else if (column.fixed === "right") {
      cellViewportX = cellPos.x;
    } else {
      cellViewportX = cellPos.x - this.scrollLeft;
    }

    const cellViewportY = cellPos.y - this.scrollTop;

    const inputX = cellViewportX - 1;
    const inputY = cellViewportY - 1;
    const inputWidth = cellPos.width + 2;
    const inputHeight = cellPos.height + 2;

    const isMultiline = config?.multiline ?? false;
    const maxRows = config?.maxRows ?? 5;

    if (isMultiline) {
      this.inputElement = document.createElement("textarea");
      const cellValue = String(row.data[getColumnField(column)] ?? "");
      this.inputElement.value = config?.value !== undefined ? config.value : cellValue;
      this.inputElement.placeholder = config?.placeholder ?? "";
      this.inputElement.disabled = resolveDisabled(column.disabled, row, column);
      this.inputElement.readOnly = config?.readonly ?? false;

      const lineHeight = 14 * 1.5;
      const maxHeight = lineHeight * maxRows + 12;

      this.inputElement.style.cssText = `
        position: fixed;
        left: ${canvasRect.left + inputX}px;
        top: ${canvasRect.top + inputY}px;
        width: ${inputWidth}px;
        height: ${inputHeight}px;
        padding: 4px 8px;
        border: 2px solid ${this.theme.colors.selectionBorder};
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${this.theme.colors.input.background};
        color: ${this.theme.colors.input.text};
        outline: none;
        box-sizing: border-box;
        z-index: 1000;
        resize: none;
        line-height: 1.5;
        max-height: ${maxHeight}px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;

      const placeholderStyle = document.createElement("style");
      placeholderStyle.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `;
      document.head.appendChild(placeholderStyle);
      this.placeholderStyle = placeholderStyle;

      document.body.appendChild(this.inputElement);

      const adjustHeight = () => {
        if (!this.inputElement) return;
        const textarea = this.inputElement as HTMLTextAreaElement;
        const scrollTop = textarea.scrollTop;
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        const minHeight = inputHeight;
        const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
        textarea.style.height = `${newHeight}px`;
        textarea.scrollTop = scrollTop;
      };

      this.inputElement.addEventListener("input", adjustHeight);

      requestAnimationFrame(() => {
        adjustHeight();
      });

      this.wheelHandler = (e: WheelEvent) => {
        if (this.inputElement && e.target === this.inputElement) {
          const target = this.inputElement as HTMLTextAreaElement;
          const atTop = target.scrollTop === 0;
          const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
          const scrollingUp = e.deltaY < 0;
          const scrollingDown = e.deltaY > 0;

          if ((atTop && scrollingUp) || (atBottom && scrollingDown)) {
            e.preventDefault();
          }
          e.stopPropagation();
        }
      };
      document.addEventListener("wheel", this.wheelHandler, { capture: true, passive: false });

      adjustHeight();
    } else {
      this.inputElement = document.createElement("input");
      this.inputElement.type = config?.type ?? "text";
      const cellValue = String(row.data[getColumnField(column)] ?? "");
      this.inputElement.value = config?.value !== undefined ? config.value : cellValue;
      this.inputElement.placeholder = config?.placeholder ?? "";
      this.inputElement.disabled = resolveDisabled(column.disabled, row, column);
      this.inputElement.readOnly = config?.readonly ?? false;

      this.inputElement.style.cssText = `
        position: fixed;
        left: ${canvasRect.left + inputX}px;
        top: ${canvasRect.top + inputY}px;
        width: ${inputWidth}px;
        height: ${inputHeight}px;
        padding: 0 8px;
        border: 2px solid ${this.theme.colors.selectionBorder};
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: ${this.theme.colors.input.background};
        color: ${this.theme.colors.input.text};
        outline: none;
        box-sizing: border-box;
        z-index: 1000;
      `;

      const placeholderStyle = document.createElement("style");
      placeholderStyle.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `;
      document.head.appendChild(placeholderStyle);
      this.placeholderStyle = placeholderStyle;

      document.body.appendChild(this.inputElement);
    }

    this.inputElement.addEventListener("blur", this.handleBlur);
    this.inputElement.addEventListener("keydown", this.handleKeyDown);
    this.inputElement.addEventListener("wheel", this.handleInputWheel, { passive: false });

    requestAnimationFrame(() => {
      if (this.inputElement) {
        this.inputElement.focus();
        this.inputElement.select();
      }
    });
  }

  endEditing(save: boolean): void {
    const cell = this.editingCell;
    let value: unknown = null;

    if (this.inputElement) {
      value = this.inputElement.value;
      this.destroyInputElement();
    }

    if (save && cell) {
      this.eventEmitter.emit("editEnd", this.getCellInfo(cell)!, value);
    }

    this.editingCell = null;
  }

  isEditing(): boolean {
    return this.inputElement !== null;
  }

  isDateEditing(): boolean {
    return this.dateElement !== null;
  }

  getEditingCell(): CellPosition | null {
    return this.editingCell;
  }

  startDateEditing(cell: CellPosition, config?: DateConfig): void {
    if (this.dateElement) {
      this.endDateEditing(true);
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) return;

    this.editingCell = cell;

    // Check if this is a merged cell and get the merged cell's position
    const merge = this.layoutManager.getCellMerge(cell.rowIndex, cell.columnIndex);
    let cellPos: { x: number; y: number; width: number; height: number };

    if (merge) {
      // Use the merged cell's position (covers the entire merged area)
      cellPos = this.layoutManager.getMergedCellPosition(merge.rowIndex, merge.columnIndex)!;
    } else {
      cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    }

    const canvasRect = this.canvas.getBoundingClientRect();

    let cellViewportX: number;
    if (column.fixed === "left") {
      cellViewportX = cellPos.x;
    } else if (column.fixed === "right") {
      cellViewportX = cellPos.x;
    } else {
      cellViewportX = cellPos.x - this.scrollLeft;
    }

    const cellViewportY = cellPos.y - this.scrollTop;

    const inputX = cellViewportX;
    const inputY = cellViewportY;
    const inputWidth = cellPos.width;
    const inputHeight = cellPos.height;

    this.dateElement = document.createElement("input");
    this.dateElement.type = "date";

    let dateValue = "";
    if (config?.value) {
      const date = config.value instanceof Date ? config.value : new Date(config.value);
      if (!isNaN(date.getTime())) {
        dateValue = date.toISOString().split("T")[0] ?? "";
      }
    } else if (row.data[getColumnField(column)]) {
      const date = new Date(row.data[getColumnField(column)] as string);
      if (!isNaN(date.getTime())) {
        dateValue = date.toISOString().split("T")[0] ?? "";
      }
    }

    this.dateElement.value = dateValue;
    this.dateElement.disabled = resolveDisabled(column.disabled, row, column);

    if (config?.min) {
      const minDate = config.min instanceof Date ? config.min : new Date(config.min);
      if (!isNaN(minDate.getTime())) {
        this.dateElement.min = minDate.toISOString().split("T")[0] ?? "";
      }
    }

    if (config?.max) {
      const maxDate = config.max instanceof Date ? config.max : new Date(config.max);
      if (!isNaN(maxDate.getTime())) {
        this.dateElement.max = maxDate.toISOString().split("T")[0] ?? "";
      }
    }

    this.dateElement.style.cssText = `
      position: fixed;
      left: ${canvasRect.left + inputX}px;
      top: ${canvasRect.top + inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      padding: 0 8px;
      border: none;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      color: #333;
      outline: none;
      box-sizing: border-box;
      z-index: 1000;
    `;

    document.body.appendChild(this.dateElement);

    this.dateElement.focus();
    this.dateElement.showPicker?.();

    this.dateElement.addEventListener("blur", this.handleDateBlur);
    this.dateElement.addEventListener("change", this.handleDateChange);
    this.dateElement.addEventListener("keydown", this.handleDateKeyDown);
    this.dateElement.addEventListener("wheel", this.handleDateWheel, { passive: false });
  }

  endDateEditing(save: boolean): void {
    const cell = this.editingCell;
    let value = "";

    if (this.dateElement) {
      value = this.dateElement.value;
      this.dateElement.removeEventListener("blur", this.handleDateBlur);
      this.dateElement.removeEventListener("change", this.handleDateChange);
      this.dateElement.removeEventListener("keydown", this.handleDateKeyDown);
      this.dateElement.remove();
      this.dateElement = null;
    }

    if (save && cell && value) {
      this.eventEmitter.emit("dateEditEnd", this.getCellInfo(cell)!, value);
    }

    this.editingCell = null;
  }

  updatePosition(): void {
    if (this.dateElement && this.editingCell) {
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[this.editingCell.columnIndex];

      if (!column) return;

      const cellPos = this.layoutManager.getCellPosition(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex,
      );
      const canvasRect = this.canvas.getBoundingClientRect();

      let cellViewportX: number;
      if (column.fixed === "left") {
        cellViewportX = cellPos.x;
      } else if (column.fixed === "right") {
        cellViewportX = cellPos.x;
      } else {
        cellViewportX = cellPos.x - this.scrollLeft;
      }

      const cellViewportY = cellPos.y - this.scrollTop;

      this.dateElement.style.left = `${canvasRect.left + cellViewportX}px`;
      this.dateElement.style.top = `${canvasRect.top + cellViewportY}px`;
    }

    if (this.inputElement && this.editingCell) {
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[this.editingCell.columnIndex];

      if (!column) return;

      const cellPos = this.layoutManager.getCellPosition(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex,
      );
      const canvasRect = this.canvas.getBoundingClientRect();

      let cellViewportX: number;
      if (column.fixed === "left") {
        cellViewportX = cellPos.x;
      } else if (column.fixed === "right") {
        cellViewportX = cellPos.x;
      } else {
        cellViewportX = cellPos.x - this.scrollLeft;
      }

      const cellViewportY = cellPos.y - this.scrollTop;

      this.inputElement.style.left = `${canvasRect.left + cellViewportX}px`;
      this.inputElement.style.top = `${canvasRect.top + cellViewportY}px`;
    }
  }

  private handleDateBlur = (): void => {
    this.endDateEditing(true);
  };

  private handleDateChange = (): void => {
    this.endDateEditing(true);
  };

  private handleDateKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      this.endDateEditing(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.endDateEditing(false);
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.stopPropagation();
    }
  };

  private handleDateWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (this.onScrollCallback) {
      this.onScrollCallback(e.deltaX, e.deltaY);
    }
  };

  private destroyDateElement(): void {
    if (this.dateElement) {
      this.dateElement.removeEventListener("blur", this.handleDateBlur);
      this.dateElement.removeEventListener("change", this.handleDateChange);
      this.dateElement.removeEventListener("keydown", this.handleDateKeyDown);
      this.dateElement.removeEventListener("wheel", this.handleDateWheel);
      this.dateElement.remove();
      this.dateElement = null;
    }
  }

  private handleBlur = (): void => {
    this.endEditing(true);
  };

  private handleKeyDown = (e: Event): void => {
    const keyEvent = e as KeyboardEvent;
    const isTextarea = this.inputElement?.tagName === "TEXTAREA";

    if (keyEvent.key === "Enter" && !isTextarea) {
      keyEvent.preventDefault();
      this.endEditing(true);
    } else if (keyEvent.key === "Enter" && isTextarea && (keyEvent.ctrlKey || keyEvent.metaKey)) {
      keyEvent.preventDefault();
      this.endEditing(true);
    } else if (keyEvent.key === "Escape") {
      keyEvent.preventDefault();
      this.endEditing(false);
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keyEvent.key)) {
      e.stopPropagation();
    }
  };

  private handleInputWheel = (e: Event): void => {
    const wheelEvent = e as WheelEvent;
    wheelEvent.preventDefault();
    if (this.onScrollCallback) {
      this.onScrollCallback(wheelEvent.deltaX, wheelEvent.deltaY);
    }
  };

  private destroyInputElement(): void {
    if (this.inputElement) {
      this.inputElement.removeEventListener("blur", this.handleBlur);
      this.inputElement.removeEventListener("keydown", this.handleKeyDown);
      this.inputElement.removeEventListener("wheel", this.handleInputWheel);
      this.inputElement.remove();
      this.inputElement = null;
    }
    if (this.wheelHandler) {
      document.removeEventListener("wheel", this.wheelHandler, { capture: true });
      this.wheelHandler = null;
    }
    if (this.placeholderStyle) {
      this.placeholderStyle.remove();
      this.placeholderStyle = null;
    }
  }

  destroy(): void {
    this.destroyInputElement();
    this.destroyDateElement();
    this.editingCell = null;
  }
}
