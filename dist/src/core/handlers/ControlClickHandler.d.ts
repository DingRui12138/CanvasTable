/**
 * ControlClickHandler - Handles click interactions for various control types
 *
 * Manages clicks on progress bars, rating stars, expand icons, and radio options.
 * Each method determines the appropriate action based on click position and control config.
 */
import { CellPosition, Column, Row, ProgressConfig, RatingConfig } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
export declare class ControlClickHandler extends BaseHandler {
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    /**
     * Handle progress bar click
     */
    handleProgressClick(cell: CellPosition, e: MouseEvent, config: ProgressConfig, column: Column | undefined, row: Row | undefined): boolean;
    /**
     * Handle rating click
     */
    handleRatingClick(cell: CellPosition, e: MouseEvent, config: RatingConfig, column: Column | undefined, row: Row | undefined): boolean;
    /**
     * Handle expand icon click
     */
    handleExpandIconClick: (cell: CellPosition, e: MouseEvent, row: Row) => boolean;
    /**
     * Get clicked radio option
     */
    getClickedRadioOption(cell: CellPosition, e: MouseEvent, options: {
        label: string;
        value: unknown;
        disabled?: boolean;
    }[]): {
        label: string;
        value: unknown;
        disabled?: boolean;
    } | null;
}
//# sourceMappingURL=ControlClickHandler.d.ts.map