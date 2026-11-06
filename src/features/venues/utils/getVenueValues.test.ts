import { describe, expect, it } from "vitest";

import type { VenueT } from "../venues.types";
import { getVenueValues } from "./getVenueValues";

const mockVenue: VenueT = {
  id: "8d7f0c3e-0000-4000-8000-000000000000",
  shortId: "a2b3c4d5",
  name: "Tresor",
  city: { id: 2950159, name: "Berlin", admin1Name: "State of Berlin", countryCode: "DE" },
  links: [
    {
      platformId: "instagram",
      label: "Instagram",
      url: "https://instagram.com/tresorberlin"
    },
    { platformId: "website", label: "Website", url: "https://tresorberlin.com" }
  ],
  soundSystems: [{ id: "funktion_one", name: "Funktion-One" }]
};

describe("getVenueValues", () => {
  it("returns the name, city ID, links by platform, and sound system IDs", () => {
    const result = getVenueValues(mockVenue);

    expect(result).toEqual({
      name: "Tresor",
      cityId: 2950159,
      links: {
        instagram: "https://instagram.com/tresorberlin",
        website: "https://tresorberlin.com"
      },
      soundSystemIds: ["funktion_one"]
    });
  });

  it("returns empty links and tags for a venue with none", () => {
    const result = getVenueValues({ ...mockVenue, links: [], soundSystems: [] });

    expect(result).toEqual({
      name: "Tresor",
      cityId: 2950159,
      links: {},
      soundSystemIds: []
    });
  });
});
