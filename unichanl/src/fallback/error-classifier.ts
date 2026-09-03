import type { ClassifiedError, ClassifiedErrorType } from "../types/index.js";
import { ProviderRequestError } from "../types/index.js";

export function classifyError(err: unknown): ClassifiedError {
  if (err instanceof ProviderRequestError) {
    return classifyByStatus(err.statusCode, err.message, err.body);
  }

  const errObj = err as { code?: string; name?: string; message?: string };
  const code = errObj?.code ?? "";
  const name = errObj?.name ?? "";
  const message = String(errObj?.message ?? err ?? "");

  if (
    code === "ETIMEDOUT" ||
    code === "UND_ERR_HEADERS_TIMEOUT" ||
    code === "UND_ERR_BODY_TIMEOUT" ||
    name === "AbortError" ||
    /timeout/i.test(message)
  ) {
    return build("TIMEOUT", true, message);
  }
  if (
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "UND_ERR_SOCKET" ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    /fetch failed/i.test(message)
  ) {
    return build("CONNECTION", true, message);
  }
  if (/not implemented/i.test(message)) {
    return build("NOT_IMPLEMENTED", false, message);
  }
  return build("UNKNOWN", false, message);
}

function classifyByStatus(
  status: number | undefined,
  message: string,
  body?: unknown
): ClassifiedError {
  if (status == null) return build("UNKNOWN", false, message);

  const bodyStr =
    typeof body === "string" ? body : JSON.stringify(body ?? "");

  if (status === 429) {
    if (/quota|billing|insufficient/i.test(bodyStr)) {
      return build("QUOTA", true, message, status);
    }
    return build("RATE_LIMIT", true, message, status);
  }
  if (status === 408 || status === 504) {
    return build("TIMEOUT", true, message, status);
  }
  if (status >= 500 && status < 600) {
    return build("SERVER_ERROR", true, message, status);
  }
  if (status === 401 || status === 403) {
    return build("AUTH", false, message, status);
  }
  if (status === 400 || status === 404 || status === 422) {
    return build("BAD_REQUEST", false, message, status);
  }
  return build("UNKNOWN", false, message, status);
}

function build(
  type: ClassifiedErrorType,
  fallbackable: boolean,
  message: string,
  statusCode?: number
): ClassifiedError {
  return {
    type,
    retryable: false,
    fallbackable,
    originalMessage: message,
    statusCode,
  };
}
