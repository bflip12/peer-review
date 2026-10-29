import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { ProfileSummaryT } from "../profiles.types";

/**
 * A user's profile, or null when they have not picked a handle yet. RLS hides banned
 * profiles from everyone but admins and their owner, so null also means "not visible".
 */
export const getProfile = async (
  supabase: SupabaseClientT,
  userId: string
): Promise<ProfileSummaryT | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("handle, display_name, account_status")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return {
    handle: data.handle,
    displayName: data.display_name,
    accountStatus: data.account_status
  };
};
