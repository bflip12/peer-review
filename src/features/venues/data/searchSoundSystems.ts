import "server-only";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { SoundSystemT } from "../venues.types";

// Enough to show the likely brand without a long list.
const MAX_SOUND_SYSTEM_RESULTS = 8;

/**
 * Brands for the sound system field, best match first (`search_sound_systems`,
 * ADR 0026). Nothing for an empty query. Signed-in users only.
 */
export const searchSoundSystems = async (
  supabase: SupabaseClientT,
  query: string
): Promise<SoundSystemT[]> => {
  const { data, error } = await supabase.rpc("search_sound_systems", {
    query,
    max_results: MAX_SOUND_SYSTEM_RESULTS
  });
  if (error) {
    throw error;
  }
  return data;
};
