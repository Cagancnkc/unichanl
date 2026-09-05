import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { apiKeyRepository } from '../../db/repositories/apiKeyRepository.js';
import { userRepository } from '../../db/repositories/userRepository.js';
import { usageRepository } from '../../db/repositories/usageRepository.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';

const createKeySchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().optional(),
});

export async function keyRoutes(app: FastifyInstance) {
  app.post('/keys', async (request: FastifyRequest, reply) => {
    const body = createKeySchema.safeParse(request.body);
    if (!body.success) throw new ValidationError('Geçersiz istek', body.error.flatten());

    let userId = request.user?.id;

    if (!userId && body.data.email) {
      let user = await userRepository.findByEmail(body.data.email);
      if (!user) {
        user = await userRepository.create({ email: body.data.email });
      }
      userId = user.id;
    }

    if (!userId) {
      throw new ValidationError('Kullanıcı kimliği veya e-posta gerekli');
    }

    const { key, record } = await apiKeyRepository.create(userId, body.data.name);

    reply.status(201).send({
      key,
      keyId: record.id,
      prefix: record.keyPrefix,
      message: 'API anahtarını güvenli bir yerde saklayın. Bir daha gösterilmeyecek.',
    });
  });

  app.get('/keys', async (request: FastifyRequest, reply) => {
    const [keys, usageCounts] = await Promise.all([
      apiKeyRepository.listByUser(request.user.id),
      usageRepository.getCountsByApiKey(request.user.id),
    ]);
    const usageMap = new Map(
      usageCounts.map((u) => [u.apiKeyId, { requestCount: u._count.id, lastUsedAt: u._max.createdAt }]),
    );
    reply.send({
      keys: keys.map((k) => {
        const u = usageMap.get(k.id);
        return {
          ...k,
          usage: {
            requestCount: u?.requestCount ?? 0,
            lastUsedAt: (u?.lastUsedAt ?? k.lastUsedAt) ?? null,
          },
        };
      }),
    });
  });

  app.delete('/keys/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    await apiKeyRepository.revoke(request.params.id);
    reply.status(204).send();
  });
}
