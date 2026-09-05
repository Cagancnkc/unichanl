import type { FastifyInstance, FastifyRequest } from 'fastify';
import { sessionRepository } from '../../db/repositories/sessionRepository.js';

export async function sessionRoutes(app: FastifyInstance) {
  app.get(
    '/sessions',
    async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply) => {
      const limit = Math.min(parseInt(request.query.limit ?? '20'), 100);
      const sessions = await sessionRepository.listByUser(request.user.id, limit);
      reply.send({ sessions, total: sessions.length });
    },
  );
}
