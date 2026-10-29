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
});
