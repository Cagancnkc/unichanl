import Fastify, { type FastifyInstance } from "fastify";
import { registerRoutes } from "./routes.js";
import { logger } from "../utils/logger.js";
import type { Provider } from "../types/index.js";

export interface BuildServerOptions {
  providers: Provider[];
}

export async function buildServer(
  opts: BuildServerOptions
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    trustProxy: false,
  });

  app.addHook("onRequest", async (req) => {
    logger.debug(
      { method: req.method, url: req.url, id: req.id },
      "request received"
    );
  });

  app.setErrorHandler((err: Error & { statusCode?: number; code?: string }, req, reply) => {
    logger.error({ err, url: req.url }, "unhandled error");
    const statusCode = err.statusCode ?? 500;
    reply.code(statusCode).send({
      error: {
        message: err.message,
        type: "gateway_error",
        code: err.code ?? "INTERNAL_ERROR",
      },
    });
  });

  await registerRoutes(app, { providers: opts.providers });

  return app;
}

export async function startServer(
  opts: BuildServerOptions & { host: string; port: number }
): Promise<FastifyInstance> {
  const app = await buildServer(opts);
  await app.listen({ host: opts.host, port: opts.port });
  logger.info(
    { address: `http://${opts.host}:${opts.port}` },
    "Unichanl gateway listening"
  );
  return app;
}
