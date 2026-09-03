import { appendFileSync } from 'node:fs';
import { usageFile } from '../config/paths.js';
import { logger } from '../utils/logger.js';
import type { ProviderName } from '../registry/model.types.js';
import type { UsageStats } from '../types/index.js';
import type { CostBreakdown } from './costTracker.js';

export interface UsageEntry {
  ts: string;
  requestId: string;
  modelId: string;
  providerName: ProviderName;
  strategy: string;
  reason: string;
  attempts: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  tokens?: UsageStats;
  cost?: CostBreakdown;
  streaming?: boolean;
}

function ymd(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function recordUsage(entry: UsageEntry): void {
  try {
    appendFileSync(usageFile(ymd()), `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (err) {
    logger.warn({ err, requestId: entry.requestId }, 'usage log yazılamadı');
  }
}
