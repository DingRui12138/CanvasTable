import { CellPosition, CellInfo, Column, Row, InputConfig, DateConfig, TableTheme } from '../types';
import { LayoutManager } from './LayoutManager';
import { EventEmitter } from './EventEmitter';
interface EditorEvents {
    editStart: [CellInfo, InputConfig?];
    editEnd: [CellInfo, unknown];
    dateEditEnd: [CellInfo, string];
    [key: string]: unknown[];
}
export declare class EditorManager {
    private container;
    private canvas;
    private layoutManager;
    private eventEmitter;
    private theme;
    private inputElement;
    private dateElement;
    private editingCell;
    private columns;
    private rows;
    private scrollLeft;
    private scrollTop;
    private dpr;
    private onScrollCallback;
    private wheelHandler;
    private placeholderStyle;
    constructor(container: HTMLElement, canvas: HTMLCanvasElement, layoutManager: LayoutManager, eventEmitter: EventEmitter<EditorEvents>, theme: TableTheme);
    setOnScrollCallback(callback: (deltaX: number, deltaY: number) => void): void;
    setColumns(columns: Column[]): void;
    setRows(rows: Row[]): void;
    setTheme(theme: TableTheme): void;
    setScroll(scrollLeft: number, scrollTop: number): void;
    setDpr(dpr: number): void;
    /**
     * 将 CellPosition 转换为 CellInfo，包含 row 和 column 数据
     */
    private getCellInfo;
    startEditing(cell: CellPosition, config?: InputConfig): void;
    endEditing(save: boolean): void;
    isEditing(): boolean;
    isDateEditing(): boolean;
    getEditingCell(): CellPosition | null;
    startDateEditing(cell: CellPosition, config?: DateConfig): void;
    endDateEditing(save: boolean): void;
    updatePosition(): void;
    private handleDateBlur;
    private handleDateChange;
    private handleDateKeyDown;
    private handleDateWheel;
    private destroyDateElement;
    private handleBlur;
    private handleKeyDown;
    private handleInputWheel;
    private destroyInputElement;
    destroy(): void;
}
export {};
//# sourceMappingURL=EditorManager.d.ts.map