import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getLocalSupabase } from "./utils/getLocalSupabase.ts";
import type { TestUserT } from "./utils/testClients.ts";
import {
  createAnonClient,
  createTestUser,
  deleteTestUser,
  runSql
} from "./utils/testClients.ts";

// Postgres "insufficient privilege": no grant for the role.
const PERMISSION_DENIED = "42501";
const CHECK_VIOLATION = "23514";
// The cap trigger's own SQLSTATE.
const CREATION_CAP = "PR001";

type KindT = "venue" | "artist" | "collective" | "event" | "lineup_slot";

const KIND_COLUMNS: Record<KindT, string> = {
  venue: "venue_id",
  artist: "artist_id",
  collective: "collective_id",
  event: "event_id",
  lineup_slot: "lineup_slot_id"
};

// Inserts creations rows as `postgres`, the way the create functions will. The entries
// they point at do not exist yet, so the ids are random. `ageHours` backdates the rows.
const insertCreations = async (
  userId: string,
  kind: KindT,
  count: number,
  ageHours = 0
): Promise<void> => {
  await runSql(`
    insert into public.creations (created_by, ${KIND_COLUMNS[kind]}, created_at)
    select '${userId}', gen_random_uuid(), now() - interval '${ageHours} hours'
    from generate_series(1, ${count})`);
};

// The Postgres error code of a statement, or null when it succeeds.
const errorCode = async (run: () => Promise<unknown>): Promise<string | null> => {
  try {
    await run();
    return null;
  } catch (error) {
    return (error as { code?: string }).code ?? "unknown";
  }
};

const createProfile = async (user: TestUserT): Promise<void> => {
  const handle = `t${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const { error } = await user.client.from("profiles").insert({ handle });
  if (error) {
    throw error;
  }
};

describe("creations", () => {
  const users: TestUserT[] = [];
  const newUser = async (role?: "moderator" | "admin"): Promise<TestUserT> => {
    const user = await createTestUser();
    users.push(user);
    await createProfile(user);
    if (role) {
      await runSql(
        `update public.profiles set role = '${role}' where id = '${user.userId}'`
      );
    }
    return user;
  };

  afterAll(async () => {
    await Promise.all(users.map((user) => deleteTestUser(user.userId)));
  });

  describe("exactly one entry per row", () => {
    it("refuses a row with no entry", async () => {
      const alice = await newUser();

      const code = await errorCode(() =>
        runSql(`insert into public.creations (created_by) values ('${alice.userId}')`)
      );

      expect(code).toBe(CHECK_VIOLATION);
    });

    it("refuses a row with two entries", async () => {
      const alice = await newUser();

      const code = await errorCode(() =>
        runSql(`
          insert into public.creations (created_by, venue_id, artist_id)
          values ('${alice.userId}', gen_random_uuid(), gen_random_uuid())`)
      );

      expect(code).toBe(CHECK_VIOLATION);
    });
  });

  describe("daily caps", () => {
    it.each<[KindT, number]>([
      ["venue", 10],
      ["collective", 10],
      ["artist", 50],
      ["event", 20]
    ])("refuses a user's %s past %i in 24 hours", async (kind, cap) => {
      const alice = await newUser();
      await insertCreations(alice.userId, kind, cap);

      let detail: string | undefined;
      const code = await errorCode(async () => {
        try {
          await insertCreations(alice.userId, kind, 1);
        } catch (error) {
          detail = (error as { detail?: string }).detail;
          throw error;
        }
      });

      expect(code).toBe(CREATION_CAP);
      expect(detail).toBe(kind);
    });

    it("counts each kind apart", async () => {
      const alice = await newUser();
      await insertCreations(alice.userId, "venue", 10);

      const code = await errorCode(async () => {
        await insertCreations(alice.userId, "collective", 10);
        await insertCreations(alice.userId, "artist", 1);
        await insertCreations(alice.userId, "event", 1);
      });

      expect(code).toBeNull();
    });

    it("counts each user apart", async () => {
      const [alice, bob] = await Promise.all([newUser(), newUser()]);
      await insertCreations(alice.userId, "venue", 10);

      const code = await errorCode(() => insertCreations(bob.userId, "venue", 1));

      expect(code).toBeNull();
    });

    it("ignores rows older than 24 hours", async () => {
      const alice = await newUser();
      await insertCreations(alice.userId, "venue", 10, 25);

      const code = await errorCode(() => insertCreations(alice.userId, "venue", 10));

      expect(code).toBeNull();
    });

    it("does not cap lineup slots", async () => {
      const alice = await newUser();

      const code = await errorCode(() =>
        insertCreations(alice.userId, "lineup_slot", 200)
      );

      expect(code).toBeNull();
    });

    it.each<["moderator" | "admin"]>([["moderator"], ["admin"]])(
      "lets an active %s past the cap",
      async (role) => {
        const local = await newUser(role);
        await insertCreations(local.userId, "venue", 10);

        const code = await errorCode(() => insertCreations(local.userId, "venue", 1));

        expect(code).toBeNull();
      }
    );

    it("holds a banned moderator to the cap", async () => {
      const local = await newUser("moderator");
      await runSql(
        `update public.profiles set account_status = 'banned' where id = '${local.userId}'`
      );
      await insertCreations(local.userId, "venue", 10);

      const code = await errorCode(() => insertCreations(local.userId, "venue", 1));

      expect(code).toBe(CREATION_CAP);
    });

    it("refuses the second of two inserts made at the same moment", async () => {
      const alice = await newUser();
      await insertCreations(alice.userId, "venue", 9);
      const { dbUrl } = getLocalSupabase();
      const first = new pg.Client({ connectionString: dbUrl });
      const second = new pg.Client({ connectionString: dbUrl });
      await Promise.all([first.connect(), second.connect()]);
      const insert = `insert into public.creations (created_by, venue_id)
        values ('${alice.userId}', gen_random_uuid())`;

      try {
        await first.query("begin");
        await first.query(insert);
        await second.query("begin");
        const [{ pid }] = (
          await second.query<{ pid: number }>("select pg_backend_pid() as pid")
        ).rows;
        const secondInsert = second.query(insert);
        // Without the lock, the second insert would count 9 and save before the first
        // commits. Commit only once it is waiting on the first transaction's lock.
        await expect
          .poll(
            async () =>
              (
                await first.query<{ waiting: boolean }>(
                  `select wait_event_type = 'Lock' and wait_event = 'advisory' as waiting
                   from pg_stat_activity where pid = ${pid}`
                )
              ).rows[0]?.waiting
          )
          .toBe(true);
        await first.query("commit");
        const code = await errorCode(() => secondInsert);
        await second.query("rollback");

        expect(code).toBe(CREATION_CAP);
      } finally {
        await Promise.all([first.end(), second.end()]);
      }
    });
  });

  describe("reading", () => {
    let alice: TestUserT;
    let bob: TestUserT;
    let moderator: TestUserT;
    let admin: TestUserT;

    beforeAll(async () => {
      [alice, bob, moderator, admin] = await Promise.all([
        newUser(),
        newUser(),
        newUser("moderator"),
        newUser("admin")
      ]);
      await insertCreations(alice.userId, "venue", 1);
      await insertCreations(bob.userId, "artist", 1);
    });

    const readRowsOf = async (
      client: SupabaseClient,
      userIds: string[]
    ): Promise<string[]> => {
      const result = await client
        .from("creations")
        .select("created_by")
        .in("created_by", userIds);
      expect(result.error).toBeNull();
      return (result.data ?? []).map((row) => row.created_by as string).sort();
    };

    it("refuses a signed-out visitor", async () => {
      const result = await createAnonClient().from("creations").select("id");

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("shows a user only their own rows", async () => {
      const rows = await readRowsOf(alice.client, [alice.userId, bob.userId]);

      expect(rows).toEqual([alice.userId]);
    });

    it.each<["moderator" | "admin"]>([["moderator"], ["admin"]])(
      "shows a %s every row",
      async (role) => {
        const reader = role === "moderator" ? moderator : admin;

        const rows = await readRowsOf(reader.client, [alice.userId, bob.userId]);

        expect(rows).toEqual([alice.userId, bob.userId].sort());
      }
    );

    it("shows a banned moderator only their own rows", async () => {
      const banned = await newUser("moderator");
      await runSql(
        `update public.profiles set account_status = 'banned' where id = '${banned.userId}'`
      );

      const rows = await readRowsOf(banned.client, [alice.userId, bob.userId]);

      expect(rows).toEqual([]);
    });
  });

  describe("writing through the API", () => {
    it.each<[string, () => Promise<SupabaseClient>]>([
      ["a signed-out visitor", () => Promise.resolve(createAnonClient())],
      ["a signed-in user", async () => (await newUser()).client],
      ["an admin", async () => (await newUser("admin")).client]
    ])("refuses %s inserting, changing, or deleting a row", async (_role, getClient) => {
      const client = await getClient();
      const owner = await newUser();
      await insertCreations(owner.userId, "venue", 1);

      const inserted = await client
        .from("creations")
        .insert({ created_by: owner.userId, venue_id: randomUUID() });
      const updated = await client
        .from("creations")
        .update({ created_at: new Date(0).toISOString() })
        .eq("created_by", owner.userId);
      const deleted = await client
        .from("creations")
        .delete()
        .eq("created_by", owner.userId);

      expect([inserted, updated, deleted].map((result) => result.error?.code)).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });
  });

  it("deletes a user's rows with their account", async () => {
    const alice = await createTestUser();
    await createProfile(alice);
    await insertCreations(alice.userId, "venue", 2);

    await deleteTestUser(alice.userId);

    const [result] = await runSql<{ count: string }>(
      `select count(*) from public.creations where created_by = '${alice.userId}'`
    );
    expect(result.count).toBe("0");
  });
});
