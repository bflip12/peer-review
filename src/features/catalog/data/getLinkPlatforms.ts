import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { LinkPlatformT } from "../catalog.types";

/** Which form a link platform list is for, by its `link_platforms` flag. */
export type CatalogKindT = "venue" | "artist" | "collective";

const KIND_COLUMNS = {
  venue: "is_for_venues",
  artist: "is_for_artists",
  collective: "is_for_collectives"
} as const satisfies Readonly<Record<CatalogKindT, string>>;

/**
 * The link fields a venue, DJ, or collective form shows, in form order. A seeded lookup
 * everyone can read, so a new platform shows up in the forms without a code change.
 */
export const getLinkPlatforms = async (
  supabase: SupabaseClientT,
  kind: CatalogKindT
): Promise<LinkPlatformT[]> => {
  const { data, error } = await supabase
    .from("link_platforms")
    .select("id, label, allowed_hosts")
    .eq(KIND_COLUMNS[kind], true)
    .order("sort_order");
  if (error) {
    throw error;
  }
  return data.map((platform) => ({
    id: platform.id,
    label: platform.label,
    allowedHosts: platform.allowed_hosts
  }));
};
