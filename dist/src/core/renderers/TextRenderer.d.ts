/**
 * TextRenderer - Renders text cells (default renderer)
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class TextRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private getTextColor;
    private formatValue;
}
//# sourceMappingURL=TextRenderer.d.ts.map