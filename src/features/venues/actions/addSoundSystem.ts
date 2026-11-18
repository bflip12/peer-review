"use server";

import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

import { createSoundSystem } from "../data/createSoundSystem";
import { soundSystemNameSchema } from "../schemas/soundSystemNameSchema";
import type { SoundSystemT } from "../venues.types";

/**
 * The sound system field's "Add …": adds the typed brand to the shared list, or returns
 * the listed brand with the same folded name, so the field can show it as a tag
 * (ADR 0026). Called from the field, not as a form's action. The venue is saved with the
 * rest of the form.
 */
export const addSoundSystem = async (
  name: unknown
): Promise<ActionResultT<SoundSystemT>> => {
  const parsed = soundSystemNameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, message: z.flattenError(parsed.error).formErrors.join(" ") };
  }
  const supabase = await createServerSupabaseClient();
  if (!(await getSignedInUserId(supabase))) {
    return {
      ok: false,
      message: "You are signed out. Sign in again to add a sound system."
    };
  }
  return createSoundSystem(supabase, parsed.data);
};
