import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { routeComplete, routeStream } from '../../local/routingEngine.js';
import { classify } from '../../local/brain.js';
import type { ChatCompletionRequest, RoutingStrategy } from '../../types/index.js';
import { checkLocalAuth } from './localAuth.js';
import { checkCloudAuth } from './cloudAuth.js';
import { usageRepository } from '../../db/repositories/usageRepository.js';
import { modelRepository } from '../../db/repositories/modelRepository.js';

const SSE_DONE = 'data: [DONE]\n\n';

function pickStrategy(header: string | string[] | undefined, body: RoutingStrategy | undefined): RoutingStrategy | undefined {
  const raw = Array.isArray(header) ? header[0] : header;
  const allowed: RoutingStrategy[] = ['auto', 'priority', 'cheapest', 'fastest', 'capability'];
  if (raw && allowed.includes(raw as RoutingStrategy)) return raw as RoutingStrategy;
  return body;
}

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const requestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(messageSchema).min(1),
  stream: z.boolean().optional(),
  max_tokens: z.number().int().positive().max(200_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  routing_strategy: z.enum(['auto', 'priority', 'cheapest', 'fastest', 'capability']).optional(),
});

function sendError(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.status(status).send({
    error: { message, type: 'provider_error', code },
  });
}

export async function chatCompletionsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/chat/completions', async (request: FastifyRequest, reply: FastifyReply) => {
    const cloud = await checkCloudAuth(request);
    let authedUser = cloud.user;
    if (!cloud.ok) {
      const local = checkLocalAuth(request);
      if (!local.ok) {
        return sendError(reply, cloud.status ?? local.status ?? 401, 'UNAUTHORIZED', cloud.message ?? local.message ?? 'Unauthorized');
      }
    }

    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'INVALID_REQUEST', parsed.error.message);
    }
    const body = parsed.data as ChatCompletionRequest;
    const requestId = request.id;
    const strategy = pickStrategy(request.headers['x-routing-strategy'], body.routing_strategy);

    reply.header('X-Request-ID', requestId);

    const brain = classify(body.messages);
    const routeReq = {
      requestedModel: body.model,
      strategy,
      preferredTags: brain.suggestedTags,
      tier: authedUser?.tier,
    };
    reply.header('X-Brain-Task', brain.taskType);
    if (brain.suggestedTags.length > 0) reply.header('X-Brain-Tags', brain.suggestedTags.join(','));
    const options = {
      requestId,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      top_p: body.top_p,
      stop: body.stop,
    };

    if (body.stream) {
      let streamRoute;
      try {
        streamRoute = routeStream(routeReq, body.messages, options);
      } catch (err) {
        return sendError(reply, 503, 'NO_CANDIDATES', (err as Error).message);
      }

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Request-ID': requestId,
        'X-Routing-Model': streamRoute.chosen.id,
        'X-Routing-Strategy': streamRoute.strategy,
        'X-Routing-Reason': streamRoute.reason,
        'X-Routing-Attempts': String(streamRoute.attempts.length),
      });

      try {
        for await (const chunk of streamRoute.chunks) {
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        reply.raw.write(SSE_DONE);
      } catch (err) {
        logger.warn({ requestId, err }, 'chat completions stream failed');
        reply.raw.write(
          `data: ${JSON.stringify({
            error: { message: (err as Error).message, type: 'provider_error', code: 'upstream_error' },
          })}\n\n`,
        );
        reply.raw.write(SSE_DONE);
      } finally {
        reply.raw.end();
      }
      return;
    }

    let routed;
    try {
      routed = await routeComplete(routeReq, body.messages, options);
    } catch (err) {
      return sendError(reply, 503, 'NO_CANDIDATES', (err as Error).message);
    }

    reply
      .header('X-Routing-Model', routed.chosen.id)
      .header('X-Routing-Strategy', routed.strategy)
      .header('X-Routing-Reason', routed.reason)
      .header('X-Routing-Attempts', String(routed.attempts.length));

    if (!routed.response.success || !routed.response.data) {
      const code = routed.response.error?.code ?? 'upstream_error';
      const status = code === 'rate_limited' ? 429 : code === 'timeout' ? 504 : 502;
      return sendError(reply, status, code, routed.response.error?.message ?? 'Upstream failure');
    }

    if (authedUser) {
      persistUsage({
        requestId,
        user: authedUser,
        modelName: routed.chosen.id,
        provider: routed.chosen.providerName,
        usage: routed.response.data.usage,
        latencyMs: routed.response.latencyMs,
        strategy: routed.strategy,
        wasFailover: routed.attempts.length > 1,
        httpStatus: 200,
      }).catch((err) => logger.warn({ requestId, err }, 'usage persistence failed'));
    }

    return reply.status(200).send(routed.response.data);
  });
}

interface PersistUsageInput {
  requestId: string;
  user: { id: string; apiKeyId: string };
  modelName: string;
  provider: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number } | undefined;
  latencyMs: number;
  strategy: string;
  wasFailover: boolean;
  httpStatus: number;
}

async function persistUsage(input: PersistUsageInput): Promise<void> {
  const model = await modelRepository.findByName(input.modelName);
  if (!model) return;
  await usageRepository.record({
    requestId: input.requestId,
    userId: input.user.id,
    apiKeyId: input.user.apiKeyId,
    modelId: model.id,
    provider: input.provider,
    inputTokens: input.usage?.prompt_tokens ?? 0,
    outputTokens: input.usage?.completion_tokens ?? 0,
    totalCostUsd: 0,
    latencyMs: input.latencyMs,
    routingStrategy: input.strategy,
    wasFailover: input.wasFailover,
    httpStatus: input.httpStatus,
  });
}
