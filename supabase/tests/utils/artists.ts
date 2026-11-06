import type { SupabaseClient } from "@supabase/supabase-js";

import { runSql } from "./testClients.ts";
import { newName, type EditT } from "./venues.ts";

/** Postgres "unique violation": here, a taken DJ name and city. */
export const UNIQUE_VIOLATION = "23505";
/** Postgres "check violation": here, "b2b" in a DJ name. */
export const CHECK_VIOLATION = "23514";

export type ArtistIdsT = { id: string; short_id: string };
export type ArtistArgsT = {
  name?: string;
  city_id?: number | null;
  links?: Record<string, string>;
};

/** Creates a DJ through `create_artist` as the client's user. */
export const createArtist = async (
  client: SupabaseClient,
  args: ArtistArgsT = {}
): Promise<ArtistIdsT> => {
  const result = await client
    .rpc("create_artist", {
      name: args.name ?? newName("DJ"),
      city_id: args.city_id ?? null,
      links: args.links ?? {}
    })
    .single<ArtistIdsT>();
  if (result.error) {
    throw result.error;
  }
  return result.data;
};

/** A DJ's catalog edits, read as `postgres` so the policies under test do not apply. */
export const readArtistEdits = async (artistId: string): Promise<EditT[]> =>
  runSql<EditT>(`
    select field, old_value, new_value, edited_by from public.catalog_edits
    where entity_type = 'artist' and entity_id = '${artistId}'
    order by created_at, field`);

/** A DJ's name and city, read as `postgres`. */
export const readArtist = async (artistId: string): Promise<Record<string, unknown>> => {
  const [row] = await runSql<Record<string, unknown>>(
    `select name, city_id from public.artists where id = '${artistId}'`
  );
  return row;
};

/** Marks a DJ as picked by another user, as Milestone 3's trigger will. */
export const markUsedByOthers = async (artistId: string): Promise<void> => {
  await runSql(
    `update public.artists set used_by_others_at = now() where id = '${artistId}'`
  );
};
