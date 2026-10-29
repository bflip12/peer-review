import { describe, expect, it } from "vitest";

import { getTokenHashParam } from "./getTokenHashParam";

describe("getTokenHashParam", () => {
  it("returns the token hash of a sign-in link", () => {
    const result = getTokenHashParam({ token_hash: "abc123", type: "email" });

    expect(result).toBe("abc123");
  });

  it("returns null when the link has no query", () => {
    const result = getTokenHashParam({});

    expect(result).toBeNull();
  });

  it("returns null without a type, or with another type", () => {
    const result = [
      { token_hash: "abc123" },
      { token_hash: "abc123", type: "recovery" }
    ].map(getTokenHashParam);

    expect(result).toEqual([null, null]);
  });

  it("returns null when a parameter repeats", () => {
    const result = getTokenHashParam({ token_hash: ["abc123", "def456"], type: "email" });

    expect(result).toBeNull();
  });
});
