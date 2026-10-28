import type { CTCircleProps, CTComponentProps, CTBoxProps, CTBoxShadow, CTBackgroundGradient, CTBorderSide, CTImageProps, CTLineProps, CTProgressProps, CTTextProps, CTTooltipProps, CTDropdownProps } from "./types";
export type BorderShortcut = string | {
    width?: number;
    color?: string;
};
export interface BoxProps extends CTComponentProps {
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    maxWidth?: number | string;
    minHeight?: number | string;
    maxHeight?: number | string;
    padding?: CTBoxProps["padding"];
    margin?: CTBoxProps["margin"];
    bgColor?: string;
    backgroundColor?: string;
    radius?: number;
    borderRadius?: number;
    /** 四角圆角 */
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    border?: BorderShortcut;
    borderWidth?: number;
    borderColor?: string;
    /** 单侧边框 */
    borderTop?: CTBorderSide | string;
    borderRight?: CTBorderSide | string;
    borderBottom?: CTBorderSide | string;
    borderLeft?: CTBorderSide | string;
    direction?: CTBoxProps["flexDirection"];
    flexDirection?: CTBoxProps["flexDirection"];
    justify?: CTBoxProps["justifyContent"];
    justifyContent?: CTBoxProps["justifyContent"];
    align?: CTBoxProps["alignItems"];
    alignItems?: CTBoxProps["alignItems"];
    alignSelf?: CTBoxProps["alignSelf"];
    position?: CTBoxProps["position"];
    x?: number;
    y?: number;
    zIndex?: number;
    opacity?: number;
    overflow?: CTBoxProps["overflow"];
    /** clip=true → overflow="hidden" */
    clip?: boolean;
    boxShadow?: CTBoxShadow | string;
    /** shadow 别名 */
    shadow?: CTBoxShadow | string;
    backgroundGradient?: CTBackgroundGradient;
    /** gradient 别名 */
    gradient?: CTBackgroundGradient;
    gap?: number;
    /** Aliases */
    mg?: CTBoxProps["margin"];
    minW?: number | string;
    maxW?: number | string;
    minH?: number | string;
    maxH?: number | string;
    selfAlign?: CTBoxProps["alignSelf"];
    borderTLR?: number;
    borderTRR?: number;
    borderBLR?: number;
    borderBRR?: number;
}
export interface TextProps extends CTComponentProps, Omit<CTTextProps, "text"> {
    text?: string;
}
export interface DateProps extends CTComponentProps, Omit<CTTextProps, "text"> {
    value?: string | number | globalThis.Date | null;
    format?: string;
    placeholder?: string;
}
export type CircleProps = CTComponentProps & CTCircleProps & {
    bgColor?: string;
};
export type ImageProps = CTComponentProps & CTImageProps;
export type LineProps = CTComponentProps & CTLineProps;
export type ProgressProps = CTComponentProps & CTProgressProps;
export type TooltipProps = CTComponentProps & CTTooltipProps;
export type DropdownProps = CTComponentProps & CTDropdownProps;
export declare function normalizeBoxProps(props: BoxProps): CTBoxProps;
export declare function getTextFromChildren(props: TextProps): string;
export declare function getDateText(props: DateProps): string;
//# sourceMappingURL=props.d.ts.map