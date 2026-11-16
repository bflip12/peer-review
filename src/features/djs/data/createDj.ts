import "server-only";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import type { ActionResultT } from "@/lib/actions/actionResult.types";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { DjInputT } from "../djs.types";
import { getDjWriteFailure } from "../utils/getDjWriteFailure";

/**
 * Adds a DJ as the signed-in user, with their links, in one transaction
 * (`create_artist`). Returns the new DJ's short ID. The daily cap, a taken name and
 * city, and a refused link come back as form messages; anything else is thrown.
 */
export const createDj = async (
  supabase: SupabaseClientT,
  input: DjInputT,
  platforms: LinkPlatformT[]
): Promise<ActionResultT<{ shortId: string }>> => {
  const { data, error } = await supabase
    .rpc("create_artist", {
      name: input.name,
      // The generated type leaves out null, which the function takes for no city.
      city_id: input.cityId as number,
      links: input.links
    })
    .single();
  if (error) {
    const failure = getDjWriteFailure(error, { input, platforms });
    if (failure) {
      return failure;
    }
    throw error;
  }
  return { ok: true, data: { shortId: data.short_id } };
};
