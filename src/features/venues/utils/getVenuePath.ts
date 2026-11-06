import { toSlug } from "@/features/catalog/utils/toSlug";

// Used when the name and city give no letters or digits, so the URL still has a slug.
const FALLBACK_SLUG = "venue";

/**
 * A venue page's path, `/venues/<short_id>/<name-city>` (`docs/DATA_MODEL.md`, URLs). The
 * short ID finds the venue; the slug is built from the current name and city each time.
 */
export const getVenuePath = (venue: {
  shortId: string;
  name: string;
  cityName: string;
}): string =>
  `/venues/${venue.shortId}/${toSlug([venue.name, venue.cityName]) || FALLBACK_SLUG}`;
