import Fastify, { type FastifyInstance } from 'fastify';
import { messagesRoutes } from '../api/routes/messages.js';
import { chatCompletionsRoutes } from '../api/routes/chatCompletions.js';
import { generateRequestId } from '../utils/id.js';
import { ensureLocalApiKey } from '../integrations/local-api-key.js';
import { loadConfig } from '../config/config-manager.js';
import { logger } from '../utils/logger.js';

// A slim gateway suitable for local dev: does NOT require Postgres/Redis.
// The full Fastify app in src/app.ts (with DB-backed /v1/chat/completions,
// sessions, and usage tracking) remains available via `npm run start`.
export async function createGatewayApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    genReqId: () => generateRequestId(),
    bodyLimit: 10 * 1024 * 1024,
  });

  // CORS is intentionally omitted — the gateway binds to 127.0.0.1 only and is not
  // meant to be called from browser origins. Adding it back requires a Fastify-v5-
  // compatible @fastify/cors (v10+); the older v9 dep in this repo targets Fastify 4.

  app.get('/health', async (_req, reply) => {
    reply.status(200).send({
      status: 'ok',
      service: 'unichanl',
      version: '0.1.0',
      openrouter: !!process.env.OPENROUTER_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/status', async (_req, reply) => {
    const cfg = loadConfig();
    reply.status(200).send({
      status: 'ok',
      service: 'unichanl',
      providers: {
        openrouter: { configured: !!process.env.OPENROUTER_API_KEY },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          enabled: cfg.providers.anthropic.enabled,
          model: cfg.providers.anthropic.model,
        },
      },
    });
  });

  app.get('/v1/models', async (_req, reply) => {
    // Client-facing model id. Provider selection is internal.
    reply.status(200).send({
      object: 'list',
      data: [{ id: 'unichanl-auto', object: 'model' }],
    });
  });

  await app.register(messagesRoutes, { prefix: '/v1' });
  await app.register(chatCompletionsRoutes, { prefix: '/v1' });

  return app;
}

export interface StartOptions {
  host?: string;
  port?: number;
}

export interface RunningGateway {
  app: FastifyInstance;
  host: string;
  port: number;
  stop: () => Promise<void>;
}

export async function startGateway(opts: StartOptions = {}): Promise<RunningGateway> {
  const cfg = loadConfig();
  const host = opts.host ?? cfg.gateway.host;
  const port = opts.port ?? cfg.gateway.port;

  // Make sure a local API key exists before any tool tries to hit /v1/messages.
  ensureLocalApiKey();

  const app = await createGatewayApp();
  await app.listen({ host, port });
  logger.info({ host, port }, 'Unichanl gateway listening');

  return {
    app,
    host,
    port,
    stop: async () => {
      try {
        await app.close();
      } catch (err) {
        logger.error({ err }, 'Error closing gateway');
      }
    },
  };
}
