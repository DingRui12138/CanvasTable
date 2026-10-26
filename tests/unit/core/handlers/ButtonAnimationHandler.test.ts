import { ButtonAnimationHandler } from "@/core/handlers/ButtonAnimationHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import { EventEmitter } from "@/core/EventEmitter";
import { DataManager } from "@/core/DataManager";
import { LayoutManager } from "@/core/LayoutManager";
import { EditorRegistry } from "@/core/editors";
import { zhCN } from "@/locale";
import { TableEvents } from "@/constants/events";
import type {
  ButtonHoverState,
  Column,
  InteractionState,
  Row,
  ScrollState,
  SwitchAnimationState,
} from "@/types";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

const CELL = { rowIndex: 0, columnIndex: 0 };

function hoverState(overrides: Partial<ButtonHoverState> = {}): ButtonHoverState {
  return {
    cell: CELL,
    progress: 0,
    targetProgress: 1,
    startTime: 0,
    startProgress: 0,
    ...overrides,
  };
}

function switchState(overrides: Partial<SwitchAnimationState> = {}): SwitchAnimationState {
  return {
    cell: CELL,
    progress: 0,
    targetProgress: 1,
    startTime: 0,
    startProgress: 0,
    ...overrides,
  };
}

interface SetupOptions {
  buttonHoverStates?: Map<string, ButtonHoverState>;
  switchAnimations?: Map<string, SwitchAnimationState>;
}

function setup(options: SetupOptions = {}) {
  const theme = createMockTheme();
  const canvas = createMockCanvas();
  const ctx = canvas.getContext("2d")!;

  const columns: Column[] = [{ key: "a", title: "A", width: 100, type: "button" }];
  const rows: Row[] = [{ id: "r0", data: { a: "go" } }];

  const layoutManager = new LayoutManager(undefined, theme);
  layoutManager.setViewportSize(800, 600);
  layoutManager.calculateLayout(columns, rows);

  const dataManager = new DataManager();
  dataManager.setColumns(columns);
  dataManager.setRows(rows);

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
    contextMenu: null,
    headerContextMenu: null,
    switchAnimations: options.switchAnimations ?? new Map(),
    buttonHoverStates: options.buttonHoverStates ?? new Map(),
  };

  const scrollState: ScrollState = {
    scrollLeft: 0,
    scrollTop: 0,
    maxScrollLeft: 0,
    maxScrollTop: 0,
    isScrolling: false,
  };

  const emitter = new EventEmitter<InteractionEvents>();
  const handler = new ButtonAnimationHandler(
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

  const hoverUpdates: number[] = [];
  const switchUpdates: number[] = [];
  emitter.on(TableEvents.BUTTON_HOVER_ANIMATION_UPDATE, () => hoverUpdates.push(1));
  emitter.on(TableEvents.SWITCH_ANIMATION_UPDATE, () => switchUpdates.push(1));

  return { handler, state, emitter, hoverUpdates, switchUpdates };
}

let nowValue = 0;
let nowSpy: jest.SpyInstance<number, []>;
let rafCallbacks: FrameRequestCallback[];

beforeEach(() => {
  nowValue = 0;
  nowSpy = jest.spyOn(Date, "now").mockImplementation(() => nowValue);
  rafCallbacks = [];
  global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    rafCallbacks.push(callback);
    return rafCallbacks.length;
  }) as unknown as typeof requestAnimationFrame;
});

afterEach(() => {
  nowSpy.mockRestore();
});

/** 执行最近一次被调度的 rAF 回调 */
function runNextFrame(): void {
  const callback = rafCallbacks.pop();
  expect(callback).toBeDefined();
  callback!(0);
}

describe("ButtonAnimationHandler", () => {
  describe("按钮 hover 动画", () => {
    it("没有待动画条目时只派发一次更新且不再调度帧", () => {
      const { handler, hoverUpdates } = setup();

      handler.startButtonHoverAnimationLoop();

      expect(hoverUpdates).toHaveLength(1);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("循环进行中重复启动会被忽略", () => {
      const states = new Map([["k", hoverState()]]);
      const { handler, hoverUpdates } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();
      handler.startButtonHoverAnimationLoop();

      expect(hoverUpdates).toHaveLength(1);
      expect(rafCallbacks).toHaveLength(1);
    });

    it("起止进度相同时直接移除条目", () => {
      const states = new Map([["k", hoverState({ startProgress: 0.5, targetProgress: 0.5 })]]);
      const { handler, hoverUpdates } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();

      expect(handler.getButtonHoverStates().size).toBe(0);
      expect(hoverUpdates).toHaveLength(1);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("按线性插值推进 progress", () => {
      // 总距离 1 → 全时长 150ms
      const states = new Map([["k", hoverState({ startTime: 0 })]]);
      const { handler } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();
      expect(handler.getButtonHoverStates().get("k")!.progress).toBe(0);

      nowValue = 75;
      runNextFrame();
      expect(handler.getButtonHoverStates().get("k")!.progress).toBeCloseTo(0.5);

      nowValue = 150;
      runNextFrame();
      expect(handler.getButtonHoverStates().get("k")!.progress).toBeCloseTo(1);
    });

    it("动画未结束时持续调度下一帧", () => {
      const states = new Map([["k", hoverState({ startTime: 0 })]]);
      const { handler } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();

      expect(rafCallbacks).toHaveLength(1);
    });

    it("已完成但目标进度非 0 的条目会留在 map 中", () => {
      const states = new Map([["k", hoverState({ startTime: -1000 })]]);
      const { handler } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();

      // targetProgress 为 1 → 只更新 progress，不清理
      expect(handler.getButtonHoverStates().size).toBe(1);
      expect(handler.getButtonHoverStates().get("k")!.progress).toBe(1);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("已完成且目标进度为 0 的条目会被清理", () => {
      const states = new Map([
        ["k", hoverState({ startProgress: 1, targetProgress: 0, startTime: -1000 })],
      ]);
      const { handler } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();

      expect(handler.getButtonHoverStates().size).toBe(0);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("进度超过总时长时被夹到 1", () => {
      const states = new Map([["k", hoverState({ startTime: -10000 })]]);
      const { handler } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();

      expect(handler.getButtonHoverStates().get("k")!.progress).toBe(1);
    });

    it("时间为负（时钟回拨）时进度夹到 0", () => {
      const states = new Map([["k", hoverState({ startTime: 1000 })]]);
      const { handler } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();

      expect(handler.getButtonHoverStates().get("k")!.progress).toBe(0);
      expect(rafCallbacks).toHaveLength(1);
    });

    it("多个条目中只要有一个未完成就会继续调度", () => {
      const states = new Map([
        ["done", hoverState({ startProgress: 0, targetProgress: 0 })],
        ["active", hoverState({ startTime: 0 })],
      ]);
      const { handler } = setup({ buttonHoverStates: states });

      handler.startButtonHoverAnimationLoop();

      expect(handler.getButtonHoverStates().has("done")).toBe(false);
      expect(rafCallbacks).toHaveLength(1);
    });

    it("销毁后不再推进也不派发更新", () => {
      const states = new Map([["k", hoverState()]]);
      const { handler, hoverUpdates } = setup({ buttonHoverStates: states });
      handler.setDestroyed(true);

      handler.startButtonHoverAnimationLoop();

      expect(hoverUpdates).toHaveLength(0);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("getButtonHoverStates 返回内部 map 本体", () => {
      const states = new Map([["k", hoverState()]]);
      const { handler } = setup({ buttonHoverStates: states });

      expect(handler.getButtonHoverStates()).toBe(states);
    });
  });

  describe("开关动画", () => {
    it("没有待动画条目时只派发一次更新且不再调度帧", () => {
      const { handler, switchUpdates } = setup();

      handler.startSwitchAnimationLoop();

      expect(switchUpdates).toHaveLength(1);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("循环进行中重复启动会被忽略", () => {
      const animations = new Map([["k", switchState()]]);
      const { handler, switchUpdates } = setup({ switchAnimations: animations });

      handler.startSwitchAnimationLoop();
      handler.startSwitchAnimationLoop();

      expect(switchUpdates).toHaveLength(1);
      expect(rafCallbacks).toHaveLength(1);
    });

    it("按 200ms 基准线性推进", () => {
      const animations = new Map([["k", switchState({ startTime: 0 })]]);
      const { handler } = setup({ switchAnimations: animations });

      handler.startSwitchAnimationLoop();
      expect(handler.getSwitchAnimations().get("k")!.progress).toBe(0);

      nowValue = 100;
      runNextFrame();

      expect(handler.getSwitchAnimations().get("k")!.progress).toBeCloseTo(0.5);
      expect(rafCallbacks).toHaveLength(1);
    });

    it("动画完成后无论目标值都移除条目", () => {
      const animations = new Map([["k", switchState({ startTime: -1000 })]]);
      const { handler } = setup({ switchAnimations: animations });

      handler.startSwitchAnimationLoop();

      expect(handler.getSwitchAnimations().size).toBe(0);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("起止进度相同且 elapsed 为 0 时会陷入无限调度（已知缺陷）", () => {
      const animations = new Map([
        ["k", switchState({ startProgress: 0.5, targetProgress: 0.5, startTime: 0 })],
      ]);
      const { handler } = setup({ switchAnimations: animations });

      handler.startSwitchAnimationLoop();

      // 0 / 0 = NaN，NaN >= 1 为假 → 永远认为"还有动画"
      expect(Number.isNaN(handler.getSwitchAnimations().get("k")!.progress)).toBe(true);
      expect(rafCallbacks).toHaveLength(1);
      expect(handler.getSwitchAnimations().size).toBe(1);
    });

    it("起止进度相同但已过时间时会被夹到 1 并清理", () => {
      const animations = new Map([
        ["k", switchState({ startProgress: 0.5, targetProgress: 0.5, startTime: -50 })],
      ]);
      const { handler } = setup({ switchAnimations: animations });

      handler.startSwitchAnimationLoop();

      expect(handler.getSwitchAnimations().size).toBe(0);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("销毁后不再推进也不派发更新", () => {
      const animations = new Map([["k", switchState()]]);
      const { handler, switchUpdates } = setup({ switchAnimations: animations });
      handler.setDestroyed(true);

      handler.startSwitchAnimationLoop();

      expect(switchUpdates).toHaveLength(0);
      expect(rafCallbacks).toHaveLength(0);
    });

    it("getSwitchAnimations 返回内部 map 本体", () => {
      const animations = new Map([["k", switchState()]]);
      const { handler } = setup({ switchAnimations: animations });

      expect(handler.getSwitchAnimations()).toBe(animations);
    });
  });

  describe("setDestroyed / clearAllAnimations", () => {
    it("setDestroyed(false) 后恢复推进", () => {
      const states = new Map([["k", hoverState({ startTime: 0 })]]);
      const { handler, hoverUpdates } = setup({ buttonHoverStates: states });
      handler.setDestroyed(true);
      handler.setDestroyed(false);

      handler.startButtonHoverAnimationLoop();

      expect(hoverUpdates).toHaveLength(1);
      expect(rafCallbacks).toHaveLength(1);
    });

    it("clearAllAnimations 清空两个动画表", () => {
      const states = new Map([["k", hoverState()]]);
      const animations = new Map([["k", switchState()]]);
      const { handler } = setup({ buttonHoverStates: states, switchAnimations: animations });

      handler.clearAllAnimations();

      expect(handler.getButtonHoverStates().size).toBe(0);
      expect(handler.getSwitchAnimations().size).toBe(0);
    });

    it("clearAllAnimations 复位运行标志，之后可以重新启动循环", () => {
      const states = new Map([["k", hoverState({ startTime: 0 })]]);
      const { handler, hoverUpdates } = setup({ buttonHoverStates: states });
      handler.startButtonHoverAnimationLoop();
      expect(hoverUpdates).toHaveLength(1);

      handler.clearAllAnimations();
      handler.startButtonHoverAnimationLoop();

      // 运行标志被复位 → 能再次进入循环体并派发更新
      expect(hoverUpdates).toHaveLength(2);
    });
  });
});
