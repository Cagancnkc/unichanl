import type { FastifyInstance } from 'fastify';
import { routingRuleRepository } from '../../db/repositories/routingRuleRepository.js';

export async function ruleRoutes(app: FastifyInstance) {
  app.get('/rules', async (_request, reply) => {
    const rules = await routingRuleRepository.listAll();
    reply.send({ rules, total: rules.length });
  });
}
