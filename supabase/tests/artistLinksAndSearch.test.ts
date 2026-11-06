import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createArtist, readArtistEdits, type ArtistIdsT } from "./utils/artists.ts";
import type { TestUserT } from "./utils/testClients.ts";
import { createAnonClient, runSql } from "./utils/testClients.ts";
import {
  BERLIN,
  createUserPool,
  KOLN,
  newSuffix,
  PERMISSION_DENIED
} from "./utils/venues.ts";

type SearchRowT = {
  short_id: string;
  name: string;
  home_city_id: number | null;
  home_city_name: string | null;
  link_platform_ids: string[];
  is_exact: boolean;
};

describe("DJ links and search", () => {
  const { newUser, deleteAll } = createUserPool();

  afterAll(async () => {
    await deleteAll();
  });

  describe("editing a DJ's links", () => {
    it("records an added, a changed, and a removed link, one edit each", async () => {
      const alice = await newUser();
      const artist = await createArtist(alice.client);

      const added = await alice.client.from("links").insert({
        artist_id: artist.id,
        platform_id: "bandcamp",
        url: "https://a.bandcamp.com"
      });
      await alice.client
        .from("links")
        .update({ url: "https://b.bandcamp.com" })
        .eq("artist_id", artist.id);
      await alice.client.from("links").delete().eq("artist_id", artist.id);

      expect(added.error).toBeNull();
      expect(await readArtistEdits(artist.id)).toEqual([
        {
          field: "bandcamp",
          old_value: null,
          new_value: "https://a.bandcamp.com",
          edited_by: alice.userId
        },
        {
          field: "bandcamp",
          old_value: "https://a.bandcamp.com",
          new_value: "https://b.bandcamp.com",
          edited_by: alice.userId
        },
        {
          field: "bandcamp",
          old_value: "https://b.bandcamp.com",
          new_value: null,
          edited_by: alice.userId
        }
      ]);
    });

    it("refuses another user adding, changing, or removing a DJ's link", async () => {
      const alice = await newUser();
      const bob = await newUser();
      const artist = await createArtist(alice.client, {
        links: { website: "https://kept.example.com" }
      });

      const added = await bob.client.from("links").insert({
        artist_id: artist.id,
        platform_id: "soundcloud",
        url: "https://soundcloud.com/a"
      });
      const changed = await bob.client
        .from("links")
        .update({ url: "https://changed.example.com" })
        .eq("artist_id", artist.id)
        .select("id");
      const removed = await bob.client
        .from("links")
        .delete()
        .eq("artist_id", artist.id)
        .select("id");

      const urls = await runSql<{ url: string }>(
        `select url from public.links where artist_id = '${artist.id}'`
      );
      expect([added.error?.code, changed.data, removed.data]).toEqual([
        PERMISSION_DENIED,
        [],
        []
      ]);
      expect(urls).toEqual([{ url: "https://kept.example.com" }]);
    });

    it("refuses a link from a signed-out visitor", async () => {
      const alice = await newUser();
      const artist = await createArtist(alice.client);

      const result = await createAnonClient().from("links").insert({
        artist_id: artist.id,
        platform_id: "website",
        url: "https://example.com"
      });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });
  });

  describe("search_artists", () => {
    let alice: TestUserT;
    let admin: TestUserT;
    const suffix = newSuffix();
    const djRush = `DJ Rush ${suffix}`;
    let noCity: ArtistIdsT;
    let berlin: ArtistIdsT;
    let koln: ArtistIdsT;
    let nearBerlin: ArtistIdsT;
    let nearKoln: ArtistIdsT;

    beforeAll(async () => {
      [alice, admin] = await Promise.all([newUser(), newUser("admin")]);
      noCity = await createArtist(alice.client, {
        name: djRush,
        links: {
          website: "https://djrush.com",
          soundcloud: "https://soundcloud.com/djrush",
          instagram: "https://instagram.com/djrush"
        }
      });
      berlin = await createArtist(alice.client, { name: djRush, city_id: BERLIN });
      koln = await createArtist(alice.client, { name: djRush, city_id: KOLN });
      nearBerlin = await createArtist(alice.client, {
        name: `Rush ${suffix}`,
        city_id: BERLIN
      });
      nearKoln = await createArtist(alice.client, {
        name: `The Rush ${suffix}`,
        city_id: KOLN
      });
    });

    const search = async (
      client: SupabaseClient,
      query: string,
      cityId: number | null = null,
      maxResults = 10
    ): Promise<SearchRowT[]> => {
      const result = await client.rpc("search_artists", {
        query,
        city_id: cityId,
        max_results: maxResults
      });
      expect(result.error).toBeNull();
      return result.data as SearchRowT[];
    };

    const shortIds = (rows: SearchRowT[]): string[] => rows.map((row) => row.short_id);

    // Other tests' DJs with names like these are near matches too, so ordering checks
    // look only at this block's DJs.
    const ownRows = (rows: SearchRowT[]): SearchRowT[] => {
      const own = new Set(
        [noCity, berlin, koln, nearBerlin, nearKoln].map((artist) => artist.short_id)
      );
      return rows.filter((row) => own.has(row.short_id));
    };

    it("returns exact matches in any city first, flagged, with near matches after", async () => {
      const rows = ownRows(
        await search(alice.client, `  dj rush ${suffix.toUpperCase()} `)
      );

      expect(rows.slice(0, 3).every((row) => row.is_exact)).toBe(true);
      expect(new Set(shortIds(rows.slice(0, 3)))).toEqual(
        new Set([noCity.short_id, berlin.short_id, koln.short_id])
      );
      expect(new Set(shortIds(rows.slice(3)))).toEqual(
        new Set([nearBerlin.short_id, nearKoln.short_id])
      );
      expect(rows.slice(3).some((row) => row.is_exact)).toBe(false);
    });

    it("with a city, keeps every exact match and only near matches there or with no city", async () => {
      const rows = ownRows(await search(alice.client, `Rush ${suffix}`, BERLIN));

      expect(rows[0]).toMatchObject({ short_id: nearBerlin.short_id, is_exact: true });
      expect(new Set(shortIds(rows))).toEqual(
        new Set([nearBerlin.short_id, noCity.short_id, berlin.short_id])
      );
    });

    it("returns the city and the link platforms in form order", async () => {
      const rows = await search(alice.client, djRush);

      const byId = new Map(rows.map((row) => [row.short_id, row]));
      expect(byId.get(noCity.short_id)).toMatchObject({
        name: djRush,
        home_city_id: null,
        home_city_name: null,
        link_platform_ids: ["instagram", "soundcloud", "website"]
      });
      expect(byId.get(berlin.short_id)).toMatchObject({
        home_city_id: BERLIN,
        home_city_name: "Berlin",
        link_platform_ids: []
      });
    });

    it("matches names ignoring accents", async () => {
      const rows = await search(alice.client, `Rüsh ${suffix}`);

      expect(shortIds(rows)).toContain(nearBerlin.short_id);
    });

    it("returns nothing under 2 characters", async () => {
      expect(await search(alice.client, " R ")).toEqual([]);
    });

    it("returns at most max_results rows, and never more than 10", async () => {
      const two = await search(alice.client, djRush, null, 2);
      const capped = await search(alice.client, "Rush", null, 50);

      expect(two).toHaveLength(2);
      expect(capped.length).toBeLessThanOrEqual(10);
    });

    it("leaves out merged DJs, and hidden DJs except for admins", async () => {
      const own = newSuffix();
      const merged = await createArtist(alice.client, { name: `Merged ${own}` });
      const hidden = await createArtist(alice.client, { name: `Hidden ${own}` });
      await runSql(`
        update public.artists set merged_into_id = '${berlin.id}' where id = '${merged.id}';
        update public.artists set hidden_at = now() where id = '${hidden.id}';`);

      const forUser = await search(alice.client, own);
      const forAdmin = await search(admin.client, own);

      expect(shortIds(forUser)).toEqual([]);
      expect(shortIds(forAdmin)).toEqual([hidden.short_id]);
    });

    it("refuses a signed-out visitor", async () => {
      const result = await createAnonClient().rpc("search_artists", { query: djRush });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });
  });
});
