import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createCheckoutSession } from '../../billing/polar.js';
import { ValidationError } from '../../utils/errors.js';

const checkoutSchema = z.object({
  productId: z.string().min(1),
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
}
