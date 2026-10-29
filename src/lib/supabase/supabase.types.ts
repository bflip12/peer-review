import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/** A Supabase client typed with the generated schema. */
export type SupabaseClientT = SupabaseClient<Database>;
