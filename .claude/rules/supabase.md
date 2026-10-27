---
paths:
  - "supabase/**"
---

# Supabase

Applies to migrations and database tests. Schema design rules are in
`.claude/rules/database.md`.

## Migrations

- Create one with `npx supabase migration new <name>`. Never edit a migration that has
  been merged to `main`; write a new one.
- `npm run db:reset` reapplies every migration to the local stack. Run it, then
  `npm run test:db`, before committing a migration.
- After a schema change, run `npm run db:types` and commit
  `src/lib/supabase/database.types.ts`. CI fails when the committed file differs from a
  fresh one.

## Grants and RLS

New tables, sequences, and functions in `public` get no privileges for `anon`,
`authenticated`, or `service_role` (migration `lock_down_default_grants`). So every
migration that adds a table:
- enables row level security on it,
- writes its policies,
- grants each role exactly what those policies serve, in the same migration. Column writes
  follow "Who writes which column" in `database.md`.

A missing grant fails with `42501` before RLS runs. That is the expected result for a
role the table is not meant for.

## Functions

- Internal helper functions live in a schema the API does not expose (not `public` or
  `graphql_public`).
- Functions the app calls are `security invoker` unless they must bypass RLS.
- A `security definer` function sets `search_path = ''`, checks `auth.uid()` and the
  caller's role itself, and has `EXECUTE` revoked from `PUBLIC` and `anon`. Postgres grants
  `EXECUTE` to `PUBLIC` by default, and Supabase serves every function in `public` over its
  API. The lock-down migration removes that default for functions `postgres` creates, and
  the revoke stays in the function's migration anyway.
- A function the API may call is granted explicitly and added to `EXPOSED_FUNCTIONS` in
  `supabase/tests/schema.test.ts`, which fails on any callable function not listed.

## Tests

- Database tests live in `supabase/tests/`. Tests of a feature's data functions sit
  beside the function in `src/` as `*.db.test.ts`. Both run with `npm run test:db`
  against the local stack. They go through the API with `supabase-js`, as a signed-out
  visitor (`createAnonClient`) and as signed-in test users (`createTestUser`), because the
  API is what a client can reach.
- Every RLS policy, protected column, and exposed function gets a test as `anon` and as a
  plain user, plus the other roles it treats differently.
- Use `runSql` (as `postgres`) only for setup, cleanup, and reading the catalog. Each test
  user is new; delete it in `afterAll`.

## Deploys

A merge to `main` deploys the app on Vercel and applies migrations through
`.github/workflows/migrate.yml` at the same time, and either can finish first. So every
migration works with the app that is live:
- Add before you use: add a table or column in one PR, start using it in a later one. In
  the same PR, the app can go live before the migration runs.
- Remove after you stop using: stop reading a column in one PR, drop it in a later one.
- Rename in steps: add the new column, copy the data, switch the code, then drop the old
  one later.
