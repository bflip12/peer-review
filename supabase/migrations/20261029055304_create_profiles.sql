-- One profile per account, created when the user picks a handle after first sign-in.
-- Email stays in auth.users; no table in public has an email column.

create type public.role as enum ('user', 'moderator', 'admin');

-- A temporary suspension is the next likely value.
create type public.account_status as enum ('active', 'banned');

create table public.profiles (
  id uuid default auth.uid()
    constraint profiles_pkey primary key
    constraint profiles_id_fkey references auth.users on delete cascade,
  handle text not null
    constraint profiles_handle_check check (handle ~ '^[A-Za-z0-9_.]{2,30}$'),
  display_name text
    constraint profiles_display_name_check check (
      display_name ~ '[^[:space:]]' and char_length(display_name) <= 50
    ),
  role public.role not null default 'user',
  account_status public.account_status not null default 'active',
  account_status_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'One per account, keyed by the auth user id. Holds no email address.';
comment on column public.profiles.handle is
  'Shown as @handle and used in profile URLs. Unique ignoring case.';
comment on column public.profiles.role is
  'Only admins change it. The app shows moderator as "Local".';
comment on column public.profiles.account_status_at is
  'When account_status last changed. Null until the first change.';

create unique index profiles_handle_key on public.profiles (lower(handle));

alter table public.profiles enable row level security;

-- Helpers the policies call. The API does not serve this schema.
create schema private;
grant usage on schema private to authenticated;

-- Whether the caller is an active admin. Security definer so a policy on profiles can
-- read the caller's own row without running into its own policies.
create function private.is_admin() returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin' and account_status = 'active'
    )
  $$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- Two select policies, one per role, because anon cannot run private.is_admin().
-- Banned profiles are shown only to admins and to their owner, so the app can tell a
-- banned user why they cannot post.
create policy "Everyone reads active profiles" on public.profiles
  for select to anon
  using (account_status = 'active');

create policy "Users read active profiles and their own, admins read all" on public.profiles
  for select to authenticated
  using (
    account_status = 'active'
    or id = (select auth.uid())
    or (select private.is_admin())
  );

create policy "Users create their own profile" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "Active users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and account_status = 'active')
  with check (id = (select auth.uid()) and account_status = 'active');

-- Users write only their handle and display name. The id comes from the default. Role and
-- status get an admin function in Milestone 6. No delete: deleting the account cascades.
grant select on public.profiles to anon, authenticated;
grant insert (handle, display_name) on public.profiles to authenticated;
grant update (handle, display_name) on public.profiles to authenticated;
