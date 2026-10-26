import { LayoutManager } from "@/core/LayoutManager";
import { DataManager } from "@/core/DataManager";
import { EventEmitter } from "@/core/EventEmitter";
import { ImageHandler } from "@/core/handlers/ImageHandler";
import type { InteractionEvents } from "@/core/handlers/BaseHandler";
import { EditorRegistry } from "@/core/editors";
import { TableEvents } from "@/constants/events";
import { zhCN } from "@/locale";
import type {
  CellPosition,
  Column,
  ImageEditorState,
  ImageTooltipState,
  InteractionState,
  Row,
  ScrollState,
} from "@/types";
import { createMockCanvas, createMockTheme } from "../../helpers/mockFactories";

const CELL: CellPosition = { rowIndex: 0, columnIndex: 0 };

/** ImageHandler 的尺寸常量（与源码保持一致）：IMAGE_SIZE 64 + IMAGE_GAP 8 */
const ROW_H = 72;
/** 上传区高度 */
const UPLOAD_H = 60;

class MockFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;

  readAsDataURL(file: File): void {
    this.result = `data:${file.type};base64,${file.name}`;
    queueMicrotask(() => this.onload?.());
  }
}

beforeAll(() => {
  (globalThis as unknown as { FileReader: unknown }).FileReader = MockFileReader;
});

function at(clientX: number, clientY: number): MouseEvent {
  return { clientX, clientY } as unknown as MouseEvent;
}

function dragEvent(clientX: number, clientY: number): DragEvent {
  return {
    clientX,
    clientY,
    preventDefault: jest.fn(),
  } as unknown as DragEvent;
}

function dropEvent(files: File[]): DragEvent {
  return {
    preventDefault: jest.fn(),
    dataTransfer: { files },
  } as unknown as DragEvent;
}

function file(name: string, type = "image/png"): File {
  return new File(["x"], name, { type });
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

  const columns: Column[] = options.columns ?? [{ key: "image", title: "Image", width: 120, type: "image" }];
  const rows: Row[] = options.rows ?? [{ id: "row-1", data: { image: { src: "a.png" } } }];

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

  const handler = new ImageHandler(
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

function tooltipState(overrides: Partial<ImageTooltipState> = {}): ImageTooltipState {
  return {
    cell: CELL,
    x: 100,
    y: 200,
    images: ["i0.png", "i1.png", "i2.png", "i3.png", "i4.png", "i5.png", "i6.png", "i7.png", "i8.png"],
    hoveredIndex: -1,
    scrollTop: 0,
    maxRows: 2,
    showAbove: false,
    ...overrides,
  };
}

function editorState(overrides: Partial<ImageEditorState> = {}): ImageEditorState {
  return {
    cell: CELL,
    x: 100,
    y: 200,
    images: ["i0.png"],
    hoveredIndex: -1,
    scrollTop: 0,
    maxRows: 2,
    showAbove: false,
    isDragging: false,
    pendingImages: [],
    isSingleImage: false,
    ...overrides,
  };
}

describe("ImageHandler", () => {
  describe("handleImageTooltipHover", () => {
    it("没有 tooltip 时返回 false", () => {
      const { handler } = setup();

      expect(handler.handleImageTooltipHover(at(110, 210))).toBe(false);
    });

    it("命中图片时更新 hoveredIndex 并派发滚动事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_TOOLTIP_SCROLL, spy);

      const result = handler.handleImageTooltipHover(at(110, 210));

      expect(result).toBe(true);
      expect(state.imageTooltip.hoveredIndex).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("hoveredIndex 未变化时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState({ hoveredIndex: 0 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_TOOLTIP_SCROLL, spy);

      handler.handleImageTooltipHover(at(110, 210));

      expect(state.imageTooltip.hoveredIndex).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it("命中第二行第二列的图片", () => {
      const { handler, state } = setup();
      state.imageTooltip = tooltipState();

      handler.handleImageTooltipHover(at(190, 290));

      // row 1, col 1 → index = 1*4+1 = 5
      expect(state.imageTooltip.hoveredIndex).toBe(5);
    });

    it("在下拉框内但不在任何图片上时重置为 -1 并派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState({ hoveredIndex: 3 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_TOOLTIP_SCROLL, spy);

      const result = handler.handleImageTooltipHover(at(105, 275));

      expect(result).toBe(true);
      expect(state.imageTooltip.hoveredIndex).toBe(-1);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("在下拉框内未命中图片且原本已是 -1 时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState({ hoveredIndex: -1 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_TOOLTIP_SCROLL, spy);

      handler.handleImageTooltipHover(at(105, 275));

      expect(spy).not.toHaveBeenCalled();
    });

    it("移出下拉框时重置为 -1、派发事件并返回 false", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState({ hoveredIndex: 2 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_TOOLTIP_SCROLL, spy);

      const result = handler.handleImageTooltipHover(at(50, 100));

      expect(result).toBe(false);
      expect(state.imageTooltip.hoveredIndex).toBe(-1);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("移出下拉框且原本已是 -1 时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState({ hoveredIndex: -1 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_TOOLTIP_SCROLL, spy);

      handler.handleImageTooltipHover(at(50, 100));

      expect(spy).not.toHaveBeenCalled();
    });

    it("scrollTop 会改变命中的图片索引", () => {
      const { handler, state } = setup();
      state.imageTooltip = tooltipState({ scrollTop: ROW_H });

      handler.handleImageTooltipHover(at(110, 210));

      // startRow = 1，第一行绘制位置对应 index 4
      expect(state.imageTooltip.hoveredIndex).toBe(4);
    });

    it("图片数量不足时不会越界读取", () => {
      const { handler, state } = setup();
      state.imageTooltip = tooltipState({ images: ["only.png"] });

      const result = handler.handleImageTooltipHover(at(110, 210));

      expect(result).toBe(true);
      expect(state.imageTooltip.hoveredIndex).toBe(0);
    });

    it("滚动到底部时不会扫描到不存在的行", () => {
      const { handler, state } = setup();
      // 9 张图 = 3 行；scrollTop 使 startRow = 2
      state.imageTooltip = tooltipState({ scrollTop: ROW_H * 2 });

      const result = handler.handleImageTooltipHover(at(110, 210));

      expect(result).toBe(true);
      // row 2 绘制在顶部，col 0 → index 8
      expect(state.imageTooltip.hoveredIndex).toBe(8);
    });
  });

  describe("handleImageTooltipClick", () => {
    it("没有 tooltip 时返回 false", () => {
      const { handler } = setup();

      expect(handler.handleImageTooltipClick(at(110, 210))).toBe(false);
    });

    it("点击下拉框外部返回 false 且不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_CLICK, spy);

      expect(handler.handleImageTooltipClick(at(50, 100))).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it("点击图片派发 IMAGE_CLICK 并携带图片地址", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_CLICK, spy);

      const result = handler.handleImageTooltipClick(at(110, 210));

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]).toMatchObject({ rowIndex: 0, columnIndex: 0 });
      expect(spy.mock.calls[0]![1]).toBe("i0.png");
    });

    it("点击第二行第三列的图片命中正确索引", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_CLICK, spy);

      // col 2 → imgX = 100+8+144 = 252..316；row 1 → imgY = 200+8+72 = 280..344
      handler.handleImageTooltipClick(at(260, 290));

      expect(spy.mock.calls[0]![1]).toBe("i6.png");
    });

    it("点击图片之间的空隙不派发事件但返回 true", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_CLICK, spy);

      expect(handler.handleImageTooltipClick(at(105, 275))).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it("列越界时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_CLICK, spy);

      // relativeX = 292 → col = 4，超出 0..3
      expect(handler.handleImageTooltipClick(at(400, 210))).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it("索引超出图片数量时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState({ images: ["only.png"] });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_CLICK, spy);

      // row 1 col 0 → index 4 >= 1
      expect(handler.handleImageTooltipClick(at(110, 290))).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it("scrollTop 会影响点击命中的索引", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState({ scrollTop: ROW_H });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_CLICK, spy);

      handler.handleImageTooltipClick(at(110, 210));

      expect(spy.mock.calls[0]![1]).toBe("i4.png");
    });

    it("图片地址为空字符串时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageTooltip = tooltipState({ images: [""] });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_CLICK, spy);

      expect(handler.handleImageTooltipClick(at(110, 210))).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("handleImageEditorHover", () => {
    it("没有编辑器时返回 false", () => {
      const { handler } = setup();

      expect(handler.handleImageEditorHover(at(110, 270))).toBe(false);
    });

    it("在编辑器外重置 hoveredIndex 并返回 false", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ hoveredIndex: 1 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_HOVER, spy);

      const result = handler.handleImageEditorHover(at(50, 100));

      expect(result).toBe(false);
      expect(state.imageEditor.hoveredIndex).toBe(-1);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("在编辑器外且原本已是 -1 时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ hoveredIndex: -1 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_HOVER, spy);

      handler.handleImageEditorHover(at(50, 100));

      expect(spy).not.toHaveBeenCalled();
    });

    it("在上传区返回 true 且 hoveredIndex 为 -1", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ hoveredIndex: 2 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_HOVER, spy);

      const result = handler.handleImageEditorHover(at(110, 200 + UPLOAD_H - 1));

      expect(result).toBe(true);
      expect(state.imageEditor.hoveredIndex).toBe(-1);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("在上传区且原本已是 -1 时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ hoveredIndex: -1 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_HOVER, spy);

      expect(handler.handleImageEditorHover(at(110, 210))).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it("在图片区未命中且原本已是 -1 时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ hoveredIndex: -1 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_HOVER, spy);

      expect(handler.handleImageEditorHover(at(105, 340))).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it("命中已有图片时设置对应索引", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_HOVER, spy);

      const result = handler.handleImageEditorHover(at(110, 270));

      expect(result).toBe(true);
      expect(state.imageEditor.hoveredIndex).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("命中待上传图片时索引从已有图片之后开始", () => {
      const { handler, state } = setup();
      state.imageEditor = editorState({
        images: ["a.png"],
        pendingImages: [{ file: file("b.png"), preview: "preview-b" }],
      });

      // col 1 → imgX = 180..244
      handler.handleImageEditorHover(at(190, 270));

      expect(state.imageEditor.hoveredIndex).toBe(1);
    });

    it("在图片区未命中任何图片时重置为 -1 并返回 true", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ hoveredIndex: 0 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_HOVER, spy);

      const result = handler.handleImageEditorHover(at(105, 340));

      expect(result).toBe(true);
      expect(state.imageEditor.hoveredIndex).toBe(-1);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("悬停索引未变化时不派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ hoveredIndex: 0 });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_HOVER, spy);

      handler.handleImageEditorHover(at(110, 270));

      expect(spy).not.toHaveBeenCalled();
    });

    it("scrollTop 会改变命中的索引", () => {
      const { handler, state } = setup();
      state.imageEditor = editorState({
        images: ["a.png", "b.png", "c.png", "d.png", "e.png"],
        scrollTop: ROW_H,
      });

      handler.handleImageEditorHover(at(110, 270));

      expect(state.imageEditor.hoveredIndex).toBe(4);
    });
  });

  describe("handleImageEditorClick", () => {
    it("没有编辑器时返回 outside", () => {
      const { handler } = setup();

      expect(handler.handleImageEditorClick(at(110, 210))).toBe("outside");
    });

    it("点击编辑器外部返回 outside", () => {
      const { handler, state } = setup();
      state.imageEditor = editorState();

      expect(handler.handleImageEditorClick(at(50, 100))).toBe("outside");
    });

    it("点击上传区返回 upload", () => {
      const { handler, state } = setup();
      state.imageEditor = editorState();

      expect(handler.handleImageEditorClick(at(110, 210))).toBe("upload");
    });

    it("点击已有图片会删除并派发 IMAGE_DELETE", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ images: ["a.png", "b.png"] });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_DELETE, spy);

      const result = handler.handleImageEditorClick(at(110, 270));

      expect(result).toBe("inside");
      expect(state.imageEditor.images).toEqual(["b.png"]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![1]).toBe("a.png");
      expect(spy.mock.calls[0]![2]).toBe(0);
    });

    it("点击待上传图片不会删除也不会派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({
        images: ["a.png"],
        pendingImages: [{ file: file("b.png"), preview: "preview-b" }],
      });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_DELETE, spy);

      const result = handler.handleImageEditorClick(at(190, 270));

      expect(result).toBe("inside");
      expect(state.imageEditor.images).toEqual(["a.png"]);
      expect(spy).not.toHaveBeenCalled();
    });

    it("点击图片区空白处返回 inside", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_DELETE, spy);

      expect(handler.handleImageEditorClick(at(105, 340))).toBe("inside");
      expect(spy).not.toHaveBeenCalled();
    });

    it("pendingImages 缺失时按 0 处理", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({
        images: ["a.png"],
        pendingImages: undefined as unknown as ImageEditorState["pendingImages"],
      });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_DELETE, spy);

      // totalImages = 1 + 0 = 1，点击第 2 张图会被 break 拦住
      expect(handler.handleImageEditorClick(at(190, 270))).toBe("inside");
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("handleFileUpload", () => {
    it("没有编辑器时直接返回", async () => {
      const { handler, state } = await setupAsync();

      await handler.handleFileUpload([file("a.png")]);

      expect(state.imageEditor).toBeNull();
    });

    it("列不存在时直接返回", async () => {
      const { handler, state } = await setupAsync();
      state.imageEditor = editorState({ cell: { rowIndex: 0, columnIndex: 9 } });

      await handler.handleFileUpload([file("a.png")]);

      expect(state.imageEditor.pendingImages).toEqual([]);
      expect(state.imageEditor.images).toEqual(["i0.png"]);
    });

    it("行不存在时直接返回", async () => {
      const { handler, state } = await setupAsync();
      state.imageEditor = editorState({ cell: { rowIndex: 9, columnIndex: 0 } });

      await handler.handleFileUpload([file("a.png")]);

      expect(state.imageEditor.pendingImages).toEqual([]);
    });

    it("没有 onUpload 时直接使用预览地址并派发 IMAGE_UPLOAD", async () => {
      const { handler, state, emitter } = await setupAsync();
      state.imageEditor = editorState();
      const uploadSpy = jest.fn();
      const scrollSpy = jest.fn();
      emitter.on(TableEvents.IMAGE_UPLOAD, uploadSpy);
      emitter.on(TableEvents.IMAGE_EDITOR_SCROLL, scrollSpy);

      await handler.handleFileUpload([file("a.png"), file("b.png")]);

      expect(state.imageEditor.images).toEqual([
        "i0.png",
        "data:image/png;base64,a.png",
        "data:image/png;base64,b.png",
      ]);
      expect(state.imageEditor.pendingImages).toEqual([]);
      expect(uploadSpy).toHaveBeenCalledTimes(2);
      expect(scrollSpy).toHaveBeenCalled();
    });

    it("onUpload 成功时用返回的 URL 替换预览", async () => {
      const onUpload = jest.fn(async (f: File) => `https://cdn.example.com/${f.name}`);
      const { handler, state, emitter } = await setupAsync({ imageConfig: { onUpload } });
      state.imageEditor = editorState();
      const uploadSpy = jest.fn();
      emitter.on(TableEvents.IMAGE_UPLOAD, uploadSpy);

      await handler.handleFileUpload([file("a.png")]);

      expect(onUpload).toHaveBeenCalledTimes(1);
      expect(state.imageEditor.images).toEqual(["i0.png", "https://cdn.example.com/a.png"]);
      expect(state.imageEditor.pendingImages).toEqual([]);
      expect(uploadSpy.mock.calls[0]![1]).toBe("https://cdn.example.com/a.png");
    });

    it("onUpload 失败时移除预览且不写入 images", async () => {
      const error = new Error("boom");
      const onUpload = jest.fn(async () => {
        throw error;
      });
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { handler, state } = await setupAsync({ imageConfig: { onUpload } });
      state.imageEditor = editorState();

      await handler.handleFileUpload([file("a.png")]);

      expect(state.imageEditor.images).toEqual(["i0.png"]);
      expect(state.imageEditor.pendingImages).toEqual([]);
      expect(errorSpy).toHaveBeenCalledWith("Upload failed:", error);
      errorSpy.mockRestore();
    });

    it("maxCount 限制可上传数量", async () => {
      const { handler, state } = await setupAsync({ imageConfig: { maxCount: 3 } });
      state.imageEditor = editorState({ images: ["i0.png", "i1.png"] });

      await handler.handleFileUpload([file("a.png"), file("b.png"), file("c.png")]);

      // 已有 2 张，maxCount 3 → 只能再传 1 张
      expect(state.imageEditor.images).toHaveLength(3);
    });

    it("maxCount 已被占满时不上传任何文件", async () => {
      const { handler, state } = await setupAsync({ imageConfig: { maxCount: 2 } });
      state.imageEditor = editorState({ images: ["i0.png", "i1.png"] });

      await handler.handleFileUpload([file("a.png")]);

      expect(state.imageEditor.images).toEqual(["i0.png", "i1.png"]);
      expect(state.imageEditor.pendingImages).toEqual([]);
    });

    it("单图模式会清空已有图片并只保留一张", async () => {
      const { handler, state } = await setupAsync();
      state.imageEditor = editorState({ images: ["old1.png", "old2.png"], isSingleImage: true });

      await handler.handleFileUpload([file("a.png"), file("b.png")]);

      expect(state.imageEditor.images).toEqual(["data:image/png;base64,a.png"]);
    });

    it("单图模式同样支持 onUpload", async () => {
      const onUpload = jest.fn(async (f: File) => `https://cdn/${f.name}`);
      const { handler, state } = await setupAsync({ imageConfig: { onUpload } });
      state.imageEditor = editorState({ images: ["old.png"], isSingleImage: true });

      await handler.handleFileUpload([file("a.png"), file("b.png")]);

      expect(state.imageEditor.images).toEqual(["https://cdn/a.png"]);
    });

    it("通过 column.render 提供 image 配置", async () => {
      const onUpload = jest.fn(async () => "https://cdn/x.png");
      const { handler, state } = await setupAsync({
        columns: [
          {
            key: "image",
            title: "Image",
            width: 120,
            type: "image",
            render: () => ({ image: { onUpload } }),
          },
        ],
      });
      state.imageEditor = editorState({ images: [] });

      await handler.handleFileUpload([file("a.png")]);

      expect(onUpload).toHaveBeenCalledTimes(1);
      expect(state.imageEditor.images).toEqual(["https://cdn/x.png"]);
    });

    it("column.render 返回空对象时按无 onUpload 处理", async () => {
      const { handler, state } = await setupAsync({
        columns: [
          { key: "image", title: "Image", width: 120, type: "image", render: () => ({}) },
        ],
      });
      state.imageEditor = editorState({ images: [] });

      await handler.handleFileUpload([file("a.png")]);

      expect(state.imageEditor.images).toEqual(["data:image/png;base64,a.png"]);
    });

    it("onUpload 期间待上传队列被清空时跳过写入", async () => {
      let captured: ImageEditorState | null = null;
      const onUpload = jest.fn(async () => {
        // 模拟 onUpload 触发了表格刷新，待上传队列被重置
        captured!.pendingImages = [];
        return "https://cdn/a.png";
      });
      const { handler, state } = await setupAsync({ imageConfig: { onUpload } });
      state.imageEditor = editorState({ images: [] });
      captured = state.imageEditor;

      await handler.handleFileUpload([file("a.png")]);

      expect(state.imageEditor.images).toEqual([]);
      expect(state.imageEditor.pendingImages).toEqual([]);
    });

    it("onUpload 失败且待上传队列已被清空时安静退出", async () => {
      let captured: ImageEditorState | null = null;
      const onUpload = jest.fn(async () => {
        captured!.pendingImages = [];
        throw new Error("boom");
      });
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { handler, state } = await setupAsync({ imageConfig: { onUpload } });
      state.imageEditor = editorState({ images: [] });
      captured = state.imageEditor;

      await handler.handleFileUpload([file("a.png")]);

      expect(state.imageEditor.images).toEqual([]);
      expect(state.imageEditor.pendingImages).toEqual([]);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("commitImageEditorChanges", () => {
    it("没有编辑器时直接返回", () => {
      const { handler, emitter } = setup();
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it("单图模式 + 原值为字符串 → 直接写入新地址", () => {
      const { handler, state, emitter } = setup({
        rows: [{ id: "r1", data: { image: "old.png" } }],
      });
      state.imageEditor = editorState({ images: ["new.png"], isSingleImage: true });
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy.mock.calls[0]![1]).toBe("new.png");
      expect(state.imageEditor).toBeNull();
    });

    it("单图模式 + 原值为数组 → 包装成 { src }", () => {
      const { handler, state, emitter } = setup({
        rows: [{ id: "r1", data: { image: ["old.png"] } }],
      });
      state.imageEditor = editorState({ images: ["new.png"], isSingleImage: true });
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy.mock.calls[0]![1]).toEqual({ src: "new.png" });
    });

    it("单图模式 + 原值为对象 → 保留其它字段并覆盖 src", () => {
      const { handler, state, emitter } = setup({
        rows: [{ id: "r1", data: { image: { src: "old.png", fit: "cover" } } }],
      });
      state.imageEditor = editorState({ images: ["new.png"], isSingleImage: true });
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy.mock.calls[0]![1]).toEqual({ src: "new.png", fit: "cover" });
    });

    it("单图模式 + 原值为数字 → 直接写入新地址", () => {
      const { handler, state, emitter } = setup({
        rows: [{ id: "r1", data: { image: 42 } }],
      });
      state.imageEditor = editorState({ images: ["new.png"], isSingleImage: true });
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy.mock.calls[0]![1]).toBe("new.png");
    });

    it("单图模式且没有图片时写入 null", () => {
      const { handler, state, emitter } = setup({
        rows: [{ id: "r1", data: { image: "old.png" } }],
      });
      state.imageEditor = editorState({ images: [], isSingleImage: true });
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy.mock.calls[0]![1]).toBeNull();
    });

    it("多图模式 + 原值为数组 → 直接写入数组", () => {
      const { handler, state, emitter } = setup({
        rows: [{ id: "r1", data: { image: ["old.png"] } }],
      });
      state.imageEditor = editorState({ images: ["a.png", "b.png"] });
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy.mock.calls[0]![1]).toEqual(["a.png", "b.png"]);
    });

    it("多图模式 + 原值为对象 → 保留其它字段并覆盖 images", () => {
      const { handler, state, emitter } = setup({
        rows: [{ id: "r1", data: { image: { images: ["old.png"], fit: "contain" } } }],
      });
      state.imageEditor = editorState({ images: ["a.png", "b.png"] });
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy.mock.calls[0]![1]).toEqual({ images: ["a.png", "b.png"], fit: "contain" });
    });

    it("多图模式 + 原值为 undefined → 直接写入数组", () => {
      const { handler, state, emitter } = setup({
        rows: [{ id: "r1", data: {} }],
      });
      state.imageEditor = editorState({ images: ["a.png"] });
      const spy = jest.fn();
      emitter.on(TableEvents.EDIT_END, spy);

      handler.commitImageEditorChanges();

      expect(spy.mock.calls[0]![1]).toEqual(["a.png"]);
    });

    it("始终派发 IMAGE_EDITOR_CLOSE 并清空编辑器", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState();
      const closeSpy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_CLOSE, closeSpy);

      handler.commitImageEditorChanges();

      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(state.imageEditor).toBeNull();
    });

    it("列或行缺失时关闭编辑器但不派发 EDIT_END", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ cell: { rowIndex: 9, columnIndex: 9 } });
      const editSpy = jest.fn();
      const closeSpy = jest.fn();
      emitter.on(TableEvents.EDIT_END, editSpy);
      emitter.on(TableEvents.IMAGE_EDITOR_CLOSE, closeSpy);

      handler.commitImageEditorChanges();

      expect(editSpy).not.toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(state.imageEditor).toBeNull();
    });
  });

  describe("updateImageTooltipPosition", () => {
    it("没有 tooltip 时直接返回", () => {
      const { handler, state } = setup();

      handler.updateImageTooltipPosition();

      expect(state.imageTooltip).toBeNull();
    });

    it("列不存在时清空 tooltip", () => {
      const { handler, state } = setup();
      state.imageTooltip = tooltipState({ cell: { rowIndex: 0, columnIndex: 9 } });

      handler.updateImageTooltipPosition();

      expect(state.imageTooltip).toBeNull();
    });

    it("正常滚动后更新坐标", () => {
      const { handler, state, scrollState } = setup();
      state.imageTooltip = tooltipState();
      scrollState.scrollTop = 200;

      handler.updateImageTooltipPosition();

      expect(typeof state.imageTooltip!.x).toBe("number");
      expect(typeof state.imageTooltip!.y).toBe("number");
      expect(typeof state.imageTooltip!.showAbove).toBe("boolean");
    });
  });

  describe("updateImageEditorPosition", () => {
    it("没有编辑器时直接返回", () => {
      const { handler, state } = setup();

      handler.updateImageEditorPosition();

      expect(state.imageEditor).toBeNull();
    });

    it("列不存在时提交并关闭编辑器", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ cell: { rowIndex: 0, columnIndex: 9 } });
      const closeSpy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_CLOSE, closeSpy);

      handler.updateImageEditorPosition();

      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(state.imageEditor).toBeNull();
    });

    it("正常滚动后更新坐标", () => {
      const { handler, state, scrollState } = setup();
      state.imageEditor = editorState();
      scrollState.scrollTop = 200;

      handler.updateImageEditorPosition();

      expect(typeof state.imageEditor!.x).toBe("number");
      expect(typeof state.imageEditor!.y).toBe("number");
      expect(typeof state.imageEditor!.showAbove).toBe("boolean");
    });
  });

  describe("handleDragOver", () => {
    it("没有编辑器时返回 false", () => {
      const { handler } = setup();

      expect(handler.handleDragOver(dragEvent(110, 210))).toBe(false);
    });

    it("在编辑器区域内设置 isDragging 并派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_SCROLL, spy);
      const e = dragEvent(110, 210);

      const result = handler.handleDragOver(e);

      expect(result).toBe(true);
      expect(state.imageEditor.isDragging).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(e.preventDefault).toHaveBeenCalled();
    });

    it("在编辑器区域外返回 false 且不设置 isDragging", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState();
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_SCROLL, spy);

      const result = handler.handleDragOver(dragEvent(50, 100));

      expect(result).toBe(false);
      expect(state.imageEditor.isDragging).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("handleDragLeave", () => {
    it("没有编辑器时直接返回", () => {
      const { handler } = setup();

      expect(() => handler.handleDragLeave(dragEvent(50, 100))).not.toThrow();
    });

    it("离开编辑器区域时清除 isDragging 并派发事件", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ isDragging: true });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_SCROLL, spy);

      handler.handleDragLeave(dragEvent(50, 100));

      expect(state.imageEditor.isDragging).toBe(false);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("仍在编辑器区域内时不做任何处理", () => {
      const { handler, state, emitter } = setup();
      state.imageEditor = editorState({ isDragging: true });
      const spy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_SCROLL, spy);

      handler.handleDragLeave(dragEvent(110, 210));

      expect(state.imageEditor.isDragging).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("handleDrop", () => {
    it("没有编辑器时返回 false", async () => {
      const { handler } = setup();

      await expect(handler.handleDrop(dropEvent([file("a.png")]))).resolves.toBe(false);
    });

    it("拖入图片文件时触发上传流程", async () => {
      const { handler, state, emitter } = await setupAsync();
      state.imageEditor = editorState({ isDragging: true });
      const uploadSpy = jest.spyOn(handler, "handleFileUpload").mockResolvedValue(undefined);
      const scrollSpy = jest.fn();
      emitter.on(TableEvents.IMAGE_EDITOR_SCROLL, scrollSpy);

      const result = await handler.handleDrop(dropEvent([file("a.png"), file("b.png")]));

      expect(result).toBe(true);
      expect(state.imageEditor.isDragging).toBe(false);
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(uploadSpy.mock.calls[0]![0]).toHaveLength(2);
      expect(scrollSpy).toHaveBeenCalledTimes(1);
    });

    it("拖入非图片文件时不触发上传", async () => {
      const { handler, state } = await setupAsync();
      state.imageEditor = editorState();
      const uploadSpy = jest.spyOn(handler, "handleFileUpload").mockResolvedValue(undefined);

      await handler.handleDrop(dropEvent([file("a.txt", "text/plain")]));

      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it("dataTransfer 为空时不触发上传", async () => {
      const { handler, state } = await setupAsync();
      state.imageEditor = editorState();
      const uploadSpy = jest.spyOn(handler, "handleFileUpload").mockResolvedValue(undefined);
      const e = { preventDefault: jest.fn() } as unknown as DragEvent;

      await expect(handler.handleDrop(e)).resolves.toBe(true);

      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it("混合拖入时只保留图片文件", async () => {
      const { handler, state } = await setupAsync();
      state.imageEditor = editorState();
      const uploadSpy = jest.spyOn(handler, "handleFileUpload").mockResolvedValue(undefined);

      await handler.handleDrop(dropEvent([file("a.png"), file("b.txt", "text/plain"), file("c.jpg", "image/jpeg")]));

      expect(uploadSpy.mock.calls[0]![0]).toHaveLength(2);
    });
  });
});

/**
 * handleFileUpload / handleDrop 会异步读取文件，这里提供一个带 image 配置的
 * 行数据工厂，便于按用例定制 onUpload / maxCount。
 */
function setupAsync(options: { imageConfig?: Record<string, unknown>; columns?: Column[] } = {}) {
  const imageConfig = options.imageConfig ?? { src: "a.png" };
  return setup({
    columns: options.columns,
    rows: [{ id: "row-1", data: { image: imageConfig } }],
  });
}
