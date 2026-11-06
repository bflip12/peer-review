import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { LinkChangesT } from "../utils/getLinkChanges";

/** The `links` column that points at the entry being edited, and the entry's ID. */
export type LinkOwnerT = { column: "venue_id" | "artist_id"; id: string };

/**
 * What a link write ended with:
 * - "done": every write went through,
 * - "noRow": an update matched no row, which RLS causes for a user who may not edit,
 * - a Postgres error, for the caller to turn into a message or throw.
 */
export type LinkWriteResultT = "done" | "noRow" | PostgrestError;

/**
 * Writes an edit's link changes as the signed-in user: updates, then deletes, then
 * inserts, one statement each, so each change is one catalog edit. Stops at the first
 * failure; the writes before it are kept. RLS decides who may write.
 */
export const writeLinkChanges = async (
  supabase: SupabaseClientT,
  { owner, changes }: { owner: LinkOwnerT; changes: LinkChangesT }
): Promise<LinkWriteResultT> => {
  for (const link of changes.linksToUpdate) {
    const { data, error } = await supabase
      .from("links")
      .update({ url: link.url })
      .eq(owner.column, owner.id)
      .eq("platform_id", link.platformId)
      .select("id");
    if (error) {
      return error;
    }
    if (data.length === 0) {
      return "noRow";
    }
  }

  if (changes.linksToDelete.length > 0) {
    const { error } = await supabase
      .from("links")
      .delete()
      .eq(owner.column, owner.id)
      .in("platform_id", changes.linksToDelete);
    if (error) {
      return error;
    }
  }

  if (changes.linksToInsert.length > 0) {
    const { error } = await supabase.from("links").insert(
      changes.linksToInsert.map((link) => ({
        venue_id: owner.column === "venue_id" ? owner.id : null,
        artist_id: owner.column === "artist_id" ? owner.id : null,
        platform_id: link.platformId,
        url: link.url
      }))
    );
    if (error) {
      return error;
    }
  }

  return "done";
};
