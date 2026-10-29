import { describe, expect, it } from "vitest";

import { profileSchema } from "./profileSchema";

describe("profileSchema", () => {
  it("accepts a handle and a display name, trimming both", () => {
    const result = profileSchema.safeParse({
      handle: " dj_rush.92 ",
      displayName: "  Rush  "
    });

    expect(result).toEqual({
      success: true,
      data: { handle: "dj_rush.92", displayName: "Rush" }
    });
  });

  it("turns an empty or blank display name into null", () => {
    const result = ["", "   "].map(
      (displayName) => profileSchema.safeParse({ handle: "ab", displayName }).data
    );

    expect(result).toEqual([
      { handle: "ab", displayName: null },
      { handle: "ab", displayName: null }
    ]);
  });

  it("accepts handles of 2 and 30 characters", () => {
    const result = ["ab", "x".repeat(30)].map(
      (handle) => profileSchema.safeParse({ handle, displayName: "" }).success
    );

    expect(result).toEqual([true, true]);
  });

  it("refuses handles of the wrong length or with other characters", () => {
    const result = ["", "a", "x".repeat(31), "dj rush", "dj-rush", "café", "@rush"].map(
      (handle) =>
        profileSchema.safeParse({ handle, displayName: "" }).error?.issues[0].message
    );

    expect(result).toEqual(
      Array.from(
        { length: 7 },
        () => "Use 2 to 30 letters, numbers, underscores (_), or dots (.)."
      )
    );
  });

  it("counts a display name's length in characters, up to 50", () => {
    const result = ["Ä".repeat(50), "🎧".repeat(50), "x".repeat(51)].map(
      (displayName) =>
        profileSchema.safeParse({ handle: "ab", displayName }).error?.issues[0].message
    );

    expect(result).toEqual([undefined, undefined, "Use 50 characters or fewer."]);
  });
});
