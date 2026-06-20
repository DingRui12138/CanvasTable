import type { CTElement, CTLayoutInfo } from "./types";
import type { CellRenderTrace } from "../renderers/CellRenderer";
/**
 * 尺寸测量引擎
 * CTText: 自动测量宽度，高度由 fontSize/lineHeight 决定
 * 其他图元: 直接读取 width/height 属性
 */
export declare class MeasurementEngine {
    private ctx;
    private trace?;
    constructor(ctx: CanvasRenderingContext2D, trace?: CellRenderTrace);
    private traceStep;
    measureTextWidth(text: string, fontSize: number, fontFamily: string, fontWeight?: string, fontStyle?: string): number;
    measureElement(element: CTElement): CTLayoutInfo;
    private measureText;
    private measureBox;
    private measureCircle;
    private measureImage;
    private measureLine;
}
//# sourceMappingURL=MeasurementEngine.d.ts.map