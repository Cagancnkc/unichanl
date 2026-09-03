import type { FastifyInstance } from 'fastify';
import { prisma } from '../../db/prisma.js';
import { redis } from '../../cache/redis.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    const start = Date.now();
    let dbStatus = 'ok';
    let redisStatus = 'ok';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    try {
      await redis.ping();
    } catch {
      redisStatus = 'error';
    }

    const isHealthy = dbStatus === 'ok' && redisStatus === 'ok';

    reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'ok' : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      uptime: process.uptime(),
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  });
}
