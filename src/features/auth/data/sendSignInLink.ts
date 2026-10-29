import "server-only";

import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

/**
 * Emails a sign-in link. A new address gets an account on the first link it follows.
 * `redirectTo` is this site's origin: the email templates build the link from it
 * (`supabase/templates/`), and Auth falls back to the project's Site URL when it is not
 * on the project's redirect allow list.
 */
export const sendSignInLink = async (
  supabase: SupabaseClientT,
  email: string,
  redirectTo: string
): Promise<ActionResultT> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });
  if (!error) {
    return { ok: true, data: undefined };
  }
  // The same code covers a second link to one address too soon and the project's hourly
  // email cap, so the message fits both.
  if (error.code === "over_email_send_rate_limit") {
    return {
      ok: false,
      message: "Too many sign-in emails were sent. Wait a minute, then try again."
    };
  }
  console.error("sendSignInLink: Auth refused to send a sign-in link.", {
    code: error.code,
    status: error.status
  });
  return {
    ok: false,
    message: "The sign-in link could not be sent. Try again in a minute."
  };
};
