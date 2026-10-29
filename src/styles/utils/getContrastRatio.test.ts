import { describe, expect, it } from "vitest";

import { getContrastRatio } from "./getContrastRatio";

describe("getContrastRatio", () => {
  it("returns 21 for black on white", () => {
    const result = getContrastRatio("#000000", "#FFFFFF");

    expect(result).toBeCloseTo(21, 5);
  });

  it("returns 1 for a color on itself", () => {
    const result = getContrastRatio("#5D5A54", "#5D5A54");

    expect(result).toBe(1);
  });

  it("returns the same ratio whichever color comes first", () => {
    const result = [
      getContrastRatio("#191816", "#F2F0EB"),
      getContrastRatio("#F2F0EB", "#191816")
    ];

    expect(result[0]).toBe(result[1]);
  });

  it("matches a ratio computed by hand from the WCAG formula", () => {
    const result = getContrastRatio("#5D5A54", "#F2F0EB");

    expect(result).toBeCloseTo(6.03, 2);
  });

  it("reads lowercase hex and ignores surrounding whitespace", () => {
    const result = getContrastRatio(" #f2f0eb ", "#F2F0EB");

    expect(result).toBe(1);
  });

  it("throws on an empty string, a short hex, or a named color", () => {
    const result = ["", "#FFF", "white"].map(
      (color) => () => getContrastRatio(color, "#000000")
    );

    result.forEach((call) => expect(call).toThrow("is not a six-digit hex color"));
  });
});
