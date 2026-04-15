/**
 * Performance Monitor for Cell Renderers
 *
 * Provides configurable performance tracking for renderer methods.
 * Can be enabled/disabled at runtime.
 */

export interface PerformanceStats {
  /** Total time spent in this renderer (ms) */
  totalTime: number;
  /** Number of calls */
  callCount: number;
  /** Average time per call (ms) */
  avgTime: number;
  /** Maximum time for a single call (ms) */
  maxTime: number;
  /** Minimum time for a single call (ms) */
  minTime: number;
}

export interface FrameStats {
  /** Frame start timestamp */
  frameStart: number;
  /** Time spent in each renderer during this frame */
  rendererTimes: Map<string, number[]>;
  /** Total frame time */
  totalFrameTime: number;
  /** Number of cells rendered */
  cellCount: number;
}

/**
 * Performance monitor for tracking renderer performance
 */
export class RendererPerformanceMonitor {
  private enabled: boolean = false;
  private stats: Map<string, PerformanceStats> = new Map();
  private currentFrame: FrameStats | null = null;
  private frameHistory: FrameStats[] = [];
  private maxFrameHistory: number = 60; // Keep last 60 frames

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start a new frame
   */
  startFrame(): void {
    if (!this.enabled) return;
    this.currentFrame = {
      frameStart: performance.now(),
      rendererTimes: new Map(),
      totalFrameTime: 0,
      cellCount: 0,
    };
  }

  /**
   * End the current frame and record stats
   */
  endFrame(): void {
    if (!this.enabled || !this.currentFrame) return;

    this.currentFrame.totalFrameTime = performance.now() - this.currentFrame.frameStart;

    // Add to history
    this.frameHistory.push(this.currentFrame);
    if (this.frameHistory.length > this.maxFrameHistory) {
      this.frameHistory.shift();
    }

    this.currentFrame = null;
  }

  /**
   * Record a render call
   * @param rendererType The type of renderer
   * @param duration The duration of the render call in ms
   */
  recordRender(rendererType: string, duration: number): void {
    if (!this.enabled) return;

    // Update stats
    const stats = this.stats.get(rendererType) || {
      totalTime: 0,
      callCount: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity,
    };

    stats.totalTime += duration;
    stats.callCount++;
    stats.avgTime = stats.totalTime / stats.callCount;
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.minTime = Math.min(stats.minTime, duration);
    this.stats.set(rendererType, stats);

    // Update current frame
    if (this.currentFrame) {
      const times = this.currentFrame.rendererTimes.get(rendererType) || [];
      times.push(duration);
      this.currentFrame.rendererTimes.set(rendererType, times);
      this.currentFrame.cellCount++;
    }
  }

  /**
   * Measure the execution time of a render function
   */
  measure<T>(rendererType: string, fn: () => T): T {
    if (!this.enabled) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.recordRender(rendererType, duration);

    return result;
  }

  /**
   * Get stats for a specific renderer
   */
  getStats(rendererType: string): PerformanceStats | undefined {
    return this.stats.get(rendererType);
  }

  /**
   * Get all stats
   */
  getAllStats(): Map<string, PerformanceStats> {
    return new Map(this.stats);
  }

  /**
   * Get average frame time over recent frames
   */
  getAverageFrameTime(): number {
    if (this.frameHistory.length === 0) return 0;
    const sum = this.frameHistory.reduce((acc, f) => acc + f.totalFrameTime, 0);
    return sum / this.frameHistory.length;
  }

  /**
   * Get FPS based on recent frames
   */
  getFPS(): number {
    const avgFrameTime = this.getAverageFrameTime();
    if (avgFrameTime === 0) return 0;
    return 1000 / avgFrameTime;
  }

  /**
   * Get the slowest renderers by average time
   */
  getSlowestRenderers(limit: number = 5): { type: string; stats: PerformanceStats }[] {
    const entries = Array.from(this.stats.entries())
      .map(([type, stats]) => ({ type, stats }))
      .sort((a, b) => b.stats.avgTime - a.stats.avgTime)
      .slice(0, limit);
    return entries;
  }

  /**
   * Get frame history
   */
  getFrameHistory(): FrameStats[] {
    return [...this.frameHistory];
  }

  /**
   * Reset all stats
   */
  reset(): void {
    this.stats.clear();
    this.frameHistory = [];
    this.currentFrame = null;
  }

  /**
   * Get a formatted report string
   */
  getReport(): string {
    const lines: string[] = [
      "=== Renderer Performance Report ===",
      `Status: ${this.enabled ? "Enabled" : "Disabled"}`,
      `Average Frame Time: ${this.getAverageFrameTime().toFixed(2)}ms`,
      `Estimated FPS: ${this.getFPS().toFixed(1)}`,
      "",
      "Renderer Stats (sorted by avg time):",
      "-".repeat(60),
    ];

    const sorted = this.getSlowestRenderers(20);
    for (const { type, stats } of sorted) {
      lines.push(
        `${type.padEnd(15)} | ` +
          `calls: ${stats.callCount.toString().padStart(6)} | ` +
          `avg: ${stats.avgTime.toFixed(3).padStart(8)}ms | ` +
          `max: ${stats.maxTime.toFixed(3).padStart(8)}ms | ` +
          `total: ${stats.totalTime.toFixed(1).padStart(8)}ms`,
      );
    }

    return lines.join("\n");
  }

  /**
   * Print report to console
   */
  printReport(): void {
    console.log(this.getReport());
  }
}

// Singleton instance
let globalMonitor: RendererPerformanceMonitor | null = null;

/**
 * Get the global performance monitor instance
 */
export function getPerformanceMonitor(): RendererPerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new RendererPerformanceMonitor();
  }
  return globalMonitor;
}
