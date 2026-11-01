import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

// Google cannot run in tests. These check the app's side: the button hands the browser to
// Auth with the right callback and a PKCE challenge, and the callback refuses what it
// should. The code exchange itself is tested in exchangeSignInCode.db.test.ts.
test.describe("Google sign-in", () => {
  test("the button sends the browser to Auth's Google sign-in with this site's callback", async ({
    page,
    context
  }) => {
    let authorizeUrl: URL | null = null;
    // Stop at Auth: past it the browser would go to Google, which the test cannot reach.
    await page.route("**/auth/v1/authorize?**", async (route) => {
      authorizeUrl = new URL(route.request().url());
      await route.fulfill({ status: 200, body: "Stopped before Google" });
    });
    await page.goto("/sign-in");

    await page.getByRole("button", { name: "Continue with Google" }).click();

    await expect(page.getByText("Stopped before Google")).toBeVisible();
    const params = (authorizeUrl as URL | null)?.searchParams;
    expect(params?.get("provider")).toBe("google");
    expect(params?.get("redirect_to")).toBe("http://localhost:3000/auth/callback");
    expect(params?.get("code_challenge_method")).toBe("s256");
    expect(params?.get("code_challenge")).toBeTruthy();
    const cookies = await context.cookies("http://localhost:3000");
    expect(
      cookies.some((cookie) => cookie.name.endsWith("-auth-token-code-verifier"))
    ).toBe(true);
  });

  test("a sign-in cancelled at Google ends on the error page", async ({ page }) => {
    await page.goto("/auth/callback?error=access_denied&error_description=Cancelled");

    await expect(page).toHaveURL("/auth/google-error");
    await expect(
      page.getByRole("heading", { name: "Google sign-in did not finish" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Try again" })).toHaveAttribute(
      "href",
      "/sign-in"
    );
  });

  test("a code this browser did not start ends on the error page", async ({ page }) => {
    await page.goto(`/auth/callback?code=${randomUUID()}`);

    await expect(page).toHaveURL("/auth/google-error");
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Sign in" })
    ).toBeVisible();
  });
});
