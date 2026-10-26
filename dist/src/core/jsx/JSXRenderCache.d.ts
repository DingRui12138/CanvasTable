import type { CTLayoutNode } from './types';
export interface JSXRenderCacheStats {
    planHits: number;
    planMisses: number;
    planEvictions: number;
}
export interface JSXRenderCacheOptions {
    maxPlans?: number;
}
export declare class JSXRenderCache {
    private readonly maxPlans;
    private readonly plans;
    private stats;
    constructor(options?: JSXRenderCacheOptions);
    getOrCreatePlan(key: string, factory: () => CTLayoutNode): CTLayoutNode;
    clear(): void;
    resetStats(): void;
    getStats(): JSXRenderCacheStats;
}
//# sourceMappingURL=JSXRenderCache.d.ts.map