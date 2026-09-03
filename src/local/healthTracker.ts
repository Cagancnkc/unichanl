import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { healthFile } from '../config/paths.js';
import { getModelRegistry } from '../registry/modelRegistry.js';
import type { AvailabilityState, HealthSnapshot, ModelMetadata } from '../registry/model.types.js';
import { logger } from '../utils/logger.js';

interface PersistedHealth {
  health: Record<string, HealthSnapshot>;
  availability: Record<string, AvailabilityState>;
}

let loaded = false;

export function loadHealth(): void {
  if (loaded) return;
  loaded = true;
  const path = healthFile();
  if (!existsSync(path)) return;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as PersistedHealth;
    const reg = getModelRegistry();
    for (const [id, snap] of Object.entries(raw.health ?? {})) {
      const m = reg.get(id);
      if (m) m.health = snap;
    }
    for (const [id, avail] of Object.entries(raw.availability ?? {})) {
      const m = reg.get(id);
      if (m) m.availability = avail;
    }
  } catch (err) {
    logger.warn({ err }, 'health.json okunamadı');
  }
}

function persist(): void {
  const reg = getModelRegistry();
  const out: PersistedHealth = { health: {}, availability: {} };
  for (const m of reg.list()) {
    out.health[m.id] = m.health;
    out.availability[m.id] = m.availability;
  }
  const path = healthFile();
  const tmp = `${path}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(out, null, 2), 'utf8');
    renameSync(tmp, path);
  } catch (err) {
    logger.warn({ err }, 'health.json yazılamadı');
  }
}

const EWMA_ALPHA = 0.2;
const WINDOW_CAP = 100;

export function recordSuccess(model: ModelMetadata, latencyMs: number): void {
  const h = model.health;
  const prevLatency = h.avgLatencyMs || latencyMs;
  h.avgLatencyMs = Math.round(prevLatency * (1 - EWMA_ALPHA) + latencyMs * EWMA_ALPHA);
  h.p95LatencyMs = Math.max(h.p95LatencyMs, latencyMs);
  h.windowSize = Math.min(h.windowSize + 1, WINDOW_CAP);
  h.successRate = h.successRate + (1 - h.successRate) / h.windowSize;
  h.consecutiveFailures = 0;
  h.updatedAt = new Date().toISOString();
  if (model.availability !== 'DISABLED') model.availability = 'AVAILABLE';
  persist();
}

export function recordFailure(
  model: ModelMetadata,
  latencyMs: number,
  errorCode: string,
  message: string,
): void {
  const h = model.health;
  h.consecutiveFailures += 1;
  h.windowSize = Math.min(h.windowSize + 1, WINDOW_CAP);
  h.successRate = h.successRate + (0 - h.successRate) / h.windowSize;
  h.lastError = { category: errorCode, at: new Date().toISOString(), message };
  h.updatedAt = new Date().toISOString();
  if (latencyMs > 0) {
    const prev = h.avgLatencyMs || latencyMs;
    h.avgLatencyMs = Math.round(prev * (1 - EWMA_ALPHA) + latencyMs * EWMA_ALPHA);
  }

  if (model.availability !== 'DISABLED') {
    if (errorCode === 'rate_limited') model.availability = 'RATE_LIMITED';
    else if (errorCode === 'model_unavailable') model.availability = 'UNAVAILABLE';
    else if (h.consecutiveFailures >= 3) model.availability = 'DEGRADED';
  }
  persist();
}
