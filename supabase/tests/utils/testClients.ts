import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import pg from "pg";

import { getLocalSupabase } from "./getLocalSupabase.ts";

/** A signed-in API client for a fresh test user, with that user's id. */
export type TestUserT = { client: SupabaseClient; userId: string };

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

/** An API client with no session: what a signed-out visitor can do. */
export const createAnonClient = (): SupabaseClient => {
  const { apiUrl, anonKey } = getLocalSupabase();
  return createClient(apiUrl, anonKey, clientOptions);
};

/** An API client with the service role key, which bypasses RLS. Setup and cleanup only. */
export const createServiceClient = (): SupabaseClient => {
  const { apiUrl, serviceRoleKey } = getLocalSupabase();
  return createClient(apiUrl, serviceRoleKey, clientOptions);
};

/**
 * Creates a confirmed user through the admin API and signs in as them. Each call makes a
 * new user with a random email, so tests never share one. Delete it with `deleteTestUser`.
 */
export const createTestUser = async (): Promise<TestUserT> => {
  const email = `test-${randomUUID()}@example.com`;
  const password = randomUUID();
  const { data, error } = await createServiceClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) throw error;

  const client = createAnonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password
  });
  if (signInError) throw signInError;
  return { client, userId: data.user.id };
};

/** Deletes a user made by `createTestUser`, along with rows that cascade from it. */
export const deleteTestUser = async (userId: string): Promise<void> => {
  const { error } = await createServiceClient().auth.admin.deleteUser(userId);
  if (error) throw error;
};

// Runs SQL through `supabase db query`, which reaches the hosted project with only the
// access token. The CLI wraps rows in a JSON object with a `rows` array.
const runSqlWithCli = <RowT>(sql: string, targetFlag: string): RowT[] => {
  const output = execFileSync(
    "npx",
    ["supabase", "db", "query", targetFlag, "--output-format", "json", sql],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  const parsed = JSON.parse(output) as { rows?: RowT[]; error?: { message: string } };
  if (!parsed.rows) throw new Error(parsed.error?.message ?? `No rows in: ${output}`);
  return parsed.rows;
};

/**
 * Runs SQL as `postgres`, the role migrations run as, for test setup the API cannot do:
 * creating and dropping objects, or reading the catalog. With `SUPABASE_QUERY_FLAG` set
 * (`--linked` in CI, for the hosted project), it goes through `supabase db query` with that
 * flag instead of a direct connection to the local stack.
 */
export const runSql = async <RowT extends Record<string, unknown>>(
  sql: string
): Promise<RowT[]> => {
  const queryFlag = process.env.SUPABASE_QUERY_FLAG;
  if (queryFlag) return runSqlWithCli<RowT>(sql, queryFlag);

  const client = new pg.Client({ connectionString: getLocalSupabase().dbUrl });
  await client.connect();
  try {
    const result = await client.query<RowT>(sql);
    return result.rows;
  } finally {
    await client.end();
  }
};
