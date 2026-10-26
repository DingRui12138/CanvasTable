/**
 * ColorRenderer - Renders color picker cells
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class ColorRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private getContrastColor;
    private hexToRgb;
}
//# sourceMappingURL=ColorRenderer.d.ts.map