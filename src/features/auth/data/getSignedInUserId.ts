import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

/**
 * The signed-in user's id, or null when no one is signed in. Verifies the access token
 * (`getClaims`), never trusts the cookie alone (`.claude/rules/security.md`).
 */
export const getSignedInUserId = async (
  supabase: SupabaseClientT
): Promise<string | null> => {
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
};
