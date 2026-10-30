"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

/**
 * The sign-in page's "Continue with Google" button. Takes no input. Asks Auth for its
 * Google sign-in URL, which stores a PKCE code verifier in this browser's cookies, then
 * sends the browser there. Google comes back through Auth to `/auth/callback` on the
 * origin the button was pressed on, so previews sign in to themselves (ADR 0024).
 */
export const startGoogleSignIn = async (): Promise<never> => {
  const origin = (await headers()).get("origin");
  if (!origin) {
    throw new Error("startGoogleSignIn: the request has no Origin header.");
  }
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` }
  });
  if (error) {
    throw error;
  }
  redirect(data.url);
};
