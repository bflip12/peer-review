import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { saveVenueEdits } from "./actions/saveVenueEdits";
import { getCanEditVenue } from "./data/getCanEditVenue";
import { getVenue } from "./data/getVenue";
import { getVenueFormOptions } from "./data/getVenueFormOptions";
import { getVenueValues } from "./utils/getVenueValues";
import { VenueForm } from "./VenueForm";

export type EditVenuePropsT = {
  params: Promise<{ shortId: string }>;
};

/**
 * The edit venue page's form, filled in with the venue as it is. Only someone who may
 * edit the venue sees it: signed-out visitors are sent to sign in, and anyone else to the
 * venue's page. Reads the session, so it renders inside `<Suspense>`.
 */
export const EditVenue = async ({ params }: EditVenuePropsT): Promise<ReactElement> => {
  const { shortId } = await params;
  const supabase = await createServerSupabaseClient();
  const [venue, userId, options] = await Promise.all([
    getVenue(supabase, shortId),
    getSignedInUserId(supabase),
    getVenueFormOptions(supabase)
  ]);
  if (!venue) {
    notFound();
  }
  if (!userId) {
    redirect("/sign-in");
  }
  if (!(await getCanEditVenue(supabase, { venueId: venue.id, userId }))) {
    redirect(`/venues/${venue.shortId}`);
  }
  const values = getVenueValues(venue);
  return (
    <VenueForm
      action={saveVenueEdits.bind(null, venue.shortId)}
      options={options}
      submitLabel="Save venue"
      initialValues={{
        name: values.name,
        city: venue.city,
        links: values.links,
        soundSystemIds: values.soundSystemIds
      }}
    />
  );
};
