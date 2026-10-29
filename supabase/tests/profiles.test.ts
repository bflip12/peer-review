import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestUserT } from "./utils/testClients.ts";
import {
  createAnonClient,
  createTestUser,
  deleteTestUser,
  runSql
} from "./utils/testClients.ts";

// Postgres "insufficient privilege": no grant, or a row RLS refuses on insert.
const PERMISSION_DENIED = "42501";
const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";

// A handle no other test run uses: "t" and 12 random hex characters.
const newHandle = (): string => `t${randomUUID().replaceAll("-", "").slice(0, 12)}`;

// Gives a test user a profile, as the user would after first sign-in.
const createProfile = async (user: TestUserT, handle = newHandle()): Promise<string> => {
  const { error } = await user.client.from("profiles").insert({ handle });
  if (error) {
    throw error;
  }
  return handle;
};

// Reads a profile as `postgres`, so the result does not depend on the policies under test.
const readProfile = async (id: string): Promise<Record<string, unknown>> => {
  const [row] = await runSql<Record<string, unknown>>(
    `select handle, display_name, role, account_status from public.profiles where id = '${id}'`
  );
  return row;
};

describe("profiles", () => {
  const users: TestUserT[] = [];
  const newUser = async (): Promise<TestUserT> => {
    const user = await createTestUser();
    users.push(user);
    return user;
  };

  afterAll(async () => {
    await Promise.all(users.map((user) => deleteTestUser(user.userId)));
  });

  describe("creating a profile", () => {
    it("creates the signed-in user's profile with the default role and status", async () => {
      const alice = await newUser();
      const handle = newHandle();

      const result = await alice.client
        .from("profiles")
        .insert({ handle, display_name: "Alice" })
        .select("id, handle, display_name, role, account_status, account_status_at")
        .single();

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        id: alice.userId,
        handle,
        display_name: "Alice",
        role: "user",
        account_status: "active",
        account_status_at: null
      });
    });

    it("refuses a profile written for another user", async () => {
      const [alice, bob] = await Promise.all([newUser(), newUser()]);

      const result = await alice.client
        .from("profiles")
        .insert({ id: bob.userId, handle: newHandle() });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses a second profile for the same user", async () => {
      const alice = await newUser();
      await createProfile(alice);

      const result = await alice.client.from("profiles").insert({ handle: newHandle() });

      expect(result.error?.code).toBe(UNIQUE_VIOLATION);
    });

    it("refuses role, status, and timestamps set by the user", async () => {
      const alice = await newUser();

      const result = await Promise.all(
        [
          { role: "admin" },
          { account_status: "active" },
          { account_status_at: new Date().toISOString() },
          { created_at: new Date().toISOString() }
        ].map((columns) =>
          alice.client.from("profiles").insert({ handle: newHandle(), ...columns })
        )
      );

      expect(result.map(({ error }) => error?.code)).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED,
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });

    it("refuses a signed-out visitor", async () => {
      const result = await createAnonClient()
        .from("profiles")
        .insert({ handle: newHandle() });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });
  });

  describe("handle and display name rules", () => {
    let alice: TestUserT;

    beforeAll(async () => {
      alice = await newUser();
    });

    it("refuses a handle another profile has, ignoring case", async () => {
      const bob = await newUser();
      const taken = await createProfile(bob);

      const result = await alice.client
        .from("profiles")
        .insert({ handle: taken.toUpperCase() });

      expect(result.error?.code).toBe(UNIQUE_VIOLATION);
    });

    it("accepts letters, digits, underscores, and dots, 2 to 30 characters", async () => {
      const handles = ["ab", "A.b_9", "x".repeat(30)];

      const result = await Promise.all(
        handles.map(async (handle) => {
          const user = await newUser();
          const { error } = await user.client.from("profiles").insert({ handle });
          if (!error) {
            await runSql(`delete from public.profiles where id = '${user.userId}'`);
          }
          return error?.code;
        })
      );

      expect(result).toEqual([undefined, undefined, undefined]);
    });

    it("refuses a handle that is too short, too long, or has other characters", async () => {
      const handles = ["a", "x".repeat(31), "has space", "dj-rush", "café", "@alice", ""];

      const result = await Promise.all(
        handles.map((handle) => alice.client.from("profiles").insert({ handle }))
      );

      expect(result.map(({ error }) => error?.code)).toEqual(
        handles.map(() => CHECK_VIOLATION)
      );
    });

    it("refuses a missing handle", async () => {
      const result = await alice.client
        .from("profiles")
        .insert({ display_name: "Alice" });

      expect(result.error?.code).toBe("23502");
    });

    it("accepts no display name, and one of up to 50 characters", async () => {
      const names = [null, "Ä".repeat(50)];

      const result = await Promise.all(
        names.map(async (display_name) => {
          const user = await newUser();
          const { error } = await user.client
            .from("profiles")
            .insert({ handle: newHandle(), display_name });
          return error?.code;
        })
      );

      expect(result).toEqual([undefined, undefined]);
    });

    it("refuses an empty, blank, or 51-character display name", async () => {
      const names = ["", "   ", "\t\n", "x".repeat(51)];

      const result = await Promise.all(
        names.map((display_name) =>
          alice.client.from("profiles").insert({ handle: newHandle(), display_name })
        )
      );

      expect(result.map(({ error }) => error?.code)).toEqual(
        names.map(() => CHECK_VIOLATION)
      );
    });
  });

  describe("reading profiles", () => {
    let alice: TestUserT;
    let bob: TestUserT;
    let aliceHandle: string;

    beforeAll(async () => {
      [alice, bob] = await Promise.all([newUser(), newUser()]);
      aliceHandle = await createProfile(alice);
    });

    it("shows an active profile to signed-out visitors and other users", async () => {
      const result = await Promise.all(
        [createAnonClient(), bob.client].map((client) =>
          client.from("profiles").select("handle").eq("id", alice.userId)
        )
      );

      expect(result.map(({ data, error }) => [data, error])).toEqual([
        [[{ handle: aliceHandle }], null],
        [[{ handle: aliceHandle }], null]
      ]);
    });

    it("returns only the profile columns, with no email", async () => {
      const result = await bob.client
        .from("profiles")
        .select("*")
        .eq("id", alice.userId)
        .single();

      expect(Object.keys(result.data ?? {}).sort()).toEqual([
        "account_status",
        "account_status_at",
        "created_at",
        "display_name",
        "handle",
        "id",
        "role"
      ]);
    });
  });

  describe("banned profiles", () => {
    let banned: TestUserT;
    let bob: TestUserT;
    let moderator: TestUserT;
    let admin: TestUserT;
    let bannedAdmin: TestUserT;

    beforeAll(async () => {
      [banned, bob, moderator, admin, bannedAdmin] = await Promise.all(
        Array.from({ length: 5 }, newUser)
      );
      await Promise.all(
        [banned, moderator, admin, bannedAdmin].map((user) => createProfile(user))
      );
      // No API path changes these columns yet, so the setup writes them as `postgres`.
      await runSql(`
        update public.profiles set account_status = 'banned'
          where id in ('${banned.userId}', '${bannedAdmin.userId}');
        update public.profiles set role = 'moderator' where id = '${moderator.userId}';
        update public.profiles set role = 'admin'
          where id in ('${admin.userId}', '${bannedAdmin.userId}');`);
    });

    it("hides a banned profile from signed-out visitors, users, and moderators", async () => {
      const readers = [createAnonClient(), bob.client, moderator.client];
      const result = await Promise.all(
        readers.map((client) =>
          client.from("profiles").select("id").eq("id", banned.userId)
        )
      );

      expect(result.map(({ data, error }) => [data, error])).toEqual(
        readers.map(() => [[], null])
      );
    });

    it("shows a banned user their own profile", async () => {
      const result = await banned.client
        .from("profiles")
        .select("id, account_status")
        .eq("id", banned.userId);

      expect([result.data, result.error]).toEqual([
        [{ id: banned.userId, account_status: "banned" }],
        null
      ]);
    });

    it("refuses a banned user changing their own profile", async () => {
      const result = await banned.client
        .from("profiles")
        .update({ display_name: "Still here" })
        .eq("id", banned.userId)
        .select();

      expect([result.data, result.error]).toEqual([[], null]);
    });

    it("shows a banned profile to an admin", async () => {
      const result = await admin.client
        .from("profiles")
        .select("id")
        .eq("id", banned.userId);

      expect([result.data, result.error]).toEqual([[{ id: banned.userId }], null]);
    });

    it("hides a banned profile from a banned admin", async () => {
      const result = await bannedAdmin.client
        .from("profiles")
        .select("id")
        .eq("id", banned.userId);

      expect([result.data, result.error]).toEqual([[], null]);
    });
  });

  describe("updating a profile", () => {
    let alice: TestUserT;
    let bob: TestUserT;

    beforeAll(async () => {
      [alice, bob] = await Promise.all([newUser(), newUser()]);
      await Promise.all([createProfile(alice), createProfile(bob)]);
    });

    it("lets the owner change their handle and display name", async () => {
      const handle = newHandle();

      const result = await alice.client
        .from("profiles")
        .update({ handle, display_name: "Alice B" })
        .eq("id", alice.userId);

      expect(result.error).toBeNull();
      expect(await readProfile(alice.userId)).toMatchObject({
        handle,
        display_name: "Alice B"
      });
    });

    it("lets the owner clear their display name", async () => {
      const result = await alice.client
        .from("profiles")
        .update({ display_name: null })
        .eq("id", alice.userId);

      expect(result.error).toBeNull();
      expect(await readProfile(alice.userId)).toMatchObject({ display_name: null });
    });

    it("leaves another user's profile unchanged", async () => {
      const before = await readProfile(bob.userId);

      const result = await alice.client
        .from("profiles")
        .update({ display_name: "Not Bob" })
        .eq("id", bob.userId)
        .select();

      expect([result.data, result.error]).toEqual([[], null]);
      expect(await readProfile(bob.userId)).toEqual(before);
    });

    it("refuses the owner changing their own role, status, timestamps, or id", async () => {
      const result = await Promise.all(
        [
          { role: "admin" },
          { account_status: "banned" },
          { account_status_at: new Date().toISOString() },
          { created_at: new Date().toISOString() },
          { id: randomUUID() }
        ].map((columns) =>
          alice.client.from("profiles").update(columns).eq("id", alice.userId)
        )
      );

      expect(result.map(({ error }) => error?.code)).toEqual(
        result.map(() => PERMISSION_DENIED)
      );
      expect(await readProfile(alice.userId)).toMatchObject({
        role: "user",
        account_status: "active"
      });
    });

    it("refuses a signed-out visitor", async () => {
      const result = await createAnonClient()
        .from("profiles")
        .update({ display_name: "Anon" })
        .eq("id", alice.userId);

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });
  });

  describe("deleting", () => {
    it("refuses a user deleting their profile through the API", async () => {
      const alice = await newUser();
      await createProfile(alice);

      const result = await alice.client.from("profiles").delete().eq("id", alice.userId);

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("deletes the profile with its auth user", async () => {
      const alice = await createTestUser();
      await createProfile(alice);

      await deleteTestUser(alice.userId);

      expect(await readProfile(alice.userId)).toBeUndefined();
    });
  });
});

describe("email addresses", () => {
  let alice: TestUserT;

  beforeAll(async () => {
    alice = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(alice.userId);
  });

  it("are in no column of any table or view the API serves", async () => {
    const result = await runSql<{ column: string }>(`
      select table_schema || '.' || table_name || '.' || column_name as column
      from information_schema.columns
      where table_schema in ('public', 'graphql_public') and column_name ilike '%mail%'`);

    expect(result).toEqual([]);
  });

  it("cannot be read from the auth schema through the API", async () => {
    const result = await Promise.all(
      [createAnonClient(), alice.client].map((client) =>
        client.schema("auth").from("users").select("email")
      )
    );

    expect(result.map(({ data, error }) => [data, error?.code])).toEqual([
      [null, "PGRST106"],
      [null, "PGRST106"]
    ]);
  });
});
