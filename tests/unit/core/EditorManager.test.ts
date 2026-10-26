/**
 * EditorManager 单元测试
 *
 * EditorManager 负责 DOM 输入型编辑器（input / textarea）的全生命周期：
 *   1. startEditing —— 定位、几何计算、创建并挂载输入框、注册事件
 *   2. endEditing   —— 提交前校验（同步/异步）、取消回调、销毁、派发 editEnd
 *   3. updatePosition —— 滚动时跟随单元格（含合并单元格与固定列）
 *   4. 内部事件     —— blur / keydown / wheel
 *
 * 说明：jsdom 中 scrollHeight 恒为 0，因此 adjustHeight 的结果由最小高度决定，
 * 这反而让多行编辑的高度断言完全确定。
 */
import { EditorManager } from "@/core/EditorManager";
import { EventEmitter } from "@/core/EventEmitter";
import type { LayoutManager } from "@/core/LayoutManager";
import type { CellPosition, Column, InputConfig, Row } from "@/types";
import { zhCN } from "@/locale";
import { createMockCanvas, createMockTheme } from "../helpers/mockFactories";

/** 与 EditorManager 构造函数第 4 个参数保持一致 */
type EditorEmitter = ConstructorParameters<typeof EditorManager>[3];

interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutStub {
  getLeafColumns: jest.Mock;
  getCellMerge: jest.Mock;
  getMergedCellPosition: jest.Mock;
  getCellPosition: jest.Mock;
  getCellViewportY: jest.Mock;
}

const COLUMN_NAME: Column = { key: "name", title: "Name", width: 120, editable: true };

function createLayout(overrides: {
  columns?: Column[];
  rect?: CellRect;
  viewportY?: number;
  merge?: { rowIndex: number; columnIndex: number } | null;
  mergedRect?: CellRect | null;
} = {}): LayoutStub {
  const rect = overrides.rect ?? { x: 100, y: 200, width: 120, height: 32 };
  return {
    getLeafColumns: jest.fn(() => overrides.columns ?? [COLUMN_NAME]),
    getCellMerge: jest.fn(() => overrides.merge ?? null),
    getMergedCellPosition: jest.fn(() => overrides.mergedRect ?? { ...rect }),
    getCellPosition: jest.fn(() => ({ ...rect })),
    getCellViewportY: jest.fn(() => overrides.viewportY ?? 100),
  };
}

function createHarness(options: {
  columns?: Column[];
  rows?: Row[];
  rect?: CellRect;
  viewportY?: number;
  merge?: { rowIndex: number; columnIndex: number } | null;
  mergedRect?: CellRect | null;
  locale?: typeof zhCN;
} = {}) {
  const wrapper = document.createElement("div");
  document.body.appendChild(wrapper);

  const layout = createLayout(options);
  const emitter = new EventEmitter<Record<string, unknown[]>>();
  const theme = createMockTheme();
  const rows: Row[] = options.rows ?? [{ data: { name: "Alice" } }];

  const manager = new EditorManager(
    wrapper,
    createMockCanvas(),
    layout as unknown as LayoutManager,
    emitter as unknown as EditorEmitter,
    theme,
    options.locale ?? zhCN,
    () => rows,
  );

  const input = (): HTMLInputElement | HTMLTextAreaElement | null =>
    wrapper.querySelector("input, textarea");

  return { manager, wrapper, layout, emitter, theme, rows, input };
}

const CELL: CellPosition = { rowIndex: 0, columnIndex: 0 };

/** jsdom 会把 hex 颜色序列化成 rgb(...)，两种写法都要接受 */
function colorPattern(hex: string): RegExp {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const r = parseInt(m[1]!, 16);
  const g = parseInt(m[2]!, 16);
  const b = parseInt(m[3]!, 16);
  return new RegExp(`${hex}|rgba?\\(\\s*${r},\\s*${g},\\s*${b}\\s*[,)]`, "i");
}

/** 当前文档中 <style> 的数量，用于抵消环境自带样式 */
function styleCount(): number {
  return document.querySelectorAll("style").length;
}

/** 派发键盘事件（KeyboardEvent 在 jsdom 中可用） */
function pressKey(
  target: HTMLElement,
  key: string,
  modifiers: { ctrlKey?: boolean; metaKey?: boolean } = {},
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...modifiers });
  target.dispatchEvent(event);
  return event;
}

let harness: ReturnType<typeof createHarness>;

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  if (harness) harness.wrapper.remove();
  jest.useRealTimers();
  jest.restoreAllMocks();
  document.querySelectorAll("style").forEach((el) => el.remove());
});

describe("EditorManager.startEditing 单行编辑", () => {
  it("按单元格几何创建 input（位置外扩 1px、宽度 +2）", async () => {
    harness = createHarness();
    const ok = await harness.manager.startEditing(CELL);

    expect(ok).toBe(true);
    const input = harness.input() as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.tagName).toBe("INPUT");
    // rect x=100,y=200,w=120,h=32, viewportY=100 → left=99, top=99, width=122, height=34
    expect(input.style.left).toBe("99px");
    expect(input.style.top).toBe("99px");
    expect(input.style.width).toBe("122px");
    expect(input.style.height).toBe("34px");
    expect(harness.wrapper.contains(input)).toBe(true);
  });

  it("默认取单元格值填充输入框", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    expect((harness.input() as HTMLInputElement).value).toBe("Alice");
  });

  it("单元格值为空时填充空串", async () => {
    harness = createHarness({ rows: [{ data: {} }] });
    await harness.manager.startEditing(CELL);
    expect((harness.input() as HTMLInputElement).value).toBe("");
  });

  it("config.value 优先于单元格值", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL, { value: "Bob" });
    expect((harness.input() as HTMLInputElement).value).toBe("Bob");
  });

  it("config.placeholder / type / readonly 生效", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL, {
      placeholder: "请输入",
      type: "number",
      readonly: true,
    });
    const input = harness.input() as HTMLInputElement;
    expect(input.placeholder).toBe("请输入");
    expect(input.type).toBe("number");
    expect(input.readOnly).toBe(true);
  });

  it("未提供 placeholder 时为空串、type 默认为 text", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const input = harness.input() as HTMLInputElement;
    expect(input.placeholder).toBe("");
    expect(input.type).toBe("text");
    expect(input.readOnly).toBe(false);
  });

  it("列级 disabled 为真时输入框禁用", async () => {
    harness = createHarness({ columns: [{ ...COLUMN_NAME, disabled: true }] });
    await harness.manager.startEditing(CELL);
    expect((harness.input() as HTMLInputElement).disabled).toBe(true);
  });

  it("disabled 为函数时按行求值", async () => {
    harness = createHarness({
      columns: [{ ...COLUMN_NAME, disabled: (row) => row.data.name === "Alice" }],
    });
    await harness.manager.startEditing(CELL);
    expect((harness.input() as HTMLInputElement).disabled).toBe(true);
  });

  it("列不存在时返回 false 且不创建输入框", async () => {
    harness = createHarness({ columns: [] });
    expect(await harness.manager.startEditing(CELL)).toBe(false);
    expect(harness.input()).toBeNull();
  });

  it("行不存在时返回 false 且不创建输入框", async () => {
    harness = createHarness({ rows: [] });
    expect(await harness.manager.startEditing({ rowIndex: 9, columnIndex: 0 })).toBe(false);
    expect(harness.input()).toBeNull();
  });

  it("固定左列不扣除横向滚动量", async () => {
    harness = createHarness({ columns: [{ ...COLUMN_NAME, fixed: "left" }] });
    harness.manager.setScroll(50, 0);
    await harness.manager.startEditing(CELL);
    expect((harness.input() as HTMLInputElement).style.left).toBe("99px");
  });

  it("固定右列不扣除横向滚动量", async () => {
    harness = createHarness({ columns: [{ ...COLUMN_NAME, fixed: "right" }] });
    harness.manager.setScroll(50, 0);
    await harness.manager.startEditing(CELL);
    expect((harness.input() as HTMLInputElement).style.left).toBe("99px");
  });

  it("普通列扣除横向滚动量", async () => {
    harness = createHarness();
    harness.manager.setScroll(50, 0);
    await harness.manager.startEditing(CELL);
    expect((harness.input() as HTMLInputElement).style.left).toBe("49px");
  });

  it("合并单元格使用合并区域的位置与起始行", async () => {
    harness = createHarness({
      merge: { rowIndex: 2, columnIndex: 1 },
      mergedRect: { x: 300, y: 400, width: 260, height: 64 },
      viewportY: 260,
    });
    await harness.manager.startEditing(CELL);

    expect(harness.layout.getMergedCellPosition).toHaveBeenCalledWith(2, 1);
    expect(harness.layout.getCellViewportY).toHaveBeenCalledWith(2, 0);
    const input = harness.input() as HTMLInputElement;
    expect(input.style.left).toBe("299px");
    expect(input.style.top).toBe("259px");
    expect(input.style.width).toBe("262px");
    expect(input.style.height).toBe("66px");
  });

  it("挂载后聚焦并全选输入框（rAF 内执行）", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const input = harness.input() as HTMLInputElement;
    const focusSpy = jest.spyOn(input, "focus");
    const selectSpy = jest.spyOn(input, "select");

    jest.advanceTimersByTime(20);

    expect(focusSpy).toHaveBeenCalled();
    expect(selectSpy).toHaveBeenCalled();
  });

  it("注入 ::placeholder 样式并携带主题色", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const style = Array.from(document.querySelectorAll("style")).find((el) =>
      el.textContent?.includes("::placeholder"),
    );
    expect(style).toBeDefined();
    expect(style!.textContent).toContain(harness.theme.colors.input.placeholder);
  });
});

describe("EditorManager.startEditing 多行编辑", () => {
  it("multiline 时创建 textarea 并按行高计算高度", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true });

    const input = harness.input() as HTMLTextAreaElement;
    expect(input.tagName).toBe("TEXTAREA");
    // autoMaxRows = floor((100-16)/21) = 4 → maxHeight = 21*4+16 = 100 → height = min(102, 102)
    expect(input.style.height).toBe("102px");
    expect(input.className).toBe("canvas-table-editor-textarea");
  });

  it("maxRows 小于自动行数时限制高度", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true, maxRows: 2 });

    const input = harness.input() as HTMLTextAreaElement;
    // maxHeight = 21*2+16 = 58 → height = min(102, 60) = 60
    expect(input.style.height).toBe("60px");
  });

  it("maxRows 大于自动行数时不放大", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true, maxRows: 10 });
    expect((harness.input() as HTMLTextAreaElement).style.height).toBe("102px");
  });

  it("单元格很矮时至少保留一行", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 10 } });
    await harness.manager.startEditing(CELL, { multiline: true });
    // autoMaxRows = max(1, floor(-6/21)=0) = 1 → maxHeight = 37 → height = min(12, 39) = 12
    expect((harness.input() as HTMLTextAreaElement).style.height).toBe("12px");
  });

  it("输入事件触发高度自适应且不低于初始高度", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true });
    const input = harness.input() as HTMLTextAreaElement;

    input.style.height = "10px";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // jsdom 中 scrollHeight 为 0 → newHeight = max(102, min(0, 100)) = 102
    expect(input.style.height).toBe("102px");
  });

  it("注入 textarea 滚动条样式", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true });
    const style = Array.from(document.querySelectorAll("style")).find((el) =>
      el.textContent?.includes("canvas-table-editor-textarea::-webkit-scrollbar"),
    );
    expect(style).toBeDefined();
    expect(style!.textContent).toContain(harness.theme.colors.scrollbar.thumbHover);
  });

  it("multiline 时 config.value / placeholder 同样生效", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true, value: "多行", placeholder: "备注" });
    const input = harness.input() as HTMLTextAreaElement;
    expect(input.value).toBe("多行");
    expect(input.placeholder).toBe("备注");
  });
});

describe("EditorManager.startEditing 切换编辑目标", () => {
  it("已有编辑态时先提交再进入新编辑", async () => {
    harness = createHarness({ rows: [{ data: { name: "Alice" } }, { data: { name: "Bob" } }] });
    const ended: unknown[] = [];
    harness.emitter.on("editEnd", (...args) => ended.push(args));

    await harness.manager.startEditing({ rowIndex: 0, columnIndex: 0 });
    const ok = await harness.manager.startEditing({ rowIndex: 1, columnIndex: 0 });

    expect(ok).toBe(true);
    expect(ended).toHaveLength(1);
    expect(harness.manager.getEditingCell()).toEqual({ rowIndex: 1, columnIndex: 0 });
  });

  it("前一次提交被校验拒绝时不再进入新编辑", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    harness.manager.setBeforeCommitCallback(() => false);

    const ok = await harness.manager.startEditing({ rowIndex: 1, columnIndex: 0 });

    expect(ok).toBe(false);
    // 校验失败后输入框被保留
    expect(harness.input()).not.toBeNull();
  });
});

describe("EditorManager.endEditing", () => {
  it("无编辑态时直接返回 true 且不派发事件", async () => {
    harness = createHarness();
    const ended: unknown[] = [];
    harness.emitter.on("editEnd", (...args) => ended.push(args));

    expect(await harness.manager.endEditing(true)).toBe(true);
    expect(ended).toHaveLength(0);
  });

  it("保存时派发 editEnd 并携带单元格信息与值", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    (harness.input() as HTMLInputElement).value = "Changed";

    const ended: unknown[][] = [];
    harness.emitter.on("editEnd", (...args) => ended.push(args));

    expect(await harness.manager.endEditing(true)).toBe(true);
    expect(ended).toHaveLength(1);
    const [info, value] = ended[0]!;
    expect(value).toBe("Changed");
    expect(info).toMatchObject({ rowIndex: 0, columnIndex: 0 });
    expect(harness.input()).toBeNull();
  });

  it("取消时调用 cancelCallback 且不派发 editEnd", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const cancelled: CellPosition[] = [];
    harness.manager.setCancelCallback((cell) => cancelled.push(cell));
    const ended: unknown[] = [];
    harness.emitter.on("editEnd", (...args) => ended.push(args));

    expect(await harness.manager.endEditing(false)).toBe(true);
    expect(cancelled).toEqual([CELL]);
    expect(ended).toHaveLength(0);
  });

  it("同步校验通过时正常提交", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    harness.manager.setBeforeCommitCallback(() => true);
    expect(await harness.manager.endEditing(true)).toBe(true);
    expect(harness.input()).toBeNull();
  });

  it("同步校验失败时保留输入框、加错误边框并返回 false", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const input = harness.input() as HTMLInputElement;
    harness.manager.setBeforeCommitCallback(() => false);

    expect(await harness.manager.endEditing(true)).toBe(false);
    expect(harness.input()).not.toBeNull();
    expect(input.style.border).toMatch(colorPattern(harness.theme.colors.tagColors.error!));
  });

  it("校验失败后 rAF 内重新聚焦输入框", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const input = harness.input() as HTMLInputElement;
    const focusSpy = jest.spyOn(input, "focus");
    harness.manager.setBeforeCommitCallback(() => false);

    await harness.manager.endEditing(true);
    jest.advanceTimersByTime(20);

    expect(focusSpy).toHaveBeenCalled();
  });

  it("异步校验会先进入 loading 再恢复并提交", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const input = harness.input() as HTMLInputElement;
    const disabledStates: boolean[] = [];
    harness.manager.setBeforeCommitCallback(async () => {
      // 等一个微任务，确保已进入异步校验（loading）状态后再读取 disabled
      await Promise.resolve();
      disabledStates.push(input.disabled);
      return true;
    });

    expect(await harness.manager.endEditing(true)).toBe(true);
    // 校验期间 input 被禁用，结束后恢复
    expect(disabledStates).toEqual([true]);
    expect(harness.input()).toBeNull();
  });

  it("异步校验失败时同样返回 false 并保留输入框", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    harness.manager.setBeforeCommitCallback(async () => false);

    expect(await harness.manager.endEditing(true)).toBe(false);
    expect(harness.input()).not.toBeNull();
  });

  it("取消时不触发提交前校验", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const validator = jest.fn(() => false);
    harness.manager.setBeforeCommitCallback(validator);

    expect(await harness.manager.endEditing(false)).toBe(true);
    expect(validator).not.toHaveBeenCalled();
  });

  it("销毁输入框时同时移除注入的样式表", async () => {
    harness = createHarness();
    const baseline = styleCount();
    await harness.manager.startEditing(CELL);
    expect(styleCount()).toBe(baseline + 1);

    await harness.manager.endEditing(true);
    expect(styleCount()).toBe(baseline);
  });

  it("multiline 结束时清理 textarea 与两份样式表", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    const baseline = styleCount();
    await harness.manager.startEditing(CELL, { multiline: true });
    expect(styleCount()).toBe(baseline + 2);

    await harness.manager.endEditing(false);
    expect(styleCount()).toBe(baseline);
    expect(harness.input()).toBeNull();
  });
});

describe("EditorManager 状态查询与位置更新", () => {
  it("isEditing / getEditingCell 反映当前编辑态", async () => {
    harness = createHarness();
    expect(harness.manager.isEditing()).toBe(false);
    expect(harness.manager.getEditingCell()).toBeNull();

    await harness.manager.startEditing(CELL);
    expect(harness.manager.isEditing()).toBe(true);
    expect(harness.manager.getEditingCell()).toEqual(CELL);

    await harness.manager.endEditing(false);
    expect(harness.manager.isEditing()).toBe(false);
    expect(harness.manager.getEditingCell()).toBeNull();
  });

  it("未编辑时 updatePosition 为无操作", () => {
    harness = createHarness();
    expect(() => harness.manager.updatePosition()).not.toThrow();
  });

  it("编辑中滚动后按新滚动量重算 left / top", async () => {
    harness = createHarness({ viewportY: 100 });
    await harness.manager.startEditing(CELL);
    harness.layout.getCellPosition.mockReturnValue({ x: 140, y: 300, width: 120, height: 32 });
    harness.manager.setScroll(30, 40);
    harness.layout.getCellViewportY.mockReturnValue(160);

    harness.manager.updatePosition();

    const input = harness.input() as HTMLInputElement;
    expect(input.style.left).toBe("109px"); // 140 - 30 - 1
    expect(input.style.top).toBe("159px"); // 160 - 1
  });

  it("编辑中列被移除时 updatePosition 直接返回", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const input = harness.input() as HTMLInputElement;
    harness.layout.getLeafColumns.mockReturnValue([]);

    harness.manager.updatePosition();

    expect(input.style.left).toBe("99px");
  });

  it("编辑中合并单元格时按合并区域重算", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    harness.layout.getCellMerge.mockReturnValue({ rowIndex: 3, columnIndex: 2 });
    harness.layout.getMergedCellPosition.mockReturnValue({ x: 500, y: 600, width: 200, height: 64 });
    harness.layout.getCellViewportY.mockReturnValue(220);

    harness.manager.updatePosition();

    expect(harness.layout.getMergedCellPosition).toHaveBeenCalledWith(3, 2);
    expect(harness.layout.getCellViewportY).toHaveBeenCalledWith(3, 0);
    expect((harness.input() as HTMLInputElement).style.left).toBe("499px");
  });

  it("固定列在 updatePosition 中同样不扣滚动量", async () => {
    harness = createHarness({ columns: [{ ...COLUMN_NAME, fixed: "left" }] });
    await harness.manager.startEditing(CELL);
    harness.layout.getCellPosition.mockReturnValue({ x: 140, y: 300, width: 120, height: 32 });
    harness.manager.setScroll(30, 0);

    harness.manager.updatePosition();

    expect((harness.input() as HTMLInputElement).style.left).toBe("139px");
  });
});

describe("EditorManager 输入框内部事件", () => {
  it("blur 触发提交", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const ended: unknown[][] = [];
    harness.emitter.on("editEnd", (...args) => ended.push(args));

    harness.input()!.dispatchEvent(new FocusEvent("blur"));

    await Promise.resolve();
    expect(ended).toHaveLength(1);
    expect(harness.input()).toBeNull();
  });

  it("markSkipNextBlur 后首次 blur 被吞掉、第二次正常提交", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    harness.manager.markSkipNextBlur();
    const ended: unknown[] = [];
    harness.emitter.on("editEnd", (...args) => ended.push(args));

    harness.input()!.dispatchEvent(new FocusEvent("blur"));
    await Promise.resolve();
    expect(ended).toHaveLength(0);
    expect(harness.input()).not.toBeNull();

    harness.input()!.dispatchEvent(new FocusEvent("blur"));
    await Promise.resolve();
    expect(ended).toHaveLength(1);
  });

  it("单行输入框按 Enter 提交", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const input = harness.input() as HTMLInputElement;
    const event = pressKey(input, "Enter");

    await Promise.resolve();
    expect(event.defaultPrevented).toBe(true);
    expect(harness.input()).toBeNull();
  });

  it("textarea 直接按 Enter 不提交（换行）", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true });
    const input = harness.input() as HTMLTextAreaElement;
    const event = pressKey(input, "Enter");

    await Promise.resolve();
    expect(event.defaultPrevented).toBe(false);
    expect(harness.input()).not.toBeNull();
  });

  it("textarea 按 Ctrl+Enter 提交", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true });
    const input = harness.input() as HTMLTextAreaElement;
    const event = pressKey(input, "Enter", { ctrlKey: true });

    await Promise.resolve();
    expect(event.defaultPrevented).toBe(true);
    expect(harness.input()).toBeNull();
  });

  it("textarea 按 Meta+Enter 提交", async () => {
    harness = createHarness({ rect: { x: 100, y: 200, width: 120, height: 100 } });
    await harness.manager.startEditing(CELL, { multiline: true });
    const input = harness.input() as HTMLTextAreaElement;
    const event = pressKey(input, "Enter", { metaKey: true });

    await Promise.resolve();
    expect(event.defaultPrevented).toBe(true);
  });

  it("Escape 取消编辑", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const cancelled: CellPosition[] = [];
    harness.manager.setCancelCallback((cell) => cancelled.push(cell));

    const event = pressKey(harness.input()!, "Escape");

    await Promise.resolve();
    expect(event.defaultPrevented).toBe(true);
    expect(cancelled).toEqual([CELL]);
    expect(harness.input()).toBeNull();
  });

  it("方向键不提交但阻止冒泡", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const input = harness.input() as HTMLInputElement;
    const bubbled: string[] = [];
    harness.wrapper.addEventListener("keydown", (e) => bubbled.push((e as KeyboardEvent).key));

    pressKey(input, "ArrowDown");
    await Promise.resolve();

    expect(bubbled).toHaveLength(0);
    expect(harness.input()).not.toBeNull();
  });

  it("wheel 事件阻止默认行为并回调滚动量", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const deltas: number[][] = [];
    harness.manager.setOnScrollCallback((dx, dy) => deltas.push([dx, dy]));

    const event = new WheelEvent("wheel", { deltaX: 3, deltaY: 7, bubbles: true, cancelable: true });
    harness.input()!.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(deltas).toEqual([[3, 7]]);
  });

  it("未注册滚动回调时 wheel 依然阻止默认行为", async () => {
    harness = createHarness();
    await harness.manager.startEditing(CELL);
    const event = new WheelEvent("wheel", { deltaY: 7, bubbles: true, cancelable: true });

    expect(() => harness.input()!.dispatchEvent(event)).not.toThrow();
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("EditorManager 配置注入与销毁", () => {
  it("setLocale 影响后续新建的编辑器（placeholder 样式）", async () => {
    harness = createHarness();
    const baseline = styleCount();
    const custom = { ...zhCN, emptyText: "空空如也" };
    harness.manager.setLocale(custom);
    await harness.manager.startEditing(CELL);
    // 仅验证不抛错且样式被注入
    expect(styleCount()).toBe(baseline + 1);
  });

  it("setTheme 后新编辑器使用新主题色", async () => {
    harness = createHarness();
    const theme = createMockTheme();
    theme.colors.selectionBorder = "#ff0000";
    harness.manager.setTheme(theme);
    await harness.manager.startEditing(CELL);

    const input = harness.input() as HTMLInputElement;
    expect(input.style.border).toMatch(colorPattern("#ff0000"));
  });

  it("destroy 清理输入框与编辑态", async () => {
    harness = createHarness();
    const baseline = styleCount();
    await harness.manager.startEditing(CELL);
    expect(harness.manager.isEditing()).toBe(true);

    harness.manager.destroy();

    expect(harness.manager.isEditing()).toBe(false);
    expect(harness.manager.getEditingCell()).toBeNull();
    expect(harness.input()).toBeNull();
    expect(styleCount()).toBe(baseline);
  });

  it("destroy 在无编辑态时安全幂等", () => {
    harness = createHarness();
    expect(() => {
      harness.manager.destroy();
      harness.manager.destroy();
    }).not.toThrow();
  });
});
