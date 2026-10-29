import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Database tests run against the local Supabase stack (npm run db:start): supabase/tests,
// and data functions' *.db.test.ts files beside the code. Files run one at a time because
// they share one database.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // The package's default entry throws, so a module importing it can only load in a
      // server build. Tests of data functions load the empty entry the server build uses.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url)
      )
    }
  },
  test: {
    environment: "node",
    include: ["supabase/tests/**/*.test.ts", "src/**/*.db.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000
  }
});
