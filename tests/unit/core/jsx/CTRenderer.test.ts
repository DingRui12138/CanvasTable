// tests/unit/core/jsx/CTRenderer.test.ts
import { CTRenderer } from '@/core/jsx/CTRenderer';
import { LayoutEngine } from '@/core/jsx/LayoutEngine';
import { MeasurementEngine } from '@/core/jsx/MeasurementEngine';
import { createCTElement } from '@/core/jsx/createCTElement';
import type { TableTheme } from '@/types';

// Polyfill roundRect for jest-canvas-mock (not available in v2.5.2)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(
    x: number, y: number, w: number, h: number, radii: number | number[]
  ) {
    const radius = typeof radii === 'number' ? radii : radii[0] || 0;
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.lineTo(x + w, y + h - radius);
    this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.lineTo(x + radius, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

describe('CTRenderer', () => {
  let renderer: CTRenderer;
  let mockCtx: CanvasRenderingContext2D;
  let theme: TableTheme;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    mockCtx = canvas.getContext('2d')!;

    theme = {
      colors: {
        background: '#ffffff',
        headerBackground: '#f5f5f5',
        headerText: '#333333',
        rowBackground: '#ffffff',
        rowAltBackground: '#fafafa',
        rowHoverBackground: '#e6f7ff',
        rowSelectedBackground: '#bae7ff',
        cellText: '#333333',
        cellBorder: '#d9d9d9',
        selectionBorder: '#1890ff',
        linkColor: '#1890ff',
        placeholderText: '#bfbfbf',
        primary: '#1890ff',
        tagColors: {},
        date: { border: '#d9d9d9', icon: '#bfbfbf' },
        input: { border: '#d9d9d9', focusBorder: '#40a9ff', background: '#ffffff', text: '#333333', placeholder: '#bfbfbf' },
        checkbox: { border: '#d9d9d9', checkedBg: '#1890ff', checkmark: '#ffffff', disabledBg: '#f5f5f5' },
        radio: { border: '#d9d9d9', checkedBg: '#1890ff', dot: '#ffffff', disabledBg: '#f5f5f5' },
        switch: { onBg: '#1890ff', offBg: '#bfbfbf', thumb: '#ffffff', disabledOnBg: '#e6f7ff', disabledOffBg: '#f5f5f5' },
        button: { background: '#ffffff', text: '#333333', border: '#d9d9d9', hoverBg: '#f5f5f5', primaryBg: '#1890ff', primaryText: '#ffffff', dangerBg: '#ff4d4f', dangerText: '#ffffff', warningBg: '#faad14', warningText: '#ffffff', linkText: '#1890ff', disabledBg: '#f5f5f5', disabledText: '#bfbfbf', disabledBorder: '#d9d9d9' },
        dropdown: { background: '#ffffff', border: '#d9d9d9', hoverBg: '#f5f5f5', selectedBg: '#e6f7ff', text: '#333333' },
        scrollbar: { track: '#f0f0f0', thumb: '#d9d9d9', thumbHover: '#bfbfbf', thumbActive: '#999999', opacity: 0.8 },
        progress: { track: '#f0f0f0', default: '#1890ff', success: '#52c41a', warning: '#faad14', error: '#ff4d4f' },
        indicator: { active: '#1890ff', inactive: '#bfbfbf' },
        tooltip: { background: '#333333', text: '#ffffff', gap: 8 },
        image: { hoverBorder: '#1890ff', hoverShadow: 'rgba(0, 0, 0, 0.1)', placeholderBg: '#f5f5f5', errorBg: '#fff2f0', errorBorder: '#ffccc7' },
        hiddenPlaceholder: { hoverBg: '#e6f7ff' },
        moreCount: { background: '#f5f5f5', text: '#333333' },
        shadow: { color: 'rgba(0, 0, 0, 0.1)', blur: 4, offsetX: 0, offsetY: 2 },
        watermark: { color: '#bfbfbf', fontSize: 14, opacity: 0.1 },
      },
      font: { family: 'Arial', size: 14, headerSize: 14 },
      row: { height: 40, headerHeight: 40 },
      border: { width: 1, color: '#d9d9d9' },
    };

    const measurementEngine = new MeasurementEngine(mockCtx);
    const layoutEngine = new LayoutEngine(measurementEngine);
    renderer = new CTRenderer(mockCtx, layoutEngine, theme);
  });

  it('should render CTRect with fillRect', () => {
    const rect = createCTElement('CTRect', {
      width: 50,
      height: 30,
      backgroundColor: '#ff0000'
    });

    renderer.render(rect, 10, 20);

    // Check draw calls - jest-canvas-mock uses 'type' and 'props'
    const drawCalls = mockCtx.__getDrawCalls();
    const fillRectCall = drawCalls.find(c => c.type === 'fillRect');
    expect(fillRectCall).toBeDefined();
    expect(fillRectCall?.props).toEqual({ x: 10, y: 20, width: 50, height: 30 });
  });

  it('should render CTCircle with arc', () => {
    const circle = createCTElement('CTCircle', {
      radius: 15,
      backgroundColor: '#00ff00'
    });

    renderer.render(circle, 30, 30);

    const drawCalls = mockCtx.__getDrawCalls();
    // Circle center at (30 + 15, 30 + 15) = (45, 45)
    // The arc is inside a fill call's path array
    const fillCall = drawCalls.find(c => c.type === 'fill');
    expect(fillCall).toBeDefined();
    const arcCall = fillCall?.props.path?.find((p: any) => p.type === 'arc');
    expect(arcCall).toBeDefined();
    expect(arcCall?.props.x).toBe(45);
    expect(arcCall?.props.y).toBe(45);
    expect(arcCall?.props.radius).toBe(15);
  });

  it('should render CTText with fillText', () => {
    const text = createCTElement('CTText', {
      text: 'Hello',
      fontSize: 14,
      color: '#333333'
    });

    renderer.render(text, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    // fillText should be called
    const fillTextCall = drawCalls.find(c => c.type === 'fillText');
    expect(fillTextCall).toBeDefined();
    expect(fillTextCall?.props.text).toBe('Hello');
    expect(fillTextCall?.props.x).toBe(0);
  });

  it('should render CTGroup with children', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'row', gap: 8 },
      createCTElement('CTRect', { width: 20, height: 20, backgroundColor: '#aaa' }),
      createCTElement('CTText', { text: 'Label', fontSize: 12 })
    );

    renderer.render(group, 0, 0);

    // Should render both children - check draw calls
    const drawCalls = mockCtx.__getDrawCalls();
    expect(drawCalls.some(c => c.type === 'fillRect')).toBe(true);
    expect(drawCalls.some(c => c.type === 'fillText')).toBe(true);
  });

  it('should render CTRect with border', () => {
    const rect = createCTElement('CTRect', {
      width: 50,
      height: 30,
      borderColor: '#000000',
      borderWidth: 2
    });

    renderer.render(rect, 10, 10);

    const drawCalls = mockCtx.__getDrawCalls();
    // strokeRect should be called for border without fill
    const strokeRectCall = drawCalls.find(c => c.type === 'strokeRect');
    expect(strokeRectCall).toBeDefined();
    expect(strokeRectCall?.props).toEqual({ x: 10, y: 10, width: 50, height: 30 });
  });

  it('should render CTRect with borderRadius', () => {
    const rect = createCTElement('CTRect', {
      width: 50,
      height: 30,
      backgroundColor: '#ff0000',
      borderRadius: 5
    });

    renderer.render(rect, 10, 10);

    const drawCalls = mockCtx.__getDrawCalls();
    // Our polyfill uses beginPath + path methods + fill
    // The fill call contains the path
    const fillCall = drawCalls.find(c => c.type === 'fill');
    expect(fillCall).toBeDefined();
    expect(fillCall?.props.path?.length).toBeGreaterThan(1);
  });

  it('should render CTGroup with background', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'row', gap: 8, backgroundColor: '#e6f7ff', width: 100, height: 40 },
      createCTElement('CTRect', { width: 20, height: 20, backgroundColor: '#aaa' }),
      createCTElement('CTText', { text: 'Label', fontSize: 12 })
    );

    renderer.render(group, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    // Should draw background first - fillRect at (0, 0) with (100, 40)
    const fillRectCalls = drawCalls.filter(c => c.type === 'fillRect');
    expect(fillRectCalls.length).toBeGreaterThanOrEqual(1);
    // First fillRect is the group background
    const firstFillRect = fillRectCalls[0];
    expect(firstFillRect?.props.x).toBe(0);
    expect(firstFillRect?.props.y).toBe(0);
    expect(firstFillRect?.props.width).toBe(100);
    expect(firstFillRect?.props.height).toBe(40);

    // Should also render children
    expect(drawCalls.some(c => c.type === 'fillText')).toBe(true);
  });
});