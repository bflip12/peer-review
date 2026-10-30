import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

import { captureScreenshots } from "./captureScreenshots.ts";
import {
  DEFAULT_BASE_URL,
  DEFAULT_OUTPUT_DIR,
  DEV_SERVER_COMMAND
} from "./screenshot.constants.ts";
import {
  createScreenshotUser,
  deleteScreenshotUser,
  signInWithToken
} from "./screenshotUser.ts";
import type { ScreenshotUserT } from "./screenshotUser.ts";
import { startServerIfDown } from "./startServerIfDown.ts";
import { assertLocalBaseUrl } from "./utils/assertLocalBaseUrl.ts";
import { getScreenshotOptions } from "./utils/getScreenshotOptions.ts";
import { getScreenshotTargets } from "./utils/getScreenshotTargets.ts";

/**
 * `npm run screenshot -- [--as=user|new] <route> [route...]`. Captures each route at 375px
 * and 1280px and prints the saved paths, one per line. Signed out by default. `--as=user`
 * signs in as a user with the `dj_rush` profile and `--as=new` as one without a profile;
 * either creates the user on the local stack, signs in through `/auth/confirm`, and
 * deletes the user afterwards. Starts the dev server when nothing answers at the base URL,
 * and stops it afterwards. `SCREENSHOT_BASE_URL` and `SCREENSHOT_DIR` override the server
 * and the output folder.
 */
const main = async (): Promise<void> => {
  const baseUrl = process.env.SCREENSHOT_BASE_URL ?? DEFAULT_BASE_URL;
  const outputDir = path.resolve(process.env.SCREENSHOT_DIR ?? DEFAULT_OUTPUT_DIR);
  const { signedInAs, routes } = getScreenshotOptions(process.argv.slice(2));
  const targets = getScreenshotTargets(routes, baseUrl);
  if (signedInAs) {
    assertLocalBaseUrl(baseUrl);
  }

  mkdirSync(outputDir, { recursive: true });
  const stopServer = await startServerIfDown(baseUrl, DEV_SERVER_COMMAND);
  let user: ScreenshotUserT | null = null;
  try {
    user = signedInAs ? await createScreenshotUser(signedInAs) : null;
    const { tokenHash } = user ?? {};
    const signIn = tokenHash
      ? (page: Page): Promise<void> => signInWithToken(page, baseUrl, tokenHash)
      : undefined;
    const savedPaths = await captureScreenshots(targets, outputDir, signIn);
    process.stdout.write(`${savedPaths.join("\n")}\n`);
  } finally {
    if (user) {
      await deleteScreenshotUser(user.userId);
    }
    stopServer();
  }
};

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
