import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { nanoid } from 'nanoid';
import argon2 from 'argon2';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

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

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      try {
        user = await prisma.user.create({
          data: { email, name: email.split('@')[0] },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          user = await prisma.user.findUnique({ where: { email } });
        }
        if (!user) throw err;
      }
    }

    await prisma.apiKey.updateMany({
      where: { userId: user.id, enabled: true },
      data: { enabled: false },
    });

    const raw = 'tkg_' + nanoid(40);
    const hash = await argon2.hash(raw);

    await prisma.apiKey.create({
      data: {
        userId: user.id,
        keyHash: hash,
        keyPrefix: raw.slice(0, 8),
      },
    });

    logger.info(
      { requestId: req.id, userId: user.id, email },
      'OAuth: Google login success',
    );

    return reply.send({ key: raw });
  });
}
