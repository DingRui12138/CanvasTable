import type { CTElement } from "./types";

/**
 * JSX 元素工厂函数
 * TypeScript/Babel 编译 JSX 时调用此函数
 *
 * @param type 元素类型（CTGroup, CTRect, CTText 等）
 * @param props 元素属性
 * @param children 子元素或文本
 */
export function createCTElement(
  type: string,
  props: Record<string, unknown> | null,
  ...children: (CTElement | string)[]
): CTElement {
  // 处理 children：string 转为 CTText
  const processedChildren = children.map((child) => {
    if (typeof child === "string") {
      return {
        type: "CTText" as const,
        props: { text: child },
        children: [],
      };
    }
    return child;
  });

  return {
    type: type as CTElement["type"],
    props: props || {},
    children: processedChildren,
  };
}
