import { InputRenderer } from '@/core/renderers/InputRenderer';
import { LayoutManager } from '@/core/LayoutManager';
import { zhCN } from '@/locale';
import { createMockCanvasContext, createMockTheme } from '../../helpers/mockFactories';
import type { CellRendererContext } from '@/core/renderers/CellRenderer';
import type { Column, Row } from '@/types';

describe('InputRenderer', () => {
  type InspectableCanvasContext = CanvasRenderingContext2D & {
    calls: { method: string; args: unknown[] }[];
  };
  type TestCellRendererContext = CellRendererContext & { ctx: InspectableCanvasContext };

  const theme = createMockTheme();
  const layoutManager = new LayoutManager(undefined, theme);
  const column: Column = { key: 'notes', title: 'Notes', type: 'input', width: 160 };
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
      width: 160,
      height: 58,
      column,
      row,
      rowIndex: 0,
      colIndex: 0,
      value: {
        value: 'first line\nsecond line\nthird line',
        multiline: true,
        maxRows: 5,
      },
      isDisabled: false,
      isHovered: false,
      isSelected: false,
      dpr: 1,
      locale: zhCN,
      ...overrides,
    };
  }

  it('vertically centers visible multiline text when content is clipped', () => {
    const renderer = new InputRenderer();
    const context = createContext();

    renderer.render(context);

    const textCalls = context.ctx.calls.filter(
      (call): call is { method: string; args: [string, number, number] } =>
        call.method === 'fillText' && typeof call.args[0] === 'string',
    );

    expect(textCalls).toHaveLength(2);
    expect(textCalls[0]!.args[2]).toBeCloseTo(19.25);
    expect(textCalls[1]!.args[2]).toBeCloseTo(38.75);
  });
});
