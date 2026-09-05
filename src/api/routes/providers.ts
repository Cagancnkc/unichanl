import type { FastifyInstance } from 'fastify';
import { providerRepository } from '../../db/repositories/providerRepository.js';

export async function providerRoutes(app: FastifyInstance) {
  app.get('/providers', async (_request, reply) => {
    const providers = await providerRepository.getSummary();
    reply.send({ providers, total: providers.length });
  });
}
