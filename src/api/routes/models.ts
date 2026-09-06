import type { FastifyInstance } from 'fastify';
import { getCircuitBreaker } from '../../cache/circuitBreaker.js';
import { getModelRegistry } from '../../registry/modelRegistry.js';
import { seedModels } from '../../registry/seed.js';

export async function modelRoutes(app: FastifyInstance) {
  app.get('/models', async (_request, reply) => {
    const registry = getModelRegistry();
    if (registry.list().length === 0) registry.seed(seedModels());

    const models = registry.list();
    const modelsWithStatus = await Promise.all(
      models.map(async (m) => {
        const cb = getCircuitBreaker(m.id);
        const cbState = await cb.getState();
        return {
          id: m.id,
          displayName: m.displayName,
          provider: m.providerName,
          contextWindow: m.contextWindow,
          inputPricePer1k: m.cost.inputPerMTokUsd / 1000,
          outputPricePer1k: m.cost.outputPerMTokUsd / 1000,
          tags: m.tags,
          enabled: m.enabled,
          availability: m.availability,
          campaignUnlimited: m.campaignUnlimited ?? false,
          circuitState: cbState.state,
        };
      }),
    );

    reply.send({ models: modelsWithStatus, total: modelsWithStatus.length });
  });

  app.patch('/models/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { enabled } = request.body as { enabled: boolean };

    const registry = getModelRegistry();
    if (registry.list().length === 0) registry.seed(seedModels());
    const model = registry.get(id);

    if (!model) {
      reply.status(404).send({ error: 'Model not found' });
      return;
    }

    if (model.campaignUnlimited) {
      reply.status(400).send({ error: 'Campaign unlimited models cannot be toggled' });
      return;
    }

    registry.setEnabled(id, enabled);
    reply.send({ success: true, enabled });
  });
}
