import "server-only";

import { getProfile } from "@/features/profiles/data/getProfile";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

/**
 * Where a user goes once signed in: to pick a handle when they have no profile yet, home
 * otherwise. Shared by email links and Google sign-in.
 */
export const getPathAfterSignIn = async (
  supabase: SupabaseClientT,
  userId: string
): Promise<"/" | "/welcome"> => ((await getProfile(supabase, userId)) ? "/" : "/welcome");
