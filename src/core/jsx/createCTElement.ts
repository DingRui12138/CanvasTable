import type { CTElement, CTChild } from "./types";

/**
 * JSX 元素工厂函数
 * TypeScript/Babel 编译 JSX 时调用此函数
 */

// Overload for function components - accept any function returning CTElement
export function createCTElement(
  type: (props: any) => CTElement,
  props: Record<string, unknown> | null,
  ...children: CTChild[]
): CTElement;

// Overload for intrinsic elements (string type like CTBox, CTText, etc.)
export function createCTElement(
  type: string,
  props: Record<string, unknown> | null,
  ...children: CTChild[]
): CTElement;

// Implementation
export function createCTElement(
  type: string | ((props: any) => CTElement),
  props: Record<string, unknown> | null,
  ...children: CTChild[]
): CTElement {
  const normalizedChildren = normalizeChildren(children);

  // 函数组件：将 props + children 传入函数，返回 CTElement
  if (typeof type === "function") {
    const mergedProps = { ...props, children: normalizedChildren };
    return type(mergedProps);
  }

  return {
    type: type as CTElement["type"],
    props: props || {},
    children: normalizedChildren,
  };
}

/** 过滤 null/undefined/false，将 string/number 转为 CTText */
function normalizeChildren(children: CTChild[]): CTElement[] {
  return children
    .filter((child) => child !== null && child !== undefined && child !== false)
    .map((child) => {
      if (typeof child === "string") {
        return { type: "CTText" as const, props: { text: child }, children: [] };
      }
      if (typeof child === "number") {
        return { type: "CTText" as const, props: { text: String(child) }, children: [] };
      }
      return child;
    });
}
