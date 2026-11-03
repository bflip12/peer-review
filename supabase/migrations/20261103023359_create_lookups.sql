-- The two seeded lookup lists of the catalog: sound systems, tagged on venues, and link
-- platforms, the link fields on venues, DJs, and collectives with the hosts each accepts.
-- Both use text IDs, so local, staging, and production share them and code can name a row.
-- Everyone reads them; nobody writes them through the API. A new row is a new migration.

create table public.sound_systems (
  id text constraint sound_systems_pkey primary key
    constraint sound_systems_id_check check (id ~ '^[a-z][a-z0-9_]*$'),
  name text not null constraint sound_systems_name_key unique
    constraint sound_systems_name_check check (name ~ '[^[:space:]]'),
  sort_order smallint not null constraint sound_systems_sort_order_key unique
);

comment on table public.sound_systems is 'Sound system brands that venues are tagged with.';
comment on column public.sound_systems.sort_order is 'Order in the venue form, lowest first.';

create table public.link_platforms (
  id text constraint link_platforms_pkey primary key
    constraint link_platforms_id_check check (id ~ '^[a-z][a-z0-9_]*$'),
  label text not null constraint link_platforms_label_key unique
    constraint link_platforms_label_check check (label ~ '[^[:space:]]'),
  -- Lowercase host names, each optionally starting with "*." to match any subdomain.
  -- The hosts joined by spaces must match one host, then more after single spaces, so an
  -- empty string anywhere fails. array_to_string skips nulls, so they are refused first.
  allowed_hosts text[] not null
    constraint link_platforms_allowed_hosts_check check (
      cardinality(allowed_hosts) = 0
      or (
        array_position(allowed_hosts, null) is null
        and array_to_string(allowed_hosts, ' ')
          ~ '^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+( (\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+)*$'
      )
    ),
  is_for_venues boolean not null,
  is_for_artists boolean not null,
  is_for_collectives boolean not null,
  sort_order smallint not null constraint link_platforms_sort_order_key unique
);

comment on table public.link_platforms is
  'Sites a venue, DJ, or collective can link to, and the hosts each link field accepts.';
comment on column public.link_platforms.label is 'Shown in forms and on pages.';
comment on column public.link_platforms.allowed_hosts is
  'Hosts a link may use. "*.bandcamp.com" matches any subdomain. Empty accepts any http or https URL.';
comment on column public.link_platforms.is_for_venues is 'Whether the venue form shows this field.';
comment on column public.link_platforms.is_for_artists is 'Whether the DJ form shows this field.';
comment on column public.link_platforms.is_for_collectives is
  'Whether the collective form shows this field.';
comment on column public.link_platforms.sort_order is 'Order in forms and on pages, lowest first.';

-- "Other" sorts last, and the gaps leave room for new brands in between.
insert into public.sound_systems (id, name, sort_order) values
  ('funktion_one', 'Funktion-One', 10),
  ('void_acoustics', 'Void Acoustics', 20),
  ('l_acoustics', 'L-Acoustics', 30),
  ('d_and_b_audiotechnik', 'd&b audiotechnik', 40),
  ('danley', 'Danley', 50),
  ('martin_audio', 'Martin Audio', 60),
  ('other', 'Other', 1000);

insert into public.link_platforms
  (id, label, allowed_hosts, is_for_venues, is_for_artists, is_for_collectives, sort_order)
values
  ('instagram', 'Instagram', '{instagram.com, www.instagram.com}', true, true, true, 10),
  ('resident_advisor', 'Resident Advisor', '{ra.co, www.ra.co}', true, true, true, 20),
  (
    'soundcloud', 'SoundCloud',
    '{soundcloud.com, www.soundcloud.com, m.soundcloud.com, on.soundcloud.com}',
    false, true, true, 30
  ),
  ('bandcamp', 'Bandcamp', '{*.bandcamp.com}', false, true, true, 40),
  ('website', 'Website', '{}', true, true, true, 1000);

alter table public.sound_systems enable row level security;
alter table public.link_platforms enable row level security;

create policy "Everyone reads sound systems" on public.sound_systems
  for select to anon, authenticated
  using (true);

create policy "Everyone reads link platforms" on public.link_platforms
  for select to anon, authenticated
  using (true);

grant select on public.sound_systems, public.link_platforms to anon, authenticated;
