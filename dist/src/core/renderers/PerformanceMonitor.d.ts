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
export declare class RendererPerformanceMonitor {
    private enabled;
    private stats;
    private currentFrame;
    private frameHistory;
    private maxFrameHistory;
    /**
     * Enable or disable performance monitoring
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if monitoring is enabled
     */
    isEnabled(): boolean;
    /**
     * Start a new frame
     */
    startFrame(): void;
    /**
     * End the current frame and record stats
     */
    endFrame(): void;
    /**
     * Record a render call
     * @param rendererType The type of renderer
     * @param duration The duration of the render call in ms
     */
    recordRender(rendererType: string, duration: number): void;
    /**
     * Measure the execution time of a render function
     */
    measure<T>(rendererType: string, fn: () => T): T;
    /**
     * Get stats for a specific renderer
     */
    getStats(rendererType: string): PerformanceStats | undefined;
    /**
     * Get all stats
     */
    getAllStats(): Map<string, PerformanceStats>;
    /**
     * Get average frame time over recent frames
     */
    getAverageFrameTime(): number;
    /**
     * Get FPS based on recent frames
     */
    getFPS(): number;
    /**
     * Get the slowest renderers by average time
     */
    getSlowestRenderers(limit?: number): {
        type: string;
        stats: PerformanceStats;
    }[];
    /**
     * Get frame history
     */
    getFrameHistory(): FrameStats[];
    /**
     * Reset all stats
     */
    reset(): void;
    /**
     * Get a formatted report string
     */
    getReport(): string;
    /**
     * Print report to console
     */
    printReport(): void;
}
/**
 * Get the global performance monitor instance
 */
export declare function getPerformanceMonitor(): RendererPerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.d.ts.map