/**
 * SwitchRenderer - Renders switch/toggle cells
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class SwitchRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private hexToRgb;
}
//# sourceMappingURL=SwitchRenderer.d.ts.map