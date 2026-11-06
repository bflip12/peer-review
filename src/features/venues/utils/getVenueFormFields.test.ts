import { describe, expect, it } from "vitest";

import type { LinkPlatformT } from "../venues.types";
import { getVenueFormFields } from "./getVenueFormFields";

const mockPlatforms: LinkPlatformT[] = [
  { id: "instagram", label: "Instagram", allowedHosts: ["instagram.com"] },
  { id: "website", label: "Website", allowedHosts: [] }
];

describe("getVenueFormFields", () => {
  it("reads empty strings and no tags from an empty form", () => {
    const result = getVenueFormFields(new FormData(), mockPlatforms);

    expect(result).toEqual({
      name: "",
      cityId: "",
      soundSystemIds: [],
      link_instagram: "",
      link_website: ""
    });
  });

  it("reads every field, every checked tag, and ignores fields it does not know", () => {
    const formData = new FormData();
    formData.set("name", "Tresor");
    formData.set("cityId", "2950159");
    formData.set("link_instagram", "instagram.com/tresorberlin");
    formData.append("soundSystemIds", "funktion_one");
    formData.append("soundSystemIds", "other");
    formData.set("link_soundcloud", "https://soundcloud.com/x");

    const result = getVenueFormFields(formData, mockPlatforms);

    expect(result).toEqual({
      name: "Tresor",
      cityId: "2950159",
      soundSystemIds: ["funktion_one", "other"],
      link_instagram: "instagram.com/tresorberlin",
      link_website: ""
    });
  });

  it("treats a file as an empty field", () => {
    const formData = new FormData();
    formData.set("name", new File(["x"], "name.txt"));

    const result = getVenueFormFields(formData, mockPlatforms);

    expect(result.name).toBe("");
  });
});
