import { describe, expect, it } from "vitest";

import { isSameHandle } from "./isSameHandle";

describe("isSameHandle", () => {
  it("matches the handle in any case, as the unique index on handles does", () => {
    const result = ["dj_rush", "DJ_Rush", "DJ_RUSH"].map((typed) =>
      isSameHandle(typed, "dj_rush")
    );

    expect(result).toEqual([true, true, true]);
  });

  it("refuses a different handle", () => {
    const result = ["dj_rus", "dj_rush2", "dj.rush"].map((typed) =>
      isSameHandle(typed, "dj_rush")
    );

    expect(result).toEqual([false, false, false]);
  });
});
