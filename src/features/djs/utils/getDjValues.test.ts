import { describe, expect, it } from "vitest";

import type { DjT } from "../djs.types";
import { getDjValues } from "./getDjValues";

const mockDj: DjT = {
  id: "8c7e0d1a-0000-4000-8000-000000000001",
  shortId: "k7m2p9qx",
  name: "DJ Rush",
  city: { id: 4887398, name: "Chicago", admin1Name: "Illinois", countryCode: "US" },
  links: [
    {
      platformId: "soundcloud",
      label: "SoundCloud",
      url: "https://soundcloud.com/djrush"
    }
  ]
};

describe("getDjValues", () => {
  it("returns the name, city ID, and links by platform", () => {
    const result = getDjValues(mockDj);

    expect(result).toEqual({
      name: "DJ Rush",
      cityId: 4887398,
      links: { soundcloud: "https://soundcloud.com/djrush" }
    });
  });

  it("returns a null city ID and no links for a DJ with neither", () => {
    const result = getDjValues({ ...mockDj, city: null, links: [] });

    expect(result).toEqual({ name: "DJ Rush", cityId: null, links: {} });
  });
});
