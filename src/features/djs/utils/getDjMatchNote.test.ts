import { describe, expect, it } from "vitest";

import { getDjMatchNote } from "./getDjMatchNote";

const mockChicago = {
  id: 4887398,
  name: "Chicago",
  admin1Name: "Illinois",
  countryCode: "US"
};

describe("getDjMatchNote", () => {
  it("joins the city, region, and link sites", () => {
    const result = getDjMatchNote({
      city: mockChicago,
      linkLabels: ["SoundCloud", "Instagram"]
    });

    expect(result).toBe("Chicago, Illinois, US · SoundCloud, Instagram");
  });

  it("uses the country code alone for a city with no region", () => {
    const result = getDjMatchNote({
      city: { id: 1880252, name: "Singapore", admin1Name: null, countryCode: "SG" },
      linkLabels: ["Website"]
    });

    expect(result).toBe("Singapore, SG · Website");
  });

  it("says when a DJ has no city and no links", () => {
    const result = getDjMatchNote({ city: null, linkLabels: [] });

    expect(result).toBe("No city yet · No links yet");
  });
});
