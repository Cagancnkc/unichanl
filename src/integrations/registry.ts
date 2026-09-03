import type { ToolIntegration } from './integration.interface.js';
import { claudeCodeIntegration } from './claude-code/adapter.js';
import { codexIntegration } from './codex/adapter.js';
import { openCodeIntegration } from './opencode/adapter.js';

export const integrations: ToolIntegration[] = [
  claudeCodeIntegration,
  codexIntegration,
  openCodeIntegration,
];

export function findIntegration(name: string): ToolIntegration | undefined {
  return integrations.find((i) => i.name === name);
}
