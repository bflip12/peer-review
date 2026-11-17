import { describe, expect, it } from "vitest";

import { compareSoundSystems } from "./compareSoundSystems";

const mockOther = { name: "Other", sort_order: 1000 };
const mockFunktionOne = { name: "Funktion-One", sort_order: 10 };
const mockPioneer = { name: "Pioneer Pro Audio", sort_order: null };
const mockAlcons = { name: "Alcons", sort_order: null };

describe("compareSoundSystems", () => {
  it("returns an empty list for no brands", () => {
    const result = [].sort(compareSoundSystems);

    expect(result).toEqual([]);
  });

  it("puts seeded brands in their sort order, then user-added ones by name", () => {
    const result = [mockPioneer, mockOther, mockAlcons, mockFunktionOne]
      .sort(compareSoundSystems)
      .map((brand) => brand.name);

    expect(result).toEqual(["Funktion-One", "Other", "Alcons", "Pioneer Pro Audio"]);
  });

  it("keeps a single brand", () => {
    const result = [mockPioneer].sort(compareSoundSystems);

    expect(result).toEqual([mockPioneer]);
  });
});
