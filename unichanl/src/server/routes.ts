import type { FastifyInstance } from "fastify";
import { UNICHANL_MODEL_IDS } from "../config/models.js";
import { loadConfig } from "../config/config-manager.js";
import type { Provider, ProviderName } from "../types/index.js";
import { handleChatCompletion } from "../gateway/request-handler.js";

interface RegisterOptions {
  providers: Provider[];
}

export async function registerRoutes(
  app: FastifyInstance,
  opts: RegisterOptions
): Promise<void> {
  const providersByName = new Map<ProviderName, Provider>();
  for (const p of opts.providers) providersByName.set(p.name, p);

  app.get("/health", async () => ({
    status: "ok",
    service: "unichanl",
    gateway: "running",
  }));

  app.get("/v1/models", async () => ({
    object: "list",
    data: UNICHANL_MODEL_IDS.map((id) => ({
      id,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: "unichanl",
    })),
  }));

  app.get("/status", async () => {
    const cfg = loadConfig();
    const providerStatus = (
      ["anthropic", "openai", "google"] as ProviderName[]
    ).map((name) => ({
      name,
      configured: providersByName.get(name)?.isAvailable() ?? false,
    }));
    return {
      gateway: {
        status: "running",
        address: `${cfg.gateway.host}:${cfg.gateway.port}`,
      },
      providers: providerStatus,
      routing: { mode: "automatic", default: cfg.routing.default },
    };
  });

  app.post("/v1/chat/completions", async (req, reply) =>
    handleChatCompletion(req, reply, providersByName)
  );
}
