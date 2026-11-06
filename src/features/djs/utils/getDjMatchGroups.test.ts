import { describe, expect, it } from "vitest";

import type { DjMatchT } from "../djs.types";
import { getDjMatchGroups } from "./getDjMatchGroups";

const mockChicago = {
  id: 4887398,
  name: "Chicago",
  admin1Name: "Illinois",
  countryCode: "US"
};
const mockExactWithCity: DjMatchT = {
  shortId: "aaaaaaaa",
  name: "DJ Rush",
  city: mockChicago,
  linkLabels: ["SoundCloud"],
  isExact: true
};
const mockExactNoCity: DjMatchT = {
  shortId: "bbbbbbbb",
  name: "dj rush",
  city: null,
  linkLabels: [],
  isExact: true
};
const mockNear: DjMatchT = {
  shortId: "cccccccc",
  name: "Rush",
  city: null,
  linkLabels: [],
  isExact: false
};

describe("getDjMatchGroups", () => {
  it("returns empty groups and no required city for no matches", () => {
    const result = getDjMatchGroups([]);

    expect(result).toEqual({ exact: [], near: [], isCityRequired: false });
  });

  it("keeps the city optional when every exact match has a city", () => {
    const result = getDjMatchGroups([mockExactWithCity, mockNear]);

    expect(result).toEqual({
      exact: [mockExactWithCity],
      near: [mockNear],
      isCityRequired: false
    });
  });

  it("requires a city when an exact match has none", () => {
    const result = getDjMatchGroups([mockExactWithCity, mockExactNoCity]);

    expect(result).toEqual({
      exact: [mockExactWithCity, mockExactNoCity],
      near: [],
      isCityRequired: true
    });
  });

  it("does not require a city for a near match with none", () => {
    const result = getDjMatchGroups([mockNear]);

    expect(result).toEqual({ exact: [], near: [mockNear], isCityRequired: false });
  });
});
