import type { CTElement, CTLayoutInfo } from './types';
import { MeasurementEngine } from './MeasurementEngine';
/**
 * 简化版 Flex 布局引擎
 * 支持: flexDirection, justifyContent, alignItems, gap, padding
 * 支持: position='relative' 定位模式（子元素用 x, y, zIndex 定位）
 */
export declare class LayoutEngine {
    private measurementEngine;
    private layoutResults;
    constructor(measurementEngine: MeasurementEngine);
    /**
     * 计算元素树布局，返回所有元素的绝对坐标
     */
    layout(root: CTElement, startX: number, startY: number): CTLayoutInfo[];
    private layoutElement;
    /**
     * 定位模式布局：子元素使用 x, y 相对于容器定位
     */
    private layoutPositionedGroup;
    private layoutGroup;
    /**
     * 测量 group 尺寸，不影响 layoutResults
     */
    private measureGroupSize;
    private parsePadding;
    private calculateContentSize;
    private calculateContentHeight;
    private layoutChildren;
}
//# sourceMappingURL=LayoutEngine.d.ts.map