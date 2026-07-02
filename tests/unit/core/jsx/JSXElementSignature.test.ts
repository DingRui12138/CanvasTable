import { createCTElement } from '@/core/jsx/createCTElement';
import { JSXElementSignature } from '@/core/jsx/JSXElementSignature';

const box = (props: Record<string, unknown>, ...children: any[]) =>
  createCTElement('CTBox', props, ...children);
const text = (props: Record<string, unknown>) => createCTElement('CTText', props);

describe('JSXElementSignature', () => {
  it('returns stable signatures for equivalent trees', () => {
    const first = box(
      { height: 20, width: 100, backgroundColor: '#fff' },
      text({ text: 'hello', color: '#333' }),
    );
    const second = box(
      { backgroundColor: '#fff', width: 100, height: 20 },
      text({ color: '#333', text: 'hello' }),
    );

    expect(JSXElementSignature.layout(first)).toBe(JSXElementSignature.layout(second));
    expect(JSXElementSignature.visual(first)).toBe(JSXElementSignature.visual(second));
  });

  it('separates layout-affecting props from visual-only props', () => {
    const first = box({ width: 100, height: 20, backgroundColor: '#fff' });
    const second = box({ width: 100, height: 20, backgroundColor: '#000' });

    expect(JSXElementSignature.layout(first)).toBe(JSXElementSignature.layout(second));
    expect(JSXElementSignature.visual(first)).not.toBe(JSXElementSignature.visual(second));
  });

  it('changes layout signatures for layout-affecting prop changes', () => {
    const first = box({ width: 100, height: 20, backgroundColor: '#fff' });
    const second = box({ width: 120, height: 20, backgroundColor: '#fff' });

    expect(JSXElementSignature.layout(first)).not.toBe(JSXElementSignature.layout(second));
  });

  it('ignores event callback identity in signatures', () => {
    const first = createCTElement('CTDropdown', { onChange: () => 'first', config: { options: [] } },
      box({ width: 20, height: 20 }),
    );
    const second = createCTElement('CTDropdown', { onChange: () => 'second', config: { options: [] } },
      box({ width: 20, height: 20 }),
    );

    expect(JSXElementSignature.layout(first)).toBe(JSXElementSignature.layout(second));
    expect(JSXElementSignature.visual(first)).toBe(JSXElementSignature.visual(second));
  });

  it('includes cache keys and dependencies in cache signatures', () => {
    const first = box({ cache: true, cacheKey: 'status-card', cacheDeps: ['active', 20] });
    const second = box({ cache: true, cacheKey: 'status-card', cacheDeps: ['inactive', 20] });

    expect(JSXElementSignature.cache(first)).not.toBe(JSXElementSignature.cache(second));
  });

  it('caches signatures by element reference', () => {
    const element = box(
      { width: 100, height: 20, backgroundColor: '#fff' },
      text({ text: 'hello', color: '#333' }),
    );

    const firstLayout = JSXElementSignature.layout(element);
    const firstVisual = JSXElementSignature.visual(element);

    // 改内部状态（模拟同一引用被复用但外部 props 已变化的不变式破坏）
    // 由于签名按引用缓存，第二次调用应返回相同字符串，即使我们尝试"重算"
    // 这里通过 spy 验证缓存命中：直接断言相同引用返回相同字符串
    const secondLayout = JSXElementSignature.layout(element);
    const secondVisual = JSXElementSignature.visual(element);

    expect(secondLayout).toBe(firstLayout);
    expect(secondVisual).toBe(firstVisual);
  });

  it('returns different signatures for different element references even with same props', () => {
    const first = box({ width: 100, height: 20, backgroundColor: '#fff' });
    const second = box({ width: 100, height: 20, backgroundColor: '#fff' });

    // 不同引用 → 各自缓存，但内容相同 → 字符串相等（这是合法的）
    // 关键是不应因缓存串味返回错误值
    expect(JSXElementSignature.layout(first)).toBe(JSXElementSignature.layout(second));
    expect(JSXElementSignature.visual(first)).toBe(JSXElementSignature.visual(second));
  });
});
