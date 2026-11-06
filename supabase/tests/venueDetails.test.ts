import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { TestUserT } from "./utils/testClients.ts";
import { createAnonClient, runSql } from "./utils/testClients.ts";
import {
  BERLIN,
  countLinks,
  createUserPool,
  createVenue,
  KOLN,
  LINK_HOST,
  newName,
  PERMISSION_DENIED,
  type EditT
} from "./utils/venues.ts";

describe("venue links, sound systems, and search", () => {
  const { newUser, deleteAll } = createUserPool();

  afterAll(async () => {
    await deleteAll();
  });

  describe("editing links", () => {
    it("records an added, a changed, and a removed link, one edit each", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client);

      await alice.client.from("links").insert({
        venue_id: venue.id,
        platform_id: "website",
        url: "https://a.example.com"
      });
      await alice.client
        .from("links")
        .update({ url: "https://b.example.com" })
        .eq("venue_id", venue.id);
      await alice.client.from("links").delete().eq("venue_id", venue.id);

      const edits = await runSql<EditT>(`
        select field, old_value, new_value, edited_by from public.catalog_edits
        where entity_id = '${venue.id}' order by created_at`);
      expect(edits).toEqual([
        {
          field: "website",
          old_value: null,
          new_value: "https://a.example.com",
          edited_by: alice.userId
        },
        {
          field: "website",
          old_value: "https://a.example.com",
          new_value: "https://b.example.com",
          edited_by: alice.userId
        },
        {
          field: "website",
          old_value: "https://b.example.com",
          new_value: null,
          edited_by: alice.userId
        }
      ]);
    });

    it("refuses a changed link whose host the platform does not accept", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client, {
        links: { instagram: "https://instagram.com/a" }
      });

      const result = await alice.client
        .from("links")
        .update({ url: "https://example.com/instagram.com" })
        .eq("venue_id", venue.id);

      expect([result.error?.code, result.error?.details]).toEqual([
        LINK_HOST,
        "instagram"
      ]);
    });

    it("refuses a second link on the same platform", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client, {
        links: { website: "https://a.example.com" }
      });

      const result = await alice.client.from("links").insert({
        venue_id: venue.id,
        platform_id: "website",
        url: "https://b.example.com"
      });

      expect(result.error?.code).toBe("23505");
    });

    it("refuses another user adding, changing, or removing a link", async () => {
      const [alice, bob] = await Promise.all([newUser(), newUser()]);
      const venue = await createVenue(alice.client, {
        links: { website: "https://a.example.com" }
      });

      const inserted = await bob.client.from("links").insert({
        venue_id: venue.id,
        platform_id: "instagram",
        url: "https://instagram.com/a"
      });
      const updated = await bob.client
        .from("links")
        .update({ url: "https://b.example.com" })
        .eq("venue_id", venue.id)
        .select("id");
      const deleted = await bob.client
        .from("links")
        .delete()
        .eq("venue_id", venue.id)
        .select("id");

      expect([inserted.error?.code, updated.data, deleted.data]).toEqual([
        PERMISSION_DENIED,
        [],
        []
      ]);
      expect(await countLinks(venue.id)).toBe(1);
    });

    it("refuses moving a link to another platform or venue", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client, {
        links: { website: "https://a.example.com" }
      });

      const result = await alice.client
        .from("links")
        .update({ platform_id: "instagram" })
        .eq("venue_id", venue.id);

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses a link with no venue, through the API", async () => {
      const alice = await newUser();

      const result = await alice.client
        .from("links")
        .insert({ platform_id: "website", url: "https://a.example.com" });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });
  });

  describe("editing sound system tags", () => {
    it("records an added and a removed tag", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client);

      await alice.client
        .from("venue_sound_systems")
        .insert({ venue_id: venue.id, sound_system_id: "danley" });
      await alice.client.from("venue_sound_systems").delete().eq("venue_id", venue.id);

      const edits = await runSql<EditT>(`
        select field, old_value, new_value, edited_by from public.catalog_edits
        where entity_id = '${venue.id}' order by created_at`);
      expect(edits).toEqual([
        {
          field: "sound_system",
          old_value: null,
          new_value: "danley",
          edited_by: alice.userId
        },
        {
          field: "sound_system",
          old_value: "danley",
          new_value: null,
          edited_by: alice.userId
        }
      ]);
    });

    it("refuses another user adding or removing a tag", async () => {
      const [alice, bob] = await Promise.all([newUser(), newUser()]);
      const venue = await createVenue(alice.client, { sound_system_ids: ["danley"] });

      const inserted = await bob.client
        .from("venue_sound_systems")
        .insert({ venue_id: venue.id, sound_system_id: "other" });
      const deleted = await bob.client
        .from("venue_sound_systems")
        .delete()
        .eq("venue_id", venue.id)
        .select("venue_id");

      expect([inserted.error?.code, deleted.data]).toEqual([PERMISSION_DENIED, []]);
    });

    it("refuses a signed-out visitor adding a tag", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client);

      const result = await createAnonClient()
        .from("venue_sound_systems")
        .insert({ venue_id: venue.id, sound_system_id: "other" });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });
  });

  describe("search_venues", () => {
    let alice: TestUserT;
    let word: string;

    beforeAll(async () => {
      alice = await newUser();
      word = `zq${randomUUID().replaceAll("-", "").slice(0, 6)}`;
      await createVenue(alice.client, { name: `${word} Club`, city_id: BERLIN });
      await createVenue(alice.client, { name: `Über ${word}`, city_id: BERLIN });
      await createVenue(alice.client, { name: `${word} Club`, city_id: KOLN });
      const merged = await createVenue(alice.client, {
        name: `${word} Old`,
        city_id: BERLIN
      });
      const target = await createVenue(alice.client, { name: newName("Target") });
      await runSql(
        `update public.venues set merged_into_id = '${target.id}' where id = '${merged.id}'`
      );
    });

    const search = async (query: string, cityId = BERLIN): Promise<string[]> => {
      const result = await alice.client.rpc("search_venues", { query, city_id: cityId });
      expect(result.error).toBeNull();
      return ((result.data ?? []) as { name: string }[]).map((row) => row.name);
    };

    it("finds venues in the city whose name contains the query", async () => {
      const result = await search(word);

      expect(result.sort()).toEqual([`${word} Club`, `Über ${word}`].sort());
    });

    it("ignores case and accents", async () => {
      const result = await search(`UBER ${word}`);

      expect(result[0]).toBe(`Über ${word}`);
    });

    it("finds a close name that does not contain the query", async () => {
      const result = await search(`${word} Clubb`);

      expect(result).toContain(`${word} Club`);
    });

    it("returns nothing for a query under 2 characters", async () => {
      const result = await search("z");

      expect(result).toEqual([]);
    });

    it("refuses a signed-out visitor", async () => {
      const result = await createAnonClient().rpc("search_venues", {
        query: word,
        city_id: BERLIN
      });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });
  });
});
