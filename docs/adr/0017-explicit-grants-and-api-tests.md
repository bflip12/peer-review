# 0017: Explicit grants, and database tests through the API

- Date: 2026-10-26
- Status: Accepted

## Context
Supabase serves every table and function in `public` over its API. Checked on the local
stack (Supabase CLI 2.121.0, Postgres 17.11): a new table was readable by `anon` with row
level security off, and a new function was callable by `anon`, because of default
privileges and Postgres granting `EXECUTE` to `PUBLIC`. Hosted projects created after
2026-05-30 no longer grant new tables to the API, and every project stops on 2026-10-30,
but function `EXECUTE` is unchanged, and the local stack still grants both. A migration
that forgets a revoke or a policy would expose data.

The task also needed a way to test RLS policies. RLS rules are only as good as what a
client can reach, and a client reaches them through the API.

## Options considered
- **Keep Supabase's defaults and revoke per object.** Matches most tutorials, but every new
  table or function is exposed until someone remembers to lock it, and local differs from
  hosted.
- **Remove the defaults in the first migration, and grant per object.** Nothing is
  reachable until its migration grants it. Local and hosted behave the same. Each
  migration carries a few more lines.
- **Test RLS with pgTAP inside the database.** Fast SQL tests with role switching, but they
  skip the API layer (PostgREST, grants as the API sees them), which is where the exposure
  happens.
- **Test RLS through the API with `supabase-js`.** Tests sign in real test users and call
  the API as a visitor and as a user, the same path an attacker would use. Slower, and
  they need the local stack running.

## Decision
The first migration removes the API roles' default privileges on new tables, sequences,
and functions in `public`, and `PUBLIC`'s default `EXECUTE`. Every migration grants what
it needs next to its policies (`.claude/rules/supabase.md`).

Database tests run through the API with `supabase-js` and Vitest (`npm run test:db`), in
CI on every PR. Two guard tests cover the whole schema: every table in `public` has RLS,
and only functions listed as exposed are callable by `anon` or `authenticated`.

The Supabase project also has automatic RLS turned on, which enables RLS on new tables in
`public` on the hosted project. The guard test is what covers both local and hosted.

## Consequences
- A missing grant shows up as `42501` in a test or the app, never as data exposed.
- Adding an exposed function means editing the test's allowlist, a deliberate step a
  reviewer sees.
- CI starts the local stack on every PR, about 2 minutes more per run.
- Revisit if Supabase changes its default grants again: the lock-down migration stays
  harmless either way, since revoking a privilege that was never granted does nothing.
