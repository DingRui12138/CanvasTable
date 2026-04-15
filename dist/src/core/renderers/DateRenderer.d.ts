/**
 * DateRenderer - Renders date picker cells
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class DateRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private formatDate;
}
//# sourceMappingURL=DateRenderer.d.ts.map