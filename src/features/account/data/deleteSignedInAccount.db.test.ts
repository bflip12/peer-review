import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import { createTestUser, runSql } from "../../../../supabase/tests/utils/testClients";
import { deleteSignedInAccount } from "./deleteSignedInAccount";

describe("deleteSignedInAccount", () => {
  it("deletes the user and their profile, and clears the session", async () => {
    const user = await createTestUser();
    const client = user.client as SupabaseClientT;
    await client
      .from("profiles")
      .insert({ handle: `t${randomUUID().replaceAll("-", "").slice(0, 12)}` });

    await deleteSignedInAccount(client);

    const [counts] = await runSql<{ users: number; profiles: number }>(`
      select
        (select count(*)::int from auth.users where id = '${user.userId}') as users,
        (select count(*)::int from public.profiles where id = '${user.userId}') as profiles`);
    const { data } = await client.auth.getSession();
    expect(counts).toEqual({ users: 0, profiles: 0 });
    expect(data.session).toBeNull();
  });
});
