/** What the comparison reads from a sound system row. */
export type SoundSystemOrderT = { name: string; sort_order: number | null };

/**
 * Sorts sound system brands as the venue form and page list them: the seeded brands by
 * their sort order, then brands users added (no sort order, ADR 0026) by name.
 */
export const compareSoundSystems = (
  a: SoundSystemOrderT,
  b: SoundSystemOrderT
): number => {
  if (a.sort_order !== null && b.sort_order !== null) {
    return a.sort_order - b.sort_order;
  }
  if (a.sort_order !== null) {
    return -1;
  }
  if (b.sort_order !== null) {
    return 1;
  }
  return a.name.localeCompare(b.name);
};
