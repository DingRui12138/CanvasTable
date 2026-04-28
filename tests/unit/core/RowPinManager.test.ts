import { RowPinManager } from '@/core/RowPinManager';
import type { Row } from '@/types';

describe('RowPinManager', () => {
  const rowA: Row = { id: 'a', data: { name: 'A' } };
  const rowB: Row = { id: 'b', data: { name: 'B' } };

  it('pins rows by row object identity', () => {
    const manager = new RowPinManager();

    manager.pin(rowA, 'top');

    expect(manager.isPinnedTop(rowA)).toBe(true);
    expect(manager.getPosition(rowA)).toBe('top');
    expect(manager.getTopRows()).toEqual([rowA]);
  });

  it('moves a row between top and bottom', () => {
    const manager = new RowPinManager();

    manager.pin(rowA, 'top');
    manager.pin(rowA, 'bottom');

    expect(manager.isPinnedTop(rowA)).toBe(false);
    expect(manager.isPinnedBottom(rowA)).toBe(true);
    expect(manager.getTopRows()).toEqual([]);
    expect(manager.getBottomRows()).toEqual([rowA]);
  });

  it('keeps insertion order and ignores duplicate pin requests', () => {
    const manager = new RowPinManager();

    manager.pin(rowA, 'top');
    manager.pin(rowB, 'top');
    manager.pin(rowA, 'top');

    expect(manager.getTopRows()).toEqual([rowA, rowB]);
  });

  it('removes deleted rows from both pinned sets', () => {
    const manager = new RowPinManager();

    manager.pin(rowA, 'top');
    manager.remove(rowA);

    expect(manager.getPosition(rowA)).toBeNull();
    expect(manager.getTopRows()).toEqual([]);
  });
});
