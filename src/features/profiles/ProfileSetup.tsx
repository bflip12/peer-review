import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { saveNewProfile } from "./actions/saveNewProfile";
import { getProfile } from "./data/getProfile";
import { ProfileSetupForm } from "./ProfileSetupForm";

/**
 * The welcome page's form, for a signed-in user without a profile. Anyone else is sent
 * on: signed-out visitors to sign in, users with a profile home. Reads the session, so
 * it renders inside `<Suspense>`.
 */
export const ProfileSetup = async (): Promise<ReactElement> => {
  const supabase = await createServerSupabaseClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    redirect("/sign-in");
  }
  if (await getProfile(supabase, userId)) {
    redirect("/");
  }
  return <ProfileSetupForm action={saveNewProfile} />;
};
