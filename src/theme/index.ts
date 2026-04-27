import { TableTheme } from "../types";

export const DEFAULT_THEME: TableTheme = {
  name: "light",
  colors: {
    background: "#ffffff",
    headerBackground: "#f5f5f5",
    headerText: "#333333",
    rowBackground: "#ffffff",
    rowAltBackground: "#fafafa",
    rowHoverBackground: "#f0f7ff",
    rowSelectedBackground: "#e6f4ff",
    cellText: "#333333",
    cellBorder: "#e8e8e8",
    selectionBorder: "#1890ff",
    linkColor: "#1890ff",
    placeholderText: "#bfbfbf",
    primary: "#1890ff",
    tagColors: {
      default: "#f0f0f0",
      primary: "#1890ff",
      success: "#52c41a",
      warning: "#faad14",
      error: "#ff4d4f",
      info: "#1890ff",
    },
    date: {
      border: "#d9d9d9",
      icon: "#999999",
    },
    input: {
      border: "#d9d9d9",
      focusBorder: "#1890ff",
      background: "#ffffff",
      text: "#333333",
      placeholder: "#bfbfbf",
    },
    checkbox: {
      border: "#d9d9d9",
      checkedBg: "#1890ff",
      checkmark: "#ffffff",
      disabledBg: "#f5f5f5",
    },
    radio: {
      border: "#d9d9d9",
      checkedBg: "#1890ff",
      dot: "#ffffff",
      disabledBg: "#f5f5f5",
    },
    switch: {
      onBg: "#1890ff",
      offBg: "#bfbfbf",
      thumb: "#ffffff",
      disabledOnBg: "#a0cfff",
      disabledOffBg: "#d9d9d9",
    },
    button: {
      background: "#ffffff",
      text: "#333333",
      border: "#d9d9d9",
      hoverBg: "#e6e6e6",
      primaryBg: "#1890ff",
      primaryText: "#ffffff",
      dangerBg: "#ff4d4f",
      dangerText: "#ffffff",
      warningBg: "#faad14",
      warningText: "#ffffff",
      linkText: "#1890ff",
      disabledBg: "#f5f5f5",
      disabledText: "#bfbfbf",
      disabledBorder: "#d9d9d9",
    },
    dropdown: {
      background: "#ffffff",
      border: "#e8e8e8",
      hoverBg: "#f5f5f5",
      selectedBg: "#e6f4ff",
      text: "#333333",
    },
    scrollbar: {
      track: "#f0f0f0",
      thumb: "#c1c1c1",
      thumbHover: "#a8a8a8",
      thumbActive: "#909090",
      opacity: 0.8,
    },
    progress: {
      track: "#f0f0f0",
      default: "#1890ff",
      success: "#52c41a",
      warning: "#faad14",
      error: "#ff4d4f",
    },
    indicator: {
      active: "#333333",
      inactive: "#bfbfbf",
    },
    tooltip: {
      background: "rgba(255, 255, 255, 0.95)",
      text: "#333333",
      gap: 4,
    },
    image: {
      hoverBorder: "#1890ff",
      hoverShadow: "rgba(24, 144, 255, 0.3)",
      placeholderBg: "#f0f0f0",
      errorBg: "#fff1f0",
      errorBorder: "#ff4d4f",
    },
    hiddenPlaceholder: {
      hoverBg: "#bae0ff",
    },
    moreCount: {
      background: "rgba(0, 0, 0, 0.08)",
      text: "#666666",
    },
    shadow: {
      color: "rgba(0, 0, 0, 0.4)",
      blur: 12,
      offsetX: 0,
      offsetY: 2,
    },
    watermark: {
      color: "rgba(0, 0, 0, 0.15)",
      fontSize: 16,
      opacity: 1,
    },
    loading: {
      background: "rgba(255, 255, 255, 0.85)",
      spinnerBorder: "#d9d9d9",
      spinnerActive: "#1890ff",
      text: "#333333",
    },
  },
  font: {
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: 13,
    headerSize: 13,
  },
  row: {
    height: 32,
    headerHeight: 36,
    minHeight: 24,
    maxHeight: 320,
    resizeGuideColor: "#1890ff",
    resizeGuideWidth: 1,
  },
  border: {
    width: 1,
    color: "#e8e8e8",
  },
};

export const DARK_THEME: TableTheme = {
  name: "dark",
  colors: {
    background: "#1f1f1f",
    headerBackground: "#2d2d2d",
    headerText: "#e0e0e0",
    rowBackground: "#1f1f1f",
    rowAltBackground: "#262626",
    rowHoverBackground: "#303030",
    rowSelectedBackground: "#177ddc",
    cellText: "#e0e0e0",
    cellBorder: "#434343",
    selectionBorder: "#177ddc",
    linkColor: "#177ddc",
    placeholderText: "#666666",
    primary: "#177ddc",
    tagColors: {
      default: "#434343",
      primary: "#177ddc",
      success: "#49aa19",
      warning: "#d89614",
      error: "#a61d24",
      info: "#177ddc",
    },
    date: {
      border: "#434343",
      icon: "#666666",
    },
    input: {
      border: "#434343",
      focusBorder: "#177ddc",
      background: "#2d2d2d",
      text: "#e0e0e0",
      placeholder: "#666666",
    },
    checkbox: {
      border: "#434343",
      checkedBg: "#177ddc",
      checkmark: "#ffffff",
      disabledBg: "#363636",
    },
    radio: {
      border: "#434343",
      checkedBg: "#177ddc",
      dot: "#ffffff",
      disabledBg: "#363636",
    },
    switch: {
      onBg: "#177ddc",
      offBg: "#595959",
      thumb: "#ffffff",
      disabledOnBg: "#1a4a6e",
      disabledOffBg: "#363636",
    },
    button: {
      background: "#2d2d2d",
      text: "#e0e0e0",
      border: "#434343",
      hoverBg: "#404040",
      primaryBg: "#177ddc",
      primaryText: "#ffffff",
      dangerBg: "#a61d24",
      dangerText: "#ffffff",
      warningBg: "#d89614",
      warningText: "#ffffff",
      linkText: "#177ddc",
      disabledBg: "#363636",
      disabledText: "#666666",
      disabledBorder: "#434343",
    },
    dropdown: {
      background: "#2d2d2d",
      border: "#434343",
      hoverBg: "#3a3a3a",
      selectedBg: "#177ddc",
      text: "#e0e0e0",
    },
    scrollbar: {
      track: "#2d2d2d",
      thumb: "#4a4a4a",
      thumbHover: "#5a5a5a",
      thumbActive: "#6a6a6a",
      opacity: 0.8,
    },
    progress: {
      track: "#2d2d2d",
      default: "#177ddc",
      success: "#49aa19",
      warning: "#d89614",
      error: "#a61d24",
    },
    indicator: {
      active: "#e0e0e0",
      inactive: "#666666",
    },
    tooltip: {
      background: "rgba(60, 60, 60, 0.95)",
      text: "#ffffff",
      gap: 4,
    },
    image: {
      hoverBorder: "#177ddc",
      hoverShadow: "rgba(23, 125, 220, 0.3)",
      placeholderBg: "#363636",
      errorBg: "#2a1215",
      errorBorder: "#a61d24",
    },
    hiddenPlaceholder: {
      hoverBg: "#1a4a6e",
    },
    moreCount: {
      background: "rgba(255, 255, 255, 0.25)",
      text: "#ffffff",
    },
    shadow: {
      color: "rgba(0, 0, 0, 0.55)",
      blur: 12,
      offsetX: 0,
      offsetY: 2,
    },
    watermark: {
      color: "rgba(255, 255, 255, 0.1)",
      fontSize: 16,
      opacity: 1,
    },
    loading: {
      background: "rgba(31, 31, 31, 0.85)",
      spinnerBorder: "#434343",
      spinnerActive: "#177ddc",
      text: "#e0e0e0",
    },
  },
  font: {
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    size: 13,
    headerSize: 13,
  },
  row: {
    height: 32,
    headerHeight: 36,
    minHeight: 24,
    maxHeight: 320,
    resizeGuideColor: "#177ddc",
    resizeGuideWidth: 1,
  },
  border: {
    width: 1,
    color: "#434343",
  },
};

export function mergeTheme(theme?: Partial<TableTheme>): TableTheme {
  if (!theme) {
    return { ...DEFAULT_THEME };
  }

  return {
    ...DEFAULT_THEME,
    ...theme,
    colors: {
      ...DEFAULT_THEME.colors,
      ...theme.colors,
      tagColors: {
        ...DEFAULT_THEME.colors.tagColors,
        ...theme.colors?.tagColors,
      },
      date: {
        ...DEFAULT_THEME.colors.date,
        ...theme.colors?.date,
      },
      input: {
        ...DEFAULT_THEME.colors.input,
        ...theme.colors?.input,
      },
      checkbox: {
        ...DEFAULT_THEME.colors.checkbox,
        ...theme.colors?.checkbox,
      },
      radio: {
        ...DEFAULT_THEME.colors.radio,
        ...theme.colors?.radio,
      },
      button: {
        ...DEFAULT_THEME.colors.button,
        ...theme.colors?.button,
      },
      dropdown: {
        ...DEFAULT_THEME.colors.dropdown,
        ...theme.colors?.dropdown,
      },
      scrollbar: {
        ...DEFAULT_THEME.colors.scrollbar,
        ...theme.colors?.scrollbar,
      },
      indicator: {
        ...DEFAULT_THEME.colors.indicator,
        ...theme.colors?.indicator,
      },
      tooltip: {
        ...DEFAULT_THEME.colors.tooltip,
        ...theme.colors?.tooltip,
      },
      image: {
        ...DEFAULT_THEME.colors.image,
        ...theme.colors?.image,
      },
      hiddenPlaceholder: {
        ...DEFAULT_THEME.colors.hiddenPlaceholder,
        ...theme.colors?.hiddenPlaceholder,
      },
      moreCount: {
        ...DEFAULT_THEME.colors.moreCount,
        ...theme.colors?.moreCount,
      },
      shadow: {
        ...DEFAULT_THEME.colors.shadow,
        ...theme.colors?.shadow,
      },
      watermark: {
        ...DEFAULT_THEME.colors.watermark,
        ...theme.colors?.watermark,
      },
      loading: theme.colors?.loading
        ? { ...DEFAULT_THEME.colors.loading, ...theme.colors.loading }
        : DEFAULT_THEME.colors.loading,
    },
    font: {
      ...DEFAULT_THEME.font,
      ...theme.font,
    },
    row: {
      ...DEFAULT_THEME.row,
      ...theme.row,
    },
    border: {
      ...DEFAULT_THEME.border,
      ...theme.border,
    },
  };
}
