/**
 * FPS Monitor - Simple FPS counter for canvas applications
 * Displays in the top-right corner of the page
 */

export class FPSMonitor {
  private element: HTMLDivElement;
  private frames = 0;
  private lastTime = performance.now();
  private fps = 0;
  private animationId: number | null = null;
  private updateInterval = 500; // Update display every 500ms

  constructor() {
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.7);
      color: #0f0;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
      border-radius: 4px;
      z-index: 10000;
      pointer-events: none;
      min-width: 60px;
      text-align: center;
    `;
    this.element.textContent = 'FPS: --';
  }

  /**
   * Start monitoring and display the FPS counter
   */
  start(): void {
    if (!this.element.parentElement) {
      document.body.appendChild(this.element);
    }

    if (this.animationId === null) {
      this.loop();
    }
  }

  /**
   * Stop monitoring and remove the FPS counter
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }

  /**
   * Main animation loop for FPS calculation
   */
  private loop = (): void => {
    this.frames++;
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= this.updateInterval) {
      this.fps = Math.round((this.frames * 1000) / delta);
      this.frames = 0;
      this.lastTime = now;
      this.updateDisplay();
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  /**
   * Update the FPS display with color coding
   */
  private updateDisplay(): void {
    this.element.textContent = `FPS: ${this.fps}`;

    // Color coding based on FPS
    if (this.fps >= 55) {
      this.element.style.color = '#0f0'; // Green - excellent
    } else if (this.fps >= 30) {
      this.element.style.color = '#ff0'; // Yellow - acceptable
    } else {
      this.element.style.color = '#f00'; // Red - poor
    }
  }

  /**
   * Get current FPS value
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Set custom update interval
   */
  setUpdateInterval(ms: number): void {
    this.updateInterval = ms;
  }
}

// Create singleton instance
let instance: FPSMonitor | null = null;

/**
 * Get the global FPS monitor instance
 */
export function getFPSMonitor(): FPSMonitor {
  if (!instance) {
    instance = new FPSMonitor();
  }
  return instance;
}