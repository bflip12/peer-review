import type { CityOptionT, CityT } from "../venues.types";

/**
 * How a city reads in the picker and on a venue page.
 *
 * - `name`: the city's main name, with the name the search matched in brackets when it
 *   differs: "Köln (Cologne)". A match on the ASCII form ("Koln") adds nothing.
 * - `region`: the region and country code, "North Rhine-Westphalia, DE", or the country
 *   code alone when GeoNames has no region. It tells apart cities with the same name.
 */
export const getCityLabel = (
  city: CityT & Partial<Pick<CityOptionT, "matchedName">>
): { name: string; region: string } => {
  const isOtherName =
    city.matchedName !== undefined &&
    city.matchedName.localeCompare(city.name, undefined, { sensitivity: "base" }) !== 0;
  return {
    name: isOtherName ? `${city.name} (${city.matchedName})` : city.name,
    region: [city.admin1Name, city.countryCode].filter(Boolean).join(", ")
  };
};
