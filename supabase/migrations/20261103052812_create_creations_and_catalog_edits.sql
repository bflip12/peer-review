-- Who created each catalog entry, and every edit to one (ADR 0009, ADR 0010, ADR 0011).
-- Kept in their own tables because row level security hides rows, not columns: a
-- created_by column on a lineup slot would show anyone that a user was at a night they
-- logged privately. Only database functions write either table.
--
-- The tables these point at do not exist yet. Each one's migration adds its foreign key
-- on creations: venues, artists, and collectives in Milestone 2, events and lineup slots
-- in Milestone 3. Nothing writes those columns before then.

-- lineup_slot is for slot changes in catalog_edits (ADR 0013), never a merge type.
create type public.catalog_type as enum ('venue', 'artist', 'collective', 'event', 'lineup_slot');

-- Whether the caller is an active moderator or admin. Security definer so policies can
-- read the caller's profile without running into its own policies.
create function private.is_moderator() returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role in ('moderator', 'admin')
        and account_status = 'active'
    )
  $$;

revoke execute on function private.is_moderator() from public, anon;
grant execute on function private.is_moderator() to authenticated;

create table public.creations (
  id uuid default gen_random_uuid() constraint creations_pkey primary key,
  created_by uuid not null default auth.uid()
    constraint creations_created_by_fkey references public.profiles on delete cascade,
  event_id uuid constraint creations_event_id_key unique,
  lineup_slot_id uuid constraint creations_lineup_slot_id_key unique,
  venue_id uuid constraint creations_venue_id_key unique,
  artist_id uuid constraint creations_artist_id_key unique,
  collective_id uuid constraint creations_collective_id_key unique,
  created_at timestamptz not null default now(),
  constraint creations_entity_check check (
    num_nonnulls(event_id, lineup_slot_id, venue_id, artist_id, collective_id) = 1
  )
);

comment on table public.creations is
  'Who created each event, lineup slot, venue, DJ, and collective. One row per entry. Read by the creator, moderators, and admins.';
comment on column public.creations.created_by is
  'The user who created the entry. Their rows count toward the daily caps.';

create index creations_created_by_created_at_idx
  on public.creations (created_by, created_at desc);

-- Daily caps (ADR 0011). Counts the user's rows of the same kind from the last 24 hours
-- and refuses the insert at the cap. Lineup slots have no cap, and moderators and admins
-- are exempt. A per-user advisory lock makes a second insert at the same moment wait for
-- the first to commit, then count it. The refusal uses its own SQLSTATE, PR001, with the
-- kind in the detail, so the app can show the cap message without reading the text.
create function private.check_creation_cap() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
    declare
      kind public.catalog_type;
      cap integer;
      recent integer;
    begin
      kind := case
        when new.venue_id is not null then 'venue'
        when new.artist_id is not null then 'artist'
        when new.collective_id is not null then 'collective'
        when new.event_id is not null then 'event'
        else 'lineup_slot'
      end;
      cap := case kind
        when 'venue' then 10
        when 'collective' then 10
        when 'artist' then 50
        when 'event' then 20
      end;

      if cap is null then
        return new;
      end if;

      if exists (
        select 1 from public.profiles
        where id = new.created_by
          and role in ('moderator', 'admin')
          and account_status = 'active'
      ) then
        return new;
      end if;

      perform pg_advisory_xact_lock(hashtextextended('creations:' || new.created_by::text, 0));

      select count(*) into recent
      from public.creations c
      where c.created_by = new.created_by
        and c.created_at > now() - interval '24 hours'
        and case kind
          when 'venue' then c.venue_id is not null
          when 'artist' then c.artist_id is not null
          when 'collective' then c.collective_id is not null
          when 'event' then c.event_id is not null
        end;

      if recent >= cap then
        raise exception 'creation cap reached: % % in 24 hours', cap, kind
          using errcode = 'PR001', detail = kind::text;
      end if;

      return new;
    end
  $$;

revoke execute on function private.check_creation_cap() from public, anon, authenticated;

create trigger creations_check_cap
  before insert on public.creations
  for each row execute function private.check_creation_cap();

alter table public.creations enable row level security;

create policy "Users read their own creations, moderators and admins read all"
  on public.creations
  for select to authenticated
  using (created_by = (select auth.uid()) or (select private.is_moderator()));

grant select on public.creations to authenticated;

create table public.catalog_edits (
  id uuid default gen_random_uuid() constraint catalog_edits_pkey primary key,
  entity_type public.catalog_type not null,
  entity_id uuid not null,
  field text not null constraint catalog_edits_field_check check (field ~ '^[a-z][a-z0-9_]*$'),
  old_value jsonb,
  new_value jsonb,
  edited_by uuid default auth.uid()
    constraint catalog_edits_edited_by_fkey references public.profiles on delete set null,
  reverts_edit_id uuid constraint catalog_edits_reverts_edit_id_fkey
    references public.catalog_edits,
  created_at timestamptz not null default now(),
  constraint catalog_edits_value_check check (old_value is distinct from new_value)
);

comment on table public.catalog_edits is
  'Each edit to a venue, DJ, collective, event, or lineup slot, from the first one. Read by moderators and admins.';
comment on column public.catalog_edits.entity_id is
  'The edited row. No foreign key, since it can point at any of five tables.';
comment on column public.catalog_edits.field is
  'name, city_id, venue_id, a link platform, a sound tag, a co-host, and for slots removed or artists.';
comment on column public.catalog_edits.old_value is 'Null when the field was empty.';
comment on column public.catalog_edits.new_value is 'Null when the edit cleared the field.';
comment on column public.catalog_edits.edited_by is 'Null once the editor deletes their account.';
comment on column public.catalog_edits.reverts_edit_id is 'Set when this edit is a revert of that one.';

create index catalog_edits_entity_type_entity_id_created_at_idx
  on public.catalog_edits (entity_type, entity_id, created_at desc);
create index catalog_edits_edited_by_created_at_idx
  on public.catalog_edits (edited_by, created_at desc);
create index catalog_edits_reverts_edit_id_idx on public.catalog_edits (reverts_edit_id);

alter table public.catalog_edits enable row level security;

create policy "Moderators and admins read catalog edits" on public.catalog_edits
  for select to authenticated
  using ((select private.is_moderator()));

grant select on public.catalog_edits to authenticated;
