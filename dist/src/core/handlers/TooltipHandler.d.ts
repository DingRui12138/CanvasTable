/**
 * TooltipHandler - Handles tooltip display logic
 *
 * Manages tooltips for truncated content: tags, select dropdown text,
 * image preview dropdowns, and cell text. Shows tooltip when content
 * is truncated or images need preview.
 */
import { TooltipState, ImageTooltipState } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
export declare class TooltipHandler extends BaseHandler {
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    /**
     * Get image size constant
     */
    static get IMAGE_SIZE(): number;
    /**
     * Check and show tooltip for cell content
     */
    checkTooltip(cell: {
        rowIndex: number;
        columnIndex: number;
    } | null): void;
    /**
     * Handle tags tooltip
     */
    private handleTagsTooltip;
    /**
     * Handle select tooltip
     */
    private handleSelectTooltip;
    /**
     * Handle image tooltip (preview dropdown)
     */
    private handleImageTooltip;
    /**
     * Handle text tooltip
     */
    private handleTextTooltip;
    private getFontSize;
    /**
     * Update tooltip position on scroll
     */
    updateTooltipPosition(): void;
    /**
     * Clear tooltip
     */
    clearTooltip(): void;
    /**
     * Get tooltip state
     */
    getTooltip(): TooltipState | null;
    /**
     * Get image tooltip state
     */
    getImageTooltip(): ImageTooltipState | null;
}
//# sourceMappingURL=TooltipHandler.d.ts.map