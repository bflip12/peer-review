/** A link field on a venue, DJ, or collective form: a platform from `link_platforms`. */
export type LinkPlatformT = {
  /** The platform's text ID, such as `instagram`. Also the form field's key. */
  id: string;
  label: string;
  /** Hosts a link may use. `*.` at the start matches any subdomain. Empty accepts any. */
  allowedHosts: string[];
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

/** A city as a venue or DJ shows it. */
export type CityT = {
  id: number;
  name: string;
  admin1Name: string | null;
  countryCode: string;
};

/** A link on a venue, DJ, or collective, by platform. */
export type EntryLinkT = {
  platformId: string;
  label: string;
  url: string;
};
