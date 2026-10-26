import {
  RendererPerformanceMonitor,
  getPerformanceMonitor,
} from "@/core/renderers/PerformanceMonitor";

/** 让 performance.now() 每次调用自增 10ms，便于断言精确耗时 */
let nowValue = 0;
let nowSpy: jest.SpyInstance<number, []>;

beforeEach(() => {
  nowValue = 0;
  nowSpy = jest.spyOn(performance, "now").mockImplementation(() => {
    nowValue += 10;
    return nowValue;
  });
});

afterEach(() => {
  nowSpy.mockRestore();
});

describe("RendererPerformanceMonitor", () => {
  describe("启用开关", () => {
    it("默认未启用", () => {
      expect(new RendererPerformanceMonitor().isEnabled()).toBe(false);
    });

    it("setEnabled(true) 后 isEnabled 为真", () => {
      const monitor = new RendererPerformanceMonitor();

      monitor.setEnabled(true);

      expect(monitor.isEnabled()).toBe(true);
    });

    it("setEnabled(false) 会清空已采集的数据", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);
      monitor.startFrame();
      monitor.recordRender("text", 1);
      monitor.endFrame();

      monitor.setEnabled(false);

      expect(monitor.isEnabled()).toBe(false);
      expect(monitor.getStats("text")).toBeUndefined();
      expect(monitor.getFrameHistory()).toEqual([]);
    });
  });

  describe("帧生命周期", () => {
    it("未启用时 startFrame/endFrame 不记录任何帧", () => {
      const monitor = new RendererPerformanceMonitor();

      monitor.startFrame();
      monitor.endFrame();

      expect(monitor.getFrameHistory()).toEqual([]);
    });

    it("启用后 startFrame + endFrame 记录一帧及其耗时", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      monitor.startFrame();
      monitor.endFrame();

      const history = monitor.getFrameHistory();
      expect(history).toHaveLength(1);
      expect(history[0]!.totalFrameTime).toBe(10);
      expect(history[0]!.frameStart).toBe(10);
      expect(history[0]!.cellCount).toBe(0);
      expect(history[0]!.rendererTimes.size).toBe(0);
    });

    it("未 startFrame 时 endFrame 是空操作", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      monitor.endFrame();

      expect(monitor.getFrameHistory()).toEqual([]);
    });

    it("endFrame 后当前帧被清空，重复调用不再产生新帧", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      monitor.startFrame();
      monitor.endFrame();
      monitor.endFrame();

      expect(monitor.getFrameHistory()).toHaveLength(1);
    });

    it("帧历史最多保留 60 帧", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      for (let i = 0; i < 61; i++) {
        monitor.startFrame();
        monitor.endFrame();
      }

      expect(monitor.getFrameHistory()).toHaveLength(60);
    });
  });

  describe("recordRender", () => {
    it("未启用时不记录", () => {
      const monitor = new RendererPerformanceMonitor();

      monitor.recordRender("text", 5);

      expect(monitor.getStats("text")).toBeUndefined();
    });

    it("累计总耗时、调用次数、平均/最大/最小耗时", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      monitor.recordRender("text", 10);
      monitor.recordRender("text", 20);

      expect(monitor.getStats("text")).toEqual({
        totalTime: 30,
        callCount: 2,
        avgTime: 15,
        maxTime: 20,
        minTime: 10,
      });
    });

    it("不同渲染器分别统计", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      monitor.recordRender("text", 3);
      monitor.recordRender("number", 7);

      expect(monitor.getStats("text")!.totalTime).toBe(3);
      expect(monitor.getStats("number")!.totalTime).toBe(7);
    });

    it("帧内记录时同步累加 cellCount 与 rendererTimes", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      monitor.startFrame();
      monitor.recordRender("text", 3);
      monitor.recordRender("text", 7);
      monitor.recordRender("number", 5);
      monitor.endFrame();

      const frame = monitor.getFrameHistory()[0]!;
      expect(frame.cellCount).toBe(3);
      expect(frame.rendererTimes.get("text")).toEqual([3, 7]);
      expect(frame.rendererTimes.get("number")).toEqual([5]);
    });

    it("帧外记录时只更新统计不影响任何帧", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      monitor.recordRender("text", 1);

      expect(monitor.getStats("text")!.callCount).toBe(1);
      expect(monitor.getFrameHistory()).toEqual([]);
    });
  });

  describe("measure", () => {
    it("未启用时直接执行函数且不记录", () => {
      const monitor = new RendererPerformanceMonitor();
      const fn = jest.fn(() => "ok");

      const result = monitor.measure("text", fn);

      expect(result).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(1);
      expect(monitor.getStats("text")).toBeUndefined();
    });

    it("启用时执行函数并把耗时记入统计", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);
      const fn = jest.fn(() => 42);

      const result = monitor.measure("text", fn);

      expect(result).toBe(42);
      expect(monitor.getStats("text")).toEqual({
        totalTime: 10,
        callCount: 1,
        avgTime: 10,
        maxTime: 10,
        minTime: 10,
      });
    });

    it("measure 的结果不会被吞掉（含 undefined）", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      expect(monitor.measure("text", () => undefined)).toBeUndefined();
    });
  });

  describe("查询接口", () => {
    it("getAllStats 返回副本，改动不影响内部状态", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);
      monitor.recordRender("text", 1);

      const all = monitor.getAllStats();
      all.delete("text");
      all.set("ghost", { totalTime: 0, callCount: 0, avgTime: 0, maxTime: 0, minTime: 0 });

      expect(monitor.getStats("text")).toBeDefined();
      expect(monitor.getStats("ghost")).toBeUndefined();
    });

    it("没有帧时平均帧耗时与 FPS 都是 0", () => {
      const monitor = new RendererPerformanceMonitor();

      expect(monitor.getAverageFrameTime()).toBe(0);
      expect(monitor.getFPS()).toBe(0);
    });

    it("有帧时按帧历史求平均并换算 FPS", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);

      monitor.startFrame();
      monitor.endFrame();
      monitor.startFrame();
      monitor.endFrame();

      expect(monitor.getAverageFrameTime()).toBe(10);
      expect(monitor.getFPS()).toBe(100);
    });

    it("getSlowestRenderers 按平均耗时降序，默认取前 5", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);
      monitor.recordRender("a", 1);
      monitor.recordRender("b", 10);
      monitor.recordRender("c", 5);

      expect(monitor.getSlowestRenderers().map((e) => e.type)).toEqual(["b", "c", "a"]);
    });

    it("getSlowestRenderers 支持自定义 limit", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);
      monitor.recordRender("a", 1);
      monitor.recordRender("b", 10);
      monitor.recordRender("c", 5);

      expect(monitor.getSlowestRenderers(2).map((e) => e.type)).toEqual(["b", "c"]);
      expect(monitor.getSlowestRenderers(0)).toEqual([]);
    });

    it("getFrameHistory 返回副本", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);
      monitor.startFrame();
      monitor.endFrame();

      const history = monitor.getFrameHistory();
      history.push({
        frameStart: 0,
        rendererTimes: new Map(),
        totalFrameTime: 0,
        cellCount: 0,
      });

      expect(monitor.getFrameHistory()).toHaveLength(1);
    });
  });

  describe("reset", () => {
    it("清空统计、帧历史与当前帧", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);
      monitor.startFrame();
      monitor.recordRender("text", 1);

      monitor.reset();

      expect(monitor.getStats("text")).toBeUndefined();
      expect(monitor.getFrameHistory()).toEqual([]);

      // 当前帧也被清空，endFrame 不再产生记录
      monitor.endFrame();
      expect(monitor.getFrameHistory()).toEqual([]);
    });
  });

  describe("报告", () => {
    it("未启用时报告显示 Disabled 与零值", () => {
      const monitor = new RendererPerformanceMonitor();

      const report = monitor.getReport();

      expect(report).toContain("=== Renderer Performance Report ===");
      expect(report).toContain("Status: Disabled");
      expect(report).toContain("Average Frame Time: 0.00ms");
      expect(report).toContain("Estimated FPS: 0.0");
      expect(report).toContain("Renderer Stats (sorted by avg time):");
    });

    it("启用后报告包含各渲染器的统计行", () => {
      const monitor = new RendererPerformanceMonitor();
      monitor.setEnabled(true);
      monitor.recordRender("text", 12.3456);

      const report = monitor.getReport();

      expect(report).toContain("Status: Enabled");
      expect(report).toContain("text");
      expect(report).toContain("calls:      1");
      // "12.346" 长 6 → padStart(8) 补 2 空格，加上 "avg: " 自带 1 个空格共 3 个
      expect(report).toContain("avg:   12.346ms");
      expect(report).toContain("max:   12.346ms");
      expect(report).toContain("total:     12.3ms");
    });

    it("printReport 把报告打到 console", () => {
      const monitor = new RendererPerformanceMonitor();
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      monitor.printReport();

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0]![0]).toBe(monitor.getReport());
      logSpy.mockRestore();
    });
  });

  describe("全局单例", () => {
    it("getPerformanceMonitor 始终返回同一个实例", () => {
      const first = getPerformanceMonitor();
      const second = getPerformanceMonitor();

      expect(first).toBe(second);
      expect(first).toBeInstanceOf(RendererPerformanceMonitor);
    });

    it("单例状态在多次获取之间保持", () => {
      const monitor = getPerformanceMonitor();
      monitor.setEnabled(true);
      monitor.recordRender("singleton", 4);

      expect(getPerformanceMonitor().getStats("singleton")!.callCount).toBe(1);

      monitor.setEnabled(false);
    });
  });
});
