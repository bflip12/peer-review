import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import type { TestUserT } from "../../../../supabase/tests/utils/testClients";
import {
  createTestUser,
  deleteTestUser
} from "../../../../supabase/tests/utils/testClients";
import { getPathAfterSignIn } from "./getPathAfterSignIn";

describe("getPathAfterSignIn", () => {
  const users: TestUserT[] = [];
  const newUser = async (): Promise<TestUserT> => {
    const user = await createTestUser();
    users.push(user);
    return user;
  };

  afterAll(async () => {
    await Promise.all(users.map((user) => deleteTestUser(user.userId)));
  });

  it("sends a user without a handle to pick one", async () => {
    const { client, userId } = await newUser();

    const result = await getPathAfterSignIn(client as SupabaseClientT, userId);

    expect(result).toBe("/welcome");
  });

  it("sends a user with a profile home", async () => {
    const { client, userId } = await newUser();
    await client
      .from("profiles")
      .insert({ handle: `t${randomUUID().replaceAll("-", "").slice(0, 12)}` });

    const result = await getPathAfterSignIn(client as SupabaseClientT, userId);

    expect(result).toBe("/");
  });
});
