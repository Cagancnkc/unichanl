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
      P2021: { status: 500, code: 'DB_SCHEMA_MISMATCH', message: 'Veritabanı tablosu eksik — migration deploy et' },
      P2022: { status: 500, code: 'DB_SCHEMA_MISMATCH', message: 'Veritabanı kolonu eksik — migration deploy et' },
    };
    const mapped = map[error.code];
    if (mapped) {
      logger.warn(
        { err: error, requestId: request.id, method: request.method, url: request.url, prismaCode: error.code },
        'Prisma known request error',
      );
      reply.status(mapped.status).send({
        error: {
          code: mapped.code,
          message: mapped.message,
          request_id: request.id,
          ...(mapped.status >= 500 ? { hint: String(error.message).split('\n').slice(0, 2).join(' ').slice(0, 300) } : {}),
        },
      });
      return;
    }
    logger.error(
      { err: error, requestId: request.id, method: request.method, url: request.url, prismaCode: error.code },
      'Prisma known request error (unmapped)',
    );
    reply.status(500).send({
      error: {
        code: 'DB_ERROR',
        message: 'Veritabanı hatası',
        request_id: request.id,
        hint: error.code + ': ' + String(error.message).split('\n').slice(0, 2).join(' ').slice(0, 300),
      },
    });
    return;
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

  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error(
      { err: error, requestId: request.id, method: request.method, url: request.url },
      'Prisma validation error — schema drift or bad payload',
    );
    reply.status(500).send({
      error: {
        code: 'DB_SCHEMA_MISMATCH',
        message: 'Veritabanı şeması ile kod uyuşmuyor — migration eksik olabilir',
        request_id: request.id,
        hint: String(error.message).split('\n').slice(0, 3).join(' ').slice(0, 300),
      },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    logger.error(
      { err: error, requestId: request.id, method: request.method, url: request.url },
      'Prisma unknown request error',
    );
    reply.status(500).send({
      error: {
        code: 'DB_UNKNOWN_ERROR',
        message: 'Veritabanı bilinmeyen hata',
        request_id: request.id,
        hint: String(error.message).slice(0, 300),
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
      hint: (error as Error).name + ': ' + String((error as Error).message || '').slice(0, 300),
    },
  });
}
