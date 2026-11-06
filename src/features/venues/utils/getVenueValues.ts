import type { VenueInputT, VenueT } from "../venues.types";

/** A venue's editable values, in the shape the form sends, for `getVenueChanges`. */
export const getVenueValues = (venue: VenueT): VenueInputT => ({
  name: venue.name,
  cityId: venue.city.id,
  links: Object.fromEntries(venue.links.map((link) => [link.platformId, link.url])),
  soundSystemIds: venue.soundSystems.map((soundSystem) => soundSystem.id)
});
