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
    await dataManager.loadData({ columns, rows });
  });

  describe('loadData', () => {
    it('should load data correctly', async () => {
      expect(dataManager.getRows().length).toBe(5);
      expect(dataManager.getColumns().length).toBe(4);
    });

    it('should process rows and add ids', async () => {
      const simpleRows: Row[] = [
        { id: 'test-1', data: { id: 1, name: 'Test' } },
      ];
      await dataManager.loadData({ columns, rows: simpleRows });

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

  describe('sorting', () => {
    beforeEach(async () => {
      const unsortedRows: Row[] = [
        { id: 'row-1', data: { id: 3, name: 'Charlie', active: true, progress: 60 } },
        { id: 'row-2', data: { id: 1, name: 'Alice', active: false, progress: 30 } },
        { id: 'row-3', data: { id: 2, name: 'Bob', active: true, progress: 90 } },
      ];
      await dataManager.loadData({ columns, rows: unsortedRows });
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
      await dataManager.loadData({ columns, rows: filterRows });
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