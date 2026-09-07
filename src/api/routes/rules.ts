import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { routingRuleRepository } from '../../db/repositories/routingRuleRepository.js';
import { ValidationError } from '../../utils/errors.js';

const STRATEGIES = ['lowest_cost', 'highest_quality', 'weighted_round_robin', 'failover'] as const;

const createRuleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  strategy: z.enum(STRATEGIES),
  conditions: z.record(z.unknown()).optional(),
  priority: z.number().int().min(1).max(100),
  enabled: z.boolean(),
});

export async function ruleRoutes(app: FastifyInstance) {
  app.get('/rules', async (_request, reply) => {
    const rules = await routingRuleRepository.listAll();
    reply.send({ rules, total: rules.length });
  });

  app.post('/rules', async (request, reply) => {
    const parsed = createRuleSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Geçersiz istek', parsed.error.flatten());

    const rule = await routingRuleRepository.create({
      name: parsed.data.name,
      description: parsed.data.description,
      strategy: parsed.data.strategy,
      conditions: (parsed.data.conditions ?? {}) as Prisma.InputJsonValue,
      priority: parsed.data.priority,
      enabled: parsed.data.enabled,
    });
    reply.status(201).send({ rule });
  });
}
