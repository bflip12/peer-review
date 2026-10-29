import { describe, expect, it } from "vitest";

import { getAccountNavState } from "./getAccountNavState";

const USER_ID = "8d0f2c1e-3b4a-4c5d-9e6f-7a8b9c0d1e2f";

describe("getAccountNavState", () => {
  it("is signed out with no user, whatever the profile", () => {
    const result = getAccountNavState(null, null);

    expect(result).toEqual({ kind: "signedOut" });
  });

  it("needs a profile when the user has not picked a handle", () => {
    const result = getAccountNavState(USER_ID, null);

    expect(result).toEqual({ kind: "needsProfile" });
  });

  it("shows the handle of an active profile", () => {
    const result = getAccountNavState(USER_ID, {
      handle: "dj_rush",
      displayName: "Rush",
      accountStatus: "active"
    });

    expect(result).toEqual({ kind: "active", handle: "dj_rush" });
  });

  it("is banned when the profile is banned", () => {
    const result = getAccountNavState(USER_ID, {
      handle: "dj_rush",
      displayName: null,
      accountStatus: "banned"
    });

    expect(result).toEqual({ kind: "banned" });
  });
});
