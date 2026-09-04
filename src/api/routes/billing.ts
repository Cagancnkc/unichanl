import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createCheckoutSession } from '../../billing/polar.js';
import { creditRepository } from '../../db/repositories/creditRepository.js';
import { userRepository } from '../../db/repositories/userRepository.js';
import { MIN_TOPUP_USD, MAX_TOPUP_USD } from '../../config/pricing.js';
import { ValidationError } from '../../utils/errors.js';

const checkoutSchema = z.object({
  productId: z.string().min(1),
  successUrl: z.string().url().optional(),
});

const topupSchema = z.object({
  amountUsd: z.number().positive(),
  successUrl: z.string().url().optional(),
});

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  app.post('/billing/checkout', async (request: FastifyRequest, reply) => {
    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Geçersiz istek', parsed.error.flatten());

    const user = request.user;
    const session = await createCheckoutSession({
      productId: parsed.data.productId,
      customerEmail: user.email,
      successUrl: parsed.data.successUrl,
      metadata: { userId: user.id },
    });
    reply.send({ checkoutId: session.id, url: session.url });
  });

  app.post('/billing/topup', async (request: FastifyRequest, reply) => {
    const parsed = topupSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Geçersiz istek', parsed.error.flatten());

    const amountUsd = parsed.data.amountUsd;
    if (amountUsd < MIN_TOPUP_USD || amountUsd > MAX_TOPUP_USD) {
      return reply.status(400).send({
        error: {
          code: 'amount_out_of_range',
          message: `amountUsd must be between ${MIN_TOPUP_USD} and ${MAX_TOPUP_USD}`,
        },
      });
    }

    const productId = process.env.POLAR_PRODUCT_CREDIT;
    if (!productId) {
      return reply.status(500).send({
        error: { code: 'credit_product_not_configured', message: 'POLAR_PRODUCT_CREDIT env var missing' },
      });
    }

    const user = request.user;
    const amountCents = Math.round(amountUsd * 100);
    const session = await createCheckoutSession({
      productId,
      customerEmail: user.email,
      successUrl: parsed.data.successUrl,
      amount: amountCents,
      metadata: { userId: user.id, kind: 'credit_topup', amountUsd: String(amountUsd) },
    });
    reply.send({ checkoutId: session.id, url: session.url, amountUsd });
  });

  app.get('/billing/balance', async (request: FastifyRequest, reply) => {
    const user = request.user;
    const [balance, transactions] = await Promise.all([
      creditRepository.getBalance(user.id),
      creditRepository.listTransactions(user.id, 20),
    ]);
    reply.send({
      balanceUsd: balance.toString(),
      recentTransactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amountUsd: t.amountUsd.toString(),
        balanceAfter: t.balanceAfter.toString(),
        requestId: t.requestId,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  });

  app.get('/billing/recharge-settings', async (request: FastifyRequest, reply) => {
    const user = request.user;
    const settings = await userRepository.getRechargeSettings(user.id);
    reply.send({
      autoRechargeEnabled: settings?.autoRechargeEnabled ?? true,
      autoRechargeThreshold: settings?.autoRechargeThreshold?.toString() ?? '1.00',
      autoRechargeAmount: settings?.autoRechargeAmount?.toString() ?? '5.00',
    });
  });

  app.put('/billing/recharge-settings', async (request: FastifyRequest, reply) => {
    const body = z.object({ autoRechargeEnabled: z.boolean() }).safeParse(request.body);
    if (!body.success) throw new ValidationError('Geçersiz istek', body.error.flatten());

    const user = request.user;
    await userRepository.setRechargeSettings(user.id, { autoRechargeEnabled: body.data.autoRechargeEnabled });
    reply.status(204).send();
  });
}
