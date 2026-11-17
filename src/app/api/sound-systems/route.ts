import type { NextRequest } from "next/server";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getSearchQueryParam } from "@/features/catalog/utils/getSearchQueryParam";
import { searchSoundSystems } from "@/features/venues/data/searchSoundSystems";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

/**
 * The venue form's sound system search: `/api/sound-systems?q=funk`. Signed-in users
 * only, as is the venue form; anyone else, and a missing query, gets an empty list.
 */
export const GET = async (request: NextRequest): Promise<Response> => {
  const query = getSearchQueryParam(request.nextUrl.searchParams);
  if (!query) {
    return Response.json([]);
  }
  const supabase = await createServerSupabaseClient();
  if (!(await getSignedInUserId(supabase))) {
    return Response.json([]);
  }
  return Response.json(await searchSoundSystems(supabase, query));
};
