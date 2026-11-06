import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { deleteCreatedUsers, newEmail, newHandle, signUp } from "./utils/signIn";

test.afterAll(deleteCreatedUsers);

// A venue name no other run uses, so the similar-venue check finds only this run's venue.
const newVenueName = (): string => `E2E ${randomUUID().slice(0, 8)}`;

// Types into the city picker and picks the first option showing that name, which is the
// city with the most people.
const pickCity = async (page: Page, query: string, option: string): Promise<void> => {
  await page.getByRole("combobox", { name: "City" }).fill(query);
  await page.getByRole("option").filter({ hasText: option }).first().click();
  await expect(page.getByRole("listbox", { name: "City" })).toBeHidden();
};

test.describe("venues", () => {
  test("adds a venue after fixing a refused link, then edits it", async ({ page }) => {
    const name = newVenueName();
    await signUp(page, newEmail(), newHandle());
    await page.goto("/venues/new");

    await page.getByRole("textbox", { name: "Name" }).fill(name);
    await pickCity(page, "Cologne", "Köln (Cologne)");
    await page.getByRole("textbox", { name: "Instagram" }).fill("example.com/e2e");
    await page.getByRole("button", { name: "Add venue" }).click();
    await expect(
      page.getByText("Paste an Instagram link, such as instagram.com/name.")
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Instagram" }).fill("instagram.com/e2e");
    await page.getByRole("checkbox", { name: "Funktion-One" }).check();
    await page.getByRole("button", { name: "Add venue" }).click();

    await expect(page).toHaveURL(/\/venues\/[2-9a-hjkmnp-z]{8}\/e2e-[0-9a-f]+-koln$/);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.getByText("Köln North Rhine-Westphalia, DE")).toBeVisible();
    await expect(page.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/e2e"
    );
    await expect(
      page.getByRole("region", { name: "Sound system" }).getByText("Funktion-One")
    ).toBeVisible();

    await page.getByRole("link", { name: "Edit venue" }).click();
    await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(name);
    await page.getByRole("textbox", { name: "Name" }).fill(`${name} Club`);
    await page.getByRole("checkbox", { name: "Funktion-One" }).uncheck();
    await page.getByRole("button", { name: "Save venue" }).click();

    await expect(page).toHaveURL(/-club-koln$/);
    await expect(
      page.getByRole("heading", { level: 1, name: `${name} Club` })
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Sound system" })).toBeHidden();
  });

  test("shows a venue with a similar name in the same city before adding", async ({
    page
  }) => {
    const name = newVenueName();
    await signUp(page, newEmail(), newHandle());
    await page.goto("/venues/new");
    await page.getByRole("textbox", { name: "Name" }).fill(`${name} Club`);
    await pickCity(page, "Berlin", "Berlin");
    await page.getByRole("button", { name: "Add venue" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: `${name} Club` })
    ).toBeVisible();

    await page.goto("/venues/new");
    await page.getByRole("textbox", { name: "Name" }).fill(name);
    const city = page.getByRole("combobox", { name: "City" });
    await city.fill("Berlin");
    await expect(page.getByRole("option").first()).toBeVisible();
    await city.press("ArrowDown");
    await city.press("Enter");

    const similar = page.getByRole("region", { name: "Already on Peer Review?" });
    await expect(similar.getByRole("link", { name: `${name} Club` })).toBeVisible();
  });

  test("sends a signed-out visitor from the add page to sign in", async ({ page }) => {
    await page.goto("/venues/new");

    await expect(page).toHaveURL("/sign-in");
  });

  test("redirects a venue's short URL to its full URL", async ({ page }) => {
    const name = newVenueName();
    await signUp(page, newEmail(), newHandle());
    await page.goto("/venues/new");
    await page.getByRole("textbox", { name: "Name" }).fill(name);
    await pickCity(page, "Berlin", "Berlin");
    await page.getByRole("button", { name: "Add venue" }).click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    const shortId = new URL(page.url()).pathname.split("/")[2];

    await page.goto(`/venues/${shortId}/old-name`);

    await expect(page).toHaveURL(new RegExp(`/venues/${shortId}/e2e-[0-9a-f]+-berlin$`));
  });
});
