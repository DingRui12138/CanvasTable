/**
 * EditingHandler - Handles cell editing operations
 *
 * Manages starting, ending, and validating cell editing.
 */

import {
  CellPosition,
  Column,
  Row,
  InputConfig,
  SelectConfig,
  TagsConfig,
  DateConfig,
  ImageConfig,
  ColorPickerConfig,
  EditRenderResult,
  CellTypes,
} from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { getColumnField } from "../../utils";
import { TableEvents } from "../../constants/events";

export class EditingHandler extends BaseHandler {
  private editingConfig: { enabled?: boolean; mode?: string; validateOnChange?: boolean };

  // Constants for dropdown positioning
  private static readonly DROPDOWN_ITEM_HEIGHT = 32;
  private static readonly DROPDOWN_MAX_VISIBLE = 8;

  constructor(
    context: HandlerContext,
    eventEmitter: EventEmitter<InteractionEvents>,
    editingConfig: { enabled?: boolean; mode?: string; validateOnChange?: boolean },
  ) {
    super(context, eventEmitter);
    this.editingConfig = editingConfig;
  }

  /**
   * Validate if a cell can be edited
   */
  validateCellForEditing(cell: CellPosition): { column: Column; row: Row } | null {
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) return null;
    const row = this.rows[cell.rowIndex];
    if (!row) return null;
    if (!this.editorRegistry.getStrategy(column).canEdit(cell, row, column)) return null;
    return { column, row };
  }

  /**
   * Get edit configuration for a cell
   * Priority: editRender > render result > null (default logic)
   */
  getEditConfig(column: Column, row: Row, rowIndex: number): EditRenderResult | null {
    const value = row.data[getColumnField(column)];

    // Try editRender first
    if (column.editRender) {
      try {
        const result = column.editRender(value, row, rowIndex);
        if (result) return result;
      } catch (error) {
        console.error("Error in editRender:", error);
      }
    }

    // Fall back to render result
    if (column.render) {
      try {
        const result = column.render(value, row, column, rowIndex);
        if (
          result &&
          result.type &&
          result.type !== CellTypes.CUSTOM &&
          result.type !== CellTypes.BUTTON &&
          result.type !== CellTypes.IMAGE &&
          result.type !== CellTypes.PROGRESS &&
          result.type !== CellTypes.LINK
        ) {
          return {
            type: result.type,
            input: result.input,
            select: result.select,
            tags: result.tags,
            date: result.date,
            checkbox: result.checkbox,
            radio: result.radio,
            switch: result.switch,
          };
        }
      } catch (error) {
        console.error("Error in render:", error);
      }
    }

    return null;
  }

  /**
   * Start text/input editing
   */
  startEditing(cell: CellPosition, inputConfig?: InputConfig): boolean {
    const validated = this.validateCellForEditing(cell);
    if (!validated) return false;

    this.state.tooltip = null;
    this.state.editingCell = cell;
    this.eventEmitter.emit(TableEvents.EDIT_START, this.getCellInfo(cell)!, inputConfig);
    return true;
  }

  /**
   * Start select dropdown editing
   */
  startSelectEditing(cell: CellPosition, selectConfig?: SelectConfig): boolean {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !selectConfig) return false;

    this.state.tooltip = null;

    // Calculate dropdown dimensions
    const itemHeight = EditingHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = EditingHandler.DROPDOWN_MAX_VISIBLE;
    const optionsCount = selectConfig.options?.length ?? 0;
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    const dropdownWidth = validated.column.width ?? 100;

    // Use calculator for position
    const result = this.calculateDropdownPosition(cell, dropdownWidth, dropdownHeight, "cell", {
      column: validated.column,
    });

    this.state.dropdown = {
      cell,
      config: selectConfig,
      x: result.x,
      y: result.y,
      width: dropdownWidth,
      scrollTop: 0,
      hoveredIndex: -1,
      showAbove: result.showAbove,
    };

    this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
    return true;
  }

  /**
   * Start tags editing
   */
  startTagsEditing(cell: CellPosition, tagsConfig?: TagsConfig): boolean {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !tagsConfig) return false;

    this.state.tooltip = null;

    // Calculate dropdown dimensions
    const itemHeight = EditingHandler.DROPDOWN_ITEM_HEIGHT;
    const maxVisibleItems = EditingHandler.DROPDOWN_MAX_VISIBLE;
    const optionsCount = tagsConfig.options?.length ?? 0;
    const visibleCount = Math.min(optionsCount, maxVisibleItems);
    const dropdownHeight = visibleCount * itemHeight;
    const dropdownWidth = validated.column.width ?? 100;

    // Use calculator for position
    const result = this.calculateDropdownPosition(cell, dropdownWidth, dropdownHeight, "cell", {
      column: validated.column,
    });

    this.state.dropdown = {
      cell,
      config: {
        value: tagsConfig.selectedValues,
        options: (tagsConfig.options ?? []).map((opt) => ({
          label: opt.text,
          value: opt.value ?? opt.text,
          disabled: opt.disabled,
        })),
      },
      x: result.x,
      y: result.y,
      width: dropdownWidth,
      scrollTop: 0,
      hoveredIndex: -1,
      type: "tags",
      tagsConfig,
      showAbove: result.showAbove,
    };

    this.eventEmitter.emit(TableEvents.DROPDOWN_OPEN);
    return true;
  }

  /**
   * Start date editing
   */
  startDateEditing(cell: CellPosition, dateConfig?: DateConfig): boolean {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !dateConfig) return false;

    this.state.tooltip = null;

    // Calculate dropdown dimensions
    const dropdownWidth = Math.max(validated.column.width ?? 100, 280);
    const dropdownHeight = 40 + 28 + 6 * 28 + 16;

    // Use calculator for position
    const result = this.calculateDropdownPosition(cell, dropdownWidth, dropdownHeight, "cell", {
      column: validated.column,
    });

    // Parse date value
    let selectedDate: Date | null = null;
    if (dateConfig.value) {
      if (dateConfig.value instanceof Date) {
        selectedDate = dateConfig.value;
      } else if (typeof dateConfig.value === "string") {
        selectedDate = new Date(dateConfig.value);
      }
    }

    const currentYear = selectedDate?.getFullYear() ?? new Date().getFullYear();
    const currentMonth = selectedDate?.getMonth() ?? new Date().getMonth();

    this.state.dateDropdown = {
      cell,
      config: dateConfig,
      x: result.x,
      y: result.y,
      width: dropdownWidth,
      currentYear,
      currentMonth,
      selectedDate,
      hoveredDate: null,
      showAbove: result.showAbove,
    };

    this.eventEmitter.emit(TableEvents.DATE_DROPDOWN_OPEN);
    return true;
  }

  /**
   * Start image editing
   */
  startImageEditing(cell: CellPosition, imageConfig?: ImageConfig): boolean {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !imageConfig) return false;

    this.state.tooltip = null;

    // Calculate editor dimensions
    const imgSize = 64;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const maxRows = 3;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    // Use calculator for position
    const result = this.calculateDropdownPosition(cell, editorWidth, editorHeight, "cell", {
      column: validated.column,
    });

    const images = imageConfig.images ?? (imageConfig.src ? [imageConfig.src] : []);
    const isSingleImage = !images || (images.length <= 1 && !imageConfig.multiple);

    this.state.imageEditor = {
      cell,
      x: result.x,
      y: result.y,
      images: [...images],
      hoveredIndex: -1,
      scrollTop: 0,
      maxRows,
      showAbove: result.showAbove,
      isDragging: false,
      pendingImages: [],
      isSingleImage,
    };

    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_OPEN);
    return true;
  }

  /**
   * Start color picker editing
   */
  startColorEditing(cell: CellPosition, colorConfig?: ColorPickerConfig): boolean {
    const validated = this.validateCellForEditing(cell);
    if (!validated || !colorConfig) return false;

    this.state.tooltip = null;

    // Calculate dropdown dimensions
    const presetColors = colorConfig.presetColors || this.getDefaultPresetColors();
    const columns = 8;
    const rows = Math.ceil(presetColors.length / columns);
    const cellSize = 24;
    const gap = 4;
    const padding = 8;
    const dropdownWidth = Math.max(
      validated.column.width ?? 100,
      columns * (cellSize + gap) + padding * 2 - gap,
    );
    const dropdownHeight = rows * (cellSize + gap) + padding * 2 - gap;

    // Use calculator for position
    const result = this.calculateDropdownPosition(cell, dropdownWidth, dropdownHeight, "cell", {
      column: validated.column,
    });

    this.state.colorDropdown = {
      cell,
      config: colorConfig,
      x: result.x,
      y: result.y,
      width: dropdownWidth,
      hoveredColor: null,
    };

    this.eventEmitter.emit(TableEvents.COLOR_DROPDOWN_OPEN);
    return true;
  }

  /**
   * Get default preset colors for color picker
   */
  private getDefaultPresetColors(): string[] {
    return [
      "#ff4d4f",
      "#ff7a45",
      "#ffa940",
      "#ffc53d",
      "#bae637",
      "#73d13d",
      "#36cfc9",
      "#40a9ff",
      "#597ef7",
      "#9254de",
      "#f759ab",
      "#ff85c0",
      "#a0d911",
      "#13c2c2",
      "#1890ff",
      "#722ed1",
      "#eb2f96",
      "#faad14",
      "#52c41a",
      "#2f54eb",
      "#ffffff",
      "#f5f5f5",
      "#d9d9d9",
      "#8c8c8c",
      "#595959",
      "#262626",
      "#000000",
      "#f50",
    ];
  }

  /**
   * End editing
   */
  endEditing(save: boolean): void {
    if (!this.state.editingCell) return;

    const cell = this.state.editingCell;
    this.state.editingCell = null;

    if (save) {
      // The actual save is handled by the EditorManager
      this.eventEmitter.emit(
        TableEvents.EDIT_END,
        this.getCellInfo(cell)!,
        this.state.editingValue,
      );
    }

    this.state.editingValue = null;
  }

  /**
   * Update editing config
   */
  updateEditingConfig(config: {
    enabled?: boolean;
    mode?: string;
    validateOnChange?: boolean;
  }): void {
    this.editingConfig = config;
  }

  /**
   * Check if editing is enabled
   */
  isEditingEnabled(): boolean {
    return this.editingConfig.enabled !== false;
  }

  /**
   * Get editing mode
   */
  getEditingMode(): string {
    return this.editingConfig.mode ?? "dblclick";
  }
}
