import { describe, expect, it } from "vitest";

import { getDjPath } from "./getDjPath";

describe("getDjPath", () => {
  it("builds the path from the short ID and the name only", () => {
    const result = getDjPath({ shortId: "k7m2p9qx", name: "DJ Stingray 313" });

    expect(result).toBe("/djs/k7m2p9qx/dj-stingray-313");
  });

  it("drops accents", () => {
    const result = getDjPath({ shortId: "k7m2p9qx", name: "Héctor Oaks" });

    expect(result).toBe("/djs/k7m2p9qx/hector-oaks");
  });

  it("uses dj as the slug when the name has no letters or digits", () => {
    const result = getDjPath({ shortId: "k7m2p9qx", name: "+++" });

    expect(result).toBe("/djs/k7m2p9qx/dj");
  });
});
