import { randomUUID } from 'node:crypto';
import type {
  ChatCompletionResponse,
  ChatMessage,
  StreamChunk,
} from '../../types/index.js';

// ---------- Anthropic types (subset we translate) ----------

export interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

export type AnthropicContentBlock = AnthropicTextBlock | { type: string; [k: string]: unknown };

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

export interface AnthropicMessagesRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string | AnthropicContentBlock[];
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
  metadata?: { user_id?: string };
}

export interface AnthropicMessagesResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: AnthropicContentBlock[];
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ---------- Helpers ----------

function flattenContent(content: AnthropicMessage['content']): string {
  if (typeof content === 'string') return content;
  return content
    .filter((b): b is AnthropicTextBlock => b.type === 'text' && typeof (b as AnthropicTextBlock).text === 'string')
    .map((b) => b.text)
    .join('\n');
}

function flattenSystem(system: AnthropicMessagesRequest['system']): string | undefined {
  if (!system) return undefined;
  if (typeof system === 'string') return system;
  return system
    .filter((b): b is AnthropicTextBlock => b.type === 'text' && typeof (b as AnthropicTextBlock).text === 'string')
    .map((b) => b.text)
    .join('\n');
}

function mapFinishToStop(finish: string | null | undefined): AnthropicMessagesResponse['stop_reason'] {
  switch (finish) {
    case 'stop':
      return 'end_turn';
    case 'length':
      return 'max_tokens';
    case 'content_filter':
      return 'end_turn';
    case null:
    case undefined:
      return null;
    default:
      return 'end_turn';
  }
}

// ---------- Request translation ----------

export interface OpenAIRequestShape {
  messages: ChatMessage[];
  model: string;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stop?: string[] | undefined;
  stream?: boolean;
}

export function anthropicToOpenAI(req: AnthropicMessagesRequest): OpenAIRequestShape {
  const messages: ChatMessage[] = [];
  const system = flattenSystem(req.system);
  if (system) messages.push({ role: 'system', content: system });
  for (const m of req.messages) {
    messages.push({ role: m.role, content: flattenContent(m.content) });
  }
  return {
    model: req.model,
    messages,
    max_tokens: req.max_tokens,
    temperature: req.temperature,
    top_p: req.top_p,
    stop: req.stop_sequences && req.stop_sequences.length > 0 ? req.stop_sequences : undefined,
    stream: req.stream,
  };
}

// ---------- Non-streaming response translation ----------

export function openAIToAnthropic(
  res: ChatCompletionResponse,
  requestedModel: string,
): AnthropicMessagesResponse {
  const choice = res.choices[0];
  const text = choice?.message?.content ?? '';
  return {
    id: `msg_${res.id ?? randomUUID().replace(/-/g, '')}`,
    type: 'message',
    role: 'assistant',
    model: requestedModel,
    content: [{ type: 'text', text }],
    stop_reason: mapFinishToStop(choice?.finish_reason ?? null),
    stop_sequence: null,
    usage: {
      input_tokens: res.usage?.prompt_tokens ?? 0,
      output_tokens: res.usage?.completion_tokens ?? 0,
    },
  };
}

// ---------- Streaming SSE translation ----------

export interface AnthropicSSEEvent {
  event: string;
  data: unknown;
}

// Convert an OpenAI chat.completion.chunk stream into an Anthropic-shape SSE event sequence.
// Anthropic streaming order:
//   message_start
//   content_block_start (index 0, text)
//   content_block_delta * N
//   content_block_stop
//   message_delta (with stop_reason + usage)
//   message_stop
export async function* openAIStreamToAnthropicSSE(
  chunks: AsyncIterable<StreamChunk>,
  requestedModel: string,
): AsyncGenerator<AnthropicSSEEvent, void, unknown> {
  const messageId = `msg_${randomUUID().replace(/-/g, '')}`;
  let started = false;
  let stopReason: AnthropicMessagesResponse['stop_reason'] = 'end_turn';
  let outputTokens = 0;

  for await (const chunk of chunks) {
    const choice = chunk.choices?.[0];
    const delta = choice?.delta?.content;

    if (!started) {
      started = true;
      yield {
        event: 'message_start',
        data: {
          type: 'message_start',
          message: {
            id: messageId,
            type: 'message',
            role: 'assistant',
            model: requestedModel,
            content: [],
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 0, output_tokens: 0 },
          },
        },
      };
      yield {
        event: 'content_block_start',
        data: {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text', text: '' },
        },
      };
    }

    if (typeof delta === 'string' && delta.length > 0) {
      outputTokens += 1; // rough — Anthropic clients only use this as a hint
      yield {
        event: 'content_block_delta',
        data: {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: delta },
        },
      };
    }

    if (choice?.finish_reason) {
      stopReason = mapFinishToStop(choice.finish_reason);
    }
  }

  if (started) {
    yield {
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index: 0 },
    };
  } else {
    // Never got a first chunk — still emit a minimal start/stop pair so the client isn't stuck.
    yield {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: messageId,
          type: 'message',
          role: 'assistant',
          model: requestedModel,
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      },
    };
    yield {
      event: 'content_block_start',
      data: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    };
    yield {
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index: 0 },
    };
  }

  yield {
    event: 'message_delta',
    data: {
      type: 'message_delta',
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { output_tokens: outputTokens },
    },
  };
  yield {
    event: 'message_stop',
    data: { type: 'message_stop' },
  };
}

export function serializeSSE(event: AnthropicSSEEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}
