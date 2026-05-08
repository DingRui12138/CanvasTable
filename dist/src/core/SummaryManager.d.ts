import type { ComputedSummaryResult, SummaryConfig, SummaryContext } from "../types";
export declare class SummaryManager {
    static buildRows(config: SummaryConfig | undefined, context: SummaryContext, defaultRowHeight: number): ComputedSummaryResult;
    private static normalizeRowResult;
    private static buildCells;
    private static resolveColumnRange;
    private static resolveRenderResult;
}
//# sourceMappingURL=SummaryManager.d.ts.map