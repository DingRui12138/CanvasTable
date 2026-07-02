import { CellOffscreenCache } from '@/core/jsx/CellOffscreenCache';

const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
};

describe('CellOffscreenCache', () => {
  it('returns undefined on miss and tracks stats', () => {
    const cache = new CellOffscreenCache({ maxEntries: 10, maxBytes: 1024 * 1024 });
    expect(cache.get('60x32|sig-a')).toBeUndefined();
    expect(cache.getStats()).toMatchObject({ hits: 0, misses: 1, entries: 0, bytes: 0 });
  });

  it('stores and retrieves canvases, tracking bytes', () => {
    const cache = new CellOffscreenCache({ maxEntries: 10, maxBytes: 1024 * 1024 });
    const canvas = makeCanvas(60, 32);
    cache.set('60x32|sig-a', canvas);
    expect(cache.get('60x32|sig-a')).toBe(canvas);
    expect(cache.getStats()).toMatchObject({
      hits: 1,
      misses: 0,
      entries: 1,
      bytes: 60 * 32 * 4,
    });
  });

  it('evicts least recently used when maxEntries exceeded', () => {
    const cache = new CellOffscreenCache({ maxEntries: 2, maxBytes: 1024 * 1024 });
    cache.set('60x32|sig-a', makeCanvas(60, 32));
    cache.set('60x32|sig-b', makeCanvas(60, 32));
    cache.get('60x32|sig-a'); // make sig-a most recent
    cache.set('60x32|sig-c', makeCanvas(60, 32)); // should evict sig-b
    expect(cache.get('60x32|sig-b')).toBeUndefined();
    expect(cache.get('60x32|sig-a')).toBeDefined();
    expect(cache.getStats()).toMatchObject({ evictions: 1, entries: 2 });
  });

  it('evicts when maxBytes exceeded', () => {
    const cache = new CellOffscreenCache({
      maxEntries: 100,
      maxBytes: 60 * 32 * 4 * 2, // exactly 2 canvases
    });
    cache.set('60x32|sig-a', makeCanvas(60, 32));
    cache.set('60x32|sig-b', makeCanvas(60, 32));
    cache.set('60x32|sig-c', makeCanvas(60, 32)); // evict sig-a
    expect(cache.get('60x32|sig-a')).toBeUndefined();
    expect(cache.getStats()).toMatchObject({ evictions: 1, entries: 2 });
  });

  it('invalidateAll clears everything and resets bytes', () => {
    const cache = new CellOffscreenCache({ maxEntries: 10, maxBytes: 1024 * 1024 });
    cache.set('60x32|sig-a', makeCanvas(60, 32));
    cache.set('80x32|sig-b', makeCanvas(80, 32));
    cache.invalidateAll();
    expect(cache.getStats()).toMatchObject({ entries: 0, bytes: 0 });
    expect(cache.get('60x32|sig-a')).toBeUndefined();
  });

  it('invalidateSize removes only entries matching the size prefix', () => {
    const cache = new CellOffscreenCache({ maxEntries: 10, maxBytes: 1024 * 1024 });
    cache.set('60x32|sig-a', makeCanvas(60, 32));
    cache.set('60x32|sig-b', makeCanvas(60, 32));
    cache.set('80x32|sig-c', makeCanvas(80, 32));
    cache.invalidateSize('60x32');
    expect(cache.get('60x32|sig-a')).toBeUndefined();
    expect(cache.get('60x32|sig-b')).toBeUndefined();
    expect(cache.get('80x32|sig-c')).toBeDefined();
    expect(cache.getStats()).toMatchObject({
      entries: 1,
      bytes: 80 * 32 * 4,
    });
  });

  it('invalidateSize does not match partial size strings (strict prefix)', () => {
    const cache = new CellOffscreenCache({ maxEntries: 10, maxBytes: 1024 * 1024 });
    cache.set('60x32|sig-a', makeCanvas(60, 32));
    cache.set('160x32|sig-b', makeCanvas(160, 32));
    cache.invalidateSize('60x32');
    expect(cache.get('60x32|sig-a')).toBeUndefined();
    expect(cache.get('160x32|sig-b')).toBeDefined();
  });
});
