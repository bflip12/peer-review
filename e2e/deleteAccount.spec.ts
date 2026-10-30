import { expect, test } from "@playwright/test";

import {
  deleteCreatedUsers,
  newEmail,
  newHandle,
  openSignInLink,
  RESEND_WAIT_MS,
  signUp
} from "./utils/signIn";

test.afterAll(deleteCreatedUsers);

test.describe("account deletion", () => {
  test("refuses a wrong handle, then deletes the account and signs out", async ({
    page
  }) => {
    const email = newEmail();
    const handle = newHandle();
    await signUp(page, email, handle);
    await page.getByRole("banner").getByRole("link", { name: "Settings" }).click();
    const field = page.getByLabel("Type your handle to confirm");

    await field.fill(`${handle}x`);
    await page.getByRole("button", { name: "Delete account" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "Your account was not deleted."
    );
    await field.fill(handle.toUpperCase());
    await page.getByRole("button", { name: "Delete account" }).click();

    await expect(page).toHaveURL("/account-deleted");
    await expect(
      page.getByRole("heading", { name: "Your account is deleted" })
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Sign in" })
    ).toBeVisible();
  });

  test("signing in again with the same email starts a new account", async ({ page }) => {
    const email = newEmail();
    const handle = newHandle();
    await signUp(page, email, handle);
    await page.goto("/settings");
    await page.getByLabel("Type your handle to confirm").fill(handle);
    await page.getByRole("button", { name: "Delete account" }).click();
    await expect(page).toHaveURL("/account-deleted");
    await new Promise((resolve) => setTimeout(resolve, RESEND_WAIT_MS));

    await openSignInLink(page, email);
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL("/welcome");
  });

  test("the settings page sends a signed-out visitor to sign in", async ({ page }) => {
    await page.goto("/settings");

    await expect(page).toHaveURL("/sign-in");
  });
});
