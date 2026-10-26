import { DropdownRenderer } from "@/core/renderers/DropdownRenderer";
import { zhCN } from "@/locale";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, textsOf, callsOf } from "../../helpers/canvasInspect";
import type {
  ButtonsDropdownState,
  CanvasTableLocale,
  DropdownState,
  SelectOption,
} from "@/types";

const measure = (text: string): number => text.length * 7;

function buttonsState(overrides: Partial<ButtonsDropdownState> = {}): ButtonsDropdownState {
  return {
    cell: { rowIndex: 0, columnIndex: 0 },
    x: 100,
    y: 50,
    buttons: [
      { text: "Edit", actionKey: "edit" },
      { text: "Delete", actionKey: "delete" },
    ],
    hoveredIndex: -1,
    buttonRelativeX: 0,
    buttonY: 50,
    buttonHeight: 24,
    showAbove: false,
    ...overrides,
  };
}

function selectState(overrides: Partial<DropdownState> = {}): DropdownState {
  return {
    cell: { rowIndex: 0, columnIndex: 0 },
    config: {
      value: undefined,
      options: [
        { label: "Alpha", value: "a" },
        { label: "Beta", value: "b" },
      ],
    },
    x: 100,
    y: 50,
    width: 200,
    scrollTop: 0,
    hoveredIndex: -1,
    ...overrides,
  };
}

function makeOptions(count: number): SelectOption[] {
  return Array.from({ length: count }, (_, i) => ({ label: `O${i}`, value: `v${i}` }));
}

describe("DropdownRenderer", () => {
  describe("构造与 setter", () => {
    it("使用默认中文文案渲染无文本按钮", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderButtonsDropdown(buttonsState({ buttons: [{ actionKey: "x" }] }));

      expect(textsOf(ctx)).toContain(zhCN.cell.buttonText);
    });

    it("setLocale 可以覆盖按钮兜底文案", () => {
      const { ctx } = createTrackedContext();
      const custom: CanvasTableLocale = {
        ...zhCN,
        cell: { ...zhCN.cell, buttonText: "Custom" },
      };
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);
      renderer.setLocale(custom);

      renderer.renderButtonsDropdown(buttonsState({ buttons: [{ actionKey: "x" }] }));

      expect(textsOf(ctx)).toContain("Custom");
    });

    it("setContext 会切换绘制目标", () => {
      const first = createTrackedContext();
      const second = createTrackedContext();
      const renderer = new DropdownRenderer(first.ctx, createMockTheme(), measure);

      renderer.setContext(second.ctx);
      renderer.renderDropdown(selectState());

      expect(first.ctx.calls).toHaveLength(0);
      expect(second.ctx.calls.length).toBeGreaterThan(0);
    });

    it("setTheme 会影响绘制颜色", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      theme.colors.dropdown.background = "#abcdef";
      renderer.setTheme(theme);
      renderer.renderDropdown(selectState());

      expect(sets).toContainEqual({ prop: "fillStyle", value: "#abcdef" });
    });
  });

  describe("renderButtonsDropdown", () => {
    it("按按钮文案长度计算面板宽度并绘制面板", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderButtonsDropdown(buttonsState());

      // 两个按钮文案都短，宽度保持最小值 100；高度 = 2 * 32
      expect(callsOf(ctx, "roundRect")).toContainEqual([100, 50, 100, 64, 4]);
    });

    it("长文案会撑开面板宽度", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);
      const longText = "A".repeat(30);

      renderer.renderButtonsDropdown(buttonsState({ buttons: [{ text: longText }] }));

      // 30 * 7 + 16 * 2 = 242
      expect(callsOf(ctx, "roundRect")).toContainEqual([100, 50, 242, 32, 4]);
    });

    it("绘制每个按钮的文案", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderButtonsDropdown(buttonsState());

      const drawn = textsOf(ctx);
      expect(drawn).toContain("Edit");
      expect(drawn).toContain("Delete");
    });

    it("hover 项会绘制悬浮背景", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderButtonsDropdown(buttonsState({ hoveredIndex: 1 }));

      expect(callsOf(ctx, "fillRect")).toContainEqual([100, 82, 100, 32]);
    });

    it.each([
      ["primary", "primaryBg"],
      ["danger", "dangerBg"],
      ["warning", "warningBg"],
      ["link", "linkText"],
    ] as const)("variant=%s 使用对应主题色", (variant, themeKey) => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderButtonsDropdown(buttonsState({ buttons: [{ text: "Go", variant }] }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button[themeKey] });
    });

    it("未指定 variant 时使用单元格文字色", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderButtonsDropdown(buttonsState({ buttons: [{ text: "Go" }] }));

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.cellText });
    });
  });

  describe("renderDropdown - 单选", () => {
    it("绘制所有选项文案", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(selectState());

      const drawn = textsOf(ctx);
      expect(drawn).toContain("Alpha");
      expect(drawn).toContain("Beta");
    });

    it("选中项绘制选中背景并使用加粗字体", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(
        selectState({
          config: { value: "a", options: [{ label: "Alpha", value: "a" }] },
        }),
      );

      expect(callsOf(ctx, "fillRect")).toContainEqual([100, 50, 200, 32]);
      expect(sets).toContainEqual({
        prop: "font",
        value: `bold ${theme.font.size}px ${theme.font.family}`,
      });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 2 });
    });

    it("未选中且 disabled 的选项使用占位符颜色", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(
        selectState({
          config: { options: [{ label: "Alpha", value: "a", disabled: true }] },
        }),
      );

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("hover 项会绘制悬浮背景", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(selectState({ hoveredIndex: 1 }));

      expect(callsOf(ctx, "fillRect")).toContainEqual([100, 82, 200, 32]);
    });

    it("scrollTop 会把可视区外的选项跳过", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(
        selectState({
          scrollTop: 320,
          config: { options: makeOptions(10) },
        }),
      );

      const drawn = textsOf(ctx);
      expect(drawn).not.toContain("O0");
      expect(drawn).toContain("O9");
    });
  });

  describe("renderDropdown - 多选", () => {
    it("绘制复选框并在已选项上绘制勾选标记", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(
        selectState({
          config: {
            multiple: true,
            value: ["a"],
            options: [{ label: "Alpha", value: "a" }],
          },
        }),
      );

      expect(sets).toContainEqual({
        prop: "strokeStyle",
        value: theme.colors.checkbox.checkedBg,
      });
      expect(sets).toContainEqual({ prop: "lineCap", value: "round" });
      expect(sets).toContainEqual({ prop: "lineJoin", value: "round" });
    });

    it("未选项使用默认复选框边框色", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(
        selectState({
          config: { multiple: true, value: [], options: [{ label: "Alpha", value: "a" }] },
        }),
      );

      expect(sets).toContainEqual({
        prop: "strokeStyle",
        value: theme.colors.checkbox.border,
      });
    });

    it("多选模式不会绘制单选选中背景", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(
        selectState({
          config: {
            multiple: true,
            value: ["a"],
            options: [{ label: "Alpha", value: "a" }],
          },
        }),
      );

      expect(callsOf(ctx, "fillRect")).not.toContainEqual([100, 50, 200, 32]);
    });
  });

  describe("renderDropdown - 滚动条", () => {
    it("选项超过可见数量时绘制滚动条并恢复 globalAlpha", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      theme.colors.scrollbar.opacity = 0.4;
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(selectState({ config: { options: makeOptions(10) } }));

      expect(sets).toContainEqual({ prop: "globalAlpha", value: 0.4 });
      // scrollbarX = x(100) + width(200) - 6 - 2 = 292
      expect(callsOf(ctx, "roundRect").some((args) => args[0] === 292 && args[2] === 6)).toBe(true);
    });

    it("选项未超过可见数量时不绘制滚动条", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(selectState({ config: { options: makeOptions(8) } }));

      expect(callsOf(ctx, "roundRect").some((args) => args[2] === 6)).toBe(false);
    });
  });

  describe("renderDropdown - tags 模式", () => {
    it("tagsConfig 缺少 options 时不绘制任何内容", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(
        selectState({
          type: "tags",
          tagsConfig: { tags: [] },
          config: { options: [] },
        }),
      );

      expect(ctx.calls).toHaveLength(0);
    });

    it("绘制标签选项并对已选项绘制勾选标记", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(
        selectState({
          type: "tags",
          tagsConfig: {
            tags: [],
            options: [{ text: "Red", value: "red" }, { text: "Green" }],
            selectedValues: ["red"],
          },
        }),
      );

      const drawn = textsOf(ctx);
      expect(drawn).toContain("Red");
      expect(drawn).toContain("Green");
      expect(sets).toContainEqual({
        prop: "strokeStyle",
        value: theme.colors.checkbox.checkedBg,
      });
    });

    it("未选中的标签使用默认复选框边框色", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(
        selectState({
          type: "tags",
          tagsConfig: {
            tags: [],
            options: [{ text: "Red", value: "red" }],
            selectedValues: [],
          },
        }),
      );

      expect(sets).toContainEqual({
        prop: "strokeStyle",
        value: theme.colors.checkbox.border,
      });
    });

    it("disabled 标签使用占位符颜色", () => {
      const { ctx, sets } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(
        selectState({
          type: "tags",
          tagsConfig: {
            tags: [],
            options: [{ text: "Blue", value: "blue", disabled: true }],
            selectedValues: [],
          },
        }),
      );

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.placeholderText });
    });

    it("标签选项超过可见数量时绘制滚动条", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(
        selectState({
          type: "tags",
          tagsConfig: {
            tags: [],
            options: Array.from({ length: 10 }, (_, i) => ({ text: `T${i}`, value: `t${i}` })),
            selectedValues: [],
          },
        }),
      );

      expect(callsOf(ctx, "roundRect").some((args) => args[0] === 292 && args[2] === 6)).toBe(true);
    });

    it("标签下拉会跳过可视区外的选项", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(
        selectState({
          scrollTop: 320,
          type: "tags",
          tagsConfig: {
            tags: [],
            options: Array.from({ length: 10 }, (_, i) => ({ text: `T${i}`, value: `t${i}` })),
            selectedValues: [],
          },
        }),
      );

      const drawn = textsOf(ctx);
      expect(drawn).not.toContain("T0");
      expect(drawn).toContain("T9");
    });

    it("selectedValues 缺省时按空数组处理", () => {
      const { ctx } = createTrackedContext();
      const theme = createMockTheme();
      const renderer = new DropdownRenderer(ctx, theme, measure);

      renderer.renderDropdown(
        selectState({
          type: "tags",
          tagsConfig: { tags: [], options: [{ text: "Red", value: "red" }] },
        }),
      );

      expect(textsOf(ctx)).toContain("Red");
    });
  });

  describe("renderDropdown - 面板绘制", () => {
    it("绘制面板后会把阴影重置", () => {
      const { ctx, sets } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(selectState());

      expect(sets).toContainEqual({ prop: "shadowColor", value: "transparent" });
      expect(sets).toContainEqual({ prop: "shadowBlur", value: 0 });
      expect(sets).toContainEqual({ prop: "shadowOffsetX", value: 0 });
      expect(sets).toContainEqual({ prop: "shadowOffsetY", value: 0 });
    });

    it("save / restore 成对出现", () => {
      const { ctx } = createTrackedContext();
      const renderer = new DropdownRenderer(ctx, createMockTheme(), measure);

      renderer.renderDropdown(selectState());

      const names = ctx.calls.map((c) => c.method);
      expect(names.filter((n) => n === "save")).toHaveLength(1);
      expect(names.filter((n) => n === "restore")).toHaveLength(1);
    });
  });
});
