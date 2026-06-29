import type { CTElement, CTCircleProps, CTBoxProps, CTImageProps, CTLineProps, CTTextProps, CTTooltipProps, CTDropdownProps } from "./types";
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
            CTTooltip: CTTooltipProps;
            CTDropdown: CTDropdownProps;
        }
    }
}
export {};
//# sourceMappingURL=jsx-namespace.d.ts.map