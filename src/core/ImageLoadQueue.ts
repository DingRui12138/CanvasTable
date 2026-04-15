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

type ImageLoadCallback = (
  success: boolean,
  image: HTMLImageElement | HTMLCanvasElement | null,
) => void;

interface CacheEntry {
  /** 缩放后的图片（Canvas 或原图） */
  image: HTMLImageElement | HTMLCanvasElement;
  /** 缩放后的尺寸（宽高取最大值） */
  size: number;
  /** 原图（用于重新缩放到更大尺寸） */
  originalImage?: HTMLImageElement;
}

interface LoadingItem {
  src: string;
  callbacks: ImageLoadCallback[];
  /** 请求的最大尺寸 */
  maxSize: number;
}

export class ImageLoadQueue {
  private maxConcurrent: number;
  private maxCacheSize: number;

  /** 已加载缓存（包含尺寸信息） */
  private cache: Map<string, CacheEntry> = new Map();

  /** 加载失败 */
  private failed: Set<string> = new Set();

  /** 正在加载中 */
  private loading: Map<string, LoadingItem> = new Map();

  /** 等待加载队列 */
  private pendingQueue: Map<string, LoadingItem> = new Map();

  /** 当前帧收集的请求 */
  private frameRequests: Map<string, LoadingItem> = new Map();

  /** 是否已销毁 */
  private destroyed = false;

  constructor(options: ImageLoadQueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 6;
    this.maxCacheSize = options.maxCacheSize ?? 200;
  }

  /**
   * 请求加载图片
   * @param src 图片 URL
   * @param targetSize 需要的渲染尺寸（像素），默认 64
   * @param callback 加载完成回调
   */
  request(src: string, targetSize: number = 64, callback?: ImageLoadCallback): void {
    if (this.destroyed) return;

    // 检查缓存是否满足需求
    const cached = this.cache.get(src);
    if (cached) {
      // 如果缓存尺寸足够，直接返回
      if (cached.size >= targetSize) {
        callback?.(true, cached.image);
        return;
      }
      // 缓存尺寸不够，需要重新缩放
      if (cached.originalImage) {
        const newImage = this.scaleImage(cached.originalImage, targetSize);
        // 更新缓存
        cached.image = newImage;
        cached.size = targetSize;
        callback?.(true, newImage);
        return;
      }
      // 没有原图，需要重新加载
    }

    // 已失败
    if (this.failed.has(src)) {
      callback?.(false, null);
      return;
    }

    // 正在加载中，合并请求（取最大尺寸）
    const loadingItem = this.loading.get(src);
    if (loadingItem) {
      loadingItem.maxSize = Math.max(loadingItem.maxSize, targetSize);
      if (callback) loadingItem.callbacks.push(callback);
      return;
    }

    // 已在待加载队列，合并请求（取最大尺寸）
    const pendingItem = this.pendingQueue.get(src);
    if (pendingItem) {
      pendingItem.maxSize = Math.max(pendingItem.maxSize, targetSize);
      if (callback) pendingItem.callbacks.push(callback);
      return;
    }

    const item: LoadingItem = {
      src,
      callbacks: callback ? [callback] : [],
      maxSize: targetSize,
    };

    // 如果并发有空位，立即开始加载
    if (this.loading.size < this.maxConcurrent) {
      this.startLoad(src, item);
      return;
    }

    // 否则加入待加载队列
    this.pendingQueue.set(src, item);
  }

  /**
   * 提交当前帧的请求
   * 取消不可见的请求后调用，启动队列处理
   */
  commitFrame(): void {
    // 合并到 pendingQueue（取最大尺寸）
    for (const [src, item] of this.frameRequests) {
      const existing = this.pendingQueue.get(src);
      if (existing) {
        existing.maxSize = Math.max(existing.maxSize, item.maxSize);
        existing.callbacks.push(...item.callbacks);
      } else {
        this.pendingQueue.set(src, item);
      }
    }
    this.frameRequests.clear();

    // 立即处理队列（不等待 delay）
    this.processQueue();
  }

  /**
   * 取消指定图片的加载请求
   */
  cancel(src: string): void {
    this.pendingQueue.delete(src);
    this.frameRequests.delete(src);
  }

  /**
   * 批量取消不在可见区域的请求
   */
  cancelInvisible(visibleUrls: Set<string>): void {
    for (const src of this.pendingQueue.keys()) {
      if (!visibleUrls.has(src)) {
        this.pendingQueue.delete(src);
      }
    }
    for (const src of this.frameRequests.keys()) {
      if (!visibleUrls.has(src)) {
        this.frameRequests.delete(src);
      }
    }
  }

  /**
   * 处理加载队列
   */
  private processQueue(): void {
    if (this.destroyed) return;

    while (this.loading.size < this.maxConcurrent && this.pendingQueue.size > 0) {
      const [src, item] = this.pendingQueue.entries().next().value!;
      this.pendingQueue.delete(src);
      this.startLoad(src, item);
    }
  }

  /**
   * 开始加载图片
   */
  private startLoad(src: string, item: LoadingItem): void {
    if (this.destroyed) return;

    this.loading.set(src, item);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (this.destroyed) return;

      // 缩放图片到请求尺寸（保留原图用于后续更大尺寸需求）
      const scaledImage = this.scaleImage(img, item.maxSize);

      // 添加到缓存
      this.addToCache(src, {
        image: scaledImage,
        size: item.maxSize,
        originalImage: img,
      });
      this.loading.delete(src);

      for (const cb of item.callbacks) {
        cb(true, scaledImage);
      }

      this.processQueue();
    };

    img.onerror = () => {
      if (this.destroyed) return;

      this.loading.delete(src);
      this.failed.add(src);

      for (const cb of item.callbacks) {
        cb(false, null);
      }

      this.processQueue();
    };

    img.src = src;
  }

  /**
   * 缩放图片
   */
  private scaleImage(
    img: HTMLImageElement,
    targetSize: number,
  ): HTMLImageElement | HTMLCanvasElement {
    // 如果原图已经足够小，直接返回
    if (img.width <= targetSize && img.height <= targetSize) {
      return img;
    }

    // 计算缩放后的尺寸（保持比例）
    const ratio = Math.min(targetSize / img.width, targetSize / img.height);
    const scaledWidth = Math.round(img.width * ratio);
    const scaledHeight = Math.round(img.height * ratio);

    // 使用离屏 Canvas 缩放
    const canvas = document.createElement("canvas");
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return img;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    return canvas;
  }

  /**
   * 获取缓存的图片（如果尺寸不够会返回 null）
   */
  get(src: string, minSize?: number): HTMLImageElement | HTMLCanvasElement | null {
    const cached = this.cache.get(src);
    if (!cached) return null;
    // 如果需要特定尺寸且缓存不够大，返回 null
    if (minSize && cached.size < minSize) return null;
    return cached.image;
  }

  /**
   * 检查是否已缓存（且尺寸满足需求）
   */
  has(src: string, minSize?: number): boolean {
    const cached = this.cache.get(src);
    if (!cached) return false;
    if (minSize && cached.size < minSize) return false;
    return true;
  }

  /**
   * 检查是否加载失败
   */
  isFailed(src: string): boolean {
    return this.failed.has(src);
  }

  /**
   * 检查是否正在加载（包括等待中）
   */
  isLoading(src: string): boolean {
    return this.loading.has(src) || this.pendingQueue.has(src) || this.frameRequests.has(src);
  }

  /**
   * 重试失败的图片
   */
  retry(src: string): void {
    this.failed.delete(src);
  }

  /**
   * 添加到缓存（LRU 淘汰）
   */
  private addToCache(src: string, entry: CacheEntry): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(src, entry);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    pending: number;
    loading: number;
    cached: number;
    failed: number;
  } {
    return {
      pending: this.pendingQueue.size,
      loading: this.loading.size,
      cached: this.cache.size,
      failed: this.failed.size,
    };
  }

  /**
   * 清除所有缓存和队列
   */
  clear(): void {
    this.pendingQueue.clear();
    this.frameRequests.clear();
    this.loading.clear();
    this.cache.clear();
    this.failed.clear();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.destroyed = true;
    this.clear();
  }
}
