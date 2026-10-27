---
paths:
  - "supabase/**"
  - "docs/DATA_MODEL.md"
---

# Database

Applies to migrations and `docs/DATA_MODEL.md`. ADR 0010 explains the reasoning.

## Before adding or changing a table or column

Check the change against the "Not in v1" list in `SPEC.md` and "Later" in `TASKS.md`:
- **Yes or no states.** A state that could gain a third value is an enum, not a boolean.
  Examples: log visibility, account status. A one-value enum column (follow status, Going
  visibility) is allowed only when the enum table in `docs/DATA_MODEL.md` names the value
  expected next and the feature that brings it. Otherwise the column waits for its
  feature.
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
- **Who writes which column.** RLS picks rows, not columns, for writes too. An owner's
  update policy lets the owner change every column of their row through the API. Each
  table lists its writable columns per role in `docs/DATA_MODEL.md` ("Column writes").
  Columns no signed-in user writes directly are left out of a column-level `GRANT UPDATE
  (...)`. Columns only some app roles write (`hidden_at` for admins, `role`) go through a
  database function or a `BEFORE UPDATE` trigger that checks `profiles.role`, since
  every signed-in user is the same Postgres role. Each protected column gets a test.
- **Database functions.** Function security rules (schemas, `security definer`, grants)
  live in `.claude/rules/supabase.md`.

Apart from the one-value enum case above, do not add a column only in case a feature
arrives. Adding a column later is cheap. Changing a type, a key, or columns into rows is
not.

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
