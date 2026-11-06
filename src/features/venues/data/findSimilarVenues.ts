import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { SimilarVenueT } from "../venues.types";

// A short list: the point is to catch the venue already there, not to browse.
const MAX_SIMILAR_VENUES = 5;

/**
 * Venues in a city with a name like the one being added, closest first, so "Tresor"
 * finds "Tresor Club" before a second entry is created (`search_venues`). Signed-in
 * users only, as is adding a venue.
 */
export const findSimilarVenues = async (
  supabase: SupabaseClientT,
  query: string,
  cityId: number
): Promise<SimilarVenueT[]> => {
  const { data, error } = await supabase.rpc("search_venues", {
    query,
    city_id: cityId,
    max_results: MAX_SIMILAR_VENUES
  });
  if (error) {
    throw error;
  }
  return data.map((venue) => ({ shortId: venue.short_id, name: venue.name }));
};
