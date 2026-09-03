import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tokenFile } from '../config/paths.js';
import type { AuthProvider, LoginResult } from './auth-provider.interface.js';

export class LocalDevAuthProvider implements AuthProvider {
  readonly name = 'local-dev';

  async login(): Promise<LoginResult> {
    const token = `unichanl-dev-${randomBytes(16).toString('hex')}`;
    writeFileSync(tokenFile(), token, { encoding: 'utf8', mode: 0o600 });
    return {
      ok: true,
      mode: this.name,
      message:
        'Local dev auth mode — no hosted Unichanl auth backend exists yet. A local token was minted and stored under ~/.unichanl/auth/. Real OAuth will be wired when the web app ships.',
    };
  }

  async logout(): Promise<void> {
    const f = tokenFile();
    if (existsSync(f)) rmSync(f, { force: true });
  }

  async getToken(): Promise<string | null> {
    const f = tokenFile();
    if (!existsSync(f)) return null;
    return readFileSync(f, 'utf8').trim() || null;
  }
}

export const defaultAuthProvider: AuthProvider = new LocalDevAuthProvider();
