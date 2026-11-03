import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

// The Postgres error code of a statement, or null when it succeeds.
const errorCode = async (run: () => Promise<unknown>): Promise<string | null> => {
  try {
    await run();
    return null;
  } catch (error) {
    return (error as { code?: string }).code ?? "unknown";
  }
};

// Writes an edit as `postgres`, the way the edit triggers will, and returns its id.
const insertEdit = async (
  editedBy: string,
  entityId: string,
  oldValue: string,
  newValue: string
): Promise<string> => {
  const [row] = await runSql<{ id: string }>(`
    insert into public.catalog_edits
      (entity_type, entity_id, field, old_value, new_value, edited_by)
    values ('venue', '${entityId}', 'name', ${oldValue}, ${newValue}, '${editedBy}')
    returning id`);
  return row.id;
};

describe("catalog_edits", () => {
  const users: TestUserT[] = [];
  const newUser = async (role?: "moderator" | "admin"): Promise<TestUserT> => {
    const user = await createTestUser();
    users.push(user);
    const handle = `t${randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const { error } = await user.client.from("profiles").insert({ handle });
    if (error) {
      throw error;
    }
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

  describe("values", () => {
    let editor: TestUserT;

    beforeAll(async () => {
      editor = await newUser();
    });

    it("records a value set, changed, and cleared", async () => {
      const venueId = randomUUID();

      const code = await errorCode(async () => {
        await insertEdit(editor.userId, venueId, "null", `'"Tresor"'`);
        await insertEdit(editor.userId, venueId, `'"Tresor"'`, `'"Tresor Berlin"'`);
        await insertEdit(editor.userId, venueId, `'"Tresor Berlin"'`, "null");
      });

      expect(code).toBeNull();
    });

    it("refuses an edit that changes nothing", async () => {
      const code = await errorCode(() =>
        insertEdit(editor.userId, randomUUID(), `'"Tresor"'`, `'"Tresor"'`)
      );

      expect(code).toBe(CHECK_VIOLATION);
    });

    it("refuses a field name that is not a column-style name", async () => {
      const code = await errorCode(() =>
        runSql(`
          insert into public.catalog_edits (entity_type, entity_id, field, new_value)
          values ('venue', gen_random_uuid(), ' ', '"x"')`)
      );

      expect(code).toBe(CHECK_VIOLATION);
    });

    it("links a revert to the edit it reverts", async () => {
      const venueId = randomUUID();
      const editId = await insertEdit(editor.userId, venueId, `'"Tresor"'`, `'"Tersor"'`);

      const [revert] = await runSql<{ reverts_edit_id: string }>(`
        insert into public.catalog_edits
          (entity_type, entity_id, field, old_value, new_value, edited_by, reverts_edit_id)
        values ('venue', '${venueId}', 'name', '"Tersor"', '"Tresor"',
          '${editor.userId}', '${editId}')
        returning reverts_edit_id`);

      expect(revert.reverts_edit_id).toBe(editId);
    });
  });

  describe("reading", () => {
    let entityId: string;
    let editor: TestUserT;

    beforeAll(async () => {
      editor = await newUser();
      entityId = randomUUID();
      await insertEdit(editor.userId, entityId, "null", `'"Tresor"'`);
    });

    const readEdits = (client: SupabaseClient) =>
      client.from("catalog_edits").select("field, new_value").eq("entity_id", entityId);

    it("refuses a signed-out visitor", async () => {
      const result = await readEdits(createAnonClient());

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("shows a user nothing, their own edits included", async () => {
      const result = await readEdits(editor.client);

      expect(result).toMatchObject({ error: null, data: [] });
    });

    it.each<["moderator" | "admin"]>([["moderator"], ["admin"]])(
      "shows a %s the edits",
      async (role) => {
        const reader = await newUser(role);

        const result = await readEdits(reader.client);

        expect(result).toMatchObject({
          error: null,
          data: [{ field: "name", new_value: "Tresor" }]
        });
      }
    );

    it("shows a banned admin nothing", async () => {
      const banned = await newUser("admin");
      await runSql(
        `update public.profiles set account_status = 'banned' where id = '${banned.userId}'`
      );

      const result = await readEdits(banned.client);

      expect(result).toMatchObject({ error: null, data: [] });
    });
  });

  describe("writing through the API", () => {
    it.each<[string, () => Promise<SupabaseClient>]>([
      ["a signed-out visitor", () => Promise.resolve(createAnonClient())],
      ["a signed-in user", async () => (await newUser()).client],
      ["an admin", async () => (await newUser("admin")).client]
    ])(
      "refuses %s inserting, changing, or deleting an edit",
      async (_role, getClient) => {
        const client = await getClient();
        const editor = await newUser();
        const entityId = randomUUID();
        await insertEdit(editor.userId, entityId, "null", `'"Tresor"'`);

        const inserted = await client.from("catalog_edits").insert({
          entity_type: "venue",
          entity_id: entityId,
          field: "name",
          new_value: "Fake"
        });
        const updated = await client
          .from("catalog_edits")
          .update({ new_value: "Fake" })
          .eq("entity_id", entityId);
        const deleted = await client
          .from("catalog_edits")
          .delete()
          .eq("entity_id", entityId);

        expect([inserted, updated, deleted].map((result) => result.error?.code)).toEqual([
          PERMISSION_DENIED,
          PERMISSION_DENIED,
          PERMISSION_DENIED
        ]);
      }
    );
  });

  it("keeps an editor's edits without their name when they delete their account", async () => {
    const editor = await createTestUser();
    const handle = `t${randomUUID().replaceAll("-", "").slice(0, 12)}`;
    await editor.client.from("profiles").insert({ handle });
    const editId = await insertEdit(editor.userId, randomUUID(), "null", `'"Tresor"'`);

    await deleteTestUser(editor.userId);

    const rows = await runSql<{ edited_by: string | null }>(
      `select edited_by from public.catalog_edits where id = '${editId}'`
    );
    expect(rows).toEqual([{ edited_by: null }]);
  });
});
