"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getLinkPlatforms } from "@/features/catalog/data/getLinkPlatforms";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { getCanEditDj } from "../data/getCanEditDj";
import { getDj } from "../data/getDj";
import { updateDj } from "../data/updateDj";
import { getDjSchema } from "../schemas/djSchema";
import { getDjChanges } from "../utils/getDjChanges";
import { getDjFormFields } from "../utils/getDjFormFields";
import { getDjValues } from "../utils/getDjValues";

/**
 * The edit DJ form's action, bound to the DJ's short ID by the edit page. Checks the
 * form, checks the caller may still edit the DJ, writes only what changed, then opens
 * the DJ's page. The bound short ID comes from the browser, so the edit right is checked
 * here and RLS checks it again on every write.
 */
export const saveDjEdits = async (
  shortId: string,
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
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return { ok: false, message: "You are signed out. Sign in again to save the DJ." };
  }
  const dj = await getDj(supabase, z.string().parse(shortId));
  if (!dj || !(await getCanEditDj(supabase, { artistId: dj.id, userId }))) {
    return {
      ok: false,
      message:
        "You can no longer edit this DJ. Someone else has picked them, so locals keep them up to date."
    };
  }
  const result = await updateDj(supabase, {
    artistId: dj.id,
    input: parsed.data,
    changes: getDjChanges(getDjValues(dj), parsed.data),
    platforms
  });
  if (!result.ok) {
    return result;
  }
  // The short ID alone finds the DJ; their page redirects to the URL for the new name.
  redirect(`/djs/${dj.shortId}`);
};
