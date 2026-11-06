import type { VenueInputT } from "../venues.types";

/** A venue's editable values, as the edit form starts with them. */
export type VenueValuesT = VenueInputT;

/** What an edit changes, as the writes that make it. Empty lists mean nothing to do. */
export type VenueChangesT = {
  /** The changed columns of the venue row, or null when name and city stay. */
  venue: { name?: string; city_id?: number } | null;
  linksToInsert: { platformId: string; url: string }[];
  linksToUpdate: { platformId: string; url: string }[];
  linksToDelete: string[];
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

  const platformIds = new Set([
    ...Object.keys(current.links),
    ...Object.keys(next.links)
  ]);
  const linksToInsert: VenueChangesT["linksToInsert"] = [];
  const linksToUpdate: VenueChangesT["linksToUpdate"] = [];
  const linksToDelete: string[] = [];
  for (const platformId of [...platformIds].sort()) {
    const before = current.links[platformId];
    const after = next.links[platformId];
    if (before === undefined && after !== undefined) {
      linksToInsert.push({ platformId, url: after });
    } else if (before !== undefined && after === undefined) {
      linksToDelete.push(platformId);
    } else if (before !== undefined && after !== undefined && before !== after) {
      linksToUpdate.push({ platformId, url: after });
    }
  }

  const currentTags = new Set(current.soundSystemIds);
  const nextTags = new Set(next.soundSystemIds);
  return {
    venue: Object.keys(venue).length > 0 ? venue : null,
    linksToInsert,
    linksToUpdate,
    linksToDelete,
    soundSystemsToAdd: [...nextTags].filter((id) => !currentTags.has(id)).sort(),
    soundSystemsToRemove: [...currentTags].filter((id) => !nextTags.has(id)).sort()
  };
};
