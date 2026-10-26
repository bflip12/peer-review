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

/**
 * Runs SQL as `postgres`, the role migrations run as, for test setup the API cannot do:
 * creating and dropping objects, or reading the catalog.
 */
export const runSql = async <RowT extends Record<string, unknown>>(
  sql: string
): Promise<RowT[]> => {
  const client = new pg.Client({ connectionString: getLocalSupabase().dbUrl });
  await client.connect();
  try {
    const result = await client.query<RowT>(sql);
    return result.rows;
  } finally {
    await client.end();
  }
};
