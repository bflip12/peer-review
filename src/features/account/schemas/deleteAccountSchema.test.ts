import { describe, expect, it } from "vitest";

import { deleteAccountSchema } from "./deleteAccountSchema";

describe("deleteAccountSchema", () => {
  it("trims the typed handle and drops a leading @", () => {
    const result = ["  dj_rush ", "@dj_rush"].map((handle) =>
      deleteAccountSchema.safeParse({ handle })
    );

    expect(result).toEqual([
      { success: true, data: { handle: "dj_rush" } },
      { success: true, data: { handle: "dj_rush" } }
    ]);
  });

  it("refuses an empty, blank, or @-only field with the same message", () => {
    const result = ["", "   ", "@"].map(
      (handle) => deleteAccountSchema.safeParse({ handle }).error?.issues[0].message
    );

    expect(result).toEqual(Array.from({ length: 3 }, () => "Type your handle."));
  });

  it("refuses a missing field", () => {
    const result = deleteAccountSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
