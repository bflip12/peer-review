import type { Database } from "@/lib/supabase/database.types";

/** What the header and the sign-in flow need from a profile. */
export type ProfileSummaryT = {
  handle: string;
  displayName: string | null;
  accountStatus: Database["public"]["Enums"]["account_status"];
};

/** The profile form's input, after `profileSchema`. */
export type NewProfileT = {
  handle: string;
  displayName: string | null;
};
