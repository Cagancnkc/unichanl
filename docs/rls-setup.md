# RLS Setup — Manual Steps

Run these in the Supabase SQL editor **once** before applying migration
`20260912120000_enable_rls`. Uses `postgres` (superuser) role.

## 1. Create the app role (no BYPASSRLS)

```sql
CREATE ROLE unichanl_app LOGIN PASSWORD '<STRONG_RANDOM_PASSWORD>' NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO unichanl_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO unichanl_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO unichanl_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO unichanl_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO unichanl_app;
```

Lock down `_prisma_migrations` for the app role:

```sql
REVOKE ALL ON "_prisma_migrations" FROM unichanl_app;
GRANT SELECT ON "_prisma_migrations" TO unichanl_app;
```

## 2. Point runtime `DATABASE_URL` to the new role

```
DATABASE_URL="postgresql://unichanl_app:<PASSWORD>@<host>:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:<superuser>@<host>:5432/postgres"
```

`DIRECT_URL` (superuser) is used only by `prisma migrate`.

## 3. Apply the migration

```bash
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
```

## 4. Verification

```sql
SET ROLE unichanl_app;
SET LOCAL "app.user_id" = 'some-real-user-id';
SELECT count(*) FROM api_keys;             -- only that user's rows
RESET ROLE;
```

## 5. Supabase dashboard checklist

- Auth → **Leaked Password Protection**: ON
- Postgres → apply latest security patch
- Re-run Advisor: RLS uyarısı 0 olmalı
