export type {
  Provider,
  ProviderChatCompletionInput,
  ProviderChatCompletionResult,
  StreamChunk,
  ProviderName,
} from "../types/index.js";

import { ProviderRequestError } from "../types/index.js";

export function mapHttpError(
  status: number,
  body: unknown,
  providerName: string
): ProviderRequestError {
  const bodyText =
    typeof body === "string" ? body : JSON.stringify(body ?? {});
  return new ProviderRequestError(
    `${providerName} returned HTTP ${status}: ${bodyText.slice(0, 500)}`,
    status,
    body
  );
}
