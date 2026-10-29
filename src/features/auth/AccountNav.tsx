import type { ReactElement } from "react";

import { getProfile } from "@/features/profiles/data/getProfile";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { AccountNavView } from "./AccountNavView";
import { signOut } from "./actions/signOut";
import { getSignedInUserId } from "./data/getSignedInUserId";
import { getAccountNavState } from "./utils/getAccountNavState";

/**
 * The header's account area for the signed-in user. Reads cookies, so it renders inside
 * `<Suspense>` with `AccountNavFallback`.
 */
export const AccountNav = async (): Promise<ReactElement> => {
  const supabase = await createServerSupabaseClient();
  const userId = await getSignedInUserId(supabase);
  const profile = userId ? await getProfile(supabase, userId) : null;
  return (
    <AccountNavView state={getAccountNavState(userId, profile)} signOutAction={signOut} />
  );
};
