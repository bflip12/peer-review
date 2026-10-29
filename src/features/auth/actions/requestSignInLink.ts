"use server";

import { headers } from "next/headers";
import { z } from "zod";

import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { sendSignInLink } from "../data/sendSignInLink";
import { sendSignInLinkSchema } from "../schemas/sendSignInLinkSchema";

/**
 * The sign-in form's action: emails a sign-in link. Anyone may call it; Auth rate limits
 * it. The link points back at the origin the form was served from, so previews send links
 * to themselves. Next.js refuses an action whose Origin does not match the Host.
 */
export const requestSignInLink = async (
  _previous: ActionResultT | null,
  formData: FormData
): Promise<ActionResultT> => {
  const parsed = sendSignInLinkSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the email address.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors
    };
  }
  const origin = (await headers()).get("origin");
  if (!origin) {
    throw new Error("requestSignInLink: the request has no Origin header.");
  }
  const supabase = await createServerSupabaseClient();
  return sendSignInLink(supabase, parsed.data.email, origin);
};
