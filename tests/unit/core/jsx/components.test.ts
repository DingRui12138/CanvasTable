import { Box, Text, Row, Column, Circle, Image, Line } from '@/core/jsx/components';

describe('JSX public components', () => {
  it('maps Box aliases to CTBox props', () => {
    const element = Box({
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

  it('builds Text from string children', () => {
    const element = Text({
      color: 'white',
      children: [{ type: 'CTText', props: { text: 'hello' }, children: [] }],
    });

    expect(element.type).toBe('CTText');
    expect(element.props.text).toBe('hello');
    expect(element.props.color).toBe('white');
  });

  it('sets Row and Column default directions', () => {
    expect(Row({ children: [] }).props.flexDirection).toBe('row');
    expect(Column({ children: [] }).props.flexDirection).toBe('column');
  });

  it('Box uses direction alias', () => {
    const element = Box({ direction: 'column', children: [] });
    expect(element.props.flexDirection).toBe('column');
  });

  it('Box uses align and justify aliases', () => {
    const element = Box({ align: 'center', justify: 'space-between', children: [] });
    expect(element.props.alignItems).toBe('center');
    expect(element.props.justifyContent).toBe('space-between');
  });

  it('Box uses border shortcut', () => {
    const element = Box({ border: '#000', children: [] });
    expect(element.props.borderWidth).toBe(1);
    expect(element.props.borderColor).toBe('#000');
  });

  it('Box uses border object shortcut', () => {
    const element = Box({ border: { width: 2, color: '#333' }, children: [] });
    expect(element.props.borderWidth).toBe(2);
    expect(element.props.borderColor).toBe('#333');
  });

  it('Circle maps bgColor to backgroundColor', () => {
    const element = Circle({ radius: 10, bgColor: '#52c41a', children: [] });
    expect(element.type).toBe('CTCircle');
    expect(element.props.backgroundColor).toBe('#52c41a');
    expect(element.props.radius).toBe(10);
  });

  it('Text uses explicit text prop over children', () => {
    const element = Text({
      text: 'explicit',
      children: [{ type: 'CTText', props: { text: 'from children' }, children: [] }],
    });
    expect(element.props.text).toBe('explicit');
  });

  it('Image passes through props', () => {
    const element = Image({ src: 'test.png', width: 100, height: 50, children: [] });
    expect(element.type).toBe('CTImage');
    expect(element.props.src).toBe('test.png');
    expect(element.props.width).toBe(100);
    expect(element.props.height).toBe(50);
  });

  it('Line passes through props', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
    const element = Line({ points, strokeColor: '#333', children: [] });
    expect(element.type).toBe('CTLine');
    expect(element.props.points).toEqual(points);
    expect(element.props.strokeColor).toBe('#333');
  });
});