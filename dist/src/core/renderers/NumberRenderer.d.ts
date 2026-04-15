/**
 * NumberRenderer - Renders numeric cells with formatting
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class NumberRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private getTextColor;
    private formatValue;
}
//# sourceMappingURL=NumberRenderer.d.ts.map