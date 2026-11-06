"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { createVenue } from "../data/createVenue";
import { getVenueFormOptions } from "../data/getVenueFormOptions";
import { getVenueSchema } from "../schemas/venueSchema";
import { getVenueFormFields } from "../utils/getVenueFormFields";

/**
 * The add venue form's action: checks the form, adds the venue as the signed-in user,
 * then opens its page. The form's options are read again here, since the action is a
 * public endpoint and cannot trust a list sent by the browser.
 */
export const addVenue = async (
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
  if (!(await getSignedInUserId(supabase))) {
    return { ok: false, message: "You are signed out. Sign in again to add the venue." };
  }
  const result = await createVenue(supabase, parsed.data, options.platforms);
  if (!result.ok) {
    return result;
  }
  // The short ID alone finds the venue; its page redirects to the full URL.
  redirect(`/venues/${result.data.shortId}`);
};
