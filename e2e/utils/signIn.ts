import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { getSignInLink } from "../../supabase/tests/utils/getSignInLink";
import {
  createServiceClient,
  deleteTestUser
} from "../../supabase/tests/utils/testClients";

// Auth refuses a second link to one address within max_frequency (1s in config.toml).
export const RESEND_WAIT_MS = 1_100;

const CREATED_EMAILS: string[] = [];

/** A new email address, recorded so `deleteCreatedUsers` can remove its user. */
export const newEmail = (): string => {
  const email = `e2e-${randomUUID()}@example.com`;
  CREATED_EMAILS.push(email);
  return email;
};

/** A handle no other test run uses. */
export const newHandle = (): string =>
  `e2e_${randomUUID().replaceAll("-", "").slice(0, 12)}`;

/** Asks for a sign-in link on the sign-in page and opens it from the email. */
export const openSignInLink = async (page: Page, email: string): Promise<void> => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText(
    `We sent a sign-in link to ${email}.`
  );
  const link = await getSignInLink(email);
  await page.goto(`${link.pathname}${link.search}`);
};

/** Signs a new user in and picks a handle, ending on the home page. */
export const signUp = async (
  page: Page,
  email: string,
  handle: string
): Promise<void> => {
  await openSignInLink(page, email);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Pick a handle" })).toBeVisible();
  await page.getByLabel("Handle").fill(handle);
  await page.getByRole("button", { name: "Create profile" }).click();
  await expect(page).toHaveURL("/");
};

/** Deletes the users made with addresses from `newEmail`. Users already deleted are skipped. */
export const deleteCreatedUsers = async (): Promise<void> => {
  const { data } = await createServiceClient().auth.admin.listUsers({ perPage: 1000 });
  const ids = data.users
    .filter((user) => user.email && CREATED_EMAILS.includes(user.email))
    .map((user) => user.id);
  await Promise.all(ids.map(deleteTestUser));
};
