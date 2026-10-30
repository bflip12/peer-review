import path from "node:path";
import { chromium } from "@playwright/test";
import type { BrowserContextOptions, Page } from "@playwright/test";

import { CAPTURE_STYLE, VIEWPORTS } from "./screenshot.constants.ts";
import type { ScreenshotTargetT } from "./utils/getScreenshotTargets.ts";

/** Signs the browser in before any capture. The session is reused at every size. */
export type SignInT = (page: Page) => Promise<void>;

/**
 * Opens each target at every size in `VIEWPORTS` and saves a full-page PNG as
 * `<name>-<width>.png` in `outputDir`, which must exist. With `signIn`, runs it once and
 * captures every page with that session's cookies. Waits for the network to go quiet, so
 * streamed content has replaced its loading fallback, and for web fonts, so text is not
 * captured in a fallback font. Hides the Next.js dev badge. Returns the saved paths in
 * order. Set `PLAYWRIGHT_CHROMIUM_PATH` to use a Chromium other than the one Playwright
 * installs.
 */
export const captureScreenshots = async (
  targets: ScreenshotTargetT[],
  outputDir: string,
  signIn?: SignInT
): Promise<string[]> => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
  });
  const savedPaths: string[] = [];
  try {
    let storageState: BrowserContextOptions["storageState"];
    if (signIn) {
      const context = await browser.newContext();
      await signIn(await context.newPage());
      storageState = await context.storageState();
      await context.close();
    }
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport, storageState });
      const page = await context.newPage();
      for (const target of targets) {
        await page.goto(target.url, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        const filePath = path.join(outputDir, `${target.name}-${viewport.width}.png`);
        await page.screenshot({ path: filePath, fullPage: true, style: CAPTURE_STYLE });
        savedPaths.push(filePath);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return savedPaths;
};
