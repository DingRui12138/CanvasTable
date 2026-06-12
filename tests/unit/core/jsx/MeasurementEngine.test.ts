import { MeasurementEngine } from '@/core/jsx/MeasurementEngine';
import type { CTElement } from '@/core/jsx/types';

describe('MeasurementEngine', () => {
  let engine: MeasurementEngine;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    mockCtx = canvas.getContext('2d')!;
    engine = new MeasurementEngine(mockCtx);
  });

  it('should measure text width', () => {
    mockCtx.font = '14px Arial';
    const width = engine.measureTextWidth('Hello World', 14, 'Arial');

    expect(width).toBeGreaterThan(0);
    expect(typeof width).toBe('number');
  });

  it('should measure CTText element', () => {
    const textElement: CTElement = {
      type: 'CTText',
      props: { text: 'Test', fontSize: 12 },
      children: [],
    };

    const size = engine.measureElement(textElement);
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBe(12);
  });

  it('should use lineHeight for CTText height', () => {
    const textElement: CTElement = {
      type: 'CTText',
      props: { text: 'Test', fontSize: 12, lineHeight: 18 },
      children: [],
    };

    const size = engine.measureElement(textElement);
    expect(size.height).toBe(18);
  });

  it('should return fixed size for CTBox', () => {
    const rectElement: CTElement = {
      type: 'CTBox',
      props: { width: 50, height: 30 },
      children: [],
    };

    const size = engine.measureElement(rectElement);
    expect(size.width).toBe(50);
    expect(size.height).toBe(30);
  });

  it('should return fixed size for CTCircle', () => {
    const circleElement: CTElement = {
      type: 'CTCircle',
      props: { radius: 20 },
      children: [],
    };

    const size = engine.measureElement(circleElement);
    expect(size.width).toBe(40);
    expect(size.height).toBe(40);
  });

  it('should handle maxWidth constraint', () => {
    const textElement: CTElement = {
      type: 'CTText',
      props: { text: 'Very long text', fontSize: 14, maxWidth: 50 },
      children: [],
    };

    const size = engine.measureElement(textElement);
    expect(size.width).toBeLessThanOrEqual(50);
  });
});