import "server-only";

import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import { getVenueWriteFailure } from "../utils/getVenueWriteFailure";
import type { LinkPlatformT, VenueInputT } from "../venues.types";

/**
 * Adds a venue as the signed-in user, with its links and tags, in one transaction
 * (`create_venue`). Returns the new venue's short ID. The daily cap and a refused link
 * come back as form messages; anything else is thrown.
 */
export const createVenue = async (
  supabase: SupabaseClientT,
  input: VenueInputT,
  platforms: LinkPlatformT[]
): Promise<ActionResultT<{ shortId: string }>> => {
  const { data, error } = await supabase
    .rpc("create_venue", {
      name: input.name,
      city_id: input.cityId,
      links: input.links,
      sound_system_ids: input.soundSystemIds
    })
    .single();
  if (error) {
    const failure = getVenueWriteFailure(error, platforms);
    if (failure) {
      return failure;
    }
    throw error;
  }
  return { ok: true, data: { shortId: data.short_id } };
};
