import { describe, expect, it } from "vitest";

import type { LinkPlatformT } from "../catalog.types";
import { getLinkSchema } from "./getLinkSchema";

const mockBandcamp: LinkPlatformT = {
  id: "bandcamp",
  label: "Bandcamp",
  allowedHosts: ["*.bandcamp.com"]
};

describe("getLinkSchema", () => {
  it("reads a blank field as no link", () => {
    const result = getLinkSchema(mockBandcamp).safeParse("   ");

    expect(result).toEqual({ success: true, data: null });
  });

  it("adds https:// and accepts a host the platform allows", () => {
    const result = getLinkSchema(mockBandcamp).safeParse(" djrush.bandcamp.com ");

    expect(result).toEqual({ success: true, data: "https://djrush.bandcamp.com" });
  });

  it("refuses a host the platform does not allow, with the platform's message", () => {
    const result = getLinkSchema(mockBandcamp).safeParse("https://djrush.com");

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Paste a Bandcamp link, such as name.bandcamp.com. Using your own domain? Paste your name.bandcamp.com address, or add it as your website."
    ]);
  });
});
