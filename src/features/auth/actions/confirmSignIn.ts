"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getProfile } from "@/features/profiles/data/getProfile";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { getSignedInUserId } from "../data/getSignedInUserId";
import { verifySignInLink } from "../data/verifySignInLink";
import { confirmSignInSchema } from "../schemas/confirmSignInSchema";

/**
 * The confirm page's action: signs the user in with the link's token, then sends them to
 * pick a handle, or home when they have a profile. It runs on a button press rather than
 * on page load, so a mail scanner that opens the link does not use up the one-time token.
 */
export const confirmSignIn = async (
  _previous: ActionResultT | null,
  formData: FormData
): Promise<ActionResultT> => {
  const parsed = confirmSignInSchema.safeParse({
    tokenHash: formData.get("tokenHash"),
    type: formData.get("type")
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "This sign-in link is incomplete. Ask for a new one."
    };
  }
  const supabase = await createServerSupabaseClient();
  const verified = await verifySignInLink(supabase, parsed.data.tokenHash);
  if (!verified.ok) {
    return verified;
  }
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    throw new Error("confirmSignIn: no user after a verified sign-in link.");
  }
  const profile = await getProfile(supabase, userId);
  // The header in the root layout shows who is signed in. A redirect alone keeps the
  // layout as it was, so refresh it too.
  refresh();
  redirect(profile ? "/" : "/welcome");
};
