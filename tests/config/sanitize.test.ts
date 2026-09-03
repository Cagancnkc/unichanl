import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeForDisplay } from '../../src/config/config-manager.js';

test('sanitizeForDisplay redacts api-key style fields', () => {
  const input = {
    gateway: { host: '127.0.0.1', port: 20128 },
    provider: { api_key: 'sk-supersecret-abcdef', name: 'openrouter' },
    nested: { token: 'tok_abcdef123456', secret: 'x' },
  };
  const out = sanitizeForDisplay(input) as Record<string, Record<string, unknown>>;
  assert.equal(out.gateway.port, 20128);
  assert.notEqual(out.provider.api_key, 'sk-supersecret-abcdef');
  assert.match(String(out.provider.api_key), /\*/);
  assert.notEqual(out.nested.token, 'tok_abcdef123456');
  assert.equal(out.nested.secret, '***');
});
