import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../db/prisma.js';
import { userRepository } from '../../db/repositories/userRepository.js';
import { AppError, ValidationError, NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/user/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await userRepository.findById(req.user.id);
    if (!user) throw new NotFoundError('Kullanıcı');
    reply.send({
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      tier: user.tier,
      notifyEmailEnabled: user.notifyEmailEnabled,
      notifyLowBalanceEnabled: user.notifyLowBalanceEnabled,
      createdAt: user.createdAt.toISOString(),
      provider: 'google',
    });
  });

  app.put('/user/profile', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body ?? {}) as { displayName?: unknown };
    const raw = body.displayName;
    if (raw !== null && typeof raw !== 'string') {
      throw new ValidationError('displayName metin olmalı');
    }
    const trimmed = typeof raw === 'string' ? raw.trim() : null;
    if (typeof trimmed === 'string' && (trimmed.length < 1 || trimmed.length > 60)) {
      throw new ValidationError('Görünen ad 1-60 karakter olmalı');
    }
    const user = await userRepository.updateProfile(req.user.id, { displayName: trimmed });
    reply.send({
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    });
  });

  app.put('/user/notifications', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body ?? {}) as {
      notifyEmailEnabled?: unknown;
      notifyLowBalanceEnabled?: unknown;
    };
    const patch: { notifyEmailEnabled?: boolean; notifyLowBalanceEnabled?: boolean } = {};
    if (body.notifyEmailEnabled !== undefined) {
      if (typeof body.notifyEmailEnabled !== 'boolean') {
        throw new ValidationError('notifyEmailEnabled boolean olmalı');
      }
      patch.notifyEmailEnabled = body.notifyEmailEnabled;
    }
    if (body.notifyLowBalanceEnabled !== undefined) {
      if (typeof body.notifyLowBalanceEnabled !== 'boolean') {
        throw new ValidationError('notifyLowBalanceEnabled boolean olmalı');
      }
      patch.notifyLowBalanceEnabled = body.notifyLowBalanceEnabled;
    }
    const user = await userRepository.updateNotifications(req.user.id, patch);
    reply.send({
      notifyEmailEnabled: user.notifyEmailEnabled,
      notifyLowBalanceEnabled: user.notifyLowBalanceEnabled,
    });
  });

  app.post('/auth/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    await prisma.apiKey.updateMany({
      where: { userId: req.user.id, enabled: true },
      data: { enabled: false },
    });
    logger.info({ requestId: req.id, userId: req.user.id }, 'user logout: keys disabled');
    reply.send({ ok: true });
  });

  app.delete('/user', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body ?? {}) as { confirm?: unknown };
    if (body.confirm !== 'DELETE') {
      throw new AppError(400, 'CONFIRM_REQUIRED', 'Onay için "DELETE" yaz');
    }
    await userRepository.deleteById(req.user.id);
    logger.warn({ requestId: req.id, userId: req.user.id }, 'user deleted');
    reply.send({ ok: true });
  });
}
