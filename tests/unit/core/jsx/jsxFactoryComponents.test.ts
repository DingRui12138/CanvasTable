import { createCTElement } from '@/core/jsx/createCTElement';
import type { CTElement, CTComponentProps } from '@/core/jsx/types';

function Demo(props: CTComponentProps & { label: string }): CTElement {
  return createCTElement('CTBox', { display: 'flex' }, props.label, ...(props.children ?? []));
}

describe('createCTElement function components', () => {
  it('calls function component with props and normalized children', () => {
    const element = createCTElement(Demo, { label: 'A' }, 'B');

    expect(element.type).toBe('CTBox');
    expect(element.children).toHaveLength(2);
    expect(element.children[0]!.type).toBe('CTText');
    expect(element.children[0]!.props.text).toBe('A');
    expect(element.children[1]!.props.text).toBe('B');
  });

  it('passes children array to function component', () => {
    const child = createCTElement('CTText', { text: 'child' });
    const element = createCTElement(Demo, { label: 'parent' }, child);

    expect(element.type).toBe('CTBox');
    expect(element.children).toHaveLength(2);
    expect(element.children[0]!.props.text).toBe('parent');
    expect(element.children[1]!.type).toBe('CTText');
    expect(element.children[1]!.props.text).toBe('child');
  });

  it('filters null, undefined, false from children', () => {
    const element = createCTElement(Demo, { label: 'A' }, null, undefined, false, 'B');

    expect(element.children).toHaveLength(2);
    expect(element.children[0]!.props.text).toBe('A');
    expect(element.children[1]!.props.text).toBe('B');
  });

  it('converts number children to CTText', () => {
    const element = createCTElement(Demo, { label: 'Num' }, 42);

    expect(element.children).toHaveLength(2);
    expect(element.children[1]!.type).toBe('CTText');
    expect(element.children[1]!.props.text).toBe('42');
  });
});