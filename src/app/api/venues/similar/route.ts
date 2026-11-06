import type { NextRequest } from "next/server";
import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getSearchQueryParam } from "@/features/catalog/utils/getSearchQueryParam";
import { findSimilarVenues } from "@/features/venues/data/findSimilarVenues";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

const cityIdSchema = z.coerce.number().int().positive();

/**
 * The venue form's duplicate check: `/api/venues/similar?q=tresor&cityId=2950159`.
 * Venues in that city with a name like the query. Signed-in users only, as is adding a
 * venue; anyone else, and a missing query or city, gets an empty list.
 */
export const GET = async (request: NextRequest): Promise<Response> => {
  const query = getSearchQueryParam(request.nextUrl.searchParams);
  const cityId = cityIdSchema.safeParse(request.nextUrl.searchParams.get("cityId"));
  if (!query || !cityId.success) {
    return Response.json([]);
  }
  const supabase = await createServerSupabaseClient();
  if (!(await getSignedInUserId(supabase))) {
    return Response.json([]);
  }
  return Response.json(await findSimilarVenues(supabase, query, cityId.data));
};
