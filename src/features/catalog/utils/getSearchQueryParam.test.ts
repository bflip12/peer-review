import { describe, expect, it } from "vitest";

import { getSearchQueryParam } from "./getSearchQueryParam";

describe("getSearchQueryParam", () => {
  it("returns null when q is missing", () => {
    const result = getSearchQueryParam(new URLSearchParams());

    expect(result).toBeNull();
  });

  it("returns null when q is blank", () => {
    const result = getSearchQueryParam(new URLSearchParams({ q: "   " }));

    expect(result).toBeNull();
  });

  it("returns q trimmed", () => {
    const result = getSearchQueryParam(new URLSearchParams({ q: "  köln " }));

    expect(result).toBe("köln");
  });

  it("returns null when q is over 100 characters", () => {
    const result = getSearchQueryParam(new URLSearchParams({ q: "a".repeat(101) }));

    expect(result).toBeNull();
  });
});
