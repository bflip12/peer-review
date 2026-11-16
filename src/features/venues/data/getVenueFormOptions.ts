import "server-only";

import { getLinkPlatforms } from "@/features/catalog/data/getLinkPlatforms";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { VenueFormOptionsT } from "../venues.types";

/**
 * The venue form's link fields and sound system tags, each in its form order. Both lists
 * are seeded lookups that everyone can read, so a new platform or brand shows up in the
 * form without a code change.
 */
export const getVenueFormOptions = async (
  supabase: SupabaseClientT
): Promise<VenueFormOptionsT> => {
  const [platforms, soundSystems] = await Promise.all([
    getLinkPlatforms(supabase, "venue"),
    supabase.from("sound_systems").select("id, name").order("sort_order")
  ]);
  if (soundSystems.error) {
    throw soundSystems.error;
  }
  return { platforms, soundSystems: soundSystems.data };
};
