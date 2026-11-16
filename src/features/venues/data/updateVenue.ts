import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import { writeLinkChanges } from "@/features/catalog/data/writeLinkChanges";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { VenueChangesT } from "../utils/getVenueChanges";
import { getVenueWriteFailure } from "../utils/getVenueWriteFailure";

const NO_LONGER_EDITABLE =
  "You can no longer edit this venue. Someone else has picked it, so locals keep it up to date.";

/**
 * Writes a venue edit as the signed-in user, one statement per change, so each is one
 * catalog edit (`getVenueChanges`). RLS refuses a user who may not edit the venue: an
 * update matches no row, and an insert or delete raises or matches nothing, both shown as
 * the same message. The writes are not one transaction: if one fails, the ones before it
 * are kept, each with its own edit row.
 */
export const updateVenue = async (
  supabase: SupabaseClientT,
  {
    venueId,
    changes,
    platforms
  }: { venueId: string; changes: VenueChangesT; platforms: LinkPlatformT[] }
): Promise<ActionResultT> => {
  const fail = (error: PostgrestError): Extract<ActionResultT, { ok: false }> => {
    if (error.code === "42501") {
      return { ok: false, message: NO_LONGER_EDITABLE };
    }
    const failure = getVenueWriteFailure(error, platforms);
    if (failure) {
      return failure;
    }
    throw error;
  };

  if (changes.venue) {
    const { data, error } = await supabase
      .from("venues")
      .update(changes.venue)
      .eq("id", venueId)
      .select("id");
    if (error) {
      return fail(error);
    }
    if (data.length === 0) {
      return { ok: false, message: NO_LONGER_EDITABLE };
    }
  }

  const links = await writeLinkChanges(supabase, {
    owner: { column: "venue_id", id: venueId },
    changes
  });
  if (links === "noRow") {
    return { ok: false, message: NO_LONGER_EDITABLE };
  }
  if (links !== "done") {
    return fail(links);
  }

  if (changes.soundSystemsToRemove.length > 0) {
    const { error } = await supabase
      .from("venue_sound_systems")
      .delete()
      .eq("venue_id", venueId)
      .in("sound_system_id", changes.soundSystemsToRemove);
    if (error) {
      return fail(error);
    }
  }

  if (changes.soundSystemsToAdd.length > 0) {
    const { error } = await supabase.from("venue_sound_systems").insert(
      changes.soundSystemsToAdd.map((soundSystemId) => ({
        venue_id: venueId,
        sound_system_id: soundSystemId
      }))
    );
    if (error) {
      return fail(error);
    }
  }

  return { ok: true, data: undefined };
};
