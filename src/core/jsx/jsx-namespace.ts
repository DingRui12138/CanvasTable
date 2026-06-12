import type {
  CTElement,
  CTCircleProps,
  CTBoxProps,
  CTImageProps,
  CTLineProps,
  CTTextProps,
} from "./types";

declare global {
  namespace JSX {
    type Element = CTElement;

    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicElements {
      CTBox: CTBoxProps;
      CTCircle: CTCircleProps;
      CTText: CTTextProps;
      CTImage: CTImageProps;
      CTLine: CTLineProps;
    }
  }
}

export {};
