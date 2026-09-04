import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { normalizeRequest } from '../normalizers/requestNormalizer.js';
import { normalizeResponse } from '../normalizers/responseNormalizer.js';
import { resolveRoutingContext } from '../../routing/modelResolver.js';
import { routingEngine } from '../../routing/engine.js';
import { contextService } from '../../services/contextService.js';
import { logUsageAsync } from '../../services/usageLogger.js';
import { openRouterAdapter } from '../../providers/openRouterAdapter.js';
import { getCircuitBreaker } from '../../cache/circuitBreaker.js';
import { sessionRepository } from '../../db/repositories/sessionRepository.js';
import { userRepository } from '../../db/repositories/userRepository.js';
import { logger } from '../../utils/logger.js';
import { creditRepository } from '../../db/repositories/creditRepository.js';
import { createRechargeSession } from '../../billing/polar.js';
import type { ChatCompletionRequest, ChatMessage } from '../../types/index.js';

export async function chatRoutes(app: FastifyInstance) {
  app.post('/chat/completions', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const requestId = request.id;
    const user = request.user;

    const balance = await creditRepository.getBalance(user.id);
    const settings = await userRepository.getRechargeSettings(user.id);
    const threshold = settings?.autoRechargeThreshold ?? 1;

    if (balance.lte(0) || (settings?.autoRechargeEnabled && balance.lt(threshold))) {
      let autoRechargeUrl: string | undefined;
      if (settings?.autoRechargeEnabled && process.env.POLAR_PRODUCT_CREDIT) {
        try {
          const sess = await createRechargeSession({
            userId: user.id,
            customerEmail: user.email,
            amountUsd: Number(settings.autoRechargeAmount ?? 5),
            successUrl: process.env.APP_URL ? `${process.env.APP_URL}/balance.html` : undefined,
          });
          autoRechargeUrl = sess.url;
        } catch (err) {
          logger.warn({ err, userId: user.id }, 'auto recharge session creation failed');
        }
      }
      return reply.status(402).send({
        error: {
          message: 'Yetersiz bakiye. Kredi yükle.',
          type: 'payment_required',
          code: 'insufficient_credits',
          balance: balance.toString(),
          autoRechargeUrl,
        },
      });
    }

    const body = normalizeRequest(request.body);
    const routingCtx = resolveRoutingContext(body, user.id);

    let messages: ChatMessage[] = body.messages;

    if (body.session_id) {
      const lastUserMsg = [...body.messages].reverse().find((m: ChatMessage) => m.role === 'user');
      if (lastUserMsg) {
        const sysMsg = body.messages.find((m) => m.role === 'system');
        messages = await contextService.buildContextPackage(body.session_id, lastUserMsg, sysMsg?.content);
      }
    }

    if (body.stream) {
      await handleStreaming(app, request, reply, body, messages, routingCtx, user, requestId, startTime);
      return;
    }

    const { response, model, attempts } = await routingEngine.executeWithFallback(routingCtx, messages, {
      requestId,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      top_p: body.top_p,
      stop: body.stop,
    });

    const normalized = normalizeResponse(response.data!, model.displayName, requestId);
    const latencyMs = Date.now() - startTime;

    reply
      .header('X-Model-Used', model.displayName)
      .header('X-Provider', model.provider)
      .header('X-Request-ID', requestId)
      .header('X-Routing-Strategy', routingCtx.strategy)
      .status(200)
      .send(normalized);

    logUsageAsync({
      requestId,
      userId: user.id,
      apiKeyId: user.apiKeyId,
      sessionId: body.session_id,
      model,
      usage: response.data?.usage,
      latencyMs,
      strategy: routingCtx.strategy,
      requestedModel: body.model,
      wasFailover: attempts.filter((a) => !a.includes(':')).length > 1,
      attempts,
      httpStatus: 200,
    });

    if (body.session_id && normalized.choices[0]?.message) {
      setImmediate(async () => {
        try {
          await Promise.all([
            sessionRepository.appendMessage(body.session_id!, {
              role: 'user',
              content: [...body.messages].reverse().find((m: ChatMessage) => m.role === 'user')?.content ?? '',
            }),
            sessionRepository.appendMessage(body.session_id!, {
              role: 'assistant',
              content: normalized.choices[0].message.content,
              modelUsed: model.openrouterModelId,
              outputTokens: response.data?.usage?.completion_tokens ?? 0,
            }),
            sessionRepository.updateCurrentModel(body.session_id!, model.openrouterModelId),
          ]);
        } catch (err) {
          logger.error({ err, sessionId: body.session_id }, 'Oturum mesajı kaydedilemedi');
        }
      });
    }
  });
}

async function handleStreaming(
  _app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  body: ChatCompletionRequest,
  messages: ChatMessage[],
  routingCtx: ReturnType<typeof resolveRoutingContext>,
  user: FastifyRequest['user'],
  requestId: string,
  startTime: number,
) {
  const model = await routingEngine.selectModel(routingCtx);
  const cb = getCircuitBreaker(model.id);

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Model-Used': model.displayName,
    'X-Provider': model.provider,
    'X-Request-ID': requestId,
    'X-Routing-Strategy': routingCtx.strategy,
  });

  let contentBuffer = '';
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const gen = openRouterAdapter.stream(model.openrouterModelId, messages, {
      requestId,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      top_p: body.top_p,
      stop: body.stop,
    });

    for await (const chunk of gen) {
      reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
      contentBuffer += chunk.choices[0]?.delta?.content ?? '';
      const chunkUsage = (chunk as unknown as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage;
      if (chunkUsage) {
        if (typeof chunkUsage.prompt_tokens === 'number') inputTokens = chunkUsage.prompt_tokens;
        if (typeof chunkUsage.completion_tokens === 'number') outputTokens = chunkUsage.completion_tokens;
      }
    }

    if (inputTokens === 0 && outputTokens === 0) {
      const promptChars = messages.reduce((sum, m) => sum + m.content.length, 0);
      inputTokens = Math.ceil(promptChars / 4);
      outputTokens = Math.ceil(contentBuffer.length / 4);
    }

    reply.raw.write('data: [DONE]\n\n');
    await cb.recordSuccess();
  } catch (err) {
    await cb.recordFailure();
    logger.error({ err, requestId, modelId: model.id }, 'Stream hatası');
    reply.raw.write(`data: ${JSON.stringify({ error: { message: 'Akış kesintiye uğradı' } })}\n\n`);
  } finally {
    reply.raw.end();

    const latencyMs = Date.now() - startTime;

    logUsageAsync({
      requestId,
      userId: user.id,
      apiKeyId: user.apiKeyId,
      sessionId: body.session_id,
      model,
      usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
      latencyMs,
      strategy: routingCtx.strategy,
      requestedModel: body.model,
      wasFailover: false,
      attempts: [model.id],
      httpStatus: 200,
    });

    if (body.session_id && contentBuffer) {
      setImmediate(async () => {
        try {
          await Promise.all([
            sessionRepository.appendMessage(body.session_id!, {
              role: 'user',
              content: [...body.messages].reverse().find((m: ChatMessage) => m.role === 'user')?.content ?? '',
            }),
            sessionRepository.appendMessage(body.session_id!, {
              role: 'assistant',
              content: contentBuffer,
              modelUsed: model.openrouterModelId,
            }),
          ]);
        } catch (err) {
          logger.error({ err, sessionId: body.session_id }, 'Stream oturum mesajı kaydedilemedi');
        }
      });
    }
  }
}
