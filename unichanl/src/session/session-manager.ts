import { nanoid } from "nanoid";
import {
  appendMessage,
  getSession,
  insertSession,
  listMessages,
  touchSession,
  type MessageRow,
  type SessionRow,
} from "../database/schema.js";
import type { InternalMessage, ProviderName, Role } from "../types/index.js";

export function newSessionId(): string {
  return `sess_${nanoid(16)}`;
}

export function getOrCreateSession(id?: string | null): SessionRow {
  if (id) {
    const existing = getSession(id);
    if (existing) return existing;
    return insertSession(id);
  }
  return insertSession(newSessionId());
}

export function appendUserMessage(
  sessionId: string,
  content: string
): MessageRow {
  return appendMessage(sessionId, "user", content);
}

export function appendAssistantMessage(
  sessionId: string,
  content: string,
  provider: ProviderName,
  model: string
): MessageRow {
  const row = appendMessage(sessionId, "assistant", content);
  touchSession(sessionId, provider, model);
  return row;
}

export function appendMessages(
  sessionId: string,
  messages: InternalMessage[]
): void {
  for (const m of messages) {
    appendMessage(sessionId, m.role as Role, m.content);
  }
}

export function loadHistory(
  sessionId: string,
  limit = 40
): InternalMessage[] {
  return listMessages(sessionId, limit).map((r) => ({
    role: r.role,
    content: r.content,
  }));
}
