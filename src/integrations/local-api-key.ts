import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { localApiKeyFile } from '../config/paths.js';

// Local API key that the gateway will accept from tools configured through `unichanl setup`.
// This is a *local* trust token — the gateway binds to 127.0.0.1 only, so this key never
// leaves the developer's machine. The upstream provider key (OpenRouter etc.) stays in
// the server's environment and is never handed to the tool.
export function ensureLocalApiKey(): string {
  const file = localApiKeyFile();
  if (existsSync(file)) {
    const existing = readFileSync(file, 'utf8').trim();
    if (existing) return existing;
  }
  const key = `unichanl-local-${randomBytes(24).toString('hex')}`;
  writeFileSync(file, key, { encoding: 'utf8', mode: 0o600 });
  return key;
}

export function readLocalApiKey(): string | null {
  const file = localApiKeyFile();
  if (!existsSync(file)) return null;
  const value = readFileSync(file, 'utf8').trim();
  return value || null;
}
