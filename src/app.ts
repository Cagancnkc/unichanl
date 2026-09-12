import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerRequestTimingHook } from './middleware/requestTiming.js';
import { healthRoutes } from './api/routes/health.js';
import { chatRoutes } from './api/routes/chat.js';
import { keyRoutes, createKeySchema } from './api/routes/keys.js';
import { Prisma } from '@prisma/client';
import { modelRoutes } from './api/routes/models.js';
import { usageRoutes } from './api/routes/usage.js';
import { billingRoutes } from './api/routes/billing.js';
import { billingWebhookRoutes } from './api/routes/billingWebhook.js';
import { authRoutes } from './api/routes/auth.js';
import { providerRoutes } from './api/routes/providers.js';
import { ruleRoutes } from './api/routes/rules.js';
import { sessionRoutes } from './api/routes/sessions.js';
import { onboardingRoutes } from './api/routes/onboarding.js';
import { adminRoutes } from './api/routes/admin.js';
import { publicModelRoutes } from './api/routes/publicModels.js';
import { generateRequestId } from './utils/id.js';
import { logger } from './utils/logger.js';

export async function createApp() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    logger.warn('SUPABASE_URL/SUPABASE_ANON_KEY tanımsız — Google girişi çalışmayacak');
  }

  const app = Fastify({
    logger: false,
    genReqId: () => generateRequestId(),
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
          'https://www.clarity.ms',
          'https://*.clarity.ms',
        ],
        'script-src-attr': ["'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': [
          "'self'",
          'https://*.supabase.co',
          'wss://*.supabase.co',
          'https://www.google-analytics.com',
          'https://region1.google-analytics.com',
          'https://www.clarity.ms',
          'https://*.clarity.ms',
        ],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
      },
    },
  });

  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  if (process.env.NODE_ENV === 'production' && (!allowedOriginsEnv || allowedOriginsEnv === '*')) {
    throw new Error('ALLOWED_ORIGINS prod ortamda açık domain listesi olmalı (wildcard yasak)');
  }
  await app.register(cors, {
    origin: allowedOriginsEnv === '*' ? true : (allowedOriginsEnv ?? '*').split(',').map((s) => s.trim()),
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  });

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
  await app.register(publicModelRoutes);

  await app.register(
    async (protectedApp) => {
      protectedApp.addHook('onRequest', authMiddleware);

      await protectedApp.register(chatRoutes, { prefix: '/v1' });
      await protectedApp.register(keyRoutes, { prefix: '/api' });
      await protectedApp.register(modelRoutes, { prefix: '/api' });
      await protectedApp.register(usageRoutes, { prefix: '/api' });
      await protectedApp.register(billingRoutes, { prefix: '/api' });
      await protectedApp.register(providerRoutes, { prefix: '/api' });
      await protectedApp.register(ruleRoutes, { prefix: '/api' });
      await protectedApp.register(sessionRoutes, { prefix: '/api' });
      await protectedApp.register(onboardingRoutes, { prefix: '/api' });
      await protectedApp.register(adminRoutes, { prefix: '/api' });
    },
  );

  // Anahtar oluşturma — auth olmadan da çalışır (ilk kurulum)
  app.post('/api/keys/create', async (request, reply) => {
    const parsed = createKeySchema.safeParse(request.body);
    if (!parsed.success || !parsed.data.email) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Geçerli bir e-posta gerekli',
          ...(parsed.success ? {} : { details: parsed.error.flatten() }),
        },
      });
    }

    const { userRepository } = await import('./db/repositories/userRepository.js');
    const { apiKeyRepository } = await import('./db/repositories/apiKeyRepository.js');

    const email = parsed.data.email;
    let user = await userRepository.findByEmail(email);
    if (!user) {
      try {
        user = await userRepository.create({ email });
      } catch (err) {
        // Race: another request created the same email between findByEmail and create.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          user = await userRepository.findByEmail(email);
        }
        if (!user) throw err;
      }
    }

    const { key, record } = await apiKeyRepository.create(user.id, parsed.data.name);

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
