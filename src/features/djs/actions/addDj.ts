"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getLinkPlatforms } from "@/features/catalog/data/getLinkPlatforms";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { createDj } from "../data/createDj";
import { getDjSchema } from "../schemas/djSchema";
import { getDjFormFields } from "../utils/getDjFormFields";

/**
 * The add DJ form's action: checks the form, adds the DJ as the signed-in user, then
 * opens their page. The link platforms are read again here, since the action is a
 * public endpoint and cannot trust a list sent by the browser.
 */
export const addDj = async (
  _previous: ActionResultT | null,
  formData: FormData
): Promise<ActionResultT> => {
  const supabase = await createServerSupabaseClient();
  const platforms = await getLinkPlatforms(supabase, "artist");
  const parsed = getDjSchema(platforms).safeParse(getDjFormFields(formData, platforms));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors
    };
  }
  if (!(await getSignedInUserId(supabase))) {
    return { ok: false, message: "You are signed out. Sign in again to add the DJ." };
  }
  const result = await createDj(supabase, parsed.data, platforms);
  if (!result.ok) {
    return result;
  }
  // The short ID alone finds the DJ; their page redirects to the full URL.
  redirect(`/djs/${result.data.shortId}`);
};
