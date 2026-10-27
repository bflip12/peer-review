-- The hosted project's "automatic RLS" option installs public.rls_auto_enable(), the event
-- trigger function that enables RLS on new tables. It was created before the lock-down
-- migration, with EXECUTE granted to PUBLIC, anon, and authenticated, so the API roles
-- could call it. Only the event trigger needs it, and Postgres checks EXECUTE when an
-- event trigger is created, not when it fires, so revoking it keeps the trigger working.
--
-- The local stack has no such function, so this does nothing there. Any signature is
-- covered, since the function's arguments are Supabase's to choose.
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname = 'rls_auto_enable'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
  end loop;
end $$;
