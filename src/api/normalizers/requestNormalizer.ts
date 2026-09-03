import { z } from 'zod';
import { ValidationError } from '../../utils/errors.js';
import type { ChatCompletionRequest } from '../../types/index.js';

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, 'Mesaj içeriği boş olamaz'),
});

const chatCompletionSchema = z.object({
  model: z.string().min(1).max(100),
  messages: z.array(chatMessageSchema).min(1, 'En az bir mesaj gerekli').max(500),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(200_000).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  session_id: z.string().optional(),
  routing_strategy: z.enum(['auto', 'priority', 'cheapest', 'fastest', 'capability']).optional(),
});

export function normalizeRequest(body: unknown): ChatCompletionRequest {
  const result = chatCompletionSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Geçersiz istek formatı', result.error.flatten().fieldErrors);
  }
  return result.data as ChatCompletionRequest;
}
