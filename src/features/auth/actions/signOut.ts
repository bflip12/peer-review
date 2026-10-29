"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

/**
 * The header's "Sign out" button. Ends the session in this browser only ("local"), so
 * signing out on a phone leaves a laptop signed in. Takes no input.
 */
export const signOut = async (): Promise<void> => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    throw error;
  }
  // The header in the root layout shows who is signed in. A redirect alone keeps the
  // layout as it was, so refresh it too.
  refresh();
  redirect("/");
};
