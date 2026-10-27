/**
 * WheelHandler - Handles wheel / scroll interactions
 *
 * Routes wheel events to inner scrollable overlays (image preview, image editor,
 * filter/select dropdowns) and otherwise scrolls the table. Also owns lazy-load
 * detection and the programmatic scroll entry point.
 */
import { BaseHandler, HandlerContext, InteractionEvents } from "./BaseHandler";
import { EventEmitter } from "../EventEmitter";
import { DropdownHandler } from "./DropdownHandler";
import { ImageHandler } from "./ImageHandler";
import { TooltipHandler } from "./TooltipHandler";
export declare class WheelHandler extends BaseHandler {
    private dropdownHandler;
    private imageHandler;
    private tooltipHandler;
    private lazyLoadEnabled;
    private lazyLoadThreshold;
    private isLoadingMore;
    private hasMoreData;
    private scrollTimeout;
    constructor(context: HandlerContext, eventEmitter: EventEmitter<InteractionEvents>, dropdownHandler: DropdownHandler, imageHandler: ImageHandler, tooltipHandler: TooltipHandler);
    setLazyLoadConfig(enabled: boolean, threshold: number): void;
    setLoadingMore(loading: boolean): void;
    setHasMore(hasMore: boolean): void;
    destroy(): void;
    handleWheel(e: WheelEvent): void;
    handleExternalWheel(deltaX: number, deltaY: number): void;
    /** 更新所有 dropdown 位置（滚动时调用） */
    updateAllDropdownPositions(): void;
    /**
     * 检查是否需要触发懒加载
     */
    private checkLazyLoad;
}
//# sourceMappingURL=WheelHandler.d.ts.map