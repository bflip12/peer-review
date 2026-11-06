import { describe, expect, it } from "vitest";

import type { VenueValuesT } from "./getVenueChanges";
import { getVenueChanges } from "./getVenueChanges";

const mockVenue: VenueValuesT = {
  name: "Tresor",
  cityId: 2950159,
  links: {
    instagram: "https://instagram.com/tresorberlin",
    website: "https://tresorberlin.com"
  },
  soundSystemIds: ["funktion_one"]
};

const mockNoChanges = {
  venue: null,
  linksToInsert: [],
  linksToUpdate: [],
  linksToDelete: [],
  soundSystemsToAdd: [],
  soundSystemsToRemove: []
};

describe("getVenueChanges", () => {
  it("returns no writes when nothing changed", () => {
    const result = getVenueChanges(mockVenue, mockVenue);

    expect(result).toEqual(mockNoChanges);
  });

  it("returns no writes for a venue with nothing set either side", () => {
    const empty = { name: "Tresor", cityId: 1, links: {}, soundSystemIds: [] };

    const result = getVenueChanges(empty, empty);

    expect(result).toEqual(mockNoChanges);
  });

  it("writes only the venue columns that changed", () => {
    const result = getVenueChanges(mockVenue, { ...mockVenue, name: "Tresor Berlin" });

    expect(result).toEqual({ ...mockNoChanges, venue: { name: "Tresor Berlin" } });
  });

  it("writes the name and the city when both changed", () => {
    const result = getVenueChanges(mockVenue, {
      ...mockVenue,
      name: "Gewölbe",
      cityId: 2886242
    });

    expect(result).toEqual({
      ...mockNoChanges,
      venue: { name: "Gewölbe", city_id: 2886242 }
    });
  });

  it("inserts a new link, updates a changed one, and deletes a removed one", () => {
    const result = getVenueChanges(mockVenue, {
      ...mockVenue,
      links: {
        instagram: "https://www.instagram.com/tresor",
        resident_advisor: "https://ra.co/clubs/5031"
      }
    });

    expect(result).toEqual({
      ...mockNoChanges,
      linksToInsert: [
        { platformId: "resident_advisor", url: "https://ra.co/clubs/5031" }
      ],
      linksToUpdate: [
        { platformId: "instagram", url: "https://www.instagram.com/tresor" }
      ],
      linksToDelete: ["website"]
    });
  });

  it("adds and removes sound systems, ignoring duplicates", () => {
    const result = getVenueChanges(mockVenue, {
      ...mockVenue,
      soundSystemIds: ["void_acoustics", "danley", "danley"]
    });

    expect(result).toEqual({
      ...mockNoChanges,
      soundSystemsToAdd: ["danley", "void_acoustics"],
      soundSystemsToRemove: ["funktion_one"]
    });
  });
});
