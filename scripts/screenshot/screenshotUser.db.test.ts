import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it } from "vitest";

import { getLocalSupabase } from "../../supabase/tests/utils/getLocalSupabase.ts";
import { runSql } from "../../supabase/tests/utils/testClients.ts";
import {
  createScreenshotUser,
  deleteScreenshotUser,
  SCREENSHOT_HANDLE
} from "./screenshotUser.ts";

const profileOf = async (
  userId: string
): Promise<Record<string, unknown> | undefined> => {
  const [row] = await runSql<Record<string, unknown>>(
    `select handle, display_name from public.profiles where id = '${userId}'`
  );
  return row;
};

const userExists = async (userId: string): Promise<boolean> => {
  const rows = await runSql(`select 1 from auth.users where id = '${userId}'`);
  return rows.length === 1;
};

describe("screenshot user", () => {
  const created: string[] = [];

  afterEach(async () => {
    await Promise.all(created.splice(0).map(deleteScreenshotUser));
  });

  it("creates a user with the dj_rush profile for --as=user", async () => {
    const result = await createScreenshotUser("user");
    created.push(result.userId);

    expect(await profileOf(result.userId)).toEqual({
      handle: SCREENSHOT_HANDLE,
      display_name: "DJ Rush"
    });
  });

  it("creates a user without a profile for --as=new", async () => {
    const result = await createScreenshotUser("new");
    created.push(result.userId);

    expect(await profileOf(result.userId)).toBeUndefined();
  });

  it("returns a sign-in token that signs in as that user", async () => {
    const { userId, tokenHash } = await createScreenshotUser("user");
    created.push(userId);
    const { apiUrl, anonKey } = getLocalSupabase();
    const client = createClient(apiUrl, anonKey, { auth: { persistSession: false } });

    const result = await client.auth.verifyOtp({ type: "email", token_hash: tokenHash });

    expect(result.error).toBeNull();
    expect(result.data.user?.id).toBe(userId);
  });

  it("replaces a dj_rush user left over from a run that did not clean up", async () => {
    const leftover = await createScreenshotUser("user");

    const result = await createScreenshotUser("user");
    created.push(result.userId);

    expect(await userExists(leftover.userId)).toBe(false);
    expect(await profileOf(result.userId)).toMatchObject({ handle: SCREENSHOT_HANDLE });
  });

  it("deletes the user and its profile", async () => {
    const { userId } = await createScreenshotUser("user");

    await deleteScreenshotUser(userId);

    expect(await userExists(userId)).toBe(false);
    expect(await profileOf(userId)).toBeUndefined();
  });
});
