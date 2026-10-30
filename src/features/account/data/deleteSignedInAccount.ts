import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

/**
 * Deletes the signed-in user's account (`delete_my_account`), then clears the session in
 * this browser. Auth answers the sign-out with 404 for a user who no longer exists, which
 * auth-js ignores while still removing the session.
 */
export const deleteSignedInAccount = async (supabase: SupabaseClientT): Promise<void> => {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    throw error;
  }
  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) {
    throw signOutError;
  }
};
