import { TableTheme } from "../../types";

interface OverlayPanelOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  fillStyle: string;
  strokeStyle?: string;
  shadow?: boolean;
  clip?: boolean;
}

export function resetShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function applyThemeShadow(ctx: CanvasRenderingContext2D, theme: TableTheme): void {
  ctx.shadowColor = theme.colors.shadow.color;
  ctx.shadowBlur = theme.colors.shadow.blur;
  ctx.shadowOffsetX = theme.colors.shadow.offsetX;
  ctx.shadowOffsetY = theme.colors.shadow.offsetY;
}

export function drawOverlayPanel(
  ctx: CanvasRenderingContext2D,
  theme: TableTheme,
  options: OverlayPanelOptions,
): void {
  const radius = options.radius ?? 6;

  if (options.shadow) {
    applyThemeShadow(ctx, theme);
  }

  ctx.fillStyle = options.fillStyle;
  ctx.beginPath();
  ctx.roundRect(options.x, options.y, options.width, options.height, radius);
  ctx.fill();

  if (options.shadow) {
    resetShadow(ctx);
  }

  if (options.clip) {
    ctx.beginPath();
    ctx.roundRect(options.x, options.y, options.width, options.height, radius);
    ctx.clip();
  }

  if (options.strokeStyle) {
    ctx.strokeStyle = options.strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(options.x, options.y, options.width, options.height, radius);
    ctx.stroke();
  }
}

export function renderOverlayVerticalScrollbar(
  ctx: CanvasRenderingContext2D,
  theme: TableTheme,
  x: number,
  y: number,
  width: number,
  trackHeight: number,
  thumbY: number,
  thumbHeight: number,
): void {
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = theme.colors.scrollbar.opacity;
  ctx.fillStyle = theme.colors.scrollbar.track;
  ctx.fillRect(x, y, width, trackHeight);
  ctx.fillStyle = theme.colors.scrollbar.thumb;
  ctx.fillRect(x, thumbY, width, thumbHeight);
  ctx.globalAlpha = prevAlpha;
}
