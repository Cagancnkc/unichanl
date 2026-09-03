import type { ChatCompletionResponse } from '../../types/index.js';

export function normalizeResponse(
  raw: ChatCompletionResponse,
  actualModelName: string,
  requestId: string,
): ChatCompletionResponse {
  return {
    id: `chatcmpl-${requestId}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: actualModelName,
    choices: raw.choices.map((c, i) => ({
      index: i,
      message: {
        role: 'assistant',
        content: c.message?.content ?? '',
      },
      finish_reason: c.finish_reason ?? 'stop',
    })),
    usage: raw.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}
