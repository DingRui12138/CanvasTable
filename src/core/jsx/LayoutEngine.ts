// src/core/jsx/LayoutEngine.ts
import type { CTElement, CTLayoutInfo, CTLayoutNode, CTBoxProps } from "./types";
import { MeasurementEngine } from "./MeasurementEngine";

/**
 * 简化版 Flex 布局引擎
 * 支持: flexDirection, justifyContent, alignItems, gap, padding, margin
 * 支持: minWidth/maxWidth/minHeight/maxHeight, alignSelf
 * 支持: position='relative' 定位模式（子元素用 x, y, zIndex 定位）
 * 支持: width/height 百分比（"100%"），基于父容器尺寸（根元素基于传入的 parentSize）
 * 支持: overflow clipping
 *
 * 性能优化：
 * - 单次布局内 measureChildSize 结果按 (element, parentSize) 记忆化，避免子树重复测量
 * - layoutGroupNode 在容器尺寸已显式时直接进入定位阶段，避免预测量整棵子树
 */

type Margin = { top: number; right: number; bottom: number; left: number };

interface MeasureCacheEntry {
  size: CTLayoutInfo;
  parentSize?: { width: number; height: number };
}

const ZERO_MARGIN: Margin = { top: 0, right: 0, bottom: 0, left: 0 };

export class LayoutEngine {
  private measurementEngine: MeasurementEngine;
  private layoutResults: CTLayoutInfo[] = [];
  /** 当前根元素的父容器尺寸（通常是单元格尺寸），用于解析根元素百分比 */
  private rootParentSize: { width: number; height: number } | undefined;
  /** 单次 layout/layoutTree 调用内的 measureChildSize 缓存 */
  private measureCache: Map<CTElement, MeasureCacheEntry[]> = new Map();

  constructor(measurementEngine: MeasurementEngine) {
    this.measurementEngine = measurementEngine;
  }

  /**
   * 计算元素树布局，返回所有元素的绝对坐标
   * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
   */
  layout(
    root: CTElement,
    startX: number,
    startY: number,
    parentSize?: { width: number; height: number },
  ): CTLayoutInfo[] {
    this.layoutResults = [];
    this.rootParentSize = parentSize;
    this.measureCache.clear();
    try {
      this.layoutElement(root, startX, startY, parentSize);
    } finally {
      this.rootParentSize = undefined;
      this.measureCache.clear();
    }
    // 按 zIndex 排序返回结果
    return this.layoutResults.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }

  /**
   * 计算元素树布局，返回树形结构（用于渲染时直接定位子元素）
   * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
   */
  layoutTree(
    root: CTElement,
    startX: number,
    startY: number,
    parentSize?: { width: number; height: number },
    _explicitCacheKey?: string | null,
  ): CTLayoutNode {
    this.rootParentSize = parentSize;
    this.measureCache.clear();
    try {
      const relative = this.layoutNode(root, 0, 0, parentSize);
      return startX === 0 && startY === 0
        ? relative
        : this.createOffsetLayoutTreeSimple(relative, startX, startY);
    } finally {
      this.rootParentSize = undefined;
      this.measureCache.clear();
    }
  }

  private createOffsetLayoutTreeSimple(
    node: CTLayoutNode,
    offsetX: number,
    offsetY: number,
  ): CTLayoutNode {
    return {
      ...node,
      x: node.x + offsetX,
      y: node.y + offsetY,
      offsetX,
      offsetY,
      children: node.children.map((child) => this.createOffsetLayoutTreeSimple(child, offsetX, offsetY)),
    };
  }

  /** 解析尺寸值（支持百分比字符串和数字） */
  private resolveSize(
    value: number | string | undefined,
    parentSize: number | undefined,
  ): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.endsWith("%")) {
      if (parentSize === undefined) return undefined;
      const percent = parseFloat(value);
      if (isNaN(percent)) return undefined;
      return (parentSize * percent) / 100;
    }
    return undefined;
  }

  private layoutNode(
    element: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
    presetSize?: { width: number; height: number; margin?: Margin },
  ): CTLayoutNode {
    // CTBox + display='flex' → Flex 布局
    if (element.type === "CTBox" && element.props.display === "flex") {
      return this.layoutGroupNode(element, x, y, parentSize, presetSize);
    }

    // CTBox + position='relative' → 定位模式
    if (element.type === "CTBox" && element.props.position === "relative") {
      return this.layoutPositionedGroupNode(element, x, y, parentSize, presetSize);
    }

    if (element.type === "CTTooltip" || element.type === "CTDropdown") {
      return this.layoutTransparentWrapperNode(element, x, y, parentSize, presetSize);
    }

    // 非容器元素：直接测量尺寸
    let width: number;
    let height: number;
    let margin: Margin;
    if (presetSize) {
      width = presetSize.width;
      height = presetSize.height;
      margin = presetSize.margin ?? this.parseMargin(element.props.margin as CTBoxProps["margin"]);
    } else {
      const size = this.measurementEngine.measureElement(element);
      const clampedSize = this.clampSize(size, element.props, parentSize);
      width = clampedSize.width;
      height = clampedSize.height;
      margin = this.parseMargin(element.props.margin as CTBoxProps["margin"]);
    }
    const zIndex = element.props.zIndex as number | undefined;
    return {
      element,
      x,
      y,
      width,
      height,
      zIndex,
      margin,
      children: [],
    };
  }

  private layoutTransparentWrapperNode(
    element: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
    presetSize?: { width: number; height: number; margin?: Margin },
  ): CTLayoutNode {
    const child = element.children[0];
    if (!child) {
      const width = presetSize?.width ?? 0;
      const height = presetSize?.height ?? 0;
      return {
        element,
        x,
        y,
        width,
        height,
        margin: presetSize?.margin ?? ZERO_MARGIN,
        children: [],
      };
    }

    const childNode = this.layoutNode(child, x, y, parentSize, presetSize);
    return {
      element,
      x: childNode.x,
      y: childNode.y,
      width: childNode.width,
      height: childNode.height,
      zIndex: childNode.zIndex,
      margin: childNode.margin,
      children: [childNode],
    };
  }

  private layoutTransparentWrapper(
    element: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
  ): CTLayoutInfo {
    const child = element.children[0];
    if (!child) {
      const layout = { x, y, width: 0, height: 0, margin: ZERO_MARGIN };
      this.layoutResults.push(layout);
      return layout;
    }
    return this.layoutElement(child, x, y, parentSize);
  }

  private layoutElement(
    element: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
  ): CTLayoutInfo {
    // CTBox + display='flex' → Flex 布局
    if (element.type === "CTBox" && element.props.display === "flex") {
      return this.layoutGroup(element, x, y, parentSize);
    }

    // CTBox + position='relative' → 定位模式
    if (element.type === "CTBox" && element.props.position === "relative") {
      return this.layoutPositionedGroup(element, x, y, parentSize);
    }

    if (element.type === "CTTooltip" || element.type === "CTDropdown") {
      return this.layoutTransparentWrapper(element, x, y, parentSize);
    }

    // 非容器元素：直接测量尺寸
    const size = this.measurementEngine.measureElement(element);
    const clampedSize = this.clampSize(size, element.props, parentSize);
    const zIndex = element.props.zIndex as number | undefined;
    const margin = this.parseMargin(element.props.margin as CTBoxProps["margin"]);
    const layout = {
      x,
      y,
      width: clampedSize.width,
      height: clampedSize.height,
      zIndex,
      margin,
    };
    this.layoutResults.push(layout);
    return layout;
  }

  /**
   * 解析容器自身尺寸：优先使用 width/height（支持百分比），否则用 fallback（内容尺寸）
   * 根元素（即 parentSize 来自外部传入时）默认撑满父容器
   */
  private resolveContainerSize(
    props: CTBoxProps,
    parentSize: { width: number; height: number } | undefined,
    fallbackWidth: number,
    fallbackHeight: number,
    isRoot: boolean,
  ): { width: number; height: number } {
    const parentW = parentSize?.width;
    const parentH = parentSize?.height;

    let width = this.resolveSize(props.width, parentW);
    let height = this.resolveSize(props.height, parentH);

    // 根元素无显式尺寸时默认 100%（撑满父容器）
    if (width === undefined) {
      width = isRoot && parentW !== undefined ? parentW : fallbackWidth;
    }
    if (height === undefined) {
      height = isRoot && parentH !== undefined ? parentH : fallbackHeight;
    }

    const minWidth = this.resolveSize(props.minWidth, parentW);
    const maxWidth = this.resolveSize(props.maxWidth, parentW);
    const minHeight = this.resolveSize(props.minHeight, parentH);
    const maxHeight = this.resolveSize(props.maxHeight, parentH);

    return {
      width: this.clampValue(width, minWidth, maxWidth),
      height: this.clampValue(height, minHeight, maxHeight),
    };
  }

  /**
   * 定位模式布局：子元素使用 x, y 相对于容器定位
   */
  private layoutPositionedGroup(
    group: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
  ): CTLayoutInfo {
    const props = group.props as CTBoxProps;
    const children = group.children || [];
    const isRoot = parentSize !== undefined && parentSize === this.rootParentSize;

    const { width: groupWidth, height: groupHeight } = this.resolveContainerSize(
      props,
      parentSize,
      100,
      100,
      isRoot,
    );

    // 按 zIndex 排序子元素
    const sortedChildren = [...children].sort((a, b) => {
      const aZ = (a.props.zIndex as number | undefined) ?? 0;
      const bZ = (b.props.zIndex as number | undefined) ?? 0;
      return aZ - bZ;
    });

    const childParentSize = { width: groupWidth, height: groupHeight };

    // 布局每个子元素
    for (const child of sortedChildren) {
      const childX = x + ((child.props.x as number | undefined) ?? 0);
      const childY = y + ((child.props.y as number | undefined) ?? 0);
      this.layoutElement(child, childX, childY, childParentSize);
    }

    const groupLayout = { x, y, width: groupWidth, height: groupHeight };
    this.layoutResults.push(groupLayout);
    return groupLayout;
  }

  private layoutPositionedGroupNode(
    group: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
    presetSize?: { width: number; height: number; margin?: Margin },
  ): CTLayoutNode {
    const props = group.props as CTBoxProps;
    const children = group.children || [];
    const isRoot = parentSize !== undefined && parentSize === this.rootParentSize;

    let groupWidth: number;
    let groupHeight: number;
    if (presetSize) {
      groupWidth = presetSize.width;
      groupHeight = presetSize.height;
    } else {
      const resolved = this.resolveContainerSize(props, parentSize, 100, 100, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    }

    const sortedChildren = [...children].sort((a, b) => {
      const aZ = (a.props.zIndex as number | undefined) ?? 0;
      const bZ = (b.props.zIndex as number | undefined) ?? 0;
      return aZ - bZ;
    });

    const childParentSize = { width: groupWidth, height: groupHeight };

    const childNodes: CTLayoutNode[] = sortedChildren.map((child) => {
      const childX = x + ((child.props.x as number | undefined) ?? 0);
      const childY = y + ((child.props.y as number | undefined) ?? 0);
      return this.layoutNode(child, childX, childY, childParentSize);
    });

    return {
      element: group,
      x,
      y,
      width: groupWidth,
      height: groupHeight,
      children: childNodes,
    };
  }

  private layoutGroup(
    group: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
  ): CTLayoutInfo {
    const props = group.props as CTBoxProps;
    const children = group.children || [];
    const isRoot = parentSize !== undefined && parentSize === this.rootParentSize;

    const padding = this.parsePadding(props.padding);

    // 先解析容器自身尺寸（基于 parentSize 解析百分比，根元素默认撑满）
    // 但若无显式尺寸且非根，需先测量子元素得到 contentSize
    const hasExplicitWidth =
      props.width !== undefined || (isRoot && parentSize?.width !== undefined);
    const hasExplicitHeight =
      props.height !== undefined || (isRoot && parentSize?.height !== undefined);

    // 子元素的 parentSize 暂时未知，待 groupWidth 确定后再测量
    let groupWidth: number;
    let groupHeight: number;

    if (hasExplicitWidth && hasExplicitHeight) {
      const resolved = this.resolveContainerSize(props, parentSize, 0, 0, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    } else {
      // 需要内容尺寸 fallback：先测量子元素
      const tempSizes: CTLayoutInfo[] = children.map((child) => this.measureChildSize(child));
      const contentWidth = this.calculateContentSize(tempSizes, props);
      const contentHeight = this.calculateContentHeight(tempSizes, props);
      const fallbackW = contentWidth + padding.left + padding.right;
      const fallbackH = contentHeight + padding.top + padding.bottom;
      const resolved = this.resolveContainerSize(props, parentSize, fallbackW, fallbackH, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    }

    // 重新基于 groupWidth/Height 测量子元素（让子元素百分比生效）
    const childContentSize = {
      width: groupWidth - padding.left - padding.right,
      height: groupHeight - padding.top - padding.bottom,
    };
    const childSizes: CTLayoutInfo[] = children.map((child) =>
      this.measureChildSize(child, childContentSize),
    );

    const contentX = x + padding.left;
    const contentY = y + padding.top;

    this.layoutChildren(
      children,
      childSizes,
      contentX,
      contentY,
      props,
      groupWidth,
      groupHeight,
      childContentSize,
    );

    const groupLayout = { x, y, width: groupWidth, height: groupHeight };
    this.layoutResults.push(groupLayout);
    return groupLayout;
  }

  private layoutGroupNode(
    group: CTElement,
    x: number,
    y: number,
    parentSize?: { width: number; height: number },
    presetSize?: { width: number; height: number; margin?: Margin },
  ): CTLayoutNode {
    const props = group.props as CTBoxProps;
    const children = group.children || [];
    const isRoot = parentSize !== undefined && parentSize === this.rootParentSize;

    const padding = this.parsePadding(props.padding);

    let groupWidth: number;
    let groupHeight: number;
    let childSizes: CTLayoutInfo[];

    const hasExplicitWidth =
      props.width !== undefined || (isRoot && parentSize?.width !== undefined);
    const hasExplicitHeight =
      props.height !== undefined || (isRoot && parentSize?.height !== undefined);

    if (presetSize) {
      // 父布局已传入最终尺寸，直接走子元素布局阶段
      groupWidth = presetSize.width;
      groupHeight = presetSize.height;
    } else if (hasExplicitWidth && hasExplicitHeight) {
      // 显式尺寸短路：跳过 measureTempChildren，直接基于父尺寸解析容器尺寸
      const resolved = this.resolveContainerSize(props, parentSize, 0, 0, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    } else {
      // 需要内容尺寸 fallback：测量一次子元素（无 parentSize），并通过 measureCache 复用
      const tempSizes: CTLayoutInfo[] = children.map((child) => this.measureChildSize(child));
      const contentWidth = this.calculateContentSize(tempSizes, props);
      const contentHeight = this.calculateContentHeight(tempSizes, props);
      const fallbackW = contentWidth + padding.left + padding.right;
      const fallbackH = contentHeight + padding.top + padding.bottom;
      const resolved = this.resolveContainerSize(props, parentSize, fallbackW, fallbackH, isRoot);
      groupWidth = resolved.width;
      groupHeight = resolved.height;
    }

    const childContentSize = {
      width: groupWidth - padding.left - padding.right,
      height: groupHeight - padding.top - padding.bottom,
    };

    // 测量子元素（带 measureCache，重复键命中复用）
    childSizes = children.map((child) => this.measureChildSize(child, childContentSize));

    const contentX = x + padding.left;
    const contentY = y + padding.top;

    // 计算子元素布局位置
    const direction = props.flexDirection ?? "row";
    const justifyContent = props.justifyContent ?? "flex-start";
    const alignItems = props.alignItems ?? "flex-start";
    let gap = props.gap ?? 0;

    // 可用空间（容器内容区）
    const availableWidth = childContentSize.width;
    const availableHeight = childContentSize.height;

    const contentWidth = this.calculateContentSize(childSizes, props);
    const contentHeight = this.calculateContentHeight(childSizes, props);

    // 计算主轴起点偏移
    let mainOffset = 0;
    if (direction === "row" || direction === "row-reverse") {
      mainOffset = this.calcMainOffset(
        availableWidth,
        contentWidth,
        justifyContent,
        childSizes,
        children.length,
        gap,
      );
      if (justifyContent === "space-between" && children.length > 1) {
        const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
        gap = (availableWidth - totalChild) / (children.length - 1);
      } else if (justifyContent === "space-around" && children.length > 0) {
        const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
        const space = (availableWidth - totalChild) / children.length;
        mainOffset = space / 2;
        gap = space;
      } else if (justifyContent === "space-evenly" && children.length > 0) {
        const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
        const space = (availableWidth - totalChild) / (children.length + 1);
        mainOffset = space;
        gap = space;
      }
    } else {
      mainOffset = this.calcMainOffset(
        availableHeight,
        contentHeight,
        justifyContent,
        childSizes,
        children.length,
        gap,
      );
      if (justifyContent === "space-between" && children.length > 1) {
        const totalChild = childSizes.reduce((s, c) => s + c.height, 0);
        gap = (availableHeight - totalChild) / (children.length - 1);
      } else if (justifyContent === "space-around" && children.length > 0) {
        const totalChild = childSizes.reduce((s, c) => s + c.height, 0);
        const space = (availableHeight - totalChild) / children.length;
        mainOffset = space / 2;
        gap = space;
      } else if (justifyContent === "space-evenly" && children.length > 0) {
        const totalChild = childSizes.reduce((s, c) => s + c.height, 0);
        const space = (availableHeight - totalChild) / (children.length + 1);
        mainOffset = space;
        gap = space;
      }
    }

    let currentMain = mainOffset;
    const childNodes: CTLayoutNode[] = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      const size = childSizes[i]!;
      const childMargin = size.margin ?? ZERO_MARGIN;

      // 自身尺寸（不含 margin）
      const childWidth = size.width - childMargin.left - childMargin.right;
      const childHeight = size.height - childMargin.top - childMargin.bottom;

      // alignSelf: 子元素可以覆盖父容器的 alignItems
      const effectiveAlignSelf = (child.props.alignSelf as CTBoxProps["alignSelf"]) ?? alignItems;

      let crossOffset = 0;
      if (direction === "row" || direction === "row-reverse") {
        crossOffset = this.calcCrossOffset(availableHeight, childHeight, effectiveAlignSelf);
      } else {
        crossOffset = this.calcCrossOffset(availableWidth, childWidth, effectiveAlignSelf);
      }

      let childX, childY;
      if (direction === "row") {
        childX = contentX + currentMain + childMargin.left;
        childY = contentY + crossOffset + childMargin.top;
      } else if (direction === "row-reverse") {
        childX = contentX + availableWidth - currentMain - size.width + childMargin.left;
        childY = contentY + crossOffset + childMargin.top;
      } else if (direction === "column") {
        childX = contentX + crossOffset + childMargin.left;
        childY = contentY + currentMain + childMargin.top;
      } else {
        childX = contentX + crossOffset + childMargin.left;
        childY = contentY + availableHeight - currentMain - size.height + childMargin.top;
      }

      // 把已测得的尺寸传递给子布局，避免子布局再次预测量自己的子树
      childNodes.push(
        this.layoutNode(child, childX, childY, childContentSize, {
          width: childWidth,
          height: childHeight,
          margin: childMargin,
        }),
      );

      currentMain +=
        (direction === "row" || direction === "row-reverse" ? size.width : size.height) + gap;
    }

    return {
      element: group,
      x,
      y,
      width: groupWidth,
      height: groupHeight,
      children: childNodes,
    };
  }

  /**
   * 测量子元素尺寸（包含 margin），用于 flex 布局计算
   * @param parentSize 父容器内容区尺寸，用于解析子元素的百分比 width/height
   *
   * 单次布局内对相同 (element, parentSize) 的请求记忆化。
   */
  private measureChildSize(
    child: CTElement,
    parentSize?: { width: number; height: number },
  ): CTLayoutInfo {
    let bucket = this.measureCache.get(child);
    if (bucket) {
      for (let i = 0; i < bucket.length; i++) {
        const entry = bucket[i]!;
        if (this.parentSizeMatches(entry.parentSize, parentSize)) {
          return entry.size;
        }
      }
    }

    const margin = this.parseMargin(child.props.margin as CTBoxProps["margin"]);

    let result: CTLayoutInfo;
    if (child.type === "CTBox" && child.props.display === "flex") {
      const groupSize = this.measureGroupSize(child, parentSize);
      result = {
        x: 0,
        y: 0,
        width: groupSize.width + margin.left + margin.right,
        height: groupSize.height + margin.top + margin.bottom,
        margin,
      };
    } else if (child.type === "CTBox" && child.props.position === "relative") {
      const props = child.props as CTBoxProps;
      const parentW = parentSize?.width;
      const parentH = parentSize?.height;
      const w = this.resolveSize(props.width, parentW) ?? 100;
      const h = this.resolveSize(props.height, parentH) ?? 100;
      const minW = this.resolveSize(props.minWidth, parentW);
      const maxW = this.resolveSize(props.maxWidth, parentW);
      const minH = this.resolveSize(props.minHeight, parentH);
      const maxH = this.resolveSize(props.maxHeight, parentH);
      result = {
        x: 0,
        y: 0,
        width: this.clampValue(w, minW, maxW) + margin.left + margin.right,
        height: this.clampValue(h, minH, maxH) + margin.top + margin.bottom,
        margin,
      };
    } else {
      const size = this.measurementEngine.measureElement(child);
      const clampedSize = this.clampSize(size, child.props, parentSize);
      result = {
        x: 0,
        y: 0,
        width: clampedSize.width + margin.left + margin.right,
        height: clampedSize.height + margin.top + margin.bottom,
        margin,
      };
    }

    if (!bucket) {
      bucket = [];
      this.measureCache.set(child, bucket);
    }
    bucket.push({
      size: result,
      parentSize: parentSize ? { ...parentSize } : undefined,
    });
    return result;
  }

  /**
   * 测量 group 尺寸，不影响 layoutResults
   *
   * 显式尺寸短路：当 props.width/height 已显式给出时，不递归测量子元素，
   * 仅基于声明值（含 min/max clamp）返回容器尺寸。
   */
  private measureGroupSize(
    group: CTElement,
    parentSize?: { width: number; height: number },
  ): CTLayoutInfo {
    const props = group.props as CTBoxProps;
    const children = group.children || [];
    const padding = this.parsePadding(props.padding);

    const parentW = parentSize?.width;
    const parentH = parentSize?.height;

    const explicitWidth = this.resolveSize(props.width, parentW);
    const explicitHeight = this.resolveSize(props.height, parentH);

    let groupWidth: number;
    let groupHeight: number;

    if (explicitWidth !== undefined && explicitHeight !== undefined) {
      // 短路：完全显式尺寸下，无需递归子树
      groupWidth = explicitWidth;
      groupHeight = explicitHeight;
    } else {
      const childSizes: CTLayoutInfo[] = children.map((child) => this.measureChildSize(child));
      const contentWidth = this.calculateContentSize(childSizes, props);
      const contentHeight = this.calculateContentHeight(childSizes, props);
      groupWidth = explicitWidth ?? contentWidth + padding.left + padding.right;
      groupHeight = explicitHeight ?? contentHeight + padding.top + padding.bottom;
    }

    const minW = this.resolveSize(props.minWidth, parentW);
    const maxW = this.resolveSize(props.maxWidth, parentW);
    const minH = this.resolveSize(props.minHeight, parentH);
    const maxH = this.resolveSize(props.maxHeight, parentH);

    return {
      x: 0,
      y: 0,
      width: this.clampValue(groupWidth, minW, maxW),
      height: this.clampValue(groupHeight, minH, maxH),
    };
  }

  // ─── Helpers ───

  private parsePadding(
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number },
  ) {
    if (padding === undefined) return { top: 0, right: 0, bottom: 0, left: 0 };
    if (typeof padding === "number")
      return { top: padding, right: padding, bottom: padding, left: padding };
    return {
      top: padding.top ?? 0,
      right: padding.right ?? 0,
      bottom: padding.bottom ?? 0,
      left: padding.left ?? 0,
    };
  }

  private parseMargin(
    margin?: number | { top?: number; right?: number; bottom?: number; left?: number },
  ): Margin {
    if (margin === undefined) return { top: 0, right: 0, bottom: 0, left: 0 };
    if (typeof margin === "number")
      return { top: margin, right: margin, bottom: margin, left: margin };
    return {
      top: margin.top ?? 0,
      right: margin.right ?? 0,
      bottom: margin.bottom ?? 0,
      left: margin.left ?? 0,
    };
  }

  private clampValue(value: number, min?: number, max?: number): number {
    if (min !== undefined) value = Math.max(min, value);
    if (max !== undefined) value = Math.min(max, value);
    return value;
  }

  private clampSize(
    size: CTLayoutInfo,
    props: Record<string, unknown>,
    parentSize?: { width: number; height: number },
  ): CTLayoutInfo {
    const parentW = parentSize?.width;
    const parentH = parentSize?.height;
    const minWidth = this.resolveSize(props.minWidth as number | string | undefined, parentW);
    const maxWidth = this.resolveSize(props.maxWidth as number | string | undefined, parentW);
    const minHeight = this.resolveSize(props.minHeight as number | string | undefined, parentH);
    const maxHeight = this.resolveSize(props.maxHeight as number | string | undefined, parentH);
    return {
      x: size.x,
      y: size.y,
      width: this.clampValue(size.width, minWidth, maxWidth),
      height: this.clampValue(size.height, minHeight, maxHeight),
    };
  }

  private calcMainOffset(
    availableSize: number,
    contentSize: number,
    justifyContent: string,
    childSizes: CTLayoutInfo[],
    childCount: number,
    _gap: number,
  ): number {
    if (justifyContent === "center") return (availableSize - contentSize) / 2;
    if (justifyContent === "flex-end") return availableSize - contentSize;
    if (justifyContent === "space-between" && childCount > 1) {
      return 0; // gap will be recalculated externally
    }
    if (justifyContent === "space-around" && childCount > 0) {
      const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
      const space = (availableSize - totalChild) / childCount;
      return space / 2;
    }
    if (justifyContent === "space-evenly" && childCount > 0) {
      const totalChild = childSizes.reduce((s, c) => s + c.width, 0);
      const space = (availableSize - totalChild) / (childCount + 1);
      return space;
    }
    return 0; // flex-start
  }

  private calcCrossOffset(availableSize: number, childSize: number, align: string): number {
    if (align === "center") return (availableSize - childSize) / 2;
    if (align === "flex-end") return availableSize - childSize;
    if (align === "stretch") return 0; // stretch handled differently - child fills available space
    return 0; // flex-start
  }

  private calculateContentSize(sizes: CTLayoutInfo[], props: CTBoxProps): number {
    const gap = props.gap ?? 0;
    const direction = props.flexDirection ?? "row";

    if (direction === "row" || direction === "row-reverse") {
      const totalWidth = sizes.reduce((sum, s) => sum + s.width, 0);
      const gaps = sizes.length > 1 ? (sizes.length - 1) * gap : 0;
      return totalWidth + gaps;
    } else {
      return Math.max(...sizes.map((s) => s.width), 0);
    }
  }

  private calculateContentHeight(sizes: CTLayoutInfo[], props: CTBoxProps): number {
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
    props: CTBoxProps,
    _groupWidth: number,
    _groupHeight: number,
    childContentSize: { width: number; height: number },
  ): void {
    const direction = props.flexDirection ?? "row";
    const justifyContent = props.justifyContent ?? "flex-start";
    const alignItems = props.alignItems ?? "flex-start";
    let gap = props.gap ?? 0;

    const contentWidth = this.calculateContentSize(sizes, props);
    const contentHeight = this.calculateContentHeight(sizes, props);

    const availableWidth = childContentSize.width;
    const availableHeight = childContentSize.height;

    let mainOffset = 0;
    if (direction === "row" || direction === "row-reverse") {
      mainOffset = this.calcMainOffset(
        availableWidth,
        contentWidth,
        justifyContent,
        sizes,
        children.length,
        gap,
      );
      if (justifyContent === "space-between" && children.length > 1) {
        const totalChild = sizes.reduce((s, c) => s + c.width, 0);
        gap = (availableWidth - totalChild) / (children.length - 1);
      }
      if (justifyContent === "space-around" && children.length > 0) {
        const totalChild = sizes.reduce((s, c) => s + c.width, 0);
        const space = (availableWidth - totalChild) / children.length;
        mainOffset = space / 2;
        gap = space;
      }
      if (justifyContent === "space-evenly" && children.length > 0) {
        const totalChild = sizes.reduce((s, c) => s + c.width, 0);
        const space = (availableWidth - totalChild) / (children.length + 1);
        mainOffset = space;
        gap = space;
      }
    } else {
      mainOffset = this.calcMainOffset(
        availableHeight,
        contentHeight,
        justifyContent,
        sizes,
        children.length,
        gap,
      );
      if (justifyContent === "space-between" && children.length > 1) {
        const totalChild = sizes.reduce((s, c) => s + c.height, 0);
        gap = (availableHeight - totalChild) / (children.length - 1);
      }
      if (justifyContent === "space-around" && children.length > 0) {
        const totalChild = sizes.reduce((s, c) => s + c.height, 0);
        const space = (availableHeight - totalChild) / children.length;
        mainOffset = space / 2;
        gap = space;
      }
      if (justifyContent === "space-evenly" && children.length > 0) {
        const totalChild = sizes.reduce((s, c) => s + c.height, 0);
        const space = (availableHeight - totalChild) / (children.length + 1);
        mainOffset = space;
        gap = space;
      }
    }

    let currentMain = mainOffset;
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!;
      const size = sizes[i]!;
      const childMargin = size.margin ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      const childWidth = size.width - childMargin.left - childMargin.right;
      const childHeight = size.height - childMargin.top - childMargin.bottom;

      // alignSelf override
      const effectiveAlign = (child.props.alignSelf as CTBoxProps["alignSelf"]) ?? alignItems;

      let crossOffset = 0;
      if (direction === "row" || direction === "row-reverse") {
        crossOffset = this.calcCrossOffset(availableHeight, childHeight, effectiveAlign);
      } else {
        crossOffset = this.calcCrossOffset(availableWidth, childWidth, effectiveAlign);
      }

      let childX, childY;
      if (direction === "row") {
        childX = contentX + currentMain + childMargin.left;
        childY = contentY + crossOffset + childMargin.top;
      } else if (direction === "row-reverse") {
        childX = contentX + availableWidth - currentMain - size.width + childMargin.left;
        childY = contentY + crossOffset + childMargin.top;
      } else if (direction === "column") {
        childX = contentX + crossOffset + childMargin.left;
        childY = contentY + currentMain + childMargin.top;
      } else {
        childX = contentX + crossOffset + childMargin.left;
        childY = contentY + availableHeight - currentMain - size.height + childMargin.top;
      }

      this.layoutElement(child, childX, childY, childContentSize);
      currentMain +=
        (direction === "row" || direction === "row-reverse" ? size.width : size.height) + gap;
    }
  }

  // ─── measureCache / parent size match helpers ───

  private parentSizeMatches(
    cachedParentSize: { width: number; height: number } | undefined,
    parentSize?: { width: number; height: number },
  ): boolean {
    if (cachedParentSize === undefined || parentSize === undefined) {
      return cachedParentSize === undefined && parentSize === undefined;
    }
    return (
      cachedParentSize.width === parentSize.width && cachedParentSize.height === parentSize.height
    );
  }
}
