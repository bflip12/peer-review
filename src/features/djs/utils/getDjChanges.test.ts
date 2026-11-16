import { describe, expect, it } from "vitest";

import type { DjInputT } from "../djs.types";
import { getDjChanges } from "./getDjChanges";

const mockDj: DjInputT = {
  name: "DJ Rush",
  cityId: null,
  links: { soundcloud: "https://soundcloud.com/djrush" }
};

const mockNoChanges = {
  artist: null,
  linksToInsert: [],
  linksToUpdate: [],
  linksToDelete: []
};

describe("getDjChanges", () => {
  it("returns no writes when nothing changed", () => {
    const result = getDjChanges(mockDj, mockDj);

    expect(result).toEqual(mockNoChanges);
  });

  it("writes an added city and a new name", () => {
    const result = getDjChanges(mockDj, { ...mockDj, name: "Rush", cityId: 4887398 });

    expect(result).toEqual({
      ...mockNoChanges,
      artist: { name: "Rush", city_id: 4887398 }
    });
  });

  it("writes a cleared city as null", () => {
    const result = getDjChanges({ ...mockDj, cityId: 4887398 }, mockDj);

    expect(result).toEqual({ ...mockNoChanges, artist: { city_id: null } });
  });

  it("writes link changes with the shared link rules", () => {
    const result = getDjChanges(mockDj, {
      ...mockDj,
      links: { website: "https://djrush.com" }
    });

    expect(result).toEqual({
      artist: null,
      linksToInsert: [{ platformId: "website", url: "https://djrush.com" }],
      linksToUpdate: [],
      linksToDelete: ["soundcloud"]
    });
  });
});
