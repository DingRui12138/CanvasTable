/**
 * RatingRenderer - Renders rating/star cells
 *
 * Supports click-to-modify rating with optional half-star support.
 */
import { CellType } from "../../types";
import { BaseCellRenderer, CellRendererContext, CellRenderResult } from "./CellRenderer";
export declare class RatingRenderer extends BaseCellRenderer {
    readonly type: CellType;
    render(context: CellRendererContext): CellRenderResult;
    /**
     * Draw a star at the given position
     * @param ctx Canvas context
     * @param x Star center X
     * @param y Star center Y
     * @param size Star size
     * @param fillAmount Fill amount (0-1, supports half)
     * @param fillColor Fill color
     * @param emptyColor Empty/background color
     */
    private drawStar;
    /**
     * Calculate star points coordinates
     */
    private getStarPoints;
}
//# sourceMappingURL=RatingRenderer.d.ts.map