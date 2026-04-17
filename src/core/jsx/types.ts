// src/core/jsx/types.ts

/** CTElement 样式状态 */
export interface CTStyles {
  default: Partial<CTElementProps>;
  hover?: Partial<CTElementProps>;
  active?: Partial<CTElementProps>;
}

/** 基础元素属性（所有图元共享） */
export interface CTBaseProps {
  id?: string;
  styles?: CTStyles;
}

/** 定位属性（仅在父容器 position='relative' 时生效） */
export interface CTPositionProps {
  /** 相对于父容器的水平位置 */
  x?: number;
  /** 相对于父容器的垂直位置 */
  y?: number;
  /** 绘制顺序，值越大越后绘制（覆盖前面的元素），默认 0 */
  zIndex?: number;
}

/** CTGroup 容器属性 */
export interface CTGroupProps extends CTBaseProps, CTPositionProps {
  /** 布局模式：flex = 弹性布局，子元素按 flexDirection 排列 */
  display?: "flex";
  /** 定位模式：子元素可以用 x, y 相对于此容器定位 */
  position?: "relative";
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  justifyContent?: "flex-start" | "flex-end" | "center" | "space-between";
  alignItems?: "flex-start" | "flex-end" | "center";
  gap?: number;
  width?: number;
  height?: number;
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

/** CTRect 矩形属性 */
export interface CTRectProps extends CTBaseProps, CTPositionProps {
  width: number;
  height: number;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
}

/** CTCircle 圆形属性 */
export interface CTCircleProps extends CTBaseProps, CTPositionProps {
  radius: number;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  startAngle?: number;
  endAngle?: number;
}

/** CTText 文字属性 */
export interface CTTextProps extends CTBaseProps, CTPositionProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  color?: string;
  lineHeight?: number;
  maxWidth?: number;
}

/** CTImage 图片属性 */
export interface CTImageProps extends CTBaseProps, CTPositionProps {
  src: string;
  width: number;
  height: number;
  borderRadius?: number;
  objectFit?: "fill" | "contain" | "cover";
}

/** CTLine 线条属性 */
export interface CTLineProps extends CTBaseProps, CTPositionProps {
  points: Array<{ x: number; y: number }>;
  strokeWidth?: number;
  strokeColor?: string;
  strokeLinecap?: "butt" | "round" | "square";
}

/** 元素属性联合类型 */
export type CTElementProps =
  | CTGroupProps
  | CTRectProps
  | CTCircleProps
  | CTTextProps
  | CTImageProps
  | CTLineProps;

/** CTElement 树节点 */
export interface CTElement {
  type: "CTGroup" | "CTRect" | "CTCircle" | "CTText" | "CTImage" | "CTLine";
  props: Record<string, unknown>;
  children: CTElement[];
}

/** 计算后的元素布局信息 */
export interface CTLayoutInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 绘制顺序 */
  zIndex?: number;
}
