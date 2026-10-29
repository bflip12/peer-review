import "server-only";

import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { NewProfileT } from "../profiles.types";

// Postgres "unique violation", and the constraints that raise it on profiles.
const UNIQUE_VIOLATION = "23505";
const HANDLE_KEY = "profiles_handle_key";
const PRIMARY_KEY = "profiles_pkey";

/**
 * Creates the signed-in user's profile. The database sets the id from the session. A
 * taken handle comes back as a field error. A user who already has a profile (a second
 * tab, a double submit) gets success and keeps the profile they have.
 */
export const createProfile = async (
  supabase: SupabaseClientT,
  { handle, displayName }: NewProfileT
): Promise<ActionResultT> => {
  const { error } = await supabase
    .from("profiles")
    .insert({ handle, display_name: displayName });
  if (!error) {
    return { ok: true, data: undefined };
  }
  if (error.code === UNIQUE_VIOLATION && error.message.includes(PRIMARY_KEY)) {
    return { ok: true, data: undefined };
  }
  if (error.code === UNIQUE_VIOLATION && error.message.includes(HANDLE_KEY)) {
    return {
      ok: false,
      message: "Choose another handle.",
      fieldErrors: { handle: ["That handle is taken."] }
    };
  }
  throw error;
};
