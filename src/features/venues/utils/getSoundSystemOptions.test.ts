import { describe, expect, it } from "vitest";

import type { SoundSystemT } from "../venues.types";
import { getSoundSystemOptions } from "./getSoundSystemOptions";

const mockFunktionOne: SoundSystemT = { id: "funktion_one", name: "Funktion-One" };
const mockDanley: SoundSystemT = { id: "danley", name: "Danley" };

describe("getSoundSystemOptions", () => {
  it("returns nothing for an empty query and no results", () => {
    const result = getSoundSystemOptions({ results: [], selected: [], query: "  " });

    expect(result).toEqual([]);
  });

  it("lists the brands found, then offers to add the typed name", () => {
    const result = getSoundSystemOptions({
      results: [mockFunktionOne],
      selected: [],
      query: " funk "
    });

    expect(result).toEqual([
      { kind: "brand", brand: mockFunktionOne },
      { kind: "add", name: "funk" }
    ]);
  });

  it("does not offer to add a name that folds to a brand found", () => {
    const result = getSoundSystemOptions({
      results: [mockFunktionOne],
      selected: [],
      query: "funktion one"
    });

    expect(result).toEqual([{ kind: "brand", brand: mockFunktionOne }]);
  });

  it("leaves out brands already picked, and does not offer to add one again", () => {
    const result = getSoundSystemOptions({
      results: [mockFunktionOne, mockDanley],
      selected: [mockDanley],
      query: "danley"
    });

    expect(result).toEqual([{ kind: "brand", brand: mockFunktionOne }]);
  });

  it("offers only to add a name nothing matches", () => {
    const result = getSoundSystemOptions({
      results: [],
      selected: [],
      query: "Pioneer Pro Audio"
    });

    expect(result).toEqual([{ kind: "add", name: "Pioneer Pro Audio" }]);
  });

  it("does not offer to add punctuation only", () => {
    const result = getSoundSystemOptions({ results: [], selected: [], query: "--" });

    expect(result).toEqual([]);
  });
});
