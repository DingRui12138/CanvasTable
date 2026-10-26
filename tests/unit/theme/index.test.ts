import { DEFAULT_THEME, DARK_THEME, mergeTheme } from "@/theme";
import type { TableTheme } from "@/types";

/** mergeTheme 的入参是浅 Partial，测试里传的是深局部对象，统一在此处收敛类型 */
const merge = (theme?: unknown) => mergeTheme(theme as Partial<TableTheme> | undefined);

/** 逐字段断言的分组：这些 colors 子对象都应支持局部覆盖 */
const COLOR_GROUPS = [
  "date",
  "input",
  "checkbox",
  "radio",
  "button",
  "dropdown",
  "scrollbar",
  "indicator",
  "tooltip",
  "image",
  "hiddenPlaceholder",
  "moreCount",
  "shadow",
  "watermark",
] as const;

/** 把 colors 分组当普通字典读写，避免联合类型的下标报错 */
function group(theme: TableTheme, name: string): Record<string, unknown> {
  return theme.colors[name as keyof typeof theme.colors] as unknown as Record<string, unknown>;
}

describe("theme", () => {
  describe("内置主题常量", () => {
    it("DEFAULT_THEME 是 light 主题", () => {
      expect(DEFAULT_THEME.name).toBe("light");
      expect(DEFAULT_THEME.colors.background).toBe("#ffffff");
    });

    it("DARK_THEME 是 dark 主题", () => {
      expect(DARK_THEME.name).toBe("dark");
      expect(DARK_THEME.colors.background).toBe("#1f1f1f");
    });

    it("两套主题的结构键完全一致", () => {
      expect(Object.keys(DARK_THEME).sort()).toEqual(Object.keys(DEFAULT_THEME).sort());
      expect(Object.keys(DARK_THEME.colors).sort()).toEqual(
        Object.keys(DEFAULT_THEME.colors).sort(),
      );
      expect(Object.keys(DARK_THEME.colors.button).sort()).toEqual(
        Object.keys(DEFAULT_THEME.colors.button).sort(),
      );
      for (const name of COLOR_GROUPS) {
        expect(Object.keys(group(DARK_THEME, name)).sort()).toEqual(
          Object.keys(group(DEFAULT_THEME, name)).sort(),
        );
      }
    });

    it("两套主题的字体与行高配置相同", () => {
      expect(DARK_THEME.font).toEqual(DEFAULT_THEME.font);
      expect(DARK_THEME.row.minHeight).toBe(DEFAULT_THEME.row.minHeight);
      expect(DARK_THEME.row.maxHeight).toBe(DEFAULT_THEME.row.maxHeight);
    });
  });

  describe("mergeTheme", () => {
    it("不传参数时返回默认主题", () => {
      expect(merge()).toEqual(DEFAULT_THEME);
    });

    it("不传参数时返回的是顶层副本而不是同一个引用", () => {
      const merged = merge();

      expect(merged).not.toBe(DEFAULT_THEME);
      expect(merged.colors).toBe(DEFAULT_THEME.colors);
    });

    it("传 undefined 等价于不传", () => {
      expect(merge(undefined)).toEqual(DEFAULT_THEME);
    });

    it("传空对象时各分组回落到默认值", () => {
      const merged = merge({});

      expect(merged.name).toBe("light");
      expect(merged.colors.tagColors.success).toBe(DEFAULT_THEME.colors.tagColors.success);
      expect(merged.colors.loading!.spinnerActive).toBe(DEFAULT_THEME.colors.loading!.spinnerActive);
      expect(merged.font).toEqual(DEFAULT_THEME.font);
      expect(merged.row).toEqual(DEFAULT_THEME.row);
      expect(merged.border).toEqual(DEFAULT_THEME.border);
    });

    it("顶层字段被覆盖", () => {
      expect(merge({ name: "custom" }).name).toBe("custom");
    });

    it("colors 下的普通标量字段被覆盖，其余保留", () => {
      const merged = merge({ colors: { primary: "#ff0000" } });

      expect(merged.colors.primary).toBe("#ff0000");
      expect(merged.colors.cellText).toBe(DEFAULT_THEME.colors.cellText);
    });

    it("colors 为空对象时全部回落到默认值", () => {
      const merged = merge({ colors: {} });

      expect(merged.colors.primary).toBe(DEFAULT_THEME.colors.primary);
      expect(merged.colors.tagColors).toEqual(DEFAULT_THEME.colors.tagColors);
    });

    it("tagColors 局部覆盖时其余色板保留", () => {
      const merged = merge({ colors: { tagColors: { success: "#00ff00" } } });

      expect(merged.colors.tagColors.success).toBe("#00ff00");
      expect(merged.colors.tagColors.primary).toBe(DEFAULT_THEME.colors.tagColors.primary);
      expect(merged.colors.tagColors.error).toBe(DEFAULT_THEME.colors.tagColors.error);
    });

    it("14 个 colors 分组都支持局部覆盖且不污染同组其它字段", () => {
      for (const name of COLOR_GROUPS) {
        const defaults = group(DEFAULT_THEME, name);
        const keys = Object.keys(defaults);
        const key = keys[0]!;
        const original = defaults[key];
        const sentinel = typeof original === "number" ? 999 : "#123456";

        const merged = merge({
          colors: { [name]: { [key]: sentinel } },
        } as unknown as Partial<TableTheme>);

        const result = group(merged, name);
        expect(result[key]).toBe(sentinel);

        for (const other of keys.slice(1)) {
          expect(result[other]).toEqual(defaults[other]);
        }
      }
    });

    it("loading 传了对象时做合并", () => {
      const merged = merge({ colors: { loading: { spinnerActive: "#00ffff" } } });

      expect(merged.colors.loading!.spinnerActive).toBe("#00ffff");
      expect(merged.colors.loading!.background).toBe(DEFAULT_THEME.colors.loading!.background);
    });

    it("loading 显式传 undefined 时整体回落到默认值", () => {
      const merged = merge({ colors: { loading: undefined } });

      expect(merged.colors.loading).toEqual(DEFAULT_THEME.colors.loading);
    });

    it("font 局部覆盖", () => {
      const merged = merge({ font: { size: 16 } });

      expect(merged.font.size).toBe(16);
      expect(merged.font.family).toBe(DEFAULT_THEME.font.family);
      expect(merged.font.headerSize).toBe(DEFAULT_THEME.font.headerSize);
    });

    it("row 局部覆盖", () => {
      const merged = merge({ row: { height: 48 } });

      expect(merged.row.height).toBe(48);
      expect(merged.row.headerHeight).toBe(DEFAULT_THEME.row.headerHeight);
    });

    it("border 局部覆盖", () => {
      const merged = merge({ border: { width: 2 } });

      expect(merged.border.width).toBe(2);
      expect(merged.border.color).toBe(DEFAULT_THEME.border.color);
    });

    it("可以整体套用 DARK_THEME", () => {
      expect(merge(DARK_THEME)).toEqual(DARK_THEME);
    });

    it("不修改 DEFAULT_THEME", () => {
      const snapshot = JSON.parse(JSON.stringify(DEFAULT_THEME)) as typeof DEFAULT_THEME;

      merge({
        name: "mutated",
        colors: { primary: "#000000", tagColors: { success: "#000000" }, loading: { text: "x" } },
        font: { size: 99 },
        row: { height: 99 },
        border: { width: 99 },
      });

      expect(DEFAULT_THEME).toEqual(snapshot);
    });

    it("不修改传入的 partial 对象", () => {
      const partial = { name: "x", colors: { primary: "#111111" } };

      merge(partial);

      expect(partial).toEqual({ name: "x", colors: { primary: "#111111" } });
    });

    it("返回结果的各分组都是全新对象", () => {
      const merged = merge({ colors: { primary: "#111111" } });

      expect(merged.colors).not.toBe(DEFAULT_THEME.colors);
      expect(merged.colors.tagColors).not.toBe(DEFAULT_THEME.colors.tagColors);
      expect(merged.font).not.toBe(DEFAULT_THEME.font);
      expect(merged.row).not.toBe(DEFAULT_THEME.row);
      expect(merged.border).not.toBe(DEFAULT_THEME.border);
    });

    it("未提供 loading 时直接复用默认的 loading 对象（三元分支不复制）", () => {
      const merged = merge({ colors: { primary: "#111111" } });

      // 注意：这里与其他分组不同，是同一个引用。改动 merged.colors.loading
      // 会污染 DEFAULT_THEME.colors.loading —— 属于潜在隐患，已在报告中记录。
      expect(merged.colors.loading).toBe(DEFAULT_THEME.colors.loading);
    });

    it("提供了 loading 时会生成新的合并对象", () => {
      const merged = merge({ colors: { loading: { text: "#123456" } } });

      expect(merged.colors.loading).not.toBe(DEFAULT_THEME.colors.loading);
      expect(merged.colors.loading!.text).toBe("#123456");
    });
  });
});
