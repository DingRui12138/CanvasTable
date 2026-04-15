import { CellPosition, CellInfo, InputConfig, TableTheme, Row } from "../types";
import { LayoutManager } from "./LayoutManager";
import { EventEmitter } from "./EventEmitter";
import { resolveDisabled, getColumnField } from "../utils";

interface EditorEvents {
  editStart: [CellInfo, InputConfig?];
  editEnd: [CellInfo, unknown];
  [key: string]: unknown[];
}

/**
 * EditorManager - Manages DOM-based cell editors
 *
 * This class handles input/textarea editors for text editing.
 * Data is accessed through a getter function to ensure fresh data.
 */
export class EditorManager {
  private wrapper: HTMLElement;
  private layoutManager: LayoutManager;
  private eventEmitter: EventEmitter<EditorEvents>;
  private theme: TableTheme;
  private getRows: () => Row[];

  private inputElement: HTMLInputElement | HTMLTextAreaElement | null = null;
  private editingCell: CellPosition | null = null;
  private scrollLeft: number = 0;
  private scrollTop: number = 0;
  private onScrollCallback: ((deltaX: number, deltaY: number) => void) | null = null;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private placeholderStyle: HTMLStyleElement | null = null;
  private scrollbarStyle: HTMLStyleElement | null = null;

  constructor(
    wrapper: HTMLElement,
    _canvas: HTMLCanvasElement,
    layoutManager: LayoutManager,
    eventEmitter: EventEmitter<EditorEvents>,
    theme: TableTheme,
    getRows: () => Row[],
  ) {
    this.wrapper = wrapper;
    this.layoutManager = layoutManager;
    this.eventEmitter = eventEmitter;
    this.theme = theme;
    this.getRows = getRows;
  }

  setOnScrollCallback(callback: (deltaX: number, deltaY: number) => void): void {
    this.onScrollCallback = callback;
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
  }

  setScroll(scrollLeft: number, scrollTop: number): void {
    this.scrollLeft = scrollLeft;
    this.scrollTop = scrollTop;
  }

  /**
   * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
   */
  private getCellInfo(cell: CellPosition): CellInfo | null {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const rows = this.getRows();
    const row = rows[cell.rowIndex];
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
    const rows = this.getRows();
    const row = rows[cell.rowIndex];

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
        position: absolute;
        left: ${inputX}px;
        top: ${inputY}px;
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

      // Add scrollbar styles for textarea
      const scrollbarStyle = document.createElement("style");
      scrollbarStyle.textContent = `
        .canvas-table-editor-textarea::-webkit-scrollbar {
          width: 6px;
        }
        .canvas-table-editor-textarea::-webkit-scrollbar-track {
          background: ${this.theme.colors.scrollbar.track};
          border-radius: 3px;
        }
        .canvas-table-editor-textarea::-webkit-scrollbar-thumb {
          background: ${this.theme.colors.scrollbar.thumb};
          border-radius: 3px;
        }
        .canvas-table-editor-textarea::-webkit-scrollbar-thumb:hover {
          background: ${this.theme.colors.scrollbar.thumbHover};
        }
      `;
      document.head.appendChild(scrollbarStyle);
      this.inputElement.className = "canvas-table-editor-textarea";
      this.scrollbarStyle = scrollbarStyle;

      const placeholderStyle = document.createElement("style");
      placeholderStyle.textContent = `
        ::placeholder {
          color: ${this.theme.colors.input.placeholder};
        }
      `;
      document.head.appendChild(placeholderStyle);
      this.placeholderStyle = placeholderStyle;

      this.wrapper.appendChild(this.inputElement);

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
        position: absolute;
        left: ${inputX}px;
        top: ${inputY}px;
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

      this.wrapper.appendChild(this.inputElement);
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

  getEditingCell(): CellPosition | null {
    return this.editingCell;
  }

  updatePosition(): void {
    if (this.inputElement && this.editingCell) {
      const leafColumns = this.layoutManager.getLeafColumns();
      const column = leafColumns[this.editingCell.columnIndex];

      if (!column) return;

      const cellPos = this.layoutManager.getCellPosition(
        this.editingCell.rowIndex,
        this.editingCell.columnIndex,
      );

      let cellViewportX: number;
      if (column.fixed === "left") {
        cellViewportX = cellPos.x;
      } else if (column.fixed === "right") {
        cellViewportX = cellPos.x;
      } else {
        cellViewportX = cellPos.x - this.scrollLeft;
      }

      const cellViewportY = cellPos.y - this.scrollTop;

      this.inputElement.style.left = `${cellViewportX - 1}px`;
      this.inputElement.style.top = `${cellViewportY - 1}px`;
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
    if (this.scrollbarStyle) {
      this.scrollbarStyle.remove();
      this.scrollbarStyle = null;
    }
  }

  destroy(): void {
    this.destroyInputElement();
    this.editingCell = null;
  }
}
