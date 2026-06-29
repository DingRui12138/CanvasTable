import type { CTElement } from "./types";
import {
  BoxProps,
  CircleProps,
  DateProps,
  DropdownProps,
  ImageProps,
  LineProps,
  TextProps,
  TooltipProps,
  getDateText,
  getTextFromChildren,
  normalizeBoxProps,
} from "./props";

export function Box(props: BoxProps): CTElement {
  return {
    type: "CTBox",
    props: normalizeBoxProps(props) as Record<string, unknown>,
    children: props.children ?? [],
  };
}

export function Row(props: BoxProps): CTElement {
  return Box({ ...props, direction: "row" });
}

export function Column(props: BoxProps): CTElement {
  return Box({ ...props, direction: "column" });
}

export const Stack = Box;

export function Text(props: TextProps): CTElement {
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

export function Date(props: DateProps): CTElement {
  const {
    children: _children,
    value: _value,
    format: _format,
    placeholder: _placeholder,
    ...textProps
  } = props;
  return Text({
    ...textProps,
    text: getDateText(props),
  });
}

export function Circle(props: CircleProps): CTElement {
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

export function Image(props: ImageProps): CTElement {
  const { children: _children, ...rest } = props;
  return {
    type: "CTImage",
    props: rest as Record<string, unknown>,
    children: [],
  };
}

export function Line(props: LineProps): CTElement {
  const { children: _children, ...rest } = props;
  return {
    type: "CTLine",
    props: rest as Record<string, unknown>,
    children: [],
  };
}

export function Tooltip(props: TooltipProps): CTElement {
  const { children, ...rest } = props;
  return {
    type: "CTTooltip",
    props: rest as Record<string, unknown>,
    children: children ?? [],
  };
}

export function Dropdown(props: DropdownProps): CTElement {
  const { children, ...rest } = props;
  return {
    type: "CTDropdown",
    props: rest as Record<string, unknown>,
    children: children ?? [],
  };
}
