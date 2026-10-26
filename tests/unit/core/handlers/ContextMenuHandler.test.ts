import { ContextMenuHandler } from "@/core/handlers/ContextMenuHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { LayoutManager } from "@/core/LayoutManager";
import { EditorRegistry } from "@/core/editors";
import { zhCN } from "@/locale";
import { TableEvents } from "@/constants/events";
import type {
  Column,
  ContextMenuItem,
  ContextMenuState,
  HeaderContextMenuState,
  InteractionState,
  Row,
  ScrollState,
} from "@/types";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

const MENU_X = 100;
const MENU_Y = 50;
const ITEM_HEIGHT = 32;

const ALL_ITEMS: ContextMenuItem[] = [
  { key: "pin-top", text: "Pin top" },
  { key: "pin-bottom", text: "Pin bottom" },
  { key: "unpin", text: "Unpin" },
  { key: "add-above", text: "Add above" },
  { key: "add-below", text: "Add below" },
  { key: "delete", text: "Delete", danger: true },
];

/** 菜单项 index 对应的点击 y 坐标（取该行中间） */
function yForItem(index: number): number {
  return MENU_Y + index * ITEM_HEIGHT + ITEM_HEIGHT / 2;
}

interface SetupOptions {
  contextMenu?: ContextMenuState | null;
  headerContextMenu?: HeaderContextMenuState | null;
}

function setup(options: SetupOptions = {}) {
  const theme = createMockTheme();
  const canvas = createMockCanvas();
  const ctx = canvas.getContext("2d")!;

  const columns: Column[] = [
    { key: "a", title: "A", width: 100, type: "text" },
    { key: "b", title: "B", width: 100, type: "text" },
  ];
  const rows: Row[] = [{ id: "r0", data: { a: "a0", b: "b0" } }];

  const layoutManager = new LayoutManager(undefined, theme);
  layoutManager.setViewportSize(800, 600);
  layoutManager.calculateLayout(columns, rows);

  const dataManager = new DataManager();
  dataManager.setColumns(columns);
  dataManager.setRows(rows);

  const row = rows[0]!;

  const state: InteractionState = {
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
    contextMenu:
      options.contextMenu === undefined
        ? { x: MENU_X, y: MENU_Y, row, hoveredIndex: -1, items: ALL_ITEMS }
        : options.contextMenu,
    headerContextMenu:
      options.headerContextMenu === undefined
        ? { x: MENU_X, y: MENU_Y, columnKey: "a", columnIndex: 0, hoveredIndex: -1 }
        : options.headerContextMenu,
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
  const handler = new ContextMenuHandler(
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

  const events: { type: string; args: unknown[] }[] = [];
  const watched: string[] = [
    TableEvents.ROW_PIN_CHANGE,
    TableEvents.ROW_ADD_ABOVE,
    TableEvents.ROW_ADD_BELOW,
    TableEvents.ROW_DELETE,
    TableEvents.CONTEXT_MENU_CLOSE,
    TableEvents.CONTEXT_MENU_HOVER,
    TableEvents.HEADER_CONTEXT_MENU_CLOSE,
    TableEvents.HEADER_CONTEXT_MENU_HOVER,
    TableEvents.COLUMN_HIDE,
  ];
  for (const type of watched) {
    emitter.on(type, (...args: unknown[]) => events.push({ type, args }));
  }

  return { handler, state, emitter, row, events, menu: () => state.contextMenu };
}

/** 构造一个带视口坐标的鼠标事件（mock canvas 的 left/top 均为 0） */
function mouseAt(clientX: number, clientY: number): MouseEvent {
  return new MouseEvent("click", { clientX, clientY });
}

/** 取出指定事件名的全部派发参数 */
function argsOf(events: { type: string; args: unknown[] }[], type: string): unknown[][] {
  return events.filter((e) => e.type === type).map((e) => e.args);
}

describe("ContextMenuHandler", () => {
  describe("单元格菜单点击", () => {
    it("没有打开菜单时返回 false", () => {
      const { handler } = setup({ contextMenu: null });

      expect(handler.handleContextMenuClick(mouseAt(MENU_X, MENU_Y))).toBe(false);
    });

    it("点在菜单左侧之外返回 false", () => {
      const { handler } = setup();

      expect(handler.handleContextMenuClick(mouseAt(MENU_X - 1, yForItem(0)))).toBe(false);
    });

    it("点在菜单右侧之外返回 false", () => {
      const { handler } = setup();

      expect(handler.handleContextMenuClick(mouseAt(MENU_X + 141, yForItem(0)))).toBe(false);
    });

    it("点在菜单上方之外返回 false", () => {
      const { handler } = setup();

      expect(handler.handleContextMenuClick(mouseAt(MENU_X, MENU_Y - 1))).toBe(false);
    });

    it("点在菜单下方之外返回 false", () => {
      const { handler } = setup();
      const menuHeight = ALL_ITEMS.length * ITEM_HEIGHT;

      expect(handler.handleContextMenuClick(mouseAt(MENU_X, MENU_Y + menuHeight + 1))).toBe(false);
    });

    it("点击菜单右边界仍算命中", () => {
      const { handler, state, events } = setup();

      const hit = handler.handleContextMenuClick(mouseAt(MENU_X + 140, yForItem(5)));

      expect(hit).toBe(true);
      expect(argsOf(events, TableEvents.ROW_DELETE)).toHaveLength(1);
      expect(state.contextMenu).toBeNull();
    });

    it("点击右下角边界时索引越界，事件被消费但菜单不关闭", () => {
      const { handler, state, events } = setup();
      const menuHeight = ALL_ITEMS.length * ITEM_HEIGHT;

      const hit = handler.handleContextMenuClick(mouseAt(MENU_X + 140, MENU_Y + menuHeight));

      expect(hit).toBe(true);
      expect(events).toEqual([]);
      expect(state.contextMenu).not.toBeNull();
    });

    const clickCases: [string, string, unknown][] = [
      ["pin-top", TableEvents.ROW_PIN_CHANGE, "top"],
      ["pin-bottom", TableEvents.ROW_PIN_CHANGE, "bottom"],
      ["unpin", TableEvents.ROW_PIN_CHANGE, null],
      ["add-above", TableEvents.ROW_ADD_ABOVE, undefined],
      ["add-below", TableEvents.ROW_ADD_BELOW, undefined],
      ["delete", TableEvents.ROW_DELETE, undefined],
    ];

    it.each(clickCases)("点击 %s 会派发对应事件", (key, expectedEvent, extra) => {
      const { handler, row, events } = setup();
      const index = ALL_ITEMS.findIndex((i) => i.key === key);

      const hit = handler.handleContextMenuClick(mouseAt(MENU_X, yForItem(index)));

      expect(hit).toBe(true);
      const args = argsOf(events, expectedEvent);
      expect(args).toHaveLength(1);
      if (extra === undefined) {
        expect(args[0]).toEqual([row]);
      } else {
        expect(args[0]).toEqual([row, extra]);
      }
    });

    it("命中后关闭菜单并派发 CONTEXT_MENU_CLOSE", () => {
      const { handler, state, events } = setup();

      handler.handleContextMenuClick(mouseAt(MENU_X, yForItem(0)));

      expect(state.contextMenu).toBeNull();
      expect(argsOf(events, TableEvents.CONTEXT_MENU_CLOSE)).toHaveLength(1);
    });

    it("点击禁用项时消费事件但不派发动作，菜单保持打开", () => {
      const items: ContextMenuItem[] = [{ key: "delete", text: "Delete", disabled: true }];
      const { handler, state, events } = setup({
        contextMenu: { x: MENU_X, y: MENU_Y, row: { id: "r0", data: {} }, hoveredIndex: -1, items },
      });

      const hit = handler.handleContextMenuClick(mouseAt(MENU_X, yForItem(0)));

      expect(hit).toBe(true);
      expect(argsOf(events, TableEvents.ROW_DELETE)).toHaveLength(0);
      expect(argsOf(events, TableEvents.CONTEXT_MENU_CLOSE)).toHaveLength(0);
      expect(state.contextMenu).not.toBeNull();
    });

    it("菜单项为空时越界点击被消费但不派发动作", () => {
      const { handler, events } = setup({
        contextMenu: {
          x: MENU_X,
          y: MENU_Y,
          row: { id: "r0", data: {} },
          hoveredIndex: -1,
          items: [],
        },
      });

      const hit = handler.handleContextMenuClick(mouseAt(MENU_X, MENU_Y));

      expect(hit).toBe(true);
      expect(events).toEqual([]);
    });

    it("未知 key 只关闭菜单，不派发任何动作", () => {
      const items: ContextMenuItem[] = [{ key: "unknown", text: "?" }];
      const { handler, state, events } = setup({
        contextMenu: { x: MENU_X, y: MENU_Y, row: { id: "r0", data: {} }, hoveredIndex: -1, items },
      });

      handler.handleContextMenuClick(mouseAt(MENU_X, yForItem(0)));

      expect(state.contextMenu).toBeNull();
      expect(argsOf(events, TableEvents.CONTEXT_MENU_CLOSE)).toHaveLength(1);
      expect(events).toHaveLength(1);
    });
  });

  describe("单元格菜单悬停", () => {
    it("没有打开菜单时不做任何事", () => {
      const { handler, events } = setup({ contextMenu: null });

      handler.handleContextMenuHover(mouseAt(MENU_X, yForItem(0)));

      expect(events).toEqual([]);
    });

    it("移入菜单时记录悬停项并派发事件", () => {
      const { handler, state, events } = setup();

      handler.handleContextMenuHover(mouseAt(MENU_X, yForItem(2)));

      expect(state.contextMenu!.hoveredIndex).toBe(2);
      expect(argsOf(events, TableEvents.CONTEXT_MENU_HOVER)).toHaveLength(1);
    });

    it("移出菜单时把悬停项重置为 -1", () => {
      const { handler, state } = setup({
        contextMenu: {
          x: MENU_X,
          y: MENU_Y,
          row: { id: "r0", data: {} },
          hoveredIndex: 3,
          items: ALL_ITEMS,
        },
      });

      handler.handleContextMenuHover(mouseAt(MENU_X - 10, yForItem(0)));

      expect(state.contextMenu!.hoveredIndex).toBe(-1);
    });

    it("悬停项没变化时不派发事件", () => {
      const { handler, events } = setup({
        contextMenu: {
          x: MENU_X,
          y: MENU_Y,
          row: { id: "r0", data: {} },
          hoveredIndex: 1,
          items: ALL_ITEMS,
        },
      });

      handler.handleContextMenuHover(mouseAt(MENU_X, yForItem(1)));

      expect(argsOf(events, TableEvents.CONTEXT_MENU_HOVER)).toHaveLength(0);
    });

    it("已在菜单外且悬停项本就是 -1 时不派发事件", () => {
      const { handler, events } = setup();

      handler.handleContextMenuHover(mouseAt(MENU_X - 10, MENU_Y));

      expect(argsOf(events, TableEvents.CONTEXT_MENU_HOVER)).toHaveLength(0);
    });
  });

  describe("表头菜单点击", () => {
    it("没有打开菜单时返回 false", () => {
      const { handler } = setup({ headerContextMenu: null });

      expect(handler.handleHeaderContextMenuClick(mouseAt(MENU_X, MENU_Y))).toBe(false);
    });

    it("点在菜单外返回 false", () => {
      const { handler } = setup();

      expect(handler.handleHeaderContextMenuClick(mouseAt(MENU_X + 121, MENU_Y))).toBe(false);
      expect(handler.handleHeaderContextMenuClick(mouseAt(MENU_X, MENU_Y + 33))).toBe(false);
    });

    it("命中时隐藏列、关闭菜单并返回 true", () => {
      const { handler, state, events } = setup();

      const hit = handler.handleHeaderContextMenuClick(mouseAt(MENU_X + 10, MENU_Y + 10));

      expect(hit).toBe(true);
      expect(argsOf(events, TableEvents.COLUMN_HIDE)).toEqual([["a"]]);
      expect(argsOf(events, TableEvents.HEADER_CONTEXT_MENU_CLOSE)).toHaveLength(1);
      expect(state.headerContextMenu).toBeNull();
    });
  });

  describe("表头菜单悬停", () => {
    it("没有打开菜单时不做任何事", () => {
      const { handler, events } = setup({ headerContextMenu: null });

      handler.handleHeaderContextMenuHover(mouseAt(MENU_X, MENU_Y));

      expect(events).toEqual([]);
    });

    it("移入菜单时把悬停项设为 0 并派发事件", () => {
      const { handler, state, events } = setup();

      handler.handleHeaderContextMenuHover(mouseAt(MENU_X + 10, MENU_Y + 10));

      expect(state.headerContextMenu!.hoveredIndex).toBe(0);
      expect(argsOf(events, TableEvents.HEADER_CONTEXT_MENU_HOVER)).toHaveLength(1);
    });

    it("移出菜单时把悬停项重置为 -1", () => {
      const { handler, state } = setup({
        headerContextMenu: { x: MENU_X, y: MENU_Y, columnKey: "a", columnIndex: 0, hoveredIndex: 0 },
      });

      handler.handleHeaderContextMenuHover(mouseAt(MENU_X - 1, MENU_Y));

      expect(state.headerContextMenu!.hoveredIndex).toBe(-1);
    });

    it("悬停项没变化时不派发事件", () => {
      const { handler, events } = setup({
        headerContextMenu: { x: MENU_X, y: MENU_Y, columnKey: "a", columnIndex: 0, hoveredIndex: 0 },
      });

      handler.handleHeaderContextMenuHover(mouseAt(MENU_X + 10, MENU_Y + 10));

      expect(argsOf(events, TableEvents.HEADER_CONTEXT_MENU_HOVER)).toHaveLength(0);
    });
  });

  describe("closeContextMenus", () => {
    it("同时关闭两个菜单并各派发一次关闭事件", () => {
      const { handler, state, events } = setup();

      handler.closeContextMenus();

      expect(state.contextMenu).toBeNull();
      expect(state.headerContextMenu).toBeNull();
      expect(argsOf(events, TableEvents.CONTEXT_MENU_CLOSE)).toHaveLength(1);
      expect(argsOf(events, TableEvents.HEADER_CONTEXT_MENU_CLOSE)).toHaveLength(1);
    });

    it("只打开单元格菜单时只派发对应事件", () => {
      const { handler, events } = setup({ headerContextMenu: null });

      handler.closeContextMenus();

      expect(argsOf(events, TableEvents.CONTEXT_MENU_CLOSE)).toHaveLength(1);
      expect(argsOf(events, TableEvents.HEADER_CONTEXT_MENU_CLOSE)).toHaveLength(0);
    });

    it("只打开表头菜单时只派发对应事件", () => {
      const { handler, events } = setup({ contextMenu: null });

      handler.closeContextMenus();

      expect(argsOf(events, TableEvents.CONTEXT_MENU_CLOSE)).toHaveLength(0);
      expect(argsOf(events, TableEvents.HEADER_CONTEXT_MENU_CLOSE)).toHaveLength(1);
    });

    it("两个菜单都没打开时不派发任何事件", () => {
      const { handler, events } = setup({ contextMenu: null, headerContextMenu: null });

      handler.closeContextMenus();

      expect(events).toEqual([]);
    });
  });

  describe("读取菜单状态", () => {
    it("getContextMenu 返回当前状态", () => {
      const { handler, state } = setup();

      expect(handler.getContextMenu()).toBe(state.contextMenu);
    });

    it("getHeaderContextMenu 返回当前状态", () => {
      const { handler, state } = setup();

      expect(handler.getHeaderContextMenu()).toBe(state.headerContextMenu);
    });

    it("关闭后读取为 null", () => {
      const { handler } = setup();

      handler.closeContextMenus();

      expect(handler.getContextMenu()).toBeNull();
      expect(handler.getHeaderContextMenu()).toBeNull();
    });
  });
});
