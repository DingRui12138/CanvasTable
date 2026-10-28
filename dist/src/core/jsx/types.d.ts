import type { Column, Row, SelectConfig, SelectOption, TableTheme } from "../../types";
import type { ImageRuntime } from "../renderers/CellRenderer";
export interface CTRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export type CTInteractiveRegionType = "tooltip" | "dropdown" | "image" | "progress";
/** CTProgress 交互几何（画布绝对坐标），用于拖拽时把指针位置换算成 value */
export interface CTProgressInteractionInfo {
    shape: "line" | "circle" | "dashboard";
    /** 线型进度：轨道区域 */
    trackX: number;
    trackY: number;
    trackWidth: number;
    trackHeight: number;
    /** 环型 / 仪表盘：圆心与半径 */
    centerX: number;
    centerY: number;
    radius: number;
    /** 起始角（弧度）与总角度；线型忽略 */
    startAngle: number;
    totalAngle: number;
    max: number;
    precision: number;
}
export interface CTInteractiveRegion {
    type: CTInteractiveRegionType;
    rect: CTRect;
    element: CTElement;
    props: Record<string, unknown>;
    row?: Row;
    column?: Column;
    rowIndex?: number;
    colIndex?: number;
    /** type = "progress" 时的拖拽几何 */
    progress?: CTProgressInteractionInfo;
    /** type = "progress" 时的值变更回调（onChange 优先，否则回退 updateValue） */
    onValueChange?: (value: number) => void | Promise<void>;
}
export interface JSXRenderContext {
    value: unknown;
    row: Row;
    column: Column;
    rowIndex: number;
    colIndex: number;
    updateValue: (value: unknown) => Promise<void>;
    updateField: (field: string, value: unknown) => Promise<void>;
    updateRow: (data: Record<string, unknown>) => Promise<void>;
}
export interface CTRenderContext {
    ctx: CanvasRenderingContext2D;
    theme: TableTheme;
    imageRuntime?: ImageRuntime;
    row?: Row;
    column?: Column;
    rowIndex?: number;
    colIndex?: number;
    cellRect?: CTRect;
    updateValue?: (value: unknown) => Promise<void>;
    updateField?: (field: string, value: unknown) => Promise<void>;
    updateRow?: (data: Record<string, unknown>) => Promise<void>;
    collectInteractiveRegion?: (region: CTInteractiveRegion) => void;
    /** 拖拽中的 CTProgress 预览值覆盖（按单元格 / 元素 id 匹配） */
    getProgressValueOverride?: (rowIndex: number, colIndex: number, elementId?: string) => number | undefined;
}
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
    src?: string;
    width: number;
    height: number;
    borderRadius?: number;
    radius?: number;
    objectFit?: "fill" | "contain" | "cover" | "none";
    fit?: "fill" | "contain" | "cover" | "none";
    circle?: boolean;
    placeholder?: string;
    errorImage?: string;
    lazy?: boolean;
    lazyThreshold?: number;
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
/**
 * CTProgress 进度条属性。
 *
 * 布局尺寸只由 `width` / `height` 决定，`value` 只在绘制期生效，
 * 因此同一 `jsxLayoutKey` 下不同进度的单元格可以共享布局计划。
 */
export interface CTProgressProps extends CTBaseProps, CTPositionProps {
    /** 当前值（0..max） */
    value: number;
    /** 最大值，默认 100 */
    max?: number;
    /** 总宽度（布局输入，不随 value 变化） */
    width: number;
    /** 总高度，默认 8 */
    height?: number;
    /** 圆角半径，默认 height / 2 */
    borderRadius?: number;
    /** borderRadius 别名 */
    radius?: number;
    /** 轨道颜色，默认 theme.colors.progress.track */
    trackColor?: string;
    /** 填充颜色，支持按 ratio(0..1) 动态计算 */
    barColor?: string | ((ratio: number) => string);
    /** 填充最小宽度，默认 2 * radius，避免小值不可见 */
    minBarWidth?: number;
    /** 形状，默认 line */
    shape?: "line" | "circle" | "dashboard";
    /** 环型 / 仪表盘的线条粗细，默认按直径计算 */
    strokeWidth?: number;
    /** 环型 / 仪表盘的线帽，默认 round */
    strokeLinecap?: "butt" | "round" | "square";
    /** 强制颜色状态，仅在未设置 barColor 时生效 */
    status?: "normal" | "success" | "warning" | "error";
    /** 百分比小数位数，默认 0；同时用于拖拽取值精度 */
    precision?: number;
    /** 是否允许拖拽调整值，默认 false */
    interactive?: boolean;
    /** 拖拽 / 点击后的值变更回调；未提供时回退到 renderContext.updateValue */
    onChange?: (value: number) => void | Promise<void>;
    /** 是否显示百分比文本，默认 false */
    showLabel?: boolean;
    /** 自定义文本，或通过格式化函数生成 */
    label?: string | ((ratio: number, value: number, max: number) => string);
    /** 文本位置：inside = 轨道内部居中；right = 轨道右侧保留区域 */
    labelPosition?: "inside" | "right";
    /** labelPosition = "right" 时保留的文本区域宽度，默认 34 */
    labelWidth?: number;
    /** 文本字号，默认 min(10, height - 2) */
    fontSize?: number;
    /** 文本颜色，默认 inside 为白色、right 为 theme.colors.cellText */
    color?: string;
    /** 文本字重，默认 normal */
    fontWeight?: "normal" | "bold";
    /** 文本字体，默认 theme.font.family */
    fontFamily?: string;
}
export interface CTTooltipProps extends CTBaseProps {
    content: string;
    placement?: "top" | "right" | "bottom" | "left";
    width?: number;
}
export interface CTDropdownChangeContext {
    config: SelectConfig;
    multiple: boolean;
    row?: Row;
    column?: Column;
    rowIndex?: number;
    colIndex?: number;
}
export type CTDropdownOnChange = (value: unknown, option: SelectOption, context: CTDropdownChangeContext) => void | Promise<void>;
export interface CTDropdownProps extends CTBaseProps {
    config: SelectConfig;
    width?: number;
    placement?: "bottom" | "top";
    onChange?: CTDropdownOnChange;
}
/** 元素属性联合类型 */
export type CTElementProps = CTBoxProps | CTCircleProps | CTTextProps | CTImageProps | CTLineProps | CTProgressProps | CTTooltipProps | CTDropdownProps;
export type CTElementType = "CTBox" | "CTCircle" | "CTText" | "CTImage" | "CTLine" | "CTProgress" | "CTTooltip" | "CTDropdown";
/** CTElement 树节点 */
export interface CTElement {
    type: CTElementType;
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
    currentElement?: CTElement;
    children: CTLayoutNode[];
    offsetX?: number;
    offsetY?: number;
}
//# sourceMappingURL=types.d.ts.map