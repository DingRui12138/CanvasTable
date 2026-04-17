/**
 * ImageHandler - Handles image tooltip and editor interactions
 *
 * Manages image tooltip display, image editor operations,
 * file uploads, and image changes.
 */

import { ImageConfig } from "../../types";
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { getColumnField } from "../../utils";
import { TableEvents } from "../../constants/events";

/** Image editor click result */
export type ImageEditorClickResult = "outside" | "upload" | "inside";

export class ImageHandler extends BaseHandler {
  private static readonly IMAGE_SIZE = 64;
  private static readonly IMAGE_PADDING = 8;
  private static readonly IMAGE_GAP = 8;
  private static readonly IMAGES_PER_ROW = 4;
  private static readonly IMAGE_UPLOAD_AREA_HEIGHT = 60;

  constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>) {
    super(context, eventEmitter);
  }

  /**
   * Handle image tooltip hover
   */
  handleImageTooltipHover(e: MouseEvent): boolean {
    if (!this.state.imageTooltip) return false;

    const { x, y, images, scrollTop, maxRows } = this.state.imageTooltip;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const dropdownWidth =
      imagesPerRow * imgSize +
      (imagesPerRow - 1) * gap +
      padding * 2 +
      scrollbarGap +
      scrollbarWidth;
    const rowHeight = imgSize + gap;
    const visibleHeight = maxRows * rowHeight + padding * 2 - gap;

    const prevHoveredIndex = this.state.imageTooltip.hoveredIndex;

    // Check if in dropdown area
    if (
      viewportX >= x &&
      viewportX <= x + dropdownWidth &&
      viewportY >= y &&
      viewportY <= y + visibleHeight
    ) {
      // Precise detection: iterate visible images
      const totalRows = Math.ceil(images.length / imagesPerRow);
      const startRow = Math.floor(scrollTop / rowHeight);
      const endRow = Math.min(totalRows, startRow + maxRows + 1);

      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < imagesPerRow; col++) {
          const index = row * imagesPerRow + col;
          if (index >= images.length) break;

          const imgX = x + padding + col * (imgSize + gap);
          const imgY = y + padding + row * rowHeight - scrollTop;

          if (
            viewportX >= imgX &&
            viewportX <= imgX + imgSize &&
            viewportY >= imgY &&
            viewportY <= imgY + imgSize
          ) {
            this.state.imageTooltip.hoveredIndex = index;
            if (prevHoveredIndex !== index) {
              this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
            }
            return true;
          }
        }
      }
      // In dropdown but not on any image
      this.state.imageTooltip.hoveredIndex = -1;
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
      }
      return true;
    }
    this.state.imageTooltip.hoveredIndex = -1;
    if (prevHoveredIndex !== -1) {
      this.eventEmitter.emit(TableEvents.IMAGE_TOOLTIP_SCROLL);
    }
    return false;
  }

  /**
   * Handle image tooltip click
   */
  handleImageTooltipClick(e: MouseEvent): boolean {
    if (!this.state.imageTooltip) return false;

    const { x, y, images, cell, scrollTop, maxRows } = this.state.imageTooltip;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const dropdownWidth =
      imagesPerRow * imgSize +
      (imagesPerRow - 1) * gap +
      padding * 2 +
      scrollbarGap +
      scrollbarWidth;
    const rowHeight = imgSize + gap;
    const visibleHeight = maxRows * rowHeight + padding * 2 - gap;

    // Click outside dropdown
    if (
      viewportX < x ||
      viewportX > x + dropdownWidth ||
      viewportY < y ||
      viewportY > y + visibleHeight
    ) {
      return false;
    }

    // Calculate clicked image index
    const relativeX = viewportX - x - padding;
    const relativeY = viewportY - y - padding + scrollTop;
    const col = Math.floor(relativeX / (imgSize + gap));
    const row = Math.floor(relativeY / rowHeight);

    if (col >= 0 && col < imagesPerRow && row >= 0) {
      const index = row * imagesPerRow + col;
      if (index >= 0 && index < images.length) {
        const imageSrc = images[index];
        if (imageSrc) {
          this.eventEmitter.emit(TableEvents.IMAGE_CLICK, this.getCellInfo(cell)!, imageSrc, e);
        }
      }
    }
    return true;
  }

  /**
   * Handle image editor hover
   */
  handleImageEditorHover(e: MouseEvent): boolean {
    if (!this.state.imageEditor) return false;

    const { x, y, images, pendingImages, scrollTop, maxRows } = this.state.imageEditor;
    const coords = this.getViewportCoords(e);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    const prevHoveredIndex = this.state.imageEditor.hoveredIndex;

    // Outside editor
    if (
      viewportX < x ||
      viewportX > x + editorWidth ||
      viewportY < y ||
      viewportY > y + editorHeight
    ) {
      this.state.imageEditor.hoveredIndex = -1;
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
      }
      return false;
    }

    // In upload area
    if (viewportY >= y && viewportY <= y + uploadAreaHeight) {
      this.state.imageEditor.hoveredIndex = -1;
      if (prevHoveredIndex !== -1) {
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
      }
      return true;
    }

    // In images area
    const imagesY = y + uploadAreaHeight;
    const totalImages = images.length + pendingImages.length;

    for (let row = 0; row < maxRows + 1; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= totalImages) break;

        const imgX = x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - scrollTop;

        if (
          viewportX >= imgX &&
          viewportX <= imgX + imgSize &&
          viewportY >= imgY &&
          viewportY <= imgY + imgSize
        ) {
          this.state.imageEditor.hoveredIndex = index;
          if (prevHoveredIndex !== index) {
            this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
          }
          return true;
        }
      }
    }

    this.state.imageEditor.hoveredIndex = -1;
    if (prevHoveredIndex !== -1) {
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_HOVER);
    }
    return true;
  }

  /**
   * Handle image editor click
   */
  handleImageEditorClick(e: MouseEvent): ImageEditorClickResult {
    if (!this.state.imageEditor) return "outside";

    const { x, y, images, cell, scrollTop, maxRows } = this.state.imageEditor;
    const coords2 = this.getViewportCoords(e);
    const viewportX = coords2.x;
    const viewportY = coords2.y;

    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    // Click outside editor
    if (
      viewportX < x ||
      viewportX > x + editorWidth ||
      viewportY < y ||
      viewportY > y + editorHeight
    ) {
      // Save changes and close
      return "outside"; // Signal to close
    }

    // Click in upload area
    if (viewportY >= y && viewportY <= y + uploadAreaHeight) {
      return "upload"; // Signal to trigger file input
    }

    // Calculate click position for image
    const imagesY = y + uploadAreaHeight;
    const totalImages = images.length + (this.state.imageEditor.pendingImages?.length ?? 0);

    for (let row = 0; row < maxRows + 1; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= totalImages) break;

        const imgX = x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - scrollTop;

        if (
          viewportX >= imgX &&
          viewportX <= imgX + imgSize &&
          viewportY >= imgY &&
          viewportY <= imgY + imgSize
        ) {
          // Click on image - delete
          if (index < images.length) {
            const deletedImage = images[index];
            images.splice(index, 1);
            this.state.imageEditor.images = [...images];
            this.eventEmitter.emit(
              TableEvents.IMAGE_DELETE,
              this.getCellInfo(cell)!,
              deletedImage,
              index,
            );
          }
          return "inside";
        }
      }
    }

    return "inside";
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(files: File[]): Promise<void> {
    if (!this.state.imageEditor) return;

    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[this.state.imageEditor.cell.columnIndex];
    if (!column) return;

    const row = this.rows[this.state.imageEditor.cell.rowIndex];
    if (!row) return;

    // Get image config
    const renderResult = column.render
      ? column.render(
          row.data[getColumnField(column)],
          row,
          column,
          this.state.imageEditor.cell.rowIndex,
        )
      : { image: row.data[getColumnField(column)] as ImageConfig };
    const imageConfig = renderResult.image ?? {};

    const onUpload = imageConfig.onUpload;
    const maxCount = imageConfig.maxCount;
    const isSingleImage = this.state.imageEditor.isSingleImage;

    // Check count limit
    let remainingSlots: number;
    if (isSingleImage) {
      remainingSlots = 1;
      this.state.imageEditor.images = [];
    } else {
      const currentCount =
        this.state.imageEditor.images.length + this.state.imageEditor.pendingImages.length;
      remainingSlots = maxCount !== undefined ? maxCount - currentCount : files.length;
    }
    const filesToUpload = files.slice(0, remainingSlots);

    // Add previews
    const pendingImages: Array<{ file: File; preview: string }> = [];
    for (const file of filesToUpload) {
      const preview = await this.readFileAsDataURL(file);
      pendingImages.push({ file, preview });
    }

    this.state.imageEditor.pendingImages = [
      ...this.state.imageEditor.pendingImages,
      ...pendingImages,
    ];
    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);

    // Trigger upload
    if (onUpload) {
      for (const pending of pendingImages) {
        try {
          const url = await onUpload(pending.file);
          const index = this.state.imageEditor.pendingImages.findIndex(
            (p) => p.preview === pending.preview,
          );
          if (index >= 0) {
            this.state.imageEditor.pendingImages.splice(index, 1);
            this.state.imageEditor.images = [...this.state.imageEditor.images, url];
            this.eventEmitter.emit(
              TableEvents.IMAGE_UPLOAD,
              this.getCellInfo(this.state.imageEditor.cell)!,
              url,
            );
          }
        } catch (error) {
          console.error("Upload failed:", error);
          const index = this.state.imageEditor.pendingImages.findIndex(
            (p) => p.preview === pending.preview,
          );
          if (index >= 0) {
            this.state.imageEditor.pendingImages.splice(index, 1);
          }
        }
        this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
      }
    } else {
      // No upload function, use preview URL directly
      for (const pending of pendingImages) {
        const index = this.state.imageEditor.pendingImages.findIndex(
          (p) => p.preview === pending.preview,
        );
        if (index >= 0) {
          this.state.imageEditor.pendingImages.splice(index, 1);
          this.state.imageEditor.images = [...this.state.imageEditor.images, pending.preview];
          this.eventEmitter.emit(
            TableEvents.IMAGE_UPLOAD,
            this.getCellInfo(this.state.imageEditor.cell)!,
            pending.preview,
          );
        }
      }
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    }
  }

  /**
   * Commit image editor changes
   */
  commitImageEditorChanges(): void {
    if (!this.state.imageEditor) return;

    const { cell, images, isSingleImage } = this.state.imageEditor;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    const row = this.rows[cell.rowIndex];

    if (column && row) {
      const originalValue = row.data[getColumnField(column)];
      let newValue: unknown;

      if (isSingleImage) {
        const newSrc = images[0] ?? null;

        if (typeof originalValue === "string") {
          newValue = newSrc;
        } else if (Array.isArray(originalValue)) {
          newValue = { src: newSrc };
        } else if (originalValue && typeof originalValue === "object") {
          newValue = {
            ...(originalValue as Record<string, unknown>),
            src: newSrc,
          };
        } else {
          newValue = newSrc;
        }
      } else {
        if (Array.isArray(originalValue)) {
          newValue = images;
        } else if (originalValue && typeof originalValue === "object") {
          newValue = {
            ...(originalValue as Record<string, unknown>),
            images,
          };
        } else {
          newValue = images;
        }
      }

      this.eventEmitter.emit(TableEvents.EDIT_END, this.getCellInfo(cell)!, newValue);
    }

    this.state.imageEditor = null;
    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_CLOSE);
  }

  /**
   * Read file as data URL
   */
  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Update image tooltip position after scroll
   */
  updateImageTooltipPosition(): void {
    if (!this.state.imageTooltip) return;

    const { cell, showAbove, maxRows } = this.state.imageTooltip;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.state.imageTooltip = null;
      return;
    }

    // Calculate tooltip dimensions
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const tooltipWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2;
    const rowHeight = imgSize + gap;
    const tooltipHeight = maxRows * rowHeight + padding * 2 - gap;

    // Use calculator to update position
    const yResult = this.updateDropdownY(cell, showAbove, tooltipHeight, { column });
    const newX = this.updateDropdownX(cell, tooltipWidth, { column });

    this.state.imageTooltip.x = newX;
    this.state.imageTooltip.y = yResult.y;
    this.state.imageTooltip.showAbove = yResult.showAbove;
  }

  /**
   * Update image editor position after scroll
   */
  updateImageEditorPosition(): void {
    if (!this.state.imageEditor) return;

    const { cell, showAbove, maxRows } = this.state.imageEditor;
    const leafColumns = this.layoutManager.getLeafColumns();
    const column = leafColumns[cell.columnIndex];
    if (!column) {
      this.commitImageEditorChanges();
      return;
    }

    // Calculate editor dimensions
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    // Use calculator to update position
    const yResult = this.updateDropdownY(cell, showAbove, editorHeight, { column });
    const newX = this.updateDropdownX(cell, editorWidth, { column });

    this.state.imageEditor.x = newX;
    this.state.imageEditor.y = yResult.y;
    this.state.imageEditor.showAbove = yResult.showAbove;
  }

  /**
   * Handle drag over event for image editor
   */
  handleDragOver(e: DragEvent): boolean {
    if (!this.state.imageEditor) return false;

    e.preventDefault();

    const coords = this.getViewportCoords(e as unknown as MouseEvent);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const { x, y, maxRows } = this.state.imageEditor;
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    // 在编辑器区域内
    if (
      viewportX >= x &&
      viewportX <= x + editorWidth &&
      viewportY >= y &&
      viewportY <= y + editorHeight
    ) {
      this.state.imageEditor.isDragging = true;
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
      return true;
    }

    return false;
  }

  /**
   * Handle drag leave event for image editor
   */
  handleDragLeave(e: DragEvent): void {
    if (!this.state.imageEditor) return;

    const coords = this.getViewportCoords(e as unknown as MouseEvent);
    const viewportX = coords.x;
    const viewportY = coords.y;

    const { x, y, maxRows } = this.state.imageEditor;
    const imgSize = ImageHandler.IMAGE_SIZE;
    const padding = ImageHandler.IMAGE_PADDING;
    const gap = ImageHandler.IMAGE_GAP;
    const imagesPerRow = ImageHandler.IMAGES_PER_ROW;
    const uploadAreaHeight = ImageHandler.IMAGE_UPLOAD_AREA_HEIGHT;
    const rowHeight = imgSize + gap;
    const editorWidth = imagesPerRow * imgSize + (imagesPerRow - 1) * gap + padding * 2 + 4 + 4;
    const imagesHeight = maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    // 离开编辑器区域
    if (
      viewportX < x ||
      viewportX > x + editorWidth ||
      viewportY < y ||
      viewportY > y + editorHeight
    ) {
      this.state.imageEditor.isDragging = false;
      this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    }
  }

  /**
   * Handle drop event for image editor
   */
  async handleDrop(e: DragEvent): Promise<boolean> {
    if (!this.state.imageEditor) return false;

    e.preventDefault();

    this.state.imageEditor.isDragging = false;

    const files = Array.from(e.dataTransfer?.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length > 0) {
      await this.handleFileUpload(files);
    }

    this.eventEmitter.emit(TableEvents.IMAGE_EDITOR_SCROLL);
    return true;
  }
}
