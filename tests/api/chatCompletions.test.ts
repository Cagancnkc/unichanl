import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startGateway } from '../../src/gateway/lifecycle.js';
import { readLocalApiKey } from '../../src/integrations/local-api-key.js';
import { __setAdapterOverrideForTests } from '../../src/local/routingEngine.js';
import type { InferenceProvider, CompletionOptions } from '../../src/providers/types.js';
import type { ChatMessage, ProviderResponse, StreamChunk } from '../../src/types/index.js';

function makeStubAdapter(overrides: Partial<InferenceProvider> = {}): InferenceProvider {
  const defaultComplete = async (
    model: string,
    _messages: ChatMessage[],
    _options: CompletionOptions,
  ): Promise<ProviderResponse> => ({
    success: true,
    latencyMs: 1,
    data: {
      id: 'chatcmpl_stub',
      object: 'chat.completion',
      created: 1,
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'STUB_OK' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    },
  });

  async function* defaultStream(
    model: string,
    _messages: ChatMessage[],
    _options: CompletionOptions,
  ): AsyncGenerator<StreamChunk, void, unknown> {
    yield {
      id: 'c',
      object: 'chat.completion.chunk',
      created: 1,
      model,
      choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
    };
    yield {
      id: 'c',
      object: 'chat.completion.chunk',
      created: 1,
      model,
      choices: [{ index: 0, delta: { content: 'hello' }, finish_reason: null }],
    };
    yield {
      id: 'c',
      object: 'chat.completion.chunk',
      created: 1,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    };
  }

  return {
    name: 'stub',
    complete: defaultComplete,
    stream: defaultStream,
    ...overrides,
  };
}

test('/v1/chat/completions: rejects missing auth', async () => {
  __setAdapterOverrideForTests(makeStubAdapter());
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
    __setAdapterOverrideForTests(null);
  }
});

test('/v1/chat/completions: validates payload', async () => {
  __setAdapterOverrideForTests(makeStubAdapter());
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
    __setAdapterOverrideForTests(null);
  }
});

test('/v1/chat/completions: non-streaming happy path', async () => {
  __setAdapterOverrideForTests(makeStubAdapter());
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
    const body = (await res.json()) as {
      object: string;
      choices: Array<{ message: { content: string } }>;
    };
    assert.equal(body.object, 'chat.completion');
    assert.equal(body.choices[0]!.message.content, 'STUB_OK');
  } finally {
    await gw.stop();
    __setAdapterOverrideForTests(null);
  }
});

test('/v1/chat/completions: streaming emits SSE and terminates with [DONE]', async () => {
  __setAdapterOverrideForTests(makeStubAdapter());
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
    __setAdapterOverrideForTests(null);
  }
});

test('/v1/chat/completions: maps provider rate-limit error to 429', async () => {
  __setAdapterOverrideForTests(
    makeStubAdapter({
      complete: async (_m, _msgs, _opts) => ({
        success: false,
        latencyMs: 1,
        error: {
          code: 'rate_limited',
          message: 'Anthropic rate limit exceeded',
          retryable: false,
        },
      }),
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
    assert.equal(body.error.code, 'rate_limited');
  } finally {
    await gw.stop();
    __setAdapterOverrideForTests(null);
  }
});

test('/v1/chat/completions: 503 when routing engine throws', async () => {
  __setAdapterOverrideForTests(
    makeStubAdapter({
      complete: async () => {
        throw new Error('provider unavailable');
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
    assert.equal(res.status, 503);
  } finally {
    await gw.stop();
    __setAdapterOverrideForTests(null);
  }
});
