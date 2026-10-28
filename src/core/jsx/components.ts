import type { CTElement } from "./types";
import {
  BoxProps,
  CircleProps,
  DateProps,
  DropdownProps,
  ImageProps,
  LineProps,
  ProgressProps,
  TextProps,
  TooltipProps,
  getDateText,
  getTextFromChildren,
  normalizeBoxProps,
} from "./props";

export function CTBox(props: BoxProps): CTElement {
  return {
    type: "CTBox",
    props: normalizeBoxProps(props) as Record<string, unknown>,
    children: props.children ?? [],
  };
}

export function CTRow(props: BoxProps): CTElement {
  return CTBox({ ...props, direction: "row" });
}

export function CTColumn(props: BoxProps): CTElement {
  return CTBox({ ...props, direction: "column" });
}

export const CTStack = CTBox;

export function CTText(props: TextProps): CTElement {
  const { children: _children, text: _text, ...rest } = props;
  return {
    type: "CTText",
    props: {
      ...rest,
      text: getTextFromChildren(props),
    } as Record<string, unknown>,
    children: [],
  };
}

export function CTDate(props: DateProps): CTElement {
  const {
    children: _children,
    value: _value,
    format: _format,
    placeholder: _placeholder,
    ...textProps
  } = props;
  return CTText({
    ...textProps,
    text: getDateText(props),
  });
}

export function CTCircle(props: CircleProps): CTElement {
  const { children: _children, bgColor, ...rest } = props;
  return {
    type: "CTCircle",
    props: {
      ...rest,
      backgroundColor: bgColor ?? rest.backgroundColor,
    } as Record<string, unknown>,
    children: [],
  };
}

export function CTImage(props: ImageProps): CTElement {
  const { children: _children, ...rest } = props;
  return {
    type: "CTImage",
    props: rest as Record<string, unknown>,
    children: [],
  };
}

export function CTLine(props: LineProps): CTElement {
  const { children: _children, ...rest } = props;
  return {
    type: "CTLine",
    props: rest as Record<string, unknown>,
    children: [],
  };
}

/**
 * 进度条（line / circle / dashboard）。
 *
 * 几何尺寸只由 `width` / `height` 决定，`value` 仅影响绘制时的填充长度，
 * 因此可以配合常量 `jsxLayoutKey` 跨行共享布局计划。
 * 设置 `interactive: true` 后支持拖拽 / 点击调整值，拖拽预览同样不参与布局。
 */
export function CTProgress(props: ProgressProps): CTElement {
  const { children: _children, radius, ...rest } = props;
  return {
    type: "CTProgress",
    props: {
      ...rest,
      borderRadius: rest.borderRadius ?? radius,
    } as Record<string, unknown>,
    children: [],
  };
}

export function CTTooltip(props: TooltipProps): CTElement {
  const { children, ...rest } = props;
  return {
    type: "CTTooltip",
    props: rest as Record<string, unknown>,
    children: children ?? [],
  };
}

export function CTDropdown(props: DropdownProps): CTElement {
  const { children, ...rest } = props;
  return {
    type: "CTDropdown",
    props: rest as Record<string, unknown>,
    children: children ?? [],
  };
}
