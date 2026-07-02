import { Renderer } from '@/core/Renderer';
import { LayoutManager } from '@/core/LayoutManager';
import { RowPinManager } from '@/core/RowPinManager';
import { createCTElement } from '@/core/jsx/createCTElement';
import { createMockTheme, createTestColumns, createTestRows } from '../helpers/mockFactories';
import type { ComputedSummaryRow, VisibleRange, SortConfig, InteractionState, Column } from '@/types';

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

  function createSummaryRow(): ComputedSummaryRow {
    return {
      key: 'total',
      height: 40,
      source: { key: 'total', cells: [] },
      cells: [
        {
          key: 'total:label',
          startColumnIndex: 1,
          endColumnIndex: 2,
          startColumnKey: 'name',
          endColumnKey: 'active',
          config: { startColumnKey: 'name', endColumnKey: 'active', text: 'Total' },
          renderResult: { text: 'Total', type: 'text', style: { fontWeight: 'bold' } },
        },
        {
          key: 'total:progress',
          startColumnIndex: 3,
          endColumnIndex: 3,
          startColumnKey: 'progress',
          endColumnKey: 'progress',
          config: { columnKey: 'progress', value: 60 },
          renderResult: { text: '60', type: 'number' },
        },
      ],
    };
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

    it('virtualizes fixed column rows instead of scanning every row', () => {
      const baseColumns = createTestColumns();
      const columns: Column[] = [
        { ...baseColumns[0]!, fixed: 'left' },
        ...baseColumns.slice(1),
      ];
      const rows = createTestRows(2000);
      const visibleRange: VisibleRange = {
        startRow: 100,
        endRow: 110,
        startColumn: 0,
        endColumn: 3,
      };
      layoutManager.calculateLayout(columns, rows);
      renderer = new Renderer(canvas, mockTheme, layoutManager);
      const getRowOffsetSpy = jest.spyOn(layoutManager, 'getRowOffset');

      renderer.render(
        columns,
        rows,
        visibleRange,
        0,
        mockTheme.row.height * 100,
        createRenderOptions(),
      );

      expect(getRowOffsetSpy.mock.calls.length).toBeLessThan(100);
    });

    it('renders a pinned row once outside the scrolling body band', () => {
      const columns = createTestColumns();
      const rows = createTestRows(6);
      const rowPinManager = new RowPinManager();
      rowPinManager.pin(rows[2]!, 'top');
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.calculateLayout(columns, rows);
      layoutManager.setScrollPosition(0, mockTheme.row.height);

      const ctx = canvas.getContext('2d')!;
      const fillTextSpy = jest.spyOn(ctx, 'fillText');

      renderer.render(columns, rows, layoutManager.getVisibleRange(), 0, 0, createRenderOptions());

      const user3Calls = fillTextSpy.mock.calls.filter((call) => call[0] === 'User 3');
      expect(user3Calls).toHaveLength(1);
      expect(user3Calls[0]?.[2]).toBeGreaterThanOrEqual(mockTheme.row.headerHeight);
      expect(user3Calls[0]?.[2]).toBeLessThan(
        mockTheme.row.headerHeight + mockTheme.row.height,
      );
    });

    it('does not clone row bands during pinned row rendering', () => {
      const columns = createTestColumns();
      const rows = createTestRows(2000);
      const rowPinManager = new RowPinManager();
      rowPinManager.pin(rows[1999]!, 'top');
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.calculateLayout(columns, rows);
      const getRowBandsSpy = jest.spyOn(layoutManager, 'getRowBands');

      renderer.render(columns, rows, layoutManager.getVisibleRange(), 0, 0, createRenderOptions());

      expect(getRowBandsSpy).not.toHaveBeenCalled();
    });

    it('draws pinned rows after the scrolling body when their areas overlap', () => {
      const columns = createTestColumns();
      const rows = createTestRows(6);
      const rowPinManager = new RowPinManager();
      rowPinManager.pin(rows[2]!, 'top');
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.calculateLayout(columns, rows);
      layoutManager.setScrollPosition(0, mockTheme.row.height * 2);

      const ctx = canvas.getContext('2d')!;
      const fillTextSpy = jest.spyOn(ctx, 'fillText');

      renderer.render(
        columns,
        rows,
        layoutManager.getVisibleRange(),
        0,
        mockTheme.row.height,
        createRenderOptions(),
      );

      const bodyRowCall = findLastCallIndex(fillTextSpy.mock.calls, (call) => call[0] === 'User 2');
      const pinnedRowCall = findLastCallIndex(
        fillTextSpy.mock.calls,
        (call) => call[0] === 'User 3',
      );
      expect(bodyRowCall).toBeGreaterThanOrEqual(0);
      expect(pinnedRowCall).toBeGreaterThan(bodyRowCall);
    });

    it('draws selected pinned rows at their viewport band position', () => {
      const columns = createTestColumns();
      const rows = createTestRows(6);
      const rowPinManager = new RowPinManager();
      rowPinManager.pin(rows[2]!, 'top');
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.calculateLayout(columns, rows);

      const ctx = canvas.getContext('2d')!;
      const strokeRectSpy = jest.spyOn(ctx, 'strokeRect');

      renderer.render(
        columns,
        rows,
        layoutManager.getVisibleRange(),
        0,
        mockTheme.row.height * 2,
        createRenderOptions({
          selectedCells: [{ start: { rowIndex: 2, columnIndex: 1 }, end: { rowIndex: 2, columnIndex: 1 } }],
        }),
      );

      const selectionCall = strokeRectSpy.mock.calls.find(
        (call) => call[1] === mockTheme.row.headerHeight,
      );
      expect(selectionCall).toBeDefined();
    });

    it('renders bottom summary rows outside the body band', () => {
      const columns = createTestColumns();
      const rows = createTestRows(6);
      const summary = createSummaryRow();
      layoutManager.setViewportSize(800, 240);
      layoutManager.setSummaryRows([], [summary]);
      layoutManager.calculateLayout(columns, rows);

      const ctx = canvas.getContext('2d')!;
      const fillTextSpy = jest.spyOn(ctx, 'fillText');

      renderer.render(columns, rows, layoutManager.getVisibleRange(), 0, 0, createRenderOptions());

      const totalCall = fillTextSpy.mock.calls.find((call) => call[0] === 'Total');
      const amountCall = fillTextSpy.mock.calls.find((call) => call[0] === '60');
      expect(totalCall?.[2]).toBeGreaterThanOrEqual(240 - summary.height);
      expect(amountCall?.[2]).toBeGreaterThanOrEqual(240 - summary.height);
    });

    it('renders cross-column summary cells using the combined column width', () => {
      const columns = createTestColumns();
      const rows = createTestRows(6);
      const summary = createSummaryRow();
      layoutManager.setViewportSize(800, 240);
      layoutManager.setSummaryRows([summary], []);
      layoutManager.calculateLayout(columns, rows);

      const ctx = canvas.getContext('2d')!;
      const strokeRectSpy = jest.spyOn(ctx, 'strokeRect');

      renderer.render(columns, rows, layoutManager.getVisibleRange(), 0, 0, createRenderOptions());

      expect(strokeRectSpy).toHaveBeenCalledWith(
        80,
        mockTheme.row.headerHeight,
        180,
        summary.height,
      );
    });

    it('clips cross-column summary cells to the fixed column render pass', () => {
      const columns: Column[] = [
        { key: 'id', title: 'ID', width: 80, fixed: 'left' },
        { key: 'name', title: 'Name', width: 120 },
      ];
      const rows = createTestRows(3);
      const summary: ComputedSummaryRow = {
        key: 'total',
        height: 40,
        source: { key: 'total', cells: [] },
        cells: [
          {
            key: 'total:label',
            startColumnIndex: 0,
            endColumnIndex: 1,
            startColumnKey: 'id',
            endColumnKey: 'name',
            config: { startColumnKey: 'id', endColumnKey: 'name', text: 'Total' },
            renderResult: { text: 'Total', type: 'text' },
          },
        ],
      };
      layoutManager.setViewportSize(300, 180);
      layoutManager.setSummaryRows([], [summary]);
      layoutManager.calculateLayout(columns, rows);

      const ctx = canvas.getContext('2d')!;
      const strokeRectSpy = jest.spyOn(ctx, 'strokeRect');

      renderer.render(columns, rows, layoutManager.getVisibleRange(), 0, 0, createRenderOptions());

      expect(strokeRectSpy).not.toHaveBeenCalledWith(0, 140, 200, summary.height);
      expect(strokeRectSpy).toHaveBeenCalledWith(0, 140, 80, summary.height);
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

    it('renders validation error outline for invalid cells', () => {
      const columns = createTestColumns();
      const rows = createTestRows(3);
      const visibleRange: VisibleRange = {
        startRow: 0,
        endRow: 2,
        startColumn: 0,
        endColumn: 3,
      };
      layoutManager.calculateLayout(columns, rows);

      const ctx = canvas.getContext('2d')!;
      const validationStrokeStyles: unknown[] = [];
      const strokeRectSpy = jest.spyOn(ctx, 'strokeRect');
      strokeRectSpy.mockImplementation((x, y, width, height) => {
        if (
          x === 81 &&
          y === mockTheme.row.headerHeight + 1 &&
          width === 118 &&
          height === mockTheme.row.height - 2
        ) {
          validationStrokeStyles.push(ctx.strokeStyle);
        }
      });

      renderer.render(columns, rows, visibleRange, 0, 0, {
        ...createRenderOptions(),
        validationErrors: new Map([
          ['0-1', {
            cell: { rowIndex: 0, columnIndex: 1 },
            row: rows[0]!,
            column: columns[1]!,
            value: '',
            message: 'Name is required',
            level: 'error',
          }],
        ]),
      });

      expect(strokeRectSpy).toHaveBeenCalledWith(
        81,
        mockTheme.row.headerHeight + 1,
        118,
        mockTheme.row.height - 2,
      );
      expect(validationStrokeStyles).toContain('#ff4d4f');
    });


    it('records JSX render timings in performance reports', () => {
      const columns: Column[] = [{ key: 'jsx', title: 'JSX', width: 120 }];
      const rows = createTestRows(1);
      columns[0]!.render = () => ({
        type: 'custom',
        jsxRender: () => createCTElement('CTBox', { width: 20, height: 20 }),
      });
      layoutManager.calculateLayout(columns, rows);
      layoutManager.setViewportSize(800, 600);
      renderer = new Renderer(canvas, mockTheme, layoutManager);
      const nowSpy = jest.spyOn(performance, 'now');
      let now = 0;
      nowSpy.mockImplementation(() => {
        now += 0.01;
        return now;
      });

      try {
        renderer.setPerformanceMonitoring(true);
        renderer.render(columns, rows, layoutManager.getVisibleRange(), 0, 0, createRenderOptions());
      } finally {
        nowSpy.mockRestore();
      }

      const report = renderer.getPerformanceReport();
      expect(report).toContain('[jsx]');
      expect(report).toContain('jsx');
    });
    it('includes JSX cache stats in performance diagnostics', () => {
      const columns: Column[] = [{ key: 'jsx', title: 'JSX', width: 120 }];
      const rows = createTestRows(1);
      columns[0]!.render = () => ({
        type: 'custom',
        jsxRender: () => createCTElement('CTBox', { width: 20, height: 20, backgroundColor: '#fff' }),
      });
      layoutManager.calculateLayout(columns, rows);
      layoutManager.setViewportSize(800, 600);
      renderer = new Renderer(canvas, mockTheme, layoutManager);

      renderer.render(columns, rows, layoutManager.getVisibleRange(), 0, 0, createRenderOptions());
      renderer.render(columns, rows, layoutManager.getVisibleRange(), 0, 0, createRenderOptions());

      expect(renderer.getPerformanceDiagnostics().jsxCache).toMatchObject({
        planHits: expect.any(Number),
        planMisses: expect.any(Number),
        cellOffscreen: expect.any(Object),
      });
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

    it('draws row resize guide at pinned row viewport position', () => {
      const baseContext = canvas.getContext('2d');
      expect(baseContext).not.toBeNull();
      const inspectableContext = createInspectableContext(baseContext!);
      jest.spyOn(canvas, 'getContext').mockReturnValue(inspectableContext);

      const columns = createTestColumns();
      const rows = createTestRows(10);
      const rowPinManager = new RowPinManager();
      rowPinManager.pin(rows[3]!, 'top');
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.calculateLayout(columns, rows);
      const rowResizeState: InteractionState['rowResizeState'] = {
        rowIndex: 3,
        startY: 0,
        startHeight: mockTheme.row.height,
        displayHeight: 49,
      };

      renderer = new Renderer(canvas, mockTheme, layoutManager);
      renderer.render(
        columns,
        rows,
        layoutManager.getVisibleRange(),
        0,
        0,
        createRenderOptions({ rowResizeState }),
      );

      const expectedY = mockTheme.row.headerHeight + rowResizeState.displayHeight;
      expect(inspectableContext.moveTo).toHaveBeenCalledWith(0, expectedY);
      expect(inspectableContext.lineTo).toHaveBeenCalledWith(canvas.width, expectedY);
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

    it('treats pinned rows as visible for image lazy loading', () => {
      const rows = createTestRows(8);
      const rowPinManager = new RowPinManager();
      rowPinManager.pin(rows[6]!, 'top');
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.calculateLayout(createTestColumns(), rows);
      renderer = new Renderer(canvas, mockTheme, layoutManager);

      (
        renderer as unknown as {
          currentRows: typeof rows;
          currentVisibleRange: VisibleRange;
          isInLazyLoadRange: (rowIndex: number, threshold: number) => boolean;
        }
      ).currentRows = rows;
      (
        renderer as unknown as {
          currentVisibleRange: VisibleRange;
        }
      ).currentVisibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };

      expect(
        (
          renderer as unknown as {
            isInLazyLoadRange: (rowIndex: number, threshold: number) => boolean;
          }
        ).isInLazyLoadRange(6, 0),
      ).toBe(true);
    });

    it('uses body band row indexes for image lazy loading', () => {
      const rows = createTestRows(8);
      const rowPinManager = new RowPinManager();
      rowPinManager.pin(rows[0]!, 'top');
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.calculateLayout(createTestColumns(), rows);
      renderer = new Renderer(canvas, mockTheme, layoutManager);

      (
        renderer as unknown as {
          currentRows: typeof rows;
          currentVisibleRange: VisibleRange;
          isInLazyLoadRange: (rowIndex: number, threshold: number) => boolean;
        }
      ).currentRows = rows;
      (
        renderer as unknown as {
          currentVisibleRange: VisibleRange;
        }
      ).currentVisibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };

      const lazyRange = renderer as unknown as {
        isInLazyLoadRange: (rowIndex: number, threshold: number) => boolean;
      };
      expect(lazyRange.isInLazyLoadRange(1, 0)).toBe(true);
      expect(lazyRange.isInLazyLoadRange(2, 0)).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should destroy renderer without errors', () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
