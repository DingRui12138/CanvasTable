import type { CTElement } from './types';

interface SignatureCacheEntry {
  layout: string;
  visual: string;
}

const SIGNATURE_CACHE = new WeakMap<CTElement, SignatureCacheEntry>();

const LAYOUT_PROPS = new Set([
  'type',
  'display',
  'position',
  'x',
  'y',
  'zIndex',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'padding',
  'margin',
  'gap',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'alignSelf',
  'radius',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'lineHeight',
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'letterSpacing',
  'text',
]);

const CACHE_PROPS = new Set(['cache', 'cacheKey', 'cacheDeps']);

export class JSXElementSignature {
  static layout(element: CTElement): string {
    let entry = SIGNATURE_CACHE.get(element);
    if (entry?.layout !== undefined) return entry.layout;
    const sig = this.elementSignature(element, 'layout');
    entry = entry ?? { layout: undefined as unknown as string, visual: undefined as unknown as string };
    entry.layout = sig;
    SIGNATURE_CACHE.set(element, entry);
    return sig;
  }

  static visual(element: CTElement): string {
    let entry = SIGNATURE_CACHE.get(element);
    if (entry?.visual !== undefined) return entry.visual;
    const sig = this.elementSignature(element, 'visual');
    entry = entry ?? { layout: undefined as unknown as string, visual: undefined as unknown as string };
    entry.visual = sig;
    SIGNATURE_CACHE.set(element, entry);
    return sig;
  }

  static cache(element: CTElement): string {
    const parts: string[] = [];
    this.appendPropsSignature(element.props, parts, CACHE_PROPS);
    parts.push(this.visual(element));
    return parts.join('|');
  }

  private static elementSignature(element: CTElement, mode: 'layout' | 'visual'): string {
    const parts: string[] = [];
    this.appendElementSignature(element, mode, parts);
    return parts.join('|');
  }

  private static appendElementSignature(
    element: CTElement,
    mode: 'layout' | 'visual',
    parts: string[],
  ): void {
    parts.push(`type:${element.type}`);
    this.appendPropsSignature(element.props, parts, mode === 'layout' ? LAYOUT_PROPS : undefined);
    parts.push(`children:${element.children.length}`);
    for (const child of element.children) {
      this.appendElementSignature(child, mode, parts);
    }
  }

  private static appendPropsSignature(
    props: Record<string, unknown>,
    parts: string[],
    allowedProps?: Set<string>,
  ): void {
    const propParts: string[] = [];
    for (const key of Object.keys(props).sort()) {
      const value = props[key];
      if (this.isEventCallbackProp(key, value)) continue;
      if (allowedProps && !allowedProps.has(key)) continue;
      propParts.push(`${key}:${this.valueSignature(value)}`);
    }
    parts.push(`props{${propParts.join(',')}}`);
  }

  private static isEventCallbackProp(key: string, value: unknown): boolean {
    return typeof value === 'function' && /^on[A-Z]/.test(key);
  }

  private static valueSignature(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `string:${value}`;
    if (typeof value === 'number') return `number:${value}`;
    if (typeof value === 'boolean') return `boolean:${value}`;
    if (typeof value === 'function') return 'function';
    if (Array.isArray(value)) {
      return `array:[${value.map((item) => this.valueSignature(item)).join(',')}]`;
    }
    if (typeof value === 'object') {
      return `object:{${Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => `${key}:${this.valueSignature((value as Record<string, unknown>)[key])}`)
        .join(',')}}`;
    }
    return String(value);
  }
}
