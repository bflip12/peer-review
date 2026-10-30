import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getLocalSupabase } from "./getLocalSupabase.ts";
import { getSignInLink } from "./getSignInLink.ts";

/** A PKCE code with the client whose storage holds its code verifier. */
export type PkceCodeT = { client: SupabaseClient; code: string; email: string };

/**
 * Starts a PKCE sign-in for a new user and returns the code Auth puts on the redirect, as
 * Google sign-in does on `/auth/callback`. Google cannot run in tests, so this uses an
 * email sign-in in PKCE mode: Auth's `/verify` (type `signup`, since the user is new)
 * answers with a redirect carrying `?code=`. The client stores the verifier in memory.
 * The user exists once this returns; delete it after the test.
 */
export const createPkceCode = async (): Promise<PkceCodeT> => {
  const { apiUrl, anonKey } = getLocalSupabase();
  const storage = new Map<string, string>();
  const client = createClient(apiUrl, anonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => {
          storage.set(key, value);
        },
        removeItem: (key) => {
          storage.delete(key);
        }
      }
    }
  });
  const email = `test-${randomUUID()}@example.com`;
  const { error } = await client.auth.signInWithOtp({ email });
  if (error) {
    throw error;
  }
  const tokenHash = (await getSignInLink(email)).searchParams.get("token_hash") ?? "";
  const verify = new URL(`${apiUrl}/auth/v1/verify`);
  verify.search = new URLSearchParams({
    token: tokenHash,
    type: "signup",
    redirect_to: "http://localhost:3000/auth/callback"
  }).toString();
  const response = await fetch(verify, { redirect: "manual" });
  const code = new URL(response.headers.get("location") ?? "").searchParams.get("code");
  if (!code) {
    throw new Error(`Auth's /verify did not redirect with a code (${response.status}).`);
  }
  return { client, code, email };
};
