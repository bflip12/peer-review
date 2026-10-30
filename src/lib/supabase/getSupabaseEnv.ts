/** The Supabase project's URL and publishable key. Both are public; RLS guards the data. */
export type SupabaseEnvT = {
  url: string;
  publishableKey: string;
};

/**
 * Reads the Supabase settings from the environment. Vercel sets them per environment
 * (production and preview), and `npm run db:env` writes the local stack's to `.env.local`.
 * Throws when either is missing, or when the URL has a path (the REST API URL,
 * `.../rest/v1`, pasted by mistake), so a misconfigured deploy fails on its first request
 * with a message that says what to fix.
 */
export const getSupabaseEnv = (): SupabaseEnvT => {
  // Read by full literal name: Next.js inlines only those into the browser bundle.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set. " +
        "Locally, run npm run db:env. On Vercel, set them in the project's settings."
    );
  }
  const { origin, pathname } = new URL(url);
  if (pathname !== "/") {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be the project URL with no path, like ${origin}. ` +
        `It is ${url}.`
    );
  }
  return { url, publishableKey };
};
