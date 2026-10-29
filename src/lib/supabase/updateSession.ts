import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { Database } from "./database.types";
import { getSupabaseEnv } from "./getSupabaseEnv";

/**
 * Refreshes the signed-in user's session before the page renders, for `src/proxy.ts`.
 * Server components cannot write cookies, so without this an expired access token would
 * be refreshed on every request and never saved.
 *
 * Refreshed cookies go two ways: onto the request, so pages in this request read the new
 * session, and onto the response, so the browser keeps it. The library's cache headers go
 * on the response too, so no shared cache serves one user's session to another.
 */
export const updateSession = async (request: NextRequest): Promise<NextResponse> => {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      }
    }
  });

  // Refreshes an expired token. It must finish before the response is returned, or the
  // new cookies are lost (the setAll docblock in @supabase/ssr).
  await supabase.auth.getClaims();
  return response;
};
