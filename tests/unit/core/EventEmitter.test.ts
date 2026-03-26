import { EventEmitter } from '@/core/EventEmitter';
import type { TableEventHandlers, CellPosition } from '@/types';

describe('EventEmitter', () => {
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
  });

  describe('on', () => {
    it('should register event listener', () => {
      const callback = jest.fn();
      eventEmitter.on('onCellClick', callback);

      // Trigger event
      eventEmitter.emit('onCellClick', { rowIndex: 0, columnIndex: 0 } as CellPosition, {} as MouseEvent);

      expect(callback).toHaveBeenCalled();
    });

    it('should support multiple listeners for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventEmitter.on('onCellClick', callback1);
      eventEmitter.on('onCellClick', callback2);

      eventEmitter.emit('onCellClick', { rowIndex: 0, columnIndex: 0 } as CellPosition, {} as MouseEvent);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove event listener', () => {
      const callback = jest.fn();
      eventEmitter.on('onCellClick', callback);
      eventEmitter.off('onCellClick', callback);

      eventEmitter.emit('onCellClick', { rowIndex: 0, columnIndex: 0 } as CellPosition, {} as MouseEvent);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not affect other listeners when removing', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      eventEmitter.on('onCellClick', callback1);
      eventEmitter.on('onCellClick', callback2);
      eventEmitter.off('onCellClick', callback1);

      eventEmitter.emit('onCellClick', { rowIndex: 0, columnIndex: 0 } as CellPosition, {} as MouseEvent);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should pass arguments to listeners', () => {
      const callback = jest.fn();
      eventEmitter.on('onSort', callback);

      const sortConfig = [{ column: 'name', direction: 'asc' as const }];
      eventEmitter.emit('onSort', sortConfig);

      expect(callback).toHaveBeenCalledWith(sortConfig);
    });

    it('should handle events with multiple arguments', () => {
      const callback = jest.fn();
      eventEmitter.on('onEditEnd', callback);

      const cell = { rowIndex: 0, columnIndex: 1 };
      const value = 'updated value';

      eventEmitter.emit('onEditEnd', cell, value);

      expect(callback).toHaveBeenCalledWith(cell, value);
    });
  });
});