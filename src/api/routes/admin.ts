import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { syncAllProviders } from '../../providers/sync/index.js';
import { AppError, AuthError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

function requireAdmin(request: FastifyRequest): void {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    throw new AppError(503, 'ADMIN_NOT_CONFIGURED', 'ADMIN_EMAILS env değişkeni ayarlanmamış');
  }

  const userEmail = request.user?.email?.toLowerCase();
  if (!userEmail || !adminEmails.includes(userEmail)) {
    throw new AuthError('Bu işlem için admin yetkisi gerekli');
  }
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.post('/admin/models/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    requireAdmin(request);

    logger.info({ userId: request.user?.id }, 'Admin manuel model sync tetikledi');
    const results = await syncAllProviders();

    reply.send({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  });
}
