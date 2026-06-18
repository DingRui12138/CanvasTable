// Jest setup file
// Add custom matchers or global setup here

// Mock Canvas
import 'jest-canvas-mock';

// Polyfill CanvasRenderingContext2D.roundRect — jest-canvas-mock doesn't
// implement it, but our renderers depend on it. Match the spec signature
// (radii: number | number[]) but only need a no-op for unit tests since
// jest-canvas-mock doesn't actually paint anything.
if (typeof CanvasRenderingContext2D !== 'undefined') {
  const proto = CanvasRenderingContext2D.prototype as unknown as {
    roundRect?: (x: number, y: number, w: number, h: number, radii?: number | number[]) => void;
  };
  if (typeof proto.roundRect !== 'function') {
    proto.roundRect = function (this: CanvasRenderingContext2D, x, y, w, h) {
      // Fall back to a plain rect; visual fidelity isn't checked in unit tests.
      this.rect(x, y, w, h);
    };
  }
}

// Mock requestAnimationFrame for animations
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(callback, 16) as unknown as number;
};

global.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
  writable: true,
});