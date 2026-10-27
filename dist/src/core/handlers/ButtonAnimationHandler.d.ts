/**
 * ButtonAnimationHandler - Handles button and switch animations
 *
 * Manages hover animations for buttons and toggle animations for switches.
 * Uses requestAnimationFrame for smooth animations.
 */
import { ButtonHoverState, SwitchAnimationState } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
export declare class ButtonAnimationHandler extends BaseHandler {
    private buttonHoverAnimationRunning;
    private switchAnimationRunning;
    private isDestroyed;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    /**
     * Update button hover state for the given cell / mouse position.
     * Starts the hover animation loop when a transition is needed.
     */
    updateButtonHoverState(cell: {
        rowIndex: number;
        columnIndex: number;
    } | null, mouseX: number, mouseY: number): void;
    /**
     * Fade out all hovered buttons
     */
    clearAllButtonHoverStates(): void;
    /**
     * Set destroyed state
     */
    setDestroyed(destroyed: boolean): void;
    /**
     * Start button hover animation loop
     */
    startButtonHoverAnimationLoop(): void;
    /**
     * Run button hover animation loop
     */
    private runButtonHoverAnimationLoop;
    /**
     * Get button hover states
     */
    getButtonHoverStates(): Map<string, ButtonHoverState>;
    /**
     * Start switch animation loop
     */
    startSwitchAnimationLoop(): void;
    /**
     * Run switch animation loop
     */
    private runSwitchAnimationLoop;
    /**
     * Get switch animations
     */
    getSwitchAnimations(): Map<string, SwitchAnimationState>;
    /**
     * Clear all animations (for destroy)
     */
    clearAllAnimations(): void;
}
//# sourceMappingURL=ButtonAnimationHandler.d.ts.map