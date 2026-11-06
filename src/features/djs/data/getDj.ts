import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { DjT } from "../djs.types";

// The same alphabet as private.new_short_id (migration create_venues). Anything else
// cannot be a short ID, so it is not sent to the database.
const SHORT_ID_PATTERN = /^[2-9a-hjkmnp-z]{8}$/;

/**
 * A DJ by their short ID, with their city (null when not known) and links in form
 * order. Null when no DJ has the ID, or RLS hides them (a hidden DJ).
 */
export const getDj = async (
  supabase: SupabaseClientT,
  shortId: string
): Promise<DjT | null> => {
  if (!SHORT_ID_PATTERN.test(shortId)) {
    return null;
  }
  const { data, error } = await supabase
    .from("artists")
    .select(
      `id, short_id, name,
      city:cities (id, name, admin1_name, country_code),
      links (platform_id, url, platform:link_platforms!inner (label, sort_order))`
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
    city: data.city
      ? {
          id: data.city.id,
          name: data.city.name,
          admin1Name: data.city.admin1_name,
          countryCode: data.city.country_code
        }
      : null,
    links: [...data.links]
      .sort((a, b) => a.platform.sort_order - b.platform.sort_order)
      .map((link) => ({
        platformId: link.platform_id,
        label: link.platform.label,
        url: link.url
      }))
  };
};
