import type { FastifyInstance, FastifyRequest } from 'fastify';
import { usageRepository } from '../../db/repositories/usageRepository.js';

export async function usageRoutes(app: FastifyInstance) {
  app.get(
    '/usage',
    async (request: FastifyRequest<{ Querystring: { since?: string; limit?: string } }>, reply) => {
      const since = request.query.since ? new Date(request.query.since) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const limit = Math.min(parseInt(request.query.limit ?? '50'), 200);

      const [stats, totalCost, recent, dailyUsage] = await Promise.all([
        usageRepository.getUserStats(request.user.id, since),
        usageRepository.getTotalCost(request.user.id, since),
        usageRepository.getRecentRecords(request.user.id, limit),
        usageRepository.getDailyUsage(request.user.id, since),
      ]);

      const totalTokens = stats.reduce((acc, s) => acc + (s._sum.inputTokens ?? 0) + (s._sum.outputTokens ?? 0), 0);
      const totalRequests = stats.reduce((acc, s) => acc + s._count.id, 0);

      let avgLatency = 0;
      let latencyWeight = 0;
      for (const s of stats) {
        const cnt = s._count.id;
        const avg = s._avg.latencyMs ?? 0;
        if (cnt > 0 && avg > 0) {
          avgLatency += avg * cnt;
          latencyWeight += cnt;
        }
      }
      avgLatency = latencyWeight > 0 ? Math.round(avgLatency / latencyWeight) : 0;

      reply.send({
        summary: {
          totalRequests,
          totalTokens,
          totalCostUsd: totalCost,
          since: since.toISOString(),
        },
        byModel: stats,
        recent,
        analytics: {
          dailyUsage,
          avgLatency,
        },
      });
    },
  );
}
