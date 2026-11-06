import type { CityT, EntryLinkT } from "@/features/catalog/catalog.types";

/** A DJ with everything their page shows. */
export type DjT = {
  id: string;
  shortId: string;
  name: string;
  /** Where the DJ is based. Null when nobody has said. */
  city: CityT | null;
  links: EntryLinkT[];
};

/** The DJ form's input, after `getDjSchema`. */
export type DjInputT = {
  name: string;
  /** Null when the field is left empty: the city is not known. */
  cityId: number | null;
  /** URLs by platform ID. A platform left empty is not in the record. */
  links: Record<string, string>;
};

/** A DJ the duplicate check found, from `search_artists`. */
export type DjMatchT = {
  shortId: string;
  name: string;
  city: CityT | null;
  /** The labels of the sites the DJ has links on, in form order: "Instagram". */
  linkLabels: string[];
  /** The same name ignoring case and surrounding spaces, rather than a similar one. */
  isExact: boolean;
};
