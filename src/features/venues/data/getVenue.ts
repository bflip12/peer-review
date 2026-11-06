import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { VenueT } from "../venues.types";

// The same alphabet as private.new_short_id (migration create_venues). Anything else
// cannot be a short ID, so it is not sent to the database.
const SHORT_ID_PATTERN = /^[2-9a-hjkmnp-z]{8}$/;

/**
 * A venue by its short ID, with its city, links in form order, and sound system tags in
 * form order. Null when no venue has the ID, or RLS hides it (a hidden venue).
 */
export const getVenue = async (
  supabase: SupabaseClientT,
  shortId: string
): Promise<VenueT | null> => {
  if (!SHORT_ID_PATTERN.test(shortId)) {
    return null;
  }
  const { data, error } = await supabase
    .from("venues")
    .select(
      `id, short_id, name,
      city:cities!inner (id, name, admin1_name, country_code),
      links (platform_id, url, platform:link_platforms!inner (label, sort_order)),
      venue_sound_systems (sound_system:sound_systems!inner (id, name, sort_order))`
    )
    .eq("short_id", shortId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return {
    id: data.id,
    shortId: data.short_id,
    name: data.name,
    city: {
      id: data.city.id,
      name: data.city.name,
      admin1Name: data.city.admin1_name,
      countryCode: data.city.country_code
    },
    links: [...data.links]
      .sort((a, b) => a.platform.sort_order - b.platform.sort_order)
      .map((link) => ({
        platformId: link.platform_id,
        label: link.platform.label,
        url: link.url
      })),
    soundSystems: data.venue_sound_systems
      .map((tag) => tag.sound_system)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((soundSystem) => ({ id: soundSystem.id, name: soundSystem.name }))
  };
};
