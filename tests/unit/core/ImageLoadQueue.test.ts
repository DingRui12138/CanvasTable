import { ImageLoadQueue } from "@/core/ImageLoadQueue";

type LoadingItemShape = {
  src: string;
  callbacks: ((success: boolean, image: unknown) => void)[];
  maxSize: number;
};

type CacheEntryShape = {
  image: HTMLImageElement | HTMLCanvasElement;
  size: number;
  originalImage?: HTMLImageElement;
};

let images: HTMLImageElement[] = [];
const globalScope = globalThis as unknown as { Image: unknown };
const OriginalImage = globalScope.Image;

beforeEach(() => {
  images = [];
  // jsdom 不会真正请求图片资源（onload/onerror 永不触发），
  // 但 jest-canvas-mock 的 drawImage 要求入参是真正的 HTMLImageElement，
  // 所以这里仍然造真实 <img>，只是由测试手动触发事件。
  globalScope.Image = function (this: unknown) {
    const img = document.createElement("img");
    images.push(img);
    return img;
  } as unknown;
});

afterEach(() => {
  globalScope.Image = OriginalImage;
});

/** 第 index 个 Image 上的 src（jsdom 会把 src 解析成绝对地址，故读原始属性） */
function srcOf(index: number): string | null {
  return images[index]!.getAttribute("src");
}

/** 触发第 index 个 Image 的 onload，并可指定原图尺寸 */
function fireLoad(index: number, width = 10, height = 10): void {
  const img = images[index]!;
  img.width = width;
  img.height = height;
  img.onload?.(new Event("load"));
}

/** 触发第 index 个 Image 的 onerror */
function fireError(index: number): void {
  images[index]!.onerror?.(new Event("error"));
}

/** 直接访问私有状态，用于触达只能由内部构造出的边界 */
function priv(queue: ImageLoadQueue) {
  return queue as unknown as {
    cache: Map<string, CacheEntryShape>;
    pendingQueue: Map<string, LoadingItemShape>;
    loading: Map<string, LoadingItemShape>;
    startLoad(src: string, item: LoadingItemShape): void;
  };
}

describe("ImageLoadQueue", () => {
  describe("构造与默认值", () => {
    it("默认最大并发为 6", () => {
      const queue = new ImageLoadQueue();

      for (let i = 0; i < 7; i++) queue.request(`img-${i}.png`);

      expect(queue.getStats()).toEqual({ pending: 1, loading: 6, cached: 0, failed: 0 });
    });

    it("maxConcurrent 可配置", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 2 });

      for (let i = 0; i < 3; i++) queue.request(`img-${i}.png`);

      expect(queue.getStats()).toEqual({ pending: 1, loading: 2, cached: 0, failed: 0 });
    });

    it("初始统计全为 0", () => {
      expect(new ImageLoadQueue().getStats()).toEqual({
        pending: 0,
        loading: 0,
        cached: 0,
        failed: 0,
      });
    });
  });

  describe("request：发起加载", () => {
    it("并发有空位时立即创建 Image 并设置跨域", () => {
      const queue = new ImageLoadQueue();

      queue.request("a.png");

      expect(images).toHaveLength(1);
      expect(srcOf(0)).toBe("a.png");
      expect(images[0]!.crossOrigin).toBe("anonymous");
      expect(queue.getStats()).toEqual({ pending: 0, loading: 1, cached: 0, failed: 0 });
    });

    it("targetSize 默认 64", () => {
      const queue = new ImageLoadQueue();
      queue.request("a.png");
      fireLoad(0, 10, 10);

      expect(queue.has("a.png", 64)).toBe(true);
      expect(queue.has("a.png", 65)).toBe(false);
    });

    it("超过并发上限后进入待加载队列", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });

      queue.request("a.png");
      queue.request("b.png");
      queue.request("c.png");

      expect(images).toHaveLength(1);
      expect(queue.getStats()).toEqual({ pending: 2, loading: 1, cached: 0, failed: 0 });
      expect(queue.isLoading("b.png")).toBe(true);
      expect(queue.isLoading("c.png")).toBe(true);
    });

    it("加载完成后自动补齐队列", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });
      queue.request("a.png");
      queue.request("b.png");

      fireLoad(0, 10, 10);

      expect(images).toHaveLength(2);
      expect(srcOf(1)).toBe("b.png");
      expect(queue.getStats()).toEqual({ pending: 0, loading: 1, cached: 1, failed: 0 });
    });

    it("没有回调时也能正常加载", () => {
      const queue = new ImageLoadQueue();

      queue.request("a.png");
      expect(() => fireLoad(0)).not.toThrow();

      expect(queue.has("a.png")).toBe(true);
    });

    it("销毁后 request 不再做任何事", () => {
      const queue = new ImageLoadQueue();
      queue.destroy();

      queue.request("a.png");

      expect(images).toHaveLength(0);
      expect(queue.getStats()).toEqual({ pending: 0, loading: 0, cached: 0, failed: 0 });
    });
  });

  describe("request：请求合并", () => {
    it("同一张图在加载中时合并请求并取最大尺寸", () => {
      const queue = new ImageLoadQueue();
      const first = jest.fn();
      const second = jest.fn();

      queue.request("a.png", 32, first);
      queue.request("a.png", 128, second);

      expect(images).toHaveLength(1);

      fireLoad(0, 400, 400);

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
      // 取到更大的 128，所以 128 满足、129 不满足
      expect(queue.has("a.png", 128)).toBe(true);
      expect(queue.has("a.png", 129)).toBe(false);
    });

    it("同一张图在待加载队列中时同样合并", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });
      const cb = jest.fn();

      queue.request("a.png");
      queue.request("b.png", 32);
      queue.request("b.png", 96, cb);

      expect(queue.getStats().pending).toBe(1);

      fireLoad(0, 400, 400);

      expect(images).toHaveLength(2);
      expect(srcOf(1)).toBe("b.png");

      fireLoad(1, 400, 400);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(queue.has("b.png", 96)).toBe(true);
    });

    it("重复请求同一张图不会重复创建 Image", () => {
      const queue = new ImageLoadQueue();

      queue.request("a.png");
      queue.request("a.png");
      queue.request("a.png");

      expect(images).toHaveLength(1);
    });
  });

  describe("request：缓存命中", () => {
    it("缓存尺寸足够时同步回调，不创建新 Image", () => {
      const queue = new ImageLoadQueue();
      queue.request("a.png", 64);
      fireLoad(0, 10, 10);
      const cached = queue.get("a.png");
      const cb = jest.fn();

      queue.request("a.png", 32, cb);

      expect(cb).toHaveBeenCalledWith(true, cached);
      expect(images).toHaveLength(1);
    });

    it("缓存尺寸不足但保留原图时按新尺寸重新缩放", () => {
      const queue = new ImageLoadQueue();
      queue.request("a.png", 32);
      fireLoad(0, 400, 400);
      const cb = jest.fn();

      queue.request("a.png", 128, cb);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0]![0]).toBe(true);
      expect(queue.has("a.png", 128)).toBe(true);
      // 没有重新发起网络请求
      expect(images).toHaveLength(1);
    });

    it("缓存尺寸不足且没有原图时重新发起加载", () => {
      const queue = new ImageLoadQueue();
      // 只有内部 onload 会写缓存，这里手工构造"无原图"的缓存条目
      priv(queue).cache.set("a.png", { image: document.createElement("canvas"), size: 10 });
      const cb = jest.fn();

      queue.request("a.png", 64, cb);

      expect(cb).not.toHaveBeenCalled();
      expect(images).toHaveLength(1);
      expect(srcOf(0)).toBe("a.png");
    });
  });

  describe("request：失败与重试", () => {
    it("加载失败时回调 false 并标记失败", () => {
      const queue = new ImageLoadQueue();
      const cb = jest.fn();

      queue.request("bad.png", 64, cb);
      fireError(0);

      expect(cb).toHaveBeenCalledWith(false, null);
      expect(queue.isFailed("bad.png")).toBe(true);
      expect(queue.getStats()).toEqual({ pending: 0, loading: 0, cached: 0, failed: 1 });
    });

    it("已失败的图片再次请求时同步回调 false", () => {
      const queue = new ImageLoadQueue();
      queue.request("bad.png");
      fireError(0);
      const cb = jest.fn();

      queue.request("bad.png", 64, cb);

      expect(cb).toHaveBeenCalledWith(false, null);
      expect(images).toHaveLength(1);
    });

    it("retry 清除失败标记后可以重新加载", () => {
      const queue = new ImageLoadQueue();
      queue.request("bad.png");
      fireError(0);

      queue.retry("bad.png");

      expect(queue.isFailed("bad.png")).toBe(false);
      queue.request("bad.png");
      expect(images).toHaveLength(2);
    });

    it("失败后仍会继续处理待加载队列", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });
      queue.request("bad.png");
      queue.request("b.png");

      fireError(0);

      expect(images).toHaveLength(2);
      expect(srcOf(1)).toBe("b.png");
      expect(queue.getStats().failed).toBe(1);
    });
  });

  describe("缩放", () => {
    it("原图不超过目标尺寸时直接复用原图", () => {
      const queue = new ImageLoadQueue();

      queue.request("a.png", 64);
      fireLoad(0, 32, 32);

      expect(queue.get("a.png")).toBe(images[0]);
    });

    it("原图过大时按比例缩放到离屏 Canvas", () => {
      const queue = new ImageLoadQueue();

      queue.request("a.png", 64);
      fireLoad(0, 200, 100);

      const scaled = queue.get("a.png") as HTMLCanvasElement;
      expect(scaled).not.toBe(images[0]);
      expect(scaled.width).toBe(64);
      expect(scaled.height).toBe(32);
    });

    it("缩放后缓存尺寸记为请求尺寸", () => {
      const queue = new ImageLoadQueue();

      queue.request("a.png", 48);
      fireLoad(0, 300, 300);

      expect(queue.getStats().cached).toBe(1);
      expect(queue.has("a.png", 48)).toBe(true);
      expect(queue.has("a.png", 49)).toBe(false);
    });

    it("拿不到 2D 上下文时回退为原图", () => {
      const spy = jest
        .spyOn(HTMLCanvasElement.prototype, "getContext")
        .mockReturnValue(null as never);
      try {
        const queue = new ImageLoadQueue();

        queue.request("a.png", 64);
        fireLoad(0, 200, 200);

        expect(queue.get("a.png")).toBe(images[0]);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe("缓存淘汰", () => {
    it("超过 maxCacheSize 时淘汰最早写入的条目", () => {
      const queue = new ImageLoadQueue({ maxCacheSize: 1 });

      queue.request("a.png");
      fireLoad(0);
      queue.request("b.png");
      fireLoad(1);

      expect(queue.getStats().cached).toBe(1);
      expect(queue.has("a.png")).toBe(false);
      expect(queue.has("b.png")).toBe(true);
    });

    it("空字符串 key 会让淘汰判断失效（firstKey 为假值时跳过删除）", () => {
      const queue = new ImageLoadQueue({ maxCacheSize: 1 });

      queue.request("");
      fireLoad(0);
      queue.request("y.png");
      fireLoad(1);

      // 已知缺陷：`if (firstKey)` 把 "" 当成"没有 key"，于是缓存可以超出上限
      expect(queue.getStats().cached).toBe(2);
      expect(queue.has("")).toBe(true);
      expect(queue.has("y.png")).toBe(true);
    });

    it("maxCacheSize 默认 200", () => {
      const queue = new ImageLoadQueue();

      for (let i = 0; i < 201; i++) {
        queue.request(`img-${i}.png`, 8);
        fireLoad(i, 4, 4);
      }

      expect(queue.getStats().cached).toBe(200);
      expect(queue.has("img-0.png")).toBe(false);
      expect(queue.has("img-200.png")).toBe(true);
    });
  });

  describe("查询接口", () => {
    it("get / has 对未知 src 返回空值", () => {
      const queue = new ImageLoadQueue();

      expect(queue.get("nope.png")).toBeNull();
      expect(queue.has("nope.png")).toBe(false);
      expect(queue.isFailed("nope.png")).toBe(false);
      expect(queue.isLoading("nope.png")).toBe(false);
    });

    it("get 支持最小尺寸门槛", () => {
      const queue = new ImageLoadQueue();
      queue.request("a.png", 64);
      fireLoad(0, 10, 10);

      expect(queue.get("a.png")).not.toBeNull();
      expect(queue.get("a.png", 64)).not.toBeNull();
      expect(queue.get("a.png", 65)).toBeNull();
    });

    it("isLoading 同时覆盖加载中与待加载", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });

      queue.request("a.png");
      queue.request("b.png");

      expect(queue.isLoading("a.png")).toBe(true);
      expect(queue.isLoading("b.png")).toBe(true);
      expect(queue.isLoading("c.png")).toBe(false);
    });
  });

  describe("cancel / cancelInvisible", () => {
    it("cancel 移除待加载请求", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });
      queue.request("a.png");
      queue.request("b.png");

      queue.cancel("b.png");

      expect(queue.getStats().pending).toBe(0);
      expect(queue.isLoading("b.png")).toBe(false);
    });

    it("cancel 不影响已在加载中的请求", () => {
      const queue = new ImageLoadQueue();
      queue.request("a.png");

      queue.cancel("a.png");

      expect(queue.getStats().loading).toBe(1);
      expect(images).toHaveLength(1);
    });

    it("cancelInvisible 批量取消不可见请求，保留可见请求", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });
      queue.request("a.png");
      queue.request("b.png");
      queue.request("c.png");

      queue.cancelInvisible(new Set(["b.png"]));

      expect(queue.getStats().pending).toBe(1);
      expect(queue.isLoading("b.png")).toBe(true);
      expect(queue.isLoading("c.png")).toBe(false);
    });

    it("cancelInvisible 全部不可见时清空队列", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });
      queue.request("a.png");
      queue.request("b.png");

      queue.cancelInvisible(new Set<string>());

      expect(queue.getStats().pending).toBe(0);
    });
  });

  describe("commitFrame", () => {
    it("把待加载队列推进到加载中", () => {
      const queue = new ImageLoadQueue();
      // 内部只会在并发满时入队，这里手工构造"队列有货但有空位"的状态
      priv(queue).pendingQueue.set("x.png", { src: "x.png", callbacks: [], maxSize: 64 });

      queue.commitFrame();

      expect(images).toHaveLength(1);
      expect(srcOf(0)).toBe("x.png");
      expect(queue.getStats()).toEqual({ pending: 0, loading: 1, cached: 0, failed: 0 });
    });

    it("队列为空时是空操作", () => {
      const queue = new ImageLoadQueue();

      queue.commitFrame();

      expect(images).toHaveLength(0);
    });

    it("销毁后调用不报错也不创建 Image", () => {
      const queue = new ImageLoadQueue();
      queue.destroy();

      expect(() => queue.commitFrame()).not.toThrow();
      expect(images).toHaveLength(0);
    });

    it("frameRequests 从未被写入，因此合并逻辑不会被触发", () => {
      const queue = new ImageLoadQueue();
      const frameRequests = (
        queue as unknown as { frameRequests: Map<string, LoadingItemShape> }
      ).frameRequests;

      queue.request("a.png");
      queue.commitFrame();

      // 已知缺陷：request() 只写 loading / pendingQueue，帧级缓冲层实际是死状态
      expect(frameRequests.size).toBe(0);
    });
  });

  describe("clear / destroy", () => {
    it("clear 清空所有队列与缓存", () => {
      const queue = new ImageLoadQueue({ maxConcurrent: 1 });
      queue.request("a.png");
      queue.request("b.png");
      fireLoad(0, 10, 10);
      queue.request("bad.png");
      fireError(1);

      queue.clear();

      expect(queue.getStats()).toEqual({ pending: 0, loading: 0, cached: 0, failed: 0 });
      expect(queue.has("a.png")).toBe(false);
      expect(queue.isFailed("b.png")).toBe(false);
    });

    it("destroy 标记销毁并清空状态", () => {
      const queue = new ImageLoadQueue();
      queue.request("a.png");

      queue.destroy();

      expect(queue.getStats()).toEqual({ pending: 0, loading: 0, cached: 0, failed: 0 });
    });

    it("销毁后迟到的 onload 不会写缓存也不会回调", () => {
      const queue = new ImageLoadQueue();
      const cb = jest.fn();
      queue.request("a.png", 64, cb);

      queue.destroy();
      fireLoad(0, 10, 10);

      expect(cb).not.toHaveBeenCalled();
      expect(queue.getStats().cached).toBe(0);
    });

    it("销毁后迟到的 onerror 不会标记失败也不会回调", () => {
      const queue = new ImageLoadQueue();
      const cb = jest.fn();
      queue.request("a.png", 64, cb);

      queue.destroy();
      fireError(0);

      expect(cb).not.toHaveBeenCalled();
      expect(queue.isFailed("a.png")).toBe(false);
    });

    it("销毁后 startLoad 直接返回", () => {
      const queue = new ImageLoadQueue();
      const item: LoadingItemShape = { src: "a.png", callbacks: [], maxSize: 64 };
      priv(queue).startLoad("a.png", item);
      expect(images).toHaveLength(1);

      queue.destroy();
      priv(queue).startLoad("b.png", { src: "b.png", callbacks: [], maxSize: 64 });

      expect(images).toHaveLength(1);
    });
  });
});
