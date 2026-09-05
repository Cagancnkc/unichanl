import type { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../../db/prisma.js';
import { creditRepository } from '../../db/repositories/creditRepository.js';

type StepState = { done: boolean; completedAt: string | null };

export async function onboardingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/dashboard/onboarding-status', async (request: FastifyRequest, reply) => {
    const userId = request.user.id;

    const [firstTopupAt, usageCount, apiKeyCount, balance] = await Promise.all([
      creditRepository.hasRealTopup(userId),
      prisma.usageRecord.count({ where: { userId } }),
      prisma.apiKey.count({ where: { userId, enabled: true } }),
      creditRepository.getBalance(userId),
    ]);

    const topup: StepState = {
      done: firstTopupAt !== null,
      completedAt: firstTopupAt?.toISOString() ?? null,
    };
    const cli: StepState = { done: usageCount >= 1, completedAt: null };
    const apiKey: StepState = { done: apiKeyCount >= 1, completedAt: null };
    const firstRun: StepState = { done: usageCount >= 2, completedAt: null };

    const stepOrder = [topup, cli, apiKey, firstRun];
    let currentStep: number | null = null;
    for (let i = 0; i < stepOrder.length; i++) {
      if (!stepOrder[i].done) {
        currentStep = i + 1;
        break;
      }
    }
    const doneCount = stepOrder.filter((s) => s.done).length;
    const progressPercent = Math.round((doneCount / stepOrder.length) * 100);

    reply.send({
      steps: { topup, cli, apiKey, firstRun },
      currentStep,
      progressPercent,
      walletBalanceUsd: balance.toString(),
      hasCompletedFirstTopup: topup.done,
    });
  });
}
