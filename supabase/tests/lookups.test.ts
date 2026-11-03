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

// Postgres "check violation".
const CHECK_VIOLATION = "23514";

// Inserts a link platform with the given hosts inside a transaction that rolls back, so a
// row the check wrongly accepts never stays in the seed.
const insertPlatformWithHosts = async (hosts: string): Promise<void> => {
  await runSql(`
    begin;
    insert into public.link_platforms
      (id, label, allowed_hosts, is_for_venues, is_for_artists, is_for_collectives, sort_order)
    values ('test_platform', 'Test platform', '${hosts}', true, true, true, 999);
    rollback;`);
};

describe("lookups", () => {
  let user: TestUserT;

  beforeAll(async () => {
    user = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(user.userId);
  });

  describe.each<[string, () => SupabaseClient]>([
    ["a signed-out visitor", createAnonClient],
    ["a signed-in user", () => user.client]
  ])("as %s", (_role, client) => {
    it("reads the sound systems in order, with Other last", async () => {
      const result = await client()
        .from("sound_systems")
        .select("id, name")
        .order("sort_order");

      expect(result.data).toEqual([
        { id: "funktion_one", name: "Funktion-One" },
        { id: "void_acoustics", name: "Void Acoustics" },
        { id: "l_acoustics", name: "L-Acoustics" },
        { id: "d_and_b_audiotechnik", name: "d&b audiotechnik" },
        { id: "danley", name: "Danley" },
        { id: "martin_audio", name: "Martin Audio" },
        { id: "other", name: "Other" }
      ]);
    });

    it("reads the link platforms in order, with the hosts and forms of each", async () => {
      const result = await client()
        .from("link_platforms")
        .select(
          "id, label, allowed_hosts, is_for_venues, is_for_artists, is_for_collectives"
        )
        .order("sort_order");

      expect(result.data).toEqual([
        {
          id: "instagram",
          label: "Instagram",
          allowed_hosts: ["instagram.com", "www.instagram.com"],
          is_for_venues: true,
          is_for_artists: true,
          is_for_collectives: true
        },
        {
          id: "resident_advisor",
          label: "Resident Advisor",
          allowed_hosts: ["ra.co", "www.ra.co"],
          is_for_venues: true,
          is_for_artists: true,
          is_for_collectives: true
        },
        {
          id: "soundcloud",
          label: "SoundCloud",
          allowed_hosts: [
            "soundcloud.com",
            "www.soundcloud.com",
            "m.soundcloud.com",
            "on.soundcloud.com"
          ],
          is_for_venues: false,
          is_for_artists: true,
          is_for_collectives: true
        },
        {
          id: "bandcamp",
          label: "Bandcamp",
          allowed_hosts: ["*.bandcamp.com"],
          is_for_venues: false,
          is_for_artists: true,
          is_for_collectives: true
        },
        {
          id: "website",
          label: "Website",
          allowed_hosts: [],
          is_for_venues: true,
          is_for_artists: true,
          is_for_collectives: true
        }
      ]);
    });

    it("cannot add, change, or delete a sound system", async () => {
      const added = await client()
        .from("sound_systems")
        .insert({ id: "test_system", name: "Test system", sort_order: 999 });
      const changed = await client()
        .from("sound_systems")
        .update({ name: "Funktion One" })
        .eq("id", "funktion_one");
      const deleted = await client().from("sound_systems").delete().eq("id", "other");

      expect([added.error?.code, changed.error?.code, deleted.error?.code]).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });

    it("cannot add, change, or delete a link platform", async () => {
      const added = await client().from("link_platforms").insert({
        id: "test_platform",
        label: "Test platform",
        allowed_hosts: [],
        is_for_venues: true,
        is_for_artists: true,
        is_for_collectives: true,
        sort_order: 999
      });
      const changed = await client()
        .from("link_platforms")
        .update({ allowed_hosts: [] })
        .eq("id", "instagram");
      const deleted = await client().from("link_platforms").delete().eq("id", "website");

      expect([added.error?.code, changed.error?.code, deleted.error?.code]).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });
  });

  // Rows come only from migrations, which run as postgres, so these go through runSql.
  describe("a link platform's allowed hosts", () => {
    it("accepts host names, and a host starting with *.", async () => {
      await expect(
        insertPlatformWithHosts("{example.com, www.example.com, *.example.com}")
      ).resolves.toBeUndefined();
    });

    it.each([
      ["a URL", "{https://example.com}"],
      ["a host with a path", "{example.com/name}"],
      ["capital letters", "{Example.com}"],
      ["a name with no dot", "{localhost}"],
      ["a * in the middle", "{www.*.example.com}"],
      ["an empty host", '{""}'],
      ["an empty host after a real one", '{example.com, ""}'],
      ["a null", "{example.com, null}"]
    ])("refuses %s", async (_case, hosts) => {
      await expect(insertPlatformWithHosts(hosts)).rejects.toMatchObject({
        code: CHECK_VIOLATION
      });
    });
  });
});
