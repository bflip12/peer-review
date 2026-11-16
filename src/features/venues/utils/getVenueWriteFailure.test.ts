import { describe, expect, it } from "vitest";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";

import { getVenueWriteFailure } from "./getVenueWriteFailure";

const mockPlatforms: LinkPlatformT[] = [
  { id: "instagram", label: "Instagram", allowedHosts: ["instagram.com"] }
];

describe("getVenueWriteFailure", () => {
  it("returns the cap message for the daily cap", () => {
    const result = getVenueWriteFailure(
      { code: "PR001", details: "venue" },
      mockPlatforms
    );

    expect(result).toEqual({
      ok: false,
      message: "You've added 10 venues today. You can add more tomorrow."
    });
  });

  it("puts a refused link's message under its field", () => {
    const result = getVenueWriteFailure(
      { code: "PR002", details: "instagram" },
      mockPlatforms
    );

    expect(result).toEqual({
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: {
        link_instagram: ["Paste an Instagram link, such as instagram.com/name."]
      }
    });
  });

  it("returns null for a refused link on a platform the form does not show", () => {
    const result = getVenueWriteFailure(
      { code: "PR002", details: "soundcloud" },
      mockPlatforms
    );

    expect(result).toBeNull();
  });

  it("asks for a reload when a link already exists", () => {
    const result = getVenueWriteFailure({ code: "23505" }, mockPlatforms);

    expect(result).toEqual({
      ok: false,
      message:
        "This venue changed while you were editing it. Reload the page and try again."
    });
  });

  it("returns null for any other error", () => {
    const result = getVenueWriteFailure({ code: "42501" }, mockPlatforms);

    expect(result).toBeNull();
  });
});
