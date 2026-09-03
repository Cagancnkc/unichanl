import { test } from 'node:test';
import assert from 'node:assert/strict';
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicProvider } from '../../src/providers/anthropic/provider.js';
import { ProviderError } from '../../src/providers/provider.interface.js';

function withEnv(key: string, value: string | undefined, fn: () => Promise<void>): Promise<void> {
  const prev = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  return fn().finally(() => {
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
  });
}

test('isAvailable reports missing API key', async () => {
  await withEnv('ANTHROPIC_API_KEY', undefined, async () => {
    const p = new AnthropicProvider();
    const r = await p.isAvailable();
    assert.equal(r.ok, false);
    assert.match(r.reason ?? '', /API_KEY/);
  });
});

test('isAvailable ok when configured', async () => {
  await withEnv('ANTHROPIC_API_KEY', 'sk-test-key', async () => {
    const p = new AnthropicProvider();
    const r = await p.isAvailable();
    assert.equal(r.ok, true);
  });
});

test('chatCompletion throws ProviderError when API key missing', async () => {
  await withEnv('ANTHROPIC_API_KEY', undefined, async () => {
    const p = new AnthropicProvider();
    await assert.rejects(
      () =>
        p.chatCompletion(
          { model: 'unichanl-auto', messages: [{ role: 'user', content: 'hi' }] },
          { requestId: 'r1', signal: new AbortController().signal },
        ),
      (err: unknown) => {
        assert.ok(err instanceof ProviderError);
        assert.equal((err as ProviderError).code, 'ANTHROPIC_AUTH_ERROR');
        return true;
      },
    );
  });
});

test('chatCompletion maps AuthenticationError → ANTHROPIC_AUTH_ERROR', async () => {
  await withEnv('ANTHROPIC_API_KEY', 'sk-test', async () => {
    const fakeClient = {
      messages: {
        create: async () => {
          throw new Anthropic.AuthenticationError(401, { error: { message: 'bad key' } }, 'bad key', new Headers());
        },
      },
    } as unknown as Anthropic;
    const p = new AnthropicProvider({ clientFactory: () => fakeClient });
    await assert.rejects(
      () =>
        p.chatCompletion(
          { model: 'unichanl-auto', messages: [{ role: 'user', content: 'hi' }] },
          { requestId: 'r', signal: new AbortController().signal },
        ),
      (err: unknown) => (err as ProviderError).code === 'ANTHROPIC_AUTH_ERROR',
    );
  });
});

test('chatCompletion maps RateLimitError → ANTHROPIC_RATE_LIMIT', async () => {
  await withEnv('ANTHROPIC_API_KEY', 'sk-test', async () => {
    const fakeClient = {
      messages: {
        create: async () => {
          throw new Anthropic.RateLimitError(429, { error: { message: 'slow down' } }, 'rate limit', new Headers());
        },
      },
    } as unknown as Anthropic;
    const p = new AnthropicProvider({ clientFactory: () => fakeClient });
    await assert.rejects(
      () =>
        p.chatCompletion(
          { model: 'unichanl-auto', messages: [{ role: 'user', content: 'hi' }] },
          { requestId: 'r', signal: new AbortController().signal },
        ),
      (err: unknown) => (err as ProviderError).code === 'ANTHROPIC_RATE_LIMIT',
    );
  });
});

test('chatCompletion maps InternalServerError → ANTHROPIC_SERVER_ERROR', async () => {
  await withEnv('ANTHROPIC_API_KEY', 'sk-test', async () => {
    const fakeClient = {
      messages: {
        create: async () => {
          throw new Anthropic.InternalServerError(500, { error: { message: 'boom' } }, 'boom', new Headers());
        },
      },
    } as unknown as Anthropic;
    const p = new AnthropicProvider({ clientFactory: () => fakeClient });
    await assert.rejects(
      () =>
        p.chatCompletion(
          { model: 'unichanl-auto', messages: [{ role: 'user', content: 'hi' }] },
          { requestId: 'r', signal: new AbortController().signal },
        ),
      (err: unknown) => (err as ProviderError).code === 'ANTHROPIC_SERVER_ERROR',
    );
  });
});

test('chatCompletion returns normalized OpenAI response on success', async () => {
  await withEnv('ANTHROPIC_API_KEY', 'sk-test', async () => {
    const fakeClient = {
      messages: {
        create: async () => ({
          id: 'msg_1',
          content: [{ type: 'text', text: 'ok' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 3, output_tokens: 1 },
        }),
      },
    } as unknown as Anthropic;
    const p = new AnthropicProvider({ clientFactory: () => fakeClient });
    const res = await p.chatCompletion(
      { model: 'unichanl-auto', messages: [{ role: 'user', content: 'hi' }] },
      { requestId: 'r', signal: new AbortController().signal },
    );
    assert.equal(res.object, 'chat.completion');
    assert.equal(res.choices[0]!.message.content, 'ok');
    assert.equal(res.usage.total_tokens, 4);
  });
});

test('chatCompletion error message does not leak API key', async () => {
  await withEnv('ANTHROPIC_API_KEY', 'sk-super-secret-abc', async () => {
    const fakeClient = {
      messages: {
        create: async () => {
          throw new Anthropic.AuthenticationError(401, { error: { message: 'nope' } }, 'nope', new Headers());
        },
      },
    } as unknown as Anthropic;
    const p = new AnthropicProvider({ clientFactory: () => fakeClient });
    try {
      await p.chatCompletion(
        { model: 'unichanl-auto', messages: [{ role: 'user', content: 'hi' }] },
        { requestId: 'r', signal: new AbortController().signal },
      );
      assert.fail('should throw');
    } catch (err) {
      const perr = err as ProviderError;
      assert.doesNotMatch(perr.message, /sk-super-secret-abc/);
    }
  });
});
