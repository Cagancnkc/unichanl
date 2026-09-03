import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { ensureUnichanlDir, unichanlDir } from "../config/config-manager.js";
import { runMigrations } from "./schema.js";
import { logger } from "../utils/logger.js";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;
  ensureUnichanlDir();
  const path = join(unichanlDir(), "unichanl.db");
  dbInstance = new DatabaseSync(path);
  dbInstance.exec("PRAGMA journal_mode = WAL");
  dbInstance.exec("PRAGMA foreign_keys = ON");
  runMigrations(dbInstance);
  logger.info({ path }, "SQLite database ready");
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/** Test helper: use an in-memory DB for isolated tests. */
export function setTestDb(): DatabaseSync {
  if (dbInstance) dbInstance.close();
  dbInstance = new DatabaseSync(":memory:");
  dbInstance.exec("PRAGMA foreign_keys = ON");
  runMigrations(dbInstance);
  return dbInstance;
}
