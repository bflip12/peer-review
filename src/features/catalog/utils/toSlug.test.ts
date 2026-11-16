import { describe, expect, it } from "vitest";

import { toSlug } from "./toSlug";

describe("toSlug", () => {
  it("returns an empty string for no parts", () => {
    const result = toSlug([]);

    expect(result).toBe("");
  });

  it("joins the parts with hyphens, in lowercase", () => {
    const result = toSlug(["Tresor", "Berlin"]);

    expect(result).toBe("tresor-berlin");
  });

  it("drops accents", () => {
    const result = toSlug(["Gewölbe", "Köln"]);

    expect(result).toBe("gewolbe-koln");
  });

  it("turns runs of spaces and punctuation into one hyphen and trims the ends", () => {
    const result = toSlug(["  ://about blank! ", "Berlin"]);

    expect(result).toBe("about-blank-berlin");
  });

  it("keeps letters from other scripts", () => {
    const result = toSlug(["Мутабор", "Москва"]);

    expect(result).toBe("мутабор-москва");
  });

  it("returns an empty string for punctuation only", () => {
    const result = toSlug(["!!!"]);

    expect(result).toBe("");
  });
});
