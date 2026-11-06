import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { deleteCreatedUsers, newEmail, newHandle, signUp } from "./utils/signIn";

test.afterAll(deleteCreatedUsers);

const CITY = "Where they're based";

// A DJ name no other run uses, so the duplicate check finds only this run's DJs. Never
// "b2b", which DJ names refuse.
const newDjName = (): string =>
  `E2E ${randomUUID().slice(0, 8).replaceAll("b2b", "b3b")}`;

// Types into the city picker and picks the first option showing that name.
const pickCity = async (page: Page, query: string, option: string): Promise<void> => {
  await page.getByRole("combobox", { name: CITY }).fill(query);
  await page.getByRole("option").filter({ hasText: option }).first().click();
  await expect(page.getByRole("listbox", { name: CITY })).toBeHidden();
};

// Adds a DJ with only a name and waits for their page.
const addDj = async (page: Page, name: string): Promise<void> => {
  await page.goto("/djs/new");
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("button", { name: "Add DJ" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
};

test.describe("DJs", () => {
  test("adds a DJ with no city after fixing a refused link, then adds a city", async ({
    page
  }) => {
    const name = newDjName();
    await signUp(page, newEmail(), newHandle());
    await page.goto("/djs/new");

    await page.getByRole("textbox", { name: "Name" }).fill(name);
    await page.getByRole("textbox", { name: "Bandcamp" }).fill("e2e.com/music");
    await page.getByRole("button", { name: "Add DJ" }).click();
    await expect(
      page.getByText("Paste a Bandcamp link, such as name.bandcamp.com.", {
        exact: false
      })
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Bandcamp" }).fill("e2e.bandcamp.com");
    await page.getByRole("button", { name: "Add DJ" }).click();

    await expect(page).toHaveURL(/\/djs\/[2-9a-hjkmnp-z]{8}\/e2e-[0-9a-f]+$/);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bandcamp" })).toHaveAttribute(
      "href",
      "https://e2e.bandcamp.com"
    );

    await page.getByRole("link", { name: "Edit DJ" }).click();
    await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(name);
    await pickCity(page, "Detroit", "Detroit");
    await page.getByRole("button", { name: "Save DJ" }).click();

    await expect(page.getByText("Detroit Michigan, US")).toBeVisible();
  });

  test("refuses a b2b name, pointing to the lineup", async ({ page }) => {
    await signUp(page, newEmail(), newHandle());
    await page.goto("/djs/new");

    await page.getByRole("textbox", { name: "Name" }).fill("DJ Rush b2b Surgeon");
    await page.getByRole("button", { name: "Add DJ" }).click();

    await expect(
      page.getByText(
        'Add each DJ on their own. A b2b set is added on the night\'s lineup, with "b2b with".'
      )
    ).toBeVisible();
  });

  test("shows a DJ with the same name and requires a city for a second one", async ({
    page
  }) => {
    const name = newDjName();
    await signUp(page, newEmail(), newHandle());
    await addDj(page, name);

    await page.goto("/djs/new");
    await page.getByRole("textbox", { name: "Name" }).fill(name.toLowerCase());
    const existing = page.getByRole("region", {
      name: `There's already a DJ called ${name}.`
    });
    await expect(existing.getByRole("link", { name: /^Use this DJ/ })).toBeVisible();
    await expect(page.getByRole("combobox", { name: CITY })).toHaveAttribute(
      "aria-required",
      "true"
    );
    await page.getByRole("button", { name: "Add as a new DJ" }).click();
    await expect(
      page.getByText(`Another DJ called ${name.toLowerCase()} has no city`, {
        exact: false
      })
    ).toBeVisible();

    await pickCity(page, "Berlin", "Berlin");
    await page.getByRole("button", { name: "Add as a new DJ" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: name.toLowerCase() })
    ).toBeVisible();
    await expect(page.getByText("Berlin State of Berlin, DE")).toBeVisible();
  });

  test("lists a DJ with a similar name before adding", async ({ page }) => {
    const name = newDjName();
    await signUp(page, newEmail(), newHandle());
    await addDj(page, `DJ ${name}`);

    await page.goto("/djs/new");
    await page.getByRole("textbox", { name: "Name" }).fill(name);

    const similar = page.getByRole("region", { name: "Already on Peer Review?" });
    await expect(similar.getByRole("link", { name: `DJ ${name}` })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add DJ" })).toBeVisible();
  });

  test("sends a signed-out visitor from the add page to sign in", async ({ page }) => {
    await page.goto("/djs/new");

    await expect(page).toHaveURL("/sign-in");
  });

  test("redirects a DJ's short URL to their full URL", async ({ page }) => {
    const name = newDjName();
    await signUp(page, newEmail(), newHandle());
    await addDj(page, name);
    const shortId = new URL(page.url()).pathname.split("/")[2];

    await page.goto(`/djs/${shortId}/old-name`);

    await expect(page).toHaveURL(new RegExp(`/djs/${shortId}/e2e-[0-9a-f]+$`));
  });
});
