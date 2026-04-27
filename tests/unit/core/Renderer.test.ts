import { Renderer } from '@/core/Renderer';
import { LayoutManager } from '@/core/LayoutManager';
import { createMockTheme, createTestColumns, createTestRows } from '../helpers/mockFactories';
import type { VisibleRange, SortConfig, InteractionState, Column } from '@/types';

describe('Renderer', () => {
  let renderer: Renderer;
  let canvas: HTMLCanvasElement;
  let mockTheme: ReturnType<typeof createMockTheme>;
  let layoutManager: LayoutManager;

  function createRenderOptions(
    overrides: Partial<Parameters<Renderer['render']>[5]> = {},
  ): Parameters<Renderer['render']>[5] {
    return {
      hoveredCell: null,
      selectedCells: [],
      editingCell: null,
      sortConfig: [],
      filterConfig: [],
      showHeader: true,
      stripeRows: false,
      ...overrides,
    };
  }

  function createInspectableContext(
    baseContext: CanvasRenderingContext2D,
  ): CanvasRenderingContext2D & {
    strokeCalls: Array<{ strokeStyle: unknown; lineWidth: unknown }>;
  } {
    const strokeCalls: Array<{ strokeStyle: unknown; lineWidth: unknown }> = [];
    const originalStroke = baseContext.stroke.bind(baseContext);

    baseContext.stroke = jest.fn(() => {
      strokeCalls.push({
        strokeStyle: baseContext.strokeStyle,
        lineWidth: baseContext.lineWidth,
      });
      return originalStroke();
    });

    return Object.assign(baseContext, { strokeCalls });
  }

  function findLastCallIndex<T>(items: T[], predicate: (item: T) => boolean): number {
    for (let index = items.length - 1; index >= 0; index--) {
      if (predicate(items[index]!)) {
        return index;
      }
    }

    return -1;
  }

  beforeEach(() => {
    mockTheme = createMockTheme();
    // 使用真实的 canvas 元素 (jest-canvas-mock 会自动 mock)
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    layoutManager = new LayoutManager(undefined, mockTheme);
    layoutManager.setViewportSize(800, 600);
    layoutManager.calculateLayout(createTestColumns(), createTestRows(10));

    renderer = new Renderer(canvas, mockTheme, layoutManager);
  });

  afterEach(() => {
    renderer.destroy();
  });

  describe('constructor', () => {
    it('should create renderer instance', () => {
      expect(renderer).toBeInstanceOf(Renderer);
    });

    it('should throw error if canvas context is null', () => {
      // 创建一个返回 null 的 mock canvas
      const badCanvas = document.createElement('canvas');
      // 覆盖 getContext 方法返回 null
      Object.defineProperty(badCanvas, 'getContext', {
        value: () => null,
        writable: true,
      });

      expect(() => new Renderer(badCanvas, mockTheme, layoutManager)).toThrow('Failed to get 2D context');
    });
  });

  describe('setCanvas', () => {
    it('should update canvas reference', () => {
      const newCanvas = document.createElement('canvas');
      renderer.setCanvas(newCanvas);
      expect(renderer.getCanvas()).toBe(newCanvas);
    });
  });

  describe('setTheme / updateTheme', () => {
    it('should update theme', () => {
      const newTheme = createMockTheme();
      newTheme.colors.background = '#f0f0f0';
      renderer.setTheme(newTheme);
      // Theme is internal, no public getter, so we just verify no error
    });
  });

  describe('setWatermarkConfig', () => {
    it('should set watermark config', () => {
      renderer.setWatermarkConfig({
        enabled: true,
        content: 'Test Watermark',
      });
      // Watermark is rendered internally
    });
  });

  describe('setExpandColumnKey', () => {
    it('should set expand column key', () => {
      renderer.setExpandColumnKey('name');
      // Expand column is used during render
    });
  });

  describe('resize', () => {
    it('should resize canvas dimensions', () => {
      const dpr = window.devicePixelRatio || 1;
      renderer.resize(1000, 500);

      expect(canvas.width).toBe(1000 * dpr);
      expect(canvas.height).toBe(500 * dpr);
    });

    it('should set canvas style dimensions', () => {
      renderer.resize(1000, 500);

      expect(canvas.style.width).toBe('1000px');
      expect(canvas.style.height).toBe('500px');
    });
  });

  describe('markDirty', () => {
    it('should add dirty region', () => {
      renderer.markDirty(0, 0, 100, 50);
      // Dirty regions are used internally for optimization
    });
  });

  describe('getCanvas', () => {
    it('should return canvas element', () => {
      expect(renderer.getCanvas()).toBe(canvas);
    });
  });

  describe('getCanvasContext', () => {
    it('should return canvas context', () => {
      const ctx = renderer.getCanvasContext();
      expect(ctx).toBeDefined();
    });
  });

  describe('render', () => {
    it('should render without errors', () => {
      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };

      expect(() => {
        renderer.render(columns, rows, visibleRange, 0, 0, {
          ...createRenderOptions(),
        });
      }).not.toThrow();
    });

    it('should render without row resize state', () => {
      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };

      expect(() => {
        renderer.render(columns, rows, visibleRange, 0, 0, createRenderOptions());
      }).not.toThrow();
    });

    it('should render with stripe rows', () => {
      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };

      expect(() => {
        renderer.render(columns, rows, visibleRange, 0, 0, {
          ...createRenderOptions({ stripeRows: true }),
        });
      }).not.toThrow();
    });

    it('should render with hovered cell', () => {
      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };

      expect(() => {
        renderer.render(columns, rows, visibleRange, 0, 0, {
          ...createRenderOptions({
            hoveredCell: { rowIndex: 0, columnIndex: 0 },
          }),
        });
      }).not.toThrow();
    });

    it('should render with selected cells', () => {
      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };

      expect(() => {
        renderer.render(columns, rows, visibleRange, 0, 0, {
          ...createRenderOptions({
            selectedCells: [{
              start: { rowIndex: 0, columnIndex: 0 },
              end: { rowIndex: 2, columnIndex: 1 },
            }],
          }),
        });
      }).not.toThrow();
    });

    it('should render with sort config', () => {
      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };
      const sortConfig: SortConfig[] = [
        { column: 'name', direction: 'asc' },
      ];

      expect(() => {
        renderer.render(columns, rows, visibleRange, 0, 0, {
          ...createRenderOptions({ sortConfig }),
        });
      }).not.toThrow();
    });

    it('should render with editing cell', () => {
      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };

      expect(() => {
        renderer.render(columns, rows, visibleRange, 0, 0, {
          ...createRenderOptions({
            editingCell: { rowIndex: 0, columnIndex: 1 },
          }),
        });
      }).not.toThrow();
    });

    it('should use row resize display height for active row geometry', () => {
      const baseContext = canvas.getContext('2d');
      expect(baseContext).not.toBeNull();
      const inspectableContext = createInspectableContext(baseContext!);
      jest.spyOn(canvas, 'getContext').mockReturnValue(inspectableContext);

      const baseColumns = createTestColumns();
      const columns: Column[] = [
        { ...baseColumns[0]!, fixed: 'left' },
        ...baseColumns.slice(1),
      ];
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };
      const rowResizeState: InteractionState['rowResizeState'] = {
        rowIndex: 1,
        startY: 0,
        startHeight: mockTheme.row.height,
        displayHeight: 57,
      };

      layoutManager.calculateLayout(columns, rows);
      renderer = new Renderer(canvas, mockTheme, layoutManager);

      renderer.render(columns, rows, visibleRange, 0, 0, createRenderOptions({ rowResizeState }));

      const targetRowY = layoutManager.getRowOffset(rowResizeState.rowIndex);
      const fillRectMock = inspectableContext.fillRect as jest.Mock;
      const matchingRowFills = fillRectMock.mock.calls.filter(
        ([, y, , height]: [number, number, number, number]) =>
          y === targetRowY && height === rowResizeState.displayHeight,
      );

      expect(matchingRowFills.length).toBeGreaterThanOrEqual(2);
      expect(
        fillRectMock.mock.calls.some(
          ([, y, , height]: [number, number, number, number]) =>
            y === targetRowY && height === mockTheme.row.height,
        ),
      ).toBe(false);
    });

    it('should draw the active resized row after following rows so it stays on top', () => {
      const baseContext = canvas.getContext('2d');
      expect(baseContext).not.toBeNull();
      const inspectableContext = createInspectableContext(baseContext!);
      jest.spyOn(canvas, 'getContext').mockReturnValue(inspectableContext);

      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };
      const rowResizeState: InteractionState['rowResizeState'] = {
        rowIndex: 1,
        startY: 0,
        startHeight: mockTheme.row.height,
        displayHeight: 57,
      };

      renderer = new Renderer(canvas, mockTheme, layoutManager);
      const renderCenterRowSpy = jest.spyOn(
        renderer as unknown as {
          renderCenterRow: (...args: unknown[]) => void;
        },
        'renderCenterRow',
      );

      renderer.render(columns, rows, visibleRange, 0, 0, createRenderOptions({ rowResizeState }));

      const centerRowCalls = renderCenterRowSpy.mock.calls.map((call) => call[3]);
      const activeRowCallIndex = centerRowCalls.indexOf(rowResizeState.rowIndex);
      const followingRowCallIndex = centerRowCalls.indexOf(rowResizeState.rowIndex + 1);

      expect(centerRowCalls.filter((rowIndex) => rowIndex === rowResizeState.rowIndex)).toHaveLength(1);
      expect(activeRowCallIndex).toBeGreaterThan(followingRowCallIndex);
    });

    it('should draw the active resized fixed row after following fixed rows', () => {
      const baseContext = canvas.getContext('2d');
      expect(baseContext).not.toBeNull();
      const inspectableContext = createInspectableContext(baseContext!);
      jest.spyOn(canvas, 'getContext').mockReturnValue(inspectableContext);

      const baseColumns = createTestColumns();
      const columns: Column[] = [
        { ...baseColumns[0]!, fixed: 'left' },
        ...baseColumns.slice(1),
      ];
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };
      const rowResizeState: InteractionState['rowResizeState'] = {
        rowIndex: 1,
        startY: 0,
        startHeight: mockTheme.row.height,
        displayHeight: 57,
      };

      layoutManager.calculateLayout(columns, rows);
      renderer = new Renderer(canvas, mockTheme, layoutManager);
      const renderFixedRowOverlaySpy = jest.spyOn(
        renderer as unknown as {
          renderFixedRowOverlay: (...args: unknown[]) => void;
        },
        'renderFixedRowOverlay',
      );

      renderer.render(columns, rows, visibleRange, 0, 0, createRenderOptions({ rowResizeState }));

      const fillRectCalls = (inspectableContext.fillRect as jest.Mock).mock.calls as Array<
        [number, number, number, number]
      >;
      const activeRowY = layoutManager.getRowOffset(rowResizeState.rowIndex);
      const followingRowY = layoutManager.getRowOffset(rowResizeState.rowIndex + 1);
      const firstActiveFixedRowDrawIndex = fillRectCalls.findIndex(
        ([x, y, , height]) => x === 0 && y === activeRowY && height === rowResizeState.displayHeight,
      );
      const lastActiveFixedRowDrawIndex = findLastCallIndex(
        fillRectCalls,
        ([x, y, , height]) => x === 0 && y === activeRowY && height === rowResizeState.displayHeight,
      );
      const lastFollowingFixedRowDrawIndex = findLastCallIndex(
        fillRectCalls,
        ([x, y, , height]) => x === 0 && y === followingRowY && height === mockTheme.row.height,
      );

      expect(renderFixedRowOverlaySpy).toHaveBeenCalledTimes(1);
      expect(lastActiveFixedRowDrawIndex).toBeGreaterThan(lastFollowingFixedRowDrawIndex);
    });

    it('should draw row resize guide line with theme styling', () => {
      const baseContext = canvas.getContext('2d');
      expect(baseContext).not.toBeNull();
      const inspectableContext = createInspectableContext(baseContext!);
      jest.spyOn(canvas, 'getContext').mockReturnValue(inspectableContext);

      const columns = createTestColumns();
      const rows = createTestRows(10);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 5,
        startColumn: 0,
        endColumn: 3,
      };
      const rowResizeState: InteractionState['rowResizeState'] = {
        rowIndex: 2,
        startY: 0,
        startHeight: mockTheme.row.height,
        displayHeight: 49,
      };

      renderer = new Renderer(canvas, mockTheme, layoutManager);
      renderer.render(columns, rows, visibleRange, 0, 0, createRenderOptions({ rowResizeState }));

      const expectedY = layoutManager.getRowOffset(rowResizeState.rowIndex) + rowResizeState.displayHeight;
      expect(inspectableContext.moveTo).toHaveBeenCalledWith(0, expectedY);
      expect(inspectableContext.lineTo).toHaveBeenCalledWith(canvas.width, expectedY);
      expect(inspectableContext.strokeCalls).toContainEqual({
        strokeStyle: mockTheme.row.resizeGuideColor,
        lineWidth: mockTheme.row.resizeGuideWidth,
      });
    });
  });

  describe('image cache', () => {
    it('keeps image size fixed when row-height scaling is disabled', () => {
      const baseContext = canvas.getContext('2d');
      expect(baseContext).not.toBeNull();
      const inspectableContext = createInspectableContext(baseContext!);
      jest.spyOn(canvas, 'getContext').mockReturnValue(inspectableContext);

      renderer = new Renderer(canvas, mockTheme, layoutManager);

      (
        renderer as unknown as {
          renderImage: (
            x: number,
            y: number,
            cellWidth: number,
            cellHeight: number,
            config: {
              src: string;
              width: number;
              height: number;
              scaleWithRowHeight: false;
              lazy: false;
            },
          ) => void;
        }
      ).renderImage(0, 0, 96, 104, {
        src: 'image.png',
        width: 64,
        height: 64,
        scaleWithRowHeight: false,
        lazy: false,
      });

      const rectCalls = (inspectableContext.rect as jest.Mock).mock.calls as Array<
        [number, number, number, number]
      >;

      expect(rectCalls.some(([, , width, height]) => width === 24 && height === 24)).toBe(true);
      expect(rectCalls.some(([, , width, height]) => width === 64 || height === 64)).toBe(false);
    });

    it('should check if image is loaded', () => {
      expect(renderer.isImageLoaded('non-existent')).toBe(false);
    });

    it('should check if image is failed', () => {
      expect(renderer.isImageFailed('non-existent')).toBe(false);
    });

    it('should clear image cache', () => {
      renderer.clearImageCache();
      expect(renderer.isImageLoaded('any')).toBe(false);
    });

    it('should retry image', () => {
      renderer.retryImage('test-url');
      // Retry will attempt to reload the image
    });
  });

  describe('destroy', () => {
    it('should destroy renderer without errors', () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
