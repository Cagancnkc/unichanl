import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { Prisma } from '@prisma/client';
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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const map: Record<string, { status: number; code: string; message: string }> = {
      P2002: { status: 409, code: 'CONFLICT', message: 'Kayıt zaten mevcut' },
      P2025: { status: 404, code: 'NOT_FOUND', message: 'Kayıt bulunamadı' },
      P2003: { status: 400, code: 'FOREIGN_KEY_VIOLATION', message: 'Geçersiz ilişkili kayıt' },
    };
    const mapped = map[error.code];
    if (mapped) {
      logger.warn(
        { err: error, requestId: request.id, method: request.method, url: request.url, prismaCode: error.code },
        'Prisma known request error',
      );
      reply.status(mapped.status).send({
        error: { code: mapped.code, message: mapped.message, request_id: request.id },
      });
      return;
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    logger.error(
      { err: error, requestId: request.id, method: request.method, url: request.url },
      'Prisma init/panic — database unavailable',
    );
    reply.status(503).send({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Veritabanı geçici olarak kullanılamıyor',
        request_id: request.id,
      },
    });
    return;
  }

  logger.error(
    { err: error, requestId: request.id, method: request.method, url: request.url },
    'İşlenmeyen hata',
  );
  reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Sunucu içi hata',
      request_id: request.id,
    },
  });
}
