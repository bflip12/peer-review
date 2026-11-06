import "server-only";

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
    supabase
      .from("link_platforms")
      .select("id, label, allowed_hosts")
      .eq("is_for_venues", true)
      .order("sort_order"),
    supabase.from("sound_systems").select("id, name").order("sort_order")
  ]);
  if (platforms.error) {
    throw platforms.error;
  }
  if (soundSystems.error) {
    throw soundSystems.error;
  }
  return {
    platforms: platforms.data.map((platform) => ({
      id: platform.id,
      label: platform.label,
      allowedHosts: platform.allowed_hosts
    })),
    soundSystems: soundSystems.data
  };
};
