import type Anthropic from '@anthropic-ai/sdk';
import type {
  ChatCompletionChunk,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from '../provider.interface.js';

// Anthropic message shape we build ourselves (kept minimal — text-only content).
export interface AnthropicRequestParams {
  model: string;
  max_tokens: number;
  system?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: Array<{ type: 'text'; text: string }>;
  }>;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
}

const DEFAULT_MAX_TOKENS = 1024;

export function openAIRequestToAnthropic(
  req: ChatCompletionRequest,
  upstreamModel: string,
): AnthropicRequestParams {
  const systemParts: string[] = [];
  const messages: AnthropicRequestParams['messages'] = [];

  for (const msg of req.messages) {
    if (msg.role === 'system') {
      if (typeof msg.content === 'string' && msg.content.length > 0) systemParts.push(msg.content);
      continue;
    }
    if (msg.role !== 'user' && msg.role !== 'assistant') continue;
    const text = typeof msg.content === 'string' ? msg.content : '';
    messages.push({ role: msg.role, content: [{ type: 'text', text }] });
  }

  const params: AnthropicRequestParams = {
    model: upstreamModel,
    max_tokens: req.max_tokens ?? DEFAULT_MAX_TOKENS,
    messages,
  };
  if (systemParts.length > 0) params.system = systemParts.join('\n\n');
  if (typeof req.temperature === 'number') params.temperature = req.temperature;
  if (typeof req.top_p === 'number') params.top_p = req.top_p;
  if (req.stop !== undefined) {
    params.stop_sequences = Array.isArray(req.stop) ? req.stop : [req.stop];
  }
  return params;
}

function mapStopReason(reason: string | null | undefined): string {
  switch (reason) {
    case 'end_turn':
    case 'stop_sequence':
      return 'stop';
    case 'max_tokens':
      return 'length';
    case 'tool_use':
      return 'tool_calls';
    default:
      return reason ?? 'stop';
  }
}

function extractText(content: Anthropic.ContentBlock[] | undefined): string {
  if (!content) return '';
  let out = '';
  for (const block of content) {
    if (block.type === 'text') out += block.text;
  }
  return out;
}

export function anthropicResponseToOpenAI(
  res: Anthropic.Message,
  clientFacingModel: string,
): ChatCompletionResponse {
  const text = extractText(res.content);
  const inputTokens = res.usage?.input_tokens ?? 0;
  const outputTokens = res.usage?.output_tokens ?? 0;
  return {
    id: res.id ?? `chatcmpl_${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: clientFacingModel,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: text },
        finish_reason: mapStopReason(res.stop_reason),
      },
    ],
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    },
  };
}

// Convert Anthropic streaming events → OpenAI-compatible chat.completion.chunk objects.
// Only text_delta from content_block_delta events produce content chunks. Other events
// (content_block_start, content_block_stop, ping) are ignored for the chat protocol.
export async function* anthropicStreamToOpenAI(
  events: AsyncIterable<Anthropic.MessageStreamEvent>,
  clientFacingModel: string,
): AsyncGenerator<ChatCompletionChunk, void, unknown> {
  const id = `chatcmpl_${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  let finishReason: string | null = null;
  let openedRole = false;

  for await (const event of events) {
    switch (event.type) {
      case 'message_start':
        if (!openedRole) {
          openedRole = true;
          yield {
            id,
            object: 'chat.completion.chunk',
            created,
            model: clientFacingModel,
            choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
          };
        }
        break;
      case 'content_block_delta': {
        const delta = event.delta;
        if (delta && delta.type === 'text_delta' && typeof delta.text === 'string') {
          yield {
            id,
            object: 'chat.completion.chunk',
            created,
            model: clientFacingModel,
            choices: [
              { index: 0, delta: { content: delta.text }, finish_reason: null },
            ],
          };
        }
        break;
      }
      case 'message_delta':
        if (event.delta && event.delta.stop_reason) {
          finishReason = mapStopReason(event.delta.stop_reason);
        }
        break;
      case 'message_stop':
        // Emit the terminating chunk with finish_reason.
        yield {
          id,
          object: 'chat.completion.chunk',
          created,
          model: clientFacingModel,
          choices: [
            { index: 0, delta: {}, finish_reason: finishReason ?? 'stop' },
          ],
        };
        return;
      default:
        // content_block_start / content_block_stop / ping / unknown → ignore.
        break;
    }
  }

  // Safety net: emit a final chunk if the upstream ended without message_stop.
  yield {
    id,
    object: 'chat.completion.chunk',
    created,
    model: clientFacingModel,
    choices: [{ index: 0, delta: {}, finish_reason: finishReason ?? 'stop' }],
  };
}

export function chunkToSSE(chunk: ChatCompletionChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

export const SSE_DONE = 'data: [DONE]\n\n';
