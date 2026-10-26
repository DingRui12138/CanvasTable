import { Renderer } from '@/core/Renderer';
import { LayoutManager } from '@/core/LayoutManager';
import { RowPinManager } from '@/core/RowPinManager';
import { ColumnIdManager, RenderCache, RowIdManager, RowVersionManager } from '@/core/RenderCache';
import { createCTElement } from '@/core/jsx/createCTElement';
import { zhCN } from '@/locale';
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

  describe('configuration', () => {
    it('applies locale to loading overlay text', () => {
      const fillTextSpy = jest.spyOn(renderer.getCanvasContext(), 'fillText');

      renderer.setLocale({ ...zhCN, loadingText: '自定义加载' });
      renderer.renderLoadingOverlay();

      expect(fillTextSpy).toHaveBeenCalledWith('自定义加载', expect.any(Number), expect.any(Number));
    });

    it('creates a fresh image load queue when image config changes', () => {
      renderer.setImageLoadConfig({ maxConcurrent: 2, maxCacheSize: 5 });

      expect(renderer.getImageLoadStats()).toEqual({
        pending: 0,
        loading: 0,
        cached: 0,
        failed: 0,
      });
    });

    it('exposes and resets row and column id managers', () => {
      const rows = createTestRows(2);
      const columns = createTestColumns();

      const rowIdManager = renderer.getRowIdManager();
      const firstRowId = rowIdManager.getId(rows[0]!);
      expect(firstRowId).toBe('r0');
      expect(rowIdManager.getId(rows[0]!)).toBe(firstRowId);

      renderer.resetRowIds();
      expect(rowIdManager.getId(rows[0]!)).toBe('r0');

      const columnIdManager = renderer.getColumnIdManager();
      expect(columnIdManager.getId(columns[0]!)).toBe('c0');

      renderer.resetColumnIds();
      expect(columnIdManager.getId(columns[0]!)).toBe('c0');
    });

    it('exposes jsx interactive regions and invalidates offscreen cache', () => {
      expect(renderer.getJSXInteractiveRegions()).toEqual([]);

      renderer.setJSXUpdateHandlers({
        updateValue: jest.fn(async () => {}),
        updateField: jest.fn(async () => {}),
        updateRow: jest.fn(async () => {}),
      });

      expect(() => renderer.invalidateJsxOffscreen('all')).not.toThrow();
      expect(() => renderer.invalidateJsxOffscreen({ oldSize: '100%' })).not.toThrow();
    });
  });

  describe('standalone render methods', () => {
    it('renders empty state message with headers and fixed columns', () => {
      const columns: Column[] = [
        { key: 'id', title: 'ID', width: 80, fixed: 'left', type: 'number' },
        { key: 'name', title: 'Name', width: 120, type: 'text' },
        { key: 'active', title: 'Active', width: 60, type: 'checkbox' },
        { key: 'progress', title: 'Progress', width: 100, fixed: 'right', type: 'progress' },
      ];
      layoutManager.calculateLayout(columns, []);
      const fillTextSpy = jest.spyOn(renderer.getCanvasContext(), 'fillText');

      renderer.renderEmptyState(
        '暂无匹配数据',
        [{ column: 'name', direction: 'asc' }],
        [{ column: 'active', operator: 'eq', value: true }],
        'name',
        30,
      );

      expect(fillTextSpy).toHaveBeenCalledWith(
        '暂无匹配数据',
        expect.any(Number),
        expect.any(Number),
      );
      expect(fillTextSpy).toHaveBeenCalledWith('ID', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith('Progress', expect.any(Number), expect.any(Number));
    });

    it('renders empty state sort and filter indicators', () => {
      const columns: Column[] = [
        { key: 'name', title: 'Name', width: 120, type: 'text', filterable: true, align: 'center' },
        {
          key: 'id',
          title: 'ID',
          width: 80,
          type: 'number',
          sortable: true,
          filterable: true,
          align: 'right',
        },
      ];
      layoutManager.calculateLayout(columns, []);
      const ctx = renderer.getCanvasContext();
      const moveToSpy = jest.spyOn(ctx, 'moveTo');
      const lineToSpy = jest.spyOn(ctx, 'lineTo');

      renderer.renderEmptyState(
        '空',
        [{ column: 'id', direction: 'desc' }],
        [{ column: 'name', operator: 'contains', value: 'x' }],
        undefined,
        0,
      );

      expect(moveToSpy).toHaveBeenCalled();
      expect(lineToSpy).toHaveBeenCalled();
    });

    it('renders fixed column shadows on both sides', () => {
      const ctx = renderer.getCanvasContext();
      const gradient = { addColorStop: jest.fn() } as unknown as CanvasGradient;
      jest.spyOn(ctx, 'createLinearGradient').mockReturnValue(gradient);
      const fillRectSpy = jest.spyOn(ctx, 'fillRect');

      renderer.renderFixedColumnsShadow(120, 'left');
      renderer.renderFixedColumnsShadow(120, 'right');

      expect(fillRectSpy).toHaveBeenCalledWith(120, 0, 10, 600);
      expect(fillRectSpy).toHaveBeenCalledWith(670, 0, 10, 600);
      expect(gradient.addColorStop).toHaveBeenCalledTimes(4);
    });

    it('renders tooltip text content', () => {
      const fillTextSpy = jest.spyOn(renderer.getCanvasContext(), 'fillText');

      renderer.renderTooltip({
        cell: { rowIndex: 0, columnIndex: 0 },
        x: 10,
        y: 10,
        width: 100,
        content: { type: 'text', text: '提示' },
      });

      expect(fillTextSpy).toHaveBeenCalledWith('提示', expect.any(Number), expect.any(Number));
    });

    it('reports and renders scrollbars', () => {
      const ctx = renderer.getCanvasContext();
      const fillRectSpy = jest.spyOn(ctx, 'fillRect');

      const bounds = renderer.getScrollbarBounds(0, 50, 100, 200);
      expect(bounds.vertical).toMatchObject({ width: 8 });
      expect(bounds.horizontal).toMatchObject({ height: 8 });

      renderer.renderScrollbars(0, 50, 100, 200, {
        verticalHovered: true,
        horizontalHovered: false,
        verticalDragging: false,
        horizontalDragging: false,
        dragStartY: 0,
        dragStartScrollTop: 0,
        dragStartX: 0,
        dragStartScrollLeft: 0,
      });
      expect(fillRectSpy).toHaveBeenCalled();
    });

    it('returns null scrollbar bounds when nothing can scroll', () => {
      expect(renderer.getScrollbarBounds(0, 0, 0, 0)).toEqual({
        vertical: null,
        horizontal: null,
      });
    });

    it('renders watermark only when enabled', () => {
      const fillTextSpy = jest.spyOn(renderer.getCanvasContext(), 'fillText');

      renderer.setWatermarkConfig({ content: '内部资料', enabled: true });
      renderer.renderWatermark();
      expect(fillTextSpy).toHaveBeenCalledWith('内部资料', expect.any(Number), expect.any(Number));

      fillTextSpy.mockClear();
      renderer.setWatermarkConfig({ content: '内部资料', enabled: false });
      renderer.renderWatermark();
      expect(fillTextSpy).not.toHaveBeenCalled();

      renderer.setWatermarkConfig(null);
      renderer.renderWatermark();
      expect(fillTextSpy).not.toHaveBeenCalled();
    });

    it('renders color, date and filter dropdowns', () => {
      const ctx = renderer.getCanvasContext();
      const fillTextSpy = jest.spyOn(ctx, 'fillText');
      const roundRectSpy = jest.spyOn(ctx, 'roundRect');

      renderer.renderColorDropdown({
        cell: { rowIndex: 0, columnIndex: 0 },
        config: { value: '#ffffff', presetColors: ['#ffffff', '#000000'] },
        x: 0,
        y: 0,
        width: 200,
        hoveredColor: '#000000',
      });
      expect(roundRectSpy).toHaveBeenCalled();

      renderer.renderDateDropdown({
        cell: { rowIndex: 0, columnIndex: 0 },
        config: {},
        x: 0,
        y: 0,
        width: 224,
        currentYear: 2026,
        currentMonth: 1,
        selectedDate: new Date(2026, 1, 10),
        hoveredDate: new Date(2026, 1, 12),
      });
      expect(fillTextSpy).toHaveBeenCalledWith(
        '2026年 2月',
        expect.any(Number),
        expect.any(Number),
      );

      renderer.renderFilterDropdown({
        columnKey: 'name',
        mode: 'search',
        x: 0,
        y: 0,
        width: 200,
        scrollTop: 0,
        hoveredIndex: -1,
        searchText: '',
        searchValue: '',
      });
      expect(fillTextSpy).toHaveBeenCalledWith(
        zhCN.filter.searchPlaceholder,
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('renders select, buttons and image overlays', () => {
      const ctx = renderer.getCanvasContext();
      const fillTextSpy = jest.spyOn(ctx, 'fillText');
      const fillRectSpy = jest.spyOn(ctx, 'fillRect');

      renderer.renderDropdown({
        cell: { rowIndex: 0, columnIndex: 1 },
        config: { options: [{ label: '选项A', value: 'a' }] },
        x: 0,
        y: 0,
        width: 160,
        scrollTop: 0,
        hoveredIndex: 0,
      });
      expect(fillTextSpy).toHaveBeenCalledWith('选项A', expect.any(Number), expect.any(Number));

      renderer.renderButtonsDropdown({
        cell: { rowIndex: 0, columnIndex: 1 },
        x: 0,
        y: 0,
        buttons: [{ text: '动作一' }],
        hoveredIndex: 0,
        buttonRelativeX: 0,
        buttonY: 0,
        buttonHeight: 32,
        showAbove: false,
      });
      expect(fillTextSpy).toHaveBeenCalledWith('动作一', expect.any(Number), expect.any(Number));

      renderer.renderImageTooltip({
        cell: { rowIndex: 0, columnIndex: 0 },
        x: 0,
        y: 0,
        images: [],
        hoveredIndex: -1,
        scrollTop: 0,
        maxRows: 2,
        showAbove: false,
      });
      renderer.renderImageEditor({
        cell: { rowIndex: 0, columnIndex: 0 },
        x: 0,
        y: 0,
        images: [],
        hoveredIndex: -1,
        scrollTop: 0,
        maxRows: 2,
        showAbove: false,
        isDragging: false,
        pendingImages: [],
        isSingleImage: false,
      });
      expect(fillRectSpy).toHaveBeenCalled();
    });

    it('renders context menus', () => {
      const fillTextSpy = jest.spyOn(renderer.getCanvasContext(), 'fillText');

      renderer.renderContextMenu({
        x: 10,
        y: 10,
        row: { data: {} },
        hoveredIndex: 0,
        items: [{ key: 'delete', text: '删除', danger: true }],
      });
      expect(fillTextSpy).toHaveBeenCalledWith('删除', expect.any(Number), expect.any(Number));

      renderer.renderHeaderContextMenu({
        x: 10,
        y: 10,
        columnKey: 'name',
        columnIndex: 1,
        hoveredIndex: 0,
      });
      expect(fillTextSpy).toHaveBeenCalledWith(
        zhCN.contextMenu.hideColumn,
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('render options overlays', () => {
    it('paints dropdown, header context menu and column reorder indicator', () => {
      const columns = createTestColumns();
      const rows = createTestRows(6);
      layoutManager.calculateLayout(columns, rows);
      const ctx = renderer.getCanvasContext();
      const fillTextSpy = jest.spyOn(ctx, 'fillText');
      const setLineDashSpy = jest.spyOn(ctx, 'setLineDash');

      renderer.render(
        columns,
        rows,
        { startRow: 0, endRow: 5, startColumn: 0, endColumn: 3 },
        0,
        0,
        createRenderOptions({
          dropdown: {
            cell: { rowIndex: 0, columnIndex: 1 },
            config: { options: [{ label: '选项A', value: 'a' }] },
            x: 10,
            y: 10,
            width: 160,
            scrollTop: 0,
            hoveredIndex: 0,
          },
          headerContextMenu: {
            x: 20,
            y: 20,
            columnKey: 'name',
            columnIndex: 1,
            hoveredIndex: 0,
          },
          columnReorderState: {
            dragColumnIndex: 1,
            dragColumnKey: 'name',
            dragStartX: 0,
            currentX: 200,
            targetColumnIndex: 2,
          },
        }),
      );

      expect(fillTextSpy).toHaveBeenCalledWith('选项A', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith(
        zhCN.contextMenu.hideColumn,
        expect.any(Number),
        expect.any(Number),
      );
      expect(setLineDashSpy).toHaveBeenCalledWith([5, 5]);
    });

    it('renders parent column ghost for grouped columns', () => {
      const columns: Column[] = [
        {
          key: 'group',
          title: 'Group',
          children: [
            { key: 'id', title: 'ID', width: 80, type: 'number' },
            { key: 'name', title: 'Name', width: 120, type: 'text' },
          ],
        },
        { key: 'active', title: 'Active', width: 60, type: 'checkbox' },
      ];
      const rows = createTestRows(4);
      layoutManager.calculateLayout(columns, rows);
      const ctx = renderer.getCanvasContext();
      const fillTextSpy = jest.spyOn(ctx, 'fillText');
      const setLineDashSpy = jest.spyOn(ctx, 'setLineDash');

      renderer.render(
        columns,
        rows,
        { startRow: 0, endRow: 3, startColumn: 0, endColumn: 2 },
        0,
        0,
        createRenderOptions({
          columnReorderState: {
            dragColumnIndex: 0,
            dragColumnKey: 'group',
            dragStartX: 0,
            currentX: 100,
            targetColumnIndex: 1,
            isParentColumn: true,
          },
        }),
      );

      const groupTitleCalls = fillTextSpy.mock.calls.filter((call) => call[0] === 'Group');
      expect(groupTitleCalls.length).toBeGreaterThanOrEqual(2);
      expect(setLineDashSpy).toHaveBeenCalledWith([5, 5]);
    });
  });

  describe('performance monitoring', () => {
    const columns = createTestColumns() as Column[];
    const visibleRange: VisibleRange = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };

    it('records frames only while monitoring is enabled', () => {
      renderer.setPerformanceMonitoring(false);
      renderer.beginFrame();
      renderer.endFrame(visibleRange, 0, 0, columns);
      expect(renderer.getLastFrameDiagnostics()).toBeNull();

      renderer.setPerformanceMonitoring(true);
      expect(renderer.isPerformanceMonitoringEnabled()).toBe(true);

      renderer.beginFrame();
      renderer.endFrame(visibleRange, 0, 0, columns);
      expect(renderer.getLastFrameDiagnostics()).not.toBeNull();
      expect(renderer.getWorstFrameDiagnostics()).toEqual(renderer.getLastFrameDiagnostics());

      const report = renderer.getPerformanceReport();
      expect(report).toContain('Status: Enabled');
      expect(report).toContain('Captured Renderer Frames: 1');

      renderer.setPerformanceMonitoring(false);
      expect(renderer.getPerformanceReport()).toContain('Status: Disabled');

      renderer.beginFrame();
      renderer.endFrame(visibleRange, 0, 0, columns);
      expect(renderer.getPerformanceReport()).toContain('Captured Renderer Frames: 1');
    });

    it('caps retained frame history at 120 entries', () => {
      renderer.setPerformanceMonitoring(true);

      for (let index = 0; index < 125; index++) {
        renderer.beginFrame();
        renderer.endFrame(visibleRange, 0, 0, columns);
      }

      const diagnostics = renderer.getPerformanceDiagnostics();
      expect(diagnostics.frameHistory).toHaveLength(120);
      expect(diagnostics.lastFrame.frameId).toBe(125);
    });

    it('writes performance reports to the console', () => {
      renderer.setPerformanceMonitoring(true);
      renderer.beginFrame();
      renderer.endFrame(visibleRange, 0, 0, columns);

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const tableSpy = jest.spyOn(console, 'table').mockImplementation(() => {});
      const groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {});
      const groupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});

      renderer.logPerformanceReport();
      renderer.printPerformanceReport();

      expect(groupSpy).toHaveBeenCalled();
      expect(tableSpy).toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Renderer Performance Report'));

      logSpy.mockRestore();
      tableSpy.mockRestore();
      groupSpy.mockRestore();
      groupEndSpy.mockRestore();
    });

    it('resets statistics and frame history', () => {
      renderer.setPerformanceMonitoring(true);
      renderer.beginFrame();
      renderer.endFrame(visibleRange, 0, 0, columns);

      renderer.resetPerformanceStats();

      expect(renderer.getLastFrameDiagnostics()).toBeNull();
      expect(renderer.getWorstFrameDiagnostics()).toBeNull();
      expect(renderer.getPerformanceStats().size).toBe(0);
      expect(renderer.getPerformanceReport()).toContain('Captured Renderer Frames: 0');
    });
  });

  describe('render cache lifecycle', () => {
    it('returns null stats without a cache', () => {
      expect(renderer.getCacheStats()).toBeNull();
    });

    it('delegates cache lifecycle calls', () => {
      const cache = new RenderCache(
        new RowIdManager(),
        new ColumnIdManager(),
        new RowVersionManager(),
      );
      const clearSpy = jest.spyOn(cache, 'clear');
      const resetRowIdsSpy = jest.spyOn(cache, 'resetRowIds');
      const resetColumnIdsSpy = jest.spyOn(cache, 'resetColumnIds');
      const cleanupRowsSpy = jest.spyOn(cache, 'cleanupInvisibleRows');
      const cleanupColumnsSpy = jest.spyOn(cache, 'cleanupInvisibleColumns');

      renderer.setRenderCache(cache);
      expect(renderer.getCacheStats()).toEqual({
        cellCacheSize: 0,
        valueCacheSize: 0,
        maxCellCacheSize: 3000,
      });

      renderer.clearRenderCache();
      renderer.resetRowIds();
      renderer.resetColumnIds();
      renderer.cleanupInvisibleRows(new Set(['r0']));
      renderer.cleanupInvisibleColumns(new Set(['c0']));

      expect(clearSpy).toHaveBeenCalled();
      expect(resetRowIdsSpy).toHaveBeenCalled();
      expect(resetColumnIdsSpy).toHaveBeenCalled();
      expect(cleanupRowsSpy).toHaveBeenCalledWith(new Set(['r0']));
      expect(cleanupColumnsSpy).toHaveBeenCalledWith(new Set(['c0']));
    });
  });

  describe('destroy', () => {
    it('should destroy renderer without errors', () => {
      expect(() => renderer.destroy()).not.toThrow();
    });
  });
});
