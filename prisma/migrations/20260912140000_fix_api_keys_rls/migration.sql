-- Fix auth middleware deadlock: RLS was blocking api_keys SELECT before user_id is known.
-- Problem 1: app_current_user_id() EXECUTE permission not granted to unichanl_app role.
-- Problem 2: api_keys_owner policy required app.user_id to be set for SELECT, but auth
--           must SELECT api_keys to discover the user_id in the first place.
--
-- Solution:
-- 1. Grant EXECUTE on app_current_user_id() to unichanl_app
-- 2. Split api_keys RLS into per-operation policies:
--    - SELECT: USING (true) — unauthenticated lookups OK for auth validation
--    - INSERT/UPDATE/DELETE: restricted by user_id

GRANT EXECUTE ON FUNCTION app_current_user_id() TO unichanl_app;

DROP POLICY IF EXISTS api_keys_owner ON "api_keys";

CREATE POLICY api_keys_select ON "api_keys"
  FOR SELECT USING (true);

CREATE POLICY api_keys_insert ON "api_keys"
  FOR INSERT WITH CHECK ("userId" = app_current_user_id());

CREATE POLICY api_keys_update ON "api_keys"
  FOR UPDATE
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

CREATE POLICY api_keys_delete ON "api_keys"
  FOR DELETE USING ("userId" = app_current_user_id());
