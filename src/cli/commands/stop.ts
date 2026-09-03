import { readRuntime, clearRuntime, isProcessAlive } from '../../utils/process.js';
import { ok, warn, fail, dim } from '../ui/output.js';

export async function stopCommand(): Promise<void> {
  const rt = readRuntime();
  if (!rt) {
    warn('No running Unichanl gateway found (no runtime file).');
    return;
  }
  if (!isProcessAlive(rt.pid)) {
    warn(`Stale runtime file — PID ${rt.pid} is not alive. Cleaning up.`);
    clearRuntime();
    return;
  }
  try {
    process.kill(rt.pid, 'SIGTERM');
    // Give it a moment to shut down cleanly.
    await new Promise((r) => setTimeout(r, 500));
    if (isProcessAlive(rt.pid)) {
      dim('Process still alive after SIGTERM; sending SIGKILL.');
      process.kill(rt.pid, 'SIGKILL');
    }
    clearRuntime();
    ok(`Stopped Unichanl gateway (PID ${rt.pid}).`);
  } catch (err) {
    fail(`Failed to stop PID ${rt.pid}: ${(err as Error).message}`);
    process.exit(1);
  }
}
