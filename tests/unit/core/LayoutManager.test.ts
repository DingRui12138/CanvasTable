import { LayoutManager } from '@/core/LayoutManager';
import { createMockTheme, createTestColumns, createTestRows } from '../helpers/mockFactories';

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
});