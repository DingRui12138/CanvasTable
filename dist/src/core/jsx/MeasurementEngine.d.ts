import type { CTElement, CTLayoutInfo } from "./types";
import type { CellRenderTrace } from "../renderers/CellRenderer";
export declare class MeasurementEngine {
    private ctx;
    private trace?;
    constructor(ctx: CanvasRenderingContext2D, trace?: CellRenderTrace);
    setContext(ctx: CanvasRenderingContext2D): void;
    setTrace(trace?: CellRenderTrace): void;
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