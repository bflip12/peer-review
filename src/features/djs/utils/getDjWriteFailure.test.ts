import { describe, expect, it } from "vitest";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";

import type { DjInputT } from "../djs.types";
import { B2B_NAME_MESSAGE } from "../schemas/djSchema";
import { getDjWriteFailure } from "./getDjWriteFailure";

const mockPlatforms: LinkPlatformT[] = [
  { id: "soundcloud", label: "SoundCloud", allowedHosts: ["soundcloud.com"] }
];
const mockInput: DjInputT = { name: "DJ Rush", cityId: null, links: {} };
const mockNameCityError = {
  code: "23505",
  message: 'duplicate key value violates unique constraint "artists_name_city_id_key"'
};

describe("getDjWriteFailure", () => {
  it("returns the cap message at the daily cap", () => {
    const result = getDjWriteFailure(
      { code: "PR001", details: "artist" },
      { input: mockInput, platforms: mockPlatforms }
    );

    expect(result).toEqual({
      ok: false,
      message: "You've added 50 DJs today. You can add more tomorrow."
    });
  });

  it("asks for a city when a taken name had none", () => {
    const result = getDjWriteFailure(mockNameCityError, {
      input: mockInput,
      platforms: mockPlatforms
    });

    expect(result).toEqual({
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: {
        cityId: [
          "Add where they're based. Another DJ called DJ Rush has no city, so a second one needs one."
        ]
      }
    });
  });

  it("says the DJ is already based there when the name and city are taken", () => {
    const result = getDjWriteFailure(mockNameCityError, {
      input: { ...mockInput, cityId: 4887398 },
      platforms: mockPlatforms
    });

    expect(result).toEqual({
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: {
        cityId: [
          "There's already a DJ called DJ Rush based there. Use that DJ, or check the city."
        ]
      }
    });
  });

  it("puts the b2b refusal under the name", () => {
    const result = getDjWriteFailure(
      {
        code: "23514",
        message:
          'new row for relation "artists" violates check constraint "artists_name_b2b_check"'
      },
      { input: mockInput, platforms: mockPlatforms }
    );

    expect(result).toEqual({
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: { name: [B2B_NAME_MESSAGE] }
    });
  });

  it("puts a refused link under its field", () => {
    const result = getDjWriteFailure(
      { code: "PR002", details: "soundcloud" },
      { input: mockInput, platforms: mockPlatforms }
    );

    expect(result).toEqual({
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: {
        link_soundcloud: ["Paste a SoundCloud link, such as soundcloud.com/name."]
      }
    });
  });

  it("asks to reload after a second link on one platform", () => {
    const result = getDjWriteFailure(
      {
        code: "23505",
        message: 'violates unique constraint "links_artist_id_platform_id_key"'
      },
      { input: mockInput, platforms: mockPlatforms }
    );

    expect(result).toEqual({
      ok: false,
      message:
        "This DJ changed while you were editing them. Reload the page and try again."
    });
  });

  it.each<[string, { code?: string; details?: string; message?: string }]>([
    ["an unknown platform", { code: "PR002", details: "myspace" }],
    ["another check", { code: "23514", message: "artists_name_check" }],
    ["any other error", { code: "42501" }]
  ])("returns null for %s, which the caller throws", (_case, error) => {
    const result = getDjWriteFailure(error, {
      input: mockInput,
      platforms: mockPlatforms
    });

    expect(result).toBeNull();
  });
});
