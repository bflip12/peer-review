/** The Supabase project's URL and publishable key. Both are public; RLS guards the data. */
export type SupabaseEnvT = {
  url: string;
  publishableKey: string;
};

/**
 * Reads the Supabase settings from the environment. Vercel sets them per environment
 * (production and preview), and `npm run db:env` writes the local stack's to `.env.local`.
 * Throws when either is missing, so a misconfigured deploy fails on its first request.
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
  return { url, publishableKey };
};
