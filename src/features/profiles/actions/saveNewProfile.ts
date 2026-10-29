"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { createProfile } from "../data/createProfile";
import { profileSchema } from "../schemas/profileSchema";

/** The welcome form's action: creates the signed-in user's profile, then goes home. */
export const saveNewProfile = async (
  _previous: ActionResultT | null,
  formData: FormData
): Promise<ActionResultT> => {
  const parsed = profileSchema.safeParse({
    handle: formData.get("handle"),
    displayName: formData.get("displayName")
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors
    };
  }
  const supabase = await createServerSupabaseClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return { ok: false, message: "You are signed out. Sign in again to pick a handle." };
  }
  const result = await createProfile(supabase, parsed.data);
  if (!result.ok) {
    return result;
  }
  // The header in the root layout shows who is signed in. A redirect alone keeps the
  // layout as it was, so refresh it too.
  refresh();
  redirect("/");
};
