import {
  getColumnField,
  formatNumber,
  formatPercent,
  formatDate,
  formatBoolean,
  truncateText,
  generateId,
  debounce,
  throttle,
  clamp,
  deepClone,
  isEqual,
  getNestedValue,
  setNestedValue,
  binarySearch,
  measureText,
  calculateMaxTextRows,
  layoutWrappedText,
  layoutTags,
  getDevicePixelRatio,
  createCanvas,
  requestAnimationFrameThrottle,
  isPromise,
  downloadBlob,
  arrayToCsv,
  resolveDisabled,
  getRenderResult,
  getCellDisplayText,
  LRUCache,
  getFilterModeByColumnType,
  getColumnFilterOptions,
  searchFilterOptions,
  FILTER_SAMPLE_ROWS,
  FILTER_SEARCH_LIMIT,
} from "@/utils";
import type { Column, Row, RenderResult, TagItem, TagsConfig } from "@/types";
import { createMockCanvasContext } from "../helpers/mockFactories";

/** 构造列 */
function col(overrides: Partial<Column> = {}): Column {
  return { key: "k", title: "K", width: 100, ...overrides };
}

/** 构造行 */
function row(data: Record<string, unknown>, id = "r0"): Row {
  return { id, data };
}

/** 一行数据里带某个字段的行集合 */
function rows(values: unknown[], field = "k"): Row[] {
  return values.map((v, i) => ({ id: `r${i}`, data: { [field]: v } }));
}

describe("utils", () => {
  describe("getColumnField", () => {
    it("优先使用 field", () => {
      expect(getColumnField(col({ key: "k", field: "f" }))).toBe("f");
    });

    it("没有 field 时回退到 key", () => {
      expect(getColumnField(col({ key: "k" }))).toBe("k");
    });

    it("field 为空字符串时仍然使用它（?? 只拦 null/undefined）", () => {
      expect(getColumnField(col({ key: "k", field: "" }))).toBe("");
    });
  });

  describe("formatNumber", () => {
    it("默认加千分位", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("负数同样加千分位", () => {
      expect(formatNumber(-1234567)).toBe("-1,234,567");
    });

    it("四位数开始出现分隔符", () => {
      expect(formatNumber(999)).toBe("999");
      expect(formatNumber(1000)).toBe("1,000");
    });

    it("零保持不变", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("decimalPlaces 走 toFixed 且小数部分不被加分隔符", () => {
      expect(formatNumber(1234.5678, { decimalPlaces: 2 })).toBe("1,234.57");
    });

    it("decimalPlaces 为 0 时取整", () => {
      expect(formatNumber(1234567.89, { decimalPlaces: 0 })).toBe("1,234,568");
    });

    it("thousandSeparator 为 false 时不加分隔符", () => {
      expect(formatNumber(1234567, { thousandSeparator: false })).toBe("1234567");
    });

    it("prefix / suffix 包在两端", () => {
      expect(formatNumber(1234, { prefix: "$", suffix: " USD" })).toBe("$1,234 USD");
    });

    it("非有限数直接返回字符串形式", () => {
      expect(formatNumber(Infinity)).toBe("Infinity");
      expect(formatNumber(-Infinity)).toBe("-Infinity");
      expect(formatNumber(NaN)).toBe("NaN");
    });

    it("空 options 等价于默认值", () => {
      expect(formatNumber(1234, {})).toBe("1,234");
    });
  });

  describe("formatPercent", () => {
    it("默认保留两位小数并补 %", () => {
      expect(formatPercent(0.1234)).toBe("12.34%");
    });

    it("可指定小数位", () => {
      expect(formatPercent(0.1234, 1)).toBe("12.3%");
      expect(formatPercent(0.5, 0)).toBe("50%");
    });

    it("大于 1 的比例正常放大", () => {
      expect(formatPercent(2.5)).toBe("250.00%");
    });

    it("超过千分位阈值时带上分隔符", () => {
      expect(formatPercent(12.3456, 2)).toBe("1,234.56%");
    });
  });

  describe("formatDate", () => {
    it("默认格式为 YYYY-MM-DD", () => {
      expect(formatDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    });

    it("月日补零", () => {
      expect(formatDate(new Date(2026, 8, 9))).toBe("2026-09-09");
    });

    it("支持自定义格式", () => {
      expect(formatDate(new Date(2026, 8, 28, 13, 40, 56), "YYYY-MM-DD HH:mm:ss")).toBe(
        "2026-09-28 13:40:56",
      );
    });

    it("支持时间戳", () => {
      expect(formatDate(new Date(2026, 0, 5).getTime())).toBe("2026-01-05");
    });

    it("支持可解析的字符串", () => {
      expect(formatDate("2026-01-05T12:00:00")).toBe("2026-01-05");
    });

    it("无法解析时原样返回输入", () => {
      expect(formatDate("not-a-date")).toBe("not-a-date");
    });

    it("非法 Date 对象返回其字符串形式", () => {
      expect(formatDate(new Date(NaN))).toBe("Invalid Date");
    });

    it("格式串里未出现的占位符保持原样", () => {
      expect(formatDate(new Date(2026, 0, 5), "YYYY/MM")).toBe("2026/01");
    });
  });

  describe("formatBoolean", () => {
    it("默认文案为 Yes / No", () => {
      expect(formatBoolean(true)).toBe("Yes");
      expect(formatBoolean(false)).toBe("No");
    });

    it("可自定义文案", () => {
      expect(formatBoolean(true, "是", "否")).toBe("是");
      expect(formatBoolean(false, "是", "否")).toBe("否");
    });
  });

  describe("truncateText", () => {
    it("长度未超限时原样返回", () => {
      expect(truncateText("hello", 5)).toBe("hello");
      expect(truncateText("hi", 5)).toBe("hi");
    });

    it("超限时截断并补省略号", () => {
      expect(truncateText("hello world", 5)).toBe("he...");
    });

    it("省略号占用的长度计入 maxLength", () => {
      expect(truncateText("hello world", 5).length).toBe(5);
    });

    it("可自定义省略号", () => {
      expect(truncateText("hello world", 8, "…")).toBe("hello w…");
    });

    it("maxLength 小于省略号长度时 slice 负索引会反而变长（已知怪癖）", () => {
      // slice(0, 2 - 3) === slice(0, -1) → 去掉最后一个字符
      expect(truncateText("abcdef", 2)).toBe("abcde...");
    });
  });

  describe("generateId", () => {
    it("形如 时间戳-随机串", () => {
      expect(generateId()).toMatch(/^\d+-[a-z0-9]*$/);
    });

    it("连续调用不重复", () => {
      const ids = new Set(Array.from({ length: 50 }, () => generateId()));
      expect(ids.size).toBe(50);
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("延迟结束前只执行最后一次", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced(1);
      debounced(2);
      debounced(3);

      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(3);
    });

    it("重新调用会重置计时", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced("a");
      jest.advanceTimersByTime(60);
      debounced("b");
      jest.advanceTimersByTime(60);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(40);
      expect(fn).toHaveBeenCalledWith("b");
    });

    it("执行完之后可以再次触发", () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 50);

      debounced(1);
      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);

      debounced(2);
      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith(2);
    });
  });

  describe("throttle", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("窗口期内只执行第一次", () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled(1);
      throttled(2);
      throttled(3);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(1);
    });

    it("窗口期结束后可以再次执行", () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled(1);
      jest.advanceTimersByTime(100);
      throttled(2);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith(2);
    });

    it("窗口期未结束时依然被丢弃", () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled(1);
      jest.advanceTimersByTime(99);
      throttled(2);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("clamp", () => {
    it("低于下界时取 min", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("高于上界时取 max", () => {
      expect(clamp(50, 0, 10)).toBe(10);
    });

    it("区间内原样返回", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("边界值原样返回", () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe("deepClone", () => {
    it("null 原样返回", () => {
      expect(deepClone(null)).toBeNull();
    });

    it("原始值原样返回", () => {
      expect(deepClone(5)).toBe(5);
      expect(deepClone("x")).toBe("x");
      expect(deepClone(false)).toBe(false);
    });

    it("对象深拷贝且不共享引用", () => {
      const src = { a: 1, b: { c: [1, 2, { d: 3 }] } };
      const copy = deepClone(src);

      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);
      expect(copy.b).not.toBe(src.b);
      expect(copy.b.c).not.toBe(src.b.c);
    });

    it("数组深拷贝", () => {
      const src = [1, [2, 3]];
      const copy = deepClone(src);

      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);
      expect(copy[1]).not.toBe(src[1]);
    });

    it("修改副本不影响原对象", () => {
      const src = { a: { b: 1 } };
      const copy = deepClone(src);

      copy.a.b = 99;

      expect(src.a.b).toBe(1);
    });
  });

  describe("isEqual", () => {
    it("同引用 / 同原始值相等", () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual("a", "a")).toBe(true);
      expect(isEqual(null, null)).toBe(true);
      expect(isEqual(undefined, undefined)).toBe(true);
    });

    it("类型不同不等", () => {
      expect(isEqual(1, "1")).toBe(false);
      expect(isEqual(null, undefined)).toBe(false);
    });

    it("null 与对象不等", () => {
      expect(isEqual(null, {})).toBe(false);
      expect(isEqual({}, null)).toBe(false);
    });

    it("原始值不同不等", () => {
      expect(isEqual("a", "b")).toBe(false);
      expect(isEqual(1, 2)).toBe(false);
    });

    it("数组与对象不等", () => {
      expect(isEqual([], {})).toBe(false);
    });

    it("键数量不同不等", () => {
      expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it("键名不同不等", () => {
      expect(isEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it("嵌套值不同不等", () => {
      expect(isEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it("结构相同则相等", () => {
      expect(isEqual({ a: 1, b: [1, { c: 2 }] }, { a: 1, b: [1, { c: 2 }] })).toBe(true);
    });

    it("数组元素顺序敏感", () => {
      expect(isEqual([1, 2], [2, 1])).toBe(false);
    });
  });

  describe("getNestedValue", () => {
    it("按路径取值", () => {
      expect(getNestedValue({ a: { b: { c: 1 } } }, "a.b.c")).toBe(1);
    });

    it("单层路径", () => {
      expect(getNestedValue({ a: 1 }, "a")).toBe(1);
    });

    it("中间是原始值时返回 undefined", () => {
      expect(getNestedValue({ a: 1 }, "a.b")).toBeUndefined();
    });

    it("路径中间为 null 时返回 undefined", () => {
      expect(getNestedValue({ a: null }, "a.b")).toBeUndefined();
    });

    it("键不存在时返回 undefined", () => {
      expect(getNestedValue({}, "x.y")).toBeUndefined();
    });

    it("可以取到数组下标", () => {
      expect(getNestedValue({ a: [10, 20] }, "a.1")).toBe(20);
    });
  });

  describe("setNestedValue", () => {
    it("自动创建中间对象", () => {
      const obj: Record<string, unknown> = {};

      setNestedValue(obj, "a.b.c", 1);

      expect(obj).toEqual({ a: { b: { c: 1 } } });
    });

    it("覆盖已有值", () => {
      const obj: Record<string, unknown> = { a: { b: 1 } };

      setNestedValue(obj, "a.b", 2);

      expect(obj).toEqual({ a: { b: 2 } });
    });

    it("中间值为 null 时替换成对象", () => {
      const obj: Record<string, unknown> = { a: null };

      setNestedValue(obj, "a.b", 1);

      expect(obj).toEqual({ a: { b: 1 } });
    });

    it("单层路径直接赋值", () => {
      const obj: Record<string, unknown> = {};

      setNestedValue(obj, "a", 1);

      expect(obj).toEqual({ a: 1 });
    });

    it("保留已有的兄弟字段", () => {
      const obj: Record<string, unknown> = { a: { keep: true } };

      setNestedValue(obj, "a.b", 1);

      expect(obj).toEqual({ a: { keep: true, b: 1 } });
    });
  });

  describe("binarySearch", () => {
    const arr = [1, 3, 5, 7, 9];
    const id = (n: number) => n;

    it("命中时返回下标", () => {
      expect(binarySearch(arr, 5, id)).toBe(2);
    });

    it("命中首尾元素", () => {
      expect(binarySearch(arr, 1, id)).toBe(0);
      expect(binarySearch(arr, 9, id)).toBe(4);
    });

    it("未命中时返回插入位置", () => {
      expect(binarySearch(arr, 4, id)).toBe(2);
      expect(binarySearch(arr, 0, id)).toBe(0);
      expect(binarySearch(arr, 10, id)).toBe(5);
    });

    it("空数组返回 0", () => {
      expect(binarySearch<number>([], 5, id)).toBe(0);
    });

    it("支持自定义取值器", () => {
      const items = [{ v: 1 }, { v: 5 }, { v: 9 }];

      expect(binarySearch(items, 5, (i) => i.v)).toBe(1);
      expect(binarySearch(items, 7, (i) => i.v)).toBe(2);
    });
  });

  describe("measureText", () => {
    it("设置字体并返回宽高", () => {
      const ctx = createMockCanvasContext();

      const result = measureText(ctx, "abc", 13, "sans-serif");

      expect(ctx.font).toBe("13px sans-serif");
      // mock 的估算方式：每个字符 7px
      expect(result).toEqual({ width: 21, height: 13 });
    });

    it("空文本宽度为 0", () => {
      expect(measureText(createMockCanvasContext(), "", 13, "sans").width).toBe(0);
    });
  });

  describe("calculateMaxTextRows", () => {
    it("按上下各 8px 内边距计算", () => {
      expect(calculateMaxTextRows(100, 16)).toBe(5);
    });

    it("结果至少为 1", () => {
      expect(calculateMaxTextRows(10, 16)).toBe(1);
    });

    it("可自定义内边距", () => {
      expect(calculateMaxTextRows(100, 16, 0)).toBe(6);
    });

    it("正好整除时取整数值", () => {
      expect(calculateMaxTextRows(48, 16)).toBe(2);
    });
  });

  describe("layoutWrappedText", () => {
    const ctx = () => createMockCanvasContext();

    it("按最大宽度折行", () => {
      // 每字符 7px，maxWidth 21 → 每行 3 个字符
      expect(layoutWrappedText(ctx(), "abcdef", 21, 3)).toEqual({
        lines: ["abc", "def"],
        isTruncated: false,
      });
    });

    it("超出最大行数时截断并给最后一行加省略号", () => {
      expect(layoutWrappedText(ctx(), "abcdefghi", 21, 2)).toEqual({
        lines: ["abc", "..."],
        isTruncated: true,
      });
    });

    it("单字符就超宽时每行放一个字符", () => {
      expect(layoutWrappedText(ctx(), "abcdef", 5, 3)).toEqual({
        lines: ["a", "b", "..."],
        isTruncated: true,
      });
    });

    it("空文本返回空行数组", () => {
      expect(layoutWrappedText(ctx(), "", 21, 2)).toEqual({ lines: [], isTruncated: false });
    });

    it("一行放得下时不做截断", () => {
      expect(layoutWrappedText(ctx(), "abc", 100, 2)).toEqual({
        lines: ["abc"],
        isTruncated: false,
      });
    });
  });

  describe("layoutTags", () => {
    const ctx = () => createMockCanvasContext();
    const tag = (text: string): TagItem => ({ text });

    it("短标签全部排在首行", () => {
      const config: TagsConfig = { tags: [tag("a"), tag("b"), tag("c")] };

      const result = layoutTags(ctx(), config, 200, 100, 12);

      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]!.map((i) => i.displayText)).toEqual(["a", "b", "c"]);
      expect(result.processedTags).toBe(3);
      expect(result.isTruncated).toBe(false);
    });

    it("标签宽度包含左右各 4px 内边距", () => {
      const config: TagsConfig = { tags: [tag("ab")] };

      const result = layoutTags(ctx(), config, 200, 100, 12);

      // measureText("ab") = 14，加 8 内边距
      expect(result.lines[0]![0]!.width).toBe(22);
    });

    it("放不下时换行", () => {
      const config: TagsConfig = { tags: [tag("aa"), tag("bb"), tag("cc")] };

      // availableWidth = 44，每个标签 22 + 4 间隙 → 一行只放得下一个
      const result = layoutTags(ctx(), config, 60, 100, 12);

      expect(result.lines.map((l) => l.map((i) => i.displayText))).toEqual([["aa"], ["bb"], ["cc"]]);
      expect(result.isTruncated).toBe(false);
    });

    it("受 maxRows 限制", () => {
      const config: TagsConfig = { tags: [tag("aa"), tag("bb"), tag("cc"), tag("dd")], maxRows: 2 };

      const result = layoutTags(ctx(), config, 60, 100, 12);

      expect(result.lines.map((l) => l.map((i) => i.displayText))).toEqual([["aa"], ["bb"]]);
      expect(result.processedTags).toBe(2);
      expect(result.isTruncated).toBe(true);
    });

    it("末行为剩余标签预留 +N 角标空间", () => {
      const config: TagsConfig = { tags: [tag("aa"), tag("bbbbbbbbbb")], maxRows: 1 };

      // availableWidth 44；+1 角标宽 22 + 4 = 26 → 剩余 18 < 标签宽 22
      const result = layoutTags(ctx(), config, 60, 100, 12);

      expect(result.lines).toEqual([]);
      expect(result.processedTags).toBe(0);
      expect(result.isTruncated).toBe(true);
    });

    it("末行空间不足时把标签截断成 前缀+省略号", () => {
      const config: TagsConfig = { tags: [tag("abcdefghij")], maxRows: 1 };

      // availableWidth 44；truncatedTagSpace 44 >= 8 + 21 + 10
      const result = layoutTags(ctx(), config, 60, 100, 12);

      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]![0]!.displayText).toBe("ab...");
      expect(result.lines[0]![0]!.width).toBe(43);
    });

    it("截断标签不会被计入 isTruncated（按标签数而非文本计）", () => {
      const config: TagsConfig = { tags: [tag("abcdefghij")], maxRows: 1 };

      const result = layoutTags(ctx(), config, 60, 100, 12);

      expect(result.processedTags).toBe(1);
      expect(result.isTruncated).toBe(false);
    });

    it("剩余空间连省略号都放不下时直接放弃该标签", () => {
      const config: TagsConfig = { tags: [tag("abcdefghij")], maxRows: 1 };

      // availableWidth 24 → 24 < 8 + 21 + 10
      const result = layoutTags(ctx(), config, 40, 100, 12);

      expect(result.lines).toEqual([]);
      expect(result.processedTags).toBe(0);
    });

    it("没有 tags 时返回空结果", () => {
      const result = layoutTags(ctx(), { tags: [] }, 200, 100, 12);

      expect(result).toEqual({ lines: [], processedTags: 0, isTruncated: false });
    });

    it("自动行数由高度推导", () => {
      // tagHeight 20，lineGap 2 → 每行 22；高度 100 → (100-16)/22 = 3 行
      const config: TagsConfig = { tags: [tag("a"), tag("b"), tag("c"), tag("d")] };

      const result = layoutTags(ctx(), config, 60, 100, 12);

      expect(result.lines.length).toBeLessThanOrEqual(3);
    });

    it("相同文本只测量一次（内部有宽度缓存）", () => {
      const c = ctx();
      const spy = jest.spyOn(c, "measureText");

      layoutTags(c, { tags: [tag("a"), tag("a"), tag("a")] }, 200, 100, 12);

      expect(spy.mock.calls.filter((call) => call[0] === "a")).toHaveLength(1);
      spy.mockRestore();
    });
  });

  describe("getDevicePixelRatio", () => {
    const original = window.devicePixelRatio;

    afterEach(() => {
      Object.defineProperty(window, "devicePixelRatio", { value: original, configurable: true });
    });

    it("读取 window.devicePixelRatio", () => {
      Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });

      expect(getDevicePixelRatio()).toBe(2);
    });

    it("为 0 时回退到 1", () => {
      Object.defineProperty(window, "devicePixelRatio", { value: 0, configurable: true });

      expect(getDevicePixelRatio()).toBe(1);
    });

    it("为 undefined 时回退到 1", () => {
      Object.defineProperty(window, "devicePixelRatio", { value: undefined, configurable: true });

      expect(getDevicePixelRatio()).toBe(1);
    });
  });

  describe("createCanvas", () => {
    it("按 dpr 放大位图尺寸并设置 CSS 尺寸", () => {
      Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });

      const { canvas } = createCanvas(100, 50);

      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(100);
      expect(canvas.style.width).toBe("100px");
      expect(canvas.style.height).toBe("50px");
    });

    it("对上下文按 dpr 缩放", () => {
      Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
      const scale = jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
        scale: jest.fn(),
      } as unknown as CanvasRenderingContext2D);

      const { ctx } = createCanvas(10, 10);

      expect((ctx as unknown as { scale: jest.Mock }).scale).toHaveBeenCalledWith(2, 2);
      scale.mockRestore();
    });

    it("拿不到 2D 上下文时抛错", () => {
      const spy = jest
        .spyOn(HTMLCanvasElement.prototype, "getContext")
        .mockReturnValue(null as unknown as CanvasRenderingContext2D);

      expect(() => createCanvas(10, 10)).toThrow("Failed to get 2D context");

      spy.mockRestore();
    });
  });

  describe("requestAnimationFrameThrottle", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("同一帧内只执行一次并带上最后一次参数", () => {
      const fn = jest.fn();
      const throttled = requestAnimationFrameThrottle(fn);

      throttled(1);
      throttled(2);

      expect(fn).not.toHaveBeenCalled();
      jest.advanceTimersByTime(16);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(2);
    });

    it("下一帧可以再次调度", () => {
      const fn = jest.fn();
      const throttled = requestAnimationFrameThrottle(fn);

      throttled(1);
      jest.advanceTimersByTime(16);
      throttled(2);
      jest.advanceTimersByTime(16);

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("isPromise", () => {
    it("Promise 为 true", () => {
      expect(isPromise(Promise.resolve())).toBe(true);
    });

    it("thenable 为 true", () => {
      expect(isPromise({ then: () => undefined })).toBe(true);
    });

    it("null / undefined 为 false", () => {
      expect(isPromise(null)).toBe(false);
      expect(isPromise(undefined)).toBe(false);
    });

    it("普通值与非 thenable 对象为 false", () => {
      expect(isPromise("x")).toBe(false);
      expect(isPromise(1)).toBe(false);
      expect(isPromise({})).toBe(false);
      expect(isPromise({ then: 1 })).toBe(false);
    });
  });

  describe("downloadBlob", () => {
    let createObjectURL: jest.Mock;
    let revokeObjectURL: jest.Mock;
    let click: jest.SpyInstance;

    beforeEach(() => {
      createObjectURL = jest.fn(() => "blob:mock");
      revokeObjectURL = jest.fn();
      Object.defineProperty(URL, "createObjectURL", {
        value: createObjectURL,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        value: revokeObjectURL,
        configurable: true,
        writable: true,
      });
      click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    });

    afterEach(() => {
      click.mockRestore();
    });

    it("创建链接、点击并回收 URL", () => {
      const blob = new Blob(["x"]);

      downloadBlob(blob, "a.csv");

      expect(createObjectURL).toHaveBeenCalledWith(blob);
      expect(click).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    });

    it("链接设置了 download 文件名且用完从文档移除", () => {
      const appendSpy = jest.spyOn(document.body, "appendChild");
      const removeSpy = jest.spyOn(document.body, "removeChild");

      downloadBlob(new Blob(["x"]), "report.xlsx");

      const link = appendSpy.mock.calls[0]![0] as HTMLAnchorElement;
      expect(link.download).toBe("report.xlsx");
      expect(link.href).toContain("blob:mock");
      expect(removeSpy).toHaveBeenCalledWith(link);
      expect(document.body.contains(link)).toBe(false);

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe("arrayToCsv", () => {
    it("按行拼成 CSV", () => {
      expect(arrayToCsv([["a", "b"], ["c", "d"]])).toBe("a,b\nc,d");
    });

    it("空数据返回空字符串", () => {
      expect(arrayToCsv([])).toBe("");
    });

    it("null / undefined 转成空串", () => {
      expect(arrayToCsv([[null, undefined, 1]])).toBe(",,1");
    });

    it("含分隔符的单元格加引号", () => {
      expect(arrayToCsv([["a,b", "c"]])).toBe('"a,b",c');
    });

    it("含引号的单元格加引号并把引号翻倍", () => {
      expect(arrayToCsv([['say "hi"']])).toBe('"say ""hi"""');
    });

    it("含换行的单元格加引号", () => {
      expect(arrayToCsv([["a\nb"]])).toBe('"a\nb"');
    });

    it("支持自定义分隔符", () => {
      expect(arrayToCsv([["a", "b"]], ";")).toBe("a;b");
    });

    it("自定义分隔符时逗号不再触发转义", () => {
      expect(arrayToCsv([["a,b"]], ";")).toBe("a,b");
    });

    it("数字单元格转字符串", () => {
      expect(arrayToCsv([[1, 2.5]])).toBe("1,2.5");
    });
  });

  describe("resolveDisabled", () => {
    it("undefined 表示未禁用", () => {
      expect(resolveDisabled(undefined, row({}), col())).toBe(false);
    });

    it("布尔值直接返回", () => {
      expect(resolveDisabled(true, row({}), col())).toBe(true);
      expect(resolveDisabled(false, row({}), col())).toBe(false);
    });

    it("函数按行与列求值", () => {
      const column = col({ key: "age" });
      const r = row({ age: 20 });

      expect(resolveDisabled((rr, cc) => rr.id === "r0" && cc.key === "age", r, column)).toBe(true);
      expect(resolveDisabled(() => false, r, column)).toBe(false);
    });
  });

  describe("getRenderResult", () => {
    it("默认取字段值并转成文本", () => {
      expect(getRenderResult(col({ key: "a" }), row({ a: "x" }), 0)).toEqual({
        text: "x",
        type: "text",
      });
    });

    it("优先使用 field 取数", () => {
      expect(getRenderResult(col({ key: "a", field: "b" }), row({ a: 1, b: 2 }), 0).text).toBe("2");
    });

    it("值为 null 时文本为空串", () => {
      expect(getRenderResult(col({ key: "a" }), row({ a: null }), 0).text).toBe("");
    });

    it("类型取 column.type", () => {
      expect(getRenderResult(col({ key: "a", type: "number" }), row({ a: 1 }), 0).type).toBe(
        "number",
      );
    });

    it("自定义 render 的返回值会合并进来", () => {
      const result = getRenderResult(
        col({ key: "a", render: () => ({ text: "R", customBackground: true }) }),
        row({ a: 1 }),
        0,
      );

      expect(result.text).toBe("R");
      expect((result as unknown as { customBackground: boolean }).customBackground).toBe(true);
    });

    it("自定义 render 收到 value / row / column / rowIndex", () => {
      const render = jest.fn(() => ({ text: "R" }));
      const column = col({ key: "a", render });
      const r = row({ a: 7 });

      getRenderResult(column, r, 3);

      expect(render).toHaveBeenCalledWith(7, r, column, 3);
    });

    it("自定义 render 返回空值时保留默认结果", () => {
      const result = getRenderResult(
        col({ key: "a", render: () => null as unknown as RenderResult }),
        row({ a: "x" }),
        0,
      );

      expect(result.text).toBe("x");
    });

    it("自定义 render 抛错时降级为 [Error] 并打日志", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      const result = getRenderResult(
        col({ key: "a", render: () => { throw new Error("boom"); } }),
        row({ a: 1 }),
        0,
      );

      expect(result).toEqual({ text: "[Error]", type: "text" });
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("checkbox 类型自动补默认配置", () => {
      const result = getRenderResult(col({ key: "a", type: "checkbox" }), row({ a: 1 }), 0);

      expect(result.checkbox).toEqual({ checked: true });
    });

    it("switch 类型自动补默认配置", () => {
      const result = getRenderResult(col({ key: "a", type: "switch" }), row({ a: 0 }), 0);

      expect(result.switch).toEqual({ checked: false });
    });

    it("已有 checkbox 配置时不覆盖", () => {
      const result = getRenderResult(
        col({ key: "a", type: "checkbox", render: () => ({ checkbox: { checked: false } }) }),
        row({ a: 1 }),
        0,
      );

      expect(result.checkbox).toEqual({ checked: false });
    });
  });

  describe("getCellDisplayText", () => {
    it("switch 显示是 / 否", () => {
      expect(getCellDisplayText(col({ key: "a", type: "switch" }), row({ a: 1 }), 0)).toBe("是");
      expect(getCellDisplayText(col({ key: "a", type: "switch" }), row({ a: 0 }), 0)).toBe("否");
    });

    it("checkbox 半选显示「部分选中」", () => {
      const column = col({
        key: "a",
        type: "checkbox",
        render: () => ({ checkbox: { checked: false, indeterminate: true } }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("部分选中");
    });

    it("checkbox 显示是 / 否", () => {
      const checked = col({ key: "a", type: "checkbox" });
      const unchecked = col({ key: "a", type: "checkbox" });

      expect(getCellDisplayText(checked, row({ a: 1 }), 0)).toBe("是");
      expect(getCellDisplayText(unchecked, row({ a: 0 }), 0)).toBe("否");
    });

    it("radio 优先显示匹配选项的 label", () => {
      const column = col({
        key: "a",
        type: "radio",
        render: () => ({
          radio: { value: "b", options: [{ label: "B 选项", value: "b" }] },
        }),
      });

      expect(getCellDisplayText(column, row({ a: "b" }), 0)).toBe("B 选项");
    });

    it("radio 找不到匹配项时回退到原始值", () => {
      const column = col({
        key: "a",
        type: "radio",
        render: () => ({ radio: { value: "z", options: [{ label: "B", value: "b" }] } }),
      });

      expect(getCellDisplayText(column, row({ a: "z" }), 0)).toBe("z");
    });

    it("多按钮用逗号连接文本", () => {
      const column = col({
        key: "a",
        type: "button",
        render: () => ({ button: [{ text: "编辑" }, { text: "删除" }] }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("编辑, 删除");
    });

    it("单按钮显示其文本", () => {
      const column = col({
        key: "a",
        type: "button",
        render: () => ({ button: { text: "查看" } }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("查看");
    });

    it("按钮没有文本时返回空串", () => {
      const column = col({
        key: "a",
        type: "button",
        render: () => ({ button: {} }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("");
    });

    it("tags 用逗号连接标签文本", () => {
      const column = col({
        key: "a",
        type: "tag",
        render: () => ({ tags: { tags: [{ text: "红" }, { text: "蓝" }] } }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("红, 蓝");
    });

    it("多选 select 把值映射成 label", () => {
      const column = col({
        key: "a",
        type: "select",
        render: () => ({
          select: {
            value: ["a", "c"],
            options: [
              { label: "甲", value: "a" },
              { label: "丙", value: "c" },
            ],
          },
        }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("甲, 丙");
    });

    it("多选 select 中未匹配的值原样输出", () => {
      const column = col({
        key: "a",
        type: "select",
        render: () => ({ select: { value: ["a", "zz"], options: [{ label: "甲", value: "a" }] } }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("甲, zz");
    });

    it("单选 select 显示匹配的 label", () => {
      const column = col({
        key: "a",
        type: "select",
        render: () => ({ select: { value: "a", options: [{ label: "甲", value: "a" }] } }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("甲");
    });

    it("单选 select 未匹配时回退到值本身", () => {
      const column = col({
        key: "a",
        type: "select",
        render: () => ({ select: { value: "zz", options: [{ label: "甲", value: "a" }] } }),
      });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("zz");
    });

    it("date 类型 Date 值走本地日期格式", () => {
      const d = new Date(2026, 0, 5);
      const column = col({ key: "a", type: "date", render: () => ({ date: { value: d } }) });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe(d.toLocaleDateString());
    });

    it("date 类型字符串值原样输出", () => {
      const column = col({ key: "a", type: "date", render: () => ({ date: { value: "2026-01-05" } }) });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("2026-01-05");
    });

    it("date 类型没有值时返回空串", () => {
      const column = col({ key: "a", type: "date", render: () => ({ date: {} }) });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("");
    });

    it("input 类型取 input.value", () => {
      const column = col({ key: "a", type: "input", render: () => ({ input: { value: "abc" } }) });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("abc");
    });

    it("input 类型没有值时返回空串", () => {
      const column = col({ key: "a", type: "input", render: () => ({ input: {} }) });

      expect(getCellDisplayText(column, row({ a: 1 }), 0)).toBe("");
    });

    it("column.formatter 优先于 renderResult.text", () => {
      const column = col({ key: "a", formatter: (v) => `<${String(v)}>` });

      expect(getCellDisplayText(column, row({ a: "x" }), 0)).toBe("<x>");
    });

    it("默认返回 renderResult.text", () => {
      expect(getCellDisplayText(col({ key: "a" }), row({ a: "x" }), 0)).toBe("x");
    });

    it("renderResult.text 缺失时才走按列类型的兜底（number）", () => {
      // 只有 render 显式返回 text: undefined 才会落到 switch 分支
      const column = col({
        key: "a",
        type: "number",
        render: () => ({ text: undefined }),
      });

      expect(getCellDisplayText(column, row({ a: 1234 }), 0)).toBe((1234).toLocaleString());
    });

    it("兜底分支：boolean 显示是 / 否", () => {
      const column = col({ key: "a", type: "boolean", render: () => ({ text: undefined }) });

      expect(getCellDisplayText(column, row({ a: true }), 0)).toBe("是");
      expect(getCellDisplayText(column, row({ a: false }), 0)).toBe("否");
    });

    it("兜底分支：date 遇到 Date 值走本地日期格式", () => {
      const d = new Date(2026, 0, 5);
      const column = col({ key: "a", type: "date", render: () => ({ text: undefined }) });

      expect(getCellDisplayText(column, row({ a: d }), 0)).toBe(d.toLocaleDateString());
    });

    it("兜底分支：date 遇到非 Date 值转字符串", () => {
      const column = col({ key: "a", type: "date", render: () => ({ text: undefined }) });

      expect(getCellDisplayText(column, row({ a: "2026-01-05" }), 0)).toBe("2026-01-05");
    });

    it("兜底分支：其他类型转字符串", () => {
      const column = col({ key: "a", type: "custom", render: () => ({ text: undefined }) });

      expect(getCellDisplayText(column, row({ a: 42 }), 0)).toBe("42");
    });

    it("兜底分支：值为 null 时返回空串", () => {
      const column = col({ key: "a", type: "custom", render: () => ({ text: undefined }) });

      expect(getCellDisplayText(column, row({ a: null }), 0)).toBe("");
    });
  });

  describe("LRUCache", () => {
    it("默认容量 100", () => {
      const cache = new LRUCache<string, number>();

      for (let i = 0; i < 100; i++) {
        cache.set(`k${i}`, i);
      }
      expect(cache.size).toBe(100);

      cache.set("extra", 1);
      expect(cache.size).toBe(100);
      expect(cache.has("k0")).toBe(false);
    });

    it("set / get 基本读写", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);

      expect(cache.get("a")).toBe(1);
      expect(cache.has("a")).toBe(true);
      expect(cache.size).toBe(1);
    });

    it("读取不存在的键返回 undefined", () => {
      expect(new LRUCache<string, number>(2).get("nope")).toBeUndefined();
    });

    it("超出容量时淘汰最久未使用的键", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);

      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(true);
      expect(cache.has("c")).toBe(true);
    });

    it("get 会把键提升为最近使用", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.get("a");
      cache.set("c", 3);

      expect(cache.has("a")).toBe(true);
      expect(cache.has("b")).toBe(false);
    });

    it("重复 set 同一键只更新值不增长", () => {
      const cache = new LRUCache<string, number>(2);

      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("a", 99);

      expect(cache.size).toBe(2);
      expect(cache.get("a")).toBe(99);
      expect(cache.has("b")).toBe(true);
    });

    it("delete 返回是否删除成功", () => {
      const cache = new LRUCache<string, number>(2);
      cache.set("a", 1);

      expect(cache.delete("a")).toBe(true);
      expect(cache.delete("a")).toBe(false);
      expect(cache.size).toBe(0);
    });

    it("clear 清空所有键", () => {
      const cache = new LRUCache<string, number>(2);
      cache.set("a", 1);
      cache.set("b", 2);

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.has("a")).toBe(false);
    });

    it("keys 按最近使用顺序返回", () => {
      const cache = new LRUCache<string, number>(3);
      cache.set("a", 1);
      cache.set("b", 2);
      cache.set("c", 3);
      cache.get("a");

      expect([...cache.keys()]).toEqual(["b", "c", "a"]);
    });
  });

  describe("getFilterModeByColumnType", () => {
    it("显式配置的 mode 优先（即使类型本不支持筛选）", () => {
      expect(
        getFilterModeByColumnType(col({ type: "button", filter: { type: "text", mode: "search" } })),
      ).toBe("search");
    });

    it("禁用筛选时返回 null", () => {
      expect(
        getFilterModeByColumnType(col({ type: "text", filter: { type: "text", disabled: true } })),
      ).toBeNull();
    });

    it("同时给出 mode 与 disabled 时 mode 优先", () => {
      expect(
        getFilterModeByColumnType(
          col({ type: "text", filter: { type: "text", disabled: true, mode: "range" } }),
        ),
      ).toBe("range");
    });

    it.each([
      ["text", "search"],
      ["link", "search"],
      ["number", "range"],
      ["progress", "range"],
      ["select", "select"],
      ["tag", "select"],
      ["radio", "select"],
      ["color", "select"],
      ["date", "dateRange"],
      ["checkbox", "boolean"],
      ["switch", "boolean"],
    ] as const)("%s 映射到 %s", (type, mode) => {
      expect(getFilterModeByColumnType(col({ type }))).toBe(mode);
    });

    it("button / image 不支持筛选", () => {
      expect(getFilterModeByColumnType(col({ type: "button" }))).toBeNull();
      expect(getFilterModeByColumnType(col({ type: "image" }))).toBeNull();
    });

    it("未映射的类型回退到 search", () => {
      expect(getFilterModeByColumnType(col({ type: "boolean" }))).toBe("search");
      expect(getFilterModeByColumnType(col({ type: "custom" }))).toBe("search");
      expect(getFilterModeByColumnType(col({ type: "rating" }))).toBe("search");
    });

    it("未指定类型时按 text 处理", () => {
      expect(getFilterModeByColumnType(col())).toBe("search");
    });
  });

  describe("getColumnFilterOptions", () => {
    it("优先返回 column.filter.options", () => {
      const options = [{ label: "A", value: "a" }];

      expect(getColumnFilterOptions(col({ filter: { type: "enum", options } }))).toBe(options);
    });

    it("options 为空数组时继续走采样", () => {
      const column = col({ key: "k", filter: { type: "enum", options: [] } });

      expect(getColumnFilterOptions(column)).toEqual([]);
    });

    it("没有 rows 时返回空数组", () => {
      expect(getColumnFilterOptions(col({ key: "k" }))).toEqual([]);
    });

    it("rows 为空数组时返回空数组", () => {
      expect(getColumnFilterOptions(col({ key: "k" }), [])).toEqual([]);
    });

    it("从 select 的 render 结果提取选项并去重", () => {
      const column = col({
        key: "s",
        type: "select",
        render: () => ({ select: { options: [{ label: "甲", value: "a" }, { label: "乙", value: "b" }] } }),
      });

      expect(getColumnFilterOptions(column, rows(["a", "b", "a"]))).toEqual([
        { label: "甲", value: "a" },
        { label: "乙", value: "b" },
      ]);
    });

    it("从 tags 的 options 提取并把 text/value 映射成 label/value", () => {
      const column = col({
        key: "t",
        type: "tag",
        render: () => ({
          tags: { tags: [], options: [{ text: "红", value: "red" }, { text: "蓝" }] },
        }),
      });

      expect(getColumnFilterOptions(column, rows([1]))).toEqual([
        { label: "红", value: "red" },
        { label: "蓝", value: "蓝" },
      ]);
    });

    it("从 radio 的 options 提取", () => {
      const column = col({
        key: "r",
        type: "radio",
        render: () => ({ radio: { options: [{ label: "甲", value: "a" }] } }),
      });

      expect(getColumnFilterOptions(column, rows([1]))).toEqual([{ label: "甲", value: "a" }]);
    });

    it("从 color 的预设色提取", () => {
      const column = col({
        key: "c",
        type: "color",
        render: () => ({ color: { value: "#fff", presetColors: ["#fff", "#000"] } }),
      });

      expect(getColumnFilterOptions(column, rows([1]))).toEqual([
        { label: "#fff", value: "#fff" },
        { label: "#000", value: "#000" },
      ]);
    });

    it("没有可用 options 时用原始值兜底", () => {
      expect(getColumnFilterOptions(col({ key: "k" }), rows(["x", "y"]))).toEqual([
        { label: "x", value: "x" },
        { label: "y", value: "y" },
      ]);
    });

    it("原始值是数组时逐个展开", () => {
      expect(getColumnFilterOptions(col({ key: "k" }), rows([["a", "b"]]))).toEqual([
        { label: "a", value: "a" },
        { label: "b", value: "b" },
      ]);
    });

    it("原始值为 null / undefined 时不产生选项", () => {
      expect(getColumnFilterOptions(col({ key: "k" }), rows([null, undefined]))).toEqual([]);
    });

    it("startIndex 决定采样起点", () => {
      expect(getColumnFilterOptions(col({ key: "k" }), rows(["a", "b", "c"]), 1)).toEqual([
        { label: "b", value: "b" },
        { label: "c", value: "c" },
      ]);
    });
  });

  describe("searchFilterOptions", () => {
    it("空关键字返回空数组", () => {
      expect(searchFilterOptions(col({ key: "k" }), rows(["apple"]), "")).toEqual([]);
    });

    it("纯空白关键字返回空数组", () => {
      expect(searchFilterOptions(col({ key: "k" }), rows(["apple"]), "   ")).toEqual([]);
    });

    it("不区分大小写匹配", () => {
      expect(searchFilterOptions(col({ key: "k" }), rows(["Apple", "banana"]), "APP")).toEqual([
        { label: "Apple", value: "Apple" },
      ]);
    });

    it("结果按值去重", () => {
      expect(searchFilterOptions(col({ key: "k" }), rows(["apple", "apple"]), "app")).toEqual([
        { label: "apple", value: "apple" },
      ]);
    });

    it("maxResults 限制结果数量", () => {
      const data = rows(["apple", "apricot", "apart"]);

      expect(searchFilterOptions(col({ key: "k" }), data, "ap", 2)).toHaveLength(2);
    });

    it("默认上限为 100", () => {
      expect(FILTER_SEARCH_LIMIT).toBe(100);
    });

    it("空值不参与匹配", () => {
      expect(searchFilterOptions(col({ key: "k" }), rows([null]), "a")).toEqual([]);
    });

    it("使用 field 取数", () => {
      const column = col({ key: "k", field: "name" });
      const data: Row[] = [{ id: "r0", data: { name: "apple" } }];

      expect(searchFilterOptions(column, data, "app")).toEqual([{ label: "apple", value: "apple" }]);
    });
  });

  describe("常量导出", () => {
    it("采样行数为 100", () => {
      expect(FILTER_SAMPLE_ROWS).toBe(100);
    });
  });
});
