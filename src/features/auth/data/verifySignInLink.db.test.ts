import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import {
  createAnonClient,
  createServiceClient,
  deleteTestUser
} from "../../../../supabase/tests/utils/testClients";
import { getSignedInUserId } from "./getSignedInUserId";
import { verifySignInLink } from "./verifySignInLink";

const EXPIRED_MESSAGE =
  "This sign-in link has expired or was already used. Ask for a new one.";

// A user with a fresh sign-in token, as if they had just asked for a link.
const createLink = async (): Promise<{ userId: string; tokenHash: string }> => {
  const email = `test-${randomUUID()}@example.com`;
  const { data, error } = await createServiceClient().auth.admin.generateLink({
    type: "magiclink",
    email
  });
  if (error) {
    throw error;
  }
  return { userId: data.user.id, tokenHash: data.properties.hashed_token };
};

describe("verifySignInLink and getSignedInUserId", () => {
  const userIds: string[] = [];

  afterAll(async () => {
    await Promise.all(userIds.map(deleteTestUser));
  });

  it("signs the client in as the link's user", async () => {
    const { userId, tokenHash } = await createLink();
    userIds.push(userId);
    const client = createAnonClient() as SupabaseClientT;

    const result = await verifySignInLink(client, tokenHash);

    expect(result).toEqual({ ok: true, data: undefined });
    expect(await getSignedInUserId(client)).toBe(userId);
  });

  it("refuses a link that was already used", async () => {
    const { userId, tokenHash } = await createLink();
    userIds.push(userId);
    await verifySignInLink(createAnonClient() as SupabaseClientT, tokenHash);
    const client = createAnonClient() as SupabaseClientT;

    const result = await verifySignInLink(client, tokenHash);

    expect(result).toEqual({ ok: false, message: EXPIRED_MESSAGE });
    expect(await getSignedInUserId(client)).toBeNull();
  });

  it("refuses a token hash Auth never issued", async () => {
    const result = await verifySignInLink(
      createAnonClient() as SupabaseClientT,
      "0".repeat(56)
    );

    expect(result).toEqual({ ok: false, message: EXPIRED_MESSAGE });
  });

  it("finds no user on a signed-out client", async () => {
    const result = await getSignedInUserId(createAnonClient() as SupabaseClientT);

    expect(result).toBeNull();
  });
});
