/**
 * ButtonAnimationHandler - Handles button and switch animations
 *
 * Manages hover animations for buttons and toggle animations for switches.
 * Uses requestAnimationFrame for smooth animations.
 */

import { ButtonHoverState, SwitchAnimationState } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { TableEvents } from "../../constants/events";

export class ButtonAnimationHandler extends BaseHandler {
  private buttonHoverAnimationRunning = false;
  private switchAnimationRunning = false;
  private isDestroyed = false;

  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    super(context, eventEmitter);
  }

  /**
   * Set destroyed state
   */
  setDestroyed(destroyed: boolean): void {
    this.isDestroyed = destroyed;
  }

  /**
   * Start button hover animation loop
   */
  startButtonHoverAnimationLoop(): void {
    if (this.buttonHoverAnimationRunning) return;
    this.buttonHoverAnimationRunning = true;
    this.runButtonHoverAnimationLoop();
  }

  /**
   * Run button hover animation loop
   */
  private runButtonHoverAnimationLoop(): void {
    if (!this.buttonHoverAnimationRunning || this.isDestroyed) return;

    const animationDuration = 150;
    const now = Date.now();
    let hasActiveAnimations = false;

    this.state.buttonHoverStates.forEach((animation, key) => {
      const elapsed = now - animation.startTime;
      const totalDistance = Math.abs(animation.targetProgress - animation.startProgress);
      if (totalDistance === 0) {
        this.state.buttonHoverStates.delete(key);
        return;
      }
      const fullDuration = animationDuration * totalDistance;
      let rawProgress = elapsed / fullDuration;
      rawProgress = Math.max(0, Math.min(1, rawProgress));

      const displayProgress =
        animation.startProgress +
        (animation.targetProgress - animation.startProgress) * rawProgress;
      animation.progress = displayProgress;

      if (rawProgress >= 1) {
        if (animation.targetProgress === 0) {
          this.state.buttonHoverStates.delete(key);
        }
      } else {
        hasActiveAnimations = true;
      }
    });

    this.eventEmitter.emit(TableEvents.BUTTON_HOVER_ANIMATION_UPDATE);

    if (hasActiveAnimations) {
      requestAnimationFrame(() => this.runButtonHoverAnimationLoop());
    } else {
      this.buttonHoverAnimationRunning = false;
    }
  }

  /**
   * Get button hover states
   */
  getButtonHoverStates(): Map<string, ButtonHoverState> {
    return this.state.buttonHoverStates;
  }

  /**
   * Start switch animation loop
   */
  startSwitchAnimationLoop(): void {
    if (this.switchAnimationRunning) return;
    this.switchAnimationRunning = true;
    this.runSwitchAnimationLoop();
  }

  /**
   * Run switch animation loop
   */
  private runSwitchAnimationLoop(): void {
    if (!this.switchAnimationRunning || this.isDestroyed) return;

    const animationDuration = 200;
    const now = Date.now();
    let hasActiveAnimations = false;

    this.state.switchAnimations.forEach((animation, key) => {
      const elapsed = now - animation.startTime;
      const totalDistance = Math.abs(animation.targetProgress - animation.startProgress);
      const fullDuration = animationDuration * totalDistance;
      let rawProgress = elapsed / fullDuration;
      rawProgress = Math.max(0, Math.min(1, rawProgress));

      const displayProgress =
        animation.startProgress +
        (animation.targetProgress - animation.startProgress) * rawProgress;
      animation.progress = displayProgress;

      if (rawProgress >= 1) {
        this.state.switchAnimations.delete(key);
      } else {
        hasActiveAnimations = true;
      }
    });

    this.eventEmitter.emit(TableEvents.SWITCH_ANIMATION_UPDATE);

    if (hasActiveAnimations) {
      requestAnimationFrame(() => this.runSwitchAnimationLoop());
    } else {
      this.switchAnimationRunning = false;
    }
  }

  /**
   * Get switch animations
   */
  getSwitchAnimations(): Map<string, SwitchAnimationState> {
    return this.state.switchAnimations;
  }

  /**
   * Clear all animations (for destroy)
   */
  clearAllAnimations(): void {
    this.state.switchAnimations.clear();
    this.state.buttonHoverStates.clear();
    this.switchAnimationRunning = false;
    this.buttonHoverAnimationRunning = false;
  }
}
