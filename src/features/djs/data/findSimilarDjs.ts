import "server-only";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { DjMatchT } from "../djs.types";

// Room for a few DJs with the same name in different cities, then the near matches.
const MAX_SIMILAR_DJS = 8;

/**
 * DJs like the one being added (`search_artists`): those with exactly the typed name in
 * any city first, then similar names in the picked city or with no city. Each comes with
 * their city and the labels of the sites they have links on. Signed-in users only, as is
 * adding a DJ.
 */
export const findSimilarDjs = async (
  supabase: SupabaseClientT,
  {
    query,
    cityId,
    platforms
  }: { query: string; cityId: number | null; platforms: LinkPlatformT[] }
): Promise<DjMatchT[]> => {
  const { data, error } = await supabase.rpc("search_artists", {
    query,
    // The generated type leaves out null, which the function takes for no city.
    city_id: cityId as number,
    max_results: MAX_SIMILAR_DJS
  });
  if (error) {
    throw error;
  }
  const labels = new Map(platforms.map((platform) => [platform.id, platform.label]));
  return data.map((artist) => {
    // The generated types say these are set, but they are null for a DJ with no city.
    const cityId = artist.home_city_id as number | null;
    return {
      shortId: artist.short_id,
      name: artist.name,
      city:
        cityId === null
          ? null
          : {
              id: cityId,
              name: artist.home_city_name,
              admin1Name: (artist.home_city_admin1_name) ?? null,
              countryCode: artist.home_city_country_code
            },
      linkLabels: artist.link_platform_ids.flatMap((id) => {
        const label = labels.get(id);
        return label ? [label] : [];
      }),
      isExact: artist.is_exact
    };
  });
};
