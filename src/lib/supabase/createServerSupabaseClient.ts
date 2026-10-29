import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

import type { Database } from "./database.types";
import { getSupabaseEnv } from "./getSupabaseEnv";
import type { SupabaseClientT } from "./supabase.types";

/**
 * A Supabase client for server components, server actions, and route handlers, signed in
 * as the user whose session cookies came with the request. Make a new one per request.
 *
 * Server components cannot set cookies, so a token refresh there is not saved. The proxy
 * (`src/proxy.ts`) refreshes the session before any page renders, so that case does not
 * lose a session. Server actions and route handlers can set cookies, and do.
 */
export const createServerSupabaseClient = async (): Promise<SupabaseClientT> => {
  // Auth checks token expiry with Date.now(). With partial prefetching, a render can read
  // cookies before a request arrives, and Cache Components refuses the clock there.
  // connection() holds everything after it until request time.
  await connection();
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component, which cannot set cookies. See above.
        }
      }
    }
  });
};
