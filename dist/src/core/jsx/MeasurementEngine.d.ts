import type { CTElement, CTLayoutInfo } from "./types";
export declare class MeasurementEngine {
    private ctx;
    constructor(ctx: CanvasRenderingContext2D);
    setContext(ctx: CanvasRenderingContext2D): void;
    measureTextWidth(text: string, fontSize: number, fontFamily: string, fontWeight?: string, fontStyle?: string): number;
    measureElement(element: CTElement): CTLayoutInfo;
    private measureText;
    private measureBox;
    private measureCircle;
    private measureImage;
    private measureLine;
}
//# sourceMappingURL=MeasurementEngine.d.ts.map