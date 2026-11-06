-- DJs, stored as artists (ADR 0009, ADR 0010, ADR 0011), with their links. A DJ is created
-- only through create_artist, which also writes its creations row, so the daily cap of 50
-- applies. Its creator edits the name, city, and links until another user picks it
-- (used_by_others_at, set from Milestone 3); moderators and admins edit it at any time.
-- Every edit after the one that created the DJ writes a catalog_edits row, through the
-- triggers venues already use.
--
-- A DJ's home city is optional and tells apart two artists with the same name. Among DJs
-- not merged, no two share a name and a city, a missing city counting as equal (ADR 0011).
-- A name containing "b2b" is refused: b2b sets are lineup slots, not DJs.
--
-- The links policies from create_venues cover venues only. They are replaced here by
-- policies covering venues and DJs.

create table public.artists (
  id uuid default gen_random_uuid() constraint artists_pkey primary key,
  short_id text not null default private.new_short_id()
    constraint artists_short_id_key unique
    constraint artists_short_id_check check (short_id ~ '^[2-9a-hjkmnp-z]{8}$'),
  name text not null
    constraint artists_name_check check (name ~ '[^[:space:]]' and char_length(name) <= 100)
    constraint artists_name_b2b_check check (name !~* 'b2b'),
  city_id integer constraint artists_city_id_fkey references public.cities,
  used_by_others_at timestamptz,
  merged_into_id uuid constraint artists_merged_into_id_fkey references public.artists,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.artists is
  'DJs and live acts, shown as "DJs". Created through create_artist.';
comment on column public.artists.short_id is 'The DJ''s ID in URLs.';
comment on column public.artists.city_id is
  'Where the DJ is based. Optional; null means unknown. Tells apart DJs with the same name (ADR 0011).';
comment on column public.artists.used_by_others_at is
  'When a user other than the creator first picked the DJ. Ends the creator''s edit right.';
comment on column public.artists.merged_into_id is 'Set when a merge folds this DJ into that one (Milestone 10).';
comment on column public.artists.hidden_at is 'Set by admins. Hidden DJs are left out of every read.';

-- One DJ per name and city, ignoring case and surrounding spaces. Two DJs with the same
-- name and no city count as the same pair. Merged DJs keep their row and are ignored.
create unique index artists_name_city_id_key on public.artists (lower(btrim(name)), city_id)
  nulls not distinct
  where merged_into_id is null;
create index artists_city_id_idx on public.artists (city_id);
create index artists_name_trgm_idx on public.artists
  using gin (private.fold_name(name) extensions.gin_trgm_ops);

create trigger artists_set_updated_at
  before update on public.artists
  for each row execute function private.set_updated_at();

alter table public.creations
  add constraint creations_artist_id_fkey
  foreign key (artist_id) references public.artists on delete cascade;

alter table public.links
  add constraint links_artist_id_fkey
  foreign key (artist_id) references public.artists on delete cascade;

-- Whether the caller may edit the DJ: its creator, while active and until another user
-- picks it, or an active moderator or admin. A merged DJ takes no edits.
create function private.can_edit_artist(target_artist_id uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1
      from public.artists a
      join public.profiles p on p.id = (select auth.uid()) and p.account_status = 'active'
      where a.id = target_artist_id
        and a.merged_into_id is null
        and (
          p.role in ('moderator', 'admin')
          or (
            a.used_by_others_at is null
            and exists (
              select 1 from public.creations c
              where c.artist_id = a.id and c.created_by = p.id
            )
          )
        )
    )
  $$;

revoke execute on function private.can_edit_artist(uuid) from public, anon;
grant execute on function private.can_edit_artist(uuid) to authenticated;

create trigger artists_record_edit
  after update of name, city_id on public.artists
  for each row execute function private.record_entry_edit('artist');

alter table public.artists enable row level security;

-- Two select policies, one per role, because anon cannot run private.is_admin().
create policy "Everyone reads DJs that are not hidden" on public.artists
  for select to anon
  using (hidden_at is null);

create policy "Users read DJs that are not hidden, admins read all" on public.artists
  for select to authenticated
  using (hidden_at is null or (select private.is_admin()));

create policy "Creators, moderators, and admins update DJs they may edit" on public.artists
  for update to authenticated
  using ((select private.can_edit_artist(id)))
  with check ((select private.can_edit_artist(id)));

-- Links follow their venue or DJ: the subqueries read those tables under their own
-- policies. Collectives join these policies in their own migration.
drop policy "Everyone reads the links of venues they can read" on public.links;
drop policy "Venue editors add links" on public.links;
drop policy "Venue editors change links" on public.links;
drop policy "Venue editors remove links" on public.links;

create policy "Everyone reads the links of venues and DJs they can read" on public.links
  for select to anon, authenticated
  using (
    (venue_id is not null and exists (select 1 from public.venues v where v.id = venue_id))
    or (artist_id is not null and exists (select 1 from public.artists a where a.id = artist_id))
  );

create policy "Venue and DJ editors add links" on public.links
  for insert to authenticated
  with check (
    (venue_id is not null and (select private.can_edit_venue(venue_id)))
    or (artist_id is not null and (select private.can_edit_artist(artist_id)))
  );

create policy "Venue and DJ editors change links" on public.links
  for update to authenticated
  using (
    (venue_id is not null and (select private.can_edit_venue(venue_id)))
    or (artist_id is not null and (select private.can_edit_artist(artist_id)))
  )
  with check (
    (venue_id is not null and (select private.can_edit_venue(venue_id)))
    or (artist_id is not null and (select private.can_edit_artist(artist_id)))
  );

create policy "Venue and DJ editors remove links" on public.links
  for delete to authenticated
  using (
    (venue_id is not null and (select private.can_edit_venue(venue_id)))
    or (artist_id is not null and (select private.can_edit_artist(artist_id)))
  );

-- Users write only a DJ's name and city. Creating goes through create_artist; hidden_at
-- gets an admin function in Milestone 6.
grant select on public.artists to anon, authenticated;
grant update (name, city_id) on public.artists to authenticated;
grant insert (artist_id) on public.links to authenticated;

-- Creates a DJ with their links, and records the caller as creator, in one transaction.
-- links maps platform IDs to URLs: {"soundcloud": "https://…"}. city_id may be null.
-- Refused for a signed-out caller or one with no active profile. The daily cap (PR001)
-- and the link host check (PR002) refuse with their own SQLSTATEs; a taken name and city
-- with unique_violation on artists_name_city_id_key, and "b2b" in the name with
-- check_violation on artists_name_b2b_check. Security definer, because only database
-- functions write creations. Returns the new DJ's IDs.
create function public.create_artist(
  name text,
  city_id integer default null,
  links jsonb default '{}'
)
  returns table (id uuid, short_id text)
  language plpgsql volatile security definer set search_path = ''
  as $$
    declare
      caller uuid := (select auth.uid());
      artist public.artists;
      attempt integer := 0;
      failed_constraint text;
    begin
      if caller is null or not exists (
        select 1 from public.profiles p where p.id = caller and p.account_status = 'active'
      ) then
        raise exception 'only an active user can create a DJ' using errcode = '42501';
      end if;

      if jsonb_typeof(coalesce(links, '{}')) <> 'object' then
        raise exception 'links must be an object of platform IDs to URLs' using errcode = '22023';
      end if;

      -- A short_id collision is retried with a new value; any other refusal is raised.
      loop
        attempt := attempt + 1;
        begin
          insert into public.artists (name, city_id)
          values (create_artist.name, create_artist.city_id)
          returning * into artist;
          exit;
        exception when unique_violation then
          get stacked diagnostics failed_constraint = constraint_name;
          if failed_constraint <> 'artists_short_id_key' or attempt >= 5 then
            raise;
          end if;
        end;
      end loop;

      insert into public.creations (created_by, artist_id) values (caller, artist.id);

      insert into public.links (artist_id, platform_id, url)
      select artist.id, link.key, link.value
      from jsonb_each_text(coalesce(create_artist.links, '{}')) link;

      return query select artist.id, artist.short_id;
    end
  $$;

revoke execute on function public.create_artist(text, integer, jsonb) from public, anon;
grant execute on function public.create_artist(text, integer, jsonb) to authenticated;

-- DJs for the duplicate check before a new DJ is added, closest first. Two kinds of match:
-- - Exact: the same name ignoring case and surrounding spaces, the rule the unique index
--   uses. Returned whatever their city, so the form can require a city when one of them
--   has none (ADR 0011). is_exact is true.
-- - Near: a name containing the query, or with a trigram similarity of 0.3 or more,
--   ignoring case and accents ("Rush" finds "DJ Rush"). With a city_id, only DJs in that
--   city or with no city, since a DJ based elsewhere is likely someone else.
-- Each row has the DJ's city (home_city_*, since city_id is the parameter) and the platform IDs of their links, in form order. Merged
-- DJs are left out, and hidden ones by the policies. Under 2 characters it returns
-- nothing. At most 10 rows, exact matches first.
create function public.search_artists(
  query text,
  city_id integer default null,
  max_results integer default 5
)
  returns table (
    id uuid,
    short_id text,
    name text,
    home_city_id integer,
    home_city_name text,
    home_city_admin1_name text,
    home_city_country_code text,
    link_platform_ids text[],
    is_exact boolean
  )
  language sql stable security invoker set search_path = ''
  as $$
    with term as (
      select
        btrim(coalesce(query, '')) as trimmed,
        private.fold_name(btrim(coalesce(query, ''))) as folded
    ),
    matches as (
      select
        a.*,
        lower(btrim(a.name)) = lower(t.trimmed) as is_exact,
        extensions.similarity(private.fold_name(a.name), t.folded) as score
      from public.artists a, term t
      where a.merged_into_id is null
        and char_length(t.folded) >= 2
        and (
          lower(btrim(a.name)) = lower(t.trimmed)
          or (
            (
              strpos(private.fold_name(a.name), t.folded) > 0
              or extensions.similarity(private.fold_name(a.name), t.folded) >= 0.3
            )
            and (
              search_artists.city_id is null
              or a.city_id is null
              or a.city_id = search_artists.city_id
            )
          )
        )
    )
    select
      m.id, m.short_id, m.name, m.city_id,
      c.name, c.admin1_name, c.country_code,
      coalesce(
        (
          select array_agg(l.platform_id order by p.sort_order)
          from public.links l
          join public.link_platforms p on p.id = l.platform_id
          where l.artist_id = m.id
        ),
        '{}'
      ),
      m.is_exact
    from matches m
    left join public.cities c on c.id = m.city_id
    order by m.is_exact desc, m.score desc, m.name, m.id
    limit least(greatest(coalesce(max_results, 5), 1), 10)
  $$;

revoke execute on function public.search_artists(text, integer, integer) from public, anon;
grant execute on function public.search_artists(text, integer, integer) to authenticated;
