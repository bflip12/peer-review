import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getProfile } from "@/features/profiles/data/getProfile";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { deleteAccount } from "./actions/deleteAccount";
import { DeleteAccountForm } from "./DeleteAccountForm";

/**
 * The settings page's delete form, for a signed-in user with a handle, banned or not.
 * Signed-out visitors go to sign in, users without a handle to pick one. Reads the
 * session, so it renders inside `<Suspense>`.
 */
export const DeleteAccount = async (): Promise<ReactElement> => {
  const supabase = await createServerSupabaseClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    redirect("/sign-in");
  }
  const profile = await getProfile(supabase, userId);
  if (!profile) {
    redirect("/welcome");
  }
  return <DeleteAccountForm handle={profile.handle} action={deleteAccount} />;
};
