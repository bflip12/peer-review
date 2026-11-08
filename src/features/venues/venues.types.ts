import type { CityT, EntryLinkT, LinkPlatformT } from "@/features/catalog/catalog.types";

/** A sound system brand a venue can be tagged with. */
export type SoundSystemT = {
  id: string;
  name: string;
};

/** What the venue form offers: its link fields and sound system tags, in form order. */
export type VenueFormOptionsT = {
  platforms: LinkPlatformT[];
  soundSystems: SoundSystemT[];
};

/** A venue with everything its page shows. */
export type VenueT = {
  id: string;
  shortId: string;
  name: string;
  city: CityT;
  links: EntryLinkT[];
  soundSystems: SoundSystemT[];
};

/** The venue form's input, after `getVenueSchema`. */
export type VenueInputT = {
  name: string;
  cityId: number;
  /** URLs by platform ID. A platform left empty is not in the record. */
  links: Record<string, string>;
  soundSystemIds: string[];
};

/** A venue with a name like the one being added, for the duplicate check. */
export type SimilarVenueT = {
  shortId: string;
  name: string;
};
