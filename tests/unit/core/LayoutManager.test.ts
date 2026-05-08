import { LayoutManager } from '@/core/LayoutManager';
import { RowPinManager } from '@/core/RowPinManager';
import { createMockTheme, createTestColumns, createTestRows } from '../helpers/mockFactories';
import type { ComputedSummaryRow } from '@/types';

function createSummaryRow(key: string, height: number): ComputedSummaryRow {
  return {
    key,
    height,
    cells: [],
    source: { key, cells: [] },
  };
}

describe('LayoutManager', () => {
  let layoutManager: LayoutManager;
  let theme: ReturnType<typeof createMockTheme>;

  beforeEach(() => {
    theme = createMockTheme();
    layoutManager = new LayoutManager(undefined, theme);
  });

  describe('calculateLayout', () => {
    it('should calculate basic layout correctly', () => {
      const columns = createTestColumns();
      const rows = createTestRows(10);

      const layoutInfo = layoutManager.calculateLayout(columns, rows);

      expect(layoutInfo.viewportWidth).toBe(0);
      expect(layoutInfo.headerHeight).toBe(theme.row.headerHeight);
      expect(layoutInfo.columnWidths.length).toBe(4);
    });

    it('should set viewport size correctly', () => {
      layoutManager.setViewportSize(800, 600);
      const layoutInfo = layoutManager.getLayoutInfo();

      expect(layoutInfo.viewportWidth).toBe(800);
      expect(layoutInfo.viewportHeight).toBe(600);
    });
  });

  describe('fixed columns', () => {
    it('includes the row number column when building summary leaf columns', () => {
      const columns = [
        { key: 'id', title: 'ID', width: 80, fixed: 'left' as const },
        { key: 'name', title: 'Name', width: 120 },
      ];

      layoutManager.setShowRowNumbers(true);

      const visibleLeafColumns = layoutManager.getVisibleLeafColumnsForLayout(columns);

      expect(visibleLeafColumns).toHaveLength(3);
      expect(visibleLeafColumns[0]).toMatchObject({
        title: '#',
        width: 50,
        fixed: 'left',
        _isRowNumber: true,
      });
      expect(visibleLeafColumns[1]!.key).toBe('id');
      expect(visibleLeafColumns[2]!.key).toBe('name');
    });

    it('includes hidden placeholders when building summary leaf columns', () => {
      const columns = [
        { key: 'name', title: 'Name', width: 120, fixed: 'left' as const },
        { key: 'secret', title: 'Secret', width: 100, hidden: true },
        { key: 'avatar', title: 'Avatar', width: 80, fixed: 'left' as const },
        { key: 'website', title: 'Website', width: 150 },
        { key: 'salary', title: 'Salary', width: 100 },
      ];

      const visibleLeafColumns = layoutManager.getVisibleLeafColumnsForLayout(columns);

      expect(visibleLeafColumns.map((column) => column.key)).toEqual([
        'name',
        '__hidden_placeholder__secret',
        'avatar',
        'website',
        'salary',
      ]);
      expect(visibleLeafColumns[1]).toMatchObject({
        width: 5,
        fixed: 'left',
        _hiddenColumnKey: 'secret',
      });
    });

    it('should detect left fixed columns', () => {
      const columns = [
        { key: 'id', title: 'ID', width: 80, fixed: 'left' as const },
        { key: 'name', title: 'Name', width: 120 },
      ];
      layoutManager.calculateLayout(columns, []);

      expect(layoutManager.hasLeftFixedColumns()).toBe(true);
    });

    it('should return false when no left fixed columns', () => {
      const columns = [
        { key: 'id', title: 'ID', width: 80 },
        { key: 'name', title: 'Name', width: 120 },
      ];
      layoutManager.calculateLayout(columns, []);

      expect(layoutManager.hasLeftFixedColumns()).toBe(false);
    });

    it('should calculate left fixed width correctly', () => {
      const columns = [
        { key: 'id', title: 'ID', width: 80, fixed: 'left' as const },
        { key: 'name', title: 'Name', width: 120, fixed: 'left' as const },
        { key: 'age', title: 'Age', width: 60 },
      ];
      layoutManager.calculateLayout(columns, []);

      expect(layoutManager.getLeftFixedWidth()).toBe(200);
    });

    it('should calculate right fixed width correctly', () => {
      const columns = [
        { key: 'id', title: 'ID', width: 80 },
        { key: 'name', title: 'Name', width: 120, fixed: 'right' as const },
      ];
      layoutManager.calculateLayout(columns, []);

      expect(layoutManager.getRightFixedWidth()).toBe(120);
    });
  });

  describe('multi-level headers', () => {
    it('should calculate header depth correctly', () => {
      const columns = [
        {
          key: 'group1',
          title: 'Group 1',
          children: [
            { key: 'child1', title: 'Child 1', width: 100 },
            { key: 'child2', title: 'Child 2', width: 100 },
          ],
        },
        { key: 'simple', title: 'Simple', width: 80 },
      ];
      layoutManager.calculateLayout(columns, []);

      expect(layoutManager.getHeaderDepth()).toBe(2);
    });

    it('should handle three-level headers', () => {
      const columns = [
        {
          key: 'group1',
          title: 'Group 1',
          children: [
            {
              key: 'subgroup1',
              title: 'Sub 1',
              children: [
                { key: 'leaf1', title: 'Leaf 1', width: 80 },
              ],
            },
          ],
        },
      ];
      layoutManager.calculateLayout(columns, []);

      expect(layoutManager.getHeaderDepth()).toBe(3);
    });
  });

  describe('column width', () => {
    it('should get column width correctly', () => {
      const columns = [{ key: 'id', title: 'ID', width: 100 }];
      layoutManager.calculateLayout(columns, []);

      const width = layoutManager.getColumnWidth(columns[0]!);
      expect(width).toBe(100);
    });

    it('should use default width when not specified', () => {
      const columns = [{ key: 'id', title: 'ID' }];
      layoutManager.calculateLayout(columns, []);

      const width = layoutManager.getColumnWidth(columns[0]!);
      expect(width).toBe(150); // DEFAULT_COLUMN_WIDTH
    });

    it('should respect min/max width constraints', () => {
      const columns = [{ key: 'id', title: 'ID', width: 30, minWidth: 50 }];
      layoutManager.calculateLayout(columns, []);

      const width = layoutManager.getColumnWidth(columns[0]!);
      expect(width).toBe(50); // Clamped to minWidth
    });
  });

  describe('column width adjustment', () => {
    it('should set column width and recalculate', () => {
      const columns = createTestColumns();
      layoutManager.calculateLayout(columns, []);

      layoutManager.setColumnWidth('name', 200);

      const column = layoutManager.getColumnByKey('name');
      expect(column).toBeDefined();
    });
  });

  describe('cell position', () => {
    it('should get cell position correctly', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      layoutManager.setViewportSize(800, 600);
      layoutManager.calculateLayout(columns, rows);

      const cellPos = layoutManager.getCellPosition(0, 0);
      expect(cellPos.x).toBe(0);
      expect(cellPos.y).toBe(theme.row.headerHeight); // Below header
      expect(cellPos.width).toBe(80);
      expect(cellPos.height).toBe(theme.row.height);
    });
  });

  describe('hidden columns', () => {
    it('should identify hidden placeholder columns', () => {
      const placeholderColumn = {
        key: '__hidden_placeholder__test',
        title: '',
        width: 5,
      };
      expect(layoutManager.isHiddenPlaceholderColumn(placeholderColumn)).toBe(true);

      const normalColumn = { key: 'test', title: 'Test', width: 100 };
      expect(layoutManager.isHiddenPlaceholderColumn(normalColumn)).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all state on reset', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      layoutManager.calculateLayout(columns, rows);

      layoutManager.reset();

      const layoutInfo = layoutManager.getLayoutInfo();
      expect(layoutInfo.totalWidth).toBe(0);
      expect(layoutInfo.totalHeight).toBe(0);
      expect(layoutManager.getLeafColumns().length).toBe(0);
    });
  });

  describe('row height overrides', () => {
    it('override wins over rowHeightFn', () => {
      const columns = createTestColumns();
      const rows = createTestRows(3);

      layoutManager.setRowHeightFn(() => 80);
      layoutManager.setRowHeight(rows[1]!, 120);
      layoutManager.calculateLayout(columns, rows);

      expect(layoutManager.getRowHeightByIndex(0)).toBe(80);
      expect(layoutManager.getRowHeightByIndex(1)).toBe(120);
    });

    it('does not depend on row id for overrides', () => {
      const columns = createTestColumns();
      const rows = createTestRows(2).map((row) => ({
        ...row,
        id: undefined as unknown as string,
      }));

      layoutManager.setRowHeight(rows[1]!, 96);
      layoutManager.calculateLayout(columns, rows);

      expect(layoutManager.getRowHeightByIndex(0)).toBe(theme.row.height);
      expect(layoutManager.getRowHeightByIndex(1)).toBe(96);
    });

    it('keeps overrides attached to row objects when row order changes', () => {
      const columns = createTestColumns();
      const rows = createTestRows(3);

      layoutManager.setRowHeight(rows[2]!, 96);
      layoutManager.calculateLayout(columns, rows);
      expect(layoutManager.getRowHeightByIndex(2)).toBe(96);

      const reorderedRows = [rows[2]!, rows[0]!, rows[1]!];
      layoutManager.calculateLayout(columns, reorderedRows);

      expect(layoutManager.getRowHeightByIndex(0)).toBe(96);
      expect(layoutManager.getRowHeightByIndex(2)).toBe(theme.row.height);
    });

    it('clearRowHeightOverrides falls back to fn and default height', () => {
      const columns = createTestColumns();
      const rows = createTestRows(2);

      layoutManager.setRowHeightFn(() => 72);
      layoutManager.setRowHeight(rows[0]!, 110);
      layoutManager.calculateLayout(columns, rows);
      expect(layoutManager.getRowHeightByIndex(0)).toBe(110);

      layoutManager.clearRowHeightOverrides();
      layoutManager.calculateLayout(columns, rows);
      expect(layoutManager.getRowHeightByIndex(0)).toBe(72);

      layoutManager.setRowHeightFn(undefined);
      layoutManager.calculateLayout(columns, rows);
      expect(layoutManager.getRowHeightByIndex(0)).toBe(theme.row.height);
    });

    it('override updates row offsets and total height after recalculation', () => {
      const columns = createTestColumns();
      const rows = createTestRows(3);

      layoutManager.calculateLayout(columns, rows);
      const initialLayout = layoutManager.getLayoutInfo();
      expect(initialLayout.totalHeight).toBe(theme.row.headerHeight + theme.row.height * 3);
      expect(layoutManager.getRowOffset(1)).toBe(theme.row.headerHeight + theme.row.height);

      layoutManager.setRowHeight(rows[0]!, 64);
      const updatedLayout = layoutManager.calculateLayout(columns, rows);

      expect(layoutManager.getRowHeightByIndex(0)).toBe(64);
      expect(layoutManager.getRowOffset(1)).toBe(theme.row.headerHeight + 64);
      expect(updatedLayout.totalHeight).toBe(theme.row.headerHeight + 64 + theme.row.height * 2);
    });

    it('updates a committed row height without recalculating every row height', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      const rowHeightFn = jest.fn(() => theme.row.height);

      layoutManager.setRowHeightFn(rowHeightFn);
      layoutManager.calculateLayout(columns, rows);
      rowHeightFn.mockClear();

      const updated = layoutManager.updateRowHeight(rows[1]!, 64);

      expect(updated).toBe(true);
      expect(rowHeightFn).not.toHaveBeenCalled();
      expect(layoutManager.getRowHeightByIndex(1)).toBe(64);
      expect(layoutManager.getRowOffset(1)).toBe(theme.row.headerHeight + theme.row.height);
      expect(layoutManager.getRowOffset(2)).toBe(theme.row.headerHeight + theme.row.height + 64);
      expect(layoutManager.getLayoutInfo().totalHeight).toBe(
        theme.row.headerHeight + theme.row.height * 4 + 64,
      );
    });

    it('override clamps to theme row min and max', () => {
      const columns = createTestColumns();
      const rows = createTestRows(2);

      layoutManager.setRowHeight(rows[0]!, theme.row.minHeight - 10);
      layoutManager.setRowHeight(rows[1]!, theme.row.maxHeight + 25);
      layoutManager.calculateLayout(columns, rows);

      expect(layoutManager.getRowHeightByIndex(0)).toBe(theme.row.minHeight);
      expect(layoutManager.getRowHeightByIndex(1)).toBe(theme.row.maxHeight);
    });

    it('reset clears overrides', () => {
      const columns = createTestColumns();
      const rows = createTestRows(2);

      layoutManager.setRowHeight(rows[0]!, 88);
      layoutManager.calculateLayout(columns, rows);
      expect(layoutManager.getRowHeightByIndex(0)).toBe(88);

      layoutManager.reset();

      layoutManager.calculateLayout(columns, rows);
      expect(layoutManager.getRowHeightByIndex(0)).toBe(theme.row.height);
    });
  });

  describe('row bands', () => {
    it('excludes pinned rows from body rows', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      const rowPinManager = new RowPinManager();

      layoutManager.setRowPinManager(rowPinManager);
      rowPinManager.pin(rows[2]!, 'top');
      rowPinManager.pin(rows[4]!, 'bottom');
      layoutManager.calculateLayout(columns, rows);

      const bands = layoutManager.getRowBands();
      expect(bands.pinnedTop.rows).toEqual([rows[2]]);
      expect(bands.body.rows).toEqual([rows[0], rows[1], rows[3]]);
      expect(bands.pinnedBottom.rows).toEqual([rows[4]]);
    });

    it('reduces body visible height when rows are pinned', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      const rowPinManager = new RowPinManager();

      layoutManager.setViewportSize(800, 200);
      layoutManager.setRowPinManager(rowPinManager);
      rowPinManager.pin(rows[0]!, 'top');
      rowPinManager.pin(rows[4]!, 'bottom');
      layoutManager.calculateLayout(columns, rows);

      expect(layoutManager.getBodyViewportHeight()).toBe(
        200 - theme.row.headerHeight - theme.row.height * 2,
      );
    });

    it('returns viewport y for pinned bottom rows without applying body scroll', () => {
      const columns = createTestColumns();
      const rows = createTestRows(20);
      const rowPinManager = new RowPinManager();

      layoutManager.setViewportSize(800, 240);
      layoutManager.setRowPinManager(rowPinManager);
      rowPinManager.pin(rows[19]!, 'bottom');
      layoutManager.calculateLayout(columns, rows);
      layoutManager.setScrollPosition(0, theme.row.height * 10);

      expect(layoutManager.getCellViewportY(19)).toBe(240 - theme.row.height);
    });

    it('rebuilds row bands when pin state changes without row data changes', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      const rowPinManager = new RowPinManager();

      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.calculateLayout(columns, rows);

      rowPinManager.pin(rows[1]!, 'top');
      layoutManager.calculateLayout(columns, rows);

      const bands = layoutManager.getRowBands();
      expect(bands.pinnedTop.rows).toEqual([rows[1]]);
      expect(bands.body.rows).toEqual([rows[0], rows[2], rows[3], rows[4]]);
    });

    it('updates row pinning without recalculating every row height', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      const rowPinManager = new RowPinManager();
      const rowHeightFn = jest.fn(() => theme.row.height);

      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.setRowHeightFn(rowHeightFn);
      layoutManager.calculateLayout(columns, rows);
      rowHeightFn.mockClear();

      rowPinManager.pin(rows[2]!, 'top');
      const pinned = layoutManager.updateRowPin(rows[2]!, null, 'top');

      expect(pinned).toBe(true);
      expect(rowHeightFn).not.toHaveBeenCalled();
      expect(layoutManager.getRowBands().pinnedTop.rows).toEqual([rows[2]]);
      expect(layoutManager.getRowBands().body.rows).toEqual([
        rows[0],
        rows[1],
        rows[3],
        rows[4],
      ]);
      expect(layoutManager.getBodyRowIndexByRef(rows[3]!)).toBe(2);
      expect(layoutManager.getRowBandOffsetByRef(rows[3]!)).toBe(theme.row.height * 2);

      rowPinManager.remove(rows[2]!);
      const unpinned = layoutManager.updateRowPin(rows[2]!, 'top', null);

      expect(unpinned).toBe(true);
      expect(rowHeightFn).not.toHaveBeenCalled();
      expect(layoutManager.getRowBands().pinnedTop.rows).toEqual([]);
      expect(layoutManager.getRowBands().body.rows).toEqual(rows);
      expect(layoutManager.getBodyRowIndexByRef(rows[2]!)).toBe(2);
      expect(layoutManager.getRowBandOffsetByRef(rows[3]!)).toBe(theme.row.height * 3);
    });

    it('calculates visible range from body viewport height', () => {
      const columns = createTestColumns();
      const rows = createTestRows(20);
      const rowPinManager = new RowPinManager();
      layoutManager = new LayoutManager(
        { enabled: true, rowBufferSize: 0, columnBufferSize: 0 },
        theme,
      );

      layoutManager.setViewportSize(800, theme.row.headerHeight + theme.row.height * 3);
      layoutManager.setRowPinManager(rowPinManager);
      rowPinManager.pin(rows[0]!, 'top');
      layoutManager.calculateLayout(columns, rows);
      layoutManager.setScrollPosition(0, 0);

      const visibleRange = layoutManager.getVisibleRange();

      expect(layoutManager.getBodyViewportHeight()).toBe(theme.row.height * 2);
      expect(visibleRange.endRow).toBe(2);
    });

    it('hit tests large pinned layouts without scanning all rows on mouse move', () => {
      const columns = createTestColumns();
      const rows = createTestRows(20000);
      const rowPinManager = new RowPinManager();
      layoutManager.setViewportSize(800, 400);
      layoutManager.setRowPinManager(rowPinManager);
      rowPinManager.pin(rows[19999]!, 'top');
      layoutManager.calculateLayout(columns, rows);
      layoutManager.setScrollPosition(0, theme.row.height * 10000);

      const startedAt = performance.now();
      const result = layoutManager.hitTest(40, theme.row.headerHeight + theme.row.height * 2);
      const elapsed = performance.now() - startedAt;

      expect(result.region).toBe('cell');
      expect(elapsed).toBeLessThan(20);
    });

    it('places top summary rows above pinned top rows', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      const rowPinManager = new RowPinManager();
      const summary = createSummaryRow('total', 40);

      layoutManager.setViewportSize(800, 240);
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.setSummaryRows([summary], []);
      rowPinManager.pin(rows[0]!, 'top');
      layoutManager.calculateLayout(columns, rows);

      const bands = layoutManager.getRowBands();
      expect(bands.summaryTop.rows).toEqual([summary]);
      expect(bands.summaryTop.y).toBe(theme.row.headerHeight);
      expect(bands.pinnedTop.y).toBe(theme.row.headerHeight + summary.height);
      expect(bands.body.y).toBe(theme.row.headerHeight + summary.height + theme.row.height);
    });

    it('places bottom summary rows below pinned bottom rows and subtracts both from body viewport', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      const rowPinManager = new RowPinManager();
      const summary = createSummaryRow('total', 44);

      layoutManager.setViewportSize(800, 260);
      layoutManager.setRowPinManager(rowPinManager);
      layoutManager.setSummaryRows([], [summary]);
      rowPinManager.pin(rows[4]!, 'bottom');
      layoutManager.calculateLayout(columns, rows);

      const bands = layoutManager.getRowBands();
      expect(bands.summaryBottom.rows).toEqual([summary]);
      expect(bands.summaryBottom.y).toBe(260 - summary.height);
      expect(bands.pinnedBottom.y).toBe(260 - summary.height - theme.row.height);
      expect(layoutManager.getBodyViewportHeight()).toBe(
        260 - theme.row.headerHeight - summary.height - theme.row.height,
      );
    });

    it('hit tests summary bands separately from body rows', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      const summary = createSummaryRow('total', 40);

      layoutManager.setViewportSize(800, 240);
      layoutManager.setSummaryRows([summary], []);
      layoutManager.calculateLayout(columns, rows);

      const result = layoutManager.hitTest(40, theme.row.headerHeight + 10);

      expect(result.region).toBe('cell');
      expect(result.rowHit?.band).toBe('summary-top');
      expect(result.rowHit?.row).toBe(summary);
    });
  });
});
