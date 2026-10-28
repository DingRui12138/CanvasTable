import { CTBox, CTText, CTRow, CTColumn, CTCircle, CTImage, CTLine } from '@/core/jsx/components';

describe('JSX public components', () => {
  it('maps CTBox aliases to CTBox props', () => {
    const element = CTBox({
      bgColor: 'red',
      radius: 8,
      padding: 12,
      children: [],
    });

    expect(element.type).toBe('CTBox');
    expect(element.props.display).toBe('flex');
    expect(element.props.backgroundColor).toBe('red');
    expect(element.props.borderRadius).toBe(8);
    expect(element.props.padding).toBe(12);
  });

  it('builds CTText from string children', () => {
    const element = CTText({
      color: 'white',
      children: [{ type: 'CTText', props: { text: 'hello' }, children: [] }],
    });

    expect(element.type).toBe('CTText');
    expect(element.props.text).toBe('hello');
    expect(element.props.color).toBe('white');
  });

  it('sets CTRow and CTColumn default directions', () => {
    expect(CTRow({ children: [] }).props.flexDirection).toBe('row');
    expect(CTColumn({ children: [] }).props.flexDirection).toBe('column');
  });

  it('CTBox uses direction alias', () => {
    const element = CTBox({ direction: 'column', children: [] });
    expect(element.props.flexDirection).toBe('column');
  });

  it('CTBox uses align and justify aliases', () => {
    const element = CTBox({ align: 'center', justify: 'space-between', children: [] });
    expect(element.props.alignItems).toBe('center');
    expect(element.props.justifyContent).toBe('space-between');
  });

  it('CTBox uses border shortcut', () => {
    const element = CTBox({ border: '#000', children: [] });
    expect(element.props.borderWidth).toBe(1);
    expect(element.props.borderColor).toBe('#000');
  });

  it('CTBox uses border object shortcut', () => {
    const element = CTBox({ border: { width: 2, color: '#333' }, children: [] });
    expect(element.props.borderWidth).toBe(2);
    expect(element.props.borderColor).toBe('#333');
  });

  it('CTCircle maps bgColor to backgroundColor', () => {
    const element = CTCircle({ radius: 10, bgColor: '#52c41a', children: [] });
    expect(element.type).toBe('CTCircle');
    expect(element.props.backgroundColor).toBe('#52c41a');
    expect(element.props.radius).toBe(10);
  });

  it('CTText uses explicit text prop over children', () => {
    const element = CTText({
      text: 'explicit',
      children: [{ type: 'CTText', props: { text: 'from children' }, children: [] }],
    });
    expect(element.props.text).toBe('explicit');
  });

  it('CTImage passes through props', () => {
    const element = CTImage({ src: 'test.png', width: 100, height: 50, children: [] });
    expect(element.type).toBe('CTImage');
    expect(element.props.src).toBe('test.png');
    expect(element.props.width).toBe(100);
    expect(element.props.height).toBe(50);
  });

  it('CTLine passes through props', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
    const element = CTLine({ points, strokeColor: '#333', children: [] });
    expect(element.type).toBe('CTLine');
    expect(element.props.points).toEqual(points);
    expect(element.props.strokeColor).toBe('#333');
  });
});
