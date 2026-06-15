import type {
  CTCircleProps,
  CTComponentProps,
  CTBoxProps,
  CTBoxShadow,
  CTBackgroundGradient,
  CTBorderSide,
  CTImageProps,
  CTLineProps,
  CTTextProps,
} from "./types";

export type BorderShortcut =
  | string
  | {
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

export type CircleProps = CTComponentProps & CTCircleProps & { bgColor?: string };
export type ImageProps = CTComponentProps & CTImageProps;
export type LineProps = CTComponentProps & CTLineProps;

function normalizeBorder(border: BorderShortcut | undefined): {
  borderWidth?: number;
  borderColor?: string;
} {
  if (!border) return {};
  if (typeof border === "string") {
    return { borderWidth: 1, borderColor: border };
  }
  return {
    borderWidth: border.width,
    borderColor: border.color,
  };
}

function normalizeBorderSide(side: CTBorderSide | string | undefined): CTBorderSide | undefined {
  if (!side) return undefined;
  if (typeof side === "string") {
    return { width: 1, color: side };
  }
  return side;
}

/** 将 boxShadow 字符串解析为 CTBoxShadow 对象 */
function normalizeBoxShadow(shadow: CTBoxShadow | string | undefined): CTBoxShadow | undefined {
  if (!shadow) return undefined;
  if (typeof shadow === "string") {
    // 格式: "offsetX offsetY blur color" 或 "offsetX offsetY blur spread color"
    const parts = shadow.trim().split(/\s+/);
    const offsetX = Number(parts[0]) || 0;
    const offsetY = Number(parts[1]) || 0;
    const blur = Number(parts[2]) || 0;
    const spread = Number(parts[3]) || 0;
    // 颜色：最后1-2个部分（如果 spread 前面有4个数字，则颜色从第5个开始）
    const colorStart = parts.length > 5 ? 4 : parts[3] && !isNaN(Number(parts[3])) ? 4 : 3;
    const color = parts.slice(colorStart).join(" ") || "rgba(0,0,0,0.15)";
    return { offsetX, offsetY, blur, spread, color };
  }
  return shadow;
}

export function normalizeBoxProps(props: BoxProps): CTBoxProps {
  const border = normalizeBorder(props.border);
  const borderTop = normalizeBorderSide(props.borderTop);
  const borderRight = normalizeBorderSide(props.borderRight);
  const borderBottom = normalizeBorderSide(props.borderBottom);
  const borderLeft = normalizeBorderSide(props.borderLeft);
  const boxShadow = normalizeBoxShadow(props.shadow ?? props.boxShadow);

  return {
    id: props.id as string | undefined,
    styles: props.styles as CTBoxProps["styles"],
    display: props.position === "relative" ? undefined : "flex",
    position: props.position,
    x: props.x,
    y: props.y,
    zIndex: props.zIndex,
    width: props.width,
    height: props.height,
    minWidth: props.minW ?? props.minWidth,
    maxWidth: props.maxW ?? props.maxWidth,
    minHeight: props.minH ?? props.minHeight,
    maxHeight: props.maxH ?? props.maxHeight,
    padding: props.padding,
    margin: props.mg ?? props.margin,
    gap: props.gap,
    flexDirection: props.direction ?? props.flexDirection ?? "row",
    justifyContent: props.justify ?? props.justifyContent,
    alignItems: props.align ?? props.alignItems,
    alignSelf: props.selfAlign ?? props.alignSelf,
    backgroundColor: props.bgColor ?? props.backgroundColor,
    backgroundGradient: props.gradient ?? props.backgroundGradient,
    borderRadius: props.radius ?? props.borderRadius,
    borderTopLeftRadius: props.borderTLR ?? props.borderTopLeftRadius,
    borderTopRightRadius: props.borderTRR ?? props.borderTopRightRadius,
    borderBottomLeftRadius: props.borderBLR ?? props.borderBottomLeftRadius,
    borderBottomRightRadius: props.borderBRR ?? props.borderBottomRightRadius,
    borderWidth: props.borderWidth ?? border.borderWidth,
    borderColor: props.borderColor ?? border.borderColor,
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
    opacity: props.opacity,
    overflow: props.clip ? "hidden" : props.overflow,
    boxShadow,
  };
}

export function getTextFromChildren(props: TextProps): string {
  if (props.text !== undefined) return props.text;
  return (props.children ?? []).map((child) => String(child.props.text ?? "")).join("");
}
