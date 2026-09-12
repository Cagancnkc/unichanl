-- OAuth bootstrap: users table must be readable/insertable before any user id exists.
-- The Google callback looks up by email, then creates the user, then issues an api_key.
-- With the strict users_self policy, both SELECT-by-email and INSERT fail (app.user_id NULL).
--
-- Split into per-operation policies matching the api_keys pattern:
--   SELECT / INSERT: USING/WITH CHECK (true) — needed for OAuth bootstrap.
--   UPDATE / DELETE: scoped to the current user via app.user_id GUC.
--
-- Email uniqueness (existing unique constraint) prevents duplicate-account abuse.

DROP POLICY IF EXISTS users_self ON "users";

CREATE POLICY users_select ON "users"
  FOR SELECT USING (true);

CREATE POLICY users_insert ON "users"
  FOR INSERT WITH CHECK (true);

CREATE POLICY users_update ON "users"
  FOR UPDATE
  USING ("id" = app_current_user_id())
  WITH CHECK ("id" = app_current_user_id());

CREATE POLICY users_delete ON "users"
  FOR DELETE USING ("id" = app_current_user_id());
