type State = 'closed' | 'open' | 'half-open';

interface Entry {
  state: State;
  failures: number;
  openedAt: number;
}

const FAILURE_THRESHOLD = 5;
const RECOVERY_MS = 30_000;

export class CircuitBreakerRegistry {
  private entries = new Map<string, Entry>();

  private get(id: string): Entry {
    let e = this.entries.get(id);
    if (!e) {
      e = { state: 'closed', failures: 0, openedAt: 0 };
      this.entries.set(id, e);
    }
    return e;
  }

  isOpen(id: string): boolean {
    const e = this.get(id);
    if (e.state === 'open' && Date.now() - e.openedAt >= RECOVERY_MS) {
      e.state = 'half-open';
      return false;
    }
    return e.state === 'open';
  }

  recordSuccess(id: string): void {
    const e = this.get(id);
    e.state = 'closed';
    e.failures = 0;
    e.openedAt = 0;
  }

  recordFailure(id: string): void {
    const e = this.get(id);
    if (e.state === 'half-open') {
      e.state = 'open';
      e.openedAt = Date.now();
      return;
    }
    e.failures += 1;
    if (e.failures >= FAILURE_THRESHOLD) {
      e.state = 'open';
      e.openedAt = Date.now();
    }
  }

  snapshot(id: string): { state: State; failures: number } {
    const e = this.get(id);
    return { state: e.state, failures: e.failures };
  }
}

let singleton: CircuitBreakerRegistry | null = null;
export function getCircuitBreakers(): CircuitBreakerRegistry {
  if (!singleton) singleton = new CircuitBreakerRegistry();
  return singleton;
}
export function __resetCircuitBreakersForTests(): void {
  singleton = null;
}
