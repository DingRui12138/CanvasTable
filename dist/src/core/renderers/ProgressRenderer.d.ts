/**
 * ProgressRenderer - Renders progress bar cells
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class ProgressRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private renderLineProgress;
    private renderCircleProgress;
    private renderDashboardProgress;
    private getProgressColor;
    private interpolateColor;
    private hexToRgb;
}
//# sourceMappingURL=ProgressRenderer.d.ts.map