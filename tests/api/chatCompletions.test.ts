import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startGateway } from '../../src/gateway/lifecycle.js';
import { readLocalApiKey } from '../../src/integrations/local-api-key.js';
import {
  __setProviderOverrideForTests,
} from '../../src/providers/registry.js';
import {
  ProviderError,
  type ChatCompletionChunk,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type Provider,
  type ProviderCallOptions,
} from '../../src/providers/provider.interface.js';

function makeStubProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    name: 'stub',
    isAvailable: async () => ({ ok: true }),
    chatCompletion: async (_req: ChatCompletionRequest, _opts: ProviderCallOptions): Promise<ChatCompletionResponse> => ({
      id: 'chatcmpl_stub',
      object: 'chat.completion',
      created: 1,
      model: 'unichanl-auto',
      choices: [
        { index: 0, message: { role: 'assistant', content: 'STUB_OK' }, finish_reason: 'stop' },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }),
    // eslint-disable-next-line require-yield
    async *streamChatCompletion(): AsyncIterable<ChatCompletionChunk> {
      yield {
        id: 'c',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'unichanl-auto',
        choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
      };
      yield {
        id: 'c',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'unichanl-auto',
        choices: [{ index: 0, delta: { content: 'hello' }, finish_reason: null }],
      };
      yield {
        id: 'c',
        object: 'chat.completion.chunk',
        created: 1,
        model: 'unichanl-auto',
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      };
    },
    ...overrides,
  };
}

test('/v1/chat/completions: rejects missing auth', async () => {
  __setProviderOverrideForTests(makeStubProvider());
  const gw = await startGateway({ host: '127.0.0.1', port: 0 });
  try {
    const port = (gw.app.server.address() as { port: number }).port;
    const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'unichanl-auto',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });
    assert.equal(res.status, 401);
  } finally {
    await gw.stop();
    __setProviderOverrideForTests(null);
  }
});

test('/v1/chat/completions: validates payload', async () => {
  __setProviderOverrideForTests(makeStubProvider());
  const gw = await startGateway({ host: '127.0.0.1', port: 0 });
  try {
    const port = (gw.app.server.address() as { port: number }).port;
    const key = readLocalApiKey();
    assert.ok(key);
    const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'unichanl-auto', messages: [] }),
    });
    assert.equal(res.status, 400);
  } finally {
    await gw.stop();
    __setProviderOverrideForTests(null);
  }
});

test('/v1/chat/completions: non-streaming happy path', async () => {
  __setProviderOverrideForTests(makeStubProvider());
  const gw = await startGateway({ host: '127.0.0.1', port: 0 });
  try {
    const port = (gw.app.server.address() as { port: number }).port;
    const key = readLocalApiKey()!;
    const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'unichanl-auto',
        messages: [{ role: 'user', content: 'ping' }],
        stream: false,
      }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as ChatCompletionResponse;
    assert.equal(body.object, 'chat.completion');
    assert.equal(body.choices[0]!.message.content, 'STUB_OK');
  } finally {
    await gw.stop();
    __setProviderOverrideForTests(null);
  }
});

test('/v1/chat/completions: streaming emits SSE and terminates with [DONE]', async () => {
  __setProviderOverrideForTests(makeStubProvider());
  const gw = await startGateway({ host: '127.0.0.1', port: 0 });
  try {
    const port = (gw.app.server.address() as { port: number }).port;
    const key = readLocalApiKey()!;
    const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'unichanl-auto',
        messages: [{ role: 'user', content: 'ping' }],
        stream: true,
      }),
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /text\/event-stream/);
    const text = await res.text();
    assert.match(text, /"content":"hello"/);
    assert.match(text, /data: \[DONE\]/);
  } finally {
    await gw.stop();
    __setProviderOverrideForTests(null);
  }
});

test('/v1/chat/completions: maps provider error to normalized HTTP status', async () => {
  __setProviderOverrideForTests(
    makeStubProvider({
      chatCompletion: async () => {
        throw new ProviderError(429, 'ANTHROPIC_RATE_LIMIT', 'Anthropic rate limit exceeded');
      },
    }),
  );
  const gw = await startGateway({ host: '127.0.0.1', port: 0 });
  try {
    const port = (gw.app.server.address() as { port: number }).port;
    const key = readLocalApiKey()!;
    const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'unichanl-auto',
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    assert.equal(res.status, 429);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, 'ANTHROPIC_RATE_LIMIT');
  } finally {
    await gw.stop();
    __setProviderOverrideForTests(null);
  }
});

test('/v1/chat/completions: 503 when provider unavailable', async () => {
  __setProviderOverrideForTests(
    makeStubProvider({ isAvailable: async () => ({ ok: false, reason: 'key missing' }) }),
  );
  const gw = await startGateway({ host: '127.0.0.1', port: 0 });
  try {
    const port = (gw.app.server.address() as { port: number }).port;
    const key = readLocalApiKey()!;
    const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'unichanl-auto',
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    assert.equal(res.status, 503);
  } finally {
    await gw.stop();
    __setProviderOverrideForTests(null);
  }
});
