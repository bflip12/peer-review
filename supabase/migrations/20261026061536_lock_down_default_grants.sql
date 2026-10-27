-- New tables, sequences, and functions get no privileges for the API roles by default.
-- Each migration grants exactly what a table or function needs, next to its RLS policies.
--
-- Hosted projects created after 2026-05-30 already skip table grants for new tables, and
-- every project does from 2026-10-30. The local stack still grants everything, so this
-- makes local match hosted. Function EXECUTE is not covered by that change: Postgres grants
-- it to PUBLIC on every new function, and Supabase serves every function in `public` over
-- the API, so it is revoked here too.
--
-- Migrations run as `postgres`, so these change the defaults for objects it creates.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;

-- PUBLIC's EXECUTE comes from the global default, which a per-schema rule cannot remove.
alter default privileges for role postgres
  revoke execute on functions from public;
