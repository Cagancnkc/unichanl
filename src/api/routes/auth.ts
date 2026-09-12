import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { nanoid } from 'nanoid';
import argon2 from 'argon2';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

async function withPrismaRetry<T>(label: string, requestId: string, fn: () => Promise<T>): Promise<T> {
  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const name = (err as Error)?.name ?? '';
      const isInit =
        err instanceof Prisma.PrismaClientInitializationError ||
        err instanceof Prisma.PrismaClientRustPanicError ||
        err instanceof Prisma.PrismaClientUnknownRequestError ||
        name === 'PrismaClientInitializationError';
      if (!isInit || attempt === maxAttempts) throw err;
      const delay = 150 * attempt;
      logger.warn({ requestId, step: label, attempt, err: (err as Error).message }, 'Prisma transient error — retrying');
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/google', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { access_token?: unknown } | null | undefined;
    const accessToken = body?.access_token;

    if (typeof accessToken !== 'string' || accessToken.length < 20 || accessToken.length > 4096) {
      throw new AppError(400, 'ACCESS_TOKEN_MALFORMED', 'access_token biçimi geçersiz');
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      logger.error({ requestId: req.id }, 'OAuth: SUPABASE_URL/ANON_KEY missing');
      throw new AppError(500, 'OAUTH_CONFIG_MISSING', 'Sunucu OAuth yapılandırması eksik');
    }

    let userRes: Response;
    try {
      userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseKey,
        },
      });
    } catch (err) {
      logger.error({ err, requestId: req.id }, 'OAuth: Supabase user fetch network error');
      throw new AppError(
        503,
        'AUTH_UNAVAILABLE',
        'Kimlik doğrulama servisi geçici olarak kullanılamıyor',
      );
    }

    if (!userRes.ok) {
      const bodyText = await userRes.text().catch(() => '');
      logger.warn(
        { requestId: req.id, status: userRes.status, body: bodyText.slice(0, 500) },
        'OAuth: Supabase rejected access_token',
      );
      throw new AppError(
        401,
        'OAUTH_TOKEN_INVALID',
        'Google oturumu doğrulanamadı — tekrar giriş yap',
      );
    }

    const sbUser = (await userRes.json().catch(() => ({}))) as { email?: string };
    const email = sbUser.email;

    if (!email || typeof email !== 'string') {
      logger.warn({ requestId: req.id }, 'OAuth: Supabase user has no email');
      throw new AppError(401, 'OAUTH_NO_EMAIL', 'Google hesabınızdan email alınamadı');
    }

    let user;
    try {
      user = await withPrismaRetry('user.findUnique', req.id, () =>
        prisma.user.findUnique({ where: { email } }),
      );
    } catch (err) {
      logger.error({ err, requestId: req.id, step: 'user.findUnique', email }, 'OAuth: user lookup failed');
      throw err;
    }
    if (!user) {
      try {
        user = await withPrismaRetry('user.create', req.id, () =>
          prisma.user.create({ data: { email, name: email.split('@')[0] } }),
        );
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
        }
        if (!user) {
          logger.error({ err, requestId: req.id, step: 'user.create', email }, 'OAuth: user create failed');
          throw err;
        }
      }
    }

    const raw = 'tkg_' + nanoid(40);
    const hash = await argon2.hash(raw);

    try {
      await withPrismaRetry('apiKey.updateMany', req.id, () =>
        prisma.apiKey.updateMany({ where: { userId: user!.id, enabled: true }, data: { enabled: false } }),
      );
      await withPrismaRetry('apiKey.create', req.id, () =>
        prisma.apiKey.create({
          data: { userId: user!.id, keyHash: hash, keyPrefix: raw.slice(0, 8) },
        }),
      );
    } catch (err) {
      logger.error({ err, requestId: req.id, step: 'apiKey.create', userId: user.id }, 'OAuth: api key provisioning failed');
      throw err;
    }

    logger.info(
      { requestId: req.id, userId: user.id, email },
      'OAuth: Google login success',
    );

    return reply.send({ key: raw });
  });
}
