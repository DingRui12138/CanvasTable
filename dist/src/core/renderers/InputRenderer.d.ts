/**
 * InputRenderer - Renders input field cells
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class InputRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private wrapText;
    /**
     * 二分查找找到能放入 maxWidth 的最大字符数
     */
    private findLineBreakPoint;
    private truncateTextWithEllipsis;
    /**
     * 二分查找截断文本并添加省略号
     */
    private truncateWithEllipsisBinary;
}
//# sourceMappingURL=InputRenderer.d.ts.map