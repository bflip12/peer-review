// @vitest-environment node
import { describe, expect, it } from "vitest";

import { getRouteName } from "./getRouteName";

describe("getRouteName", () => {
  it("names the root route home", () => {
    const result = getRouteName("/");

    expect(result).toBe("home");
  });

  it("joins path segments with dashes", () => {
    const result = getRouteName("/venues/abc-berghain");

    expect(result).toBe("venues-abc-berghain");
  });

  it("ignores a trailing slash and surrounding whitespace", () => {
    const result = ["/venues/", "  /venues  "].map(getRouteName);

    expect(result).toEqual(["venues", "venues"]);
  });

  it("turns a query string into part of the name", () => {
    const result = getRouteName("/search?q=Funktion One");

    expect(result).toBe("search-q-funktion-one");
  });

  it("lowercases and keeps only letters, digits, dashes, and underscores", () => {
    const result = getRouteName("/DJs/Ben_Klock/Köln");

    expect(result).toBe("djs-ben_klock-k-ln");
  });
});
