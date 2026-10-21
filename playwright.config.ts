import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const IS_CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: IS_CI,
  retries: 0,
  reporter: IS_CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    launchOptions: {
      // Cloud sessions ship a Chromium build older than the one this Playwright version
      // downloads. Set PLAYWRIGHT_CHROMIUM_PATH there to use it instead.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
    }
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI tests the production build. Locally the dev server starts faster.
    command: IS_CI ? "npm run build && npm run start" : "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: 120_000
  }
});
