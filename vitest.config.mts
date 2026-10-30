import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    // *.db.test.ts files need the local Supabase stack; npm run test:db runs them.
    exclude: ["**/node_modules/**", "src/**/*.db.test.ts", "scripts/**/*.db.test.ts"],
    setupFiles: ["./vitest.setup.ts"]
  }
});
