import type { NextRequest } from "next/server";

import { searchCities } from "@/features/catalog/data/searchCities";
import { getSearchQueryParam } from "@/features/catalog/utils/getSearchQueryParam";
import { createServerSupabaseClient } from "@/lib/supabase/createServerSupabaseClient";

/**
 * City autocomplete for the city picker: `/api/cities?q=koln`. A GET route rather than a
 * server action, because the browser sends one request per pause in typing and server
 * actions run one at a time. City names are public, so no sign-in is needed.
 */
export const GET = async (request: NextRequest): Promise<Response> => {
  const query = getSearchQueryParam(request.nextUrl.searchParams);
  if (!query) {
    return Response.json([]);
  }
  const supabase = await createServerSupabaseClient();
  return Response.json(await searchCities(supabase, query));
};
