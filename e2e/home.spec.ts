import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("loads with the app name in the title and heading", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Peer Review");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Peer Review");
  });
});
