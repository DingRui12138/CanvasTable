import type { CanvasTableLocale, DeepPartial, LocaleConfig, LocalePreset } from "../types";

export const zhCN: CanvasTableLocale = {
  emptyText: "暂无数据",
  loadingText: "加载中...",
  contextMenu: {
    pinTop: "固定到顶部",
    pinBottom: "固定到底部",
    unpin: "取消固定",
    addRowAbove: "上方添加行",
    addRowBelow: "下方添加行",
    deleteRow: "删除行",
    hideColumn: "隐藏列",
    showColumn: "显示列",
  },
  filter: {
    searchPlaceholder: "输入关键字筛选...",
    selectSearchPlaceholder: "搜索...",
    minPlaceholder: "最小值",
    maxPlaceholder: "最大值",
    startDatePlaceholder: "开始日期",
    endDatePlaceholder: "结束日期",
    reset: "重置",
    confirm: "确定",
    noData: "暂无数据",
    loading: "加载中...",
    all: "全部",
    yes: "是",
    no: "否",
    selected: "已选",
    unselected: "未选",
  },
  cell: {
    selectPlaceholder: "请选择",
    datePlaceholder: "选择日期",
    buttonText: "Button",
  },
  image: {
    uploadIdle: "点击上传或拖拽图片到此处",
    uploadDragging: "释放以上传图片",
    uploading: "上传中...",
  },
  calendar: {
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    yearMonthFormat: "{year}年 {month}",
  },
};

export const enUS: CanvasTableLocale = {
  emptyText: "No data",
  loadingText: "Loading...",
  contextMenu: {
    pinTop: "Pin to top",
    pinBottom: "Pin to bottom",
    unpin: "Unpin",
    addRowAbove: "Insert row above",
    addRowBelow: "Insert row below",
    deleteRow: "Delete row",
    hideColumn: "Hide column",
    showColumn: "Show column",
  },
  filter: {
    searchPlaceholder: "Enter keywords...",
    selectSearchPlaceholder: "Search...",
    minPlaceholder: "Min",
    maxPlaceholder: "Max",
    startDatePlaceholder: "Start date",
    endDatePlaceholder: "End date",
    reset: "Reset",
    confirm: "OK",
    noData: "No data",
    loading: "Loading...",
    all: "All",
    yes: "Yes",
    no: "No",
    selected: "Checked",
    unselected: "Unchecked",
  },
  cell: {
    selectPlaceholder: "Select",
    datePlaceholder: "Select date",
    buttonText: "Button",
  },
  image: {
    uploadIdle: "Click or drag images here",
    uploadDragging: "Release to upload",
    uploading: "Uploading...",
  },
  calendar: {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    yearMonthFormat: "{month} {year}",
  },
};

const PRESETS: Record<LocalePreset, CanvasTableLocale> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

function isLocaleOptions(
  config: LocaleConfig,
): config is { preset?: LocalePreset; messages?: DeepPartial<CanvasTableLocale> } {
  return (
    typeof config === "object" && config !== null && ("preset" in config || "messages" in config)
  );
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }
  if (value && typeof value === "object") {
    const cloned: Record<string, unknown> = {};
    for (const [key, childValue] of Object.entries(value as Record<string, unknown>)) {
      cloned[key] = cloneValue(childValue);
    }
    return cloned as T;
  }
  return value;
}

function deepMerge<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) {
    return cloneValue(base);
  }

  const result: Record<string, unknown> = cloneValue(base as Record<string, unknown>);
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value as DeepPartial<unknown>);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }

  return result as T;
}

export function resolveLocale(config?: LocaleConfig): CanvasTableLocale {
  if (!config) {
    return deepMerge(zhCN);
  }

  if (typeof config === "string") {
    return deepMerge(PRESETS[config] ?? zhCN);
  }

  if (isLocaleOptions(config)) {
    const preset = config.preset ?? "zh-CN";
    return deepMerge(PRESETS[preset] ?? zhCN, config.messages);
  }

  return deepMerge(zhCN, config);
}
