import { execFileSync } from "node:child_process";

/** Addresses and keys of the local Supabase stack. The keys are the CLI's fixed local ones. */
export type LocalSupabaseT = {
  apiUrl: string;
  dbUrl: string;
  anonKey: string;
  serviceRoleKey: string;
};

let cached: LocalSupabaseT | undefined;

/**
 * Reads the running local stack from `supabase status`. Throws when the stack is not
 * running, with the command that starts it. Cached per test file.
 */
export const getLocalSupabase = (): LocalSupabaseT => {
  if (cached) {
    return cached;
  }
  let output: string;
  try {
    output = execFileSync("npx", ["supabase", "status", "--output", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch {
    throw new Error(
      "The local Supabase stack is not running. Start it with npm run db:start."
    );
  }
  const status = JSON.parse(output) as Record<string, string>;
  cached = {
    apiUrl: status.API_URL,
    dbUrl: status.DB_URL,
    anonKey: status.ANON_KEY,
    serviceRoleKey: status.SERVICE_ROLE_KEY
  };
  return cached;
};
