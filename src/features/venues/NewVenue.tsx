import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getProfile } from "@/features/profiles/data/getProfile";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { addVenue } from "./actions/addVenue";
import { getVenueFormOptions } from "./data/getVenueFormOptions";
import { VenueForm } from "./VenueForm";

/**
 * The add venue page's form, for a signed-in user with a profile. Signed-out visitors
 * are sent to sign in, and users without a handle to pick one, since the database adds
 * venues only for an active profile. Reads the session, so it renders inside
 * `<Suspense>`.
 */
export const NewVenue = async (): Promise<ReactElement> => {
  const supabase = await createServerSupabaseClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    redirect("/sign-in");
  }
  const [profile, options] = await Promise.all([
    getProfile(supabase, userId),
    getVenueFormOptions(supabase)
  ]);
  if (!profile) {
    redirect("/welcome");
  }
  return <VenueForm action={addVenue} options={options} submitLabel="Add venue" />;
};
