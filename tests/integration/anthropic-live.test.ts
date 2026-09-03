import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startGateway } from '../../src/gateway/lifecycle.js';
import { readLocalApiKey } from '../../src/integrations/local-api-key.js';
import type { ChatCompletionResponse } from '../../src/providers/provider.interface.js';

const hasKey = !!process.env.ANTHROPIC_API_KEY;

test(
  'live: real Anthropic non-streaming request returns text',
  { skip: !hasKey ? 'ANTHROPIC_API_KEY not set — skipping live integration test' : false },
  async () => {
    const gw = await startGateway({ host: '127.0.0.1', port: 0 });
    try {
      const port = (gw.app.server.address() as { port: number }).port;
      const key = readLocalApiKey();
      assert.ok(key, 'local api key missing');
      const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'unichanl-auto',
          messages: [{ role: 'user', content: 'Reply with exactly: UNICHANL_TEST_OK' }],
          max_tokens: 32,
          stream: false,
        }),
      });
      assert.equal(res.status, 200, `expected 200 got ${res.status}: ${await res.text()}`);
      const body = (await res.json()) as ChatCompletionResponse;
      assert.equal(body.object, 'chat.completion');
      assert.ok(body.choices[0]?.message.content.length ?? 0 > 0, 'expected non-empty content');
      assert.ok(body.usage.total_tokens > 0, 'expected token usage');
    } finally {
      await gw.stop();
    }
  },
);

test(
  'live: real Anthropic streaming request emits chunks and [DONE]',
  { skip: !hasKey ? 'ANTHROPIC_API_KEY not set — skipping live integration test' : false },
  async () => {
    const gw = await startGateway({ host: '127.0.0.1', port: 0 });
    try {
      const port = (gw.app.server.address() as { port: number }).port;
      const key = readLocalApiKey();
      assert.ok(key);
      const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'unichanl-auto',
          messages: [{ role: 'user', content: 'Write a short sentence about software development.' }],
          max_tokens: 64,
          stream: true,
        }),
      });
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.match(text, /"chat\.completion\.chunk"/);
      assert.match(text, /data: \[DONE\]/);
    } finally {
      await gw.stop();
    }
  },
);
