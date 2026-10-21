import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

// A file over this many lines of code is doing more than one thing. Blank lines and
// comments do not count, so docblocks never push a file over.
const MAX_LINES = 300;

// Tests get more room, since each behaviour adds a describe block with its own fixtures.
const MAX_TEST_LINES = 500;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "max-lines": ["error", { max: MAX_LINES, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    rules: {
      "max-lines": [
        "error",
        { max: MAX_TEST_LINES, skipBlankLines: true, skipComments: true }
      ]
    }
  },
  // Last, so it turns off the rules that conflict with Prettier.
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    "next-env.d.ts"
  ])
]);

export default eslintConfig;
