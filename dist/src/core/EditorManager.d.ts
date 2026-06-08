import { CellPosition, CellInfo, InputConfig, TableTheme, Row, CanvasTableLocale } from "../types";
import { LayoutManager } from "./LayoutManager";
import { EventEmitter } from "./EventEmitter";
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
export declare class EditorManager {
    private wrapper;
    private layoutManager;
    private eventEmitter;
    private theme;
    private locale;
    private getRows;
    private inputElement;
    private editingCell;
    private scrollLeft;
    private scrollTop;
    private onScrollCallback;
    private beforeCommitCallback;
    private cancelCallback;
    private wheelHandler;
    /** 当 shouldBlockEditingClose 路径已处理提交时，跳过后续的 handleBlur */
    private skipNextBlur;
    private placeholderStyle;
    private scrollbarStyle;
    constructor(wrapper: HTMLElement, _canvas: HTMLCanvasElement, layoutManager: LayoutManager, eventEmitter: EventEmitter<EditorEvents>, theme: TableTheme, locale: CanvasTableLocale, getRows: () => Row[]);
    setLocale(locale: CanvasTableLocale): void;
    setOnScrollCallback(callback: (deltaX: number, deltaY: number) => void): void;
    setBeforeCommitCallback(callback: (cell: CellPosition, value: unknown) => boolean | Promise<boolean>): void;
    setCancelCallback(callback: (cell: CellPosition) => void): void;
    /** 标记下一次 blur 事件应被跳过（由 shouldBlockEditingClose 路径已处理提交） */
    markSkipNextBlur(): void;
    setTheme(theme: TableTheme): void;
    setScroll(scrollLeft: number, scrollTop: number): void;
    /**
     * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
     */
    private getCellInfo;
    startEditing(cell: CellPosition, config?: InputConfig): Promise<boolean>;
    endEditing(save: boolean): Promise<boolean>;
    isEditing(): boolean;
    getEditingCell(): CellPosition | null;
    updatePosition(): void;
    private handleBlur;
    private handleKeyDown;
    private handleInputWheel;
    private applyValidationStyle;
    private setLoadingState;
    private destroyInputElement;
    destroy(): void;
}
export {};
//# sourceMappingURL=EditorManager.d.ts.map