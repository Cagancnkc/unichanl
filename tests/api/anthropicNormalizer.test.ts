import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anthropicToOpenAI,
  openAIToAnthropic,
  openAIStreamToAnthropicSSE,
  serializeSSE,
  type AnthropicMessagesRequest,
} from '../../src/api/normalizers/anthropicNormalizer.js';
import type { ChatCompletionResponse, StreamChunk } from '../../src/types/index.js';

test('anthropicToOpenAI: string content + string system flattens correctly', () => {
  const req: AnthropicMessagesRequest = {
    model: 'claude-3.5-sonnet',
    max_tokens: 32,
    system: 'you are helpful',
    messages: [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'again' },
    ],
    stop_sequences: ['STOP'],
    temperature: 0.5,
  };
  const out = anthropicToOpenAI(req);
  assert.deepEqual(out.messages, [
    { role: 'system', content: 'you are helpful' },
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
    { role: 'user', content: 'again' },
  ]);
  assert.equal(out.max_tokens, 32);
  assert.deepEqual(out.stop, ['STOP']);
  assert.equal(out.temperature, 0.5);
});

test('anthropicToOpenAI: content blocks with text are joined', () => {
  const req: AnthropicMessagesRequest = {
    model: 'claude-3.5-sonnet',
    max_tokens: 16,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'part 1' },
          { type: 'text', text: 'part 2' },
          { type: 'image', source: { type: 'base64', data: '...' } }, // ignored
        ],
      },
    ],
  };
  const out = anthropicToOpenAI(req);
  assert.equal(out.messages[0]?.content, 'part 1\npart 2');
});

test('openAIToAnthropic: maps finish_reason and usage', () => {
  const oa: ChatCompletionResponse = {
    id: 'chatcmpl_1',
    object: 'chat.completion',
    created: 0,
    model: 'anthropic/claude-3.5-sonnet',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: 'hello world' },
        finish_reason: 'length',
      },
    ],
    usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
  };
  const out = openAIToAnthropic(oa, 'claude-3.5-sonnet');
  assert.equal(out.type, 'message');
  assert.equal(out.role, 'assistant');
  assert.equal(out.model, 'claude-3.5-sonnet');
  assert.equal(out.stop_reason, 'max_tokens');
  assert.equal(out.usage.input_tokens, 5);
  assert.equal(out.usage.output_tokens, 7);
  assert.equal(out.content[0]?.type, 'text');
  assert.equal((out.content[0] as { text: string }).text, 'hello world');
});

test('openAIStreamToAnthropicSSE: emits correct event order', async () => {
  const source: StreamChunk[] = [
    {
      id: 'c1',
      object: 'chat.completion.chunk',
      created: 0,
      model: 'm',
      choices: [{ index: 0, delta: { content: 'he' }, finish_reason: null }],
    },
    {
      id: 'c1',
      object: 'chat.completion.chunk',
      created: 0,
      model: 'm',
      choices: [{ index: 0, delta: { content: 'llo' }, finish_reason: null }],
    },
    {
      id: 'c1',
      object: 'chat.completion.chunk',
      created: 0,
      model: 'm',
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    },
  ];
  async function* gen() {
    for (const s of source) yield s;
  }
  const events: string[] = [];
  for await (const evt of openAIStreamToAnthropicSSE(gen(), 'claude-3.5-sonnet')) {
    events.push(evt.event);
  }
  assert.deepEqual(events, [
    'message_start',
    'content_block_start',
    'content_block_delta',
    'content_block_delta',
    'content_block_stop',
    'message_delta',
    'message_stop',
  ]);
});

test('serializeSSE: proper event: / data: framing with trailing blank line', () => {
  const out = serializeSSE({ event: 'ping', data: { a: 1 } });
  assert.equal(out, 'event: ping\ndata: {"a":1}\n\n');
});
