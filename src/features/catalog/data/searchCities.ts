import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { CityOptionT } from "../catalog.types";

// Enough to fill the picker's list on a phone without scrolling far.
const MAX_CITY_RESULTS = 8;

/**
 * Cities for the city picker, best match first (`search_cities`, `docs/DATA_MODEL.md`).
 * Under 2 characters the database returns nothing.
 */
export const searchCities = async (
  supabase: SupabaseClientT,
  query: string
): Promise<CityOptionT[]> => {
  const { data, error } = await supabase.rpc("search_cities", {
    query,
    max_results: MAX_CITY_RESULTS
  });
  if (error) {
    throw error;
  }
  return data.map((city) => ({
    id: city.id,
    name: city.name,
    // The generated type says string, but the column is null when GeoNames has no region.
    admin1Name: (city.admin1_name as string | null) ?? null,
    countryCode: city.country_code,
    matchedName: city.matched_name
  }));
};
