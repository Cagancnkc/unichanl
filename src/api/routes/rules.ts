import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { routingRuleRepository } from '../../db/repositories/routingRuleRepository.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';

const STRATEGIES = ['lowest_cost', 'highest_quality', 'weighted_round_robin', 'failover'] as const;
const TRIGGERS = ['quota_exceeded', 'timeout', 'model_unavailable'] as const;

const chainSchema = z.object({
  primary: z.string().trim().min(1).max(200),
  fallbacks: z.array(z.string().trim().min(1).max(200)).max(2).default([]),
});

const conditionsSchema = z
  .object({
    chain: chainSchema.optional(),
    triggers: z.array(z.enum(TRIGGERS)).optional(),
    preference: z.enum(['lowestcost', 'premium', 'balanced', 'fastest']).optional(),
  })
  .passthrough();

const ruleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  strategy: z.enum(STRATEGIES),
  conditions: conditionsSchema.optional(),
  priority: z.number().int().min(1).max(100),
  enabled: z.boolean(),
});

export async function ruleRoutes(app: FastifyInstance) {
  app.get('/rules', async (_request, reply) => {
    const rules = await routingRuleRepository.listAll();
    reply.send({ rules, total: rules.length });
  });

  app.post('/rules', async (request, reply) => {
    const parsed = ruleSchema.safeParse(request.body);
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

  app.put<{ Params: { id: string } }>('/rules/:id', async (request, reply) => {
    const { id } = request.params;
    const existing = await routingRuleRepository.findById(id);
    if (!existing) throw new NotFoundError('Kural bulunamadı');

    const parsed = ruleSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Geçersiz istek', parsed.error.flatten());

    const rule = await routingRuleRepository.update(id, {
      name: parsed.data.name,
      description: parsed.data.description,
      strategy: parsed.data.strategy,
      conditions: (parsed.data.conditions ?? {}) as Prisma.InputJsonValue,
      priority: parsed.data.priority,
      enabled: parsed.data.enabled,
    });
    reply.send({ rule });
  });

  app.delete<{ Params: { id: string } }>('/rules/:id', async (request, reply) => {
    const { id } = request.params;
    const existing = await routingRuleRepository.findById(id);
    if (!existing) throw new NotFoundError('Kural bulunamadı');
    await routingRuleRepository.remove(id);
    reply.status(204).send();
  });
}
