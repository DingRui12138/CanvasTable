import type { CTElement, CTLayoutInfo, CTLayoutNode } from "./types";
import { MeasurementEngine } from "./MeasurementEngine";
/**
 * 简化版 Flex 布局引擎
 * 支持: flexDirection, justifyContent, alignItems, gap, padding, margin
 * 支持: minWidth/maxWidth/minHeight/maxHeight, alignSelf
 * 支持: position='relative' 定位模式（子元素用 x, y, zIndex 定位）
 * 支持: width/height 百分比（"100%"），基于父容器尺寸（根元素基于传入的 parentSize）
 * 支持: overflow clipping
 */
export declare class LayoutEngine {
    private measurementEngine;
    private layoutResults;
    /** 当前根元素的父容器尺寸（通常是单元格尺寸），用于解析根元素百分比 */
    private rootParentSize;
    constructor(measurementEngine: MeasurementEngine);
    /**
     * 计算元素树布局，返回所有元素的绝对坐标
     * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
     */
    layout(root: CTElement, startX: number, startY: number, parentSize?: {
        width: number;
        height: number;
    }): CTLayoutInfo[];
    /**
     * 计算元素树布局，返回树形结构（用于渲染时直接定位子元素）
     * @param parentSize 父容器尺寸，用于解析根元素的百分比 width/height
     */
    layoutTree(root: CTElement, startX: number, startY: number, parentSize?: {
        width: number;
        height: number;
    }): CTLayoutNode;
    /** 解析尺寸值（支持百分比字符串和数字） */
    private resolveSize;
    private layoutNode;
    private layoutElement;
    /**
     * 解析容器自身尺寸：优先使用 width/height（支持百分比），否则用 fallback（内容尺寸）
     * 根元素（即 parentSize 来自外部传入时）默认撑满父容器
     */
    private resolveContainerSize;
    /**
     * 定位模式布局：子元素使用 x, y 相对于容器定位
     */
    private layoutPositionedGroup;
    private layoutPositionedGroupNode;
    private layoutGroup;
    private layoutGroupNode;
    /**
     * 测量子元素尺寸（包含 margin），用于 flex 布局计算
     * @param parentSize 父容器内容区尺寸，用于解析子元素的百分比 width/height
     */
    private measureChildSize;
    /**
     * 测量 group 尺寸，不影响 layoutResults
     */
    private measureGroupSize;
    private parsePadding;
    private parseMargin;
    private clampValue;
    private clampSize;
    private calcMainOffset;
    private calcCrossOffset;
    private calculateContentSize;
    private calculateContentHeight;
    private layoutChildren;
}
//# sourceMappingURL=LayoutEngine.d.ts.map