---
paths:
  - "src/**/*.{ts,tsx,css}"
---

# React, TypeScript, and styling

- Follow `docs/code-style.md`. Run its section 13 checklist before committing.
- Colors come from CSS variables defined in one token file. Never inline a color. The token
  file is created with the first styled component, and the palette is recorded in
  `docs/style-guide.md`.
- Next.js exception to checklist item 1: route files (`page.tsx`, `layout.tsx`,
  `loading.tsx`, `error.tsx`, `not-found.tsx`) use `export default`, because Next.js
  requires it. Everything else stays `export const`.
- Code-style section 9 applies to client components. Rules for server-side data fetching
  are not written yet (see `TASKS.md`, Milestone 0).
