import type { TableTheme } from '../../../src/types';

/**
 * 创建默认主题配置
 */
export function createMockTheme(): TableTheme {
  return {
    name: 'light',
    colors: {
      background: '#ffffff',
      headerBackground: '#fafafa',
      headerText: '#333333',
      rowBackground: '#ffffff',
      rowAltBackground: '#fafafa',
      rowHoverBackground: '#e6f4ff',
      rowSelectedBackground: '#1890ff',
      cellText: '#333333',
      cellBorder: '#e8e8e8',
      selectionBorder: '#1890ff',
      linkColor: '#1890ff',
      placeholderText: '#bfbfbf',
      primary: '#1890ff',
      tagColors: {
        default: '#f0f0f0',
        primary: '#1890ff',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        info: '#1890ff',
      },
      date: {
        border: '#d9d9d9',
        icon: '#bfbfbf',
      },
      input: {
        border: '#d9d9d9',
        focusBorder: '#1890ff',
        background: '#ffffff',
        text: '#333333',
        placeholder: '#bfbfbf',
      },
      checkbox: {
        border: '#d9d9d9',
        checkedBg: '#1890ff',
        checkmark: '#ffffff',
        disabledBg: '#f5f5f5',
      },
      radio: {
        border: '#d9d9d9',
        checkedBg: '#1890ff',
        dot: '#ffffff',
        disabledBg: '#f5f5f5',
      },
      switch: {
        onBg: '#1890ff',
        offBg: '#bfbfbf',
        thumb: '#ffffff',
        disabledOnBg: '#a0cfff',
        disabledOffBg: '#d9d9d9',
      },
      button: {
        background: '#ffffff',
        text: '#333333',
        border: '#d9d9d9',
        hoverBg: '#e6e6e6',
        primaryBg: '#1890ff',
        primaryText: '#ffffff',
        dangerBg: '#ff4d4f',
        dangerText: '#ffffff',
        warningBg: '#faad14',
        warningText: '#ffffff',
        linkText: '#1890ff',
        disabledBg: '#f5f5f5',
        disabledText: '#bfbfbf',
        disabledBorder: '#d9d9d9',
      },
      dropdown: {
        background: '#ffffff',
        border: '#e8e8e8',
        hoverBg: '#f5f5f5',
        selectedBg: '#e6f7ff',
        text: '#333333',
      },
      scrollbar: {
        track: 'rgba(0, 0, 0, 0.05)',
        thumb: 'rgba(0, 0, 0, 0.2)',
        thumbHover: 'rgba(0, 0, 0, 0.35)',
        thumbActive: 'rgba(0, 0, 0, 0.45)',
        opacity: 1,
      },
      progress: {
        track: '#f0f0f0',
        default: '#1890ff',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
      },
      indicator: {
        active: '#1890ff',
        inactive: '#d9d9d9',
      },
      tooltip: {
        background: '#333333',
        text: '#ffffff',
        gap: 8,
      },
      image: {
        hoverBorder: '#1890ff',
        hoverShadow: 'rgba(24, 144, 255, 0.2)',
        placeholderBg: '#f5f5f5',
        errorBg: '#fff2f0',
        errorBorder: '#ffccc7',
      },
      hiddenPlaceholder: {
        hoverBg: '#f5f5f5',
      },
      moreCount: {
        background: '#f0f0f0',
        text: '#666666',
      },
      shadow: {
        color: 'rgba(0, 0, 0, 0.1)',
        blur: 4,
        offsetX: 0,
        offsetY: 2,
      },
      watermark: {
        color: 'rgba(0, 0, 0, 0.15)',
        fontSize: 16,
        opacity: 1,
      },
    },
    font: {
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      size: 13,
      headerSize: 13,
    },
    row: {
      height: 32,
      headerHeight: 36,
      minHeight: 24,
      maxHeight: 320,
      resizeGuideColor: '#1890ff',
      resizeGuideWidth: 1,
    },
    border: {
      width: 1,
      color: '#e8e8e8',
    },
  };
}

/**
 * 创建 Mock Canvas Context
 */
export function createMockCanvasContext(): CanvasRenderingContext2D {
  const calls: { method: string; args: unknown[] }[] = [];

  const mockContext = {
    calls,
    canvas: {
      width: 800,
      height: 600,
    } as HTMLCanvasElement,

    // State
    save: jest.fn(() => calls.push({ method: 'save', args: [] })),
    restore: jest.fn(() => calls.push({ method: 'restore', args: [] })),

    // Transform
    translate: jest.fn((x: number, y: number) => calls.push({ method: 'translate', args: [x, y] })),
    scale: jest.fn((x: number, y: number) => calls.push({ method: 'scale', args: [x, y] })),
    rotate: jest.fn((angle: number) => calls.push({ method: 'rotate', args: [angle] })),

    // Path
    beginPath: jest.fn(() => calls.push({ method: 'beginPath', args: [] })),
    closePath: jest.fn(() => calls.push({ method: 'closePath', args: [] })),
    moveTo: jest.fn((x: number, y: number) => calls.push({ method: 'moveTo', args: [x, y] })),
    lineTo: jest.fn((x: number, y: number) => calls.push({ method: 'lineTo', args: [x, y] })),
    rect: jest.fn((x: number, y: number, w: number, h: number) => calls.push({ method: 'rect', args: [x, y, w, h] })),
    arc: jest.fn((x: number, y: number, r: number, start: number, end: number) => calls.push({ method: 'arc', args: [x, y, r, start, end] })),
    arcTo: jest.fn((x1: number, y1: number, x2: number, y2: number, r: number) => calls.push({ method: 'arcTo', args: [x1, y1, x2, y2, r] })),

    // Drawing
    fill: jest.fn(() => calls.push({ method: 'fill', args: [] })),
    stroke: jest.fn(() => calls.push({ method: 'stroke', args: [] })),
    fillRect: jest.fn((x: number, y: number, w: number, h: number) => calls.push({ method: 'fillRect', args: [x, y, w, h] })),
    strokeRect: jest.fn((x: number, y: number, w: number, h: number) => calls.push({ method: 'strokeRect', args: [x, y, w, h] })),
    clearRect: jest.fn((x: number, y: number, w: number, h: number) => calls.push({ method: 'clearRect', args: [x, y, w, h] })),

    // Text
    fillText: jest.fn((text: string, x: number, y: number, maxWidth?: number) => calls.push({ method: 'fillText', args: [text, x, y, maxWidth] })),
    strokeText: jest.fn((text: string, x: number, y: number, maxWidth?: number) => calls.push({ method: 'strokeText', args: [text, x, y, maxWidth] })),
    measureText: jest.fn((text: string) => ({
      width: text.length * 7, // Approximate width
    })),

    // Images
    drawImage: jest.fn((...args: unknown[]) => calls.push({ method: 'drawImage', args })),
    createImageData: jest.fn((w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })),
    getImageData: jest.fn((x: number, y: number, w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })),
    putImageData: jest.fn((...args: unknown[]) => calls.push({ method: 'putImageData', args })),

    // Clipping
    clip: jest.fn(() => calls.push({ method: 'clip', args: [] })),

    // Styles
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    lineDashOffset: 0,
    miterLimit: 10,

    // Text styles
    font: '13px sans-serif',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,

    // Shadows
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,

    // Global
    globalAlpha: 1,
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,

    // Helper to reset calls
    resetCalls: () => calls.length = 0,
  } as unknown as CanvasRenderingContext2D & { calls: { method: string; args: unknown[] }[]; resetCalls: () => void };

  return mockContext;
}

/**
 * 创建 Mock HTML Canvas Element
 */
export function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 800,
    height: 600,
    style: {},
    getBoundingClientRect: () => ({ width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600, x: 0, y: 0 }),
    getContext: jest.fn(() => createMockCanvasContext()),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  } as unknown as HTMLCanvasElement;

  return canvas;
}

/**
 * 创建测试用的简单列配置
 */
export function createTestColumns() {
  return [
    { key: 'id', title: 'ID', width: 80, type: 'number' as const },
    { key: 'name', title: 'Name', width: 120, type: 'text' as const, editable: true },
    { key: 'active', title: 'Active', width: 60, type: 'checkbox' as const },
    { key: 'progress', title: 'Progress', width: 100, type: 'progress' as const },
  ];
}

/**
 * 创建测试用的简单行数据
 */
export function createTestRows(count: number = 3) {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    data: {
      id: i + 1,
      name: `User ${i + 1}`,
      active: i % 2 === 0,
      progress: Math.round((i + 1) * 25),
    },
  }));
}
