import { randomUUID } from "node:crypto";
import {
  combineChunks,
  createChunks,
  createServerClient,
  stringFromBase64URL,
  stringToBase64URL
} from "@supabase/ssr";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getLocalSupabase } from "../../../supabase/tests/utils/getLocalSupabase";
import {
  createServiceClient,
  deleteTestUser
} from "../../../supabase/tests/utils/testClients";
import { updateSession } from "./updateSession";

// The cookie value prefix @supabase/ssr writes before the base64url-encoded session.
const BASE64_PREFIX = "base64-";

type CookieT = { name: string; value: string };

// Signs a new user in through @supabase/ssr with a cookie jar in memory, as a browser
// would after following a sign-in link. Returns the user's id and the cookies it set.
const signInWithCookies = async (): Promise<{ userId: string; cookies: CookieT[] }> => {
  const { apiUrl, anonKey } = getLocalSupabase();
  const email = `test-${randomUUID()}@example.com`;
  const service = createServiceClient();
  const created = await service.auth.admin.createUser({ email, email_confirm: true });
  if (created.error) {
    throw created.error;
  }
  const link = await service.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) {
    throw link.error;
  }

  const jar = new Map<string, string>();
  const client = createServerClient(apiUrl, anonKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          jar.set(name, value);
        }
      }
    }
  });
  const verified = await client.auth.verifyOtp({
    type: "email",
    token_hash: link.data.properties.hashed_token
  });
  if (verified.error) {
    throw verified.error;
  }
  return {
    userId: created.data.user.id,
    cookies: [...jar].map(([name, value]) => ({ name, value }))
  };
};

// Rewrites the session in the cookies so its access token reads as expired, which makes
// the next getClaims() refresh it.
const expireSession = async (cookies: CookieT[]): Promise<CookieT[]> => {
  const key = cookies[0].name.replace(/\.\d+$/, "");
  const stored = await combineChunks(
    key,
    (name) => cookies.find((cookie) => cookie.name === name)?.value
  );
  if (!stored) {
    throw new Error("No session cookie found.");
  }
  const session = JSON.parse(stringFromBase64URL(stored.slice(BASE64_PREFIX.length))) as {
    expires_at: number;
  };
  // 1, not 0: auth-js skips the expiry check when expires_at is falsy.
  session.expires_at = 1;
  return createChunks(key, BASE64_PREFIX + stringToBase64URL(JSON.stringify(session)));
};

const requestWith = (cookies: CookieT[]): NextRequest =>
  new NextRequest("http://localhost:3000/", {
    headers: {
      cookie: cookies.map(({ name, value }) => `${name}=${value}`).join("; ")
    }
  });

describe("updateSession", () => {
  let userId: string;
  let cookies: CookieT[];

  beforeAll(async () => {
    const { apiUrl, anonKey } = getLocalSupabase();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", apiUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", anonKey);
    ({ userId, cookies } = await signInWithCookies());
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await deleteTestUser(userId);
  });

  it("passes a signed-out request through without setting cookies", async () => {
    const result = await updateSession(requestWith([]));

    expect(result.headers.get("x-middleware-next")).toBe("1");
    expect(result.cookies.getAll()).toEqual([]);
  });

  it("passes a request with a current session through without setting cookies", async () => {
    const result = await updateSession(requestWith(cookies));

    expect(result.headers.get("x-middleware-next")).toBe("1");
    expect(result.cookies.getAll()).toEqual([]);
  });

  it("refreshes an expired session and keeps the response out of shared caches", async () => {
    const expired = await expireSession(cookies);

    const result = await updateSession(requestWith(expired));

    const written = result.cookies.getAll().map(({ name }) => name);
    expect(result.headers.get("x-middleware-next")).toBe("1");
    expect(written).toEqual(expired.map(({ name }) => name));
    expect(result.headers.get("cache-control")).toContain("private");
    expect(result.headers.get("cache-control")).toContain("no-store");
  });

  it("passes the refreshed session on to the page in the same request", async () => {
    const expired = await expireSession(cookies);

    const result = await updateSession(requestWith(expired));

    // Next.js hands the page the request cookies the proxy sets in this header.
    const passedOn = result.headers.get("x-middleware-request-cookie") ?? "";
    const refreshed = result.cookies.getAll().map(({ value }) => value);
    expect(refreshed.length).toBeGreaterThan(0);
    expect(refreshed.every((value) => passedOn.includes(value))).toBe(true);
  });
});
