import type { InternalMessage } from "../types/index.js";
import { loadHistory } from "./session-manager.js";

/**
 * Build the message list to send to a provider.
 *
 * Strategy (MVP): load up to `limit` most-recent stored messages from the
 * session, then append any messages from the current request that aren't
 * already the tail of history. This lets a client either:
 *   - send only the newest turn (we hydrate from DB), OR
 *   - send the full transcript (we still hydrate but dedupe the tail).
 *
 * No summarization yet — see plan for post-MVP.
 */
export function buildContext(
  sessionId: string,
  currentRequestMessages: InternalMessage[],
  limit = 40
): InternalMessage[] {
  const history = loadHistory(sessionId, limit);

  if (currentRequestMessages.length === 0) return history;

  const combined = [...history];
  const lastHistory = history[history.length - 1];
  const firstIncoming = currentRequestMessages[0];

  const alreadyEndsWithIncoming =
    lastHistory != null &&
    firstIncoming != null &&
    lastHistory.role === firstIncoming.role &&
    lastHistory.content === firstIncoming.content;

  const toAppend = alreadyEndsWithIncoming
    ? currentRequestMessages.slice(1)
    : currentRequestMessages;

  combined.push(...toAppend);
  return combined;
}
