/**
 * ImageHandler - Handles image tooltip and editor interactions
 *
 * Manages image tooltip display, image editor operations,
 * file uploads, and image changes.
 */
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
/** Image editor click result */
export type ImageEditorClickResult = "outside" | "upload" | "inside";
export declare class ImageHandler extends BaseHandler {
    private static readonly IMAGE_SIZE;
    private static readonly IMAGE_PADDING;
    private static readonly IMAGE_GAP;
    private static readonly IMAGES_PER_ROW;
    private static readonly IMAGE_UPLOAD_AREA_HEIGHT;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>);
    /**
     * Handle image tooltip hover
     */
    handleImageTooltipHover(e: MouseEvent): boolean;
    /**
     * Handle image tooltip click
     */
    handleImageTooltipClick(e: MouseEvent): boolean;
    /**
     * Handle image editor hover
     */
    handleImageEditorHover(e: MouseEvent): boolean;
    /**
     * Handle image editor click
     */
    handleImageEditorClick(e: MouseEvent): ImageEditorClickResult;
    /**
     * Handle file upload
     */
    handleFileUpload(files: File[]): Promise<void>;
    /**
     * Commit image editor changes
     */
    commitImageEditorChanges(): void;
    /**
     * Read file as data URL
     */
    private readFileAsDataURL;
    /**
     * Update image tooltip position after scroll
     */
    updateImageTooltipPosition(): void;
    /**
     * Update image editor position after scroll
     */
    updateImageEditorPosition(): void;
    /**
     * Handle drag over event for image editor
     */
    handleDragOver(e: DragEvent): boolean;
    /**
     * Handle drag leave event for image editor
     */
    handleDragLeave(e: DragEvent): void;
    /**
     * Handle drop event for image editor
     */
    handleDrop(e: DragEvent): Promise<boolean>;
}
//# sourceMappingURL=ImageHandler.d.ts.map