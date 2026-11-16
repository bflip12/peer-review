import { toSlug } from "@/features/catalog/utils/toSlug";

// Used when the name gives no letters or digits, so the URL still has a slug.
const FALLBACK_SLUG = "dj";

/**
 * A DJ page's path, `/djs/<short_id>/<name>` (`docs/DATA_MODEL.md`, URLs). URLs show
 * the name only, never the city (ADR 0011). The short ID finds the DJ; the slug is built
 * from the current name each time.
 */
export const getDjPath = (dj: { shortId: string; name: string }): string =>
  `/djs/${dj.shortId}/${toSlug([dj.name]) || FALLBACK_SLUG}`;
