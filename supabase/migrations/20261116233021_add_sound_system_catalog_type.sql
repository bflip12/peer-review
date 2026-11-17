-- A catalog_type value for sound system brands, which users can now add (ADR 0026). The
-- daily cap trigger names each kind of creation with this enum. Postgres cannot use a new
-- enum value in the transaction that adds it, so it has its own migration, before the one
-- that uses it.

alter type public.catalog_type add value 'sound_system';
