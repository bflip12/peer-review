import { describe, expect, it } from "vitest";

import { isAllowedLinkUrl } from "./isAllowedLinkUrl";

const mockInstagram = { allowedHosts: ["instagram.com", "www.instagram.com"] };
const mockBandcamp = { allowedHosts: ["*.bandcamp.com"] };
const mockWebsite = { allowedHosts: [] };

describe("isAllowedLinkUrl", () => {
  it("accepts a listed host with a path", () => {
    const isAllowed = isAllowedLinkUrl(mockInstagram, "https://www.instagram.com/tresor");

    expect(isAllowed).toBe(true);
  });

  it("accepts an uppercase host, a port, and a trailing dot", () => {
    const isAllowed = isAllowedLinkUrl(
      mockInstagram,
      "https://Instagram.COM.:443/tresor"
    );

    expect(isAllowed).toBe(true);
  });

  it("refuses a host the platform does not list", () => {
    const isAllowed = isAllowedLinkUrl(
      mockInstagram,
      "https://example.com/instagram.com"
    );

    expect(isAllowed).toBe(false);
  });

  it("refuses a user name before the host", () => {
    const isAllowed = isAllowedLinkUrl(
      mockInstagram,
      "https://instagram.com@example.com/a"
    );

    expect(isAllowed).toBe(false);
  });

  it("refuses a host that only ends with a listed one", () => {
    const isAllowed = isAllowedLinkUrl(mockInstagram, "https://notinstagram.com/a");

    expect(isAllowed).toBe(false);
  });

  it("accepts any subdomain for a wildcard host", () => {
    const isAllowed = isAllowedLinkUrl(mockBandcamp, "https://name.bandcamp.com/album/x");

    expect(isAllowed).toBe(true);
  });

  it("refuses the wildcard's own domain", () => {
    const isAllowed = isAllowedLinkUrl(mockBandcamp, "https://bandcamp.com/name");

    expect(isAllowed).toBe(false);
  });

  it("refuses a lookalike domain for a wildcard host", () => {
    const isAllowed = isAllowedLinkUrl(mockBandcamp, "https://name.notbandcamp.com");

    expect(isAllowed).toBe(false);
  });

  it("accepts any host with a dot for an empty list", () => {
    const isAllowed = isAllowedLinkUrl(mockWebsite, "http://tresorberlin.com");

    expect(isAllowed).toBe(true);
  });

  it("refuses a host with no dot for an empty list", () => {
    const isAllowed = isAllowedLinkUrl(mockWebsite, "https://localhost/a");

    expect(isAllowed).toBe(false);
  });

  it("refuses a URL that is not http or https", () => {
    const isAllowed = isAllowedLinkUrl(mockWebsite, "ftp://example.com");

    expect(isAllowed).toBe(false);
  });

  it("refuses a URL with a space", () => {
    const isAllowed = isAllowedLinkUrl(mockWebsite, "https://example.com/a b");

    expect(isAllowed).toBe(false);
  });

  it("refuses a URL over 500 characters", () => {
    const isAllowed = isAllowedLinkUrl(
      mockWebsite,
      `https://example.com/${"a".repeat(481)}`
    );

    expect(isAllowed).toBe(false);
  });

  it("refuses empty input", () => {
    const isAllowed = isAllowedLinkUrl(mockWebsite, "");

    expect(isAllowed).toBe(false);
  });
});
