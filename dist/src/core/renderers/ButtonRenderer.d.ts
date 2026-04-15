/**
 * ButtonRenderer - Renders button cells
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class ButtonRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private isButtonsConfig;
    private renderSingleButton;
    private renderButtons;
    private hexToRgb;
}
//# sourceMappingURL=ButtonRenderer.d.ts.map