import { describe, expect, it } from "vitest";

import type { CityOptionT } from "../catalog.types";
import { getCityLabel } from "./getCityLabel";

const mockKoln: CityOptionT = {
  id: 2886242,
  name: "Köln",
  admin1Name: "North Rhine-Westphalia",
  countryCode: "DE",
  matchedName: "Köln"
};

describe("getCityLabel", () => {
  it("shows the main name and the region with the country code", () => {
    const result = getCityLabel(mockKoln);

    expect(result).toEqual({ name: "Köln", region: "North Rhine-Westphalia, DE" });
  });

  it("adds the matched name in brackets when it is another name", () => {
    const result = getCityLabel({ ...mockKoln, matchedName: "Cologne" });

    expect(result).toEqual({
      name: "Köln (Cologne)",
      region: "North Rhine-Westphalia, DE"
    });
  });

  it("adds nothing when the match was the ASCII form", () => {
    const result = getCityLabel({ ...mockKoln, matchedName: "Koln" });

    expect(result).toEqual({ name: "Köln", region: "North Rhine-Westphalia, DE" });
  });

  it("shows only the country code when there is no region", () => {
    const result = getCityLabel({ ...mockKoln, admin1Name: null });

    expect(result).toEqual({ name: "Köln", region: "DE" });
  });

  it("shows the main name for a city with no matched name", () => {
    const city = {
      id: mockKoln.id,
      name: mockKoln.name,
      admin1Name: mockKoln.admin1Name,
      countryCode: mockKoln.countryCode
    };

    const result = getCityLabel(city);

    expect(result).toEqual({ name: "Köln", region: "North Rhine-Westphalia, DE" });
  });
});
