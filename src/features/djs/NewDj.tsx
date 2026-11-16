import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getLinkPlatforms } from "@/features/catalog/data/getLinkPlatforms";
import { getProfile } from "@/features/profiles/data/getProfile";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { addDj } from "./actions/addDj";
import { DjForm } from "./DjForm";

/**
 * The add DJ page's form, for a signed-in user with a profile. Signed-out visitors are
 * sent to sign in, and users without a handle to pick one, since the database adds DJs
 * only for an active profile. Reads the session, so it renders inside `<Suspense>`.
 */
export const NewDj = async (): Promise<ReactElement> => {
  const supabase = await createServerSupabaseClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    redirect("/sign-in");
  }
  const [profile, platforms] = await Promise.all([
    getProfile(supabase, userId),
    getLinkPlatforms(supabase, "artist")
  ]);
  if (!profile) {
    redirect("/welcome");
  }
  return <DjForm action={addDj} platforms={platforms} submitLabel="Add DJ" />;
};
