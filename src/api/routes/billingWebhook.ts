import type { FastifyInstance, FastifyRequest } from 'fastify';
import { verifyWebhookSignature, productIdToTier } from '../../billing/polar.js';
import { userRepository } from '../../db/repositories/userRepository.js';
import { subscriptionRepository } from '../../db/repositories/subscriptionRepository.js';
import { logger } from '../../utils/logger.js';

const ACTIVE_STATES = new Set(['active', 'trialing']);

export async function billingWebhookRoutes(app: FastifyInstance): Promise<void> {
  app.removeContentTypeParser(['application/json']);
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    done(null, body);
  });

  app.post('/billing/webhook', async (request: FastifyRequest, reply) => {
    const raw = typeof request.body === 'string' ? request.body : '';
    const headers = request.headers as Record<string, string | undefined>;
    let valid = false;
    try {
      valid = verifyWebhookSignature(raw, headers);
    } catch (err) {
      logger.error({ err }, 'polar webhook signature verification threw');
      return reply.status(500).send({ error: 'webhook_config_error' });
    }
    if (!valid) return reply.status(401).send({ error: 'invalid_signature' });

    let event: { type: string; data: Record<string, unknown> };
    try {
      event = JSON.parse(raw);
    } catch {
      return reply.status(400).send({ error: 'invalid_json' });
    }

    await handleEvent(event).catch((err) => {
      logger.error({ err, eventType: event.type }, 'polar webhook handling failed');
    });
    reply.status(204).send();
  });
}

async function handleEvent(event: { type: string; data: Record<string, unknown> }): Promise<void> {
  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.active':
    case 'subscription.canceled':
    case 'subscription.revoked':
      await upsertSubscriptionFromEvent(event.data);
      return;
    default:
      logger.info({ type: event.type }, 'polar webhook: ignored event');
  }
}

async function upsertSubscriptionFromEvent(data: Record<string, unknown>): Promise<void> {
  const subscriptionId = str(data.id);
  const productId = str(data.product_id) ?? str((data.product as Record<string, unknown> | undefined)?.id);
  const status = str(data.status) ?? 'unknown';
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const customer = (data.customer ?? {}) as Record<string, unknown>;
  const email = str(customer.email);
  const polarCustomerId = str(data.customer_id) ?? str(customer.id);

  if (!subscriptionId || !productId) {
    logger.warn({ data }, 'polar webhook: missing subscription/product id');
    return;
  }

  let userId = str(metadata.userId);
  if (!userId && email) {
    const user = await userRepository.upsertByEmail(email, polarCustomerId ? { polarCustomerId } : {});
    userId = user.id;
  }
  if (!userId) {
    logger.warn({ subscriptionId }, 'polar webhook: cannot resolve user');
    return;
  }

  const tier = productIdToTier(productId);
  const currentPeriodStart = date(data.current_period_start);
  const currentPeriodEnd = date(data.current_period_end);
  const cancelAtPeriodEnd = Boolean(data.cancel_at_period_end);

  await subscriptionRepository.upsert({
    userId,
    polarSubscriptionId: subscriptionId,
    polarProductId: productId,
    tier,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  });

  if (polarCustomerId) {
    await userRepository.setPolarCustomerId(userId, polarCustomerId).catch(() => undefined);
  }
  const effectiveTier = ACTIVE_STATES.has(status) ? tier : 'free';
  await userRepository.updateTier(userId, effectiveTier);
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function date(v: unknown): Date | null {
  if (typeof v !== 'string') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
