import { createCTElement } from '@/core/jsx/createCTElement';

describe('createCTElement', () => {
  it('should create CTRect element with props', () => {
    const element = createCTElement('CTRect', { width: 20, height: 20, backgroundColor: '#ff0000' });

    expect(element.type).toBe('CTRect');
    expect(element.props.width).toBe(20);
    expect(element.props.height).toBe(20);
    expect(element.props.backgroundColor).toBe('#ff0000');
    expect(element.children).toEqual([]);
  });

  it('should convert string children to CTText', () => {
    const element = createCTElement('CTGroup', { flexDirection: 'row' }, 'Hello');

    expect(element.type).toBe('CTGroup');
    expect(element.children).toHaveLength(1);
    expect(element.children[0]!.type).toBe('CTText');
    expect(element.children[0]!.props.text).toBe('Hello');
  });

  it('should handle multiple children', () => {
    const rect = createCTElement('CTRect', { width: 10, height: 10 });
    const text = createCTElement('CTText', { text: 'Label' });
    const group = createCTElement('CTGroup', {}, rect, text);

    expect(group.children).toHaveLength(2);
    expect(group.children[0]!.type).toBe('CTRect');
    expect(group.children[1]!.type).toBe('CTText');
  });

  it('should handle null props', () => {
    const element = createCTElement('CTRect', null);

    expect(element.props).toEqual({});
  });

  it('should handle nested groups', () => {
    const inner = createCTElement('CTGroup', { gap: 4 }, 'Inner');
    const outer = createCTElement('CTGroup', { flexDirection: 'column' }, inner);

    expect(outer.children[0]!.type).toBe('CTGroup');
    expect(outer.children[0]!.children[0]!.type).toBe('CTText');
  });
});