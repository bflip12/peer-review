import { describe, expect, it } from "vitest";

import { confirmSignInSchema } from "./confirmSignInSchema";

describe("confirmSignInSchema", () => {
  it("accepts a token hash from a sign-in link", () => {
    const tokenHash = "1237019f439211e50e085013531e4b877c0bf9c5324e";

    const result = confirmSignInSchema.safeParse({ tokenHash, type: "email" });

    expect(result).toEqual({ success: true, data: { tokenHash, type: "email" } });
  });

  it("refuses an empty or oversized token hash, or other characters", () => {
    const result = ["", "a".repeat(257), "abc def", "abc&type=signup"].map(
      (tokenHash) => confirmSignInSchema.safeParse({ tokenHash, type: "email" }).success
    );

    expect(result).toEqual([false, false, false, false]);
  });

  it("refuses link types other than email", () => {
    const result = ["recovery", "invite", ""].map(
      (type) => confirmSignInSchema.safeParse({ tokenHash: "abc123", type }).success
    );

    expect(result).toEqual([false, false, false]);
  });
});
