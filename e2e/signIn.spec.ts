import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { getSignInLink } from "../supabase/tests/utils/getSignInLink";
import {
  createServiceClient,
  deleteTestUser,
  runSql
} from "../supabase/tests/utils/testClients";

// Auth refuses a second link to one address within max_frequency (1s in config.toml).
const RESEND_WAIT_MS = 1_100;

const CREATED_EMAILS: string[] = [];
const newEmail = (): string => {
  const email = `e2e-${randomUUID()}@example.com`;
  CREATED_EMAILS.push(email);
  return email;
};

// A handle no other test run uses.
const newHandle = (): string => `e2e_${randomUUID().replaceAll("-", "").slice(0, 12)}`;

// Asks for a sign-in link on the sign-in page and opens it from the email.
const openSignInLink = async (page: Page, email: string): Promise<void> => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText(
    `We sent a sign-in link to ${email}.`
  );
  const link = await getSignInLink(email);
  await page.goto(`${link.pathname}${link.search}`);
};

// Signs a new user in and picks a handle, ending on the home page.
const signUp = async (page: Page, email: string, handle: string): Promise<void> => {
  await openSignInLink(page, email);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Pick a handle" })).toBeVisible();
  await page.getByLabel("Handle").fill(handle);
  await page.getByRole("button", { name: "Create profile" }).click();
  await expect(page).toHaveURL("/");
};

test.afterAll(async () => {
  const { data } = await createServiceClient().auth.admin.listUsers({ perPage: 1000 });
  const ids = data.users
    .filter((user) => user.email && CREATED_EMAILS.includes(user.email))
    .map((user) => user.id);
  await Promise.all(ids.map(deleteTestUser));
});

test.describe("sign-in", () => {
  test("signs up with a sign-in link, picks a handle, and signs out", async ({
    page
  }) => {
    const handle = newHandle();
    await openSignInLink(page, newEmail());

    await expect(
      page.getByRole("heading", { name: "Sign in to Peer Review" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/welcome");
    await expect(page.getByLabel("Handle")).toHaveValue("");
    await expect(page.getByLabel("Display name (optional)")).toHaveValue("");
    await page.getByLabel("Handle").fill(handle);
    await page.getByLabel("Display name (optional)").fill("Rush");
    await page.getByRole("button", { name: "Create profile" }).click();

    const banner = page.getByRole("banner");
    await expect(page).toHaveURL("/");
    await expect(banner.getByText(`@${handle}`)).toBeVisible();
    await banner.getByRole("button", { name: "Sign out" }).click();
    await expect(banner.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("a returning user goes home after signing in", async ({ page }) => {
    const email = newEmail();
    const handle = newHandle();
    await signUp(page, email, handle);
    await page.getByRole("banner").getByRole("button", { name: "Sign out" }).click();
    await new Promise((resolve) => setTimeout(resolve, RESEND_WAIT_MS));

    await openSignInLink(page, email);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("banner").getByText(`@${handle}`)).toBeVisible();
  });

  test("refuses a link that was already used", async ({ page, browser }) => {
    const email = newEmail();
    await openSignInLink(page, email);
    const usedLink = page.url();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/welcome");

    const otherPage = await browser.newPage();
    await otherPage.goto(usedLink);
    await otherPage.getByRole("button", { name: "Continue" }).click();

    await expect(otherPage.getByRole("main").getByRole("alert")).toContainText(
      "This sign-in link has expired or was already used. Ask for a new one."
    );
    await expect(
      otherPage.getByRole("link", { name: "Get a new sign-in link" })
    ).toHaveAttribute("href", "/sign-in");
    await otherPage.close();
  });

  test("a link without its token says how to get a new one", async ({ page }) => {
    await page.goto("/auth/confirm");

    await expect(page.getByText("This sign-in link is incomplete.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
  });

  test("the welcome page sends a signed-out visitor to sign in", async ({ page }) => {
    await page.goto("/welcome");

    await expect(page).toHaveURL("/sign-in");
  });

  test("tells a banned user their account is banned", async ({ page }) => {
    const email = newEmail();
    const handle = newHandle();
    await signUp(page, email, handle);

    await runSql(
      `update public.profiles set account_status = 'banned' where handle = '${handle}'`
    );
    await page.reload();

    const banner = page.getByRole("banner");
    await expect(banner.getByText("This account is banned.")).toBeVisible();
    await expect(banner.getByText(`@${handle}`)).toHaveCount(0);
  });
});
