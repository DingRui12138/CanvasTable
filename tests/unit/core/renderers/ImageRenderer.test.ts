import { ImageRenderer } from '@/core/renderers/ImageRenderer';
import { LayoutManager } from '@/core/LayoutManager';
import { createMockCanvasContext, createMockTheme } from '../../helpers/mockFactories';
import type { CellRendererContext } from '@/core/renderers/CellRenderer';
import type { Column, Row } from '@/types';

describe('ImageRenderer', () => {
  type InspectableCanvasContext = CanvasRenderingContext2D & {
    calls: { method: string; args: unknown[] }[];
  };
  type TestCellRendererContext = CellRendererContext & { ctx: InspectableCanvasContext };

  const theme = createMockTheme();
  const layoutManager = new LayoutManager(undefined, theme);
  const column: Column = { key: 'photos', title: 'Photos', type: 'image', width: 80 };
  const row: Row = { id: 'row-1', data: {} };

  function createContext(
    overrides: Partial<Omit<CellRendererContext, 'ctx'>> = {},
  ): TestCellRendererContext {
    const ctx = createMockCanvasContext() as InspectableCanvasContext;

    return {
      ctx,
      theme,
      layoutManager,
      x: 0,
      y: 0,
      width: 80,
      height: 104,
      column,
      row,
      rowIndex: 0,
      colIndex: 0,
      value: {
        images: ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'],
        width: 32,
        height: 32,
        gap: 4,
        showMoreCount: true,
      },
      isDisabled: false,
      isHovered: false,
      isSelected: false,
      dpr: 1,
      ...overrides,
    };
  }

  beforeEach(() => {
    ImageRenderer.clearCache();
  });

  it('uses taller cells to render multiple image rows', () => {
    const renderer = new ImageRenderer();
    const context = createContext();

    renderer.render(context);

    const imageTileRects = context.ctx.calls.filter(
      (call): call is { method: string; args: [number, number, number, number] } =>
        call.method === 'rect' && call.args[2] === 32 && call.args[3] === 32,
    );
    const imageTileYPositions = new Set(imageTileRects.map((call) => call.args[1]));

    expect(imageTileYPositions.size).toBeGreaterThan(1);
  });

  it('keeps image tile size fixed when row-height scaling is disabled', () => {
    const renderer = new ImageRenderer();
    const context = createContext({
      width: 96,
      height: 104,
      value: {
        images: ['a.png', 'b.png', 'c.png', 'd.png'],
        width: 64,
        height: 64,
        gap: 4,
        scaleWithRowHeight: false,
      },
    });

    renderer.render(context);

    const imageTileRects = context.ctx.calls.filter(
      (call): call is { method: string; args: [number, number, number, number] } =>
        call.method === 'rect' &&
        typeof call.args[2] === 'number' &&
        typeof call.args[3] === 'number' &&
        call.args[2] > 0 &&
        call.args[3] > 0,
    );

    expect(imageTileRects.some((call) => call.args[2] === 24 && call.args[3] === 24)).toBe(true);
    expect(imageTileRects.some((call) => call.args[2] === 64 || call.args[3] === 64)).toBe(false);
  });

  it('does not reserve a more-count tile when all images fit', () => {
    const renderer = new ImageRenderer();
    const context = createContext({
      width: 116,
      height: 40,
      value: {
        images: ['a.png', 'b.png', 'c.png'],
        width: 32,
        height: 32,
        gap: 4,
        showMoreCount: true,
      },
    });

    renderer.render(context);

    const moreCountTexts = context.ctx.calls.filter(
      (call) => call.method === 'fillText' && typeof call.args[0] === 'string' && call.args[0].startsWith('+'),
    );

    expect(moreCountTexts).toHaveLength(0);
  });
});
