import { describe, it, expect, beforeEach } from "vitest";
import { setTestDb } from "../src/database/database.js";
import {
  appendAssistantMessage,
  appendUserMessage,
  getOrCreateSession,
  loadHistory,
} from "../src/session/session-manager.js";
import { buildContext } from "../src/session/context-builder.js";
import { listMessages } from "../src/database/schema.js";

beforeEach(() => setTestDb());

describe("session-manager", () => {
  it("creates a new session when no id given", () => {
    const s = getOrCreateSession(null);
    expect(s.id).toMatch(/^sess_/);
  });

  it("returns the same session when id given twice", () => {
    const s1 = getOrCreateSession("sess_same");
    const s2 = getOrCreateSession("sess_same");
    expect(s1.id).toBe(s2.id);
    expect(s1.created_at).toBe(s2.created_at);
  });

  it("appends messages in order with sequential seq", () => {
    const s = getOrCreateSession("sess_seq");
    appendUserMessage(s.id, "one");
    appendAssistantMessage(s.id, "two", "mock", "m1");
    appendUserMessage(s.id, "three");
    const rows = listMessages(s.id, 100);
    expect(rows.map((r) => r.content)).toEqual(["one", "two", "three"]);
    expect(rows.map((r) => r.seq)).toEqual([0, 1, 2]);
  });

  it("loadHistory returns messages in insertion order", () => {
    const s = getOrCreateSession("sess_load");
    appendUserMessage(s.id, "a");
    appendAssistantMessage(s.id, "b", "mock", "m");
    const h = loadHistory(s.id);
    expect(h).toEqual([
      { role: "user", content: "a" },
      { role: "assistant", content: "b" },
    ]);
  });
});

describe("context-builder", () => {
  it("dedupes when incoming message equals history tail", () => {
    const s = getOrCreateSession("sess_dedupe");
    appendUserMessage(s.id, "hi");
    const built = buildContext(s.id, [{ role: "user", content: "hi" }]);
    expect(built).toHaveLength(1);
  });

  it("appends when incoming message is new", () => {
    const s = getOrCreateSession("sess_new");
    appendUserMessage(s.id, "first");
    const built = buildContext(s.id, [{ role: "user", content: "second" }]);
    expect(built).toHaveLength(2);
    expect(built[1].content).toBe("second");
  });
});
