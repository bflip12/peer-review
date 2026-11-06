import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { VenueFormOptionsT } from "../venues.types";
import { getVenueSchema } from "./venueSchema";

const mockOptions: VenueFormOptionsT = {
  platforms: [
    {
      id: "instagram",
      label: "Instagram",
      allowedHosts: ["instagram.com", "www.instagram.com"]
    },
    { id: "website", label: "Website", allowedHosts: [] }
  ],
  soundSystems: [
    { id: "funktion_one", name: "Funktion-One" },
    { id: "other", name: "Other" }
  ]
};

const mockFields = {
  name: "Tresor",
  cityId: "2950159",
  soundSystemIds: [],
  link_instagram: "",
  link_website: ""
};

const parse = (fields: Record<string, unknown>) =>
  getVenueSchema(mockOptions).safeParse(fields);

const getFieldErrors = (fields: Record<string, unknown>): Record<string, string[]> => {
  const result = parse(fields);
  if (result.success) {
    return {};
  }
  return z.flattenError(result.error).fieldErrors;
};

describe("getVenueSchema", () => {
  it("parses a venue with no links or tags", () => {
    const result = parse(mockFields);

    expect(result.data).toEqual({
      name: "Tresor",
      cityId: 2950159,
      links: {},
      soundSystemIds: []
    });
  });

  it("trims the name, adds https to links, and drops duplicate tags", () => {
    const result = parse({
      ...mockFields,
      name: "  Tresor  ",
      link_instagram: " instagram.com/tresorberlin ",
      link_website: "https://tresorberlin.com",
      soundSystemIds: ["funktion_one", "funktion_one", "other"]
    });

    expect(result.data).toEqual({
      name: "Tresor",
      cityId: 2950159,
      links: {
        instagram: "https://instagram.com/tresorberlin",
        website: "https://tresorberlin.com"
      },
      soundSystemIds: ["funktion_one", "other"]
    });
  });

  it("refuses an empty name and a name of whitespace", () => {
    const result = [
      getFieldErrors({ ...mockFields, name: "" }),
      getFieldErrors({ ...mockFields, name: "   " })
    ];

    expect(result).toEqual([
      { name: ["Enter the venue's name."] },
      { name: ["Enter the venue's name."] }
    ]);
  });

  it("refuses a name over 100 characters, counting characters, not UTF-16 units", () => {
    const result = [
      getFieldErrors({ ...mockFields, name: "ö".repeat(100) }),
      getFieldErrors({ ...mockFields, name: "a".repeat(101) })
    ];

    expect(result).toEqual([{}, { name: ["Use 100 characters or fewer."] }]);
  });

  it("refuses a missing or empty city", () => {
    const result = [
      getFieldErrors({ ...mockFields, cityId: "" }),
      getFieldErrors({ ...mockFields, cityId: "abc" })
    ];

    expect(result).toEqual([
      { cityId: ["Pick the venue's city from the list."] },
      { cityId: ["Pick the venue's city from the list."] }
    ]);
  });

  it("puts a refused link's message under its own field", () => {
    const result = getFieldErrors({
      ...mockFields,
      link_instagram: "https://example.com/a"
    });

    expect(result).toEqual({
      link_instagram: ["Paste an Instagram link, such as instagram.com/name."]
    });
  });

  it("refuses a sound system that is not in the list", () => {
    const result = getFieldErrors({
      ...mockFields,
      soundSystemIds: ["funktion_one", "made_up"]
    });

    expect(result).toEqual({ soundSystemIds: ["Pick sound systems from the list."] });
  });
});
