import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";

import { B2B_NAME_MESSAGE, getDjSchema } from "./djSchema";

const mockPlatforms: LinkPlatformT[] = [
  { id: "soundcloud", label: "SoundCloud", allowedHosts: ["soundcloud.com"] },
  { id: "bandcamp", label: "Bandcamp", allowedHosts: ["*.bandcamp.com"] },
  { id: "website", label: "Website", allowedHosts: [] }
];

const mockEmptyFields = {
  name: "",
  cityId: "",
  link_soundcloud: "",
  link_bandcamp: "",
  link_website: ""
};

const parse = (
  fields: Record<string, string>
): ReturnType<ReturnType<typeof getDjSchema>["safeParse"]> =>
  getDjSchema(mockPlatforms).safeParse({ ...mockEmptyFields, ...fields });

const getFieldErrors = (fields: Record<string, string>): Record<string, string[]> => {
  const result = parse(fields);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
};

describe("getDjSchema", () => {
  it("reads a name alone as a DJ with no city and no links", () => {
    const result = parse({ name: "  DJ Rush  " });

    expect(result).toEqual({
      success: true,
      data: { name: "DJ Rush", cityId: null, links: {} }
    });
  });

  it("reads a city and links, adding https:// where it was left off", () => {
    const result = parse({
      name: "DJ Rush",
      cityId: "4887398",
      link_bandcamp: "djrush.bandcamp.com",
      link_website: "https://djrush.com"
    });

    expect(result).toEqual({
      success: true,
      data: {
        name: "DJ Rush",
        cityId: 4887398,
        links: {
          bandcamp: "https://djrush.bandcamp.com",
          website: "https://djrush.com"
        }
      }
    });
  });

  it("asks for a name when it is empty or spaces", () => {
    const result = getFieldErrors({ name: "   " });

    expect(result).toEqual({ name: ["Enter the DJ's name."] });
  });

  it("refuses a name over 100 characters, counting characters", () => {
    const result = getFieldErrors({ name: "é".repeat(101) });

    expect(result).toEqual({ name: ["Use 100 characters or fewer."] });
  });

  it("accepts 100 characters that are two UTF-16 units each", () => {
    const result = parse({ name: "🎧".repeat(100) });

    expect(result.success).toBe(true);
  });

  it.each([["DJ Rush b2b Surgeon"], ["Rush B2B Surgeon"], ["xb2bx"]])(
    "refuses the name %s, pointing to the lineup",
    (name) => {
      const result = getFieldErrors({ name });

      expect(result).toEqual({ name: [B2B_NAME_MESSAGE] });
    }
  );

  it("accepts a name with b 2 b spelled apart", () => {
    const result = parse({ name: "B 2 B" });

    expect(result.success).toBe(true);
  });

  it.each([["0"], ["-1"], ["1.5"], ["Berlin"]])("refuses the city ID %s", (cityId) => {
    const result = getFieldErrors({ name: "DJ Rush", cityId });

    expect(result).toEqual({
      cityId: ["Pick where they're based from the list, or leave it empty."]
    });
  });

  it("refuses a Bandcamp link on bandcamp.com itself", () => {
    const result = getFieldErrors({
      name: "DJ Rush",
      link_bandcamp: "https://bandcamp.com/djrush"
    });

    expect(Object.keys(result)).toEqual(["link_bandcamp"]);
  });
});
