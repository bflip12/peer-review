import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestUserT } from "./utils/testClients.ts";
import {
  createAnonClient,
  createTestUser,
  deleteTestUser,
  runSql
} from "./utils/testClients.ts";

// Postgres "insufficient privilege": the API roles have no write grant on these tables.
const PERMISSION_DENIED = "42501";

// GeoNames IDs of cities the tests look for.
const KOLN = 2886242;
const PORTLAND_OREGON = 5746545;
const PORTLAND_MAINE = 4975802;

type CityResultT = {
  id: number;
  name: string;
  admin1_name: string | null;
  country_code: string;
  matched_name: string;
};

const search = async (
  client: SupabaseClient,
  query: string,
  maxResults?: number
): Promise<CityResultT[]> => {
  const { data, error } = await client.rpc("search_cities", {
    query,
    max_results: maxResults
  });
  if (error) {
    throw error;
  }
  return data as CityResultT[];
};

describe("cities", () => {
  let user: TestUserT;

  beforeAll(async () => {
    user = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(user.userId);
  });

  describe("the seed", () => {
    it("has every city's timezone in Postgres's timezone list", async () => {
      const result = await runSql<{ timezone: string }>(`
        select distinct timezone from public.cities
        where timezone not in (select name from pg_timezone_names)`);

      expect(result).toEqual([]);
    });

    it("leaves out districts such as Kreuzberg", async () => {
      const result = await runSql<{ count: number }>(
        "select count(*)::int as count from public.cities where id = 2884161"
      );

      expect(result).toEqual([{ count: 0 }]);
    });
  });

  describe.each<[string, () => SupabaseClient]>([
    ["a signed-out visitor", createAnonClient],
    ["a signed-in user", () => user.client]
  ])("as %s", (_role, client) => {
    it("reads a city", async () => {
      const result = await client()
        .from("cities")
        .select("name, ascii_name, country_code, admin1_name, timezone")
        .eq("id", KOLN)
        .single();

      expect(result.data).toEqual({
        name: "Köln",
        ascii_name: "Koeln",
        country_code: "DE",
        admin1_name: "North Rhine-Westphalia",
        timezone: "Europe/Berlin"
      });
    });

    it("reads a city's other names", async () => {
      const result = await client()
        .from("city_names")
        .select("name")
        .eq("city_id", KOLN)
        .eq("language", "en");

      expect(result.data).toEqual([{ name: "Cologne" }]);
    });

    it("cannot add, change, or delete a city", async () => {
      const added = await client().from("cities").insert({
        id: 1,
        name: "Nowhere",
        ascii_name: "Nowhere",
        country_code: "DE",
        population: 0,
        timezone: "Europe/Berlin"
      });
      const changed = await client()
        .from("cities")
        .update({ name: "Cologne" })
        .eq("id", KOLN);
      const deleted = await client().from("cities").delete().eq("id", KOLN);

      expect([added.error?.code, changed.error?.code, deleted.error?.code]).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });

    it("cannot add, change, or delete a city name", async () => {
      const added = await client()
        .from("city_names")
        .insert({ city_id: KOLN, language: "en", name: "Kolnberg" });
      const changed = await client()
        .from("city_names")
        .update({ name: "Kolnberg" })
        .eq("city_id", KOLN);
      const deleted = await client().from("city_names").delete().eq("city_id", KOLN);

      expect([added.error?.code, changed.error?.code, deleted.error?.code]).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });

    it("finds Köln typed without the accent", async () => {
      const [result] = await search(client(), "koln");

      expect(result).toEqual({
        id: KOLN,
        name: "Köln",
        admin1_name: "North Rhine-Westphalia",
        country_code: "DE",
        matched_name: "Köln"
      });
    });

    it("finds Köln by its English name, and says which name matched", async () => {
      const [result] = await search(client(), "Cologne");

      expect([result.id, result.matched_name]).toEqual([KOLN, "Cologne"]);
    });

    it("lists cities with the same name by population, each with its region", async () => {
      const result = await search(client(), "portland", 2);

      expect(result.map((city) => [city.id, city.admin1_name])).toEqual([
        [PORTLAND_OREGON, "Oregon"],
        [PORTLAND_MAINE, "Maine"]
      ]);
    });

    it("matches a word inside a name", async () => {
      const result = await search(client(), "york", 1);

      expect(result.map((city) => city.name)).toEqual(["New York City"]);
    });

    it("lists a city once when several of its names match", async () => {
      const result = await search(client(), "köln", 20);

      expect(result.filter((city) => city.id === KOLN)).toHaveLength(1);
    });

    it("matches only the start of a name for a 2-character query", async () => {
      const result = await search(client(), "be", 20);

      expect(result.length).toBeGreaterThan(0);
      expect(
        result.every((city) => /^b[eé]/i.test(city.matched_name.normalize("NFD")))
      ).toBe(true);
    });

    it("returns nothing for a 1-character query", async () => {
      const result = await search(client(), " b ");

      expect(result).toEqual([]);
    });

    it("treats % and _ in the query as text", async () => {
      const result = await search(client(), "%%%");

      expect(result).toEqual([]);
    });

    it("returns 10 cities by default and at most 20", async () => {
      const byDefault = await search(client(), "san");
      const asked = await search(client(), "san", 500);

      expect([byDefault.length, asked.length]).toEqual([10, 20]);
    });
  });
});
