/**
 * NumberRenderer - Renders numeric cells with formatting
 *
 * Visual behavior matches InputRenderer:
 * - Draws input border
 * - Shows placeholder (in placeholderText color) when value is empty
 * - Shows formatted value (in cellText color) when value exists
 * - Placeholder source: column.placeholder ?? locale.cell.numberPlaceholder
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class NumberRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    private formatValue;
}
//# sourceMappingURL=NumberRenderer.d.ts.map