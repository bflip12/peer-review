import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

/**
 * Whether a user may edit a venue, so the page shows "Edit" and the edit page opens. The
 * same rule as `private.can_edit_venue`, which RLS applies to every write: an active
 * moderator or admin, or the venue's creator until another user picks it. The creator is
 * read from `creations`, which a user can read only for their own rows.
 */
export const getCanEditVenue = async (
  supabase: SupabaseClientT,
  { venueId, userId }: { venueId: string; userId: string }
): Promise<boolean> => {
  const [profile, venue, creation] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("venues")
      .select("used_by_others_at, merged_into_id")
      .eq("id", venueId)
      .maybeSingle(),
    supabase
      .from("creations")
      .select("id")
      .eq("venue_id", venueId)
      .eq("created_by", userId)
      .maybeSingle()
  ]);
  for (const result of [profile, venue, creation]) {
    if (result.error) {
      throw result.error;
    }
  }
  if (
    profile.data?.account_status !== "active" ||
    !venue.data ||
    venue.data.merged_into_id
  ) {
    return false;
  }
  if (profile.data.role === "moderator" || profile.data.role === "admin") {
    return true;
  }
  return venue.data.used_by_others_at === null && creation.data !== null;
};
