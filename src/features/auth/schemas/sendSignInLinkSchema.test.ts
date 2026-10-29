import { describe, expect, it } from "vitest";

import { sendSignInLinkSchema } from "./sendSignInLinkSchema";

describe("sendSignInLinkSchema", () => {
  it("accepts an email address and trims surrounding whitespace", () => {
    const result = sendSignInLinkSchema.safeParse({ email: "  dj@example.com " });

    expect(result).toEqual({ success: true, data: { email: "dj@example.com" } });
  });

  it("refuses an empty, blank, or malformed address with the same message", () => {
    const result = ["", "   ", "dj", "dj@", "@example.com"].map(
      (email) => sendSignInLinkSchema.safeParse({ email }).error?.issues[0].message
    );

    expect(result).toEqual(
      Array.from({ length: 5 }, () => "Enter an email address, like name@example.com.")
    );
  });

  it("refuses a missing field", () => {
    const result = sendSignInLinkSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
