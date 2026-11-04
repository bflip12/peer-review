-- Venues, their sound system tags, and links (ADR 0009, ADR 0010, ADR 0011). A venue is
-- created only through create_venue, which also writes its creations row, so the daily cap
-- applies. Its creator edits the name, city, links, and tags until another user picks it
-- (used_by_others_at, set from Milestone 3); moderators and admins edit it at any time.
-- Every edit after the one that created the venue writes a catalog_edits row.
--
-- links also holds DJ and collective links. Their artist_id and collective_id columns get
-- foreign keys and policies in the migrations that create artists and collectives.

-- An 8-character ID for URLs, from digits and lowercase letters without 0, 1, i, l, and
-- o, which read alike. Not secret, so random() is enough. A collision is refused by the
-- table's unique constraint, and the create function retries.
create function private.new_short_id() returns text
  language sql volatile set search_path = ''
  as $$
    select string_agg(
      substr('23456789abcdefghjkmnpqrstuvwxyz', 1 + floor(random() * 31)::integer, 1),
      ''
    )
    from generate_series(1, 8)
  $$;

revoke execute on function private.new_short_id() from public, anon, authenticated;

-- Sets updated_at on every update. Shared by the catalog tables.
create function private.set_updated_at() returns trigger
  language plpgsql set search_path = ''
  as $$
    begin
      new.updated_at := now();
      return new;
    end
  $$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create table public.venues (
  id uuid default gen_random_uuid() constraint venues_pkey primary key,
  short_id text not null default private.new_short_id()
    constraint venues_short_id_key unique
    constraint venues_short_id_check check (short_id ~ '^[2-9a-hjkmnp-z]{8}$'),
  name text not null
    constraint venues_name_check check (name ~ '[^[:space:]]' and char_length(name) <= 100),
  city_id integer not null constraint venues_city_id_fkey references public.cities,
  used_by_others_at timestamptz,
  merged_into_id uuid constraint venues_merged_into_id_fkey references public.venues,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venues_id_city_id_key unique (id, city_id)
);

comment on table public.venues is
  'Clubs and other places where nights happen. Created through create_venue. No address or location (ADR 0003).';
comment on column public.venues.short_id is 'The venue''s ID in URLs.';
comment on column public.venues.used_by_others_at is
  'When a user other than the creator first picked the venue. Ends the creator''s edit right.';
comment on column public.venues.merged_into_id is 'Set when a merge folds this venue into that one (Milestone 10).';
comment on column public.venues.hidden_at is 'Set by admins. Hidden venues are left out of every read.';

create index venues_city_id_idx on public.venues (city_id);
create index venues_name_trgm_idx on public.venues
  using gin (private.fold_name(name) extensions.gin_trgm_ops);

create trigger venues_set_updated_at
  before update on public.venues
  for each row execute function private.set_updated_at();

alter table public.creations
  add constraint creations_venue_id_fkey
  foreign key (venue_id) references public.venues on delete cascade;

create table public.venue_sound_systems (
  venue_id uuid not null
    constraint venue_sound_systems_venue_id_fkey references public.venues on delete cascade,
  sound_system_id text not null
    constraint venue_sound_systems_sound_system_id_fkey references public.sound_systems,
  constraint venue_sound_systems_pkey primary key (venue_id, sound_system_id)
);

comment on table public.venue_sound_systems is 'The sound systems a venue is tagged with.';

create table public.links (
  id uuid default gen_random_uuid() constraint links_pkey primary key,
  venue_id uuid constraint links_venue_id_fkey references public.venues on delete cascade,
  artist_id uuid,
  collective_id uuid,
  platform_id text not null constraint links_platform_id_fkey references public.link_platforms,
  url text not null
    constraint links_url_check check (url ~ '^https?://[^[:space:]]+$' and char_length(url) <= 500),
  constraint links_owner_check check (num_nonnulls(venue_id, artist_id, collective_id) = 1),
  constraint links_venue_id_platform_id_key unique (venue_id, platform_id),
  constraint links_artist_id_platform_id_key unique (artist_id, platform_id),
  constraint links_collective_id_platform_id_key unique (collective_id, platform_id)
);

comment on table public.links is
  'Links on a venue, DJ, or collective, one per platform each. The host must be one the platform accepts.';
comment on column public.links.url is 'An http or https URL. Its host is checked against link_platforms.allowed_hosts.';

-- Refuses a link whose platform is not offered for its kind of entry, or whose host is not
-- in the platform's allowed_hosts. An empty list accepts any host. "*.bandcamp.com"
-- matches any subdomain, but not bandcamp.com itself. A URL with a user name before the
-- host ("https://instagram.com@example.com") is refused, since its real host is after
-- the "@". The refusal uses its own SQLSTATE, PR002, with the platform ID as its detail,
-- so the form can show its message without reading the text.
create function private.check_link_host() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
    declare
      platform public.link_platforms;
      authority text;
      host text;
    begin
      select * into platform from public.link_platforms where id = new.platform_id;

      if (new.venue_id is not null and not platform.is_for_venues)
        or (new.artist_id is not null and not platform.is_for_artists)
        or (new.collective_id is not null and not platform.is_for_collectives)
      then
        raise exception 'link platform % is not offered here', new.platform_id
          using errcode = 'PR002', detail = new.platform_id;
      end if;

      authority := substring(new.url from '^https?://([^/?#]*)');
      host := rtrim(lower(regexp_replace(authority, ':[0-9]*$', '')), '.');

      if authority is null or authority like '%@%'
        or host !~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'
        or (
          cardinality(platform.allowed_hosts) > 0
          and not exists (
            select 1 from unnest(platform.allowed_hosts) allowed
            where host = allowed
              or (allowed like '*.%' and host like '%.' || substr(allowed, 3))
          )
        )
      then
        raise exception 'link host % is not accepted for %', host, new.platform_id
          using errcode = 'PR002', detail = new.platform_id;
      end if;

      return new;
    end
  $$;

revoke execute on function private.check_link_host() from public, anon, authenticated;

create trigger links_check_host
  before insert or update on public.links
  for each row execute function private.check_link_host();

-- Whether the caller may edit the venue: its creator, while active and until another user
-- picks it, or an active moderator or admin. A merged venue takes no edits.
create function private.can_edit_venue(target_venue_id uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1
      from public.venues v
      join public.profiles p on p.id = (select auth.uid()) and p.account_status = 'active'
      where v.id = target_venue_id
        and v.merged_into_id is null
        and (
          p.role in ('moderator', 'admin')
          or (
            v.used_by_others_at is null
            and exists (
              select 1 from public.creations c
              where c.venue_id = v.id and c.created_by = p.id
            )
          )
        )
    )
  $$;

revoke execute on function private.can_edit_venue(uuid) from public, anon;
grant execute on function private.can_edit_venue(uuid) to authenticated;

-- catalog_edits rows. An entry's own changes, its links, and its tags each have a trigger.
-- Changes made in the transaction that created the entry are its creation, not edits, so
-- they are skipped: create_venue runs in one transaction, and the entry's created_at is
-- that transaction's now(). Security definer, since no API role writes catalog_edits.

-- Name and city changes on a venue, DJ, or collective. The entity type is the trigger's
-- argument, so DJs and collectives reuse this function.
create function private.record_entry_edit() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
    declare
      column_name text;
    begin
      if old.created_at = now() then
        return new;
      end if;

      foreach column_name in array array['name', 'city_id'] loop
        if to_jsonb(old) -> column_name is distinct from to_jsonb(new) -> column_name then
          insert into public.catalog_edits (entity_type, entity_id, field, old_value, new_value, edited_by)
          values (
            tg_argv[0]::public.catalog_type, new.id, column_name,
            nullif(to_jsonb(old) -> column_name, 'null'),
            nullif(to_jsonb(new) -> column_name, 'null'),
            (select auth.uid())
          );
        end if;
      end loop;

      return new;
    end
  $$;

revoke execute on function private.record_entry_edit() from public, anon, authenticated;

create trigger venues_record_edit
  after update of name, city_id on public.venues
  for each row execute function private.record_entry_edit('venue');

-- Added, changed, and removed links. The field is the platform ID and the values are URLs.
create function private.record_link_edit() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
    declare
      link public.links := coalesce(new, old);
      kind public.catalog_type;
      owner_id uuid;
      owner_created_at timestamptz;
    begin
      kind := case
        when link.venue_id is not null then 'venue'
        when link.artist_id is not null then 'artist'
        else 'collective'
      end;
      owner_id := coalesce(link.venue_id, link.artist_id, link.collective_id);
      execute format('select created_at from public.%I where id = $1', kind::text || 's')
        into owner_created_at using owner_id;

      if owner_created_at = now() then
        return null;
      end if;

      if tg_op = 'UPDATE' and old.url = new.url then
        return null;
      end if;

      insert into public.catalog_edits (entity_type, entity_id, field, old_value, new_value, edited_by)
      values (
        kind, owner_id, link.platform_id,
        case when tg_op <> 'INSERT' then to_jsonb(old.url) end,
        case when tg_op <> 'DELETE' then to_jsonb(new.url) end,
        (select auth.uid())
      );

      return null;
    end
  $$;

revoke execute on function private.record_link_edit() from public, anon, authenticated;

create trigger links_record_edit
  after insert or update of url or delete on public.links
  for each row execute function private.record_link_edit();

-- Added and removed sound system tags. The field is sound_system and the value is its ID.
create function private.record_sound_system_edit() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
    declare
      tag public.venue_sound_systems := coalesce(new, old);
    begin
      if exists (
        select 1 from public.venues v where v.id = tag.venue_id and v.created_at = now()
      ) then
        return null;
      end if;

      insert into public.catalog_edits (entity_type, entity_id, field, old_value, new_value, edited_by)
      values (
        'venue', tag.venue_id, 'sound_system',
        case when tg_op = 'DELETE' then to_jsonb(old.sound_system_id) end,
        case when tg_op = 'INSERT' then to_jsonb(new.sound_system_id) end,
        (select auth.uid())
      );

      return null;
    end
  $$;

revoke execute on function private.record_sound_system_edit() from public, anon, authenticated;

create trigger venue_sound_systems_record_edit
  after insert or delete on public.venue_sound_systems
  for each row execute function private.record_sound_system_edit();

alter table public.venues enable row level security;
alter table public.venue_sound_systems enable row level security;
alter table public.links enable row level security;

-- Two select policies, one per role, because anon cannot run private.is_admin().
create policy "Everyone reads venues that are not hidden" on public.venues
  for select to anon
  using (hidden_at is null);

create policy "Users read venues that are not hidden, admins read all" on public.venues
  for select to authenticated
  using (hidden_at is null or (select private.is_admin()));

create policy "Creators, moderators, and admins update venues they may edit" on public.venues
  for update to authenticated
  using ((select private.can_edit_venue(id)))
  with check ((select private.can_edit_venue(id)));

-- Tags and links follow their venue: the subquery reads venues under its own policies.
create policy "Everyone reads the sound systems of venues they can read"
  on public.venue_sound_systems
  for select to anon, authenticated
  using (exists (select 1 from public.venues v where v.id = venue_id));

create policy "Venue editors add sound systems" on public.venue_sound_systems
  for insert to authenticated
  with check ((select private.can_edit_venue(venue_id)));

create policy "Venue editors remove sound systems" on public.venue_sound_systems
  for delete to authenticated
  using ((select private.can_edit_venue(venue_id)));

create policy "Everyone reads the links of venues they can read" on public.links
  for select to anon, authenticated
  using (venue_id is not null and exists (select 1 from public.venues v where v.id = venue_id));

create policy "Venue editors add links" on public.links
  for insert to authenticated
  with check (venue_id is not null and (select private.can_edit_venue(venue_id)));

create policy "Venue editors change links" on public.links
  for update to authenticated
  using (venue_id is not null and (select private.can_edit_venue(venue_id)))
  with check (venue_id is not null and (select private.can_edit_venue(venue_id)));

create policy "Venue editors remove links" on public.links
  for delete to authenticated
  using (venue_id is not null and (select private.can_edit_venue(venue_id)));

-- Users write only a venue's name and city. Creating goes through create_venue; hidden_at
-- gets an admin function in Milestone 6. A link's URL can change in place, so a changed
-- link is one edit; its owner and platform cannot.
grant select on public.venues, public.venue_sound_systems, public.links to anon, authenticated;
grant update (name, city_id) on public.venues to authenticated;
grant insert, delete on public.venue_sound_systems to authenticated;
grant insert (venue_id, platform_id, url), update (url), delete on public.links to authenticated;

-- Creates a venue with its links and sound system tags, and records the caller as its
-- creator, in one transaction. links maps platform IDs to URLs: {"instagram": "https://…"}.
-- Refused for a signed-out caller or one with no active profile. The daily cap (PR001)
-- and the link host check (PR002) refuse with their own SQLSTATEs. Security definer,
-- because only database functions write creations. Returns the new venue's IDs.
create function public.create_venue(
  name text,
  city_id integer,
  links jsonb default '{}',
  sound_system_ids text[] default '{}'
)
  returns table (id uuid, short_id text)
  language plpgsql volatile security definer set search_path = ''
  as $$
    declare
      caller uuid := (select auth.uid());
      venue public.venues;
      attempt integer := 0;
      failed_constraint text;
    begin
      if caller is null or not exists (
        select 1 from public.profiles p where p.id = caller and p.account_status = 'active'
      ) then
        raise exception 'only an active user can create a venue' using errcode = '42501';
      end if;

      if jsonb_typeof(coalesce(links, '{}')) <> 'object' then
        raise exception 'links must be an object of platform IDs to URLs' using errcode = '22023';
      end if;

      -- A short_id collision is retried with a new value; any other refusal is raised.
      loop
        attempt := attempt + 1;
        begin
          insert into public.venues (name, city_id)
          values (create_venue.name, create_venue.city_id)
          returning * into venue;
          exit;
        exception when unique_violation then
          get stacked diagnostics failed_constraint = constraint_name;
          if failed_constraint <> 'venues_short_id_key' or attempt >= 5 then
            raise;
          end if;
        end;
      end loop;

      insert into public.creations (created_by, venue_id) values (caller, venue.id);

      insert into public.links (venue_id, platform_id, url)
      select venue.id, link.key, link.value
      from jsonb_each_text(coalesce(create_venue.links, '{}')) link;

      insert into public.venue_sound_systems (venue_id, sound_system_id)
      select distinct venue.id, tag
      from unnest(coalesce(sound_system_ids, '{}')) tag;

      return query select venue.id, venue.short_id;
    end
  $$;

revoke execute on function public.create_venue(text, integer, jsonb, text[]) from public, anon;
grant execute on function public.create_venue(text, integer, jsonb, text[]) to authenticated;

-- Venues in a city whose name is like the query, for the duplicate check before a new
-- venue is added: "Tresor" finds "Tresor Club". Matches ignore case and accents. A name
-- containing the query, or with a trigram similarity of 0.3 or more (pg_trgm's default),
-- counts, closest first. Merged venues are left out, and hidden ones by the policies. At
-- most 10 rows.
create function public.search_venues(query text, city_id integer, max_results integer default 5)
  returns table (id uuid, short_id text, name text)
  language sql stable security invoker set search_path = ''
  as $$
    with term as (
      select private.fold_name(btrim(coalesce(query, ''))) as folded
    )
    select v.id, v.short_id, v.name
    from public.venues v, term t
    where v.city_id = search_venues.city_id
      and v.merged_into_id is null
      and char_length(t.folded) >= 2
      and (
        strpos(private.fold_name(v.name), t.folded) > 0
        or extensions.similarity(private.fold_name(v.name), t.folded) >= 0.3
      )
    order by extensions.similarity(private.fold_name(v.name), t.folded) desc, v.name, v.id
    limit least(greatest(coalesce(max_results, 5), 1), 10)
  $$;

revoke execute on function public.search_venues(text, integer, integer) from public, anon;
grant execute on function public.search_venues(text, integer, integer) to authenticated;
