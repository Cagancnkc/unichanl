import type { FastifyInstance } from 'fastify';
import { modelRepository } from '../../db/repositories/modelRepository.js';
import { getCircuitBreaker } from '../../cache/circuitBreaker.js';

export async function modelRoutes(app: FastifyInstance) {
  app.get('/models', async (_request, reply) => {
    const models = await modelRepository.listPublic();

    const modelsWithStatus = await Promise.all(
      models.map(async (m) => {
        const cb = getCircuitBreaker(m.id);
        const cbState = await cb.getState();
        return {
          ...m,
          circuitState: cbState.state,
        };
      }),
    );

    reply.send({ models: modelsWithStatus, total: modelsWithStatus.length });
  });
}
