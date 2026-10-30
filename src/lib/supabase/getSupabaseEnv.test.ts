import { afterEach, describe, expect, it, vi } from "vitest";

import { getSupabaseEnv } from "./getSupabaseEnv";

describe("getSupabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the project URL and publishable key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");

    const result = getSupabaseEnv();

    expect(result).toEqual({
      url: "https://abc.supabase.co",
      publishableKey: "sb_publishable_abc"
    });
  });

  it("throws, naming the command that writes them, when either is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const result = (): unknown => getSupabaseEnv();

    expect(result).toThrow(/npm run db:env/);
  });

  it("throws when the URL has a path, such as the REST API URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co/rest/v1");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");

    const result = (): unknown => getSupabaseEnv();

    expect(result).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL must be the project URL with no path, like https://abc.supabase.co. It is https://abc.supabase.co/rest/v1."
    );
  });

  it("accepts the project URL with a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321/");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc");

    const result = getSupabaseEnv();

    expect(result.url).toBe("http://127.0.0.1:54321/");
  });
});
