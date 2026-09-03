import type { DatabaseSync } from "node:sqlite";
import { getDb } from "./database.js";
import type { ProviderName, Role } from "../types/index.js";

const DDL = `
CREATE TABLE IF NOT EXISTS sessions (
  id                TEXT PRIMARY KEY,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  current_provider  TEXT,
  current_model     TEXT,
  metadata_json     TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seq           INTEGER NOT NULL,
  role          TEXT NOT NULL,
  content       TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  UNIQUE(session_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, seq);

CREATE TABLE IF NOT EXISTS routing_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    TEXT NOT NULL,
  request_id    TEXT NOT NULL,
  from_provider TEXT,
  from_model    TEXT,
  to_provider   TEXT NOT NULL,
  to_model      TEXT NOT NULL,
  reason        TEXT,
  success       INTEGER NOT NULL,
  latency_ms    INTEGER,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_routing_events_request ON routing_events(request_id);
CREATE INDEX IF NOT EXISTS idx_routing_events_session ON routing_events(session_id);

CREATE TABLE IF NOT EXISTS provider_status (
  provider      TEXT PRIMARY KEY,
  last_success  INTEGER,
  last_failure  INTEGER,
  last_error    TEXT
);
`;

export function runMigrations(db: DatabaseSync): void {
  db.exec(DDL);
}

// ---- Session repository ----

export interface SessionRow {
  id: string;
  created_at: number;
  updated_at: number;
  current_provider: string | null;
  current_model: string | null;
  metadata_json: string | null;
}

export function insertSession(id: string, now: number = Date.now()): SessionRow {
  const db = getDb();
  db.prepare(
    `INSERT INTO sessions (id, created_at, updated_at) VALUES (?, ?, ?)`
  ).run(id, now, now);
  return {
    id,
    created_at: now,
    updated_at: now,
    current_provider: null,
    current_model: null,
    metadata_json: null,
  };
}

export function getSession(id: string): SessionRow | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM sessions WHERE id = ?`)
    .get(id) as unknown as SessionRow | undefined;
}

export function touchSession(
  id: string,
  provider?: ProviderName,
  model?: string
): void {
  const db = getDb();
  db.prepare(
    `UPDATE sessions SET updated_at = ?, current_provider = COALESCE(?, current_provider), current_model = COALESCE(?, current_model) WHERE id = ?`
  ).run(Date.now(), provider ?? null, model ?? null, id);
}

// ---- Messages repository ----

export interface MessageRow {
  id: number;
  session_id: string;
  seq: number;
  role: Role;
  content: string;
  created_at: number;
}

export function appendMessage(
  sessionId: string,
  role: Role,
  content: string
): MessageRow {
  const db = getDb();
  const nextSeqRow = db
    .prepare(
      `SELECT COALESCE(MAX(seq), -1) + 1 AS next_seq FROM messages WHERE session_id = ?`
    )
    .get(sessionId) as unknown as { next_seq: number };
  const now = Date.now();
  const info = db
    .prepare(
      `INSERT INTO messages (session_id, seq, role, content, created_at) VALUES (?, ?, ?, ?, ?)`
    )
    .run(sessionId, nextSeqRow.next_seq, role, content, now);
  return {
    id: Number(info.lastInsertRowid),
    session_id: sessionId,
    seq: nextSeqRow.next_seq,
    role,
    content,
    created_at: now,
  };
}

export function listMessages(sessionId: string, limit = 40): MessageRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM messages WHERE session_id = ? ORDER BY seq DESC LIMIT ?`
    )
    .all(sessionId, limit) as unknown as MessageRow[];
  return rows.reverse();
}

// ---- Routing events ----

export interface RoutingEventInput {
  sessionId: string;
  requestId: string;
  fromProvider: string | null;
  fromModel: string | null;
  toProvider: string;
  toModel: string;
  reason: string;
  success: boolean;
  latencyMs: number;
}

export function recordRoutingEvent(ev: RoutingEventInput): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO routing_events
     (session_id, request_id, from_provider, from_model, to_provider, to_model, reason, success, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    ev.sessionId,
    ev.requestId,
    ev.fromProvider,
    ev.fromModel,
    ev.toProvider,
    ev.toModel,
    ev.reason,
    ev.success ? 1 : 0,
    ev.latencyMs,
    Date.now()
  );
}

export function listRoutingEvents(requestId: string): unknown[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM routing_events WHERE request_id = ? ORDER BY id ASC`
    )
    .all(requestId);
}
