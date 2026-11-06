import { describe, expect, it } from "vitest";

import type { LinkPlatformT } from "../catalog.types";
import { getLinkErrorMessage } from "./getLinkErrorMessage";

const mockInstagram: LinkPlatformT = {
  id: "instagram",
  label: "Instagram",
  allowedHosts: ["instagram.com", "www.instagram.com"]
};
const mockResidentAdvisor: LinkPlatformT = {
  id: "resident_advisor",
  label: "Resident Advisor",
  allowedHosts: ["ra.co", "www.ra.co"]
};
const mockBandcamp: LinkPlatformT = {
  id: "bandcamp",
  label: "Bandcamp",
  allowedHosts: ["*.bandcamp.com"]
};
const mockWebsite: LinkPlatformT = { id: "website", label: "Website", allowedHosts: [] };

describe("getLinkErrorMessage", () => {
  it("uses 'an' before a vowel and the first host with a path", () => {
    const result = getLinkErrorMessage(mockInstagram);

    expect(result).toBe("Paste an Instagram link, such as instagram.com/name.");
  });

  it("uses 'a' before a consonant", () => {
    const result = getLinkErrorMessage(mockResidentAdvisor);

    expect(result).toBe("Paste a Resident Advisor link, such as ra.co/name.");
  });

  it("shows a wildcard host as a subdomain, and says where a custom domain goes", () => {
    const result = getLinkErrorMessage(mockBandcamp);

    expect(result).toBe(
      "Paste a Bandcamp link, such as name.bandcamp.com. Using your own domain? Paste your name.bandcamp.com address, or add it as your website."
    );
  });

  it("asks for a full link when the platform lists no hosts", () => {
    const result = getLinkErrorMessage(mockWebsite);

    expect(result).toBe("Paste a full link, such as https://example.com.");
  });
});
