/**
 * ControlClickHandler - Handles click interactions for various control types
 *
 * Manages clicks on progress bars, rating stars, expand icons, and radio options.
 * Each method determines the appropriate action based on click position and control config.
 */
import { CellPosition, Column, ProgressConfig, RatingConfig, Row } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { EditingHandler } from "./EditingHandler";
import { ButtonAnimationHandler } from "./ButtonAnimationHandler";
export declare class ControlClickHandler extends BaseHandler {
    private editingHandler;
    private buttonAnimationHandler;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>, editingHandler: EditingHandler, buttonAnimationHandler: ButtonAnimationHandler);
    /**
     * Handle click on any interactive cell control (checkbox/radio/button/switch/link/…).
     * Returns true when the click has been consumed by a control.
     */
    handleControlClick(cell: CellPosition, e: MouseEvent): boolean;
    /**
     * Handle progress bar drag move (display value only, data is committed on mouseup)
     */
    handleProgressDragMove(e: MouseEvent): void;
    /** 记录最近一次点击，用于区分双击（避免链接跳转） */
    private lastClickTime;
    private lastClickCell;
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