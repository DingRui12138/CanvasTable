import { FilterInputManager } from "@/core/FilterInputManager";
import { EventEmitter } from "@/core/EventEmitter";
import { zhCN } from "@/locale";
import type { FilterDropdownState } from "@/types";
import { createMockTheme } from "../helpers/mockFactories";

type EmitterArg = ConstructorParameters<typeof FilterInputManager>[1];

function setup() {
  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  const emitter = new EventEmitter() as unknown as EmitterArg;
  const theme = createMockTheme();
  const manager = new FilterInputManager(wrapper, emitter, theme, zhCN);

  return { manager, wrapper, emitter, theme };
}

function dropdown(overrides: Partial<FilterDropdownState> = {}): FilterDropdownState {
  return {
    columnKey: "name",
    mode: "search",
    x: 100,
    y: 50,
    width: 200,
    scrollTop: 0,
    hoveredIndex: -1,
    searchText: "",
    ...overrides,
  };
}

function inputs(wrapper: HTMLElement): HTMLInputElement[] {
  return Array.from(wrapper.querySelectorAll("input"));
}

function fire(el: HTMLInputElement, value: string): void {
  el.value = value;
  el.dispatchEvent(new Event("input"));
}

/**
 * jsdom 会把 `#1890ff` 这类颜色归一化成 `rgb(24, 144, 255)` 再写回 style。
 * 借助浏览器自身的 CSS 解析做同样的归一化，避免把断言写死在某种序列化格式上。
 */
function css(color: string): string {
  const probe = document.createElement("div");
  probe.style.color = color;
  return probe.style.color;
}

afterEach(() => {
  document.body.innerHTML = "";
  jest.useRealTimers();
});

describe("FilterInputManager", () => {
  describe("生命周期", () => {
    it("初始状态下没有任何输入框", () => {
      const { wrapper } = setup();

      expect(wrapper.children).toHaveLength(0);
    });

    it("destroy 会移除所有输入框", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      expect(inputs(wrapper)).toHaveLength(2);

      manager.destroy();

      expect(wrapper.children).toHaveLength(0);
    });

    it("未创建输入框时 destroy 是安全的", () => {
      const { manager } = setup();

      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe("updateFilterDropdown(null)", () => {
    it("关闭下拉框时移除输入框", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());
      expect(inputs(wrapper)).toHaveLength(1);

      manager.updateFilterDropdown(null);

      expect(wrapper.children).toHaveLength(0);
    });

    it("关闭后会重置模式，下次打开重新创建输入框", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());
      const first = inputs(wrapper)[0]!;

      manager.updateFilterDropdown(null);
      manager.updateFilterDropdown(dropdown());

      const second = inputs(wrapper)[0]!;
      expect(second).not.toBe(first);
      expect(wrapper.children).toHaveLength(1);
    });
  });

  describe("search 模式", () => {
    it("创建 text 输入框并写入初始值", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ searchValue: "abc" }));

      const input = inputs(wrapper)[0]!;
      expect(input.type).toBe("text");
      expect(input.value).toBe("abc");
      expect(input.placeholder).toBe(zhCN.filter.searchPlaceholder);
    });

    it("searchValue 缺省时值为空字符串", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown());

      expect(inputs(wrapper)[0]!.value).toBe("");
    });

    it("按 x/y/width 加内边距定位", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown());

      const input = inputs(wrapper)[0]!;
      expect(input.style.left).toBe("108px");
      expect(input.style.top).toBe("58px");
      expect(input.style.width).toBe("184px");
      expect(input.style.height).toBe("36px");
    });

    it("输入时回调字段名为 searchValue", () => {
      const { manager, wrapper } = setup();
      const onChange = jest.fn();
      manager.setOnInputChange(onChange);
      manager.updateFilterDropdown(dropdown());

      fire(inputs(wrapper)[0]!, "hello");

      expect(onChange).toHaveBeenCalledWith("hello", "searchValue");
    });

    it("未注册回调时输入不会抛错", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());

      expect(() => fire(inputs(wrapper)[0]!, "x")).not.toThrow();
    });

    it("获得焦点时边框变高亮，失焦后恢复", () => {
      const { manager, wrapper, theme } = setup();
      manager.updateFilterDropdown(dropdown());
      const input = inputs(wrapper)[0]!;

      input.dispatchEvent(new Event("focus"));
      expect(input.style.borderColor).toBe(css(theme.colors.input.focusBorder));

      input.dispatchEvent(new Event("blur"));
      expect(input.style.borderColor).toBe(css(theme.colors.input.border));
    });

    it("创建后通过 requestAnimationFrame 自动聚焦", () => {
      jest.useFakeTimers();
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown());
      jest.runOnlyPendingTimers();

      expect(document.activeElement).toBe(inputs(wrapper)[0]);
    });
  });

  describe("select 模式", () => {
    it("使用搜索占位符并读取 searchText", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "select", searchText: "k" }));

      const input = inputs(wrapper)[0]!;
      expect(input.type).toBe("text");
      expect(input.value).toBe("k");
      expect(input.placeholder).toBe(zhCN.filter.selectSearchPlaceholder);
    });

    it("高度为 36 减去内边距", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "select" }));

      expect(inputs(wrapper)[0]!.style.height).toBe("28px");
    });

    it("输入时回调字段名为 searchText", () => {
      const { manager, wrapper } = setup();
      const onChange = jest.fn();
      manager.setOnInputChange(onChange);
      manager.updateFilterDropdown(dropdown({ mode: "select" }));

      fire(inputs(wrapper)[0]!, "abc");

      expect(onChange).toHaveBeenCalledWith("abc", "searchText");
    });

    it("searchText 缺省时值为空字符串", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "select" }));

      expect(inputs(wrapper)[0]!.value).toBe("");
    });

    it("获得焦点时边框变高亮，失焦后恢复", () => {
      const { manager, wrapper, theme } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select" }));
      const input = inputs(wrapper)[0]!;

      input.dispatchEvent(new Event("focus"));
      expect(input.style.borderColor).toBe(css(theme.colors.input.focusBorder));

      input.dispatchEvent(new Event("blur"));
      expect(input.style.borderColor).toBe(css(theme.colors.input.border));
    });

    it("未注册回调时输入不会抛错", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select" }));

      expect(() => fire(inputs(wrapper)[0]!, "x")).not.toThrow();
    });

    it("输入框被移除后旧元素上的 input 事件不会触发回调", () => {
      const { manager, wrapper } = setup();
      const onChange = jest.fn();
      manager.setOnInputChange(onChange);
      manager.updateFilterDropdown(dropdown({ mode: "select" }));
      const stale = inputs(wrapper)[0]!;
      manager.removeInputs();

      stale.dispatchEvent(new Event("input"));

      expect(onChange).not.toHaveBeenCalled();
    });

    it("创建后通过 requestAnimationFrame 自动聚焦", () => {
      jest.useFakeTimers();
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "select" }));
      jest.runOnlyPendingTimers();

      expect(document.activeElement).toBe(inputs(wrapper)[0]);
    });
  });

  describe("range 模式", () => {
    it("创建两个 number 输入框", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "range" }));

      const list = inputs(wrapper);
      expect(list).toHaveLength(2);
      expect(list.map((i) => i.type)).toEqual(["number", "number"]);
    });

    it("两个输入框按 (width - 3*padding) / 2 平分宽度", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "range" }));

      const [min, max] = inputs(wrapper);
      // inputWidth = (200 - 24) / 2 = 88
      expect(min!.style.left).toBe("108px");
      expect(min!.style.width).toBe("88px");
      expect(max!.style.left).toBe("204px");
      expect(max!.style.width).toBe("88px");
      expect(min!.style.top).toBe("58px");
      expect(max!.style.top).toBe("58px");
    });

    it("写入 min/max 值与占位符", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: 5, maxValue: 10 }));

      const [min, max] = inputs(wrapper);
      expect(min!.value).toBe("5");
      expect(max!.value).toBe("10");
      expect(min!.placeholder).toBe(zhCN.filter.minPlaceholder);
      expect(max!.placeholder).toBe(zhCN.filter.maxPlaceholder);
    });

    it("min/max 缺省或空字符串时值为空", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: "", maxValue: undefined }));

      const [min, max] = inputs(wrapper);
      expect(min!.value).toBe("");
      expect(max!.value).toBe("");
    });

    it("两个输入框的回调字段分别为 minValue / maxValue", () => {
      const { manager, wrapper } = setup();
      const onChange = jest.fn();
      manager.setOnInputChange(onChange);
      manager.updateFilterDropdown(dropdown({ mode: "range" }));

      const [min, max] = inputs(wrapper);
      fire(min!, "1");
      fire(max!, "9");

      expect(onChange).toHaveBeenNthCalledWith(1, "1", "minValue");
      expect(onChange).toHaveBeenNthCalledWith(2, "9", "maxValue");
    });

    it("创建后聚焦最小值输入框", () => {
      jest.useFakeTimers();
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      jest.runOnlyPendingTimers();

      expect(document.activeElement).toBe(inputs(wrapper)[0]);
    });

    it("最小值输入框焦点态切换边框色", () => {
      const { manager, wrapper, theme } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      const [min] = inputs(wrapper);

      min!.dispatchEvent(new Event("focus"));
      expect(min!.style.borderColor).toBe(css(theme.colors.input.focusBorder));

      min!.dispatchEvent(new Event("blur"));
      expect(min!.style.borderColor).toBe(css(theme.colors.input.border));
    });

    it("最大值输入框焦点态切换边框色", () => {
      const { manager, wrapper, theme } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      const [, max] = inputs(wrapper);

      max!.dispatchEvent(new Event("focus"));
      expect(max!.style.borderColor).toBe(css(theme.colors.input.focusBorder));

      max!.dispatchEvent(new Event("blur"));
      expect(max!.style.borderColor).toBe(css(theme.colors.input.border));
    });

    it("未注册回调时输入不会抛错", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      const [min, max] = inputs(wrapper);

      expect(() => {
        fire(min!, "1");
        fire(max!, "2");
      }).not.toThrow();
    });

    it("输入框被移除后旧元素上的 input 事件不会触发回调", () => {
      const { manager, wrapper } = setup();
      const onChange = jest.fn();
      manager.setOnInputChange(onChange);
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      const [min, max] = inputs(wrapper);
      manager.removeInputs();

      min!.dispatchEvent(new Event("input"));
      max!.dispatchEvent(new Event("input"));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("dateRange 模式", () => {
    it("不创建任何输入框", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "dateRange" }));

      expect(wrapper.children).toHaveLength(0);
    });

    it("重复打开同一日期范围筛选器也不会创建输入框", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "dateRange" }));

      expect(() =>
        manager.updateFilterDropdown(dropdown({ mode: "dateRange", x: 120 })),
      ).not.toThrow();
      expect(wrapper.children).toHaveLength(0);
    });
  });

  describe("重建判定", () => {
    it("模式与列都不变时复用同一个输入框", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());
      const first = inputs(wrapper)[0]!;

      manager.updateFilterDropdown(dropdown({ x: 150 }));

      const second = inputs(wrapper)[0]!;
      expect(second).toBe(first);
      expect(second.style.left).toBe("158px");
    });

    it("列变化时重建输入框", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ columnKey: "a" }));
      const first = inputs(wrapper)[0]!;

      manager.updateFilterDropdown(dropdown({ columnKey: "b" }));

      expect(inputs(wrapper)[0]).not.toBe(first);
    });

    it("模式变化时重建输入框", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "search" }));
      const first = inputs(wrapper)[0]!;

      manager.updateFilterDropdown(dropdown({ mode: "select" }));

      const second = inputs(wrapper)[0]!;
      expect(second).not.toBe(first);
      expect(second.placeholder).toBe(zhCN.filter.selectSearchPlaceholder);
    });
  });

  describe("updatePosition", () => {
    it("search 模式下更新位置与值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ searchValue: "a" }));

      manager.updatePosition(dropdown({ x: 10, y: 20, width: 300, searchValue: "b" }));

      const input = inputs(wrapper)[0]!;
      expect(input.style.left).toBe("18px");
      expect(input.style.top).toBe("28px");
      expect(input.style.width).toBe("284px");
      expect(input.value).toBe("b");
    });

    it("search 模式下输入框有焦点时不覆盖值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ searchValue: "a" }));
      const input = inputs(wrapper)[0]!;
      input.focus();

      manager.updatePosition(dropdown({ searchValue: "changed" }));

      expect(input.value).toBe("a");
    });

    it("search 模式下值相同时不重复赋值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ searchValue: "same" }));
      const input = inputs(wrapper)[0]!;

      manager.updatePosition(dropdown({ searchValue: "same" }));

      expect(input.value).toBe("same");
    });

    it("select 模式下更新位置与值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select", searchText: "a" }));

      manager.updatePosition(dropdown({ mode: "select", x: 10, y: 20, width: 300, searchText: "b" }));

      const input = inputs(wrapper)[0]!;
      expect(input.style.left).toBe("18px");
      expect(input.value).toBe("b");
    });

    it("select 模式下输入框有焦点时不覆盖值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select", searchText: "a" }));
      const input = inputs(wrapper)[0]!;
      input.focus();

      manager.updatePosition(dropdown({ mode: "select", searchText: "changed" }));

      expect(input.value).toBe("a");
    });

    it("range 模式下更新位置与值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: 1, maxValue: 2 }));

      manager.updatePosition(
        dropdown({ mode: "range", x: 10, y: 20, width: 300, minValue: 3, maxValue: 4 }),
      );

      const [min, max] = inputs(wrapper);
      // inputWidth = (300 - 24) / 2 = 138
      expect(min!.style.left).toBe("18px");
      expect(min!.style.width).toBe("138px");
      expect(max!.style.left).toBe("164px");
      expect(min!.value).toBe("3");
      expect(max!.value).toBe("4");
    });

    it("range 模式下有焦点的输入框值不被覆盖", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: 1, maxValue: 2 }));
      const [min, max] = inputs(wrapper);
      min!.focus();

      manager.updatePosition(dropdown({ mode: "range", minValue: 7, maxValue: 8 }));

      expect(min!.value).toBe("1");
      expect(max!.value).toBe("8");
    });

    it("range 模式下空值写回空字符串", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: 1, maxValue: 2 }));

      manager.updatePosition(dropdown({ mode: "range", minValue: "", maxValue: undefined }));

      const [min, max] = inputs(wrapper);
      expect(min!.value).toBe("");
      expect(max!.value).toBe("");
    });

    it("输入框已被移除时安全跳过", () => {
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown());
      manager.removeInputs();

      expect(() => manager.updatePosition(dropdown())).not.toThrow();
    });

    it("range 输入框已被移除时安全跳过", () => {
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      manager.removeInputs();

      expect(() => manager.updatePosition(dropdown({ mode: "range" }))).not.toThrow();
    });

    it("输入框被移除后旧元素上的 input 事件不会触发回调", () => {
      const { manager, wrapper } = setup();
      const onChange = jest.fn();
      manager.setOnInputChange(onChange);
      manager.updateFilterDropdown(dropdown());
      const stale = inputs(wrapper)[0]!;
      manager.removeInputs();

      stale.dispatchEvent(new Event("input"));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("forceReset", () => {
    it("清空 range 两个输入框的值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: 1, maxValue: 2 }));

      manager.forceReset();

      const [min, max] = inputs(wrapper);
      expect(min!.value).toBe("");
      expect(max!.value).toBe("");
    });

    it("即使输入框有焦点也会清空", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ searchValue: "abc" }));
      const input = inputs(wrapper)[0]!;
      input.focus();

      manager.forceReset();

      expect(input.value).toBe("");
    });

    it("没有输入框时是安全的", () => {
      const { manager } = setup();

      expect(() => manager.forceReset()).not.toThrow();
    });
  });

  describe("forceUpdateValues", () => {
    it("search 模式同步值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());

      manager.forceUpdateValues(dropdown({ searchValue: "synced" }));

      expect(inputs(wrapper)[0]!.value).toBe("synced");
    });

    it("search 模式下 searchValue 缺省写空", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ searchValue: "abc" }));

      manager.forceUpdateValues(dropdown({ searchValue: undefined }));

      expect(inputs(wrapper)[0]!.value).toBe("");
    });

    it("select 模式同步值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select" }));

      manager.forceUpdateValues(dropdown({ mode: "select", searchText: "k" }));

      expect(inputs(wrapper)[0]!.value).toBe("k");
    });

    it("select 模式下 searchText 缺省写空", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select", searchText: "k" }));

      manager.forceUpdateValues(dropdown({ mode: "select", searchText: "" }));

      expect(inputs(wrapper)[0]!.value).toBe("");
    });

    it("range 模式同步两个值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));

      manager.forceUpdateValues(dropdown({ mode: "range", minValue: 3, maxValue: 9 }));

      const [min, max] = inputs(wrapper);
      expect(min!.value).toBe("3");
      expect(max!.value).toBe("9");
    });

    it("输入框为 null 时是安全的", () => {
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown());
      manager.removeInputs();

      expect(() => manager.forceUpdateValues(dropdown())).not.toThrow();
    });
  });

  describe("setTheme / setLocale", () => {
    it("setTheme 影响后续创建的输入框边框色", () => {
      const { manager, wrapper } = setup();
      const next = createMockTheme();
      next.colors.input.border = "#abcdef";
      next.colors.input.background = "#010203";

      manager.setTheme(next);
      manager.updateFilterDropdown(dropdown());

      const cssText = inputs(wrapper)[0]!.style.cssText;
      expect(cssText).toContain(css("#abcdef"));
      expect(cssText).toContain(css("#010203"));
    });

    it("setLocale 更新 search 输入框的占位符", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());

      manager.setLocale({ ...zhCN, filter: { ...zhCN.filter, searchPlaceholder: "FIND" } });

      expect(inputs(wrapper)[0]!.placeholder).toBe("FIND");
    });

    it("setLocale 在 select 模式下使用 selectSearchPlaceholder", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select" }));

      manager.setLocale({
        ...zhCN,
        filter: { ...zhCN.filter, searchPlaceholder: "FIND", selectSearchPlaceholder: "PICK" },
      });

      expect(inputs(wrapper)[0]!.placeholder).toBe("PICK");
    });

    it("setLocale 更新 range 输入框的占位符", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));

      manager.setLocale({
        ...zhCN,
        filter: { ...zhCN.filter, minPlaceholder: "MIN!", maxPlaceholder: "MAX!" },
      });

      const [min, max] = inputs(wrapper);
      expect(min!.placeholder).toBe("MIN!");
      expect(max!.placeholder).toBe("MAX!");
    });

    it("setLocale 在没有任何输入框时是安全的", () => {
      const { manager } = setup();

      expect(() => manager.setLocale(zhCN)).not.toThrow();
    });
  });

  describe("removeInputs", () => {
    it("移除后传 null 再打开会重新创建输入框", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());

      manager.removeInputs();
      expect(wrapper.children).toHaveLength(0);

      manager.updateFilterDropdown(null);
      manager.updateFilterDropdown(dropdown({ x: 1 }));

      expect(inputs(wrapper)).toHaveLength(1);
    });

    it("直接移除后再用相同模式/列打开不会重建（removeInputs 不重置内部模式）", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());

      manager.removeInputs();
      // currentMode / currentColumnKey 仍是 search / name → needRecreate 为 false，
      // 于是走 updatePositions 分支，而输入框已被置为 null，因此不会重建 DOM。
      manager.updateFilterDropdown(dropdown({ x: 1 }));

      expect(inputs(wrapper)).toHaveLength(0);
    });

    it("重复调用是安全的", () => {
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));

      manager.removeInputs();

      expect(() => manager.removeInputs()).not.toThrow();
    });
  });

  describe("默认参数与防御性分支", () => {
    it("构造时不传 locale 时默认使用 zhCN", () => {
      const wrapper = document.createElement("div");
      document.body.appendChild(wrapper);
      const manager = new FilterInputManager(
        wrapper,
        new EventEmitter() as unknown as EmitterArg,
        createMockTheme(),
      );

      manager.updateFilterDropdown(dropdown());

      expect(inputs(wrapper)[0]!.placeholder).toBe(zhCN.filter.searchPlaceholder);
    });

    it("search 模式下 searchValue 缺省时写空", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ searchValue: "abc" }));

      manager.updatePosition(dropdown({ searchValue: undefined }));

      expect(inputs(wrapper)[0]!.value).toBe("");
    });

    it("select 模式下 searchText 缺省时写空", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select", searchText: "abc" }));

      manager.updatePosition(dropdown({ mode: "select", searchText: undefined }));

      expect(inputs(wrapper)[0]!.value).toBe("");
    });

    it("select 模式下输入框已被移除时安全跳过", () => {
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select" }));
      manager.removeInputs();

      expect(() => manager.updatePosition(dropdown({ mode: "select" }))).not.toThrow();
    });

    it("range 模式下值未变化时不重复赋值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: 1, maxValue: 2 }));

      manager.updatePosition(dropdown({ mode: "range", minValue: 1, maxValue: 2 }));

      const [min, max] = inputs(wrapper);
      expect(min!.value).toBe("1");
      expect(max!.value).toBe("2");
    });

    it("输入框移除后残留元素的 focus/blur 事件是安全的", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown());
      const stale = inputs(wrapper)[0]!;
      manager.removeInputs();

      expect(() => {
        stale.dispatchEvent(new Event("focus"));
        stale.dispatchEvent(new Event("blur"));
      }).not.toThrow();
    });

    it("select 输入框移除后残留元素的 focus/blur 事件是安全的", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select" }));
      const stale = inputs(wrapper)[0]!;
      manager.removeInputs();

      expect(() => {
        stale.dispatchEvent(new Event("focus"));
        stale.dispatchEvent(new Event("blur"));
      }).not.toThrow();
    });

    it("range 输入框移除后残留元素的 focus/blur 事件是安全的", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      const [min, max] = inputs(wrapper);
      manager.removeInputs();

      expect(() => {
        min!.dispatchEvent(new Event("focus"));
        min!.dispatchEvent(new Event("blur"));
        max!.dispatchEvent(new Event("focus"));
        max!.dispatchEvent(new Event("blur"));
      }).not.toThrow();
    });

    it("search 输入框在自动聚焦前被移除时是安全的", () => {
      jest.useFakeTimers();
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown());
      manager.removeInputs();

      expect(() => jest.runOnlyPendingTimers()).not.toThrow();
    });

    it("select 输入框在自动聚焦前被移除时是安全的", () => {
      jest.useFakeTimers();
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select" }));
      manager.removeInputs();

      expect(() => jest.runOnlyPendingTimers()).not.toThrow();
    });

    it("range 输入框在自动聚焦前被移除时是安全的", () => {
      jest.useFakeTimers();
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      manager.removeInputs();

      expect(() => jest.runOnlyPendingTimers()).not.toThrow();
    });

    it("forceUpdateValues 在 select 模式且输入框为 null 时是安全的", () => {
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select" }));
      manager.removeInputs();

      expect(() =>
        manager.forceUpdateValues(dropdown({ mode: "select", searchText: "x" })),
      ).not.toThrow();
    });

    it("forceUpdateValues 在 range 模式且输入框为 null 时是安全的", () => {
      const { manager } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range" }));
      manager.removeInputs();

      expect(() =>
        manager.forceUpdateValues(dropdown({ mode: "range", minValue: 1, maxValue: 2 })),
      ).not.toThrow();
    });

    it("select 模式创建时 searchText 缺省写空", () => {
      const { manager, wrapper } = setup();

      manager.updateFilterDropdown(dropdown({ mode: "select", searchText: undefined }));

      expect(inputs(wrapper)[0]!.value).toBe("");
    });

    it("select 模式下值未变化时不重复赋值", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select", searchText: "same" }));

      manager.updatePosition(dropdown({ mode: "select", searchText: "same" }));

      expect(inputs(wrapper)[0]!.value).toBe("same");
    });

    it("range 模式下最大值输入框有焦点时不被覆盖", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: 1, maxValue: 2 }));
      const [min, max] = inputs(wrapper);
      max!.focus();

      manager.updatePosition(dropdown({ mode: "range", minValue: 7, maxValue: 8 }));

      expect(min!.value).toBe("7");
      expect(max!.value).toBe("2");
    });

    it("forceUpdateValues 在 select 模式且 searchText 缺省时写空", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "select", searchText: "abc" }));

      manager.forceUpdateValues(dropdown({ mode: "select", searchText: undefined }));

      expect(inputs(wrapper)[0]!.value).toBe("");
    });

    it("forceUpdateValues 在 range 模式且 min/max 为空时写空", () => {
      const { manager, wrapper } = setup();
      manager.updateFilterDropdown(dropdown({ mode: "range", minValue: 1, maxValue: 2 }));

      manager.forceUpdateValues(dropdown({ mode: "range", minValue: undefined, maxValue: "" }));

      const [min, max] = inputs(wrapper);
      expect(min!.value).toBe("");
      expect(max!.value).toBe("");
    });
  });
});
