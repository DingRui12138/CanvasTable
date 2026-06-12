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
/** 盒阴影 */
export interface CTBoxShadow {
    /** 水平偏移（正数向右） */
    offsetX: number;
    /** 垂直偏移（正数向下） */
    offsetY: number;
    /** 模糊半径 */
    blur: number;
    /** 扩展半径（正数向外扩展，负数向内收缩） */
    spread?: number;
    /** 阴影颜色 */
    color: string;
}
/** 渐变背景 */
export interface CTLinearGradient {
    type: "linear";
    /** 角度（度数），0=向上，90=向右，180=向下，270=向左 */
    angle: number;
    /** 颜色数组，均匀分布 */
    colors: string[];
}
export interface CTRadialGradient {
    type: "radial";
    /** 颜色数组，均匀分布 */
    colors: string[];
}
export type CTBackgroundGradient = CTLinearGradient | CTRadialGradient;
/** 单侧边框 */
export interface CTBorderSide {
    width?: number;
    color?: string;
}
/** CTBox 容器属性（原 CTGroup + CTRect 合并） */
export interface CTBoxProps extends CTBaseProps, CTPositionProps {
    /** 布局模式：flex = 弹性布局，子元素按 flexDirection 排列 */
    display?: "flex";
    /** 定位模式：子元素可以用 x, y 相对于此容器定位 */
    position?: "relative";
    flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
    justifyContent?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
    alignItems?: "flex-start" | "flex-end" | "center" | "stretch";
    /** 单个子元素的交叉轴对齐覆盖 */
    alignSelf?: "flex-start" | "flex-end" | "center" | "stretch";
    gap?: number;
    /** 宽度，支持数字或百分比字符串（如 "100%"）。根元素默认 "100%"（撑满父容器/单元格） */
    width?: number | string;
    /** 高度，支持数字或百分比字符串（如 "100%"）。根元素默认 "100%"（撑满父容器/单元格） */
    height?: number | string;
    minWidth?: number | string;
    maxWidth?: number | string;
    minHeight?: number | string;
    maxHeight?: number | string;
    /** 内边距 */
    padding?: number | {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    /** 外边距（影响 flex 布局中的子元素间距） */
    margin?: number | {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
    backgroundColor?: string;
    /** 渐变背景 */
    backgroundGradient?: CTBackgroundGradient;
    borderRadius?: number;
    /** 四角圆角（优先于 borderRadius） */
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    /** 统一边框 */
    borderColor?: string;
    borderWidth?: number;
    /** 单侧边框 */
    borderTop?: CTBorderSide | string;
    borderRight?: CTBorderSide | string;
    borderBottom?: CTBorderSide | string;
    borderLeft?: CTBorderSide | string;
    opacity?: number;
    /** 内容溢出裁剪 */
    overflow?: "hidden" | "clip" | "visible";
    /** 盒阴影 */
    boxShadow?: CTBoxShadow | string;
}
/** @deprecated 使用 CTBoxProps 替代 */
export type CTGroupProps = CTBoxProps;
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
    /** 水平对齐（left/center/right） */
    textAlign?: "left" | "center" | "right";
    /** 文字装饰线 */
    textDecoration?: "underline" | "line-through" | "none";
    /** 字符间距 */
    letterSpacing?: number;
    /** 内容溢出裁剪 */
    overflow?: "hidden" | "clip" | "visible";
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
    points: Array<{
        x: number;
        y: number;
    }>;
    strokeWidth?: number;
    strokeColor?: string;
    strokeLinecap?: "butt" | "round" | "square";
}
/** 元素属性联合类型 */
export type CTElementProps = CTBoxProps | CTCircleProps | CTTextProps | CTImageProps | CTLineProps;
/** CTElement 树节点 */
export interface CTElement {
    type: "CTBox" | "CTCircle" | "CTText" | "CTImage" | "CTLine";
    props: Record<string, unknown>;
    children: CTElement[];
}
/** 函数组件子元素类型 */
export type CTChild = CTElement | string | number | null | undefined | false;
/** 函数组件基础属性 */
export interface CTComponentProps {
    children?: CTElement[];
    [key: string]: unknown;
}
/** 函数组件类型 */
export type CTComponent<P extends CTComponentProps = CTComponentProps> = (props: P) => CTElement;
/** 计算后的元素布局信息 */
export interface CTLayoutInfo {
    x: number;
    y: number;
    width: number;
    height: number;
    /** 绘制顺序 */
    zIndex?: number;
    /** 外边距（渲染时用于偏移内容位置） */
    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}
/** 布局树节点（用于渲染时直接定位，避免重复 layout 计算） */
export interface CTLayoutNode extends CTLayoutInfo {
    element: CTElement;
    children: CTLayoutNode[];
}
//# sourceMappingURL=types.d.ts.map