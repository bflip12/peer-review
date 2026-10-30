"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getProfile } from "@/features/profiles/data/getProfile";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { deleteSignedInAccount } from "../data/deleteSignedInAccount";
import { deleteAccountSchema } from "../schemas/deleteAccountSchema";
import { isSameHandle } from "../utils/isSameHandle";

const NOT_DELETED = "Your account was not deleted.";

/**
 * The settings page's "Delete account" action. Deletes the signed-in user's account once
 * the typed handle matches theirs, signs this browser out, and shows the deleted page.
 */
export const deleteAccount = async (
  _previous: ActionResultT | null,
  formData: FormData
): Promise<ActionResultT> => {
  const parsed = deleteAccountSchema.safeParse({ handle: formData.get("handle") });
  if (!parsed.success) {
    return {
      ok: false,
      message: NOT_DELETED,
      fieldErrors: z.flattenError(parsed.error).fieldErrors
    };
  }
  const supabase = await createServerSupabaseClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    return {
      ok: false,
      message: "You are signed out. Sign in again to delete your account."
    };
  }
  const profile = await getProfile(supabase, userId);
  if (!profile || !isSameHandle(parsed.data.handle, profile.handle)) {
    return {
      ok: false,
      message: NOT_DELETED,
      fieldErrors: { handle: ["That is not your handle."] }
    };
  }
  await deleteSignedInAccount(supabase);
  // The header in the root layout shows who is signed in. A redirect alone keeps the
  // layout as it was, so refresh it too.
  refresh();
  redirect("/account-deleted");
};
