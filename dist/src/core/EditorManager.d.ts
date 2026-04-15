import { CellPosition, CellInfo, InputConfig, TableTheme, Row } from "../types";
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
    private getRows;
    private inputElement;
    private editingCell;
    private scrollLeft;
    private scrollTop;
    private onScrollCallback;
    private wheelHandler;
    private placeholderStyle;
    private scrollbarStyle;
    constructor(wrapper: HTMLElement, _canvas: HTMLCanvasElement, layoutManager: LayoutManager, eventEmitter: EventEmitter<EditorEvents>, theme: TableTheme, getRows: () => Row[]);
    setOnScrollCallback(callback: (deltaX: number, deltaY: number) => void): void;
    setTheme(theme: TableTheme): void;
    setScroll(scrollLeft: number, scrollTop: number): void;
    /**
     * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
     */
    private getCellInfo;
    startEditing(cell: CellPosition, config?: InputConfig): void;
    endEditing(save: boolean): void;
    isEditing(): boolean;
    getEditingCell(): CellPosition | null;
    updatePosition(): void;
    private handleBlur;
    private handleKeyDown;
    private handleInputWheel;
    private destroyInputElement;
    destroy(): void;
}
export {};
//# sourceMappingURL=EditorManager.d.ts.map