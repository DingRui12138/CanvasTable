/**
 * ButtonAnimationHandler - Handles button and switch animations
 *
 * Manages hover animations for buttons and toggle animations for switches.
 * Uses requestAnimationFrame for smooth animations.
 */

import { ButtonHoverState, CellTypes, SwitchAnimationState } from "../../types";
import { getRenderResult } from "../../utils";
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
   * Update button hover state for the given cell / mouse position.
   * Starts the hover animation loop when a transition is needed.
   */
  updateButtonHoverState(
    cell: { rowIndex: number; columnIndex: number } | null,
    mouseX: number,
    mouseY: number,
  ): void {
    const currentHoveredCellKey =
      cell && cell.rowIndex >= 0 ? `${cell.rowIndex}-${cell.columnIndex}` : null;

    this.state.buttonHoverStates.forEach((state, key) => {
      if (key !== currentHoveredCellKey && state.progress > 0) {
        this.state.buttonHoverStates.set(key, {
          ...state,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: state.progress,
        });
      }
    });

    if (!cell || cell.rowIndex < 0) {
      if (this.state.buttonHoverStates.size > 0) {
        this.startButtonHoverAnimationLoop();
      }
      return;
    }

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (!column || !row) {
      this.startButtonHoverAnimationLoop();
      return;
    }

    const renderResult = getRenderResult(column, row, cell.rowIndex);

    if (
      renderResult.type !== CellTypes.BUTTON ||
      !renderResult.button ||
      Array.isArray(renderResult.button) ||
      !this.editorRegistry.getStrategy(column).canEdit(cell, row, column)
    ) {
      this.startButtonHoverAnimationLoop();
      return;
    }
    const buttonConfig = renderResult.button;

    const cellPos = this.layoutManager.getCellPosition(cell.rowIndex, cell.columnIndex);
    const cellViewportX = this.getCellViewportX(cellPos, column);
    const cellViewportY = this.getCellViewportY(cell.rowIndex);

    const relativeX = mouseX - cellViewportX;
    const relativeY = mouseY - cellViewportY;

    const buttonHeight =
      buttonConfig.size === "small" ? 24 : buttonConfig.size === "large" ? 40 : 32;
    const buttonY = (cellPos.height - buttonHeight) / 2;

    // 计算按钮宽度：与 Renderer 保持一致
    const text = buttonConfig.text ?? this.locale.cell.buttonText;
    // 使用默认字体大小计算
    const fontSize = 13;
    this.ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textWidth = this.ctx.measureText(text).width;
    const buttonPadding = 16;
    const cellPadding = 8;
    const buttonWidth = Math.min(
      Math.max(textWidth + buttonPadding * 2, 60),
      cellPos.width - cellPadding * 2,
    );
    // 水平居中
    const buttonX = (cellPos.width - buttonWidth) / 2;

    const isOnButton =
      relativeY >= buttonY &&
      relativeY <= buttonY + buttonHeight &&
      relativeX >= buttonX &&
      relativeX <= buttonX + buttonWidth;

    const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;

    if (isOnButton) {
      const existingState = this.state.buttonHoverStates.get(cellKey);
      if (!existingState || existingState.targetProgress !== 1) {
        const currentProgress = existingState ? existingState.progress : 0;
        this.state.buttonHoverStates.set(cellKey, {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          progress: currentProgress,
          targetProgress: 1,
          startTime: Date.now(),
          startProgress: currentProgress,
        });
        this.startButtonHoverAnimationLoop();
      }
    } else {
      const existingState = this.state.buttonHoverStates.get(cellKey);
      if (existingState && existingState.progress > 0) {
        this.state.buttonHoverStates.set(cellKey, {
          cell: { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
          progress: existingState.progress,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: existingState.progress,
        });
        this.startButtonHoverAnimationLoop();
      }
    }
  }

  /**
   * Fade out all hovered buttons
   */
  clearAllButtonHoverStates(): void {
    let hasChanges = false;
    this.state.buttonHoverStates.forEach((state, key) => {
      if (state.progress > 0 || state.targetProgress !== 0) {
        this.state.buttonHoverStates.set(key, {
          ...state,
          targetProgress: 0,
          startTime: Date.now(),
          startProgress: state.progress,
        });
        hasChanges = true;
      }
    });
    if (hasChanges) {
      this.startButtonHoverAnimationLoop();
    }
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
