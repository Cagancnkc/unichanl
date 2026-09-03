import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

export function claudeSettingsPath(): string {
  return join(homedir(), '.claude', 'settings.json');
}

export function readClaudeSettings(): Record<string, unknown> {
  const p = claudeSettingsPath();
  if (!existsSync(p)) return {};
  try {
    const raw = readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function writeClaudeSettings(settings: Record<string, unknown>): void {
  const p = claudeSettingsPath();
  mkdirSync(join(homedir(), '.claude'), { recursive: true });
  writeFileSync(p, JSON.stringify(settings, null, 2), 'utf8');
}

export const UNICHANL_MARKER_KEY = '_unichanl_managed';
