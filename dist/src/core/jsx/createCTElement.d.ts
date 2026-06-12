import type { CTElement, CTChild } from "./types";
/**
 * JSX 元素工厂函数
 * TypeScript/Babel 编译 JSX 时调用此函数
 */
export declare function createCTElement(type: (props: any) => CTElement, props: Record<string, unknown> | null, ...children: CTChild[]): CTElement;
export declare function createCTElement(type: string, props: Record<string, unknown> | null, ...children: CTChild[]): CTElement;
//# sourceMappingURL=createCTElement.d.ts.map