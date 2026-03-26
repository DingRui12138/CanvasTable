import { Renderer } from '@/core/Renderer';
import { LayoutManager } from '@/core/LayoutManager';
import { createMockTheme, createTestColumns, createTestRows } from '../helpers/mockFactories';
import type { VisibleRange, SortConfig } from '@/types';

describe('Renderer', () => {
  let renderer: Renderer;
  let canvas: HTMLCanvasElement;
  let mockTheme: ReturnType<typeof createMockTheme>;
  let layoutManager: LayoutManager;

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
          hoveredCell: null,
          selectedCells: [],
          editingCell: null,
          sortConfig: [],
          filterConfig: [],
          showHeader: true,
          stripeRows: false,
        });
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
          hoveredCell: null,
          selectedCells: [],
          editingCell: null,
          sortConfig: [],
          filterConfig: [],
          showHeader: true,
          stripeRows: true,
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
          hoveredCell: { rowIndex: 0, columnIndex: 0 },
          selectedCells: [],
          editingCell: null,
          sortConfig: [],
          filterConfig: [],
          showHeader: true,
          stripeRows: false,
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
          hoveredCell: null,
          selectedCells: [{
            start: { rowIndex: 0, columnIndex: 0 },
            end: { rowIndex: 2, columnIndex: 1 },
          }],
          editingCell: null,
          sortConfig: [],
          filterConfig: [],
          showHeader: true,
          stripeRows: false,
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
          hoveredCell: null,
          selectedCells: [],
          editingCell: null,
          sortConfig,
          filterConfig: [],
          showHeader: true,
          stripeRows: false,
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
          hoveredCell: null,
          selectedCells: [],
          editingCell: { rowIndex: 0, columnIndex: 1 },
          sortConfig: [],
          filterConfig: [],
          showHeader: true,
          stripeRows: false,
        });
      }).not.toThrow();
    });
  });

  describe('image cache', () => {
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