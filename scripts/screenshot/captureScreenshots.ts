import path from "node:path";
import { chromium } from "@playwright/test";

import { CAPTURE_STYLE, VIEWPORTS } from "./screenshot.constants.ts";
import type { ScreenshotTargetT } from "./utils/getScreenshotTargets.ts";

/**
 * Opens each target at every size in `VIEWPORTS` and saves a full-page PNG as
 * `<name>-<width>.png` in `outputDir`, which must exist. Waits for the load event and for
 * web fonts, so text is not captured in a fallback font, and hides the Next.js dev badge.
 * Returns the saved paths in order.
 * Set `PLAYWRIGHT_CHROMIUM_PATH` to use a Chromium other than the one Playwright installs.
 */
export const captureScreenshots = async (
  targets: ScreenshotTargetT[],
  outputDir: string
): Promise<string[]> => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
  });
  const savedPaths: string[] = [];
  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport });
      for (const target of targets) {
        await page.goto(target.url, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const filePath = path.join(outputDir, `${target.name}-${viewport.width}.png`);
        await page.screenshot({ path: filePath, fullPage: true, style: CAPTURE_STYLE });
        savedPaths.push(filePath);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  return savedPaths;
};
