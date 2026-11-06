import { describe, expect, it } from "vitest";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";

import { getDjFormFields } from "./getDjFormFields";

const mockPlatforms: LinkPlatformT[] = [
  { id: "soundcloud", label: "SoundCloud", allowedHosts: ["soundcloud.com"] }
];

describe("getDjFormFields", () => {
  it("reads empty strings from an empty form", () => {
    const result = getDjFormFields(new FormData(), mockPlatforms);

    expect(result).toEqual({ name: "", cityId: "", link_soundcloud: "" });
  });

  it("reads every field and ignores fields it does not know", () => {
    const formData = new FormData();
    formData.set("name", "DJ Rush");
    formData.set("cityId", "4887398");
    formData.set("link_soundcloud", "soundcloud.com/djrush");
    formData.set("soundSystemIds", "funktion_one");

    const result = getDjFormFields(formData, mockPlatforms);

    expect(result).toEqual({
      name: "DJ Rush",
      cityId: "4887398",
      link_soundcloud: "soundcloud.com/djrush"
    });
  });
});
