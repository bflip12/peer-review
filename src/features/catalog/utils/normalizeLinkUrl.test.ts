import { describe, expect, it } from "vitest";

import { normalizeLinkUrl } from "./normalizeLinkUrl";

describe("normalizeLinkUrl", () => {
  it("returns null for empty input", () => {
    const result = normalizeLinkUrl("");

    expect(result).toBeNull();
  });

  it("returns null for whitespace", () => {
    const result = normalizeLinkUrl("   ");

    expect(result).toBeNull();
  });

  it("keeps an https link and trims it", () => {
    const result = normalizeLinkUrl("  https://ra.co/clubs/5031 ");

    expect(result).toBe("https://ra.co/clubs/5031");
  });

  it("keeps an http link", () => {
    const result = normalizeLinkUrl("http://tresorberlin.com");

    expect(result).toBe("http://tresorberlin.com");
  });

  it("adds https to a link typed without a scheme", () => {
    const result = normalizeLinkUrl("instagram.com/tresorberlin");

    expect(result).toBe("https://instagram.com/tresorberlin");
  });

  it("adds https to a link that starts with //", () => {
    const result = normalizeLinkUrl("//instagram.com/tresorberlin");

    expect(result).toBe("https://instagram.com/tresorberlin");
  });

  it("adds https to a link with a port and no scheme", () => {
    const result = normalizeLinkUrl("ra.co:443/clubs/5031");

    expect(result).toBe("https://ra.co:443/clubs/5031");
  });

  it("keeps another scheme as typed, so the host check refuses it", () => {
    const result = normalizeLinkUrl("ftp://example.com");

    expect(result).toBe("ftp://example.com");
  });
});
