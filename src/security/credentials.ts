import { readFileSync, existsSync, chmodSync, writeFileSync } from 'node:fs';
import { providerKeyFile } from '../config/paths.js';
import type { ProviderName } from '../registry/model.types.js';

const ENV_MAP: Record<ProviderName, string> = {
  nvidia: 'NVIDIA_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

export function getKey(provider: ProviderName): string | undefined {
  const envVal = process.env[ENV_MAP[provider]];
  if (envVal && envVal.trim().length > 0) return envVal.trim();

  const file = providerKeyFile(provider);
  if (!existsSync(file)) return undefined;
  try {
    const raw = readFileSync(file, 'utf8').trim();
    return raw.length > 0 ? raw : undefined;
  } catch {
    return undefined;
  }
}

export function setKey(provider: ProviderName, key: string): void {
  const file = providerKeyFile(provider);
  writeFileSync(file, key, 'utf8');
  try {
    chmodSync(file, 0o600);
  } catch {
    // POSIX perms unavailable (Windows) — ignore; ACLs are inherited from ~/.unichanl/auth
  }
}

export function hasKey(provider: ProviderName): boolean {
  return getKey(provider) !== undefined;
}

// Future: OS keychain adapter (macOS Keychain, Windows Credential Manager, libsecret).
export interface KeychainAdapter {
  get(provider: ProviderName): Promise<string | undefined>;
  set(provider: ProviderName, key: string): Promise<void>;
}
