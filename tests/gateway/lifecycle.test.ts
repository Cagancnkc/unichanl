import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startGateway } from '../../src/gateway/lifecycle.js';

test('gateway lifecycle: start, /health returns ok, stop', async () => {
  const gw = await startGateway({ host: '127.0.0.1', port: 0 });
  try {
    // Fastify assigns a port when 0 is requested; read it from the server.
    const address = gw.app.server.address();
    assert.ok(address && typeof address === 'object', 'address should be assigned');
    const port = (address as { port: number }).port;
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; service: string };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'unichanl');
  } finally {
    await gw.stop();
  }
});

test('gateway: /v1/messages rejects without local api key header', async () => {
  const gw = await startGateway({ host: '127.0.0.1', port: 0 });
  try {
    const address = gw.app.server.address() as { port: number };
    const res = await fetch(`http://127.0.0.1:${address.port}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3.5-sonnet',
        max_tokens: 16,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    assert.equal(res.status, 401);
  } finally {
    await gw.stop();
  }
});
