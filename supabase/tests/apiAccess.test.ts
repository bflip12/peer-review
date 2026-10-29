import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestUserT } from "./utils/testClients.ts";
import {
  createAnonClient,
  createServiceClient,
  createTestUser,
  deleteTestUser,
  runSql
} from "./utils/testClients.ts";

// Postgres "insufficient privilege": no grant, or a row RLS refuses on insert.
const PERMISSION_DENIED = "42501";

// PostgREST codes for a table or function missing from its schema cache.
const NOT_IN_SCHEMA_CACHE = ["PGRST202", "PGRST205"];

// Throwaway objects that stand in for a migration's table and function.
const SETUP_SQL = `
  drop table if exists public.test_locked, public.test_notes;
  drop function if exists public.test_locked_fn(), public.test_whoami();

  -- Created with no grants, as every new object is after the lock-down migration.
  create table public.test_locked (id int);
  alter table public.test_locked enable row level security;
  create function public.test_locked_fn() returns int language sql as 'select 1';

  -- Granted the way a real migration would: grants beside the policies.
  create table public.test_notes (
    owner_id uuid not null default auth.uid() references auth.users on delete cascade,
    body text not null
  );
  alter table public.test_notes enable row level security;
  create policy "owners read their notes" on public.test_notes
    for select to authenticated using (owner_id = auth.uid());
  create policy "owners add their notes" on public.test_notes
    for insert to authenticated with check (owner_id = auth.uid());
  grant select, insert on public.test_notes to authenticated;

  create function public.test_whoami() returns uuid
    language sql security invoker set search_path = '' as 'select auth.uid()';
  grant execute on function public.test_whoami() to authenticated;

  notify pgrst, 'reload schema';`;

const CLEANUP_SQL = `
  drop table if exists public.test_locked, public.test_notes;
  drop function if exists public.test_locked_fn(), public.test_whoami();
  notify pgrst, 'reload schema';`;

// Polls until PostgREST has reloaded its schema cache and sees the new objects.
const waitForSchemaCache = async (): Promise<void> => {
  const service = createServiceClient();
  for (let attempt = 0; attempt < 50; attempt++) {
    const { error } = await service.rpc("test_whoami");
    if (!error || !NOT_IN_SCHEMA_CACHE.includes(error.code)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("PostgREST did not reload its schema cache within 5 seconds.");
};

describe("API access to public", () => {
  let alice: TestUserT;
  let bob: TestUserT;

  beforeAll(async () => {
    await runSql(SETUP_SQL);
    await waitForSchemaCache();
    alice = await createTestUser();
    bob = await createTestUser();
  });

  afterAll(async () => {
    await runSql(CLEANUP_SQL);
    await Promise.all(
      [alice, bob].filter(Boolean).map((user) => deleteTestUser(user.userId))
    );
  });

  describe("a table or function no migration granted", () => {
    it("refuses the table to signed-out and signed-in users", async () => {
      const result = await Promise.all(
        [createAnonClient(), alice.client].map((client) =>
          client.from("test_locked").select()
        )
      );

      expect(result.map(({ data, error }) => [data, error?.code])).toEqual([
        [null, PERMISSION_DENIED],
        [null, PERMISSION_DENIED]
      ]);
    });

    it("refuses the function to signed-out and signed-in users", async () => {
      const result = await Promise.all(
        [createAnonClient(), alice.client].map((client) => client.rpc("test_locked_fn"))
      );

      expect(result.map(({ data, error }) => [data, error?.code])).toEqual([
        [null, PERMISSION_DENIED],
        [null, PERMISSION_DENIED]
      ]);
    });
  });

  describe("a table granted to signed-in users, with owner-only policies", () => {
    it("shows each user only their own rows", async () => {
      await alice.client.from("test_notes").insert({ body: "Alice's note" });
      await bob.client.from("test_notes").insert({ body: "Bob's note" });

      const result = await alice.client.from("test_notes").select("body");

      expect(result.error).toBeNull();
      expect(result.data).toEqual([{ body: "Alice's note" }]);
    });

    it("refuses a row written for another user", async () => {
      const result = await alice.client
        .from("test_notes")
        .insert({ owner_id: bob.userId, body: "Not Alice's to write" });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses the table to a signed-out visitor", async () => {
      const result = await createAnonClient().from("test_notes").select();

      expect([result.data, result.error?.code]).toEqual([null, PERMISSION_DENIED]);
    });
  });

  describe("a function granted to signed-in users", () => {
    it("runs as the caller for a signed-in user and refuses a signed-out visitor", async () => {
      const result = await Promise.all([
        alice.client.rpc("test_whoami"),
        createAnonClient().rpc("test_whoami")
      ]);

      expect(result.map(({ data, error }) => [data, error?.code])).toEqual([
        [alice.userId, undefined],
        [null, PERMISSION_DENIED]
      ]);
    });
  });
});
