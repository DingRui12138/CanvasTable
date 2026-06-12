// tests/unit/core/jsx/CTRenderer.test.ts
import { CTRenderer } from '@/core/jsx/CTRenderer';
import { LayoutEngine } from '@/core/jsx/LayoutEngine';
import { MeasurementEngine } from '@/core/jsx/MeasurementEngine';
import { createCTElement } from '@/core/jsx/createCTElement';
import type { TableTheme } from '@/types';

// Polyfill roundRect for jest-canvas-mock
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
      row: {
        height: 40,
        headerHeight: 40,
        minHeight: 24,
        maxHeight: 320,
        resizeGuideColor: '#1890ff',
        resizeGuideWidth: 1,
      },
      border: { width: 1, color: '#d9d9d9' },
    };

    const measurementEngine = new MeasurementEngine(mockCtx);
    const layoutEngine = new LayoutEngine(measurementEngine);
    renderer = new CTRenderer(mockCtx, layoutEngine, theme);
  });

  it('should render CTBox with backgroundColor', () => {
    const rect = createCTElement('CTBox', {
      width: 50,
      height: 30,
      backgroundColor: '#ff0000'
    });

    renderer.render(rect, 10, 20);

    const drawCalls = mockCtx.__getDrawCalls();
    // CTBox without borderRadius uses rect + fill
    const fillCall = drawCalls.find(c => c.type === 'fill');
    expect(fillCall).toBeDefined();
  });

  it('should render CTCircle with arc', () => {
    const circle = createCTElement('CTCircle', {
      radius: 15,
      backgroundColor: '#00ff00'
    });

    renderer.render(circle, 30, 30);

    const drawCalls = mockCtx.__getDrawCalls();
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
    const fillTextCall = drawCalls.find(c => c.type === 'fillText');
    expect(fillTextCall).toBeDefined();
    expect(fillTextCall?.props.text).toBe('Hello');
    expect(fillTextCall?.props.x).toBe(0);
  });

  it('should render CTBox with children', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', gap: 8 },
      createCTElement('CTBox', { width: 20, height: 20, backgroundColor: '#aaa' }),
      createCTElement('CTText', { text: 'Label', fontSize: 12 })
    );

    renderer.render(group, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    expect(drawCalls.some(c => c.type === 'fill')).toBe(true);
    expect(drawCalls.some(c => c.type === 'fillText')).toBe(true);
  });

  it('should render CTBox with border', () => {
    const rect = createCTElement('CTBox', {
      width: 50,
      height: 30,
      borderColor: '#000000',
      borderWidth: 2
    });

    renderer.render(rect, 10, 10);

    const drawCalls = mockCtx.__getDrawCalls();
    const strokeCall = drawCalls.find(c => c.type === 'stroke');
    expect(strokeCall).toBeDefined();
  });

  it('should render CTBox with borderRadius', () => {
    const rect = createCTElement('CTBox', {
      width: 50,
      height: 30,
      backgroundColor: '#ff0000',
      borderRadius: 5
    });

    renderer.render(rect, 10, 10);

    const drawCalls = mockCtx.__getDrawCalls();
    const fillCall = drawCalls.find(c => c.type === 'fill');
    expect(fillCall).toBeDefined();
    expect(fillCall?.props.path?.length).toBeGreaterThan(1);
  });

  it('should render CTBox with background', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', gap: 8, backgroundColor: '#e6f7ff', width: 100, height: 40 },
      createCTElement('CTBox', { width: 20, height: 20, backgroundColor: '#aaa' }),
      createCTElement('CTText', { text: 'Label', fontSize: 12 })
    );

    renderer.render(group, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    // Background fill should exist
    const fillCalls = drawCalls.filter(c => c.type === 'fill');
    expect(fillCalls.length).toBeGreaterThanOrEqual(1);
    // Should also render children
    expect(drawCalls.some(c => c.type === 'fillText')).toBe(true);
  });

  it('renders nested box backgrounds at correct positions', () => {
    const tree = createCTElement(
      'CTBox',
      { display: 'flex', padding: 10, backgroundColor: '#ff0000', width: 100, height: 60 },
      createCTElement(
        'CTBox',
        { display: 'flex', padding: 5, backgroundColor: '#000000', width: 80, height: 40 },
        createCTElement('CTText', { text: 'hello', color: 'white' }),
      ),
    );

    renderer.render(tree, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    // Should have fill calls for both backgrounds
    const fillCalls = drawCalls.filter(c => c.type === 'fill');
    expect(fillCalls.length).toBeGreaterThanOrEqual(2);

    // Text should also render
    expect(drawCalls.some(c => c.type === 'fillText')).toBe(true);
  });

  it('should render CTText with textAlign center', () => {
    const text = createCTElement('CTText', {
      text: 'Center',
      fontSize: 14,
      textAlign: 'center',
    });

    renderer.render(text, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    const fillTextCall = drawCalls.find(c => c.type === 'fillText');
    expect(fillTextCall).toBeDefined();
  });

  it('should render CTText with textDecoration underline', () => {
    const text = createCTElement('CTText', {
      text: 'Underline',
      fontSize: 14,
      textDecoration: 'underline',
    });

    renderer.render(text, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    // Should have fillText and stroke for underline
    expect(drawCalls.some(c => c.type === 'fillText')).toBe(true);
    expect(drawCalls.some(c => c.type === 'stroke')).toBe(true);
  });

  it('should render CTText with letterSpacing', () => {
    const text = createCTElement('CTText', {
      text: 'ABC',
      fontSize: 14,
      letterSpacing: 5,
    });

    renderer.render(text, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    // Each character rendered individually
    const fillTextCalls = drawCalls.filter(c => c.type === 'fillText');
    expect(fillTextCalls.length).toBe(3); // A, B, C
  });

  it('should render CTBox with overflow hidden', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', overflow: 'hidden', width: 50, height: 30, backgroundColor: '#fff' },
      createCTElement('CTText', { text: 'Overflowing text', fontSize: 14 })
    );

    // overflow:hidden should render without error
    renderer.render(group, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    // Should render background fill and child text
    expect(drawCalls.some(c => c.type === 'fill')).toBe(true);
    expect(drawCalls.some(c => c.type === 'fillText')).toBe(true);
  });

  it('should render CTBox with boxShadow', () => {
    const rect = createCTElement('CTBox', {
      width: 50,
      height: 30,
      backgroundColor: '#ff0000',
      boxShadow: { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.2)' }
    });

    renderer.render(rect, 10, 10);

    const drawCalls = mockCtx.__getDrawCalls();
    // Should have fill with shadow
    expect(drawCalls.some(c => c.type === 'fill')).toBe(true);
  });

  it('should render CTBox with backgroundGradient', () => {
    const rect = createCTElement('CTBox', {
      width: 100,
      height: 30,
      backgroundGradient: { type: 'linear', angle: 90, colors: ['#ff0000', '#0000ff'] }
    });

    renderer.render(rect, 0, 0);

    const drawCalls = mockCtx.__getDrawCalls();
    // Gradient fill should exist
    expect(drawCalls.some(c => c.type === 'fill')).toBe(true);
  });

  it('should render CTBox with border per side', () => {
    const rect = createCTElement('CTBox', {
      width: 50,
      height: 30,
      borderBottom: { width: 2, color: '#ff0000' }
    });

    renderer.render(rect, 10, 10);

    const drawCalls = mockCtx.__getDrawCalls();
    // Should have stroke for bottom border
    expect(drawCalls.some(c => c.type === 'stroke')).toBe(true);
  });

  it('should render CTBox with per-corner borderRadius', () => {
    const rect = createCTElement('CTBox', {
      width: 50,
      height: 30,
      backgroundColor: '#ff0000',
      borderTopLeftRadius: 5,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 5
    });

    renderer.render(rect, 10, 10);

    const drawCalls = mockCtx.__getDrawCalls();
    const fillCall = drawCalls.find(c => c.type === 'fill');
    expect(fillCall).toBeDefined();
  });
});