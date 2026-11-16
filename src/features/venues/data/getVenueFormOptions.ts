import "server-only";

import { getLinkPlatforms } from "@/features/catalog/data/getLinkPlatforms";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { VenueFormOptionsT } from "../venues.types";

/**
 * The venue form's link fields and sound system tags, each in its form order. Everyone
 * can read both lists, so a new platform, or a brand a user adds, shows up in the form
 * without a code change.
 */
export const getVenueFormOptions = async (
  supabase: SupabaseClientT
): Promise<VenueFormOptionsT> => {
  const [platforms, soundSystems] = await Promise.all([
    getLinkPlatforms(supabase, "venue"),
    // Seeded brands in their set order, then brands users added (ADR 0026) by name.
    supabase.from("sound_systems").select("id, name").order("sort_order").order("name")
  ]);
  if (soundSystems.error) {
    throw soundSystems.error;
  }
  return { platforms, soundSystems: soundSystems.data };
};
