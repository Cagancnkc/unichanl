import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';

const eventSchema = z.object({
  event: z.enum([
    'signup_completed',
    'first_topup_success',
    'first_rule_created',
    'first_api_call',
    'page_view',
    'cta_click',
  ]),
  path: z.string().max(512).optional(),
  ref: z.string().max(512).optional(),
  meta: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/analytics/event', async (request: FastifyRequest, reply) => {
    const parsed = eventSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'invalid event' } });
    }
    const ua = request.headers['user-agent'] || null;
    logger.info(
      {
        kind: 'analytics.event',
        event: parsed.data.event,
        path: parsed.data.path ?? null,
        ref: parsed.data.ref ?? null,
        meta: parsed.data.meta ?? null,
        ua,
        ip: request.ip,
      },
      'analytics_event',
    );
    reply.send({ ok: true });
  });
}
