"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { getCanEditVenue } from "../data/getCanEditVenue";
import { getVenue } from "../data/getVenue";
import { getVenueFormOptions } from "../data/getVenueFormOptions";
import { updateVenue } from "../data/updateVenue";
import { getVenueSchema } from "../schemas/venueSchema";
import { getVenueChanges } from "../utils/getVenueChanges";
import { getVenueFormFields } from "../utils/getVenueFormFields";
import { getVenueValues } from "../utils/getVenueValues";

/**
 * The edit venue form's action, bound to the venue's short ID by the edit page. Checks
 * the form, checks the caller may still edit the venue, writes only what changed, then
 * opens the venue's page. The bound short ID comes from the browser, so the edit right is
 * checked here and RLS checks it again on every write.
 */
export const saveVenueEdits = async (
  shortId: string,
  _previous: ActionResultT | null,
  formData: FormData
): Promise<ActionResultT> => {
  const supabase = await createServerSupabaseClient();
  const options = await getVenueFormOptions(supabase);
  const parsed = getVenueSchema(options).safeParse(
    getVenueFormFields(formData, options.platforms)
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors
    };
  }
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return { ok: false, message: "You are signed out. Sign in again to save the venue." };
  }
  const venue = await getVenue(supabase, z.string().parse(shortId));
  if (!venue || !(await getCanEditVenue(supabase, { venueId: venue.id, userId }))) {
    return {
      ok: false,
      message:
        "You can no longer edit this venue. Someone else has picked it, so locals keep it up to date."
    };
  }
  const result = await updateVenue(supabase, {
    venueId: venue.id,
    changes: getVenueChanges(getVenueValues(venue), parsed.data),
    platforms: options.platforms
  });
  if (!result.ok) {
    return result;
  }
  // The short ID alone finds the venue; its page redirects to the URL for the new name
  // and city.
  redirect(`/venues/${venue.shortId}`);
};
