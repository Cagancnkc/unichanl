-- Enable Row Level Security for all tenant tables and add policies keyed to
-- the session GUC `app.user_id`. The application must set this GUC per request
-- inside a transaction using `SELECT set_config('app.user_id', $1, true)`.
--
-- The `unichanl_app` role MUST NOT have BYPASSRLS. See docs/rls-setup.md for
-- the manual role creation + grant sequence to run in the Supabase SQL editor.

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')
$$;

-- === User-scoped tables ===

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_self ON "users";
CREATE POLICY users_self ON "users"
  USING ("id" = app_current_user_id())
  WITH CHECK ("id" = app_current_user_id());

ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS api_keys_owner ON "api_keys";
CREATE POLICY api_keys_owner ON "api_keys"
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sessions_owner ON "sessions";
CREATE POLICY sessions_owner ON "sessions"
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_owner ON "messages";
CREATE POLICY messages_owner ON "messages"
  USING (EXISTS (
    SELECT 1 FROM "sessions" s
    WHERE s."id" = "messages"."sessionId"
      AND s."userId" = app_current_user_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "sessions" s
    WHERE s."id" = "messages"."sessionId"
      AND s."userId" = app_current_user_id()
  ));

ALTER TABLE "usage_records" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS usage_records_owner ON "usage_records";
CREATE POLICY usage_records_owner ON "usage_records"
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

ALTER TABLE "routing_logs" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS routing_logs_owner ON "routing_logs";
CREATE POLICY routing_logs_owner ON "routing_logs"
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS credit_transactions_owner ON "credit_transactions";
CREATE POLICY credit_transactions_owner ON "credit_transactions"
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscriptions_owner ON "subscriptions";
CREATE POLICY subscriptions_owner ON "subscriptions"
  USING ("userId" = app_current_user_id())
  WITH CHECK ("userId" = app_current_user_id());

ALTER TABLE "credit_balances" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS credit_balances_read ON "credit_balances";
CREATE POLICY credit_balances_read ON "credit_balances"
  FOR SELECT USING ("userId" = app_current_user_id());

-- === Reference tables (public read; writes via service_role) ===

ALTER TABLE "providers" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS providers_public_read ON "providers";
CREATE POLICY providers_public_read ON "providers" FOR SELECT USING (true);

ALTER TABLE "models" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS models_public_read ON "models";
CREATE POLICY models_public_read ON "models" FOR SELECT USING (true);

ALTER TABLE "provider_health" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS provider_health_public_read ON "provider_health";
CREATE POLICY provider_health_public_read ON "provider_health" FOR SELECT USING (true);

ALTER TABLE "routing_rules" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS routing_rules_public_read ON "routing_rules";
CREATE POLICY routing_rules_public_read ON "routing_rules" FOR SELECT USING (true);

REVOKE ALL ON "_prisma_migrations" FROM PUBLIC;
