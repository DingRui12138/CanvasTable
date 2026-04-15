/**
 * ImageLoadQueue - 图片加载队列
 *
 * 功能：
 * 1. 批量延迟加载 - 收集一帧的请求后统一延迟
 * 2. 请求取消 - 图片离开可视区时取消待加载的请求
 * 3. 并发限制 - 同时最多加载指定数量的图片
 * 4. 图片预缩放 - 加载后缩放到指定尺寸，避免大图绘制性能问题
 * 5. 动态尺寸 - 请求更大尺寸时自动重新缩放
 */
export interface ImageLoadQueueOptions {
    /** 最大并发加载数，默认 6 */
    maxConcurrent?: number;
    /** 缓存最大数量，默认 200 */
    maxCacheSize?: number;
}
type ImageLoadCallback = (success: boolean, image: HTMLImageElement | HTMLCanvasElement | null) => void;
export declare class ImageLoadQueue {
    private maxConcurrent;
    private maxCacheSize;
    /** 已加载缓存（包含尺寸信息） */
    private cache;
    /** 加载失败 */
    private failed;
    /** 正在加载中 */
    private loading;
    /** 等待加载队列 */
    private pendingQueue;
    /** 当前帧收集的请求 */
    private frameRequests;
    /** 是否已销毁 */
    private destroyed;
    constructor(options?: ImageLoadQueueOptions);
    /**
   * 请求加载图片
     * @param src 图片 URL
     * @param targetSize 需要的渲染尺寸（像素），默认 64
     * @param callback 加载完成回调
     */
    request(src: string, targetSize?: number, callback?: ImageLoadCallback): void;
    /**
     * 提交当前帧的请求
     * 取消不可见的请求后调用，启动队列处理
     */
    commitFrame(): void;
    /**
     * 取消指定图片的加载请求
     */
    cancel(src: string): void;
    /**
     * 批量取消不在可见区域的请求
     */
    cancelInvisible(visibleUrls: Set<string>): void;
    /**
     * 处理加载队列
     */
    private processQueue;
    /**
     * 开始加载图片
     */
    private startLoad;
    /**
     * 缩放图片
     */
    private scaleImage;
    /**
     * 获取缓存的图片（如果尺寸不够会返回 null）
     */
    get(src: string, minSize?: number): HTMLImageElement | HTMLCanvasElement | null;
    /**
     * 检查是否已缓存（且尺寸满足需求）
     */
    has(src: string, minSize?: number): boolean;
    /**
     * 检查是否加载失败
     */
    isFailed(src: string): boolean;
    /**
     * 检查是否正在加载（包括等待中）
     */
    isLoading(src: string): boolean;
    /**
     * 重试失败的图片
     */
    retry(src: string): void;
    /**
     * 添加到缓存（LRU 淘汰）
     */
    private addToCache;
    /**
     * 获取统计信息
     */
    getStats(): {
        pending: number;
        loading: number;
        cached: number;
        failed: number;
    };
    /**
     * 清除所有缓存和队列
     */
    clear(): void;
    /**
     * 销毁
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=ImageLoadQueue.d.ts.map