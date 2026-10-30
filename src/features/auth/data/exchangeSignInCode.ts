import "server-only";

import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

/**
 * Exchanges the code Google sign-in returns on `/auth/callback` for a session, which the
 * client stores in its cookies. The code works once, and only with the verifier stored in
 * the browser that started sign-in. Every failure gets one message; unexpected ones are
 * logged.
 */
export const exchangeSignInCode = async (
  supabase: SupabaseClientT,
  code: string
): Promise<ActionResultT> => {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    return { ok: true, data: undefined };
  }
  console.error("exchangeSignInCode: Auth refused a sign-in code.", {
    code: error.code,
    status: error.status
  });
  return { ok: false, message: "Google sign-in did not finish." };
};
