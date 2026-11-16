import type { DjMatchT } from "../djs.types";

/** The duplicate check's results, split the way the DJ form shows them. */
export type DjMatchGroupsT = {
  /** DJs with exactly the typed name, in any city. */
  exact: DjMatchT[];
  /** DJs with a similar name, in the picked city or with no city. */
  near: DjMatchT[];
  /**
   * Whether the new DJ needs a city: a DJ with exactly this name has none, so the
   * database would refuse a second one without a city (ADR 0011).
   */
  isCityRequired: boolean;
};

/** Splits the duplicate check's results into exact and near matches, in their order. */
export const getDjMatchGroups = (matches: DjMatchT[]): DjMatchGroupsT => {
  const exact = matches.filter((match) => match.isExact);
  return {
    exact,
    near: matches.filter((match) => !match.isExact),
    isCityRequired: exact.some((match) => match.city === null)
  };
};
