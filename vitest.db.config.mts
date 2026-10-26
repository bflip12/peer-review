import { defineConfig } from "vitest/config";

// Database tests run against the local Supabase stack (npm run db:start). Files run one at
// a time because they share one database.
export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000
  }
});
