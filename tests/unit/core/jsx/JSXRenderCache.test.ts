import { createCTElement } from '@/core/jsx/createCTElement';
import { JSXRenderCache } from '@/core/jsx/JSXRenderCache';
import { LayoutEngine } from '@/core/jsx/LayoutEngine';
import { MeasurementEngine } from '@/core/jsx/MeasurementEngine';

const createTree = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const layoutEngine = new LayoutEngine(new MeasurementEngine(ctx));
  const tree = createCTElement('CTBox', { width: 20, height: 20 });
  return layoutEngine.layoutTree(tree, 0, 0, { width: 20, height: 20 });
};

describe('JSXRenderCache', () => {
  it('reuses render plans and tracks hit/miss stats', () => {
    const cache = new JSXRenderCache({ maxPlans: 2 });
    const factory = jest.fn(createTree);

    const first = cache.getOrCreatePlan('card', factory);
    const second = cache.getOrCreatePlan('card', factory);

    expect(second).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(cache.getStats()).toMatchObject({ planHits: 1, planMisses: 1, planEvictions: 0 });
  });

  it('evicts least recently used render plans when capacity is exceeded', () => {
    const cache = new JSXRenderCache({ maxPlans: 2 });
    cache.getOrCreatePlan('a', createTree);
    cache.getOrCreatePlan('b', createTree);
    cache.getOrCreatePlan('a', createTree);
    cache.getOrCreatePlan('c', createTree);

    cache.getOrCreatePlan('b', createTree);

    expect(cache.getStats()).toMatchObject({ planHits: 1, planMisses: 4, planEvictions: 2 });
  });
});
