import { defaultAuthProvider } from '../../auth/local-dev-auth.js';
import { banner, ok, info, dim } from '../ui/output.js';

export async function loginCommand(): Promise<void> {
  banner();
  info('UNICHANL LOGIN');
  info('');
  const result = await defaultAuthProvider.login();
  if (result.ok) ok(`Authenticated via ${result.mode} provider.`);
  dim(result.message);
}

export async function logoutCommand(): Promise<void> {
  await defaultAuthProvider.logout();
  ok('Logged out.');
}
