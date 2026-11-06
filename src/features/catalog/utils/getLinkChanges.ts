/** The link writes an edit makes. Empty lists mean nothing to do. */
export type LinkChangesT = {
  linksToInsert: { platformId: string; url: string }[];
  linksToUpdate: { platformId: string; url: string }[];
  linksToDelete: string[];
};

/**
 * The link writes that turn an entry's current links into the edited ones, both as URLs
 * by platform ID, in platform ID order. A link whose URL changes is updated in place, so
 * it is one catalog edit, not a removal and an addition. Unchanged links write nothing.
 */
export const getLinkChanges = (
  current: Record<string, string>,
  next: Record<string, string>
): LinkChangesT => {
  const platformIds = new Set([...Object.keys(current), ...Object.keys(next)]);
  const changes: LinkChangesT = {
    linksToInsert: [],
    linksToUpdate: [],
    linksToDelete: []
  };
  for (const platformId of [...platformIds].sort()) {
    const before = current[platformId];
    const after = next[platformId];
    if (before === undefined && after !== undefined) {
      changes.linksToInsert.push({ platformId, url: after });
    } else if (before !== undefined && after === undefined) {
      changes.linksToDelete.push(platformId);
    } else if (before !== undefined && after !== undefined && before !== after) {
      changes.linksToUpdate.push({ platformId, url: after });
    }
  }
  return changes;
};
