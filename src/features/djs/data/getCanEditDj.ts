import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

/**
 * Whether a user may edit a DJ, so the page shows "Edit" and the edit page opens. The
 * same rule as `private.can_edit_artist`, which RLS applies to every write: an active
 * moderator or admin, or the DJ's creator until another user picks them. The creator is
 * read from `creations`, which a user can read only for their own rows.
 */
export const getCanEditDj = async (
  supabase: SupabaseClientT,
  { artistId, userId }: { artistId: string; userId: string }
): Promise<boolean> => {
  const [profile, artist, creation] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, account_status")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("artists")
      .select("used_by_others_at, merged_into_id")
      .eq("id", artistId)
      .maybeSingle(),
    supabase
      .from("creations")
      .select("id")
      .eq("artist_id", artistId)
      .eq("created_by", userId)
      .maybeSingle()
  ]);
  for (const result of [profile, artist, creation]) {
    if (result.error) {
      throw result.error;
    }
  }
  if (
    profile.data?.account_status !== "active" ||
    !artist.data ||
    artist.data.merged_into_id
  ) {
    return false;
  }
  if (profile.data.role === "moderator" || profile.data.role === "admin") {
    return true;
  }
  return artist.data.used_by_others_at === null && creation.data !== null;
};
