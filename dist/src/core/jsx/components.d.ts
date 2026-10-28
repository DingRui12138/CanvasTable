import type { CTElement } from "./types";
import { BoxProps, CircleProps, DateProps, DropdownProps, ImageProps, LineProps, ProgressProps, TextProps, TooltipProps } from "./props";
export declare function CTBox(props: BoxProps): CTElement;
export declare function CTRow(props: BoxProps): CTElement;
export declare function CTColumn(props: BoxProps): CTElement;
export declare const CTStack: typeof CTBox;
export declare function CTText(props: TextProps): CTElement;
export declare function CTDate(props: DateProps): CTElement;
export declare function CTCircle(props: CircleProps): CTElement;
export declare function CTImage(props: ImageProps): CTElement;
export declare function CTLine(props: LineProps): CTElement;
/**
 * 进度条（line / circle / dashboard）。
 *
 * 几何尺寸只由 `width` / `height` 决定，`value` 仅影响绘制时的填充长度，
 * 因此可以配合常量 `jsxLayoutKey` 跨行共享布局计划。
 * 设置 `interactive: true` 后支持拖拽 / 点击调整值，拖拽预览同样不参与布局。
 */
export declare function CTProgress(props: ProgressProps): CTElement;
export declare function CTTooltip(props: TooltipProps): CTElement;
export declare function CTDropdown(props: DropdownProps): CTElement;
//# sourceMappingURL=components.d.ts.map