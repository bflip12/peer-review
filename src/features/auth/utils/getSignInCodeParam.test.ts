import { describe, expect, it } from "vitest";

import { getSignInCodeParam } from "./getSignInCodeParam";

const CODE = "29a9a4c9-aaae-4abc-843f-994ce4ab4f52";

describe("getSignInCodeParam", () => {
  it("returns the code from Google sign-in's callback query", () => {
    const result = getSignInCodeParam(new URLSearchParams({ code: CODE }));

    expect(result).toBe(CODE);
  });

  it("returns null when Google sent an error instead, such as a cancelled sign-in", () => {
    const result = getSignInCodeParam(
      new URLSearchParams({ error: "access_denied", error_description: "Cancelled" })
    );

    expect(result).toBeNull();
  });

  it("returns null for a code that is not a UUID, or a repeated code", () => {
    const result = [
      new URLSearchParams({ code: "" }),
      new URLSearchParams({ code: "not-a-code" }),
      new URLSearchParams([
        ["code", CODE],
        ["code", CODE]
      ])
    ].map(getSignInCodeParam);

    expect(result).toEqual([null, null, null]);
  });
});
