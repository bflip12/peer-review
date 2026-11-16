import type { NextRequest } from "next/server";
import { z } from "zod";

import { getSignedInUserId } from "@/features/auth/data/getSignedInUserId";
import { getLinkPlatforms } from "@/features/catalog/data/getLinkPlatforms";
import { getSearchQueryParam } from "@/features/catalog/utils/getSearchQueryParam";
import { findSimilarDjs } from "@/features/djs/data/findSimilarDjs";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

const cityIdSchema = z.coerce.number().int().positive();

/**
 * The DJ form's duplicate check: `/api/djs/similar?q=dj%20rush&cityId=4887398`. DJs with
 * exactly that name in any city, then similar names in that city or with no city
 * (`search_artists`). `cityId` is optional; without it every similar name counts. A
 * `cityId` that is not an ID is ignored. Signed-in users only, as is adding a DJ; anyone
 * else, and a missing query, gets an empty list.
 */
export const GET = async (request: NextRequest): Promise<Response> => {
  const query = getSearchQueryParam(request.nextUrl.searchParams);
  if (!query) {
    return Response.json([]);
  }
  const cityId = cityIdSchema.safeParse(request.nextUrl.searchParams.get("cityId"));
  const supabase = await createServerSupabaseClient();
  if (!(await getSignedInUserId(supabase))) {
    return Response.json([]);
  }
  const platforms = await getLinkPlatforms(supabase, "artist");
  return Response.json(
    await findSimilarDjs(supabase, {
      query,
      cityId: cityId.success ? cityId.data : null,
      platforms
    })
  );
};
