import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  anthropicToOpenAI,
  openAIToAnthropic,
  openAIStreamToAnthropicSSE,
  serializeSSE,
  type AnthropicMessagesRequest,
} from '../normalizers/anthropicNormalizer.js';
import { routeComplete, routeStream } from '../../local/routingEngine.js';
import { checkLocalAuth } from './localAuth.js';
import { logger } from '../../utils/logger.js';
import type { RoutingStrategy } from '../../types/index.js';

const contentBlockSchema = z.object({ type: z.string() }).passthrough();

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.string(), z.array(contentBlockSchema)]),
});

const requestSchema = z.object({
  model: z.string().min(1),
  max_tokens: z.number().int().positive().max(200_000).default(1024),
  messages: z.array(messageSchema).min(1),
  system: z.union([z.string(), z.array(contentBlockSchema)]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  metadata: z.object({ user_id: z.string().optional() }).partial().optional(),
});

function pickStrategy(header: string | string[] | undefined): RoutingStrategy | undefined {
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) return undefined;
  const allowed: RoutingStrategy[] = ['auto', 'priority', 'cheapest', 'fastest', 'capability'];
  return allowed.includes(raw as RoutingStrategy) ? (raw as RoutingStrategy) : undefined;
}

export async function messagesRoutes(app: FastifyInstance) {
  app.post('/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = checkLocalAuth(request);
    if (!auth.ok) {
      return reply
        .status(auth.status ?? 401)
        .send({ type: 'error', error: { type: 'authentication_error', message: auth.message } });
    }

    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        type: 'error',
        error: { type: 'invalid_request_error', message: parsed.error.message },
      });
    }

    const anthropicReq = parsed.data as AnthropicMessagesRequest;
    const openAIReq = anthropicToOpenAI(anthropicReq);
    const requestId = request.id;
    const strategy = pickStrategy(request.headers['x-routing-strategy']);

    const routeReq = { requestedModel: anthropicReq.model, strategy };
    const options = {
      requestId,
      temperature: openAIReq.temperature,
      max_tokens: openAIReq.max_tokens,
      top_p: openAIReq.top_p,
      stop: openAIReq.stop,
    };

    if (anthropicReq.stream) {
      let streamRoute;
      try {
        streamRoute = routeStream(routeReq, openAIReq.messages, options);
      } catch (err) {
        return reply.status(503).send({
          type: 'error',
          error: { type: 'api_error', message: (err as Error).message },
        });
      }

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Unichanl-Model': streamRoute.chosen.id,
        'X-Routing-Model': streamRoute.chosen.id,
        'X-Routing-Strategy': streamRoute.strategy,
        'X-Routing-Reason': streamRoute.reason,
        'X-Routing-Attempts': String(streamRoute.attempts.length),
        'X-Request-ID': requestId,
      });

      try {
        for await (const evt of openAIStreamToAnthropicSSE(streamRoute.chunks, anthropicReq.model)) {
          reply.raw.write(serializeSSE(evt));
        }
      } catch (err) {
        logger.error({ err, requestId }, 'messages stream failed');
        const errEvent = serializeSSE({
          event: 'error',
          data: { type: 'error', error: { type: 'api_error', message: (err as Error).message } },
        });
        reply.raw.write(errEvent);
      } finally {
        reply.raw.end();
      }
      return;
    }

    let routed;
    try {
      routed = await routeComplete(routeReq, openAIReq.messages, options);
    } catch (err) {
      return reply.status(503).send({
        type: 'error',
        error: { type: 'api_error', message: (err as Error).message },
      });
    }

    const providerResp = routed.response;
    if (!providerResp.success || !providerResp.data) {
      const code = providerResp.error?.code ?? 'upstream_error';
      const status = code === 'rate_limited' ? 429 : code === 'timeout' ? 504 : 502;
      return reply
        .header('X-Routing-Model', routed.chosen.id)
        .header('X-Routing-Strategy', routed.strategy)
        .header('X-Routing-Reason', routed.reason)
        .header('X-Routing-Attempts', String(routed.attempts.length))
        .status(status)
        .send({
          type: 'error',
          error: { type: 'api_error', message: providerResp.error?.message ?? 'Upstream failure', code },
        });
    }

    const anthropicResp = openAIToAnthropic(providerResp.data, anthropicReq.model);
    reply
      .header('X-Unichanl-Model', routed.chosen.id)
      .header('X-Routing-Model', routed.chosen.id)
      .header('X-Routing-Strategy', routed.strategy)
      .header('X-Routing-Reason', routed.reason)
      .header('X-Routing-Attempts', String(routed.attempts.length))
      .header('X-Request-ID', requestId)
      .status(200)
      .send(anthropicResp);
  });
}
