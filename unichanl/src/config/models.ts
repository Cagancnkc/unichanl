import type { UnichanlConfig } from "../types/index.js";

export const DEFAULT_CONFIG: UnichanlConfig = {
  gateway: {
    host: "127.0.0.1",
    port: 20128,
  },
  routing: {
    default: "unichanl-auto",
  },
  models: {
    "unichanl-auto": [
      { provider: "anthropic", model: "claude-sonnet-4-5" },
      { provider: "openai", model: "gpt-4o" },
      { provider: "google", model: "gemini-2.0-flash" },
    ],
    "unichanl-primary": [
      { provider: "anthropic", model: "claude-opus-4-7" },
      { provider: "openai", model: "gpt-4o" },
      { provider: "google", model: "gemini-2.0-pro" },
    ],
    "unichanl-fast": [
      { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
      { provider: "openai", model: "gpt-4o-mini" },
      { provider: "google", model: "gemini-2.0-flash" },
    ],
  },
};

export const UNICHANL_MODEL_IDS = Object.keys(DEFAULT_CONFIG.models);
