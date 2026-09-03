import { prisma } from '../db/prisma.js';
import { usageRepository } from '../db/repositories/usageRepository.js';
import { costTracker } from './costTracker.js';
import { logger } from '../utils/logger.js';
import type { ModelCandidate, UsageStats } from '../types/index.js';

export interface LogUsageParams {
  requestId: string;
  userId: string;
  apiKeyId: string;
  sessionId?: string;
  model: ModelCandidate;
  usage?: UsageStats;
  latencyMs: number;
  strategy: string;
  requestedModel: string;
  wasFailover: boolean;
  attempts: string[];
  httpStatus: number;
}

export function logUsageAsync(params: LogUsageParams): void {
  setImmediate(async () => {
    try {
      const tasks: Promise<unknown>[] = [];

      if (params.usage) {
        tasks.push(
          usageRepository.record({
            requestId: params.requestId,
            userId: params.userId,
            apiKeyId: params.apiKeyId,
            sessionId: params.sessionId,
            modelId: params.model.id,
            provider: params.model.provider,
            inputTokens: params.usage.prompt_tokens,
            outputTokens: params.usage.completion_tokens,
            totalCostUsd: costTracker.calculateCost(params.model, params.usage),
            latencyMs: params.latencyMs,
            routingStrategy: params.strategy,
            wasFailover: params.wasFailover,
            httpStatus: params.httpStatus,
          }),
        );
      }

      tasks.push(
        prisma.routingLog.create({
          data: {
            requestId: params.requestId,
            userId: params.userId,
            apiKeyId: params.apiKeyId,
            sessionId: params.sessionId,
            requestedModel: params.requestedModel,
            selectedModelId: params.model.id,
            strategy: params.strategy,
            candidatesCount: params.attempts.length,
            wasFailover: params.wasFailover,
            failedModels: params.attempts.slice(0, -1).filter((a) => !a.includes(':')),
            latencyMs: params.latencyMs,
          },
        }),
      );

      await Promise.all(tasks);
    } catch (err) {
      logger.error({ err, requestId: params.requestId }, 'Kullanım kaydı başarısız');
    }
  });
}
