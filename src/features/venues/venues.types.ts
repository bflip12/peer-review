/** A link field on the venue form: a platform from `link_platforms` that venues offer. */
export type LinkPlatformT = {
  /** The platform's text ID, such as `instagram`. Also the form field's key. */
  id: string;
  label: string;
  /** Hosts a link may use. `*.` at the start matches any subdomain. Empty accepts any. */
  allowedHosts: string[];
};

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

/** A city in the picker's results, from `search_cities`. */
export type CityOptionT = {
  id: number;
  name: string;
  /** Null when GeoNames has no region, though the generated type says string. */
  admin1Name: string | null;
  countryCode: string;
  /** The name the query matched: the main name, its ASCII form, or another name. */
  matchedName: string;
};

/** A city as a venue shows it. */
export type CityT = {
  id: number;
  name: string;
  admin1Name: string | null;
  countryCode: string;
};

/** A venue link, by platform. */
export type VenueLinkT = {
  platformId: string;
  label: string;
  url: string;
};

/** A venue with everything its page shows. */
export type VenueT = {
  id: string;
  shortId: string;
  name: string;
  city: CityT;
  links: VenueLinkT[];
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
