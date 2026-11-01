import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { exchangeSignInCode } from "@/features/auth/data/exchangeSignInCode";
import { getPathAfterSignIn } from "@/features/auth/data/getPathAfterSignIn";
import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getSignInCodeParam } from "@/features/auth/utils/getSignInCodeParam";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

const FAILED_PATH = "/auth/google-error";

/**
 * Where Auth sends the browser after Google sign-in (ADR 0024). Exchanges the code for a
 * session cookie, then sends the user to pick a handle or home. A cancelled sign-in, a
 * used code, or a code from another browser ends on the Google error page.
 */
export const GET = async (request: NextRequest): Promise<never> => {
  const code = getSignInCodeParam(request.nextUrl.searchParams);
  if (!code) {
    redirect(FAILED_PATH);
  }
  const supabase = await createServerSupabaseClient();
  const exchanged = await exchangeSignInCode(supabase, code);
  if (!exchanged.ok) {
    redirect(FAILED_PATH);
  }
  const userId = await getSignedInUserId(supabase);
  if (!userId) {
    throw new Error("auth/callback: no user after a successful code exchange.");
  }
  redirect(await getPathAfterSignIn(supabase, userId));
};
