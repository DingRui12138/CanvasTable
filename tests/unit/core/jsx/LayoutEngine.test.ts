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
    const rect = createCTElement('CTBox', { width: 50, height: 30 });
    const layouts = engine.layout(rect, 0, 0);

    expect(layouts[0]!.x).toBe(0);
    expect(layouts[0]!.y).toBe(0);
    expect(layouts[0]!.width).toBe(50);
    expect(layouts[0]!.height).toBe(30);
  });

  it('should layout row direction with gap', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', gap: 8 },
      createCTElement('CTBox', { width: 20, height: 20 }),
      createCTElement('CTBox', { width: 30, height: 20 })
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
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'column', gap: 4 },
      createCTElement('CTBox', { width: 20, height: 15 }),
      createCTElement('CTBox', { width: 20, height: 15 })
    );

    const layouts = engine.layout(group, 0, 0);

    expect(layouts[0]!.x).toBe(0);
    expect(layouts[0]!.y).toBe(0);
    expect(layouts[1]!.x).toBe(0);
    expect(layouts[1]!.y).toBe(19); // 15 + 4
  });

  it('should handle justifyContent center', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', justifyContent: 'center', width: 100 },
      createCTElement('CTBox', { width: 30, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // Single element centered in 100 width: (100 - 30) / 2 = 35
    expect(layouts[0]!.x).toBe(35);
  });

  it('should handle alignItems center', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', alignItems: 'center', height: 40 },
      createCTElement('CTBox', { width: 20, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // Element centered vertically: (40 - 20) / 2 = 10
    expect(layouts[0]!.y).toBe(10);
  });

  it('should handle justifyContent space-between', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: 100 },
      createCTElement('CTBox', { width: 20, height: 20 }),
      createCTElement('CTBox', { width: 20, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // First at 0, second at 100 - 20 = 80
    expect(layouts[0]!.x).toBe(0);
    expect(layouts[1]!.x).toBe(80);
  });

  it('should handle padding', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', padding: 10 },
      createCTElement('CTBox', { width: 20, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    // Element offset by padding
    expect(layouts[0]!.x).toBe(10);
    expect(layouts[0]!.y).toBe(10);
  });

  it('should handle asymmetric padding', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', padding: { top: 5, left: 10, right: 5, bottom: 8 } },
      createCTElement('CTBox', { width: 20, height: 20 })
    );

    const layouts = engine.layout(group, 0, 0);

    expect(layouts[0]!.x).toBe(10);
    expect(layouts[0]!.y).toBe(5);
  });

  it('should handle nested groups', () => {
    const inner = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'column', gap: 4 },
      createCTElement('CTBox', { width: 20, height: 10 }),
      createCTElement('CTBox', { width: 20, height: 10 })
    );
    const outer = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', gap: 8 },
      inner,
      createCTElement('CTBox', { width: 20, height: 24 })
    );

    const layouts = engine.layout(outer, 0, 0);

    // Inner group first child at (0, 0)
    expect(layouts[0]!.x).toBe(0);
    expect(layouts[0]!.y).toBe(0);
    // Inner group second child at (0, 14)
    expect(layouts[1]!.x).toBe(0);
    expect(layouts[1]!.y).toBe(14);
    // Inner group layout (width=20, height=24)
    expect(layouts[2]!.x).toBe(0);
    expect(layouts[2]!.width).toBe(20);
    expect(layouts[2]!.height).toBe(24);
    // Outer rect at (20 + 8 = 28, 0)
    expect(layouts[3]!.x).toBe(28);
    expect(layouts[3]!.y).toBe(0);
  });

  // ─── New style tests ───

  it('should handle margin on child items', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', alignItems: 'center', height: 40 },
      createCTElement('CTBox', { width: 20, height: 20, margin: { top: 5, left: 10 } })
    );

    const layouts = engine.layout(group, 0, 0);

    // Child position: (0 + 10 margin.left, 0 + (40-20)/2 center + 5 margin.top)
    // Without margin, child would be at y=10 (center in 40). With margin.top=5, child is at y=10+5=15
    // Wait - margin is included in size for flex spacing, then offset from that
    // The child size including margin: (20+10, 20+5) = (30, 25)
    // center offset = (40-25)/2 = 7.5
    // child x = 0 + 0 + 10 = 10, child y = 0 + 7.5 + 5 = 12.5
    expect(layouts[0]!.x).toBe(10);
  });

  it('should handle minWidth/maxWidth size constraints', () => {
    const rect = createCTElement('CTBox', { width: 50, height: 30, minWidth: 60 });
    const layouts = engine.layout(rect, 0, 0);

    // Width should be clamped to minWidth: max(60, 50) = 60
    expect(layouts[0]!.width).toBe(60);
  });

  it('should handle maxWidth size constraints', () => {
    const rect = createCTElement('CTBox', { width: 100, height: 30, maxWidth: 80 });
    const layouts = engine.layout(rect, 0, 0);

    // Width should be clamped to maxWidth: min(80, 100) = 80
    expect(layouts[0]!.width).toBe(80);
  });

  it('should handle alignSelf override', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', height: 40 },
      createCTElement('CTBox', { width: 20, height: 20, alignSelf: 'center' })
    );

    const layouts = engine.layout(group, 0, 0);

    // alignItems is flex-start, but child has alignSelf=center → (40-20)/2 = 10
    expect(layouts[0]!.y).toBe(10);
  });

  it('should handle justifyContent space-around', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', justifyContent: 'space-around', width: 100 },
      createCTElement('CTBox', { width: 20, height: 20 }),
      createCTElement('CTBox', { width: 20, height: 20 })
    );

    const tree = engine.layoutTree(group, 0, 0);

    // Total child width = 40, available = 100, space per child = 60/2 = 30
    // First child: offset = 30/2 = 15, x = 15
    // Second child: offset = 15 + 20 + 30 = 65
    expect(tree.children[0]!.x).toBe(15);
    expect(tree.children[1]!.x).toBe(65);
  });

  it('should handle justifyContent space-evenly', () => {
    const group = createCTElement('CTBox',
      { display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', width: 100 },
      createCTElement('CTBox', { width: 20, height: 20 }),
      createCTElement('CTBox', { width: 20, height: 20 })
    );

    const tree = engine.layoutTree(group, 0, 0);

    // Total child width = 40, available = 100, space = 60/3 = 20
    // First child: x = 20, second child: x = 20 + 20 + 20 = 60
    expect(tree.children[0]!.x).toBe(20);
    expect(tree.children[1]!.x).toBe(60);
  });

  describe('layoutTree', () => {
    it('returns tree structure with correct nested positions', () => {
      const tree = createCTElement(
        'CTBox',
        { display: 'flex', padding: 10, width: 100, height: 60 },
        createCTElement(
          'CTBox',
          { display: 'flex', padding: 5, width: 80, height: 40 },
          createCTElement('CTText', { text: 'hello' }),
        ),
      );

      const root = engine.layoutTree(tree, 0, 0);

      expect(root.x).toBe(0);
      expect(root.y).toBe(0);
      expect(root.width).toBe(100);
      expect(root.height).toBe(60);
      expect(root.children).toHaveLength(1);

      const innerBox = root.children[0]!;
      expect(innerBox.x).toBe(10);
      expect(innerBox.y).toBe(10);
      expect(innerBox.width).toBe(80);
      expect(innerBox.height).toBe(40);
      expect(innerBox.children).toHaveLength(1);

      const innerText = innerBox.children[0]!;
      expect(innerText.x).toBe(15);
      expect(innerText.y).toBe(15);
    });

    it('keeps layout cache enabled for event callback props', () => {
      const firstOnChange = () => undefined;
      const firstTree = createCTElement(
        'CTDropdown',
        { config: { options: [] }, onChange: firstOnChange },
        createCTElement('CTBox', { width: 20, height: 20 }),
      );
      const firstNode = engine.layoutTree(firstTree, 0, 0);

      const secondOnChange = () => undefined;
      const secondTree = createCTElement(
        'CTDropdown',
        { config: { options: [] }, onChange: secondOnChange },
        createCTElement('CTBox', { width: 20, height: 20 }),
      );
      const secondNode = engine.layoutTree(secondTree, 50, 30);

      expect(firstNode.width).toBe(20);
      expect(secondNode.width).toBe(20);
      expect(secondNode.x).toBe(50);
      expect(secondNode.y).toBe(30);
      expect(secondNode.currentElement?.props.onChange).toBe(secondOnChange);
      expect(secondNode.currentElement?.props.onChange).not.toBe(firstOnChange);
    });

    it('uses explicit cache keys without building tree signatures', () => {
      const measuredSteps: string[] = [];
      const trace = {
        measure<T>(name: string, fn: () => T): T {
          measuredSteps.push(name);
          return fn();
        },
        add() {},
        markBranch() {},
      };
      const tracedEngine = new LayoutEngine(new MeasurementEngine(mockCtx), trace);
      const tree = createCTElement(
        'CTBox',
        { display: 'flex', width: 100, height: 40, gap: 4 },
        createCTElement('CTBox', { width: 20, height: 20 }),
      );

      tracedEngine.layoutTree(tree, 0, 0, { width: 100, height: 40 }, 'stable-status-layout');
      tracedEngine.layoutTree(tree, 10, 10, { width: 100, height: 40 }, 'stable-status-layout');

      expect(measuredSteps).toContain('jsx.layout.explicitCacheKey');
      expect(measuredSteps).not.toContain('jsx.layout.cacheKey');
      expect(measuredSteps).toContain('jsx.layout.cacheHit');
    });

    it('traces layout cache key, lookup, clone, layout, and write phases', () => {
      const measuredSteps: string[] = [];
      const trace = {
        measure<T>(name: string, fn: () => T): T {
          measuredSteps.push(name);
          return fn();
        },
        add() {},
        markBranch() {},
      };
      const tracedEngine = new LayoutEngine(new MeasurementEngine(mockCtx), trace);
      const tree = createCTElement(
        'CTBox',
        { display: 'flex', width: 100, height: 40, gap: 4 },
        createCTElement('CTBox', { width: 20, height: 20 }),
      );

      tracedEngine.layoutTree(tree, 0, 0, { width: 100, height: 40 });
      tracedEngine.layoutTree(tree, 10, 10, { width: 100, height: 40 });

      expect(measuredSteps).toEqual(expect.arrayContaining([
        'jsx.layout.cacheKey',
        'jsx.layout.cacheLookup',
        'jsx.layout.layoutNode.root',
        'jsx.layout.cacheWrite',
        'jsx.layout.cacheHit',
      ]));
    });

    it('handles leaf elements without children', () => {
      const text = createCTElement('CTText', { text: 'hello' });
      const node = engine.layoutTree(text, 50, 30);

      expect(node.element.type).toBe('CTText');
      expect(node.x).toBe(50);
      expect(node.y).toBe(30);
      expect(node.children).toHaveLength(0);
    });
  });
});