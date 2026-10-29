# 0021: Lint enforcement, Stylelint, and the React Compiler

- Date: 2026-10-29
- Status: Accepted

## Context
`docs/code-style.md` was enforced by reading it. The only custom lint rule was `max-lines`.
A review of the setup found:
- ESLint exits 0 when a file has only warnings. `react-hooks/exhaustive-deps`, the six
  `jsx-a11y` rules Next.js turns on, and `@next/next/no-img-element` are warnings, so CI
  passed with them and the edit hook did not report them.
- Nothing linted CSS, so the rule that colors come from tokens had no check.
- `eslint-plugin-react-hooks` 7, which Next.js turns on, already enforces the React
  Compiler's rules (`purity`, `refs`, `set-state-in-effect`), but the compiler was off.
  Code-style section 6 still required `useCallback` on every handler a hook returns, the
  manual memoization the compiler replaces.
- `import "server-only"`, which code-style requires in every data function, fails in
  Vitest: the package was not installed, and its default entry throws outside a server
  build. The database test config also had no `@/` path alias.

A lint error comes back to Claude after every edit through the hook, so a rule in the
lint config is applied every time. A rule in a document is applied when it is remembered.

## Options considered

**Enforcing code-style**
- **Docs only.** No dependencies, but the rules are checked only in review.
- **Lint rules for what a machine can check, docs for judgment.** typescript-eslint,
  `jsx-a11y`, Testing Library, and Playwright publish rules for most of code-style's
  mechanical points. Type-aware rules need the TypeScript project at lint time, which
  makes a full lint slower (seconds at this size).

**CSS**
- **Stylelint with `stylelint-config-standard` and `stylelint-declaration-strict-value`.**
  The common CSS linter. The second plugin fails any color property not written as a
  variable, the check GitHub's Primer design system uses for its tokens.
- **No CSS linter.** Colors stay checked by review only.

**React Compiler**
- **On.** Stable since Next.js 16 and React Compiler 1.0. Components and hooks are
  memoized at build time, so code drops `useMemo` and `useCallback` written for
  performance. Builds run the Babel plugin on files with JSX or hooks, which Next.js
  documents as slower.
- **Off.** Faster builds; code keeps memoizing by hand, with the lint rules already on.

## Decision
- `npm run lint` and the edit hook run with `--max-warnings 0`, so a warning fails both.
- `eslint.config.mjs` enforces the mechanical rules of code-style: `type` over
  `interface`, `import type`, the `T` suffix, `is`/`has`/`can`/`should` booleans,
  SCREAMING_SNAKE module constants, return types on exports, arrow functions, named
  exports outside route and config files, no `React.FC` or `forwardRef`, no index keys,
  no nested ternaries, `curly`, `eqeqeq`, the type-aware recommended rules of
  typescript-eslint (floating promises among them), the full `jsx-a11y` recommended set,
  and the Testing Library and Playwright recommended rules for their test files.
- Stylelint runs in `npm run lint` and in the edit hook for CSS: the standard config,
  camelCase class names for CSS Modules, colors only from variables outside the token
  file, and no `!important` outside the reset.
- The React Compiler is on (`reactCompiler: true`). `useMemo` and `useCallback` are used
  only where a value's identity matters to something outside React's render, such as an
  effect dependency or a debounced function that must be created once.
- `server-only` is a dependency, and `vitest.db.config.mts` loads its server entry and
  resolves `@/`, so data functions load in database tests.
- `tsconfig.json` sets `erasableSyntaxOnly`, because Node runs `scripts/*.ts` by stripping
  types and refuses enums, namespaces, and constructor parameter properties.

## Consequences
- Code-style section 6 and the checklist drop the `useCallback` rule. Rules a linter now
  enforces stay in code-style, as the reference for why.
- Every new rule applied to the existing code: `curly` braces, four renamed variables, and
  CSS range media queries (`width >= 48rem`), which Next's build compiles back to
  `min-width`.
- The compiler runs on client components. Checked by building one: its output reads and
  writes the compiler's memo cache. Server components render once per request and are
  not memoized.
- Builds run Babel on files with JSX or hooks. Revisit if build time on Vercel becomes a
  problem.
- A lint rule that blocks correct code is changed in the config, with the reason in a
  comment, never turned off with an inline disable unless the line has a reason no rule
  can know (the iOS `-webkit-text-size-adjust` line in the reset).
