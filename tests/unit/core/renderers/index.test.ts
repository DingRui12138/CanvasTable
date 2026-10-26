import { CellRendererRegistry } from "@/core/renderers";
import type { CellRenderer, CellRendererContext } from "@/core/renderers/CellRenderer";
import { zhCN, enUS } from "@/locale";
import type { CellType, Column, Row, TableTheme } from "@/types";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext } from "../../helpers/canvasInspect";

/** 内置注册的全部 cell type */
const BUILT_IN_TYPES: CellType[] = [
  "text",
  "number",
  "checkbox",
  "radio",
  "button",
  "switch",
  "progress",
  "image",
  "tag",
  "date",
  "select",
  "input",
  "rating",
  "color",
];

/** CellType 中没有任何内置渲染器的取值 */
const UNREGISTERED_TYPES: CellType[] = ["boolean", "link", "custom"];

function context(overrides: Partial<CellRendererContext> = {}): CellRendererContext {
  const { ctx } = createTrackedContext();
  const theme: TableTheme = createMockTheme();
  const column: Column = { key: "c", title: "C", width: 100, type: "text" };
  const row: Row = { id: "r0", data: {} };

  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    theme,
    locale: zhCN,
    layoutManager: {} as CellRendererContext["layoutManager"],
    x: 0,
    y: 0,
    width: 100,
    height: 32,
    column,
    row,
    rowIndex: 0,
    colIndex: 0,
    value: "v",
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;
}

describe("CellRendererRegistry", () => {
  let registry: CellRendererRegistry;

  beforeEach(() => {
    registry = new CellRendererRegistry();
  });

  afterEach(() => {
    // 性能监控是全局单例，测试完必须复位，避免污染其它用例
    registry.setPerformanceMonitoring(false);
  });

  describe("内置渲染器注册", () => {
    it("14 个内置类型全部可用", () => {
      for (const type of BUILT_IN_TYPES) {
        expect(registry.has(type)).toBe(true);
        expect(registry.get(type)).toBeDefined();
      }
    });

    it("每个渲染器都声明了自己负责的类型", () => {
      for (const type of BUILT_IN_TYPES) {
        expect(registry.get(type)!.type).toBe(type);
      }
    });

    it("boolean / link / custom 没有专属渲染器", () => {
      for (const type of UNREGISTERED_TYPES) {
        expect(registry.has(type)).toBe(false);
        expect(registry.get(type)).toBeUndefined();
      }
    });
  });

  describe("register / get / has", () => {
    it("注册后可按类型取回同一个实例", () => {
      const custom: CellRenderer = { type: "text", render: () => ({ type: "text" }) };

      registry.register(custom);

      expect(registry.get("text")).toBe(custom);
      expect(registry.has("text")).toBe(true);
    });

    it("同类型重复注册会覆盖", () => {
      const first: CellRenderer = { type: "text", render: () => ({ type: "text" }) };
      const second: CellRenderer = { type: "text", render: () => ({ type: "text" }) };

      registry.register(first);
      registry.register(second);

      expect(registry.get("text")).toBe(second);
    });

    it("可以注册全新的自定义类型", () => {
      const custom: CellRenderer = { type: "custom", render: () => ({ type: "custom" }) };

      expect(registry.has("custom")).toBe(false);
      registry.register(custom);
      expect(registry.get("custom")).toBe(custom);
    });
  });

  describe("render", () => {
    it("按 column.type 分派到对应渲染器", () => {
      const spy: CellRenderer = { type: "text", render: jest.fn(() => ({ type: "text" })) };
      registry.register(spy);

      const result = registry.render(context({ column: { key: "c", title: "C", width: 100, type: "text" } }));

      expect(spy.render).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ type: "text" });
    });

    it("column.type 缺省时按 text 处理", () => {
      const spy: CellRenderer = { type: "text", render: jest.fn(() => ({ type: "text" })) };
      registry.register(spy);

      registry.render(context({ column: { key: "c", title: "C", width: 100 } }));

      expect(spy.render).toHaveBeenCalledTimes(1);
    });

    it("未注册的类型回落到默认 TextRenderer", () => {
      const spy: CellRenderer = { type: "text", render: jest.fn(() => ({ type: "text" })) };
      registry.register(spy);

      const result = registry.render(
        context({ column: { key: "c", title: "C", width: 100, type: "boolean" } }),
      );

      // 默认渲染器是构造时创建的那个 TextRenderer，不是刚注册的 spy
      expect(spy.render).not.toHaveBeenCalled();
      expect(result).toEqual({ type: "text" });
    });

    it("把原始 context 原样交给渲染器", () => {
      const spy: CellRenderer = { type: "text", render: jest.fn(() => ({ type: "text" })) };
      registry.register(spy);
      const ctx = context();

      registry.render(ctx);

      expect(spy.render).toHaveBeenCalledWith(ctx);
    });

    it("透传渲染器返回的结果", () => {
      const payload = { type: "text" as CellType, customBackground: true };
      registry.register({ type: "text", render: () => payload });

      expect(registry.render(context())).toBe(payload);
    });
  });

  describe("createContext", () => {
    const params = () => ({
      ctx: createTrackedContext().ctx as unknown as CanvasRenderingContext2D,
      theme: createMockTheme(),
      layoutManager: {} as CellRendererContext["layoutManager"],
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      column: { key: "c", title: "C", width: 3, type: "text" } as Column,
      row: { id: "r", data: {} } as Row,
      rowIndex: 5,
      colIndex: 6,
      value: 7,
      isDisabled: false,
      isHovered: false,
      isSelected: false,
      dpr: 2,
    });

    it("所有传入字段都被复制", () => {
      const created = registry.createContext(params());

      expect(created.x).toBe(1);
      expect(created.y).toBe(2);
      expect(created.width).toBe(3);
      expect(created.height).toBe(4);
      expect(created.rowIndex).toBe(5);
      expect(created.colIndex).toBe(6);
      expect(created.value).toBe(7);
      expect(created.dpr).toBe(2);
    });

    it("不传 locale 时使用注册表当前 locale", () => {
      expect(registry.createContext(params()).locale).toBe(zhCN);
    });

    it("显式传入的 locale 优先", () => {
      const created = registry.createContext({ ...params(), locale: enUS });

      expect(created.locale).toBe(enUS);
    });

    it("保留可选字段", () => {
      const created = registry.createContext({
        ...params(),
        multipleSelectSeparator: "|",
        hoveredImageIndex: 2,
        hoveredButtonIndex: 1,
      });

      expect(created.multipleSelectSeparator).toBe("|");
      expect(created.hoveredImageIndex).toBe(2);
      expect(created.hoveredButtonIndex).toBe(1);
    });
  });

  describe("setLocale", () => {
    it("改变 createContext 的默认 locale", () => {
      registry.setLocale(enUS);

      const created = registry.createContext({
        ctx: createTrackedContext().ctx as unknown as CanvasRenderingContext2D,
        theme: createMockTheme(),
        layoutManager: {} as CellRendererContext["layoutManager"],
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        column: { key: "c", title: "C", width: 1, type: "text" } as Column,
        row: { id: "r", data: {} } as Row,
        rowIndex: 0,
        colIndex: 0,
        value: null,
        isDisabled: false,
        isHovered: false,
        isSelected: false,
        dpr: 1,
      });

      expect(created.locale).toBe(enUS);
    });

    it("可以接受构造时传入的 locale", () => {
      const custom = new CellRendererRegistry(enUS);

      expect(custom.createContext({
        ctx: createTrackedContext().ctx as unknown as CanvasRenderingContext2D,
        theme: createMockTheme(),
        layoutManager: {} as CellRendererContext["layoutManager"],
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        column: { key: "c", title: "C", width: 1, type: "text" } as Column,
        row: { id: "r", data: {} } as Row,
        rowIndex: 0,
        colIndex: 0,
        value: null,
        isDisabled: false,
        isHovered: false,
        isSelected: false,
        dpr: 1,
      }).locale).toBe(enUS);
    });
  });

  describe("性能监控", () => {
    it("默认关闭", () => {
      expect(registry.isPerformanceMonitoringEnabled()).toBe(false);
    });

    it("可以开启和关闭", () => {
      registry.setPerformanceMonitoring(true);
      expect(registry.isPerformanceMonitoringEnabled()).toBe(true);

      registry.setPerformanceMonitoring(false);
      expect(registry.isPerformanceMonitoringEnabled()).toBe(false);
    });

    it("多次取到同一个全局监控实例", () => {
      expect(registry.getPerformanceMonitor()).toBe(registry.getPerformanceMonitor());
      expect(registry.getPerformanceMonitor()).toBe(
        new CellRendererRegistry().getPerformanceMonitor(),
      );
    });

    it("关闭状态下 render 不记录统计", () => {
      const monitor = registry.getPerformanceMonitor();
      registry.setPerformanceMonitoring(false);

      registry.render(context());

      expect(monitor.getStats("text")).toBeUndefined();
    });

    it("开启状态下 render 会记录统计", () => {
      const monitor = registry.getPerformanceMonitor();
      registry.setPerformanceMonitoring(true);
      registry.startFrame();

      registry.render(context());
      registry.render(context());

      registry.endFrame();

      const stats = monitor.getStats("text");
      expect(stats?.callCount).toBe(2);
      expect(monitor.getFrameHistory()).toHaveLength(1);
    });

    it("startFrame / endFrame 在关闭状态下是空操作", () => {
      const monitor = registry.getPerformanceMonitor();
      registry.setPerformanceMonitoring(false);

      registry.startFrame();
      registry.endFrame();

      expect(monitor.getFrameHistory()).toHaveLength(0);
    });

    it("开启时按实际 cell type 记账", () => {
      const monitor = registry.getPerformanceMonitor();
      registry.setPerformanceMonitoring(true);

      registry.render(context({ column: { key: "c", title: "C", width: 100, type: "number" } }));

      expect(monitor.getStats("number")?.callCount).toBe(1);
      expect(monitor.getStats("text")).toBeUndefined();
    });

    it("未注册类型按回退后的 cellType 记账", () => {
      const monitor = registry.getPerformanceMonitor();
      registry.setPerformanceMonitoring(true);

      registry.render(context({ column: { key: "c", title: "C", width: 100, type: "boolean" } }));

      expect(monitor.getStats("boolean")?.callCount).toBe(1);
    });
  });
});
