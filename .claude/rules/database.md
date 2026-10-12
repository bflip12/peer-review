---
paths:
  - "supabase/**"
  - "docs/DATA_MODEL.md"
---

# Database

Applies to migrations and `docs/DATA_MODEL.md`. ADR 0010 explains the reasoning.

## Before adding or changing a table or column

Check the change against the "Not in v1" list in `SPEC.md` and "Later" in `TASKS.md`:
- **Yes or no states.** If a state could gain a third value, use an enum, even with one
  value today. Examples: log visibility, follow status, account status.
- **Keys.** Would a planned feature change the primary key? Decide the key now.
- **Columns per variant.** If the same kind of value repeats as columns (one per link
  site), use rows in a table instead.
- **Unique rules with optional columns.** Postgres treats two `NULL`s as different, so a
  unique rule lets both in. Use `NULLS NOT DISTINCT`, or compare a non-null key.
- **References with optional columns.** A reference that includes a `NULL` value is not
  checked. Copied columns used in a reference are never null.
- **Who did what.** Row level security hides rows, not columns. Anything that shows who
  created or edited something goes in a table with its own read rules, never on a public
  row.

Do not add a column only in case a feature arrives. Adding a column later is cheap. Changing
a type, a key, or columns into rows is not.

## Enums and lookup tables

- Postgres enum: a fixed list the code switches on (roles, statuses, kinds).
- Lookup table: a list that carries data or that admins extend (sound systems, link
  platforms).
- Adding an enum value is its own migration, committed before anything uses it. Values are
  never removed; Postgres cannot drop one. Renaming is allowed.

## Values

- A missing value is `NULL`, never `''`. Optional text columns refuse empty or
  whitespace-only text.
- Ratings are `smallint` 1 to 10 (half-stars times two).
- Dates for events are read in the event city's timezone.

## After a change

- Update `docs/DATA_MODEL.md`, including "Hard to change later" and the enum table.
- Every RLS rule gets a test.
