import type { FastifyInstance } from 'fastify';
import { createChildLogger } from '../utils/logger.js';

// Track request start times per request ID
const requestStarts = new Map<string, number>();

export function registerRequestTimingHook(app: FastifyInstance): void {
  app.addHook('onRequest', async (request) => {
    requestStarts.set(request.id, Date.now());
  });

  app.addHook('onSend', async (request, reply) => {
    const start = requestStarts.get(request.id) || Date.now();
    const duration = Date.now() - start;
    requestStarts.delete(request.id);

    const statusCode = reply.statusCode;
    const method = request.method;
    const path = request.url;

    const logger = createChildLogger({ requestId: request.id });

    if (statusCode >= 400) {
      logger.warn(
        { method, path, statusCode, durationMs: duration },
        'Başarısız istek'
      );
    } else if (duration > 1000) {
      logger.warn(
        { method, path, statusCode, durationMs: duration },
        'Yavaş istek (>1s)'
      );
    } else {
      logger.info(
        { method, path, statusCode, durationMs: duration },
        'İstek tamamlandı'
      );
    }
  });
}
