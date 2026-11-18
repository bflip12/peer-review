import "server-only";

import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { SoundSystemT } from "../venues.types";

// The cap trigger's SQLSTATE, and the brand cap in check_creation_cap (ADR 0026).
const CREATION_CAP = "PR001";
const SOUND_SYSTEM_CAP = 10;

/**
 * Adds a brand to the shared list as the signed-in user, or returns the listed brand
 * whose name matches it ignoring case, accents, spaces, and punctuation
 * (`create_sound_system`). The daily cap comes back as a message; anything else is
 * thrown, since the action checks the name first.
 */
export const createSoundSystem = async (
  supabase: SupabaseClientT,
  name: string
): Promise<ActionResultT<SoundSystemT>> => {
  const { data, error } = await supabase
    .rpc("create_sound_system", { brand_name: name })
    .single();
  if (error?.code === CREATION_CAP) {
    return {
      ok: false,
      message: `You've added ${SOUND_SYSTEM_CAP} sound systems today. You can add more tomorrow.`
    };
  }
  if (error) {
    throw error;
  }
  return { ok: true, data: { id: data.id, name: data.name } };
};
