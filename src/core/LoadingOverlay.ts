/**
 * LoadingOverlay - HTML loading overlay element
 *
 * Features:
 * 1. Positioned inside wrapper container
 * 2. Blocks all events during loading (prevents scroll穿透)
 * 3. Configurable text and colors
 */

import type { TableTheme } from "../types";

export interface LoadingOverlayConfig {
  /** Loading text, default "Loading..." */
  text?: string;
}

export class LoadingOverlay {
  private element: HTMLDivElement;
  private spinnerElement: HTMLDivElement;
  private textElement: HTMLDivElement;
  private theme: TableTheme;
  private config: LoadingOverlayConfig;

  constructor(wrapper: HTMLElement, theme: TableTheme, config: LoadingOverlayConfig = {}) {
    this.theme = theme;
    this.config = config;

    this.element = document.createElement("div");
    this.element.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 16px;
      z-index: 9999;
    `;

    // Spinner
    this.spinnerElement = document.createElement("div");
    this.spinnerElement.style.cssText = `
      width: 32px;
      height: 32px;
      border: 3px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    // Text
    this.textElement = document.createElement("div");
    this.textElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    this.element.appendChild(this.spinnerElement);
    this.element.appendChild(this.textElement);
    wrapper.appendChild(this.element);

    // Add CSS animation
    const styleId = "canvas-table-loading-animation";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes canvas-table-spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Block all events
    this.element.addEventListener("mousedown", (e) => e.stopPropagation(), true);
    this.element.addEventListener("mouseup", (e) => e.stopPropagation(), true);
    this.element.addEventListener("click", (e) => e.stopPropagation(), true);
    this.element.addEventListener("dblclick", (e) => e.stopPropagation(), true);
    this.element.addEventListener(
      "wheel",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
      { passive: false },
    );
    this.element.addEventListener("touchstart", (e) => e.stopPropagation(), true);
    this.element.addEventListener(
      "touchmove",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
      { passive: false },
    );
    this.element.addEventListener("touchend", (e) => e.stopPropagation(), true);
    this.element.addEventListener("keydown", (e) => e.stopPropagation(), true);
    this.element.addEventListener("keyup", (e) => e.stopPropagation(), true);
    this.element.addEventListener("contextmenu", (e) => {
      e.stopPropagation();
      e.preventDefault();
    });

    this.applyTheme();
  }

  private applyTheme(): void {
    const loadingColors = this.theme.colors.loading ?? {
      background: "rgba(255, 255, 255, 0.85)",
      spinnerBorder: "#d9d9d9",
      spinnerActive: "#1890ff",
      text: "#333333",
    };

    this.element.style.background = loadingColors.background;
    this.spinnerElement.style.borderColor = loadingColors.spinnerBorder;
    this.spinnerElement.style.borderTopColor = loadingColors.spinnerActive;
    this.spinnerElement.style.animation = "canvas-table-spin 1s linear infinite";
    this.textElement.style.color = loadingColors.text;
    this.textElement.style.fontFamily = this.theme.font.family;
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
    this.applyTheme();
  }

  setConfig(config: LoadingOverlayConfig): void {
    this.config = config;
    this.updateText();
  }

  private updateText(): void {
    this.textElement.textContent = this.config.text ?? "Loading...";
  }

  show(text?: string): void {
    if (text) {
      this.textElement.textContent = text;
    } else {
      this.updateText();
    }
    this.element.style.display = "flex";
  }

  hide(): void {
    this.element.style.display = "none";
  }

  isVisible(): boolean {
    return this.element.style.display === "flex";
  }

  destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
