import type { LinkChangesT } from "@/features/catalog/utils/getLinkChanges";
import { getLinkChanges } from "@/features/catalog/utils/getLinkChanges";

import type { DjInputT } from "../djs.types";

/** What a DJ edit changes, as the writes that make it. */
export type DjChangesT = LinkChangesT & {
  /** The changed columns of the DJ's row, or null when name and city stay. */
  artist: { name?: string; city_id?: number | null } | null;
};

/**
 * The writes that turn a DJ's current values into the edited ones. Only what differs is
 * written, so each write is one catalog edit and an unchanged form writes nothing.
 * Clearing the city writes `city_id: null`.
 */
export const getDjChanges = (current: DjInputT, next: DjInputT): DjChangesT => {
  const artist: { name?: string; city_id?: number | null } = {};
  if (next.name !== current.name) {
    artist.name = next.name;
  }
  if (next.cityId !== current.cityId) {
    artist.city_id = next.cityId;
  }
  return {
    artist: Object.keys(artist).length > 0 ? artist : null,
    ...getLinkChanges(current.links, next.links)
  };
};
