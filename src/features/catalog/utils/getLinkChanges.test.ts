import { describe, expect, it } from "vitest";

import { getLinkChanges } from "./getLinkChanges";

const mockLinks = {
  instagram: "https://instagram.com/djrush",
  website: "https://djrush.com"
};

describe("getLinkChanges", () => {
  it("returns no writes when nothing is set either side", () => {
    const result = getLinkChanges({}, {});

    expect(result).toEqual({ linksToInsert: [], linksToUpdate: [], linksToDelete: [] });
  });

  it("returns no writes when the links are the same", () => {
    const result = getLinkChanges(mockLinks, { ...mockLinks });

    expect(result).toEqual({ linksToInsert: [], linksToUpdate: [], linksToDelete: [] });
  });

  it("inserts a new platform, updates a changed URL, and deletes a cleared one", () => {
    const result = getLinkChanges(mockLinks, {
      instagram: "https://instagram.com/dj.rush",
      soundcloud: "https://soundcloud.com/djrush"
    });

    expect(result).toEqual({
      linksToInsert: [{ platformId: "soundcloud", url: "https://soundcloud.com/djrush" }],
      linksToUpdate: [{ platformId: "instagram", url: "https://instagram.com/dj.rush" }],
      linksToDelete: ["website"]
    });
  });
});
