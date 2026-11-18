import { describe, expect, it } from "vitest";

import { foldBrand } from "./foldBrand";

describe("foldBrand", () => {
  it("returns an empty string for empty input", () => {
    const result = foldBrand("");

    expect(result).toBe("");
  });

  it("folds case, spaces, and hyphens to one form", () => {
    const result = [
      foldBrand("Funktion One"),
      foldBrand("funktion-one"),
      foldBrand("FUNKTION-ONE")
    ];

    expect(result).toEqual(["funktionone", "funktionone", "funktionone"]);
  });

  it("drops accents, an ampersand, and surrounding whitespace", () => {
    const result = foldBrand("  d&b Audiotéchnik ");

    expect(result).toBe("dbaudiotechnik");
  });

  it("returns an empty string for punctuation only", () => {
    const result = foldBrand("--");

    expect(result).toBe("");
  });
});
