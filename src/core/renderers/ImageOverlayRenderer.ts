import { CanvasTableLocale, ImageEditorState, ImageTooltipState, TableTheme } from "../../types";
import { drawOverlayPanel, renderOverlayVerticalScrollbar } from "./OverlayRenderUtils";
import { zhCN } from "../../locale";

interface ImageOverlayLoader {
  get(src: string, minSize?: number): HTMLImageElement | HTMLCanvasElement | null;
  isLoading(src: string): boolean;
  load(src: string, targetSize?: number): void;
  collectVisible(src: string): void;
}

export class ImageOverlayRenderer {
  private ctx: CanvasRenderingContext2D;
  private theme: TableTheme;
  private loader: ImageOverlayLoader;
  private locale: CanvasTableLocale;

  constructor(
    ctx: CanvasRenderingContext2D,
    theme: TableTheme,
    loader: ImageOverlayLoader,
    locale: CanvasTableLocale = zhCN,
  ) {
    this.ctx = ctx;
    this.theme = theme;
    this.loader = loader;
    this.locale = locale;
  }

  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  setTheme(theme: TableTheme): void {
    this.theme = theme;
  }

  setLocale(locale: CanvasTableLocale): void {
    this.locale = locale;
  }

  renderImageTooltip(imageTooltip: ImageTooltipState): void {
    const imgSize = 64;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const rowHeight = imgSize + gap;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const tooltipWidth =
      imagesPerRow * imgSize +
      (imagesPerRow - 1) * gap +
      padding * 2 +
      scrollbarGap +
      scrollbarWidth;
    const visibleHeight = imageTooltip.maxRows * rowHeight + padding * 2 - gap;
    const totalRows = Math.ceil(imageTooltip.images.length / imagesPerRow);
    const contentHeight = totalRows * rowHeight - gap;

    this.ctx.save();

    drawOverlayPanel(this.ctx, this.theme, {
      x: imageTooltip.x,
      y: imageTooltip.y,
      width: tooltipWidth,
      height: visibleHeight,
      fillStyle: this.theme.colors.tooltip.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: true,
      clip: true,
    });

    const startRow = Math.floor(imageTooltip.scrollTop / rowHeight);
    const endRow = Math.min(totalRows, startRow + imageTooltip.maxRows + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= imageTooltip.images.length) break;

        const imgSrc = imageTooltip.images[index];
        if (!imgSrc) continue;

        const x = imageTooltip.x + padding + col * (imgSize + gap);
        const y = imageTooltip.y + padding + row * rowHeight - imageTooltip.scrollTop;

        if (y + imgSize < imageTooltip.y || y > imageTooltip.y + visibleHeight) continue;

        this.renderImageTile(
          imgSrc,
          x,
          y,
          imgSize,
          index === imageTooltip.hoveredIndex,
          false,
          false,
        );
      }
    }

    if (contentHeight > visibleHeight - padding * 2) {
      const scrollbarTrackHeight = visibleHeight - padding * 2;
      const scrollbarThumbHeight = Math.max(
        30,
        (visibleHeight / contentHeight) * scrollbarTrackHeight,
      );
      const scrollbarThumbY =
        imageTooltip.y +
        padding +
        (imageTooltip.scrollTop / (contentHeight - scrollbarTrackHeight + padding * 2)) *
          (scrollbarTrackHeight - scrollbarThumbHeight);

      renderOverlayVerticalScrollbar(
        this.ctx,
        this.theme,
        imageTooltip.x + tooltipWidth - padding - scrollbarWidth,
        imageTooltip.y + padding,
        scrollbarWidth,
        scrollbarTrackHeight,
        scrollbarThumbY,
        scrollbarThumbHeight,
      );
    }

    this.ctx.restore();
  }

  renderImageEditor(editor: ImageEditorState): void {
    const images = editor.images ?? [];
    const pendingImages = editor.pendingImages ?? [];

    const imgSize = 64;
    const padding = 8;
    const gap = 8;
    const imagesPerRow = 4;
    const uploadAreaHeight = 60;
    const rowHeight = imgSize + gap;
    const scrollbarWidth = 4;
    const scrollbarGap = 4;
    const editorWidth =
      imagesPerRow * imgSize +
      (imagesPerRow - 1) * gap +
      padding * 2 +
      scrollbarGap +
      scrollbarWidth;
    const imagesHeight = editor.maxRows * rowHeight + padding * 2 - gap;
    const editorHeight = uploadAreaHeight + imagesHeight;

    this.ctx.save();

    drawOverlayPanel(this.ctx, this.theme, {
      x: editor.x,
      y: editor.y,
      width: editorWidth,
      height: editorHeight,
      fillStyle: this.theme.colors.dropdown.background,
      strokeStyle: this.theme.colors.dropdown.border,
      shadow: true,
    });

    this.renderUploadArea(editor, editorWidth, uploadAreaHeight, padding);

    const imagesY = editor.y + uploadAreaHeight;
    const totalRows = Math.ceil((images.length + pendingImages.length) / imagesPerRow);
    const contentHeight = totalRows * rowHeight - gap;
    const visibleHeight = imagesHeight - padding * 2;

    this.ctx.beginPath();
    this.ctx.rect(editor.x, imagesY, editorWidth, imagesHeight);
    this.ctx.clip();

    const startRow = Math.floor(editor.scrollTop / rowHeight);
    const endRow = Math.min(totalRows, startRow + editor.maxRows + 1);
    const allImages = [...images, ...pendingImages.map((p) => p.preview)];

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < imagesPerRow; col++) {
        const index = row * imagesPerRow + col;
        if (index >= allImages.length) break;

        const imgSrc = allImages[index];
        if (!imgSrc) continue;

        const imgX = editor.x + padding + col * (imgSize + gap);
        const imgY = imagesY + padding + row * rowHeight - editor.scrollTop;

        if (imgY + imgSize < imagesY || imgY > imagesY + imagesHeight) continue;

        const isHovered = index === editor.hoveredIndex;
        const isPending = index >= images.length;
        this.renderImageTile(imgSrc, imgX, imgY, imgSize, isHovered, isPending, true);
      }
    }

    if (contentHeight > visibleHeight) {
      const scrollbarTrackHeight = visibleHeight;
      const scrollbarThumbHeight = Math.max(
        30,
        (visibleHeight / contentHeight) * scrollbarTrackHeight,
      );
      const scrollbarThumbY =
        imagesY +
        padding +
        (editor.scrollTop / (contentHeight - visibleHeight + padding * 2)) *
          (scrollbarTrackHeight - scrollbarThumbHeight);

      renderOverlayVerticalScrollbar(
        this.ctx,
        this.theme,
        editor.x + editorWidth - padding - scrollbarWidth,
        imagesY + padding,
        scrollbarWidth,
        scrollbarTrackHeight,
        scrollbarThumbY,
        scrollbarThumbHeight,
      );
    }

    this.ctx.restore();
  }

  private renderUploadArea(
    editor: ImageEditorState,
    editorWidth: number,
    uploadAreaHeight: number,
    padding: number,
  ): void {
    const uploadY = editor.y;
    const isDragging = editor.isDragging;

    this.ctx.fillStyle = isDragging
      ? this.theme.colors.dropdown.selectedBg
      : this.theme.colors.image.placeholderBg;
    this.ctx.fillRect(
      editor.x + padding,
      uploadY + padding,
      editorWidth - padding * 2,
      uploadAreaHeight - padding * 2,
    );

    this.ctx.strokeStyle = isDragging
      ? this.theme.colors.checkbox.checkedBg
      : this.theme.colors.dropdown.border;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(
      editor.x + padding,
      uploadY + padding,
      editorWidth - padding * 2,
      uploadAreaHeight - padding * 2,
    );
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = this.theme.colors.dropdown.text;
    this.ctx.font = `${this.theme.font.size}px ${this.theme.font.family}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    const uploadText = isDragging ? this.locale.image.uploadDragging : this.locale.image.uploadIdle;
    this.ctx.fillText(uploadText, editor.x + editorWidth / 2, uploadY + uploadAreaHeight / 2);
  }

  private renderImageTile(
    imgSrc: string,
    x: number,
    y: number,
    imgSize: number,
    isHovered: boolean,
    isPending: boolean,
    showDelete: boolean,
  ): void {
    const cachedImg = this.loader.get(imgSrc, imgSize);
    if (cachedImg) {
      this.ctx.save();
      if (isHovered) {
        this.ctx.strokeStyle = this.theme.colors.image.hoverBorder;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - 1, y - 1, imgSize + 2, imgSize + 2);
      }
      this.ctx.drawImage(cachedImg, x, y, imgSize, imgSize);
      this.ctx.restore();
      this.loader.collectVisible(imgSrc);
    } else {
      this.ctx.fillStyle = this.theme.colors.image.placeholderBg;
      this.ctx.fillRect(x, y, imgSize, imgSize);
      this.ctx.strokeStyle = this.theme.colors.dropdown.border;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, imgSize, imgSize);

      if (!this.loader.isLoading(imgSrc)) {
        this.loader.load(imgSrc, imgSize);
      }
    }

    if (isPending) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(x, y + imgSize - 20, imgSize, 20);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = `${this.theme.font.size - 2}px ${this.theme.font.family}`;
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.locale.image.uploading, x + imgSize / 2, y + imgSize - 10);
    }

    if (isHovered && !isPending && showDelete) {
      const deleteBtnSize = 16;
      const deleteBtnX = x + imgSize - deleteBtnSize / 2 - 2;
      const deleteBtnY = y + deleteBtnSize / 2 + 2;

      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      this.ctx.beginPath();
      this.ctx.arc(deleteBtnX, deleteBtnY, deleteBtnSize / 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = "#ffffff";
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(deleteBtnX - 3, deleteBtnY - 3);
      this.ctx.lineTo(deleteBtnX + 3, deleteBtnY + 3);
      this.ctx.moveTo(deleteBtnX + 3, deleteBtnY - 3);
      this.ctx.lineTo(deleteBtnX - 3, deleteBtnY + 3);
      this.ctx.stroke();
    }
  }
}
