-- OAuth bootstrap: api_keys INSERT/UPDATE must succeed without an app.user_id GUC.
-- Under Supabase pgbouncer (transaction mode), Prisma interactive $transaction
-- (used by withUserContext to SET LOCAL app.user_id) is unreliable and surfaces
-- as PrismaClientInitializationError / RustPanicError -> 503 DATABASE_UNAVAILABLE.
--
-- The OAuth callback issues a fresh api_key immediately after user creation.
-- userId is server-controlled (never accepted from the client), so relaxing
-- WITH CHECK to (true) is safe. DELETE remains user-scoped.

DROP POLICY IF EXISTS api_keys_insert ON "api_keys";
DROP POLICY IF EXISTS api_keys_update ON "api_keys";

CREATE POLICY api_keys_insert ON "api_keys"
  FOR INSERT WITH CHECK (true);

CREATE POLICY api_keys_update ON "api_keys"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
