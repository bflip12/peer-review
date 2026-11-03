-- Cities and their other names, seeded from GeoNames by the next migration (ADR 0025).
-- Everyone reads them; nobody writes them through the API. search_cities serves the city
-- autocomplete, matching names with case and accents ignored, so "koln" finds Köln and
-- "Cologne" finds it through city_names.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create table public.cities (
  id integer constraint cities_pkey primary key,
  name text not null constraint cities_name_check check (name ~ '[^[:space:]]'),
  ascii_name text not null constraint cities_ascii_name_check check (ascii_name ~ '[^[:space:]]'),
  country_code text not null constraint cities_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  admin1_name text constraint cities_admin1_name_check check (admin1_name ~ '[^[:space:]]'),
  population integer not null constraint cities_population_check check (population >= 0),
  timezone text not null constraint cities_timezone_check check (timezone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+-]+)*$')
);

comment on table public.cities is
  'Towns and cities from the GeoNames cities1000 export. The id is the GeoNames ID.';
comment on column public.cities.ascii_name is 'GeoNames ASCII form of the name, such as Koeln.';
comment on column public.cities.admin1_name is
  'State or region, to tell apart cities with the same name. Null when GeoNames has none.';
comment on column public.cities.population is 'From GeoNames, 0 when unknown. Sorts search results.';
comment on column public.cities.timezone is 'IANA name. Every date rule for the city reads dates in it.';

create table public.city_names (
  city_id integer not null
    constraint city_names_city_id_fkey references public.cities on delete cascade,
  language text not null constraint city_names_language_check check (language ~ '^[a-z]{2,3}$'),
  name text not null constraint city_names_name_check check (name ~ '[^[:space:]]'),
  constraint city_names_pkey primary key (city_id, language, name)
);

comment on table public.city_names is
  'English and local names of a city besides its main name, so "Cologne" finds Köln.';
comment on column public.city_names.language is 'ISO 639 code from GeoNames, such as en or de.';

-- Lowercase without accents. unaccent is only stable, because its rules file could change,
-- so this wrapper names the dictionary and is declared immutable for use in indexes. The
-- rules file ships with Postgres; reindex the three indexes below if it ever changes.
create function private.fold_name(name text) returns text
  language sql immutable parallel safe set search_path = ''
  as $$
    select lower(extensions.unaccent('extensions.unaccent'::regdictionary, name))
  $$;

-- Trigram indexes serve search_cities for queries of 3 or more characters. Trigrams cannot
-- serve shorter ones, so 2-character queries match the first 2 characters through these.
create index cities_name_prefix_idx on public.cities (left(private.fold_name(name), 2));
create index cities_ascii_name_prefix_idx on public.cities
  (left(private.fold_name(ascii_name), 2));
create index city_names_name_prefix_idx on public.city_names (left(private.fold_name(name), 2));

create index cities_name_trgm_idx on public.cities
  using gin (private.fold_name(name) extensions.gin_trgm_ops);
create index cities_ascii_name_trgm_idx on public.cities
  using gin (private.fold_name(ascii_name) extensions.gin_trgm_ops);
create index city_names_name_trgm_idx on public.city_names
  using gin (private.fold_name(name) extensions.gin_trgm_ops);

alter table public.cities enable row level security;
alter table public.city_names enable row level security;

create policy "Everyone reads cities" on public.cities
  for select to anon, authenticated
  using (true);

create policy "Everyone reads city names" on public.city_names
  for select to anon, authenticated
  using (true);

grant select on public.cities, public.city_names to anon, authenticated;

-- Cities whose main, ASCII, or other name contains the query, ignoring case and accents.
-- Best first: a name or a word in it starting with the query ("york" finds York and New
-- York City), then any other match, each by population. Each city appears once, with
-- the name that matched it best. A 2-character query matches only the start of a name;
-- a shorter one returns nothing. At most 20 rows.
create function public.search_cities(query text, max_results integer default 10)
  returns table (
    id integer,
    name text,
    admin1_name text,
    country_code text,
    matched_name text
  )
  language plpgsql stable security invoker set search_path = ''
  as $$
  declare
    term text := private.fold_name(btrim(coalesce(query, '')));
    -- The term with LIKE's wildcards and escape character escaped.
    escaped text := replace(replace(replace(term, '\', '\\'), '%', '\%'), '_', '\_');
    contains text := '%' || escaped || '%';
    is_short boolean := char_length(term) < 3;
  begin
    if char_length(term) < 2 then
      return;
    end if;

    return query
      with matches as (
        select c.id as city_id, c.name as matched_name, private.fold_name(c.name) as folded,
          0 as source
        from public.cities c
        where (is_short and left(private.fold_name(c.name), 2) = term)
          or (not is_short and private.fold_name(c.name) like contains)
        union all
        select c.id, c.ascii_name, private.fold_name(c.ascii_name), 1
        from public.cities c
        where (is_short and left(private.fold_name(c.ascii_name), 2) = term)
          or (not is_short and private.fold_name(c.ascii_name) like contains)
        union all
        select n.city_id, n.name, private.fold_name(n.name), 2
        from public.city_names n
        where (is_short and left(private.fold_name(n.name), 2) = term)
          or (not is_short and private.fold_name(n.name) like contains)
      ),
      ranked as (
        select m.city_id, m.matched_name, m.source,
          case
            when ' ' || translate(m.folded, '-', ' ') like '% ' || escaped || '%' then 0
            else 1
          end as match_rank
        from matches m
      ),
      best as (
        select distinct on (r.city_id) r.city_id, r.matched_name, r.match_rank
        from ranked r
        order by r.city_id, r.match_rank, r.source, r.matched_name
      )
      select c.id, c.name, c.admin1_name, c.country_code, b.matched_name
      from best b
      join public.cities c on c.id = b.city_id
      order by b.match_rank, c.population desc, c.id
      limit least(greatest(coalesce(max_results, 10), 1), 20);
  end;
  $$;

-- The API roles call search_cities, which runs as the caller, so they also need the
-- private schema, fold_name, and unaccent. Migrations revoke EXECUTE from PUBLIC on every
-- function postgres creates (lock_down_default_grants), extension functions included.
grant usage on schema private to anon;
grant execute on function private.fold_name(text) to anon, authenticated;
grant execute on function extensions.unaccent(regdictionary, text) to anon, authenticated;
grant execute on function public.search_cities(text, integer) to anon, authenticated;
