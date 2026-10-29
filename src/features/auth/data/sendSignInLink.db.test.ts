import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import { getSignInLink } from "../../../../supabase/tests/utils/getSignInLink";
import {
  createAnonClient,
  createServiceClient,
  deleteTestUser
} from "../../../../supabase/tests/utils/testClients";
import { sendSignInLink } from "./sendSignInLink";

const REDIRECT_TO = "http://localhost:3000";

// Auth refuses a second link to one address within max_frequency (1s in config.toml).
const RESEND_WAIT_MS = 1_100;

describe("sendSignInLink", () => {
  const emails: string[] = [];
  const newEmail = (): string => {
    const email = `test-${randomUUID()}@example.com`;
    emails.push(email);
    return email;
  };

  afterAll(async () => {
    const { data } = await createServiceClient().auth.admin.listUsers({ perPage: 1000 });
    const ids = data.users
      .filter((user) => user.email && emails.includes(user.email))
      .map((user) => user.id);
    await Promise.all(ids.map(deleteTestUser));
  });

  it("emails a new address a link to /auth/confirm with a token hash", async () => {
    const email = newEmail();

    const result = await sendSignInLink(
      createAnonClient() as SupabaseClientT,
      email,
      REDIRECT_TO
    );

    const link = await getSignInLink(email);
    expect(result).toEqual({ ok: true, data: undefined });
    expect(`${link.origin}${link.pathname}`).toBe(`${REDIRECT_TO}/auth/confirm`);
    expect(link.searchParams.get("type")).toBe("email");
    expect(link.searchParams.get("token_hash")).toMatch(/^[0-9a-f]+$/);
  });

  it("emails a returning user a link the same way", async () => {
    const email = newEmail();
    await sendSignInLink(createAnonClient() as SupabaseClientT, email, REDIRECT_TO);
    const first = await getSignInLink(email);
    await new Promise((resolve) => setTimeout(resolve, RESEND_WAIT_MS));

    const result = await sendSignInLink(
      createAnonClient() as SupabaseClientT,
      email,
      REDIRECT_TO
    );

    const second = await getSignInLink(email);
    expect(result).toEqual({ ok: true, data: undefined });
    expect(second.searchParams.get("token_hash")).not.toBe(
      first.searchParams.get("token_hash")
    );
  });

  it("asks the user to wait when a second link is requested too soon", async () => {
    const email = newEmail();
    await sendSignInLink(createAnonClient() as SupabaseClientT, email, REDIRECT_TO);

    const result = await sendSignInLink(
      createAnonClient() as SupabaseClientT,
      email,
      REDIRECT_TO
    );

    expect(result).toEqual({
      ok: false,
      message: "Too many sign-in emails were sent. Wait a minute, then try again."
    });
  });
});
