import "server-only";

import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

/**
 * Exchanges a sign-in link's token hash for a session, which the client stores in its
 * cookies. A token works once. Auth answers an unknown token the same way as a used or
 * expired one, so the user gets one message for all three.
 */
export const verifySignInLink = async (
  supabase: SupabaseClientT,
  tokenHash: string
): Promise<ActionResultT> => {
  const { error } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash
  });
  if (!error) {
    return { ok: true, data: undefined };
  }
  if (error.code !== "otp_expired") {
    console.error("verifySignInLink: Auth refused a sign-in link.", {
      code: error.code,
      status: error.status
    });
  }
  return {
    ok: false,
    message: "This sign-in link has expired or was already used. Ask for a new one."
  };
};
