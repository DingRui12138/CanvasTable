/**
 * EditingHandler - Handles cell editing operations
 *
 * Manages starting, ending, and validating cell editing.
 */
import { CellPosition, Column, Row, InputConfig, SelectConfig, TagsConfig, DateConfig, ImageConfig, ColorPickerConfig, EditRenderResult } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
export declare class EditingHandler extends BaseHandler {
    private editingConfig;
    private static readonly DROPDOWN_ITEM_HEIGHT;
    private static readonly DROPDOWN_MAX_VISIBLE;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>, editingConfig: {
        enabled?: boolean;
        mode?: string;
        validateOnChange?: boolean;
    });
    /**
     * Validate if a cell can be edited
     */
    validateCellForEditing(cell: CellPosition): {
        column: Column;
        row: Row;
    } | null;
    /**
     * Get edit configuration for a cell
     * Priority: editRender > render result > null (default logic)
     */
    getEditConfig(column: Column, row: Row, rowIndex: number): EditRenderResult | null;
    /**
     * Start text/input editing
     */
    startEditing(cell: CellPosition, inputConfig?: InputConfig): boolean;
    /**
     * Start select dropdown editing
     */
    startSelectEditing(cell: CellPosition, selectConfig?: SelectConfig): boolean;
    /**
     * Start tags editing
     */
    startTagsEditing(cell: CellPosition, tagsConfig?: TagsConfig): boolean;
    /**
     * Start date editing
     */
    startDateEditing(cell: CellPosition, dateConfig?: DateConfig): boolean;
    /**
     * Start image editing
     */
    startImageEditing(cell: CellPosition, imageConfig?: ImageConfig): boolean;
    /**
     * Start color picker editing
     */
    startColorEditing(cell: CellPosition, colorConfig?: ColorPickerConfig): boolean;
    /**
     * Get default preset colors for color picker
     */
    private getDefaultPresetColors;
    /**
     * End editing
     */
    endEditing(save: boolean): void;
    /**
     * Update editing config
     */
    updateEditingConfig(config: {
        enabled?: boolean;
        mode?: string;
        validateOnChange?: boolean;
    }): void;
    /**
     * Check if editing is enabled
     */
    isEditingEnabled(): boolean;
    /**
     * Get editing mode
     */
    getEditingMode(): string;
}
//# sourceMappingURL=EditingHandler.d.ts.map