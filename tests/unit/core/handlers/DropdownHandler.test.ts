import { LayoutManager } from "@/core/LayoutManager";
import { DataManager } from "@/core/DataManager";
import { EventEmitter } from "@/core/EventEmitter";
import { DropdownHandler } from "@/core/handlers/DropdownHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import { EditorRegistry } from "@/core/editors";
import { TableEvents } from "@/constants/events";
import { zhCN } from "@/locale";
import type {
  Column,
  Row,
  InteractionState,
  ScrollState,
  DropdownState,
  FilterDropdownState,
  DateDropdownState,
  ColorPickerDropdownState,
  ButtonsDropdownState,
  CellPosition,
} from "@/types";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

const CELL: CellPosition = { rowIndex: 0, columnIndex: 0 };

function at(clientX: number, clientY: number): MouseEvent {
  return { clientX, clientY } as unknown as MouseEvent;
}

function createState(overrides: Partial<InteractionState> = {}): InteractionState {
  return {
    hoveredCell: null,
    selectedCells: [],
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
    hoveredImageIndex: -1,
    hoveredButtonIndex: -1,
    ...overrides,
  };
}

interface SetupOptions {
  columns?: Column[];
  rows?: Row[];
  state?: Partial<InteractionState>;
}

function setup(options: SetupOptions = {}) {
  const theme = createMockTheme();
  const canvas = createMockCanvas();
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${theme.font.size}px ${theme.font.family}`;

  const columns: Column[] = options.columns ?? [
    { key: "name", title: "Name", width: 120, type: "text" },
  ];
  const rows: Row[] = options.rows ?? [{ id: "row-1", data: { name: "Alice" } }];

  const layoutManager = new LayoutManager(undefined, theme);
  layoutManager.setViewportSize(800, 600);
  layoutManager.calculateLayout(columns, rows);

  const dataManager = new DataManager();
  dataManager.setColumns(columns);
  dataManager.setRows(rows);

  const state = createState(options.state);
  const scrollState: ScrollState = {
    scrollLeft: 0,
    scrollTop: 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
    isScrolling: false,
  };
  const emitter = new EventEmitter<InteractionEvents>();

  const handler = new DropdownHandler(
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
  );

  return { handler, state, emitter, layoutManager, dataManager, canvas, ctx, columns, rows, scrollState };
}

function selectDropdown(overrides: Partial<DropdownState> = {}): DropdownState {
  return {
    cell: CELL,
    config: {
      value: undefined,
      options: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
        { label: "C", value: "c" },
      ],
    },
    x: 100,
    y: 200,
    width: 150,
    scrollTop: 0,
    hoveredIndex: -1,
    ...overrides,
  };
}

function tagsDropdown(overrides: Partial<DropdownState> = {}): DropdownState {
  return {
    cell: CELL,
    config: { options: [] },
    x: 100,
    y: 200,
    width: 150,
    scrollTop: 0,
    hoveredIndex: -1,
    type: "tags",
    tagsConfig: {
      tags: [],
      options: [
        { text: "Red", value: "red" },
        { text: "Green", value: "green" },
        { text: "Blue", value: "blue" },
      ],
      selectedValues: [],
      multiple: true,
    },
    ...overrides,
  };
}

function filterDropdown(overrides: Partial<FilterDropdownState> = {}): FilterDropdownState {
  return {
    columnKey: "name",
    mode: "select",
    x: 200,
    y: 100,
    width: 200,
    scrollTop: 0,
    hoveredIndex: -1,
    searchText: "",
    ...overrides,
  };
}

function dateDropdown(overrides: Partial<DateDropdownState> = {}): DateDropdownState {
  return {
    cell: CELL,
    config: {},
    x: 100,
    y: 100,
    width: 240,
    currentYear: 2026,
    currentMonth: 0,
    selectedDate: null,
    hoveredDate: null,
    ...overrides,
  };
}

function colorDropdown(overrides: Partial<ColorPickerDropdownState> = {}): ColorPickerDropdownState {
  return {
    cell: CELL,
    config: { value: "#000000" },
    x: 100,
    y: 100,
    width: 236,
    hoveredColor: null,
    ...overrides,
  };
}

function buttonsDropdown(overrides: Partial<ButtonsDropdownState> = {}): ButtonsDropdownState {
  return {
    cell: CELL,
    x: 300,
    y: 300,
    buttons: [
      { text: "Edit", actionKey: "edit" },
      { text: "Delete", actionKey: "delete" },
    ],
    hoveredIndex: -1,
    buttonRelativeX: 0,
    buttonY: 300,
    buttonHeight: 24,
    showAbove: false,
    ...overrides,
  };
}

describe("DropdownHandler", () => {
  describe("handleDropdownClick - select 模式", () => {
    it("没有打开的下拉框时返回 false", () => {
      const { handler } = setup();
      expect(handler.handleDropdownClick(at(110, 205))).toBe(false);
    });

    it("多选模式下选中新项会追加到 value 并派发 selectChange", () => {
      const listener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          dropdown: selectDropdown({
            config: {
              value: ["a"],
              multiple: true,
              options: [
                { label: "A", value: "a" },
                { label: "B", value: "b" },
              ],
            },
          }),
        },
      });
      emitter.on(TableEvents.SELECT_CHANGE, listener);

      const handled = handler.handleDropdownClick(at(110, 237));

      expect(handled).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]![1]).toEqual(["a", "b"]);
      expect(listener.mock.calls[0]![2]).toBe(true);
      expect(state.dropdown!.config.value).toEqual(["a", "b"]);
    });

    it("多选模式下再次点击已选项会将其移除", () => {
      const listener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          dropdown: selectDropdown({
            config: {
              value: ["a", "b"],
              multiple: true,
              options: [
                { label: "A", value: "a" },
                { label: "B", value: "b" },
              ],
            },
          }),
        },
      });
      emitter.on(TableEvents.SELECT_CHANGE, listener);

      handler.handleDropdownClick(at(110, 205));

      expect(listener.mock.calls[0]![1]).toEqual(["b"]);
      expect(state.dropdown!.config.value).toEqual(["b"]);
    });

    it("单选模式下派发单个值且 multiple 为 false", () => {
      const listener = jest.fn();
      const { handler, emitter } = setup({
        state: { dropdown: selectDropdown() },
      });
      emitter.on(TableEvents.SELECT_CHANGE, listener);

      const handled = handler.handleDropdownClick(at(110, 269));

      expect(handled).toBe(true);
      expect(listener.mock.calls[0]![1]).toBe("c");
      expect(listener.mock.calls[0]![2]).toBe(false);
    });

    it("点击下拉框外部返回 false", () => {
      const { handler } = setup({ state: { dropdown: selectDropdown() } });
      expect(handler.handleDropdownClick(at(10, 10))).toBe(false);
    });

    it("点击 disabled 选项不会派发事件", () => {
      const listener = jest.fn();
      const { handler, emitter } = setup({
        state: {
          dropdown: selectDropdown({
            config: {
              options: [{ label: "A", value: "a", disabled: true }],
            },
          }),
        },
      });
      emitter.on(TableEvents.SELECT_CHANGE, listener);

      expect(handler.handleDropdownClick(at(110, 205))).toBe(true);
      expect(listener).not.toHaveBeenCalled();
    });

    it("滚动后 itemIndex 超出选项数量时不派发事件但仍返回 true", () => {
      const listener = jest.fn();
      const options = Array.from({ length: 10 }, (_, i) => ({ label: `O${i}`, value: i }));
      const { handler, emitter } = setup({
        state: {
          dropdown: selectDropdown({
            scrollTop: 320,
            config: { options },
          }),
        },
      });
      emitter.on(TableEvents.SELECT_CHANGE, listener);

      expect(handler.handleDropdownClick(at(110, 205))).toBe(true);
      expect(listener).not.toHaveBeenCalled();
    });

    it("JSX 来源的多选下拉会调用 onChange 而不是派发 selectChange", () => {
      const onChange = jest.fn();
      const selectChange = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          dropdown: selectDropdown({
            source: "jsx",
            onChange,
            config: { value: [], multiple: true, options: [{ label: "A", value: "a" }] },
          }),
        },
      });
      emitter.on(TableEvents.SELECT_CHANGE, selectChange);

      const handled = handler.handleDropdownClick(at(110, 205));

      expect(handled).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0]![0]).toEqual(["a"]);
      expect(selectChange).not.toHaveBeenCalled();
      expect(state.dropdown!.config.value).toEqual(["a"]);
    });

    it("JSX 来源的单选下拉会调用 onChange 并关闭下拉", () => {
      const onChange = jest.fn();
      const closeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          dropdown: selectDropdown({
            source: "jsx",
            onChange,
            config: { options: [{ label: "A", value: "a" }] },
          }),
        },
      });
      emitter.on(TableEvents.DROPDOWN_CLOSE, closeListener);

      const handled = handler.handleDropdownClick(at(110, 205));

      expect(handled).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(state.dropdown).toBeNull();
      expect(closeListener).toHaveBeenCalledWith(CELL);
    });

    it("onChange 同步抛错时捕获并打印错误，不影响返回值", () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { handler, state } = setup({
        state: {
          dropdown: selectDropdown({
            onChange: () => {
              throw new Error("boom");
            },
            config: { options: [{ label: "A", value: "a" }] },
          }),
        },
      });

      expect(handler.handleDropdownClick(at(110, 205))).toBe(true);
      expect(errorSpy).toHaveBeenCalled();
      expect(state.dropdown).toBeNull();

      errorSpy.mockRestore();
    });

    it("onChange 返回 rejected promise 时异步捕获错误", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { handler } = setup({
        state: {
          dropdown: selectDropdown({
            onChange: () => Promise.reject(new Error("async boom")),
            config: { options: [{ label: "A", value: "a" }] },
          }),
        },
      });

      handler.handleDropdownClick(at(110, 205));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe("handleDropdownClick - tags 模式", () => {
    it("多选标签点击未选项会追加到 selectedValues", () => {
      const listener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { dropdown: tagsDropdown() },
      });
      emitter.on(TableEvents.TAGS_CHANGE, listener);

      const handled = handler.handleDropdownClick(at(110, 237));

      expect(handled).toBe(true);
      expect(listener.mock.calls[0]![1]).toEqual(["green"]);
      expect(listener.mock.calls[0]![2]).toBe(true);
      expect(state.dropdown!.tagsConfig!.selectedValues).toEqual(["green"]);
    });

    it("多选标签点击已选项会从 selectedValues 移除", () => {
      const listener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          dropdown: tagsDropdown({
            tagsConfig: {
              tags: [],
              options: [{ text: "Red", value: "red" }],
              selectedValues: ["red"],
              multiple: true,
            },
          }),
        },
      });
      emitter.on(TableEvents.TAGS_CHANGE, listener);

      handler.handleDropdownClick(at(110, 205));

      expect(listener.mock.calls[0]![1]).toEqual([]);
      expect(state.dropdown!.tagsConfig!.selectedValues).toEqual([]);
    });

    it("单选标签使用 option.text 兜底并派发 multiple=false", () => {
      const listener = jest.fn();
      const { handler, emitter } = setup({
        state: {
          dropdown: tagsDropdown({
            tagsConfig: {
              tags: [],
              options: [{ text: "Solo" }],
              selectedValues: [],
              multiple: false,
            },
          }),
        },
      });
      emitter.on(TableEvents.TAGS_CHANGE, listener);

      expect(handler.handleDropdownClick(at(110, 205))).toBe(true);
      expect(listener.mock.calls[0]![1]).toEqual(["Solo"]);
      expect(listener.mock.calls[0]![2]).toBe(false);
    });

    it("disabled 标签不派发事件", () => {
      const listener = jest.fn();
      const { handler, emitter } = setup({
        state: {
          dropdown: tagsDropdown({
            tagsConfig: {
              tags: [],
              options: [{ text: "Red", value: "red", disabled: true }],
              selectedValues: [],
            },
          }),
        },
      });
      emitter.on(TableEvents.TAGS_CHANGE, listener);

      expect(handler.handleDropdownClick(at(110, 205))).toBe(true);
      expect(listener).not.toHaveBeenCalled();
    });

    it("标签下拉没有选项时返回 false", () => {
      const { handler } = setup({
        state: {
          dropdown: tagsDropdown({
            tagsConfig: { tags: [], options: [], selectedValues: [] },
          }),
        },
      });
      expect(handler.handleDropdownClick(at(110, 205))).toBe(false);
    });

    it("点击标签下拉外部返回 false", () => {
      const { handler } = setup({ state: { dropdown: tagsDropdown() } });
      expect(handler.handleDropdownClick(at(500, 500))).toBe(false);
    });
  });

  describe("handleDropdownHover", () => {
    it("没有下拉框时直接返回", () => {
      const { handler, state } = setup();
      handler.handleDropdownHover(at(110, 205));
      expect(state.dropdown).toBeNull();
    });

    it("hover 到选项上会更新 hoveredIndex", () => {
      const hoverListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { dropdown: selectDropdown() },
      });
      emitter.on(TableEvents.DROPDOWN_HOVER, hoverListener);

      handler.handleDropdownHover(at(110, 237));

      expect(state.dropdown!.hoveredIndex).toBe(1);
      expect(hoverListener).toHaveBeenCalled();
    });

    it("hover 到下拉框外会将 hoveredIndex 重置为 -1", () => {
      const { handler, state } = setup({
        state: { dropdown: selectDropdown({ hoveredIndex: 2 }) },
      });

      handler.handleDropdownHover(at(10, 10));

      expect(state.dropdown!.hoveredIndex).toBe(-1);
    });

    it("tags 模式下 hover 会更新 hoveredIndex", () => {
      const { handler, state } = setup({
        state: { dropdown: tagsDropdown() },
      });

      handler.handleDropdownHover(at(110, 269));

      expect(state.dropdown!.hoveredIndex).toBe(2);
    });

    it("tags 模式下 hover 到外部会重置 hoveredIndex", () => {
      const { handler, state } = setup({
        state: { dropdown: tagsDropdown({ hoveredIndex: 1 }) },
      });

      handler.handleDropdownHover(at(900, 900));

      expect(state.dropdown!.hoveredIndex).toBe(-1);
    });
  });

  describe("handleButtonsDropdownClick / handleButtonsDropdownHover", () => {
    it("没有按钮下拉时返回 false", () => {
      const { handler } = setup();
      expect(handler.handleButtonsDropdownClick(at(310, 305))).toBe(false);
    });

    it("源列不可编辑时关闭下拉并派发关闭事件", () => {
      const closeListener = jest.fn();
      const buttonListener = jest.fn();
      const { handler, state, emitter } = setup({
        columns: [{ key: "action", title: "Action", width: 120, type: "button", editable: false }],
        state: { buttonsDropdown: buttonsDropdown() },
      });
      emitter.on(TableEvents.BUTTONS_DROPDOWN_CLOSE, closeListener);
      emitter.on(TableEvents.BUTTON_CLICK, buttonListener);

      expect(handler.handleButtonsDropdownClick(at(310, 305))).toBe(true);
      expect(state.buttonsDropdown).toBeNull();
      expect(closeListener).toHaveBeenCalled();
      expect(buttonListener).not.toHaveBeenCalled();
    });

    it("点击按钮项会派发 buttonClick 并携带 actionKey", () => {
      const closeListener = jest.fn();
      const buttonListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { buttonsDropdown: buttonsDropdown() },
      });
      emitter.on(TableEvents.BUTTONS_DROPDOWN_CLOSE, closeListener);
      emitter.on(TableEvents.BUTTON_CLICK, buttonListener);

      expect(handler.handleButtonsDropdownClick(at(310, 340))).toBe(true);
      expect(state.buttonsDropdown).toBeNull();
      expect(closeListener).toHaveBeenCalled();
      expect(buttonListener.mock.calls[0]![1]).toBe("delete");
    });

    it("点击列表下方空白只关闭下拉不派发 buttonClick", () => {
      const buttonListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { buttonsDropdown: buttonsDropdown() },
      });
      emitter.on(TableEvents.BUTTON_CLICK, buttonListener);

      expect(handler.handleButtonsDropdownClick(at(310, 364))).toBe(true);
      expect(state.buttonsDropdown).toBeNull();
      expect(buttonListener).not.toHaveBeenCalled();
    });

    it("点击按钮下拉外部也会关闭下拉", () => {
      const closeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { buttonsDropdown: buttonsDropdown() },
      });
      emitter.on(TableEvents.BUTTONS_DROPDOWN_CLOSE, closeListener);

      expect(handler.handleButtonsDropdownClick(at(700, 700))).toBe(true);
      expect(state.buttonsDropdown).toBeNull();
      expect(closeListener).toHaveBeenCalled();
    });

    it("hover 时源列不可编辑会重置 hoveredIndex", () => {
      const { handler, state } = setup({
        columns: [{ key: "action", title: "Action", width: 120, type: "button", editable: false }],
        state: { buttonsDropdown: buttonsDropdown({ hoveredIndex: 1 }) },
      });

      handler.handleButtonsDropdownHover(at(310, 305));

      expect(state.buttonsDropdown!.hoveredIndex).toBe(-1);
    });

    it("hover 到按钮项会更新 hoveredIndex", () => {
      const hoverListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { buttonsDropdown: buttonsDropdown() },
      });
      emitter.on(TableEvents.DROPDOWN_HOVER, hoverListener);

      handler.handleButtonsDropdownHover(at(310, 340));

      expect(state.buttonsDropdown!.hoveredIndex).toBe(1);
      expect(hoverListener).toHaveBeenCalled();
    });

    it("hover 到按钮下拉外部会重置 hoveredIndex", () => {
      const { handler, state } = setup({
        state: { buttonsDropdown: buttonsDropdown({ hoveredIndex: 0 }) },
      });

      handler.handleButtonsDropdownHover(at(10, 10));

      expect(state.buttonsDropdown!.hoveredIndex).toBe(-1);
    });

    it("没有按钮下拉时 hover 直接返回", () => {
      const { handler } = setup();
      expect(() => handler.handleButtonsDropdownHover(at(310, 305))).not.toThrow();
    });
  });

  describe("handleFilterDropdownClick - select 模式", () => {
    const options = [
      { label: "A", value: "a", checked: false },
      { label: "B", value: "b", checked: false },
      { label: "C", value: "c", checked: false },
    ];

    it("没有筛选下拉时返回 false", () => {
      const { handler } = setup();
      expect(handler.handleFilterDropdownClick(at(250, 149))).toBe(false);
    });

    it("点击选项会切换 checked 并派发 change", () => {
      const changeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { filterDropdown: filterDropdown({ options: options.map((o) => ({ ...o })) }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CHANGE, changeListener);

      expect(handler.handleFilterDropdownClick(at(250, 149))).toBe(true);
      expect(state.filterDropdown!.options![0]!.checked).toBe(true);
      expect(changeListener).toHaveBeenCalled();
    });

    it("点击重置按钮会清空所有 checked 并派发 reset", () => {
      const resetListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({
            options: options.map((o) => ({ ...o, checked: true })),
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_RESET, resetListener);

      expect(handler.handleFilterDropdownClick(at(215, 250))).toBe(true);
      expect(state.filterDropdown!.options!.every((o) => !o.checked)).toBe(true);
      expect(resetListener).toHaveBeenCalled();
    });

    it("点击确定按钮派发 confirm", () => {
      const confirmListener = jest.fn();
      const { handler, emitter } = setup({
        state: { filterDropdown: filterDropdown({ options: options.map((o) => ({ ...o })) }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CONFIRM, confirmListener);

      expect(handler.handleFilterDropdownClick(at(380, 250))).toBe(true);
      expect(confirmListener).toHaveBeenCalled();
    });

    it("点击列表与按钮之间的空隙不触发任何事件", () => {
      const changeListener = jest.fn();
      const confirmListener = jest.fn();
      const resetListener = jest.fn();
      const { handler, emitter } = setup({
        state: { filterDropdown: filterDropdown({ options: options.map((o) => ({ ...o })) }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CHANGE, changeListener);
      emitter.on(TableEvents.FILTER_DROPDOWN_CONFIRM, confirmListener);
      emitter.on(TableEvents.FILTER_DROPDOWN_RESET, resetListener);

      expect(handler.handleFilterDropdownClick(at(250, 242))).toBe(true);
      expect(changeListener).not.toHaveBeenCalled();
      expect(confirmListener).not.toHaveBeenCalled();
      expect(resetListener).not.toHaveBeenCalled();
    });

    it("点击下拉框外部返回 false", () => {
      const { handler } = setup({
        state: { filterDropdown: filterDropdown({ options: options.map((o) => ({ ...o })) }) },
      });
      expect(handler.handleFilterDropdownClick(at(10, 10))).toBe(false);
    });

    it("options 缺失时直接返回且不报错", () => {
      const { handler } = setup({
        state: { filterDropdown: filterDropdown({ options: undefined }) },
      });
      expect(handler.handleFilterDropdownClick(at(250, 110))).toBe(true);
    });

    it("选项超过可见数量时点击滚动条进入拖拽状态", () => {
      const many = Array.from({ length: 12 }, (_, i) => ({
        label: `O${i}`,
        value: i,
        checked: false,
      }));
      const { handler, state } = setup({
        state: { filterDropdown: filterDropdown({ options: many, scrollTop: 0 }) },
      });

      expect(handler.handleFilterDropdownClick(at(395, 200))).toBe(true);
      expect(state.filterDropdown!.isScrollbarDragging).toBe(true);
      expect(state.filterDropdown!.scrollbarDragStartScrollTop).toBe(0);
    });

    it("滚动后 itemIndex 超出选项范围不切换 checked", () => {
      const changeListener = jest.fn();
      const many = Array.from({ length: 12 }, (_, i) => ({
        label: `O${i}`,
        value: i,
        checked: false,
      }));
      // 12 项、每项 32px、可视 8 项：scrollTop 400 会让首行命中 index 12，超出选项范围
      const { handler, state, emitter } = setup({
        state: { filterDropdown: filterDropdown({ options: many, scrollTop: 400 }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CHANGE, changeListener);

      handler.handleFilterDropdownClick(at(250, 149));

      expect(changeListener).not.toHaveBeenCalled();
      expect(state.filterDropdown!.options!.every((o) => !o.checked)).toBe(true);
    });
  });

  describe("handleFilterDropdownClick - search / range / boolean 模式", () => {
    it("search 模式点击重置会清空 searchValue", () => {
      const resetListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({ mode: "search", searchValue: "abc" }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_RESET, resetListener);

      expect(handler.handleFilterDropdownClick(at(215, 160))).toBe(true);
      expect(state.filterDropdown!.searchValue).toBe("");
      expect(resetListener).toHaveBeenCalled();
    });

    it("search 模式点击确定派发 confirm", () => {
      const confirmListener = jest.fn();
      const { handler, emitter } = setup({
        state: { filterDropdown: filterDropdown({ mode: "search" }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CONFIRM, confirmListener);

      expect(handler.handleFilterDropdownClick(at(380, 160))).toBe(true);
      expect(confirmListener).toHaveBeenCalled();
    });

    it("range 模式点击重置会清空 min/max", () => {
      const resetListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({ mode: "range", minValue: 1, maxValue: 9 }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_RESET, resetListener);

      expect(handler.handleFilterDropdownClick(at(215, 160))).toBe(true);
      expect(state.filterDropdown!.minValue).toBe("");
      expect(state.filterDropdown!.maxValue).toBe("");
      expect(resetListener).toHaveBeenCalled();
    });

    it("range 模式点击确定派发 confirm", () => {
      const confirmListener = jest.fn();
      const { handler, emitter } = setup({
        state: { filterDropdown: filterDropdown({ mode: "range" }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CONFIRM, confirmListener);

      expect(handler.handleFilterDropdownClick(at(380, 160))).toBe(true);
      expect(confirmListener).toHaveBeenCalled();
    });

    it("boolean 模式点击第一项会选中 all", () => {
      const changeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { filterDropdown: filterDropdown({ mode: "boolean" }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CHANGE, changeListener);

      expect(handler.handleFilterDropdownClick(at(250, 115))).toBe(true);
      expect(state.filterDropdown!.boolValue).toBe("all");
      expect(changeListener).toHaveBeenCalled();
    });

    it("boolean 模式点击第三项会选中 false", () => {
      const { handler, state } = setup({
        state: { filterDropdown: filterDropdown({ mode: "boolean" }) },
      });

      handler.handleFilterDropdownClick(at(250, 180));

      expect(state.filterDropdown!.boolValue).toBe("false");
    });

    it("boolean 模式点击列表边界外不改变取值", () => {
      const changeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { filterDropdown: filterDropdown({ mode: "boolean", boolValue: "all" }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CHANGE, changeListener);

      handler.handleFilterDropdownClick(at(250, 204));

      expect(state.filterDropdown!.boolValue).toBe("all");
      expect(changeListener).not.toHaveBeenCalled();
    });

    it("boolean 模式点击重置会恢复为 all", () => {
      const resetListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { filterDropdown: filterDropdown({ mode: "boolean", boolValue: "true" }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_RESET, resetListener);

      expect(handler.handleFilterDropdownClick(at(215, 220))).toBe(true);
      expect(state.filterDropdown!.boolValue).toBe("all");
      expect(resetListener).toHaveBeenCalled();
    });

    it("boolean 模式点击确定派发 confirm", () => {
      const confirmListener = jest.fn();
      const { handler, emitter } = setup({
        state: { filterDropdown: filterDropdown({ mode: "boolean" }) },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CONFIRM, confirmListener);

      expect(handler.handleFilterDropdownClick(at(380, 220))).toBe(true);
      expect(confirmListener).toHaveBeenCalled();
    });
  });

  describe("handleFilterDropdownClick - dateRange 模式", () => {
    function dateRangeState(overrides: Partial<FilterDropdownState> = {}) {
      return filterDropdown({ mode: "dateRange", width: 240, ...overrides });
    }

    it("点击开始日期输入框会激活 startDate 并初始化日历", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { filterDropdown: dateRangeState() },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      expect(handler.handleFilterDropdownClick(at(250, 120))).toBe(true);
      expect(state.filterDropdown!.activeDateField).toBe("startDate");
      expect(state.filterDropdown!.currentYear).toBe(new Date().getFullYear());
      expect(state.filterDropdown!.currentMonth).toBe(new Date().getMonth());
      expect(state.filterDropdown!.hoveredDate).toBeNull();
      expect(openListener).toHaveBeenCalled();
    });

    it("点击结束日期输入框会激活 endDate", () => {
      const { handler, state } = setup({
        state: { filterDropdown: dateRangeState() },
      });

      handler.handleFilterDropdownClick(at(350, 120));

      expect(state.filterDropdown!.activeDateField).toBe("endDate");
    });

    it("已存在的 startDate 会作为日历初始月份", () => {
      const existing = new Date(2024, 5, 15);
      const { handler, state } = setup({
        state: { filterDropdown: dateRangeState({ startDate: existing }) },
      });

      handler.handleFilterDropdownClick(at(250, 120));

      expect(state.filterDropdown!.currentYear).toBe(2024);
      expect(state.filterDropdown!.currentMonth).toBe(5);
    });

    it("点击下拉框与日历之外返回 false", () => {
      const { handler } = setup({
        state: { filterDropdown: dateRangeState() },
      });
      expect(handler.handleFilterDropdownClick(at(10, 10))).toBe(false);
    });

    it("点击日历左箭头切到上一个月", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: dateRangeState({
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 5,
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      expect(handler.handleFilterDropdownClick(at(220, 160))).toBe(true);
      expect(state.filterDropdown!.currentMonth).toBe(4);
      expect(state.filterDropdown!.hoveredDate).toBeNull();
      expect(openListener).toHaveBeenCalled();
    });

    it("一月点击左箭头会跨年到十二月", () => {
      const { handler, state } = setup({
        state: {
          filterDropdown: dateRangeState({
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
          }),
        },
      });

      handler.handleFilterDropdownClick(at(220, 160));

      expect(state.filterDropdown!.currentYear).toBe(2025);
      expect(state.filterDropdown!.currentMonth).toBe(11);
    });

    it("十二月点击右箭头会跨年到一月", () => {
      const { handler, state } = setup({
        state: {
          filterDropdown: dateRangeState({
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 11,
          }),
        },
      });

      handler.handleFilterDropdownClick(at(420, 160));

      expect(state.filterDropdown!.currentYear).toBe(2027);
      expect(state.filterDropdown!.currentMonth).toBe(0);
    });

    it("点击右箭头切到下一个月", () => {
      const { handler, state } = setup({
        state: {
          filterDropdown: dateRangeState({
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
          }),
        },
      });

      handler.handleFilterDropdownClick(at(420, 160));

      expect(state.filterDropdown!.currentMonth).toBe(1);
    });

    it("点击日期格子会写入 startDate 并清空日历状态", () => {
      const changeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: dateRangeState({
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CHANGE, changeListener);

      expect(handler.handleFilterDropdownClick(at(250, 280))).toBe(true);
      expect(state.filterDropdown!.startDate).toEqual(new Date(2026, 0, 12));
      expect(state.filterDropdown!.activeDateField).toBeUndefined();
      expect(state.filterDropdown!.currentYear).toBeUndefined();
      expect(state.filterDropdown!.currentMonth).toBeUndefined();
      expect(state.filterDropdown!.hoveredDate).toBeNull();
      expect(changeListener).toHaveBeenCalled();
    });

    it("激活 endDate 时点击日期格子会写入 endDate", () => {
      const { handler, state } = setup({
        state: {
          filterDropdown: dateRangeState({
            activeDateField: "endDate",
            currentYear: 2026,
            currentMonth: 0,
          }),
        },
      });

      handler.handleFilterDropdownClick(at(250, 280));

      expect(state.filterDropdown!.endDate).toEqual(new Date(2026, 0, 12));
      expect(state.filterDropdown!.startDate).toBeUndefined();
    });

    it("点击日历内的空白区域返回 true 且不改变日期", () => {
      const changeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: dateRangeState({
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CHANGE, changeListener);

      expect(handler.handleFilterDropdownClick(at(250, 210))).toBe(true);
      expect(state.filterDropdown!.startDate).toBeUndefined();
      expect(changeListener).not.toHaveBeenCalled();
    });

    it("点击重置会清空日期与日历状态", () => {
      const resetListener = jest.fn();
      // 下拉框宽度 240 时日历左右两次钳制后仍落在 x=200..440，会盖住重置按钮（见下一个用例）；
      // 宽度放宽到 480 后日历移到 x=438 起，重置按钮 x=208..232 不再被覆盖
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: dateRangeState({
            width: 480,
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 31),
            activeDateField: "endDate",
            currentYear: 2026,
            currentMonth: 0,
            hoveredDate: new Date(2026, 0, 5),
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_RESET, resetListener);

      expect(handler.handleFilterDropdownClick(at(215, 160))).toBe(true);
      expect(state.filterDropdown!.startDate).toBeNull();
      expect(state.filterDropdown!.endDate).toBeNull();
      expect(state.filterDropdown!.activeDateField).toBeUndefined();
      expect(state.filterDropdown!.currentYear).toBeUndefined();
      expect(state.filterDropdown!.currentMonth).toBeUndefined();
      expect(state.filterDropdown!.hoveredDate).toBeNull();
      expect(resetListener).toHaveBeenCalled();
    });

    it("激活 startDate 时日历覆盖重置按钮区域，点击会被日历优先处理", () => {
      const resetListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: dateRangeState({
            startDate: new Date(2026, 0, 1),
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 5,
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_RESET, resetListener);

      // x=215 同时落在重置按钮与日历左箭头的命中范围内，日历分支先返回
      expect(handler.handleFilterDropdownClick(at(215, 160))).toBe(true);
      expect(resetListener).not.toHaveBeenCalled();
      expect(state.filterDropdown!.currentMonth).toBe(4);
      expect(state.filterDropdown!.startDate).toEqual(new Date(2026, 0, 1));
    });

    it("点击确定按钮派发 confirm", () => {
      const confirmListener = jest.fn();
      const { handler, emitter } = setup({
        state: { filterDropdown: dateRangeState() },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_CONFIRM, confirmListener);

      expect(handler.handleFilterDropdownClick(at(420, 160))).toBe(true);
      expect(confirmListener).toHaveBeenCalled();
    });
  });

  describe("handleFilterDropdownHover", () => {
    it("没有筛选下拉时直接返回", () => {
      const { handler } = setup();
      expect(() => handler.handleFilterDropdownHover(at(250, 149))).not.toThrow();
    });

    it("select 模式 hover 到选项会更新 hoveredIndex", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({
            options: [
              { label: "A", value: "a", checked: false },
              { label: "B", value: "b", checked: false },
            ],
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      handler.handleFilterDropdownHover(at(250, 140));

      expect(state.filterDropdown!.hoveredIndex).toBe(0);
      expect(openListener).toHaveBeenCalled();
    });

    it("select 模式 hover 到列表外会重置 hoveredIndex", () => {
      const { handler, state } = setup({
        state: {
          filterDropdown: filterDropdown({
            hoveredIndex: 1,
            options: [{ label: "A", value: "a", checked: false }],
          }),
        },
      });

      handler.handleFilterDropdownHover(at(10, 10));

      expect(state.filterDropdown!.hoveredIndex).toBe(-1);
    });

    it("select 模式 options 缺失时直接返回", () => {
      const { handler, state } = setup({
        state: { filterDropdown: filterDropdown({ options: undefined, hoveredIndex: 3 }) },
      });

      handler.handleFilterDropdownHover(at(250, 149));

      expect(state.filterDropdown!.hoveredIndex).toBe(3);
    });

    it("非 select / 非 dateRange 模式不做处理", () => {
      const { handler, state } = setup({
        state: { filterDropdown: filterDropdown({ mode: "range", hoveredIndex: 5 }) },
      });

      handler.handleFilterDropdownHover(at(250, 149));

      expect(state.filterDropdown!.hoveredIndex).toBe(5);
    });

    it("选项超出可见数量时 hover 滚动条会切换为 grab 光标", () => {
      const many = Array.from({ length: 12 }, (_, i) => ({
        label: `O${i}`,
        value: i,
        checked: false,
      }));
      const { handler, canvas } = setup({
        state: { filterDropdown: filterDropdown({ options: many }) },
      });

      handler.handleFilterDropdownHover(at(395, 200));

      expect((canvas.style as { cursor?: string }).cursor).toBe("grab");
    });

    it("dateRange 模式在日历未激活时直接返回", () => {
      const { handler, state } = setup({
        state: { filterDropdown: filterDropdown({ mode: "dateRange", width: 240 }) },
      });

      handler.handleFilterDropdownHover(at(250, 280));

      expect(state.filterDropdown!.hoveredDate).toBeUndefined();
    });

    it("dateRange 模式 hover 到日期格子会更新 hoveredDate", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({
            mode: "dateRange",
            width: 240,
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
            hoveredDate: null,
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      handler.handleFilterDropdownHover(at(250, 280));

      expect(state.filterDropdown!.hoveredDate).toEqual(new Date(2026, 0, 12));
      expect(openListener).toHaveBeenCalled();
    });

    it("下拉框较窄触发日历右边界钳制后，hover 仍能命中日期", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({
            mode: "dateRange",
            width: 150,
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
            hoveredDate: null,
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      handler.handleFilterDropdownHover(at(250, 220));

      expect(state.filterDropdown!.hoveredDate).toEqual(new Date(2026, 0, 1));
      expect(openListener).toHaveBeenCalled();
    });

    it("dateRange 模式 hover 同一日期不会重复派发事件", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({
            mode: "dateRange",
            width: 240,
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
            hoveredDate: new Date(2026, 0, 12),
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      handler.handleFilterDropdownHover(at(250, 280));

      expect(openListener).not.toHaveBeenCalled();
      expect(state.filterDropdown!.hoveredDate).toEqual(new Date(2026, 0, 12));
    });

    it("dateRange 模式移出日历会清除 hoveredDate", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({
            mode: "dateRange",
            width: 240,
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
            hoveredDate: new Date(2026, 0, 12),
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      handler.handleFilterDropdownHover(at(10, 10));

      expect(state.filterDropdown!.hoveredDate).toBeNull();
      expect(openListener).toHaveBeenCalled();
    });

    it("dateRange 模式在日历外且原本无 hover 时不派发事件", () => {
      const openListener = jest.fn();
      const { handler, emitter } = setup({
        state: {
          filterDropdown: filterDropdown({
            mode: "dateRange",
            width: 240,
            activeDateField: "startDate",
            currentYear: 2026,
            currentMonth: 0,
            hoveredDate: null,
          }),
        },
      });
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      handler.handleFilterDropdownHover(at(10, 10));

      expect(openListener).not.toHaveBeenCalled();
    });
  });

  describe("handleDateDropdownClick / handleDateDropdownHover", () => {
    it("没有日期下拉时返回 false", () => {
      const { handler } = setup();
      expect(handler.handleDateDropdownClick(at(110, 110))).toBe(false);
    });

    it("点击左箭头切到上个月（跨年）", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { dateDropdown: dateDropdown({ currentMonth: 0 }) },
      });
      emitter.on(TableEvents.DATE_DROPDOWN_OPEN, openListener);

      expect(handler.handleDateDropdownClick(at(120, 120))).toBe(true);
      expect(state.dateDropdown!.currentYear).toBe(2025);
      expect(state.dateDropdown!.currentMonth).toBe(11);
      expect(openListener).toHaveBeenCalled();
    });

    it("点击左箭头切到上个月（同年）", () => {
      const { handler, state } = setup({
        state: { dateDropdown: dateDropdown({ currentMonth: 6 }) },
      });

      handler.handleDateDropdownClick(at(120, 120));

      expect(state.dateDropdown!.currentMonth).toBe(5);
      expect(state.dateDropdown!.currentYear).toBe(2026);
    });

    it("点击右箭头切到下个月（跨年）", () => {
      const { handler, state } = setup({
        state: { dateDropdown: dateDropdown({ currentMonth: 11 }) },
      });

      handler.handleDateDropdownClick(at(320, 120));

      expect(state.dateDropdown!.currentYear).toBe(2027);
      expect(state.dateDropdown!.currentMonth).toBe(0);
    });

    it("点击右箭头切到下个月（同年）", () => {
      const { handler, state } = setup({
        state: { dateDropdown: dateDropdown({ currentMonth: 3 }) },
      });

      handler.handleDateDropdownClick(at(320, 120));

      expect(state.dateDropdown!.currentMonth).toBe(4);
    });

    it("点击日期会派发 dateSelect 并关闭下拉", () => {
      const selectListener = jest.fn();
      const closeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { dateDropdown: dateDropdown() },
      });
      emitter.on(TableEvents.DATE_SELECT, selectListener);
      emitter.on(TableEvents.DATE_DROPDOWN_CLOSE, closeListener);

      expect(handler.handleDateDropdownClick(at(250, 180))).toBe(true);
      expect(state.dateDropdown).toBeNull();
      expect(selectListener.mock.calls[0]![1]).toBe("2026-01-01");
      expect(closeListener).toHaveBeenCalledWith(null);
    });

    it("点击下拉框内的空白区域返回 true 且不派发事件", () => {
      const selectListener = jest.fn();
      const { handler, emitter } = setup({
        state: { dateDropdown: dateDropdown() },
      });
      emitter.on(TableEvents.DATE_SELECT, selectListener);

      expect(handler.handleDateDropdownClick(at(110, 150))).toBe(true);
      expect(selectListener).not.toHaveBeenCalled();
    });

    it("点击下拉框外部返回 false", () => {
      const { handler } = setup({ state: { dateDropdown: dateDropdown() } });
      expect(handler.handleDateDropdownClick(at(10, 10))).toBe(false);
    });

    it("hover 到日期会更新 hoveredDate 并派发 hover 事件", () => {
      const hoverListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { dateDropdown: dateDropdown() },
      });
      emitter.on(TableEvents.DATE_DROPDOWN_HOVER, hoverListener);

      handler.handleDateDropdownHover(at(250, 180));

      expect(state.dateDropdown!.hoveredDate).toEqual(new Date(2026, 0, 1));
      expect(hoverListener).toHaveBeenCalled();
    });

    it("hover 到相同日期不会重复派发事件", () => {
      const hoverListener = jest.fn();
      const { handler, emitter } = setup({
        state: { dateDropdown: dateDropdown({ hoveredDate: new Date(2026, 0, 1) }) },
      });
      emitter.on(TableEvents.DATE_DROPDOWN_HOVER, hoverListener);

      handler.handleDateDropdownHover(at(250, 180));

      expect(hoverListener).not.toHaveBeenCalled();
    });

    it("hover 到下拉框外部会清除 hoveredDate", () => {
      const { handler, state } = setup({
        state: { dateDropdown: dateDropdown({ hoveredDate: new Date(2026, 0, 1) }) },
      });

      handler.handleDateDropdownHover(at(10, 10));

      expect(state.dateDropdown!.hoveredDate).toBeNull();
    });

    it("没有日期下拉时 hover 直接返回", () => {
      const { handler } = setup();
      expect(() => handler.handleDateDropdownHover(at(250, 180))).not.toThrow();
    });
  });

  describe("handleColorDropdownClick / handleColorDropdownHover", () => {
    it("没有颜色下拉时返回 false", () => {
      const { handler } = setup();
      expect(handler.handleColorDropdownClick(at(113, 113))).toBe(false);
    });

    it("点击色块会派发 colorChange 并关闭下拉", () => {
      const changeListener = jest.fn();
      const closeListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { colorDropdown: colorDropdown() },
      });
      emitter.on(TableEvents.COLOR_CHANGE, changeListener);
      emitter.on(TableEvents.COLOR_DROPDOWN_CLOSE, closeListener);

      expect(handler.handleColorDropdownClick(at(113, 113))).toBe(true);
      expect(state.colorDropdown).toBeNull();
      expect(changeListener.mock.calls[0]![1]).toBe("#ff4d4f");
      expect(closeListener).toHaveBeenCalledWith(null);
    });

    it("使用自定义预设色板时按索引取色", () => {
      const changeListener = jest.fn();
      const { handler, emitter } = setup({
        state: {
          colorDropdown: colorDropdown({
            config: { value: "#000000", presetColors: ["#111111", "#222222"] },
          }),
        },
      });
      emitter.on(TableEvents.COLOR_CHANGE, changeListener);

      handler.handleColorDropdownClick(at(113, 113));

      expect(changeListener.mock.calls[0]![1]).toBe("#111111");
    });

    it("索引超出预设色板范围时返回 false", () => {
      const { handler } = setup({
        state: {
          colorDropdown: colorDropdown({
            config: { value: "#000000", presetColors: ["#111111", "#222222"] },
          }),
        },
      });
      expect(handler.handleColorDropdownClick(at(192, 108))).toBe(false);
    });

    it("点击下拉框外部返回 false", () => {
      const { handler } = setup({ state: { colorDropdown: colorDropdown() } });
      expect(handler.handleColorDropdownClick(at(10, 10))).toBe(false);
    });

    it("hover 到色块会更新 hoveredColor", () => {
      const hoverListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { colorDropdown: colorDropdown() },
      });
      emitter.on(TableEvents.COLOR_DROPDOWN_HOVER, hoverListener);

      handler.handleColorDropdownHover(at(113, 113));

      expect(state.colorDropdown!.hoveredColor).toBe("#ff4d4f");
      expect(hoverListener).toHaveBeenCalled();
    });

    it("hover 到相同色块不会重复派发事件", () => {
      const hoverListener = jest.fn();
      const { handler, emitter } = setup({
        state: { colorDropdown: colorDropdown({ hoveredColor: "#ff4d4f" }) },
      });
      emitter.on(TableEvents.COLOR_DROPDOWN_HOVER, hoverListener);

      handler.handleColorDropdownHover(at(113, 113));

      expect(hoverListener).not.toHaveBeenCalled();
    });

    it("hover 到色板外会将 hoveredColor 置空", () => {
      const hoverListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { colorDropdown: colorDropdown({ hoveredColor: "#ff4d4f" }) },
      });
      emitter.on(TableEvents.COLOR_DROPDOWN_HOVER, hoverListener);

      handler.handleColorDropdownHover(at(10, 10));

      expect(state.colorDropdown!.hoveredColor).toBeNull();
      expect(hoverListener).toHaveBeenCalled();
    });

    it("没有颜色下拉时 hover 直接返回", () => {
      const { handler } = setup();
      expect(() => handler.handleColorDropdownHover(at(113, 113))).not.toThrow();
    });
  });

  describe("updateDropdownPosition", () => {
    it("没有下拉框时直接返回", () => {
      const { handler, state } = setup();
      handler.updateDropdownPosition();
      expect(state.dropdown).toBeNull();
    });

    it("列不存在时直接返回", () => {
      const { handler, state } = setup({
        state: {
          dropdown: selectDropdown({ cell: { rowIndex: 0, columnIndex: 99 } }),
        },
      });
      handler.updateDropdownPosition();
      expect(state.dropdown!.x).toBe(100);
    });

    it("select 下拉会重算 x/y 并派发 hover 事件", () => {
      const hoverListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { dropdown: selectDropdown({ x: -999, y: -999 }) },
      });
      emitter.on(TableEvents.DROPDOWN_HOVER, hoverListener);

      handler.updateDropdownPosition();

      expect(state.dropdown!.x).not.toBe(-999);
      expect(state.dropdown!.y).not.toBe(-999);
      expect(typeof state.dropdown!.showAbove).toBe("boolean");
      expect(hoverListener).toHaveBeenCalled();
    });

    it("tags 下拉会使用 tagsConfig 的选项数量", () => {
      const { handler, state } = setup({
        state: { dropdown: tagsDropdown({ x: -999, y: -999 }) },
      });

      handler.updateDropdownPosition();

      expect(state.dropdown!.x).not.toBe(-999);
      expect(state.dropdown!.y).not.toBe(-999);
    });
  });

  describe("updateFilterDropdownPosition", () => {
    it("没有筛选下拉时直接返回", () => {
      const { handler, state } = setup();
      handler.updateFilterDropdownPosition();
      expect(state.filterDropdown).toBeNull();
    });

    it("columnKey 找不到对应列时直接返回", () => {
      const { handler, state } = setup({
        state: { filterDropdown: filterDropdown({ columnKey: "missing", x: -999 }) },
      });

      handler.updateFilterDropdownPosition();

      expect(state.filterDropdown!.x).toBe(-999);
    });

    it("普通列会按滚动偏移计算 x 并固定 y 为表头高度", () => {
      const openListener = jest.fn();
      const { handler, state, emitter, layoutManager, scrollState } = setup({
        state: { filterDropdown: filterDropdown({ columnKey: "name" }) },
      });
      scrollState.scrollLeft = 50;
      emitter.on(TableEvents.FILTER_DROPDOWN_OPEN, openListener);

      handler.updateFilterDropdownPosition();

      expect(state.filterDropdown!.x).toBe(-50);
      expect(state.filterDropdown!.y).toBe(layoutManager.getLayoutInfo().headerHeight);
      expect(openListener).toHaveBeenCalled();
    });

    it("左固定列不随横向滚动偏移", () => {
      const { handler, state, scrollState } = setup({
        columns: [{ key: "name", title: "Name", width: 120, type: "text", fixed: "left" }],
        state: { filterDropdown: filterDropdown({ columnKey: "name" }) },
      });
      scrollState.scrollLeft = 50;

      handler.updateFilterDropdownPosition();

      expect(state.filterDropdown!.x).toBe(0);
    });

    it("右固定列不随横向滚动偏移", () => {
      const { handler, state, scrollState } = setup({
        columns: [{ key: "name", title: "Name", width: 120, type: "text", fixed: "right" }],
        state: { filterDropdown: filterDropdown({ columnKey: "name" }) },
      });
      scrollState.scrollLeft = 50;

      handler.updateFilterDropdownPosition();

      expect(state.filterDropdown!.x).toBe(800 - 120);
    });
  });

  describe("updateDateDropdownPosition", () => {
    it("没有日期下拉时直接返回", () => {
      const { handler, state } = setup();
      handler.updateDateDropdownPosition();
      expect(state.dateDropdown).toBeNull();
    });

    it("列不存在时直接返回", () => {
      const { handler, state } = setup({
        state: { dateDropdown: dateDropdown({ cell: { rowIndex: 0, columnIndex: 99 } }) },
      });

      handler.updateDateDropdownPosition();

      expect(state.dateDropdown!.width).toBe(240);
    });

    it("会重算位置并将宽度提升到至少 280", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { dateDropdown: dateDropdown({ x: -999, y: -999, width: 10 }) },
      });
      emitter.on(TableEvents.DATE_DROPDOWN_OPEN, openListener);

      handler.updateDateDropdownPosition();

      expect(state.dateDropdown!.width).toBe(280);
      expect(state.dateDropdown!.x).not.toBe(-999);
      expect(state.dateDropdown!.y).not.toBe(-999);
      expect(openListener).toHaveBeenCalled();
    });
  });

  describe("updateColorDropdownPosition", () => {
    it("没有颜色下拉时直接返回", () => {
      const { handler, state } = setup();
      handler.updateColorDropdownPosition();
      expect(state.colorDropdown).toBeNull();
    });

    it("列不存在时直接返回", () => {
      const { handler, state } = setup({
        state: { colorDropdown: colorDropdown({ cell: { rowIndex: 0, columnIndex: 99 } }) },
      });

      handler.updateColorDropdownPosition();

      expect(state.colorDropdown!.width).toBe(236);
    });

    it("使用默认色板时会重算位置与宽度", () => {
      const openListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { colorDropdown: colorDropdown({ x: -999, y: -999, width: 10 }) },
      });
      emitter.on(TableEvents.COLOR_DROPDOWN_OPEN, openListener);

      handler.updateColorDropdownPosition();

      expect(state.colorDropdown!.width).toBe(236);
      expect(state.colorDropdown!.x).not.toBe(-999);
      expect(state.colorDropdown!.y).not.toBe(-999);
      expect(openListener).toHaveBeenCalled();
    });

    it("使用自定义色板时同样会重算位置", () => {
      const { handler, state } = setup({
        state: {
          colorDropdown: colorDropdown({
            x: -999,
            y: -999,
            config: { value: "#000000", presetColors: ["#111111", "#222222"] },
          }),
        },
      });

      handler.updateColorDropdownPosition();

      expect(state.colorDropdown!.x).not.toBe(-999);
      expect(state.colorDropdown!.width).toBe(236);
    });
  });

  describe("updateButtonsDropdownPosition", () => {
    it("没有按钮下拉时直接返回", () => {
      const { handler, state } = setup();
      handler.updateButtonsDropdownPosition();
      expect(state.buttonsDropdown).toBeNull();
    });

    it("列不存在时会关闭按钮下拉", () => {
      const { handler, state } = setup({
        state: {
          buttonsDropdown: buttonsDropdown({ cell: { rowIndex: 0, columnIndex: 99 } }),
        },
      });

      handler.updateButtonsDropdownPosition();

      expect(state.buttonsDropdown).toBeNull();
    });

    it("会按按钮锚点重算位置并派发 hover 事件", () => {
      const hoverListener = jest.fn();
      const { handler, state, emitter } = setup({
        state: { buttonsDropdown: buttonsDropdown({ x: -999, y: -999 }) },
      });
      emitter.on(TableEvents.DROPDOWN_HOVER, hoverListener);

      handler.updateButtonsDropdownPosition();

      expect(state.buttonsDropdown!.x).not.toBe(-999);
      expect(state.buttonsDropdown!.y).not.toBe(-999);
      expect(typeof state.buttonsDropdown!.showAbove).toBe("boolean");
      expect(hoverListener).toHaveBeenCalled();
    });
  });

  describe("closeAllDropdowns", () => {
    it("会关闭所有类型的下拉框并派发对应事件", () => {
      const dropdownClose = jest.fn();
      const filterClose = jest.fn();
      const dateClose = jest.fn();
      const buttonsClose = jest.fn();
      const colorClose = jest.fn();
      const { handler, state, emitter } = setup({
        state: {
          dropdown: selectDropdown(),
          filterDropdown: filterDropdown(),
          dateDropdown: dateDropdown(),
          buttonsDropdown: buttonsDropdown(),
          colorDropdown: colorDropdown(),
        },
      });
      emitter.on(TableEvents.DROPDOWN_CLOSE, dropdownClose);
      emitter.on(TableEvents.FILTER_DROPDOWN_CLOSE, filterClose);
      emitter.on(TableEvents.DATE_DROPDOWN_CLOSE, dateClose);
      emitter.on(TableEvents.BUTTONS_DROPDOWN_CLOSE, buttonsClose);
      emitter.on(TableEvents.COLOR_DROPDOWN_CLOSE, colorClose);

      handler.closeAllDropdowns();

      expect(state.dropdown).toBeNull();
      expect(state.filterDropdown).toBeNull();
      expect(state.dateDropdown).toBeNull();
      expect(state.buttonsDropdown).toBeNull();
      expect(state.colorDropdown).toBeNull();
      expect(dropdownClose).toHaveBeenCalledWith(null);
      expect(filterClose).toHaveBeenCalled();
      expect(dateClose).toHaveBeenCalledWith(null);
      expect(buttonsClose).toHaveBeenCalled();
      expect(colorClose).toHaveBeenCalledWith(null);
    });

    it("所有下拉框都未打开时不派发任何事件", () => {
      const closeListener = jest.fn();
      const { handler, emitter } = setup();
      emitter.on(TableEvents.DROPDOWN_CLOSE, closeListener);

      handler.closeAllDropdowns();

      expect(closeListener).not.toHaveBeenCalled();
    });

    it("只关闭已打开的下拉框", () => {
      const dropdownClose = jest.fn();
      const filterClose = jest.fn();
      const { handler, state, emitter } = setup({
        state: { dropdown: selectDropdown() },
      });
      emitter.on(TableEvents.DROPDOWN_CLOSE, dropdownClose);
      emitter.on(TableEvents.FILTER_DROPDOWN_CLOSE, filterClose);

      handler.closeAllDropdowns();

      expect(state.dropdown).toBeNull();
      expect(dropdownClose).toHaveBeenCalledWith(null);
      expect(filterClose).not.toHaveBeenCalled();
    });
  });

  describe("formatDate / getDefaultPresetColors", () => {
    it("formatDate 会补零到 YYYY-MM-DD", () => {
      const { handler } = setup();
      expect(handler.formatDate(new Date(2026, 0, 5))).toBe("2026-01-05");
      expect(handler.formatDate(new Date(2026, 11, 31))).toBe("2026-12-31");
    });

    it("getDefaultPresetColors 返回稳定的默认色板", () => {
      const { handler } = setup();
      const colors = handler.getDefaultPresetColors();
      expect(colors).toHaveLength(28);
      expect(colors[0]).toBe("#ff4d4f");
      expect(colors[colors.length - 1]).toBe("#f50");
    });
  });
});
