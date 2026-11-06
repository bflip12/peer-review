import { describe, expect, it } from "vitest";

import type { LinkPlatformT } from "../catalog.types";
import { getLinkFormFields } from "./getLinkFormFields";

const mockPlatforms: LinkPlatformT[] = [
  { id: "instagram", label: "Instagram", allowedHosts: ["instagram.com"] },
  { id: "website", label: "Website", allowedHosts: [] }
];

describe("getLinkFormFields", () => {
  it("reads an empty string for every platform of an empty form", () => {
    const result = getLinkFormFields(new FormData(), mockPlatforms);

    expect(result).toEqual({ link_instagram: "", link_website: "" });
  });

  it("reads each platform's field, and ignores other fields and files", () => {
    const formData = new FormData();
    formData.set("link_instagram", " instagram.com/djrush ");
    formData.set("link_website", new File(["x"], "x.txt"));
    formData.set("link_soundcloud", "https://soundcloud.com/djrush");

    const result = getLinkFormFields(formData, mockPlatforms);

    expect(result).toEqual({
      link_instagram: " instagram.com/djrush ",
      link_website: ""
    });
  });
});
