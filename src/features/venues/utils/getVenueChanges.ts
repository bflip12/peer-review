import type { LinkChangesT } from "@/features/catalog/utils/getLinkChanges";
import { getLinkChanges } from "@/features/catalog/utils/getLinkChanges";

import type { VenueInputT } from "../venues.types";

/** A venue's editable values, as the edit form starts with them. */
export type VenueValuesT = VenueInputT;

/** What an edit changes, as the writes that make it. Empty lists mean nothing to do. */
export type VenueChangesT = LinkChangesT & {
  /** The changed columns of the venue row, or null when name and city stay. */
  venue: { name?: string; city_id?: number } | null;
  soundSystemsToAdd: string[];
  soundSystemsToRemove: string[];
};

/**
 * The writes that turn a venue's current values into the edited ones. Only what differs
 * is written, so each write is one catalog edit and an unchanged form writes nothing. A
 * link whose URL changes is updated in place, so it is one edit, not a removal and an
 * addition.
 */
export const getVenueChanges = (
  current: VenueValuesT,
  next: VenueInputT
): VenueChangesT => {
  const venue: { name?: string; city_id?: number } = {};
  if (next.name !== current.name) {
    venue.name = next.name;
  }
  if (next.cityId !== current.cityId) {
    venue.city_id = next.cityId;
  }

  const currentTags = new Set(current.soundSystemIds);
  const nextTags = new Set(next.soundSystemIds);
  return {
    venue: Object.keys(venue).length > 0 ? venue : null,
    ...getLinkChanges(current.links, next.links),
    soundSystemsToAdd: [...nextTags].filter((id) => !currentTags.has(id)).sort(),
    soundSystemsToRemove: [...currentTags].filter((id) => !nextTags.has(id)).sort()
  };
};
