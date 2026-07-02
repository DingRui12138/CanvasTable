export interface CellOffscreenCacheStats {
  entries: number;
  bytes: number;
  hits: number;
  misses: number;
  evictions: number;
}

export interface CellOffscreenCacheOptions {
  maxEntries?: number;
  maxBytes?: number;
}

export class CellOffscreenCache {
  private readonly maxEntries: number;
  private readonly maxBytes: number;
  private readonly entries = new Map<string, HTMLCanvasElement>();
  private bytes = 0;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: CellOffscreenCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 1000;
    this.maxBytes = options.maxBytes ?? 64 * 1024 * 1024;
  }

  get(cacheKey: string): HTMLCanvasElement | undefined {
    const cached = this.entries.get(cacheKey);
    if (!cached) {
      this.misses++;
      return undefined;
    }
    this.hits++;
    // LRU: move to end
    this.entries.delete(cacheKey);
    this.entries.set(cacheKey, cached);
    return cached;
  }

  set(cacheKey: string, canvas: HTMLCanvasElement): void {
    const existing = this.entries.get(cacheKey);
    if (existing) {
      this.bytes -= existing.width * existing.height * 4;
      this.entries.delete(cacheKey);
    }

    const entryBytes = canvas.width * canvas.height * 4;
    this.entries.set(cacheKey, canvas);
    this.bytes += entryBytes;

    this.evictIfNeeded();
  }

  invalidateAll(): void {
    this.entries.clear();
    this.bytes = 0;
  }

  invalidateSize(oldSize: string): void {
    const prefix = `${oldSize}|`;
    const toDelete: string[] = [];
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      const canvas = this.entries.get(key);
      if (canvas) {
        this.bytes -= canvas.width * canvas.height * 4;
      }
      this.entries.delete(key);
    }
  }

  getStats(): CellOffscreenCacheStats {
    return {
      entries: this.entries.size,
      bytes: this.bytes,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
    };
  }

  private evictIfNeeded(): void {
    while (this.entries.size > this.maxEntries || this.bytes > this.maxBytes) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) break;
      const canvas = this.entries.get(oldestKey);
      if (canvas) {
        this.bytes -= canvas.width * canvas.height * 4;
      }
      this.entries.delete(oldestKey);
      this.evictions++;
    }
  }
}
