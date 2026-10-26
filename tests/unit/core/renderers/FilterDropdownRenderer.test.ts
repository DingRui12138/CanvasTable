import { FilterDropdownRenderer } from "@/core/renderers/FilterDropdownRenderer";
import { zhCN, enUS } from "@/locale";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, textsOf, callsOf } from "../../helpers/canvasInspect";
import type { FilterDropdownState, TableTheme } from "@/types";

const createCtx = createTrackedContext;
const texts = textsOf;

function base(overrides: Partial<FilterDropdownState> = {}): FilterDropdownState {
  return {
    columnKey: "name",
    mode: "select",
    x: 100,
    y: 50,
    width: 200,
    scrollTop: 0,
    hoveredIndex: -1,
    searchText: "",
    ...overrides,
  };
}

function makeOptions(count: number, checkedIndexes: number[] = []) {
  return Array.from({ length: count }, (_, i) => ({
    label: `O${i}`,
    value: i,
    checked: checkedIndexes.includes(i),
  }));
}

describe("FilterDropdownRenderer", () => {
  describe("构造与 setter", () => {
    it("默认使用中文文案", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "search" }));

      expect(texts(ctx)).toContain(zhCN.filter.searchPlaceholder);
    });

    it("setLocale 可以切换文案", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());
      renderer.setLocale(enUS);

      renderer.render(base({ mode: "search" }));

      expect(texts(ctx)).toContain(enUS.filter.searchPlaceholder);
      expect(texts(ctx)).not.toContain(zhCN.filter.searchPlaceholder);
    });

    it("setContext 会切换绘制目标", () => {
      const first = createCtx();
      const second = createCtx();
      const renderer = new FilterDropdownRenderer(first.ctx, createMockTheme());

      renderer.setContext(second.ctx);
      renderer.render(base({ mode: "search" }));

      expect(first.ctx.calls).toHaveLength(0);
      expect(second.ctx.calls.length).toBeGreaterThan(0);
    });

    it("setTheme 会影响绘制颜色", () => {
      const { ctx, sets } = createCtx();
      const theme = createMockTheme();
      const renderer = new FilterDropdownRenderer(ctx, theme);

      theme.colors.dropdown.background = "#123456";
      renderer.setTheme(theme);
      renderer.render(base({ mode: "search" }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#123456" });
    });
  });

  describe("search 模式", () => {
    it("有 searchValue 时绘制输入值而不是占位符", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "search", searchValue: "abc" }));

      expect(texts(ctx)).toContain("abc");
      expect(texts(ctx)).not.toContain(zhCN.filter.searchPlaceholder);
    });

    it("没有 searchValue 时绘制占位符", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "search" }));

      expect(texts(ctx)).toContain(zhCN.filter.searchPlaceholder);
    });

    it("绘制重置与确定按钮", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "search" }));

      expect(texts(ctx)).toContain(zhCN.filter.reset);
      expect(texts(ctx)).toContain(zhCN.filter.confirm);
    });
  });

  describe("select 模式", () => {
    it("options 与 isLoading 都缺失时不绘制任何内容", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "select" }));

      expect(ctx.calls).toHaveLength(0);
    });

    it("isLoading 时绘制加载文案", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "select", isLoading: true }));

      expect(texts(ctx)).toContain(zhCN.filter.loading);
    });

    it("options 为空数组时绘制空数据文案", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "select", options: [] }));

      expect(texts(ctx)).toContain(zhCN.filter.noData);
    });

    it("有 searchText 时绘制搜索内容而不是占位符", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "select", searchText: "ab", options: makeOptions(2) }));

      expect(texts(ctx)).toContain("ab");
      expect(texts(ctx)).not.toContain(zhCN.filter.selectSearchPlaceholder);
    });

    it("没有 searchText 时绘制搜索占位符", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "select", options: makeOptions(2) }));

      expect(texts(ctx)).toContain(zhCN.filter.selectSearchPlaceholder);
    });

    it("绘制选项标签并在 hoveredIndex 上绘制高亮背景", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "select", options: makeOptions(3), hoveredIndex: 1 }));

      expect(texts(ctx)).toContain("O0");
      expect(texts(ctx)).toContain("O1");
      expect(texts(ctx)).toContain("O2");
      // listY = y(50) + padding(8) + searchHeight(32) + gap(4) = 94
      expect(callsOf(ctx, "fillRect")).toContainEqual([100, 94 + 32, 200, 32]);
    });

    it("已选项使用选中色绘制勾选框", () => {
      const { ctx, sets } = createCtx();
      const theme = createMockTheme();
      const renderer = new FilterDropdownRenderer(ctx, theme);

      renderer.render(base({ mode: "select", options: makeOptions(2, [0]) }));

      expect(sets).toContainEqual({
        prop: "strokeStyle",
        value: theme.colors.checkbox.checkedBg,
      });
    });

    it("未选项使用默认边框色", () => {
      const { ctx, sets } = createCtx();
      const theme = createMockTheme();
      const renderer = new FilterDropdownRenderer(ctx, theme);

      renderer.render(base({ mode: "select", options: makeOptions(2) }));

      expect(sets).toContainEqual({
        prop: "strokeStyle",
        value: theme.colors.checkbox.border,
      });
    });

    it("十六进制颜色值会绘制色块并显示大写色值", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(
        base({
          mode: "select",
          options: [{ label: "红色", value: "#ff0000", checked: false }],
        }),
      );

      expect(texts(ctx)).toContain("#FF0000");
      expect(texts(ctx)).not.toContain("红色");
    });

    it("选项超过可见数量时绘制滚动条并恢复 globalAlpha", () => {
      const { ctx, sets } = createCtx();
      const theme = createMockTheme();
      theme.colors.scrollbar.opacity = 0.5;
      const renderer = new FilterDropdownRenderer(ctx, theme);

      renderer.render(base({ mode: "select", options: makeOptions(12) }));

      expect(sets).toContainEqual({ prop: "globalAlpha", value: 0.5 });
      expect(sets[sets.length - 1]).not.toEqual({ prop: "globalAlpha", value: 0.5 });
      // 滚动条固定贴在下拉框右侧
      expect(callsOf(ctx, "roundRect").some((args) => args[0] === 100 + 200 - 8)).toBe(true);
    });

    it("scrollTop 大于 0 时从对应索引开始绘制", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "select", options: makeOptions(12), scrollTop: 64 }));

      const drawn = texts(ctx);
      expect(drawn).not.toContain("O0");
      expect(drawn).not.toContain("O1");
      expect(drawn).toContain("O2");
    });
  });

  describe("range 模式", () => {
    it("有值时绘制数值", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "range", minValue: 1, maxValue: 9 }));

      expect(texts(ctx)).toContain("1");
      expect(texts(ctx)).toContain("9");
    });

    it("无值时绘制占位符", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "range" }));

      expect(texts(ctx)).toContain(zhCN.filter.minPlaceholder);
      expect(texts(ctx)).toContain(zhCN.filter.maxPlaceholder);
    });
  });

  describe("boolean 模式", () => {
    it("绘制三个选项文案", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "boolean", boolValue: "all" }));

      expect(texts(ctx)).toContain(zhCN.filter.all);
      expect(texts(ctx)).toContain(zhCN.filter.selected);
      expect(texts(ctx)).toContain(zhCN.filter.unselected);
    });

    it("选中 all 时高亮第一项", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "boolean", boolValue: "all" }));

      // itemY = y(50) + padding(8) + 0 * 32 = 58
      expect(callsOf(ctx, "fillRect")).toContainEqual([100, 58, 200, 32]);
    });

    it("选中 true 时高亮第二项", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "boolean", boolValue: "true" }));

      expect(callsOf(ctx, "fillRect")).toContainEqual([100, 90, 200, 32]);
    });

    it("boolValue 缺失时不绘制任何高亮背景", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "boolean" }));

      const highlighted = callsOf(ctx, "fillRect").filter((args) => args[3] === 32);
      expect(highlighted).toHaveLength(0);
    });
  });

  describe("dateRange 模式", () => {
    it("有日期时绘制格式化文本", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(
        base({
          mode: "dateRange",
          startDate: new Date(2026, 0, 1),
          endDate: new Date(2026, 0, 31),
        }),
      );

      expect(texts(ctx)).toContain("2026-01-01");
      expect(texts(ctx)).toContain("2026-01-31");
    });

    it("无日期时绘制占位符", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "dateRange" }));

      expect(texts(ctx)).toContain(zhCN.filter.startDatePlaceholder);
      expect(texts(ctx)).toContain(zhCN.filter.endDatePlaceholder);
    });

    it("激活的日期输入框使用加粗边框", () => {
      const { ctx, sets } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "dateRange", activeDateField: "startDate" }));

      expect(sets).toContainEqual({ prop: "lineWidth", value: 2 });
    });

    it("未激活任何输入框时不使用加粗边框", () => {
      const { ctx, sets } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "dateRange" }));

      expect(sets.some((s) => s.prop === "lineWidth" && s.value === 2)).toBe(false);
    });

    it("日历激活时绘制月份标题、星期表头与日期", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(
        base({
          mode: "dateRange",
          activeDateField: "startDate",
          currentYear: 2026,
          currentMonth: 8,
        }),
      );

      const drawn = texts(ctx);
      expect(drawn).toContain("2026年 9月");
      expect(drawn).toContain("日");
      expect(drawn).toContain("六");
      expect(drawn).toContain("1");
      expect(drawn).toContain("30");
    });

    it("选中日期使用主色圆点与白色文字", () => {
      const { ctx, sets } = createCtx();
      const theme = createMockTheme();
      const renderer = new FilterDropdownRenderer(ctx, theme);

      renderer.render(
        base({
          mode: "dateRange",
          startDate: new Date(2026, 8, 10),
          activeDateField: "startDate",
          currentYear: 2026,
          currentMonth: 8,
        }),
      );

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#ffffff" });
    });

    it("hover 日期使用行悬浮背景色", () => {
      const { ctx, sets } = createCtx();
      const theme = createMockTheme();
      const renderer = new FilterDropdownRenderer(ctx, theme);

      renderer.render(
        base({
          mode: "dateRange",
          activeDateField: "startDate",
          currentYear: 2026,
          currentMonth: 8,
          hoveredDate: new Date(2026, 8, 15),
        }),
      );

      expect(sets).toContainEqual({
        prop: "fillStyle",
        value: theme.colors.rowHoverBackground,
      });
    });

    it("今天使用主色文字绘制", () => {
      const { ctx, sets } = createCtx();
      const theme = createMockTheme();
      const renderer = new FilterDropdownRenderer(ctx, theme);
      const today = new Date();

      renderer.render(
        base({
          mode: "dateRange",
          activeDateField: "startDate",
          currentYear: today.getFullYear(),
          currentMonth: today.getMonth(),
        }),
      );

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.primary });
    });

    it("日历左边界会被钳制到下拉框左边缘", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      // 宽度需落在 [240, 472) 才能只触发左钳制：更窄时右钳制会再次覆盖 calendarX
      renderer.render(
        base({
          mode: "dateRange",
          width: 300,
          activeDateField: "startDate",
          currentYear: 2026,
          currentMonth: 8,
        }),
      );

      expect(callsOf(ctx, "roundRect").some((args) => args[0] === 100 && args[2] === 240)).toBe(
        true,
      );
    });

    it("下拉框过窄时右钳制会覆盖左钳制结果", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      // x(100) + width(150) - calendarWidth(240) = 10
      renderer.render(
        base({
          mode: "dateRange",
          width: 150,
          activeDateField: "startDate",
          currentYear: 2026,
          currentMonth: 8,
        }),
      );

      expect(callsOf(ctx, "roundRect").some((args) => args[0] === 10 && args[2] === 240)).toBe(true);
    });

    it("日历右边界会被钳制到下拉框右边缘", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(
        base({
          mode: "dateRange",
          width: 200,
          activeDateField: "startDate",
          currentYear: 2026,
          currentMonth: 8,
        }),
      );

      // x(100) + width(200) - calendarWidth(240) = 60
      expect(callsOf(ctx, "roundRect").some((args) => args[0] === 60 && args[2] === 240)).toBe(true);
    });

    it("activeDateField 存在但年月缺失时不绘制日历", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "dateRange", activeDateField: "startDate" }));

      const drawn = texts(ctx);
      expect(drawn).not.toContain("日");
      expect(drawn).not.toContain("六");
    });
  });

  describe("未知模式", () => {
    it("不绘制任何内容", () => {
      const { ctx } = createCtx();
      const renderer = new FilterDropdownRenderer(ctx, createMockTheme());

      renderer.render(base({ mode: "unknown" as FilterDropdownState["mode"] }));

      expect(ctx.calls).toHaveLength(0);
    });
  });

  describe("主题与上下文切换", () => {
    it("自定义主题字体不会导致绘制异常", () => {
      const { ctx } = createCtx();
      const theme: TableTheme = createMockTheme();
      theme.font.size = 20;
      const renderer = new FilterDropdownRenderer(ctx, theme);

      expect(() => renderer.render(base({ mode: "select", options: makeOptions(2) }))).not.toThrow();
    });
  });
});
