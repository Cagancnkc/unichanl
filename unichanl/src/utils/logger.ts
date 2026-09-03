import { pino } from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers['x-api-key']",
      "headers.authorization",
      "headers['x-api-key']",
      "*.apiKey",
      "*.api_key",
    ],
    censor: "[REDACTED]",
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
