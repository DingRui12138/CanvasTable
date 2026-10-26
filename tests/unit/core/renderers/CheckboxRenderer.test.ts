import { CheckboxRenderer } from "@/core/renderers/CheckboxRenderer";
import type { CellRendererContext } from "@/core/renderers/CellRenderer";
import type { CheckboxConfig, Column, Row } from "@/types";
import { zhCN } from "@/locale";
import { createMockTheme } from "../../helpers/mockFactories";
import { createTrackedContext, callsOf, methodNamesOf } from "../../helpers/canvasInspect";

function build(overrides: Partial<CellRendererContext> = {}) {
  const { ctx, sets } = createTrackedContext();
  const theme = createMockTheme();
  const column: Column = { key: "c", title: "C", width: 100, type: "checkbox" };
  const row: Row = { id: "r0", data: {} };

  const context = {
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
    value: { checked: false } as CheckboxConfig,
    isDisabled: false,
    isHovered: false,
    isSelected: false,
    dpr: 1,
    ...overrides,
  } as CellRendererContext;

  return { renderer: new CheckboxRenderer(), context, ctx, sets, theme };
}

/** 单元格 100x32、方块 16x16 → 起点 (42, 8) */
const BOX_X = 42;
const BOX_Y = 8;

describe("CheckboxRenderer", () => {
  it("type 为 checkbox", () => {
    expect(new CheckboxRenderer().type).toBe("checkbox");
  });

  it("返回 checkbox 类型和原始 config", () => {
    const config: CheckboxConfig = { checked: true };
    const { renderer, context } = build({ value: config });

    expect(renderer.render(context)).toEqual({ type: "checkbox", config });
  });

  describe("方框绘制", () => {
    it("在单元格中央画 16x16、圆角 3 的方框", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      expect(callsOf(ctx, "roundRect")[0]).toEqual([BOX_X, BOX_Y, 16, 16, 3]);
    });

    it("方框先填充再描边", () => {
      const { renderer, context, ctx } = build();

      renderer.render(context);

      expect(callsOf(ctx, "fill")).toHaveLength(1);
      expect(callsOf(ctx, "stroke")).toHaveLength(1);

      const names = methodNamesOf(ctx);
      expect(names.indexOf("roundRect")).toBeLessThan(names.indexOf("fill"));
      expect(names.indexOf("fill")).toBeLessThan(names.indexOf("stroke"));
    });

    it("启用时底色用 button.background", () => {
      const { renderer, context, sets, theme } = build({ isDisabled: false });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.background });
    });

    it("禁用时底色用 checkbox.disabledBg", () => {
      const { renderer, context, sets, theme } = build({ isDisabled: true });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.checkbox.disabledBg });
      expect(sets).not.toContainEqual({
        prop: "fillStyle",
        value: theme.colors.button.background,
      });
    });

    it("边框用 checkbox.border，线宽 1", () => {
      const { renderer, context, sets, theme } = build();

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.checkbox.border });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 1 });
    });
  });

  describe("半选态", () => {
    it("画一条水平短线", () => {
      const { renderer, context, ctx } = build({
        value: { checked: false, indeterminate: true } as CheckboxConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "moveTo")[0]).toEqual([BOX_X + 4, BOX_Y + 8]);
      expect(callsOf(ctx, "lineTo")[0]).toEqual([BOX_X + 12, BOX_Y + 8]);
      expect(callsOf(ctx, "lineTo")).toHaveLength(1);
    });

    it("启用时短线用 checkbox.checkedBg，线宽 2", () => {
      const { renderer, context, sets, theme } = build({
        value: { indeterminate: true } as CheckboxConfig,
      });

      renderer.render(context);

      const strokeStyles = sets.filter((s) => s.prop === "strokeStyle").map((s) => s.value);
      expect(strokeStyles).toContain(theme.colors.checkbox.checkedBg);
      expect(sets).toContainEqual({ prop: "lineWidth", value: 2 });
    });

    it("禁用时短线用 checkbox.border", () => {
      const { renderer, context, sets, theme } = build({
        value: { indeterminate: true } as CheckboxConfig,
        isDisabled: true,
      });

      renderer.render(context);

      const strokeStyles = sets.filter((s) => s.prop === "strokeStyle").map((s) => s.value);
      expect(strokeStyles).not.toContain(theme.colors.checkbox.checkedBg);
      expect(strokeStyles[strokeStyles.length - 1]).toBe(theme.colors.checkbox.border);
    });

    it("同时 checked 和 indeterminate 时以半选态为准（只画一条线）", () => {
      const { renderer, context, ctx } = build({
        value: { checked: true, indeterminate: true } as CheckboxConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "lineTo")).toHaveLength(1);
      expect(callsOf(ctx, "lineTo")[0]).toEqual([BOX_X + 12, BOX_Y + 8]);
    });
  });

  describe("勾选态", () => {
    it("画两段折线组成对勾", () => {
      const { renderer, context, ctx } = build({
        value: { checked: true } as CheckboxConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "moveTo")[0]).toEqual([BOX_X + 4, BOX_Y + 8]);
      expect(callsOf(ctx, "lineTo")[0]).toEqual([BOX_X + 7, BOX_Y + 11]);
      expect(callsOf(ctx, "lineTo")[1]).toEqual([BOX_X + 13, BOX_Y + 4]);
      expect(callsOf(ctx, "lineTo")).toHaveLength(2);
    });

    it("折线使用 round 的端点与连接样式", () => {
      const { renderer, context, sets } = build({
        value: { checked: true } as CheckboxConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "lineCap", value: "round" });
      expect(sets).toContainEqual({ prop: "lineJoin", value: "round" });
    });

    it("启用时对勾用 checkbox.checkedBg", () => {
      const { renderer, context, sets, theme } = build({
        value: { checked: true } as CheckboxConfig,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "strokeStyle", value: theme.colors.checkbox.checkedBg });
      expect(sets).toContainEqual({ prop: "lineWidth", value: 2 });
    });

    it("禁用时对勾用 checkbox.border，但线帽样式与启用时一致", () => {
      const { renderer, context, sets, theme } = build({
        value: { checked: true } as CheckboxConfig,
        isDisabled: true,
      });

      renderer.render(context);

      const strokeStyles = sets.filter((s) => s.prop === "strokeStyle").map((s) => s.value);
      expect(strokeStyles).not.toContain(theme.colors.checkbox.checkedBg);
      expect(strokeStyles[strokeStyles.length - 1]).toBe(theme.colors.checkbox.border);
      // lineCap/lineJoin 在 checked 分支里无条件赋值，与禁用状态无关
      expect(sets).toContainEqual({ prop: "lineCap", value: "round" });
      expect(sets).toContainEqual({ prop: "lineJoin", value: "round" });
    });
  });

  describe("未选中态", () => {
    it("既不画对勾也不画横线", () => {
      const { renderer, context, ctx } = build({
        value: { checked: false, indeterminate: false } as CheckboxConfig,
      });

      renderer.render(context);

      expect(callsOf(ctx, "moveTo")).toHaveLength(0);
      expect(callsOf(ctx, "lineTo")).toHaveLength(0);
      expect(callsOf(ctx, "stroke")).toHaveLength(1); // 仅方框描边
    });

    it("config 为空对象时同样不画标记", () => {
      const { renderer, context, ctx } = build({ value: {} as CheckboxConfig });

      renderer.render(context);

      expect(callsOf(ctx, "moveTo")).toHaveLength(0);
    });

    it("isDisabled 为 undefined 时按未禁用处理", () => {
      const { renderer, context, sets, theme } = build({
        isDisabled: undefined as unknown as boolean,
      });

      renderer.render(context);

      expect(sets).toContainEqual({ prop: "fillStyle", value: theme.colors.button.background });
    });
  });
});
