/** The sizes every page is checked at. Heights only set the first screen; captures are full page. */
export const VIEWPORTS = [
  // A common phone width (iPhone 12 to 15 in portrait).
  { width: 375, height: 812 },
  // A small laptop, the narrowest common desktop layout.
  { width: 1280, height: 800 }
] as const;

/** CSS applied only while capturing. Hides the Next.js dev badge, which is not app UI. */
export const CAPTURE_STYLE = "nextjs-portal { display: none !important; }";

/** Where the dev server listens, matching `playwright.config.ts`. */
export const DEFAULT_BASE_URL = "http://localhost:3000";

/** Gitignored folder for captures, relative to the project root. */
export const DEFAULT_OUTPUT_DIR = "screenshots";

/** What `startServerIfDown` runs when nothing answers at the base URL. */
export const DEV_SERVER_COMMAND = ["npm", "run", "dev"];

// The first `next dev` request compiles the app, which can take well over 10 seconds.
export const SERVER_START_TIMEOUT_MS = 90_000;

// How often to check whether the started server responds yet.
export const SERVER_POLL_INTERVAL_MS = 250;
