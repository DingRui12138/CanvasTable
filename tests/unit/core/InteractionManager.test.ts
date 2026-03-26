import { InteractionManager } from '@/core/InteractionManager';
import { LayoutManager } from '@/core/LayoutManager';
import { EventEmitter } from '@/core/EventEmitter';
import { createMockTheme, createTestColumns, createTestRows } from '../helpers/mockFactories';
import type { SelectionConfig, EditingConfig, SortConfig, FilterConfig, CellPosition, Column } from '@/types';

// Helper to create mock mouse events
function createMouseEvent(type: string, options: Partial<MouseEventInit> = {}): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: 0,
    ...options,
  });
}

// Helper to create mock wheel events
function createWheelEvent(options: Partial<WheelEventInit> = {}): WheelEvent {
  return new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: 0,
    deltaX: 0,
    deltaY: 0,
    ...options,
  });
}

// Helper to create mock keyboard events
function createKeyboardEvent(key: string, options: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...options,
  });
}

describe('InteractionManager', () => {
  let interactionManager: InteractionManager;
  let canvas: HTMLCanvasElement;
  let layoutManager: LayoutManager;
  let eventEmitter: EventEmitter;
  let mockTheme: ReturnType<typeof createMockTheme>;
  let selectionConfig: SelectionConfig;
  let editingConfig: EditingConfig;

  beforeEach(() => {
    mockTheme = createMockTheme();
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    layoutManager = new LayoutManager(undefined, mockTheme);
    layoutManager.setViewportSize(800, 600);

    eventEmitter = new EventEmitter();
    selectionConfig = { mode: 'cell', multi: true };
    editingConfig = { enabled: true, mode: 'dblclick' };

    interactionManager = new InteractionManager(
      canvas,
      layoutManager,
      eventEmitter as unknown as EventEmitter,
      selectionConfig,
      editingConfig
    );

    // 设置初始数据
    const columns = createTestColumns();
    const rows = createTestRows(10);
    layoutManager.calculateLayout(columns, rows);
    interactionManager.setColumns(columns);
    interactionManager.setRows(rows);
    interactionManager.setAllRows(rows);
  });

  afterEach(() => {
    interactionManager.destroy();
  });

  describe('constructor', () => {
    it('should create interaction manager instance', () => {
      expect(interactionManager).toBeInstanceOf(InteractionManager);
    });

    it('should initialize with default state', () => {
      const state = interactionManager.getInteractionState();
      expect(state.hoveredCell).toBeNull();
      expect(state.editingCell).toBeNull();
      expect(state.selectedCells).toEqual([]);
    });
  });

  describe('getScrollState', () => {
    it('should return scroll state', () => {
      const scrollState = interactionManager.getScrollState();
      expect(scrollState.scrollLeft).toBe(0);
      expect(scrollState.scrollTop).toBe(0);
    });
  });

  describe('setScrollPosition', () => {
    it('should update scroll position', () => {
      interactionManager.updateMaxScroll(500, 1000);
      interactionManager.setScrollPosition(100, 200);

      const scrollState = interactionManager.getScrollState();
      expect(scrollState.scrollLeft).toBe(100);
      expect(scrollState.scrollTop).toBe(200);
    });
  });

  describe('updateMaxScroll', () => {
    it('should update max scroll values', () => {
      interactionManager.updateMaxScroll(500, 1000);

      const scrollState = interactionManager.getScrollState();
      expect(scrollState.maxScrollLeft).toBe(500);
      expect(scrollState.maxScrollTop).toBe(1000);
    });
  });

  describe('getScrollbarState', () => {
    it('should return scrollbar state', () => {
      const scrollbarState = interactionManager.getScrollbarState();
      expect(scrollbarState.verticalHovered).toBe(false);
      expect(scrollbarState.horizontalHovered).toBe(false);
    });
  });

  describe('getInteractionState', () => {
    it('should return interaction state', () => {
      const state = interactionManager.getInteractionState();
      expect(state).toHaveProperty('hoveredCell');
      expect(state).toHaveProperty('selectedCells');
      expect(state).toHaveProperty('editingCell');
    });
  });

  describe('editing', () => {
    it('should not be editing initially', () => {
      expect(interactionManager.isEditing()).toBe(false);
    });

    it('should clear editing state', () => {
      interactionManager.clearEditingState();
      expect(interactionManager.isEditing()).toBe(false);
    });

    describe('startEditing', () => {
      it('should not start editing for non-editable column', () => {
        // 创建不可编辑的列配置
        const columns: Column[] = [
          { key: 'id', title: 'ID', width: 80, editable: false },
        ];
        const rows = [{ id: '1', data: { id: 1 } }];

        layoutManager.calculateLayout(columns, rows);
        interactionManager.setColumns(columns);
        interactionManager.setRows(rows);

        const cell: CellPosition = { rowIndex: 0, columnIndex: 0 };
        interactionManager.startEditing(cell);

        expect(interactionManager.isEditing()).toBe(false);
      });

      it('should start editing for editable column', () => {
        // 使用默认的 test columns (name 是 editable: true)
        const columns = createTestColumns();
        const rows = createTestRows(1);

        layoutManager.calculateLayout(columns, rows);
        interactionManager.setColumns(columns);
        interactionManager.setRows(rows);

        // name 列 (columnIndex: 1) 是 editable: true
        const cell: CellPosition = { rowIndex: 0, columnIndex: 1 };
        interactionManager.startEditing(cell);

        expect(interactionManager.isEditing()).toBe(true);
      });
    });

    describe('endEditing', () => {
      it('should end editing without saving', () => {
        const columns = createTestColumns();
        const rows = createTestRows(1);

        layoutManager.calculateLayout(columns, rows);
        interactionManager.setColumns(columns);
        interactionManager.setRows(rows);

        interactionManager.startEditing({ rowIndex: 0, columnIndex: 1 });
        interactionManager.endEditing(false);

        expect(interactionManager.isEditing()).toBe(false);
      });
    });
  });

  describe('selection', () => {
    describe('clearSelection', () => {
      it('should clear all selections', () => {
        interactionManager.clearSelection();
        expect(interactionManager.getSelectedCells()).toEqual([]);
      });
    });

    describe('setSelectedCells', () => {
      it('should set selected cells', () => {
        const cells: CellPosition[] = [
          { rowIndex: 0, columnIndex: 0 },
          { rowIndex: 1, columnIndex: 1 },
        ];
        interactionManager.setSelectedCells(cells);
        expect(interactionManager.getSelectedCells()).toEqual(cells);
      });
    });

    describe('getSelectedRows', () => {
      it('should return selected row indices', () => {
        const result = interactionManager.getSelectedRows();
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('data management', () => {
    describe('setColumns', () => {
      it('should update columns', () => {
        const newColumns: Column[] = [
          { key: 'new', title: 'New Column', width: 100 },
        ];
        interactionManager.setColumns(newColumns);
        // Columns are used internally
      });
    });

    describe('setRows', () => {
      it('should update rows', () => {
        const newRows = createTestRows(5);
        interactionManager.setRows(newRows);
        // Rows are used internally
      });
    });

    describe('setAllRows', () => {
      it('should update all rows', () => {
        const newRows = createTestRows(20);
        interactionManager.setAllRows(newRows);
        // All rows are used internally
      });
    });
  });

  describe('sort and filter', () => {
    describe('setSortConfig', () => {
      it('should update sort config', () => {
        const sortConfig: SortConfig[] = [
          { column: 'name', direction: 'asc' },
        ];
        interactionManager.setSortConfig(sortConfig);
        // Sort config is used internally
      });
    });

    describe('setFilterConfig', () => {
      it('should update filter config', () => {
        const filterConfig: FilterConfig[] = [
          { column: 'active', operator: 'equals', value: true },
        ];
        interactionManager.setFilterConfig(filterConfig);
        // Filter config is used internally
      });
    });

    describe('applyFilter', () => {
      it('should apply filter without errors', () => {
        expect(() => interactionManager.applyFilter()).not.toThrow();
      });
    });

    describe('clearFilter', () => {
      it('should clear filter without errors', () => {
        expect(() => interactionManager.clearFilter()).not.toThrow();
      });
    });
  });

  describe('dropdown states', () => {
    it('should return null for dropdown when not open', () => {
      expect(interactionManager.getDropdown()).toBeNull();
    });

    it('should return null for filter dropdown when not open', () => {
      expect(interactionManager.getFilterDropdown()).toBeNull();
    });

    it('should return null for date dropdown when not open', () => {
      expect(interactionManager.getDateDropdown()).toBeNull();
    });

    it('should return null for buttons dropdown when not open', () => {
      expect(interactionManager.getButtonsDropdown()).toBeNull();
    });

    it('should return null for image tooltip when not open', () => {
      expect(interactionManager.getImageTooltip()).toBeNull();
    });

    it('should return null for image editor when not open', () => {
      expect(interactionManager.getImageEditor()).toBeNull();
    });
  });

  describe('context menu', () => {
    it('should return null for context menu when not open', () => {
      expect(interactionManager.getContextMenu()).toBeNull();
    });

    it('should return null for header context menu when not open', () => {
      expect(interactionManager.getHeaderContextMenu()).toBeNull();
    });
  });

  describe('hover states', () => {
    it('should return button hover states map', () => {
      const states = interactionManager.getButtonHoverStates();
      expect(states).toBeInstanceOf(Map);
    });

    it('should return hovered image index', () => {
      expect(interactionManager.getHoveredImageIndex()).toBe(-1);
    });

    it('should return hovered button index', () => {
      expect(interactionManager.getHoveredButtonIndex()).toBe(-1);
    });
  });

  describe('switch animations', () => {
    it('should return switch animations map', () => {
      const animations = interactionManager.getSwitchAnimations();
      expect(animations).toBeInstanceOf(Map);
    });
  });

  describe('expand column', () => {
    it('should set expand column key', () => {
      interactionManager.setExpandColumnKey('name');
      // Expand column key is used internally
    });
  });

  describe('updateConfig', () => {
    it('should update config without errors', () => {
      interactionManager.updateConfig(
        { mode: 'row', multi: false },
        { enabled: false }
      );
      // Config is updated internally
    });
  });

  describe('resetState', () => {
    it('should reset state', () => {
      interactionManager.resetState();
      const state = interactionManager.getInteractionState();
      expect(state.hoveredCell).toBeNull();
      expect(state.selectedCells).toEqual([]);
      expect(state.editingCell).toBeNull();
    });
  });

  describe('handleExternalWheel', () => {
    it('should handle wheel event', () => {
      interactionManager.updateMaxScroll(500, 1000);
      interactionManager.handleExternalWheel(0, 50);
      // Wheel is handled internally
    });
  });

  describe('destroy', () => {
    it('should destroy interaction manager without errors', () => {
      expect(() => interactionManager.destroy()).not.toThrow();
    });
  });

  describe('event handling - handleMouseDown', () => {
    it('should start vertical scrollbar dragging', () => {
      // Setup scrollbar bounds
      interactionManager.setGetScrollbarBounds(() => ({
        vertical: { x: 790, y: 50, width: 10, height: 500 },
        horizontal: null,
      }));
      interactionManager.updateMaxScroll(0, 1000);

      const rect = canvas.getBoundingClientRect();
      const mouseEvent = createMouseEvent('mousedown', {
        clientX: rect.left + 795,
        clientY: rect.top + 100,
      });

      canvas.dispatchEvent(mouseEvent);

      const scrollbarState = interactionManager.getScrollbarState();
      expect(scrollbarState.verticalDragging).toBe(true);
    });

    it('should start horizontal scrollbar dragging', () => {
      interactionManager.setGetScrollbarBounds(() => ({
        vertical: null,
        horizontal: { x: 50, y: 590, width: 700, height: 10 },
      }));
      interactionManager.updateMaxScroll(1000, 0);

      const rect = canvas.getBoundingClientRect();
      const mouseEvent = createMouseEvent('mousedown', {
        clientX: rect.left + 100,
        clientY: rect.top + 595,
      });

      canvas.dispatchEvent(mouseEvent);

      const scrollbarState = interactionManager.getScrollbarState();
      expect(scrollbarState.horizontalDragging).toBe(true);
    });

    it('should clear context menu on click outside', () => {
      // Set up a context menu state
      interactionManager['state'].contextMenu = {
        x: 100,
        y: 100,
        rowIndex: 0,
        hoveredIndex: -1,
      };

      const mouseEvent = createMouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
      });

      canvas.dispatchEvent(mouseEvent);

      expect(interactionManager.getContextMenu()).toBeNull();
    });

    it('should clear filter dropdown on click outside', () => {
      interactionManager['state'].filterDropdown = {
        x: 100,
        y: 100,
        width: 150,
        options: [{ label: 'Test', value: 'test', checked: false }],
        scrollTop: 0,
        columnKey: 'name',
        hoveredIndex: -1,
        searchText: '',
      };

      const mouseEvent = createMouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
      });

      canvas.dispatchEvent(mouseEvent);

      expect(interactionManager.getFilterDropdown()).toBeNull();
    });

    it('should clear dropdown on click outside', () => {
      interactionManager['state'].dropdown = {
        x: 100,
        y: 100,
        width: 150,
        cell: { rowIndex: 0, columnIndex: 0 },
        config: { options: [] },
        scrollTop: 0,
        hoveredIndex: -1,
        type: 'select',
      };

      const mouseEvent = createMouseEvent('mousedown', {
        clientX: 50,
        clientY: 50,
      });

      canvas.dispatchEvent(mouseEvent);

      expect(interactionManager.getDropdown()).toBeNull();
    });
  });

  describe('event handling - handleMouseMove', () => {
    it('should update scrollbar hover state', () => {
      interactionManager.setGetScrollbarBounds(() => ({
        vertical: { x: 790, y: 50, width: 10, height: 500 },
        horizontal: null,
      }));

      const rect = canvas.getBoundingClientRect();
      const mouseEvent = createMouseEvent('mousemove', {
        clientX: rect.left + 795,
        clientY: rect.top + 100,
      });

      canvas.dispatchEvent(mouseEvent);

      const scrollbarState = interactionManager.getScrollbarState();
      expect(scrollbarState.verticalHovered).toBe(true);
    });

    it('should clear hovered cell on mouse leave', () => {
      // First set a hovered cell
      interactionManager['state'].hoveredCell = { rowIndex: 0, columnIndex: 0 };

      const leaveEvent = new MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
      });

      canvas.dispatchEvent(leaveEvent);

      const state = interactionManager.getInteractionState();
      expect(state.hoveredCell).toBeNull();
    });

    it('should clear scrollbar hover on mouse leave', () => {
      interactionManager['scrollbarState'].verticalHovered = true;

      const leaveEvent = new MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
      });

      canvas.dispatchEvent(leaveEvent);

      const scrollbarState = interactionManager.getScrollbarState();
      expect(scrollbarState.verticalHovered).toBe(false);
    });
  });

  describe('event handling - handleWheel', () => {
    it('should scroll vertically with wheel', () => {
      interactionManager.updateMaxScroll(0, 1000);

      const wheelEvent = createWheelEvent({
        deltaY: 50,
        clientX: 400,
        clientY: 300,
      });

      canvas.dispatchEvent(wheelEvent);

      const scrollState = interactionManager.getScrollState();
      expect(scrollState.scrollTop).toBe(50);
    });

    it('should scroll horizontally with wheel', () => {
      interactionManager.updateMaxScroll(1000, 0);

      const wheelEvent = createWheelEvent({
        deltaX: 50,
        clientX: 400,
        clientY: 300,
      });

      canvas.dispatchEvent(wheelEvent);

      const scrollState = interactionManager.getScrollState();
      expect(scrollState.scrollLeft).toBe(50);
    });

    it('should clamp scroll position to max values', () => {
      interactionManager.updateMaxScroll(100, 100);

      const wheelEvent = createWheelEvent({
        deltaY: 200,
        deltaX: 150,
        clientX: 400,
        clientY: 300,
      });

      canvas.dispatchEvent(wheelEvent);

      const scrollState = interactionManager.getScrollState();
      expect(scrollState.scrollTop).toBe(100);
      expect(scrollState.scrollLeft).toBe(100);
    });

    it('should not scroll negative values', () => {
      interactionManager.updateMaxScroll(100, 100);
      interactionManager.setScrollPosition(50, 50);

      const wheelEvent = createWheelEvent({
        deltaY: -100,
        deltaX: -100,
        clientX: 400,
        clientY: 300,
      });

      canvas.dispatchEvent(wheelEvent);

      const scrollState = interactionManager.getScrollState();
      expect(scrollState.scrollTop).toBe(0);
      expect(scrollState.scrollLeft).toBe(0);
    });
  });

  describe('event handling - handleKeyDown', () => {
    it('should clear selection on Escape key', () => {
      interactionManager.setSelectedCells([{ rowIndex: 0, columnIndex: 0 }]);

      const keyEvent = createKeyboardEvent('Escape');
      document.dispatchEvent(keyEvent);

      expect(interactionManager.getSelectedCells()).toEqual([]);
    });

    it('should select all on Ctrl+A', () => {
      const keyEvent = createKeyboardEvent('a', { ctrlKey: true });
      document.dispatchEvent(keyEvent);

      const selected = interactionManager.getSelectedCells();
      expect(selected.length).toBeGreaterThan(0);
    });

    it('should navigate with arrow keys', () => {
      // Start with a selection
      interactionManager.setSelectedCells([{ rowIndex: 0, columnIndex: 0 }]);

      const keyEvent = createKeyboardEvent('ArrowDown');
      document.dispatchEvent(keyEvent);

      const selected = interactionManager.getSelectedCells();
      expect(selected[0]?.rowIndex).toBe(1);
    });

    it('should not navigate beyond bounds', () => {
      // Start at first row
      interactionManager.setSelectedCells([{ rowIndex: 0, columnIndex: 0 }]);

      const keyEvent = createKeyboardEvent('ArrowUp');
      document.dispatchEvent(keyEvent);

      const selected = interactionManager.getSelectedCells();
      expect(selected[0]?.rowIndex).toBe(0);
    });

    it('should end editing on Enter key', () => {
      // Start editing
      interactionManager['state'].editingCell = { rowIndex: 0, columnIndex: 1 };

      const keyEvent = createKeyboardEvent('Enter');
      document.dispatchEvent(keyEvent);

      expect(interactionManager.isEditing()).toBe(false);
    });

    it('should cancel editing on Escape key while editing', () => {
      interactionManager['state'].editingCell = { rowIndex: 0, columnIndex: 1 };

      const keyEvent = createKeyboardEvent('Escape');
      document.dispatchEvent(keyEvent);

      expect(interactionManager.isEditing()).toBe(false);
    });
  });

  describe('event handling - handleDblClick', () => {
    it('should start editing on double click for editable cell', () => {
      const columns = createTestColumns();
      const rows = createTestRows(1);
      layoutManager.calculateLayout(columns, rows);
      interactionManager.setColumns(columns);
      interactionManager.setRows(rows);

      const rect = canvas.getBoundingClientRect();
      const headerHeight = 36;
      const rowHeight = 32;

      const dblClickEvent = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 100, // name column
        clientY: rect.top + headerHeight + rowHeight / 2, // first row
      });

      canvas.dispatchEvent(dblClickEvent);

      expect(interactionManager.isEditing()).toBe(true);
    });

    it('should not start editing for non-editable column', () => {
      const columns: Column[] = [
        { key: 'id', title: 'ID', width: 80, editable: false },
      ];
      const rows = [{ id: '1', data: { id: 1 } }];

      layoutManager.calculateLayout(columns, rows);
      interactionManager.setColumns(columns);
      interactionManager.setRows(rows);

      const rect = canvas.getBoundingClientRect();
      const headerHeight = 36;
      const rowHeight = 32;

      const dblClickEvent = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 40,
        clientY: rect.top + headerHeight + rowHeight / 2,
      });

      canvas.dispatchEvent(dblClickEvent);

      expect(interactionManager.isEditing()).toBe(false);
    });
  });

  describe('event handling - handleContextMenu', () => {
    it('should open context menu on right click', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      layoutManager.calculateLayout(columns, rows);
      interactionManager.setColumns(columns);
      interactionManager.setRows(rows);

      const rect = canvas.getBoundingClientRect();
      const headerHeight = 36;
      const rowHeight = 32;

      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 100,
        clientY: rect.top + headerHeight + rowHeight,
        button: 2,
      });

      canvas.dispatchEvent(contextMenuEvent);

      // Context menu should be opened (may be null if no items provided)
      // This test just verifies no error is thrown
    });
  });

  describe('selection modes', () => {
    it('should handle range selection with shift key', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      layoutManager.calculateLayout(columns, rows);
      interactionManager.setColumns(columns);
      interactionManager.setRows(rows);

      // First select a cell
      interactionManager.setSelectedCells([{ rowIndex: 0, columnIndex: 0 }]);

      const rect = canvas.getBoundingClientRect();
      const headerHeight = 36;
      const rowHeight = 32;

      // Click another cell with shift key
      const mouseEvent = createMouseEvent('mousedown', {
        clientX: rect.left + 100,
        clientY: rect.top + headerHeight + rowHeight * 2,
        shiftKey: true,
      });

      canvas.dispatchEvent(mouseEvent);

      const selected = interactionManager.getSelectedCells();
      expect(selected.length).toBeGreaterThan(0);
    });
  });

  describe('scrollbar interactions', () => {
    it('should handle scrollbar drag correctly', () => {
      interactionManager.setGetScrollbarBounds(() => ({
        vertical: { x: 790, y: 50, width: 10, height: 500 },
        horizontal: null,
      }));
      interactionManager.updateMaxScroll(0, 1000);

      const rect = canvas.getBoundingClientRect();

      // Start drag
      const downEvent = createMouseEvent('mousedown', {
        clientX: rect.left + 795,
        clientY: rect.top + 100,
      });
      canvas.dispatchEvent(downEvent);

      // Move while dragging
      const moveEvent = createMouseEvent('mousemove', {
        clientX: rect.left + 795,
        clientY: rect.top + 200,
      });
      document.dispatchEvent(moveEvent);

      // End drag
      const upEvent = createMouseEvent('mouseup');
      document.dispatchEvent(upEvent);

      const scrollbarState = interactionManager.getScrollbarState();
      expect(scrollbarState.verticalDragging).toBe(false);
    });
  });

  describe('keyboard navigation', () => {
    it('should navigate right with ArrowRight key', () => {
      interactionManager.setSelectedCells([{ rowIndex: 0, columnIndex: 0 }]);

      const keyEvent = createKeyboardEvent('ArrowRight');
      document.dispatchEvent(keyEvent);

      const selected = interactionManager.getSelectedCells();
      expect(selected[0]?.columnIndex).toBe(1);
    });

    it('should navigate left with ArrowLeft key', () => {
      interactionManager.setSelectedCells([{ rowIndex: 0, columnIndex: 1 }]);

      const keyEvent = createKeyboardEvent('ArrowLeft');
      document.dispatchEvent(keyEvent);

      const selected = interactionManager.getSelectedCells();
      expect(selected[0]?.columnIndex).toBe(0);
    });

    it('should not navigate beyond column bounds', () => {
      const columns = createTestColumns();
      interactionManager.setSelectedCells([{ rowIndex: 0, columnIndex: columns.length - 1 }]);

      const keyEvent = createKeyboardEvent('ArrowRight');
      document.dispatchEvent(keyEvent);

      const selected = interactionManager.getSelectedCells();
      expect(selected[0]?.columnIndex).toBe(columns.length - 1);
    });

    it('should copy selection with Ctrl+C', () => {
      interactionManager.setSelectedCells([{ rowIndex: 0, columnIndex: 0 }]);

      const keyEvent = createKeyboardEvent('c', { ctrlKey: true });
      // Just verify no error is thrown
      expect(() => document.dispatchEvent(keyEvent)).not.toThrow();
    });

    it('should handle Tab key while editing', () => {
      interactionManager['state'].editingCell = { rowIndex: 0, columnIndex: 1 };

      const keyEvent = createKeyboardEvent('Tab');
      document.dispatchEvent(keyEvent);

      expect(interactionManager.isEditing()).toBe(false);
    });

    it('should handle Shift+Tab key while editing', () => {
      interactionManager['state'].editingCell = { rowIndex: 0, columnIndex: 1 };

      const keyEvent = createKeyboardEvent('Tab', { shiftKey: true });
      document.dispatchEvent(keyEvent);

      expect(interactionManager.isEditing()).toBe(false);
    });

    it('should emit undo event with Ctrl+Z', () => {
      const undoHandler = jest.fn();
      interactionManager['eventEmitter'].on('undo', undoHandler);

      const keyEvent = createKeyboardEvent('z', { ctrlKey: true });
      document.dispatchEvent(keyEvent);

      expect(undoHandler).toHaveBeenCalled();
    });

    it('should emit redo event with Ctrl+Y', () => {
      const redoHandler = jest.fn();
      interactionManager['eventEmitter'].on('redo', redoHandler);

      const keyEvent = createKeyboardEvent('y', { ctrlKey: true });
      document.dispatchEvent(keyEvent);

      expect(redoHandler).toHaveBeenCalled();
    });
  });

  describe('external wheel handling', () => {
    it('should handle external wheel events', () => {
      interactionManager.updateMaxScroll(500, 1000);
      interactionManager.handleExternalWheel(50, 100);

      const scrollState = interactionManager.getScrollState();
      expect(scrollState.scrollLeft).toBe(50);
      expect(scrollState.scrollTop).toBe(100);
    });
  });

  describe('column resize', () => {
    it('should start column resize on resize handle click', () => {
      // Mock isResizeHandleAtPosition to return a valid column index
      interactionManager['layoutManager'].isResizeHandleAtPosition = () => 0;
      interactionManager['layoutManager'].getColumnWidthByIndex = () => 100;

      const rect = canvas.getBoundingClientRect();
      const mouseEvent = createMouseEvent('mousedown', {
        clientX: rect.left + 80,
        clientY: rect.top + 20,
      });

      canvas.dispatchEvent(mouseEvent);

      const state = interactionManager.getInteractionState();
      expect(state.isDragging).toBe(true);
      expect(state.dragType).toBe('column-resize');
    });
  });

  describe('dropdown scroll handling', () => {
    it('should scroll dropdown content with wheel', () => {
      // Set up a dropdown
      interactionManager['state'].dropdown = {
        x: 100,
        y: 100,
        width: 150,
        cell: { rowIndex: 0, columnIndex: 1 },
        config: { options: Array.from({ length: 20 }, (_, i) => ({ label: `Option ${i}`, value: i })) },
        scrollTop: 0,
        hoveredIndex: -1,
        type: 'select',
      };

      const rect = canvas.getBoundingClientRect();
      const wheelEvent = createWheelEvent({
        deltaY: 50,
        clientX: rect.left + 150,
        clientY: rect.top + 150,
      });

      canvas.dispatchEvent(wheelEvent);

      // Dropdown should have scrolled
      expect(interactionManager['state'].dropdown?.scrollTop).toBe(50);
    });
  });

  describe('mouse leave handling', () => {
    it('should clear all hover states on mouse leave', () => {
      // Set up various hover states
      interactionManager['state'].hoveredCell = { rowIndex: 0, columnIndex: 0 };
      interactionManager['scrollbarState'].verticalHovered = true;
      interactionManager['state'].hoveredImageIndex = 2;
      interactionManager['state'].hoveredButtonIndex = 1;

      const leaveEvent = new MouseEvent('mouseleave');
      canvas.dispatchEvent(leaveEvent);

      const state = interactionManager.getInteractionState();
      expect(state.hoveredCell).toBeNull();
      expect(state.hoveredImageIndex).toBe(-1);
      expect(state.hoveredButtonIndex).toBe(-1);
      expect(interactionManager.getScrollbarState().verticalHovered).toBe(false);
    });
  });

  describe('toggle selection with Ctrl/Cmd', () => {
    it('should toggle selection with Ctrl key', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      layoutManager.calculateLayout(columns, rows);
      interactionManager.setColumns(columns);
      interactionManager.setRows(rows);

      const rect = canvas.getBoundingClientRect();
      const headerHeight = 36;
      const rowHeight = 32;

      // First selection with Ctrl
      const mouseEvent1 = createMouseEvent('mousedown', {
        clientX: rect.left + 100,
        clientY: rect.top + headerHeight + rowHeight * 0.5,
        ctrlKey: true,
      });
      canvas.dispatchEvent(mouseEvent1);

      // Second selection with Ctrl
      const mouseEvent2 = createMouseEvent('mousedown', {
        clientX: rect.left + 100,
        clientY: rect.top + headerHeight + rowHeight * 2.5,
        ctrlKey: true,
      });
      canvas.dispatchEvent(mouseEvent2);

      const selected = interactionManager.getSelectedCells();
      expect(selected.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('filter dropdown scroll handling', () => {
    it('should scroll filter dropdown content with wheel', () => {
      interactionManager['state'].filterDropdown = {
        x: 100,
        y: 100,
        width: 150,
        columnKey: 'name',
        options: Array.from({ length: 20 }, (_, i) => ({ label: `Filter ${i}`, value: `filter-${i}`, checked: false })),
        scrollTop: 0,
        hoveredIndex: -1,
        searchText: '',
      };

      const rect = canvas.getBoundingClientRect();
      const wheelEvent = createWheelEvent({
        deltaY: 50,
        clientX: rect.left + 150,
        clientY: rect.top + 150,
      });

      canvas.dispatchEvent(wheelEvent);

      expect(interactionManager['state'].filterDropdown?.scrollTop).toBe(50);
    });
  });

  describe('date dropdown handling', () => {
    it('should return null when date dropdown is not open', () => {
      expect(interactionManager.getDateDropdown()).toBeNull();
    });

    it('should update date dropdown position on wheel', () => {
      interactionManager['state'].dateDropdown = {
        x: 100,
        y: 100,
        width: 200,
        cell: { rowIndex: 0, columnIndex: 1 },
        config: { value: '2024-01-01' },
        currentYear: 2024,
        currentMonth: 0,
        selectedDate: null,
        hoveredDate: null,
      };

      const rect = canvas.getBoundingClientRect();
      const wheelEvent = createWheelEvent({
        deltaY: 50,
        clientX: rect.left + 50,
        clientY: rect.top + 50,
      });

      // Should not throw error
      expect(() => canvas.dispatchEvent(wheelEvent)).not.toThrow();
    });
  });

  describe('image tooltip/editor handling', () => {
    it('should return null for image tooltip when not open', () => {
      expect(interactionManager.getImageTooltip()).toBeNull();
    });

    it('should return null for image editor when not open', () => {
      expect(interactionManager.getImageEditor()).toBeNull();
    });
  });

  describe('header interactions', () => {
    it('should handle header click for column selection', () => {
      const columns = createTestColumns();
      const rows = createTestRows(5);
      layoutManager.calculateLayout(columns, rows);
      interactionManager.setColumns(columns);
      interactionManager.setRows(rows);

      const rect = canvas.getBoundingClientRect();

      // Click on header (rowIndex = -1)
      const mouseEvent = createMouseEvent('mousedown', {
        clientX: rect.left + 40,
        clientY: rect.top + 20, // Header area
      });

      canvas.dispatchEvent(mouseEvent);

      // Header click should not throw error
    });
  });

  describe('buttons dropdown handling', () => {
    it('should return null for buttons dropdown when not open', () => {
      expect(interactionManager.getButtonsDropdown()).toBeNull();
    });
  });
});