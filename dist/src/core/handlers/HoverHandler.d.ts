/**
 * HoverHandler - Handles hover hit-testing for cells
 *
 * Determines whether the pointer is on an interactive element (used for the
 * pointer cursor) and tracks which image / button inside a cell is hovered.
 */
import { BaseHandler } from "./BaseHandler";
export declare class HoverHandler extends BaseHandler {
    /**
     * 判断鼠标位置是否落在可点击元素上（用于设置 pointer 光标）
     */
    isClickableElement(cell: {
        rowIndex: number;
        columnIndex: number;
    } | null, mouseX: number, mouseY: number): boolean;
    /**
     * 更新单元格内被 hover 的图片索引
     */
    updateImageHoverIndex(cell: {
        rowIndex: number;
        columnIndex: number;
    } | null, mouseX: number, mouseY: number): void;
    /**
     * 更新单元格内被 hover 的按钮索引
     */
    updateButtonsHoverIndex(cell: {
        rowIndex: number;
        columnIndex: number;
    } | null, mouseX: number, mouseY: number): void;
}
//# sourceMappingURL=HoverHandler.d.ts.map