import { test } from 'node:test';
import assert from 'node:assert/strict';
import type Anthropic from '@anthropic-ai/sdk';
import {
  anthropicResponseToOpenAI,
  anthropicStreamToOpenAI,
  openAIRequestToAnthropic,
} from '../../src/providers/anthropic/translate.js';

test('openAIRequestToAnthropic extracts system message', () => {
  const params = openAIRequestToAnthropic(
    {
      model: 'unichanl-auto',
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hi' },
      ],
      max_tokens: 500,
      temperature: 0.5,
    },
    'claude-sonnet-4-5',
  );
  assert.equal(params.system, 'You are helpful.');
  assert.equal(params.messages.length, 1);
  assert.equal(params.messages[0]!.role, 'user');
  assert.deepEqual(params.messages[0]!.content, [{ type: 'text', text: 'Hi' }]);
  assert.equal(params.max_tokens, 500);
  assert.equal(params.temperature, 0.5);
  assert.equal(params.model, 'claude-sonnet-4-5');
});

test('openAIRequestToAnthropic maps user/assistant turns and stop sequences', () => {
  const params = openAIRequestToAnthropic(
    {
      model: 'unichanl-auto',
      messages: [
        { role: 'user', content: 'Q1' },
        { role: 'assistant', content: 'A1' },
        { role: 'user', content: 'Q2' },
      ],
      stop: ['STOP'],
    },
    'claude-sonnet-4-5',
  );
  assert.equal(params.messages.length, 3);
  assert.equal(params.messages[1]!.role, 'assistant');
  assert.deepEqual(params.stop_sequences, ['STOP']);
  assert.equal(params.max_tokens, 1024);
});

test('anthropicResponseToOpenAI normalizes response with real usage', () => {
  const anthropicRes = {
    id: 'msg_123',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5',
    content: [{ type: 'text', text: 'Hello world' }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 5 },
  } as unknown as Anthropic.Message;

  const openAI = anthropicResponseToOpenAI(anthropicRes, 'unichanl-auto');
  assert.equal(openAI.object, 'chat.completion');
  assert.equal(openAI.model, 'unichanl-auto');
  assert.equal(openAI.choices.length, 1);
  assert.equal(openAI.choices[0]!.message.content, 'Hello world');
  assert.equal(openAI.choices[0]!.finish_reason, 'stop');
  assert.equal(openAI.usage.prompt_tokens, 10);
  assert.equal(openAI.usage.completion_tokens, 5);
  assert.equal(openAI.usage.total_tokens, 15);
});

test('anthropicResponseToOpenAI maps max_tokens stop reason to length', () => {
  const res = {
    id: 'm',
    content: [{ type: 'text', text: 'x' }],
    stop_reason: 'max_tokens',
    usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as Anthropic.Message;
  const openAI = anthropicResponseToOpenAI(res, 'unichanl-auto');
  assert.equal(openAI.choices[0]!.finish_reason, 'length');
});

test('anthropicStreamToOpenAI emits role delta, text deltas, then finish', async () => {
  async function* events(): AsyncGenerator<Anthropic.MessageStreamEvent> {
    yield { type: 'message_start', message: {} as Anthropic.Message } as unknown as Anthropic.MessageStreamEvent;
    yield {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: 'Hel' },
    } as unknown as Anthropic.MessageStreamEvent;
    yield {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: 'lo' },
    } as unknown as Anthropic.MessageStreamEvent;
    yield {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: 2 },
    } as unknown as Anthropic.MessageStreamEvent;
    yield { type: 'message_stop' } as unknown as Anthropic.MessageStreamEvent;
  }

  const chunks: any[] = [];
  for await (const c of anthropicStreamToOpenAI(events(), 'unichanl-auto')) {
    chunks.push(c);
  }
  assert.equal(chunks.length, 4);
  assert.equal(chunks[0].choices[0].delta.role, 'assistant');
  assert.equal(chunks[1].choices[0].delta.content, 'Hel');
  assert.equal(chunks[2].choices[0].delta.content, 'lo');
  assert.equal(chunks[3].choices[0].finish_reason, 'stop');
});
