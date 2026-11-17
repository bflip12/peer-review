-- Users add sound system brands to the shared list (ADR 0026). Until now the list was
-- seven seeded rows. A brand is added only through create_sound_system, which returns the
-- existing brand when the name matches one already listed (ignoring case, accents, spaces,
-- and punctuation) and otherwise writes a creations row, so a daily cap of 10 applies.
-- search_sound_systems serves the venue form's search. The seeded brands keep their
-- readable IDs and sort order; user-added brands get a generated ID and no sort order.

-- A brand name as the duplicate check compares it: lowercase, without accents, spaces, or
-- punctuation. "Funktion One", "funktion-one", and "Funktion-One" all fold to
-- "funktionone". Immutable through fold_name, for the unique index below.
create function private.fold_brand(name text) returns text
  language sql immutable parallel safe set search_path = ''
  as $$
    select regexp_replace(private.fold_name(name), '[[:space:][:punct:]]+', '', 'g')
  $$;

revoke execute on function private.fold_brand(text) from public, anon;
grant execute on function private.fold_brand(text) to authenticated;

alter table public.sound_systems
  alter column sort_order drop not null,
  add constraint sound_systems_name_length_check
    check (char_length(name) <= 50 and name = btrim(name)),
  add constraint sound_systems_name_folded_check check (private.fold_brand(name) <> '');

comment on table public.sound_systems is
  'Sound system brands that venues are tagged with. Seeded, and extended by users through create_sound_system (ADR 0026).';
comment on column public.sound_systems.id is
  'Readable for the seeded brands (funktion_one). b_ and a short ID for user-added ones.';
comment on column public.sound_systems.sort_order is
  'Order of the seeded brands, lowest first. Null for user-added brands, which sort by name after them.';

create unique index sound_systems_name_folded_key on public.sound_systems
  (private.fold_brand(name));
create index sound_systems_name_trgm_idx on public.sound_systems
  using gin (private.fold_name(name) extensions.gin_trgm_ops);

-- creations records who added each brand, for the daily cap and the creator's own view.
alter table public.creations
  add column sound_system_id text
    constraint creations_sound_system_id_key unique
    constraint creations_sound_system_id_fkey references public.sound_systems on delete cascade,
  drop constraint creations_entity_check,
  add constraint creations_entity_check check (
    num_nonnulls(event_id, lineup_slot_id, venue_id, artist_id, collective_id, sound_system_id) = 1
  );

-- The daily caps from create_creations_and_catalog_edits, with sound system brands added
-- at 10 a day (ADR 0026). Everything else is unchanged.
create or replace function private.check_creation_cap() returns trigger
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
        when new.sound_system_id is not null then 'sound_system'
        else 'lineup_slot'
      end;
      cap := case kind
        when 'venue' then 10
        when 'collective' then 10
        when 'artist' then 50
        when 'event' then 20
        when 'sound_system' then 10
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
          when 'sound_system' then c.sound_system_id is not null
        end;

      if recent >= cap then
        raise exception 'creation cap reached: % % in 24 hours', cap, kind
          using errcode = 'PR001', detail = kind::text;
      end if;

      return new;
    end
  $$;

-- Adds a brand to the shared list as the caller, or returns the listed brand whose name
-- folds to the same text, so "funktion one" returns Funktion-One and writes nothing. The
-- name is trimmed. Refused for a signed-out caller or one with no active profile. The
-- daily cap refuses with PR001 and "sound_system" in the detail. Security definer,
-- because only database functions write sound_systems and creations.
create function public.create_sound_system(brand_name text)
  returns table (id text, name text)
  language plpgsql volatile security definer set search_path = ''
  as $$
    declare
      caller uuid := (select auth.uid());
      trimmed text := btrim(coalesce(brand_name, ''));
      brand public.sound_systems;
      attempt integer := 0;
      failed_constraint text;
    begin
      if caller is null or not exists (
        select 1 from public.profiles p where p.id = caller and p.account_status = 'active'
      ) then
        raise exception 'only an active user can add a sound system' using errcode = '42501';
      end if;

      select * into brand from public.sound_systems s
      where private.fold_brand(s.name) = private.fold_brand(trimmed);
      if found then
        return query select brand.id, brand.name;
        return;
      end if;

      -- An ID collision is retried with a new ID. Another user adding the same brand at
      -- the same moment trips the folded-name index: their brand is returned instead.
      loop
        attempt := attempt + 1;
        begin
          insert into public.sound_systems (id, name)
          values ('b_' || private.new_short_id(), trimmed)
          returning * into brand;
          exit;
        exception when unique_violation then
          get stacked diagnostics failed_constraint = constraint_name;
          if failed_constraint = 'sound_systems_name_folded_key' then
            select * into brand from public.sound_systems s
            where private.fold_brand(s.name) = private.fold_brand(trimmed);
            return query select brand.id, brand.name;
            return;
          end if;
          if failed_constraint <> 'sound_systems_pkey' or attempt >= 5 then
            raise;
          end if;
        end;
      end loop;

      insert into public.creations (created_by, sound_system_id) values (caller, brand.id);

      return query select brand.id, brand.name;
    end
  $$;

revoke execute on function public.create_sound_system(text) from public, anon;
grant execute on function public.create_sound_system(text) to authenticated;

-- Brands whose name is like the query, for the venue form's search. Ignores case and
-- accents. Counts a name containing the query, one that matches it without spaces and
-- punctuation, or one with a trigram similarity of 0.3 or more. Best first: the same name
-- ignoring spaces and punctuation, then names starting with the query, then the closest,
-- then the seeded order and the name. Nothing for an empty query. At most 20 rows.
create function public.search_sound_systems(query text, max_results integer default 8)
  returns table (id text, name text)
  language sql stable security invoker set search_path = ''
  as $$
    with term as (
      select
        private.fold_name(btrim(coalesce(query, ''))) as folded,
        private.fold_brand(btrim(coalesce(query, ''))) as brand
    )
    select s.id, s.name
    from public.sound_systems s, term t
    where t.brand <> ''
      and (
        strpos(private.fold_name(s.name), t.folded) > 0
        or strpos(private.fold_brand(s.name), t.brand) > 0
        or extensions.similarity(private.fold_name(s.name), t.folded) >= 0.3
      )
    order by
      private.fold_brand(s.name) = t.brand desc,
      private.fold_brand(s.name) like t.brand || '%' desc,
      extensions.similarity(private.fold_name(s.name), t.folded) desc,
      s.sort_order nulls last,
      s.name
    limit least(greatest(coalesce(max_results, 8), 1), 20)
  $$;

revoke execute on function public.search_sound_systems(text, integer) from public, anon;
grant execute on function public.search_sound_systems(text, integer) to authenticated;
