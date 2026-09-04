import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerRequestTimingHook } from './middleware/requestTiming.js';
import { healthRoutes } from './api/routes/health.js';
import { chatRoutes } from './api/routes/chat.js';
import { keyRoutes } from './api/routes/keys.js';
import { modelRoutes } from './api/routes/models.js';
import { usageRoutes } from './api/routes/usage.js';
import { billingRoutes } from './api/routes/billing.js';
import { billingWebhookRoutes } from './api/routes/billingWebhook.js';
import { authRoutes } from './api/routes/auth.js';
import { generateRequestId } from './utils/id.js';

export async function createApp() {
  const app = Fastify({
    logger: false,
    genReqId: () => generateRequestId(),
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS === '*' ? true : (process.env.ALLOWED_ORIGINS ?? '*').split(','),
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

  await app.register(compress);

  registerRequestTimingHook(app);
  app.setErrorHandler(errorHandler);

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'site'),
    prefix: '/',
    decorateReply: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.raw.setHeader('Cache-Control', 'no-cache, must-revalidate');
      } else {
        res.raw.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(billingWebhookRoutes, { prefix: '/api' });
  await app.register(authRoutes);

  await app.register(
    async (protectedApp) => {
      protectedApp.addHook('onRequest', authMiddleware);

      await protectedApp.register(chatRoutes, { prefix: '/v1' });
      await protectedApp.register(keyRoutes, { prefix: '/api' });
      await protectedApp.register(modelRoutes, { prefix: '/api' });
      await protectedApp.register(usageRoutes, { prefix: '/api' });
      await protectedApp.register(billingRoutes, { prefix: '/api' });
    },
  );

  // Anahtar oluşturma — auth olmadan da çalışır (ilk kurulum)
  app.post('/api/keys/create', async (request, reply) => {
    const body = request.body as { email?: string; name?: string } | undefined;
    if (!body?.email) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'E-posta gerekli' } });
    }

    const { userRepository } = await import('./db/repositories/userRepository.js');
    const { apiKeyRepository } = await import('./db/repositories/apiKeyRepository.js');

    let user = await userRepository.findByEmail(body.email);
    if (!user) {
      user = await userRepository.create({ email: body.email });
    }

    const { key, record } = await apiKeyRepository.create(user.id, body.name);

    reply.status(201).send({
      key,
      keyId: record.id,
      prefix: record.keyPrefix,
      userId: user.id,
      message: 'API anahtarını güvenli bir yerde saklayın. Bir daha gösterilmeyecek.',
    });
  });

  return app;
}
