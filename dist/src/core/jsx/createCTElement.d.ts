import type { CTElement } from './types';
/**
 * JSX 元素工厂函数
 * TypeScript/Babel 编译 JSX 时调用此函数
 *
 * @param type 元素类型（CTGroup, CTRect, CTText 等）
 * @param props 元素属性
 * @param children 子元素或文本
 */
export declare function createCTElement(type: string, props: Record<string, unknown> | null, ...children: (CTElement | string)[]): CTElement;
//# sourceMappingURL=createCTElement.d.ts.map