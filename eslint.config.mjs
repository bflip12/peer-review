import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import playwright from "eslint-plugin-playwright";
import testingLibrary from "eslint-plugin-testing-library";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// A file over this many lines of code is doing more than one thing. Blank lines and
// comments do not count, so docblocks never push a file over.
const MAX_LINES = 300;

// Tests get more room, since each behaviour adds a describe block with its own fixtures.
const MAX_TEST_LINES = 500;

// Files Next.js or a tool loads by their default export. Every other file uses named
// exports (code-style section 5).
const DEFAULT_EXPORT_FILES = [
  "src/app/**/{page,layout,loading,error,global-error,not-found,template,default}.tsx",
  "src/app/**/{opengraph-image,twitter-image,icon,apple-icon}.tsx",
  "src/app/**/{sitemap,robots,manifest}.ts",
  "*.config.{ts,mts,mjs}",
  "vitest.*.mts"
];

// Module constants the SCREAMING_SNAKE rule skips: test fixtures, which are `mockX`
// (code-style section 12), and the route segment config names Next.js reads, which are
// lowercase by Next.js's choice.
const NOT_SCREAMING_SNAKE =
  "^(mock[A-Z].*|dynamic|dynamicParams|revalidate|runtime|maxDuration)$";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "max-lines": [
        "error",
        { max: MAX_LINES, skipBlankLines: true, skipComments: true }
      ],
      eqeqeq: ["error", "always"],
      "no-nested-ternary": "error",
      // Code-style section 5: `export const` with an arrow function, never a declaration.
      "func-style": ["error", "expression"],
      "prefer-arrow-callback": "error",
      "import/no-default-export": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSTypeReference[typeName.name=/^(FC|FunctionComponent)$/]",
          message: "Type the props and the return instead (code-style section 8)."
        },
        {
          selector:
            "TSQualifiedName[left.name='React'][right.name=/^(FC|FunctionComponent)$/]",
          message: "Type the props and the return instead (code-style section 8)."
        },
        {
          // func-style skips default exports, which route files need.
          selector: "ExportDefaultDeclaration > FunctionDeclaration",
          message:
            "Declare a named arrow function and `export default` it at the bottom " +
            "(code-style section 8)."
        },
        {
          selector: "CallExpression[callee.name='forwardRef']",
          message: "React 19 passes `ref` as a regular prop. Accept it in the props type."
        },
        {
          selector: "CallExpression[callee.property.name='forwardRef']",
          message: "React 19 passes `ref` as a regular prop. Accept it in the props type."
        }
      ]
    }
  },
  {
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    },
    rules: {
      ...tseslint.configs.recommendedTypeCheckedOnly.reduce(
        (rules, config) => ({ ...rules, ...config.rules }),
        {}
      ),
      // Code-style section 4: `type`, never `interface`, and `import type`.
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports" }
      ],
      // Code-style section 5: every exported function states its return type.
      "@typescript-eslint/explicit-module-boundary-types": "error",
      // A form action or click handler may be async. React awaits neither, which is fine.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } }
      ],
      // Code-style section 3.
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"], suffix: ["T"] },
        {
          selector: ["variable", "parameter"],
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "has", "can", "should"]
        },
        {
          selector: "variable",
          modifiers: ["const", "global"],
          types: ["boolean"],
          format: ["UPPER_CASE"],
          prefix: ["IS_", "HAS_", "CAN_", "SHOULD_"]
        },
        {
          selector: "variable",
          modifiers: ["const", "global"],
          types: ["string", "number", "array"],
          format: ["UPPER_CASE"],
          filter: { regex: NOT_SCREAMING_SNAKE, match: false }
        }
      ]
    }
  },
  {
    files: ["**/*.tsx"],
    rules: {
      // The full recommended set as errors. Next.js turns on six of these as warnings.
      ...jsxA11y.flatConfigs.recommended.rules,
      // Index keys reuse the wrong row's state when a list is reordered or filtered.
      "react/no-array-index-key": "error"
    }
  },
  {
    files: DEFAULT_EXPORT_FILES,
    rules: {
      "import/no-default-export": "off"
    }
  },
  {
    // The SQL functions these tests create exist only for the test, so they are never in
    // the generated types, and the clients that call them are untyped.
    files: ["supabase/tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off"
    }
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    ...testingLibrary.configs["flat/react"]
  },
  {
    files: ["e2e/**/*.ts"],
    ...playwright.configs["flat/recommended"]
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
  // Turns off the rules that conflict with Prettier.
  prettier,
  // After Prettier's config, which turns `curly` off. With "all" it cannot conflict.
  {
    rules: {
      curly: ["error", "all"]
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    "next-env.d.ts",
    "src/lib/supabase/database.types.ts"
  ])
]);

export default eslintConfig;
