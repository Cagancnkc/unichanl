import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { registryFile } from '../config/paths.js';
import type { ModelMetadata, AvailabilityState, ProviderName } from './model.types.js';
import { emptyHealth } from './model.types.js';

export interface RegistryFilter {
  providerName?: ProviderName;
  enabled?: boolean;
  tag?: string;
  anthropicCompat?: boolean;
}

interface PersistedOverrides {
  enabled?: Record<string, boolean>;
  availability?: Record<string, AvailabilityState>;
}

export class ModelRegistry {
  private models = new Map<string, ModelMetadata>();

  seed(models: ModelMetadata[]): void {
    for (const m of models) this.models.set(m.id, { ...m, health: m.health ?? emptyHealth() });
    this.applyOverrides();
  }

  list(): ModelMetadata[] {
    return [...this.models.values()];
  }

  get(id: string): ModelMetadata | undefined {
    return this.models.get(id);
  }

  filter(f: RegistryFilter): ModelMetadata[] {
    return this.list().filter((m) => {
      if (f.providerName && m.providerName !== f.providerName) return false;
      if (f.enabled !== undefined && m.enabled !== f.enabled) return false;
      if (f.tag && !m.tags.includes(f.tag)) return false;
      if (f.anthropicCompat !== undefined && m.capabilities.anthropicCompat !== f.anthropicCompat) return false;
      return true;
    });
  }

  upsert(m: ModelMetadata): void {
    const existing = this.models.get(m.id);
    this.models.set(m.id, {
      ...m,
      enabled: existing?.enabled ?? m.enabled,
      availability: existing?.availability ?? m.availability,
      health: existing?.health ?? m.health,
    });
  }

  setState(id: string, state: AvailabilityState): void {
    const m = this.models.get(id);
    if (!m) return;
    m.availability = state;
    this.persist();
  }

  setEnabled(id: string, enabled: boolean): void {
    const m = this.models.get(id);
    if (!m) return;
    m.enabled = enabled;
    this.persist();
  }

  snapshot(): ModelMetadata[] {
    return this.list().map((m) => structuredClone(m));
  }

  persist(): void {
    const overrides: PersistedOverrides = { enabled: {}, availability: {} };
    for (const m of this.models.values()) {
      overrides.enabled![m.id] = m.enabled;
      overrides.availability![m.id] = m.availability;
    }
    const path = registryFile();
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, JSON.stringify(overrides, null, 2), 'utf8');
    renameSync(tmp, path);
  }

  private applyOverrides(): void {
    const path = registryFile();
    if (!existsSync(path)) return;
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as PersistedOverrides;
      for (const [id, enabled] of Object.entries(raw.enabled ?? {})) {
        const m = this.models.get(id);
        if (m) m.enabled = enabled;
      }
      for (const [id, avail] of Object.entries(raw.availability ?? {})) {
        const m = this.models.get(id);
        if (m) m.availability = avail;
      }
    } catch {
      // corrupt overrides file — ignore, keep seed values
    }
  }
}

let singleton: ModelRegistry | null = null;
export function getModelRegistry(): ModelRegistry {
  if (!singleton) singleton = new ModelRegistry();
  return singleton;
}
export function __resetRegistryForTests(): void {
  singleton = null;
}
