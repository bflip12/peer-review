import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import type { TestUserT } from "./utils/testClients.ts";
import {
  createAnonClient,
  createTestUser,
  deleteTestUser,
  runSql
} from "./utils/testClients.ts";

// Postgres "insufficient privilege": anon has no grant on the function.
const PERMISSION_DENIED = "42501";

// A handle no other test run uses: "t" and 12 random hex characters.
const newHandle = (): string => `t${randomUUID().replaceAll("-", "").slice(0, 12)}`;

// Counts a user's rows in auth.users, auth.sessions, and public.profiles, as `postgres`.
const countRows = async (
  userId: string
): Promise<{ users: number; sessions: number; profiles: number }> => {
  const [row] = await runSql<{ users: number; sessions: number; profiles: number }>(`
    select
      (select count(*)::int from auth.users where id = '${userId}') as users,
      (select count(*)::int from auth.sessions where user_id = '${userId}') as sessions,
      (select count(*)::int from public.profiles where id = '${userId}') as profiles`);
  return row;
};

describe("delete_my_account", () => {
  // Users the test did not delete, removed in afterAll.
  const users: TestUserT[] = [];
  const newUserWithProfile = async (): Promise<TestUserT> => {
    const user = await createTestUser();
    users.push(user);
    const { error } = await user.client.from("profiles").insert({ handle: newHandle() });
    if (error) {
      throw error;
    }
    return user;
  };
  const forget = (user: TestUserT): void => {
    users.splice(users.indexOf(user), 1);
  };

  afterAll(async () => {
    await Promise.all(users.map((user) => deleteTestUser(user.userId)));
  });

  it("refuses a signed-out visitor", async () => {
    const result = await createAnonClient().rpc("delete_my_account");

    expect(result.error?.code).toBe(PERMISSION_DENIED);
  });

  it("deletes the caller's auth user, sessions, and profile", async () => {
    const alice = await newUserWithProfile();

    const result = await alice.client.rpc("delete_my_account");
    forget(alice);

    expect(result.error).toBeNull();
    expect(await countRows(alice.userId)).toEqual({ users: 0, sessions: 0, profiles: 0 });
  });

  it("leaves other users' accounts alone", async () => {
    const [alice, bob] = await Promise.all([newUserWithProfile(), newUserWithProfile()]);

    await alice.client.rpc("delete_my_account");
    forget(alice);

    expect(await countRows(bob.userId)).toEqual({ users: 1, sessions: 1, profiles: 1 });
  });

  it("stops the deleted user's refresh token from working", async () => {
    const alice = await newUserWithProfile();
    const { data } = await alice.client.auth.getSession();
    const refreshToken = data.session?.refresh_token ?? "";

    await alice.client.rpc("delete_my_account");
    forget(alice);
    const result = await createAnonClient().auth.refreshSession({
      refresh_token: refreshToken
    });

    expect(result.data.session).toBeNull();
    expect(result.error).not.toBeNull();
  });
});
