import { ClipboardHandler } from "@/core/handlers/ClipboardHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import type { SelectionHandler } from "@/core/handlers/SelectionHandler";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { LayoutManager } from "@/core/LayoutManager";
import { EditorRegistry } from "@/core/editors";
import { zhCN } from "@/locale";
import type { CellRange, Column, InteractionState, Row, ScrollState } from "@/types";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

/**
 * ClipboardHandler 与 SelectionHandler 的契约只有 getNormalizedRange 一个方法，
 * 这里用桩对象把它固定下来，使测试聚焦在剪贴板逻辑本身。
 */
function stubSelectionHandler(): SelectionHandler {
  return {
    getNormalizedRange: (range: CellRange) => ({
      minRow: Math.min(range.start.rowIndex, range.end.rowIndex),
      maxRow: Math.max(range.start.rowIndex, range.end.rowIndex),
      minCol: Math.min(range.start.columnIndex, range.end.columnIndex),
      maxCol: Math.max(range.start.columnIndex, range.end.columnIndex),
    }),
  } as unknown as SelectionHandler;
}

function cell(rowIndex: number, columnIndex: number) {
  return { rowIndex, columnIndex };
}

function range(start: [number, number], end: [number, number]): CellRange {
  return { start: cell(start[0], start[1]), end: cell(end[0], end[1]) };
}

interface SetupOptions {
  columns?: Column[];
  rows?: Row[];
  selectedCells?: CellRange[];
}

function setup(options: SetupOptions = {}) {
  const theme = createMockTheme();
  const canvas = createMockCanvas();
  const ctx = canvas.getContext("2d")!;

  const columns: Column[] = options.columns ?? [
    { key: "a", title: "A", width: 100, type: "text" },
    { key: "b", title: "B", width: 100, type: "text" },
    { key: "c", title: "C", width: 100, type: "text" },
  ];
  const rows: Row[] =
    options.rows ??
    [
      { id: "r0", data: { a: "a0", b: "b0", c: "c0" } },
      { id: "r1", data: { a: "a1", b: "b1", c: "c1" } },
      { id: "r2", data: { a: "a2", b: "b2", c: "c2" } },
    ];

  const layoutManager = new LayoutManager(undefined, theme);
  layoutManager.setViewportSize(800, 600);
  layoutManager.calculateLayout(columns, rows);

  const dataManager = new DataManager();
  dataManager.setColumns(columns);
  dataManager.setRows(rows);

  const state: InteractionState = {
    hoveredCell: null,
    selectedCells: options.selectedCells ?? [],
    editingCell: null,
    editingValue: null,
    isSelecting: false,
    selectionStart: null,
    isDragging: false,
    dragType: null,
    dragTarget: null,
    tooltip: null,
    dropdown: null,
    filterDropdown: null,
    dateDropdown: null,
    colorDropdown: null,
    buttonsDropdown: null,
    imageTooltip: null,
    imageEditor: null,
    contextMenu: null,
    headerContextMenu: null,
    switchAnimations: new Map(),
    buttonHoverStates: new Map(),
  };

  const scrollState: ScrollState = {
    scrollLeft: 0,
    scrollTop: 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
    isScrolling: false,
  };

  const emitter = new EventEmitter<InteractionEvents>();
  const handler = new ClipboardHandler(
    {
      state,
      scrollState,
      layoutManager,
      dataManager,
      canvas,
      ctx,
      expandColumnKey: null,
      locale: zhCN,
      editorRegistry: new EditorRegistry(),
    },
    emitter,
    stubSelectionHandler(),
  );

  return { handler, state, emitter, layoutManager, dataManager };
}

let writeText: jest.Mock;

beforeEach(() => {
  // tests/unit/setup.ts 已经用 Object.defineProperty（未开启 configurable）在
  // navigator 上装好了 clipboard 桩，该属性无法被重新定义。因此这里复用并重置
  // 它自带的 jest.fn，而不是再 defineProperty 一次（否则抛
  // "TypeError: Cannot redefine property: clipboard"）。
  writeText = navigator.clipboard.writeText as unknown as jest.Mock;
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  (document as unknown as { execCommand: jest.Mock }).execCommand = jest.fn(() => true);
});

describe("ClipboardHandler", () => {
  describe("hasSelection / getSelectionBounds", () => {
    it("没有选中单元格时 hasSelection 为 false、bounds 为 null", () => {
      const { handler } = setup();

      expect(handler.hasSelection()).toBe(false);
      expect(handler.getSelectionBounds()).toBeNull();
    });

    it("单个选区返回自身边界", () => {
      const { handler } = setup({ selectedCells: [range([1, 1], [2, 2])] });

      expect(handler.hasSelection()).toBe(true);
      expect(handler.getSelectionBounds()).toEqual({
        minRow: 1,
        maxRow: 2,
        minCol: 1,
        maxCol: 2,
      });
    });

    it("多个选区取并集", () => {
      const { handler } = setup({
        selectedCells: [range([0, 0], [1, 1]), range([2, 0], [2, 2])],
      });

      expect(handler.getSelectionBounds()).toEqual({
        minRow: 0,
        maxRow: 2,
        minCol: 0,
        maxCol: 2,
      });
    });

    it("反向拖拽的选区会被归一化", () => {
      const { handler } = setup({ selectedCells: [range([2, 2], [0, 0])] });

      expect(handler.getSelectionBounds()).toEqual({
        minRow: 0,
        maxRow: 2,
        minCol: 0,
        maxCol: 2,
      });
    });
  });

  describe("getSelectedText", () => {
    it("没有选中时返回空字符串", () => {
      const { handler } = setup();

      expect(handler.getSelectedText()).toBe("");
    });

    it("单个单元格返回其显示文本", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 0])] });

      expect(handler.getSelectedText()).toBe("a0");
    });

    it("同一行的多个单元格用制表符分隔", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 2])] });

      expect(handler.getSelectedText()).toBe("a0\tb0\tc0");
    });

    it("多行用换行符分隔", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [2, 1])] });

      expect(handler.getSelectedText()).toBe("a0\tb0\na1\tb1\na2\tb2");
    });

    it("多个选区依次拼接", () => {
      const { handler } = setup({
        selectedCells: [range([0, 0], [0, 0]), range([2, 2], [2, 2])],
      });

      expect(handler.getSelectedText()).toBe("a0\nc2");
    });

    it("行超出数据范围时跳过该行", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [9, 0])] });

      expect(handler.getSelectedText()).toBe("a0\na1\na2");
    });

    it("列超出列范围时跳过该列", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 9])] });

      expect(handler.getSelectedText()).toBe("a0\tb0\tc0");
    });
  });

  describe("getSelectedValues", () => {
    it("没有选中时返回空数组", () => {
      const { handler } = setup();

      expect(handler.getSelectedValues()).toEqual([]);
    });

    it("返回原始值（而非显示文本）", () => {
      const { handler } = setup({
        columns: [{ key: "n", title: "N", width: 100, type: "number" }],
        rows: [{ id: "r0", data: { n: 42 } }],
        selectedCells: [range([0, 0], [0, 0])],
      });

      expect(handler.getSelectedValues()).toEqual([[42]]);
    });

    it("返回二维数组结构", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [1, 1])] });

      expect(handler.getSelectedValues()).toEqual([
        ["a0", "b0"],
        ["a1", "b1"],
      ]);
    });

    it("字段映射 field 优先于 key", () => {
      const { handler } = setup({
        columns: [{ key: "alias", field: "a", title: "A", width: 100, type: "text" }],
        rows: [{ id: "r0", data: { a: "mapped" } }],
        selectedCells: [range([0, 0], [0, 0])],
      });

      expect(handler.getSelectedValues()).toEqual([["mapped"]]);
    });

    it("行越界时跳过", () => {
      const { handler } = setup({ selectedCells: [range([5, 0], [6, 0])] });

      expect(handler.getSelectedValues()).toEqual([]);
    });

    it("列越界时跳过", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 9])] });

      expect(handler.getSelectedValues()).toEqual([["a0", "b0", "c0"]]);
    });
  });

  describe("getSelectedCSV", () => {
    it("没有选中时返回空字符串", () => {
      const { handler } = setup();

      expect(handler.getSelectedCSV()).toBe("");
    });

    it("普通值直接拼接", () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [1, 1])] });

      expect(handler.getSelectedCSV()).toBe("a0,b0\na1,b1");
    });

    it("含逗号的值会被引号包裹", () => {
      const { handler } = setup({
        columns: [{ key: "a", title: "A", width: 100, type: "text" }],
        rows: [{ id: "r0", data: { a: "x,y" } }],
        selectedCells: [range([0, 0], [0, 0])],
      });

      expect(handler.getSelectedCSV()).toBe('"x,y"');
    });

    it("含双引号的值会被转义为两个双引号", () => {
      const { handler } = setup({
        columns: [{ key: "a", title: "A", width: 100, type: "text" }],
        rows: [{ id: "r0", data: { a: 'say "hi"' } }],
        selectedCells: [range([0, 0], [0, 0])],
      });

      expect(handler.getSelectedCSV()).toBe('"say ""hi"""');
    });

    it("含换行的值会被引号包裹", () => {
      const { handler } = setup({
        columns: [{ key: "a", title: "A", width: 100, type: "text" }],
        rows: [{ id: "r0", data: { a: "l1\nl2" } }],
        selectedCells: [range([0, 0], [0, 0])],
      });

      expect(handler.getSelectedCSV()).toBe('"l1\nl2"');
    });

    it("null 与 undefined 输出为空字段", () => {
      const { handler } = setup({
        columns: [
          { key: "a", title: "A", width: 100, type: "text" },
          { key: "b", title: "B", width: 100, type: "text" },
        ],
        rows: [{ id: "r0", data: { a: null, b: undefined } }],
        selectedCells: [range([0, 0], [0, 1])],
      });

      expect(handler.getSelectedCSV()).toBe(",");
    });
  });

  describe("copySelection", () => {
    it("没有选中内容时不访问剪贴板", async () => {
      const { handler } = setup();

      await handler.copySelection();

      expect(writeText).not.toHaveBeenCalled();
    });

    it("有选中内容时写入剪贴板", async () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 1])] });

      await handler.copySelection();

      expect(writeText).toHaveBeenCalledWith("a0\tb0");
    });

    it("写入失败时回退到 execCommand", async () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 0])] });
      writeText.mockRejectedValueOnce(new Error("not allowed"));

      await handler.copySelection();

      const execCommand = (document as unknown as { execCommand: jest.Mock }).execCommand;
      expect(execCommand).toHaveBeenCalledWith("copy");
    });

    it("回退时创建的 textarea 会被清理掉", async () => {
      const { handler } = setup({ selectedCells: [range([0, 0], [0, 0])] });
      writeText.mockRejectedValueOnce(new Error("not allowed"));

      await handler.copySelection();

      expect(document.querySelectorAll("textarea")).toHaveLength(0);
    });
  });
});
