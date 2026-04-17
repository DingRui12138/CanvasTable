// tests/unit/core/jsx/LayoutEngine.test.ts
import { LayoutEngine } from '@/core/jsx/LayoutEngine';
import { MeasurementEngine } from '@/core/jsx/MeasurementEngine';
import { createCTElement } from '@/core/jsx/createCTElement';

describe('LayoutEngine', () => {
  let engine: LayoutEngine;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    mockCtx = canvas.getContext('2d')!;
    const measurementEngine = new MeasurementEngine(mockCtx);
    engine = new LayoutEngine(measurementEngine);
  });

  it('should layout single element at origin', () => {
    const rect = createCTElement('CTRect', { width: 50, height: 30 });
    const layouts = engine.layout(rect, 0, 0);

    expect(layouts[0]!.x).toBe(0);
    expect(layouts[0]!.y).toBe(0);
    expect(layouts[0]!.width).toBe(50);
    expect(layouts[0]!.height).toBe(30);
  });

  it('should layout row direction with gap', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'row', gap: 8 },
      createCTElement('CTRect', { width: 20, height: 20 }),
      createCTElement('CTRect', { width: 30, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // First rect at (0, 0)
    expect(layouts[0]!.x).toBe(0);
    expect(layouts[0]!.y).toBe(0);

    // Second rect at (20 + 8 = 28, 0)
    expect(layouts[1]!.x).toBe(28);
    expect(layouts[1]!.y).toBe(0);
  });

  it('should layout column direction', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'column', gap: 4 },
      createCTElement('CTRect', { width: 20, height: 15 }),
      createCTElement('CTRect', { width: 20, height: 15 })
    );

    const layouts = engine.layout(group, 0, 0);

    expect(layouts[0]!.x).toBe(0);
    expect(layouts[0]!.y).toBe(0);
    expect(layouts[1]!.x).toBe(0);
    expect(layouts[1]!.y).toBe(19); // 15 + 4
  });

  it('should handle justifyContent center', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'row', justifyContent: 'center', width: 100 },
      createCTElement('CTRect', { width: 30, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // Single element centered in 100 width: (100 - 30) / 2 = 35
    expect(layouts[0]!.x).toBe(35);
  });

  it('should handle alignItems center', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'row', alignItems: 'center', height: 40 },
      createCTElement('CTRect', { width: 20, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // Element centered vertically: (40 - 20) / 2 = 10
    expect(layouts[0]!.y).toBe(10);
  });

  it('should handle justifyContent space-between', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: 100 },
      createCTElement('CTRect', { width: 20, height: 20 }),
      createCTElement('CTRect', { width: 20, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // First at 0, second at 100 - 20 = 80
    expect(layouts[0]!.x).toBe(0);
    expect(layouts[1]!.x).toBe(80);
  });

  it('should handle padding', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', padding: 10 },
      createCTElement('CTRect', { width: 20, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // Element offset by padding
    expect(layouts[0]!.x).toBe(10);
    expect(layouts[0]!.y).toBe(10);
  });

  it('should handle asymmetric padding', () => {
    const group = createCTElement('CTGroup',
      { display: 'flex', padding: { top: 5, left: 10, right: 5, bottom: 8 } },
      createCTElement('CTRect', { width: 20, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    expect(layouts[0]!.x).toBe(10);
    expect(layouts[0]!.y).toBe(5);
  });

  it('should handle nested groups', () => {
    const inner = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'column', gap: 4 },
      createCTElement('CTRect', { width: 20, height: 10 }),
      createCTElement('CTRect', { width: 20, height: 10 })
    );
    const outer = createCTElement('CTGroup',
      { display: 'flex', flexDirection: 'row', gap: 8 },
      inner,
      createCTElement('CTRect', { width: 20, height: 24 })
    );

    const layouts = engine.layout(outer, 0, 0);

    // Inner group first child at (0, 0)
    expect(layouts[0]!.x).toBe(0);
    expect(layouts[0]!.y).toBe(0);
    // Inner group second child at (0, 14)
    expect(layouts[1]!.x).toBe(0);
    expect(layouts[1]!.y).toBe(14);
    // Outer rect at (20 + 8 = 28, 0)
    expect(layouts[2]!.x).toBe(28);
    expect(layouts[2]!.y).toBe(0);
  });
});