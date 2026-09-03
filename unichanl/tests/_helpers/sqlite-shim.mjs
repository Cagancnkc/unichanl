// Vitest/Vite can't resolve `node:sqlite` directly (strips the `node:` prefix).
// This shim re-exports the built-in via createRequire so vite treats the import
// as an ordinary local module and the actual load happens through Node.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sqlite = require("node:sqlite");
export const { DatabaseSync, StatementSync, constants } = sqlite;
export default sqlite;
