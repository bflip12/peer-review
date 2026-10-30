import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";

import {
  createServiceClient,
  deleteTestUser,
  runSql
} from "../../supabase/tests/utils/testClients.ts";
import type { SignedInAsT } from "./utils/getScreenshotOptions.ts";

/** The handle the `--as=user` screenshots show. Fixed, so captures match run to run. */
export const SCREENSHOT_HANDLE = "dj_rush";
const SCREENSHOT_DISPLAY_NAME = "DJ Rush";

/** A user made for one screenshot run, and the token that signs a browser in as them. */
export type ScreenshotUserT = { userId: string; tokenHash: string };

/**
 * Creates a user on the local stack for `npm run screenshot -- --as=...`, with the
 * `dj_rush` profile for "user" and none for "new", and a sign-in token for
 * `/auth/confirm`. First deletes a `dj_rush` user that an interrupted run left behind,
 * since the handle is unique. Local stack only: it uses the service role key.
 */
export const createScreenshotUser = async (
  signedInAs: SignedInAsT
): Promise<ScreenshotUserT> => {
  const leftovers = await runSql<{ id: string }>(
    `select id from public.profiles where handle = '${SCREENSHOT_HANDLE}'`
  );
  await Promise.all(leftovers.map(({ id }) => deleteTestUser(id)));

  const email = `screenshot-${randomUUID()}@example.com`;
  const service = createServiceClient();
  const created = await service.auth.admin.createUser({ email, email_confirm: true });
  if (created.error) {
    throw created.error;
  }
  const userId = created.data.user.id;

  if (signedInAs === "user") {
    await runSql(
      `insert into public.profiles (id, handle, display_name)
       values ('${userId}', '${SCREENSHOT_HANDLE}', '${SCREENSHOT_DISPLAY_NAME}')`
    );
  }

  const link = await service.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) {
    throw link.error;
  }
  return { userId, tokenHash: link.data.properties.hashed_token };
};

/** Deletes a screenshot user, and its profile with it. */
export const deleteScreenshotUser = (userId: string): Promise<void> =>
  deleteTestUser(userId);

/**
 * Signs `page` in with a screenshot user's token, the way a person following the email
 * link does: opens `/auth/confirm` and presses "Continue". Resolves once the app has
 * moved on to `/welcome` or `/`.
 */
export const signInWithToken = async (
  page: Page,
  baseUrl: string,
  tokenHash: string
): Promise<void> => {
  const confirmUrl = new URL("/auth/confirm", baseUrl);
  confirmUrl.search = new URLSearchParams({
    token_hash: tokenHash,
    type: "email"
  }).toString();
  await page.goto(confirmUrl.toString());
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL((url) => url.pathname !== "/auth/confirm");
};
