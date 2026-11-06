import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import { writeLinkChanges } from "@/features/catalog/data/writeLinkChanges";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { DjInputT } from "../djs.types";
import type { DjChangesT } from "../utils/getDjChanges";
import { getDjWriteFailure } from "../utils/getDjWriteFailure";

const NO_LONGER_EDITABLE =
  "You can no longer edit this DJ. Someone else has picked them, so locals keep them up to date.";

/**
 * Writes a DJ edit as the signed-in user, one statement per change, so each is one
 * catalog edit (`getDjChanges`). RLS refuses a user who may not edit the DJ: an update
 * matches no row, and an insert or delete raises or matches nothing, both shown as the
 * same message. The writes are not one transaction: if one fails, the ones before it are
 * kept, each with its own edit row. `input` is the edited form, for the messages.
 */
export const updateDj = async (
  supabase: SupabaseClientT,
  {
    artistId,
    input,
    changes,
    platforms
  }: {
    artistId: string;
    input: DjInputT;
    changes: DjChangesT;
    platforms: LinkPlatformT[];
  }
): Promise<ActionResultT> => {
  const fail = (error: PostgrestError): Extract<ActionResultT, { ok: false }> => {
    if (error.code === "42501") {
      return { ok: false, message: NO_LONGER_EDITABLE };
    }
    const failure = getDjWriteFailure(error, { input, platforms });
    if (failure) {
      return failure;
    }
    throw error;
  };

  if (changes.artist) {
    const { data, error } = await supabase
      .from("artists")
      .update(changes.artist)
      .eq("id", artistId)
      .select("id");
    if (error) {
      return fail(error);
    }
    if (data.length === 0) {
      return { ok: false, message: NO_LONGER_EDITABLE };
    }
  }

  const links = await writeLinkChanges(supabase, {
    owner: { column: "artist_id", id: artistId },
    changes
  });
  if (links === "noRow") {
    return { ok: false, message: NO_LONGER_EDITABLE };
  }
  if (links !== "done") {
    return fail(links);
  }

  return { ok: true, data: undefined };
};
