import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { TestUserT } from "../../../../supabase/tests/utils/testClients";
import {
  createTestUser,
  deleteTestUser,
  runSql
} from "../../../../supabase/tests/utils/testClients";
import { createProfile } from "./createProfile";
import { getProfile } from "./getProfile";

// A handle no other test run uses: "t" and 12 random hex characters.
const newHandle = (): string => `t${randomUUID().replaceAll("-", "").slice(0, 12)}`;

describe("profile data functions", () => {
  const users: TestUserT[] = [];
  const newUser = async (): Promise<{ client: SupabaseClientT; userId: string }> => {
    const user = await createTestUser();
    users.push(user);
    return { client: user.client as SupabaseClientT, userId: user.userId };
  };

  afterAll(async () => {
    await Promise.all(users.map((user) => deleteTestUser(user.userId)));
  });

  describe("getProfile", () => {
    it("returns null for a user who has not picked a handle", async () => {
      const { client, userId } = await newUser();

      const result = await getProfile(client, userId);

      expect(result).toBeNull();
    });

    it("returns the signed-in user's own banned profile", async () => {
      const { client, userId } = await newUser();
      const handle = newHandle();
      await createProfile(client, { handle, displayName: null });
      await runSql(
        `update public.profiles set account_status = 'banned' where id = '${userId}'`
      );

      const result = await getProfile(client, userId);

      expect(result).toEqual({ handle, displayName: null, accountStatus: "banned" });
    });
  });

  describe("createProfile", () => {
    it("saves the handle and display name for the signed-in user", async () => {
      const { client, userId } = await newUser();
      const handle = newHandle();

      const result = await createProfile(client, { handle, displayName: "Rush" });

      expect(result).toEqual({ ok: true, data: undefined });
      expect(await getProfile(client, userId)).toEqual({
        handle,
        displayName: "Rush",
        accountStatus: "active"
      });
    });

    it("says on the handle field when another user has the handle, in any case", async () => {
      const [alice, bob] = await Promise.all([newUser(), newUser()]);
      const handle = newHandle();
      await createProfile(alice.client, { handle, displayName: null });

      const result = await createProfile(bob.client, {
        handle: handle.toUpperCase(),
        displayName: null
      });

      expect(result).toEqual({
        ok: false,
        message: "Choose another handle.",
        fieldErrors: { handle: ["That handle is taken."] }
      });
    });

    it("succeeds without changes when the user already has a profile", async () => {
      const { client, userId } = await newUser();
      const handle = newHandle();
      await createProfile(client, { handle, displayName: null });

      const result = await createProfile(client, {
        handle: newHandle(),
        displayName: "Second try"
      });

      expect(result).toEqual({ ok: true, data: undefined });
      expect(await getProfile(client, userId)).toEqual({
        handle,
        displayName: null,
        accountStatus: "active"
      });
    });
  });
});
