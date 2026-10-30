-- Lets a signed-in user delete their own account (SPEC "Privacy"). Deleting the auth user
-- cascades to auth.sessions, auth.refresh_tokens, and auth.identities, and to
-- public.profiles, through which later tables cascade. The app never holds the service
-- role key (.claude/rules/security.md), so this runs as the function owner instead.

create function public.delete_my_account() returns void
  language plpgsql security definer set search_path = ''
  as $$
    begin
      if (select auth.uid()) is null then
        raise exception 'delete_my_account: no signed-in user'
          using errcode = '42501';
      end if;
      delete from auth.users where id = (select auth.uid());
    end
  $$;

comment on function public.delete_my_account() is
  'Deletes the caller''s auth user, which cascades to their profile and sessions.';

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
