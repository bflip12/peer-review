import { describe, expect, it } from "vitest";

import { runSql } from "./utils/testClients.ts";

// Functions in `public` that the API roles may call. Each entry is a deliberate choice,
// added in the migration that grants it, with a test calling it as anon and as a user.
const EXPOSED_FUNCTIONS: string[] = ["delete_my_account"];

describe("Supabase Postgres", () => {
  it("runs Postgres 15 or later, which NULLS NOT DISTINCT needs", async () => {
    const [result] = await runSql<{ version: number }>(
      "select current_setting('server_version_num')::int as version"
    );

    expect(result.version).toBeGreaterThanOrEqual(150000);
  });
});

describe("public schema", () => {
  it("has row level security on every table", async () => {
    const result = await runSql<{ table: string }>(`
      select relname as table from pg_class
      where relnamespace = 'public'::regnamespace and relkind in ('r', 'p')
        and not relrowsecurity
      order by relname`);

    expect(result).toEqual([]);
  });

  it("lets the API roles call only the functions listed as exposed", async () => {
    const rows = await runSql<{ name: string }>(`
      select p.proname as name from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and (has_function_privilege('anon', p.oid, 'execute')
          or has_function_privilege('authenticated', p.oid, 'execute'))
      order by p.proname`);

    const result = rows.map((row) => row.name);

    expect(result).toEqual(EXPOSED_FUNCTIONS);
  });

  it("lets delete_my_account's owner delete from auth.users", async () => {
    const [result] = await runSql<{ canDelete: boolean }>(`
      select has_table_privilege(p.proowner, 'auth.users', 'delete') as "canDelete"
      from pg_proc p
      where p.oid = 'public.delete_my_account()'::regprocedure`);

    expect(result.canDelete).toBe(true);
  });
});
