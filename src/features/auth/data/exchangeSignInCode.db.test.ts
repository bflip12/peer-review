import { afterAll, describe, expect, it } from "vitest";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import { createPkceCode } from "../../../../supabase/tests/utils/createPkceCode";
import {
  createAnonClient,
  deleteTestUser
} from "../../../../supabase/tests/utils/testClients";
import { exchangeSignInCode } from "./exchangeSignInCode";
import { getSignedInUserId } from "./getSignedInUserId";

const FAILED = { ok: false, message: "Google sign-in did not finish." };

describe("exchangeSignInCode", () => {
  const userIds: string[] = [];

  afterAll(async () => {
    await Promise.all(userIds.map(deleteTestUser));
  });

  it("signs the client in with the code and its stored verifier", async () => {
    const { client, code } = await createPkceCode();

    const result = await exchangeSignInCode(client as SupabaseClientT, code);

    const userId = await getSignedInUserId(client as SupabaseClientT);
    if (userId) {
      userIds.push(userId);
    }
    expect(result).toEqual({ ok: true, data: undefined });
    expect(userId).not.toBeNull();
  });

  it("refuses a code that was already used", async () => {
    const { client, code } = await createPkceCode();
    await exchangeSignInCode(client as SupabaseClientT, code);
    const userId = await getSignedInUserId(client as SupabaseClientT);
    if (userId) {
      userIds.push(userId);
    }

    const result = await exchangeSignInCode(client as SupabaseClientT, code);

    expect(result).toEqual(FAILED);
  });

  it("refuses a code on a client that holds no verifier, such as another browser", async () => {
    const pkce = await createPkceCode();
    const client = createAnonClient() as SupabaseClientT;

    const result = await exchangeSignInCode(client, pkce.code);

    expect(result).toEqual(FAILED);
    expect(await getSignedInUserId(client)).toBeNull();
    const { data } = await pkce.client.auth.exchangeCodeForSession(pkce.code);
    if (data.user) {
      userIds.push(data.user.id);
    }
  });
});
