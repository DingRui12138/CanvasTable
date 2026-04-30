import { DataManager } from '@/core/DataManager';
import { createTestColumns, createTestRows } from '../helpers/mockFactories';
import type { Row, Column, SortConfig, FilterConfig } from '@/types';

describe('DataManager', () => {
  let dataManager: DataManager;
  let columns: Column[];
  let rows: Row[];

  beforeEach(async () => {
    columns = createTestColumns();
    rows = createTestRows(5);
    dataManager = new DataManager();
    dataManager.setColumns(columns);
    await dataManager.loadRows(rows);
  });

  describe('loadRows', () => {
    it('should load rows correctly', async () => {
      expect(dataManager.getRows().length).toBe(5);
    });

    it('should process rows and add ids', async () => {
      const simpleRows: Row[] = [
        { id: 'test-1', data: { id: 1, name: 'Test' } },
      ];
      await dataManager.loadRows(simpleRows);

      const loadedRows = dataManager.getRows();
      expect(loadedRows[0]!.id).toBeDefined();
    });
  });

  describe('getColumns', () => {
    it('should return columns', () => {
      const cols = dataManager.getColumns();
      expect(cols.length).toBe(4);
      expect(cols[0]!.key).toBe('id');
    });
  });

  describe('setColumns', () => {
    it('should update columns', () => {
      const newColumns: Column[] = [
        { key: 'newId', title: 'New ID', width: 100 },
      ];
      dataManager.setColumns(newColumns);

      expect(dataManager.getColumns().length).toBe(1);
      expect(dataManager.getColumns()[0]!.key).toBe('newId');
    });
  });

  describe('getRows', () => {
    it('should return rows', () => {
      const r = dataManager.getRows();
      expect(r.length).toBe(5);
    });
  });

  describe('updateCell', () => {
    it('should update cell value', () => {
      dataManager.updateCell(0, 'name', 'Updated Name');

      const rows = dataManager.getRows();
      expect(rows[0]!.data.name).toBe('Updated Name');
    });
  });

  describe('updateRow', () => {
    it('should update row data', () => {
      dataManager.updateRow(0, { name: 'New Name', active: false });

      const rows = dataManager.getRows();
      expect(rows[0]!.data.name).toBe('New Name');
      expect(rows[0]!.data.active).toBe(false);
    });
  });

  describe('addRow', () => {
    it('should add row at the end by default', () => {
      dataManager.addRow({ id: 999, name: 'New User' });

      const rows = dataManager.getRows();
      expect(rows.length).toBe(6);
      expect(rows[5]!.data.id).toBe(999);
    });

    it('should add row at specific index', () => {
      dataManager.addRow({ id: 999, name: 'Inserted User' }, 2);

      const rows = dataManager.getRows();
      expect(rows.length).toBe(6);
      expect(rows[2]!.data.id).toBe(999);
    });
  });

  describe('row reference operations', () => {
    it('adds above a row by row reference after earlier insertions shift indexes', async () => {
      const manyRows = createTestRows(100);
      await dataManager.loadRows(manyRows);
      const row50 = dataManager.getRows()[49]!;
      const row30 = dataManager.getRows()[29]!;

      dataManager.addRowRelativeTo(row30, { name: 'new' }, 'above');

      expect(dataManager.getRows()[50]).toBe(row50);
    });

    it('deletes a row by row reference', () => {
      const row = dataManager.getRows()[2]!;

      dataManager.deleteRowByRef(row);

      expect(dataManager.getRows()).not.toContain(row);
    });
  });

  describe('deleteRow', () => {
    it('should delete row by index', () => {
      const rowsBefore = dataManager.getRows();
      const idToDelete = rowsBefore[1]!.id;
      dataManager.deleteRow(1);

      const rows = dataManager.getRows();
      expect(rows.length).toBe(4);
      expect(rows.find(r => r.id === idToDelete)).toBeUndefined();
    });
  });

  describe('exportData', () => {
    it('excludes hidden columns unless includeHidden is true', async () => {
      dataManager.setColumns([
        { key: 'id', title: 'ID' },
        { key: 'secret', title: 'Secret', hidden: true },
      ]);
      await dataManager.loadRows([
        { id: 'row-1', data: { id: 1, secret: 'hidden-value' } },
      ]);

      expect(dataManager.exportData({ includeHeaders: true })).toEqual([
        ['ID'],
        ['1'],
      ]);
      expect(dataManager.exportData({ includeHeaders: true, includeHidden: true })).toEqual([
        ['ID', 'Secret'],
        ['1', 'hidden-value'],
      ]);
    });

    it('builds export context with visible leaf columns and typed raw values', async () => {
      dataManager.setColumns([
        {
          key: 'group',
          title: 'Group',
          children: [
            { key: 'amount', title: 'Amount', type: 'number', fixed: 'left' },
            { key: 'createdAt', title: 'Created At', type: 'date' },
          ],
        },
        { key: 'secret', title: 'Secret', hidden: true },
      ]);
      await dataManager.loadRows([
        { id: 'row-1', data: { amount: 12.5, createdAt: '2026-04-29', secret: 'x' } },
      ]);

      const context = dataManager.getExportContext({
        includeHeaders: true,
        includeHidden: false,
        selectedOnly: false,
      });

      expect(context.leafColumns.map((column) => column.key)).toEqual(['amount', 'createdAt']);
      expect(context.rows[0]!.cells.map((cell) => cell.rawValue)).toEqual([12.5, '2026-04-29']);
      expect(context.leftFixedLeafColumnCount).toBe(1);
      expect(context.headerDepth).toBe(2);
    });

    it('filters selected rows in export context', () => {
      const currentRows = dataManager.getRows();
      currentRows[0]!.selected = true;
      currentRows[1]!.selected = false;
      currentRows[2]!.selected = false;
      currentRows[3]!.selected = false;
      currentRows[4]!.selected = false;

      const context = dataManager.getExportContext({ selectedOnly: true });

      expect(context.rows).toHaveLength(1);
      expect(context.rows[0]!.row.id).toBe(currentRows[0]!.id);
    });
  });

  describe('exportData', () => {
    it('shifts body merge columns when row numbers are enabled for export context', async () => {
      dataManager.setColumns([
        { key: 'selected', title: '选择' },
        { key: 'id', title: 'ID' },
        { key: 'name', title: 'Name' },
        { key: 'age', title: 'Age' },
      ]);
      await dataManager.loadRows([
        {
          id: 'row-1',
          data: { selected: true, id: 1, name: 'Alice', age: 20 },
          cellMerges: [{ rowIndex: 0, columnIndex: 2, rowspan: 2, colspan: 1 }],
        },
        {
          id: 'row-2',
          data: { selected: true, id: 2, name: 'Alice', age: 21 },
        },
      ]);

      const context = dataManager.getExportContext({
        showRowNumbers: true,
      });

      expect(context.bodyMerges).toEqual([
        { startRow: 0, startCol: 1, endRow: 1, endCol: 1 },
      ]);
    });
  });

  describe('sorting', () => {
    beforeEach(async () => {
      const unsortedRows: Row[] = [
        { id: 'row-1', data: { id: 3, name: 'Charlie', active: true, progress: 60 } },
        { id: 'row-2', data: { id: 1, name: 'Alice', active: false, progress: 30 } },
        { id: 'row-3', data: { id: 2, name: 'Bob', active: true, progress: 90 } },
      ];
      dataManager.setColumns(columns);
      await dataManager.loadRows(unsortedRows);
    });

    it('should apply sort and get sorted rows', () => {
      const sortConfig: SortConfig[] = [{ column: 'id', direction: 'asc' }];
      dataManager.sort(sortConfig);

      const sortedRows = dataManager.getRows();
      expect(sortedRows[0]!.data.id).toBe(1);
      expect(sortedRows[1]!.data.id).toBe(2);
      expect(sortedRows[2]!.data.id).toBe(3);
    });

    it('should sort descending', () => {
      const sortConfig: SortConfig[] = [{ column: 'id', direction: 'desc' }];
      dataManager.sort(sortConfig);

      const sortedRows = dataManager.getRows();
      expect(sortedRows[0]!.data.id).toBe(3);
      expect(sortedRows[1]!.data.id).toBe(2);
      expect(sortedRows[2]!.data.id).toBe(1);
    });

    it('should get current sort config', () => {
      const sortConfig: SortConfig[] = [{ column: 'id', direction: 'asc' }];
      dataManager.sort(sortConfig);

      const currentSort = dataManager.getSort();
      expect(currentSort).toEqual(sortConfig);
    });

    it('should clear sort', () => {
      dataManager.sort([{ column: 'id', direction: 'asc' }]);
      dataManager.clearSort();

      expect(dataManager.getSort()).toEqual([]);
    });
  });

  describe('filtering', () => {
    beforeEach(async () => {
      const filterRows: Row[] = [
        { id: 'row-1', data: { id: 1, name: 'Alice', active: true, progress: 60 } },
        { id: 'row-2', data: { id: 2, name: 'Bob', active: false, progress: 30 } },
        { id: 'row-3', data: { id: 3, name: 'Charlie', active: true, progress: 90 } },
      ];
      dataManager.setColumns(columns);
      await dataManager.loadRows(filterRows);
    });

    it('should apply filters', () => {
      const filterConfig: FilterConfig[] = [
        { column: 'active', operator: 'equals', value: true }
      ];
      dataManager.filter(filterConfig);

      const filteredRows = dataManager.getRows();
      expect(filteredRows.length).toBe(2);
      expect(filteredRows.every((r: Row) => r.data.active === true)).toBe(true);
    });

    it('should get filters', () => {
      const filterConfig: FilterConfig[] = [
        { column: 'active', operator: 'equals', value: true }
      ];
      dataManager.filter(filterConfig);

      expect(dataManager.getFilters()).toEqual(filterConfig);
    });

    it('should clear filters', () => {
      dataManager.filter([{ column: 'active', operator: 'equals', value: true }]);
      expect(dataManager.getRows().length).toBe(2);

      dataManager.clearFilters();
      expect(dataManager.getRows().length).toBe(3);
    });
  });

  describe('history', () => {
    it('should track history for cell updates', () => {
      dataManager.updateCell(0, 'name', 'Updated');
      expect(dataManager.getHistoryLength()).toBe(1);
    });

    it('should undo last change', () => {
      const originalName = dataManager.getRows()[0]!.data.name;
      dataManager.updateCell(0, 'name', 'Updated');

      dataManager.undo();
      expect(dataManager.getRows()[0]!.data.name).toBe(originalName);
    });

    it('should redo undone change', () => {
      dataManager.updateCell(0, 'name', 'Updated');
      dataManager.undo();
      dataManager.redo();

      expect(dataManager.getRows()[0]!.data.name).toBe('Updated');
    });

    it('should clear history', () => {
      dataManager.updateCell(0, 'name', 'Updated');
      dataManager.clearHistory();

      expect(dataManager.getHistoryLength()).toBe(0);
    });
  });
});
