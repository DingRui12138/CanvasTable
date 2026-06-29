import type { CTElement, CTLayoutInfo, CTLayoutNode } from "./types";
import { MeasurementEngine } from "./MeasurementEngine";
export declare class LayoutEngine {
    private measurementEngine;
    private layoutResults;
    /** 当前根元素的父容器尺寸（通常是单元格尺寸），用于解析根元素百分比 */
    private rootParentSize;
    /** 单次 layout/layoutTree 调用内的 measureChildSize 缓存 */
    private measureCache;
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
    }, explicitCacheKey?: string | null): CTLayoutNode;
    /** 解析尺寸值（支持百分比字符串和数字） */
    private resolveSize;
    private layoutNode;
    private layoutTransparentWrapperNode;
    private layoutTransparentWrapper;
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
     *
     * 单次布局内对相同 (element, parentSize) 的请求记忆化。
     */
    private measureChildSize;
    /**
     * 测量 group 尺寸，不影响 layoutResults
     *
     * 显式尺寸短路：当 props.width/height 已显式给出时，不递归测量子元素，
     * 仅基于声明值（含 min/max clamp）返回容器尺寸。
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
    private parentSizeMatches;
    private buildExplicitCacheKey;
    private buildRelativeCacheKey;
    /**
     * 生成元素树签名。遇到会影响布局但无法序列化的值（Symbol、循环引用等）返回 null，
     * 以放弃缓存而不是冒着错误命中渲染的风险。事件回调不参与布局签名。
     */
    private elementSignature;
    private appendElementSignature;
    private appendPropsSignature;
    private isEventCallbackProp;
    private appendValueSignature;
    private cacheRelativeTree;
    private cloneTreeForCache;
    private createOffsetLayoutTree;
}
//# sourceMappingURL=LayoutEngine.d.ts.map