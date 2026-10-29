import type { ProfileSummaryT } from "@/features/profiles/profiles.types";

/**
 * What the header's account area shows.
 *
 * - "signedOut": a "Sign in" link
 * - "needsProfile": signed in without a handle yet, so a link to pick one
 * - "active": the user's handle
 * - "banned": a line saying the account is banned
 */
export type AccountNavStateT =
  | { kind: "signedOut" }
  | { kind: "needsProfile" }
  | { kind: "active"; handle: string }
  | { kind: "banned" };

/** Picks the header's account state from the signed-in user and their profile. */
export const getAccountNavState = (
  userId: string | null,
  profile: ProfileSummaryT | null
): AccountNavStateT => {
  if (!userId) {
    return { kind: "signedOut" };
  }
  if (!profile) {
    return { kind: "needsProfile" };
  }
  if (profile.accountStatus === "banned") {
    return { kind: "banned" };
  }
  return { kind: "active", handle: profile.handle };
};
