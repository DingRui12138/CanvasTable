import type { CTLayoutNode } from './types';

export interface JSXRenderCacheStats {
  planHits: number;
  planMisses: number;
  planEvictions: number;
}

export interface JSXRenderCacheOptions {
  maxPlans?: number;
}

export class JSXRenderCache {
  private readonly maxPlans: number;
  private readonly plans = new Map<string, CTLayoutNode>();
  private stats: JSXRenderCacheStats = {
    planHits: 0,
    planMisses: 0,
    planEvictions: 0,
  };

  constructor(options: JSXRenderCacheOptions = {}) {
    this.maxPlans = options.maxPlans ?? 500;
  }

  getOrCreatePlan(key: string, factory: () => CTLayoutNode): CTLayoutNode {
    const cached = this.plans.get(key);
    if (cached) {
      this.stats.planHits++;
      this.plans.delete(key);
      this.plans.set(key, cached);
      return cached;
    }

    this.stats.planMisses++;
    const plan = factory();
    this.plans.set(key, plan);
    if (this.plans.size > this.maxPlans) {
      const oldest = this.plans.keys().next().value;
      if (oldest !== undefined) {
        this.plans.delete(oldest);
        this.stats.planEvictions++;
      }
    }
    return plan;
  }

  clear(): void {
    this.plans.clear();
  }

  resetStats(): void {
    this.stats = {
      planHits: 0,
      planMisses: 0,
      planEvictions: 0,
    };
  }

  getStats(): JSXRenderCacheStats {
    return { ...this.stats };
  }
}
