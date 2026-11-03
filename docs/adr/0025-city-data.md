# 0025: City data from GeoNames

- Date: 2026-11-03
- Status: Accepted

## Context
Venues, events, and the optional home city on DJs and collectives all reference `cities`,
whose IDs are GeoNames IDs (ADR 0003, `docs/DATA_MODEL.md`). ADR 0010 left four choices
to Milestone 2: which GeoNames file, which entries count as a city, how other names such
as "Cologne" for Köln are matched, and how the rows reach the staging and production
Supabase projects, where migrations are never applied by hand (ADR 0018).

## Options considered

**Which file**
- **cities1000** (every place with 1,000 people or more). 171,750 rows on 2026-11-03.
  Covers the small towns where a club night or a DJ's home can be.
- **cities5000 or cities15000.** Far smaller, but a venue in a town of 3,000 people would
  have no city to pick. Adding the missing towns later means a second load.

**Which entries count as a city.** GeoNames gives each row a feature code. `PPLX`
("section of populated place") marks districts such as Kreuzberg and Neukölln: 9,656
rows. `PPLH` and `PPLCH` are historical, `PPLQ` abandoned, `PPLW` destroyed. The rest are
towns, cities, capitals, and seats of a region.

**Other names**
- **The `alternatenames` column of cities1000.** One comma-separated list without
  languages, mixing old Latin names and transliterations into every script.
- **alternateNamesV2**, filtered to English and the languages `countryInfo.txt` lists for
  the city's country, without historic or colloquial names: 69,504 rows. "Cologne" (en)
  for Köln, "Munich" and "München" for Munich.

**How the rows reach the hosted projects**
- **`supabase/seed.sql`.** Runs only on a local `db reset`. The hosted projects would stay
  empty.
- **A loader step in the Migrate workflow.** Keeps the data out of the repo, but adds a
  second path for schema changes beside migrations, and the result depends on the day the
  workflow runs.
- **A migration of inserts, written by a script.** One 16 MB SQL file in the repo, applied
  by Migrate like every other migration. GeoNames updates its files daily and keeps no
  dated copies, so the committed migration is the only exact record of what was loaded.

**Matching what users type**
- **Full text search.** Built for words in documents. It handles neither prefixes of a
  word well nor typing "koln" for Köln.
- **Trigram indexes (`pg_trgm`) on names folded with `unaccent`.** Substring matching
  with case and accents ignored. `unaccent` is only stable, so an immutable wrapper,
  `private.fold_name`, names the dictionary and is used in the indexes. Trigrams need 3
  characters, so a 2-character query matches the first 2 characters through a btree
  index on `left(fold_name(name), 2)`.

## Decision
- cities1000. Keep the feature codes `PPL`, `PPLA` to `PPLA5`, `PPLC`, `PPLF`, `PPLG`,
  `PPLL`, `PPLR`, `PPLS`, and `STLMT`. Any other code, including one GeoNames adds later,
  is left out. 162,026 cities.
- The region name comes from `admin1CodesASCII.txt`, null when GeoNames has none.
- `city_names` holds names from alternateNamesV2 in English or one of the city's country
  languages, not historic or colloquial, with a letter or digit, and not the main or ASCII
  name with different case or accents. Key `(city_id, language, name)`.
- `npm run db:cities` (`scripts/geonames/buildCitiesMigration.ts`) downloads the four
  files and writes the seed migration. Migrate applies it.
- `search_cities(query, max_results)` searches the main, ASCII, and other names. Best
  first: a name or a word in it starting with the query, then any other match, each by
  population. It returns each city once, with the name that matched.
- The privacy page credits GeoNames, as its CC BY 4.0 license requires.

## Consequences
- Every city search reads one function, so the city picker (Milestone 2, venues) and DJ
  and collective forms share one ranking.
- Boroughs that GeoNames codes as a region seat stay in: Brooklyn and Manhattan (`PPLA2`),
  Hackney and the City of London (`PPLA3`). A venue in Brooklyn can be filed under
  Brooklyn or under New York City. Deciding this differently later means moving those
  venues and their events.
- Updating from a newer GeoNames export is a new migration that adds cities and names and
  updates changed fields. It never deletes a city, since venues and events reference them.
- The repo carries a 16 MB migration. The public repo planned for launch starts fresh from
  `main` and carries it once.
- If Postgres ever changes the `unaccent` rules file, the three trigram and three prefix
  indexes need a reindex, or searches miss rows whose folded name changed.
