// src/core/jsx/LayoutEngine.ts
import type { CTElement, CTLayoutInfo, CTGroupProps } from "./types";
import { MeasurementEngine } from "./MeasurementEngine";

/**
 * 简化版 Flex 布局引擎
 * 支持: flexDirection, justifyContent, alignItems, gap, padding
 * 支持: position='relative' 定位模式（子元素用 x, y, zIndex 定位）
 */
export class LayoutEngine {
  private measurementEngine: MeasurementEngine;
  private layoutResults: CTLayoutInfo[] = [];

  constructor(measurementEngine: MeasurementEngine) {
    this.measurementEngine = measurementEngine;
  }

  /**
   * 计算元素树布局，返回所有元素的绝对坐标
   */
  layout(root: CTElement, startX: number, startY: number): CTLayoutInfo[] {
    this.layoutResults = [];
    this.layoutElement(root, startX, startY);
    // 按 zIndex 排序返回结果
    return this.layoutResults.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }

  private layoutElement(element: CTElement, x: number, y: number): CTLayoutInfo {
    // CTGroup + display='flex' → Flex 布局
    if (element.type === "CTGroup" && element.props.display === "flex") {
      return this.layoutGroup(element, x, y);
    }

    // CTGroup + position='relative' → 定位模式
    if (element.type === "CTGroup" && element.props.position === "relative") {
      return this.layoutPositionedGroup(element, x, y);
    }

    // 非容器元素：直接测量尺寸
    const size = this.measurementEngine.measureElement(element);
    const zIndex = element.props.zIndex as number | undefined;
    const layout = { x, y, width: size.width, height: size.height, zIndex };
    this.layoutResults.push(layout);
    return layout;
  }

  /**
   * 定位模式布局：子元素使用 x, y 相对于容器定位
   */
  private layoutPositionedGroup(group: CTElement, x: number, y: number): CTLayoutInfo {
    const props = group.props as CTGroupProps;
    const children = group.children || [];

    // 定位模式下，容器尺寸由 props.width/height 指定（必须指定）
    const groupWidth = props.width ?? 100;
    const groupHeight = props.height ?? 100;

    // 按 zIndex 排序子元素
    const sortedChildren = [...children].sort((a, b) => {
      const aZ = (a.props.zIndex as number | undefined) ?? 0;
      const bZ = (b.props.zIndex as number | undefined) ?? 0;
      return aZ - bZ;
    });

    // 布局每个子元素
    for (const child of sortedChildren) {
      // 子元素的 x, y 是相对于父容器的位置
      const childX = x + ((child.props.x as number | undefined) ?? 0);
      const childY = y + ((child.props.y as number | undefined) ?? 0);

      // 递归布局子元素
      this.layoutElement(child, childX, childY);
    }

    // 返回 group 的布局信息
    return { x, y, width: groupWidth, height: groupHeight };
  }

  private layoutGroup(group: CTElement, x: number, y: number): CTLayoutInfo {
    const props = group.props as CTGroupProps;
    const children = group.children || [];

    // 解析 padding
    const padding = this.parsePadding(props.padding);

    // 测量所有子元素尺寸（使用独立方法避免影响 layoutResults）
    const childSizes: CTLayoutInfo[] = children.map((child) => {
      if (child.type === "CTGroup" && child.props.display === "flex") {
        // 使用独立方法测量 flex 嵌套 group 尺寸
        return this.measureGroupSize(child);
      }
      if (child.type === "CTGroup" && child.props.position === "relative") {
        // 定位模式 group：尺寸由 props.width/height 指定
        const props = child.props as CTGroupProps;
        return {
          x: 0,
          y: 0,
          width: props.width ?? 100,
          height: props.height ?? 100,
        };
      }
      return this.measurementEngine.measureElement(child);
    });

    // 计算内容区域尺寸
    const contentWidth = this.calculateContentSize(childSizes, props);
    const contentHeight = this.calculateContentHeight(childSizes, props);

    // group 尺寸：优先使用 props 指定，否则使用内容尺寸
    const groupWidth = props.width ?? contentWidth + padding.left + padding.right;
    const groupHeight = props.height ?? contentHeight + padding.top + padding.bottom;

    // 计算子元素位置
    const contentX = x + padding.left;
    const contentY = y + padding.top;

    this.layoutChildren(children, childSizes, contentX, contentY, props);

    // 返回 group 的布局信息（用于父级布局）
    return { x, y, width: groupWidth, height: groupHeight };
  }

  /**
   * 测量 group 尺寸，不影响 layoutResults
   */
  private measureGroupSize(group: CTElement): CTLayoutInfo {
    const props = group.props as CTGroupProps;
    const children = group.children || [];
    const padding = this.parsePadding(props.padding);

    // 测量子元素尺寸
    const childSizes: CTLayoutInfo[] = children.map((child) => {
      if (child.type === "CTGroup" && child.props.display === "flex") {
        return this.measureGroupSize(child);
      }
      return this.measurementEngine.measureElement(child);
    });

    // 计算内容尺寸
    const contentWidth = this.calculateContentSize(childSizes, props);
    const contentHeight = this.calculateContentHeight(childSizes, props);

    // group 尺寸
    const groupWidth = props.width ?? contentWidth + padding.left + padding.right;
    const groupHeight = props.height ?? contentHeight + padding.top + padding.bottom;

    return { x: 0, y: 0, width: groupWidth, height: groupHeight };
  }

  private parsePadding(
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number },
  ) {
    if (padding === undefined) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    if (typeof padding === "number") {
      return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return {
      top: padding.top ?? 0,
      right: padding.right ?? 0,
      bottom: padding.bottom ?? 0,
      left: padding.left ?? 0,
    };
  }

  private calculateContentSize(sizes: CTLayoutInfo[], props: CTGroupProps): number {
    const gap = props.gap ?? 0;
    const direction = props.flexDirection ?? "row";

    if (direction === "row" || direction === "row-reverse") {
      // 主轴（水平）：子元素宽度之和 + gap
      const totalWidth = sizes.reduce((sum, s) => sum + s.width, 0);
      const gaps = sizes.length > 1 ? (sizes.length - 1) * gap : 0;
      return totalWidth + gaps;
    } else {
      // 主轴（垂直）：取最大宽度
      return Math.max(...sizes.map((s) => s.width), 0);
    }
  }

  private calculateContentHeight(sizes: CTLayoutInfo[], props: CTGroupProps): number {
    const gap = props.gap ?? 0;
    const direction = props.flexDirection ?? "row";

    if (direction === "column" || direction === "column-reverse") {
      const totalHeight = sizes.reduce((sum, s) => sum + s.height, 0);
      const gaps = sizes.length > 1 ? (sizes.length - 1) * gap : 0;
      return totalHeight + gaps;
    } else {
      return Math.max(...sizes.map((s) => s.height), 0);
    }
  }

  private layoutChildren(
    children: CTElement[],
    sizes: CTLayoutInfo[],
    contentX: number,
    contentY: number,
    props: CTGroupProps,
  ): void {
    const direction = props.flexDirection ?? "row";
    const justifyContent = props.justifyContent ?? "flex-start";
    const alignItems = props.alignItems ?? "flex-start";
    let gap = props.gap ?? 0;

    // 计算内容尺寸
    const contentWidth = this.calculateContentSize(sizes, props);
    const contentHeight = this.calculateContentHeight(sizes, props);

    // 可用空间（使用 props 指定的尺寸减去 padding）
    const availableWidth =
      (props.width ?? contentWidth) -
      (props.padding
        ? this.parsePadding(props.padding).left + this.parsePadding(props.padding).right
        : 0);
    const availableHeight =
      (props.height ?? contentHeight) -
      (props.padding
        ? this.parsePadding(props.padding).top + this.parsePadding(props.padding).bottom
        : 0);

    // 计算主轴起点偏移
    let mainOffset = 0;
    if (direction === "row" || direction === "row-reverse") {
      if (justifyContent === "center") {
        mainOffset = (availableWidth - contentWidth) / 2;
      } else if (justifyContent === "flex-end") {
        mainOffset = availableWidth - contentWidth;
      } else if (justifyContent === "space-between" && children.length > 1) {
        // space-between: 首尾贴边，中间均匀分布
        const extraSpace = availableWidth - sizes.reduce((sum, s) => sum + s.width, 0);
        gap = extraSpace / (children.length - 1);
      }
    } else {
      if (justifyContent === "center") {
        mainOffset = (availableHeight - contentHeight) / 2;
      } else if (justifyContent === "flex-end") {
        mainOffset = availableHeight - contentHeight;
      } else if (justifyContent === "space-between" && children.length > 1) {
        const extraSpace = availableHeight - sizes.reduce((sum, s) => sum + s.height, 0);
        gap = extraSpace / (children.length - 1);
      }
    }

    // 遍历子元素布局
    let currentMain = mainOffset;
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      const size = sizes[i]!;

      // 计算交叉轴偏移
      let crossOffset = 0;
      if (direction === "row" || direction === "row-reverse") {
        if (alignItems === "center") {
          crossOffset = (availableHeight - size.height) / 2;
        } else if (alignItems === "flex-end") {
          crossOffset = availableHeight - size.height;
        }
      } else {
        if (alignItems === "center") {
          crossOffset = (availableWidth - size.width) / 2;
        } else if (alignItems === "flex-end") {
          crossOffset = availableWidth - size.width;
        }
      }

      // 计算绝对坐标
      let childX, childY;
      if (direction === "row") {
        childX = contentX + currentMain;
        childY = contentY + crossOffset;
      } else if (direction === "row-reverse") {
        childX = contentX + availableWidth - currentMain - size.width;
        childY = contentY + crossOffset;
      } else if (direction === "column") {
        childX = contentX + crossOffset;
        childY = contentY + currentMain;
      } else {
        // column-reverse
        childX = contentX + crossOffset;
        childY = contentY + availableHeight - currentMain - size.height;
      }

      // 递归布局子元素
      this.layoutElement(child, childX, childY);

      // 更新主轴位置
      currentMain +=
        (direction === "row" || direction === "row-reverse" ? size.width : size.height) + gap;
    }
  }
}
