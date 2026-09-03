import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        request_id: request.id,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  const fastifyError = error as FastifyError;
  if (fastifyError.validation) {
    reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Geçersiz istek parametreleri',
        details: fastifyError.validation,
        request_id: request.id,
      },
    });
    return;
  }

  logger.error({ err: error, requestId: request.id }, 'İşlenmeyen hata');
  reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Sunucu içi hata',
      request_id: request.id,
    },
  });
}
