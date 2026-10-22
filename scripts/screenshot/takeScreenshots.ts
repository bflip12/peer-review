import { mkdirSync } from "node:fs";
import path from "node:path";

import { captureScreenshots } from "./captureScreenshots.ts";
import {
  DEFAULT_BASE_URL,
  DEFAULT_OUTPUT_DIR,
  DEV_SERVER_COMMAND
} from "./screenshot.constants.ts";
import { startServerIfDown } from "./startServerIfDown.ts";
import { getScreenshotTargets } from "./utils/getScreenshotTargets.ts";

/**
 * `npm run screenshot -- <route> [route...]`. Captures each route at 375px and 1280px and
 * prints the saved paths, one per line. Starts the dev server when nothing answers at the
 * base URL, and stops it afterwards. `SCREENSHOT_BASE_URL` and `SCREENSHOT_DIR` override
 * the server and the output folder.
 */
const main = async (): Promise<void> => {
  const baseUrl = process.env.SCREENSHOT_BASE_URL ?? DEFAULT_BASE_URL;
  const outputDir = path.resolve(process.env.SCREENSHOT_DIR ?? DEFAULT_OUTPUT_DIR);
  const targets = getScreenshotTargets(process.argv.slice(2), baseUrl);

  mkdirSync(outputDir, { recursive: true });
  const stopServer = await startServerIfDown(baseUrl, DEV_SERVER_COMMAND);
  try {
    const savedPaths = await captureScreenshots(targets, outputDir);
    process.stdout.write(`${savedPaths.join("\n")}\n`);
  } finally {
    stopServer();
  }
};

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
