import { findIntegration } from '../../integrations/registry.js';
import { updateIntegration } from '../../config/config-manager.js';
import { ok, fail } from '../ui/output.js';

export async function disconnectCommand(tool: string): Promise<void> {
  const integ = findIntegration(tool);
  if (!integ) {
    fail(`Unknown integration: ${tool}`);
    process.exit(1);
  }
  const result = await integ.uninstall();
  if (result.ok) {
    updateIntegration(integ.name, { enabled: false });
    ok(result.message);
  } else {
    fail(result.message);
    process.exit(1);
  }
}
