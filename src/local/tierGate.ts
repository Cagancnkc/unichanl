import type { ModelMetadata } from '../registry/model.types.js';

export type Tier = 'free' | 'pro' | 'team' | 'enterprise';

const TIER_ORDER: Record<Tier, number> = { free: 0, pro: 1, team: 2, enterprise: 3 };

const FREE_MAX_COST_PER_MTOK = 2;

function costSum(m: ModelMetadata): number {
  return m.cost.inputPerMTokUsd + m.cost.outputPerMTokUsd;
}

function normalizeTier(tier: string | undefined): Tier {
  if (tier === 'pro' || tier === 'team' || tier === 'enterprise') return tier;
  return 'free';
}

export function isAllowedForTier(model: ModelMetadata, tier: string | undefined): boolean {
  const t = normalizeTier(tier);
  const requiredRaw = model.tags.find((tag) => tag.startsWith('tier:'))?.slice(5);
  const required: Tier = requiredRaw === 'pro' || requiredRaw === 'team' || requiredRaw === 'enterprise' ? requiredRaw : 'free';
  if (TIER_ORDER[t] < TIER_ORDER[required]) return false;
  if (t === 'free' && required === 'free' && costSum(model) > FREE_MAX_COST_PER_MTOK) {
    return model.tags.includes('free');
  }
  return true;
}

export function filterByTier(models: ModelMetadata[], tier: string | undefined): ModelMetadata[] {
  return models.filter((m) => isAllowedForTier(m, tier));
}
