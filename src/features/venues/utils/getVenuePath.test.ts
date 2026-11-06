import { describe, expect, it } from "vitest";

import { getVenuePath } from "./getVenuePath";

describe("getVenuePath", () => {
  it("puts the short ID before a slug of the name and city", () => {
    const result = getVenuePath({
      shortId: "a2b3c4d5",
      name: "Tresor",
      cityName: "Berlin"
    });

    expect(result).toBe("/venues/a2b3c4d5/tresor-berlin");
  });

  it("falls back to 'venue' when the name and city give no slug", () => {
    const result = getVenuePath({ shortId: "a2b3c4d5", name: "!!!", cityName: "" });

    expect(result).toBe("/venues/a2b3c4d5/venue");
  });
});
