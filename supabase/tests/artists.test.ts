import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  CHECK_VIOLATION,
  createArtist,
  markUsedByOthers,
  readArtist,
  readArtistEdits,
  UNIQUE_VIOLATION,
  type ArtistIdsT
} from "./utils/artists.ts";
import type { TestUserT } from "./utils/testClients.ts";
import {
  createAnonClient,
  createTestUser,
  deleteTestUser,
  runSql
} from "./utils/testClients.ts";
import {
  BERLIN,
  createProfile,
  createUserPool,
  CREATION_CAP,
  KOLN,
  LINK_HOST,
  newName,
  PERMISSION_DENIED,
  type RoleT
} from "./utils/venues.ts";

describe("artists", () => {
  const { newUser, track, deleteAll } = createUserPool();

  afterAll(async () => {
    await deleteAll();
  });

  describe("create_artist", () => {
    it("creates the DJ with their links, and records the caller as creator", async () => {
      const alice = await newUser();
      const name = newName("DJ Rush");

      const artist = await createArtist(alice.client, {
        name,
        city_id: BERLIN,
        links: { soundcloud: "https://soundcloud.com/djrush" }
      });

      const [row] = await runSql<Record<string, unknown>>(`
        select a.name, a.city_id, a.short_id, c.created_by,
          (select array_agg(l.platform_id || ' ' || l.url) from public.links l
            where l.artist_id = a.id) as links
        from public.artists a join public.creations c on c.artist_id = a.id
        where a.id = '${artist.id}'`);
      expect(row).toEqual({
        name,
        city_id: BERLIN,
        short_id: artist.short_id,
        created_by: alice.userId,
        links: ["soundcloud https://soundcloud.com/djrush"]
      });
    });

    it("creates a DJ with no city, and an 8-character short ID", async () => {
      const alice = await newUser();

      const artist = await createArtist(alice.client);

      expect(artist.short_id).toMatch(/^[2-9a-hjkmnp-z]{8}$/);
      expect((await readArtist(artist.id)).city_id).toBeNull();
    });

    it("writes no catalog edits for the creation", async () => {
      const alice = await newUser();

      const artist = await createArtist(alice.client, {
        city_id: BERLIN,
        links: { website: "https://example.com" }
      });

      expect(await readArtistEdits(artist.id)).toEqual([]);
    });

    it("refuses a signed-out visitor", async () => {
      const result = await createAnonClient().rpc("create_artist", {
        name: newName("DJ")
      });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses a user with no profile", async () => {
      const noProfile = await createTestUser();
      track(noProfile);

      const result = await noProfile.client.rpc("create_artist", { name: newName("DJ") });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses a banned user", async () => {
      const banned = await newUser();
      await runSql(
        `update public.profiles set account_status = 'banned' where id = '${banned.userId}'`
      );

      const result = await banned.client.rpc("create_artist", { name: newName("DJ") });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses the 51st DJ in 24 hours, with the kind in the detail", async () => {
      const alice = await newUser();
      for (let i = 0; i < 50; i += 1) {
        await createArtist(alice.client);
      }

      const result = await alice.client.rpc("create_artist", { name: newName("DJ") });

      expect([result.error?.code, result.error?.details]).toEqual([
        CREATION_CAP,
        "artist"
      ]);
    });

    it.each<[string]>([["DJ Rush b2b Surgeon"], ["Rush B2B Surgeon"], ["xb2bx"]])(
      "refuses the name %s, with the b2b check named",
      async (prefix) => {
        const alice = await newUser();

        const result = await alice.client.rpc("create_artist", {
          name: newName(prefix)
        });

        expect([result.error?.code, result.error?.message]).toEqual([
          CHECK_VIOLATION,
          expect.stringContaining("artists_name_b2b_check")
        ]);
      }
    );

    it.each<[string]>([["Bob 2 Bob"], ["B 2 B"]])(
      "accepts the name %s, which is not b2b",
      async (prefix) => {
        const alice = await newUser();

        const artist = await createArtist(alice.client, { name: newName(prefix) });

        expect(artist.short_id).toHaveLength(8);
      }
    );

    it.each<[string, Record<string, string>]>([
      ["a Bandcamp subdomain", { bandcamp: "https://djrush.bandcamp.com/album/x" }],
      ["a SoundCloud short link", { soundcloud: "https://on.soundcloud.com/abc" }],
      [
        "an Instagram and an RA link",
        {
          instagram: "https://www.instagram.com/djrush",
          resident_advisor: "https://ra.co/dj/djrush"
        }
      ],
      ["any host for a website", { website: "https://djrush.com" }]
    ])("accepts %s", async (_case, links) => {
      const alice = await newUser();

      const artist = await createArtist(alice.client, { links });

      expect(artist.short_id).toHaveLength(8);
    });

    it.each<[string, Record<string, string>, string]>([
      [
        "bandcamp.com without a subdomain",
        { bandcamp: "https://bandcamp.com/djrush" },
        "bandcamp"
      ],
      [
        "a host ending in bandcamp.com",
        { bandcamp: "https://evilbandcamp.com/a" },
        "bandcamp"
      ],
      [
        "the DJ's own domain as Bandcamp",
        { bandcamp: "https://djrush.com/music" },
        "bandcamp"
      ],
      [
        "a user name before a Bandcamp host",
        { bandcamp: "https://x.bandcamp.com@example.com/a" },
        "bandcamp"
      ],
      [
        "a host SoundCloud does not use",
        { soundcloud: "https://example.com/a" },
        "soundcloud"
      ]
    ])(
      "refuses %s, with the platform in the detail, and saves nothing",
      async (_case, links, platform) => {
        const alice = await newUser();
        const name = newName("Refused");

        const result = await alice.client.rpc("create_artist", { name, links });

        const [saved] = await runSql<{ count: string }>(
          `select count(*) from public.artists where name = '${name}'`
        );
        expect([result.error?.code, result.error?.details, saved.count]).toEqual([
          LINK_HOST,
          platform,
          "0"
        ]);
      }
    );
  });

  describe("one DJ per name and city", () => {
    const createResult = async (
      client: SupabaseClient,
      name: string,
      cityId: number | null
    ): Promise<string | null> => {
      const result = await client.rpc("create_artist", { name, city_id: cityId });
      return result.error ? `${result.error.code} ${result.error.message}` : null;
    };

    it("refuses a second DJ with the same name and no city, in any case or spacing", async () => {
      const alice = await newUser();
      const name = newName("DJ Rush");
      await createArtist(alice.client, { name });

      const result = await createResult(alice.client, `  ${name.toUpperCase()} `, null);

      expect(result).toMatch(
        new RegExp(`^${UNIQUE_VIOLATION} .*artists_name_city_id_key`)
      );
    });

    it("allows the same name with a city, and refuses that city twice", async () => {
      const alice = await newUser();
      const name = newName("DJ Rush");
      await createArtist(alice.client, { name });

      const withCity = await createResult(alice.client, name, BERLIN);
      const otherCity = await createResult(alice.client, name, KOLN);
      const sameCity = await createResult(alice.client, name.toLowerCase(), BERLIN);

      expect([withCity, otherCity]).toEqual([null, null]);
      expect(sameCity).toMatch(new RegExp(`^${UNIQUE_VIOLATION} `));
    });

    it("ignores merged DJs", async () => {
      const alice = await newUser();
      const name = newName("DJ Rush");
      const kept = await createArtist(alice.client, { name: newName("Kept") });
      const merged = await createArtist(alice.client, { name });
      await runSql(
        `update public.artists set merged_into_id = '${kept.id}' where id = '${merged.id}'`
      );

      const result = await createResult(alice.client, name, null);

      expect(result).toBeNull();
    });

    it("refuses renaming a DJ, or changing their city, into a taken pair", async () => {
      const alice = await newUser();
      const name = newName("DJ Rush");
      await createArtist(alice.client, { name, city_id: BERLIN });
      const renamed = await createArtist(alice.client, { city_id: BERLIN });
      const moved = await createArtist(alice.client, { name, city_id: KOLN });

      const rename = await alice.client
        .from("artists")
        .update({ name })
        .eq("id", renamed.id);
      const move = await alice.client
        .from("artists")
        .update({ city_id: BERLIN })
        .eq("id", moved.id);

      expect([rename.error?.code, move.error?.code]).toEqual([
        UNIQUE_VIOLATION,
        UNIQUE_VIOLATION
      ]);
    });
  });

  describe("reading", () => {
    let alice: TestUserT;
    let admin: TestUserT;
    let shown: ArtistIdsT;
    let hidden: ArtistIdsT;

    beforeAll(async () => {
      [alice, admin] = await Promise.all([newUser(), newUser("admin")]);
      const links = { website: "https://example.com" };
      shown = await createArtist(alice.client, { links });
      hidden = await createArtist(alice.client, { links });
      await runSql(
        `update public.artists set hidden_at = now() where id = '${hidden.id}'`
      );
    });

    const readAll = async (
      client: SupabaseClient
    ): Promise<{ artists: string[]; links: string[] }> => {
      const ids = [shown.id, hidden.id];
      const [artists, links] = await Promise.all([
        client.from("artists").select("id").in("id", ids),
        client.from("links").select("artist_id").in("artist_id", ids)
      ]);
      expect([artists.error, links.error]).toEqual([null, null]);
      return {
        artists: (artists.data ?? []).map((row) => row.id as string).sort(),
        links: (links.data ?? []).map((row) => row.artist_id as string).sort()
      };
    };

    it.each<[string, () => SupabaseClient]>([
      ["a signed-out visitor", () => createAnonClient()],
      ["a signed-in user", () => alice.client]
    ])("shows %s DJs and links, except a hidden DJ's", async (_role, getClient) => {
      const result = await readAll(getClient());

      expect(result).toEqual({ artists: [shown.id], links: [shown.id] });
    });

    it("shows an admin hidden DJs too", async () => {
      const result = await readAll(admin.client);

      const both = [shown.id, hidden.id].sort();
      expect(result).toEqual({ artists: both, links: both });
    });
  });

  describe("editing a DJ's name and city", () => {
    it("lets the creator change the name and city, and records each change", async () => {
      const alice = await newUser();
      const before = newName("Before");
      const after = newName("After");
      const artist = await createArtist(alice.client, { name: before });

      const result = await alice.client
        .from("artists")
        .update({ name: after, city_id: KOLN })
        .eq("id", artist.id)
        .select("id");

      expect(result.error).toBeNull();
      expect(await readArtist(artist.id)).toEqual({ name: after, city_id: KOLN });
      expect(await readArtistEdits(artist.id)).toEqual([
        { field: "city_id", old_value: null, new_value: KOLN, edited_by: alice.userId },
        { field: "name", old_value: before, new_value: after, edited_by: alice.userId }
      ]);
    });

    it("records a cleared city with no new value", async () => {
      const alice = await newUser();
      const artist = await createArtist(alice.client, { city_id: BERLIN });

      await alice.client.from("artists").update({ city_id: null }).eq("id", artist.id);

      expect(await readArtistEdits(artist.id)).toEqual([
        { field: "city_id", old_value: BERLIN, new_value: null, edited_by: alice.userId }
      ]);
    });

    it.each<[string, (artistId: string, creator: TestUserT) => Promise<TestUserT>]>([
      ["another user", async () => newUser()],
      [
        "the creator after another user picked the DJ",
        async (artistId, creator) => {
          await markUsedByOthers(artistId);
          return creator;
        }
      ],
      [
        "a banned creator",
        async (_artistId, creator) => {
          await runSql(
            `update public.profiles set account_status = 'banned' where id = '${creator.userId}'`
          );
          return creator;
        }
      ]
    ])("changes nothing for %s", async (_role, getEditor) => {
      const creator = await newUser();
      const name = newName("Kept");
      const artist = await createArtist(creator.client, { name });
      const editor = await getEditor(artist.id, creator);

      const result = await editor.client
        .from("artists")
        .update({ name: newName("Changed") })
        .eq("id", artist.id)
        .select("id");

      expect(result.data).toEqual([]);
      expect(await readArtist(artist.id)).toEqual({ name, city_id: null });
    });

    it.each<[RoleT]>([["moderator"], ["admin"]])(
      "lets a %s edit a DJ someone else created and another user picked",
      async (role) => {
        const alice = await newUser();
        const local = await newUser(role);
        const artist = await createArtist(alice.client);
        await markUsedByOthers(artist.id);

        await local.client
          .from("artists")
          .update({ city_id: BERLIN })
          .eq("id", artist.id);

        expect(await readArtistEdits(artist.id)).toEqual([
          {
            field: "city_id",
            old_value: null,
            new_value: BERLIN,
            edited_by: local.userId
          }
        ]);
      }
    );

    it("changes nothing for a signed-out visitor", async () => {
      const alice = await newUser();
      const name = newName("Kept");
      const artist = await createArtist(alice.client, { name });

      const result = await createAnonClient()
        .from("artists")
        .update({ name: newName("Changed") })
        .eq("id", artist.id);

      expect(result.error?.code).toBe(PERMISSION_DENIED);
      expect(await readArtist(artist.id)).toEqual({ name, city_id: null });
    });

    it("refuses an edit that adds b2b to the name", async () => {
      const alice = await newUser();
      const artist = await createArtist(alice.client);

      const result = await alice.client
        .from("artists")
        .update({ name: newName("A b2b B") })
        .eq("id", artist.id);

      expect(result.error?.code).toBe(CHECK_VIOLATION);
    });

    it.each<[string, Record<string, unknown>]>([
      ["short_id", { short_id: "22222222" }],
      ["hidden_at", { hidden_at: new Date().toISOString() }],
      ["used_by_others_at", { used_by_others_at: new Date().toISOString() }],
      ["merged_into_id", { merged_into_id: randomUUID() }],
      ["created_at", { created_at: new Date(0).toISOString() }]
    ])("refuses the creator writing %s", async (_column, values) => {
      const alice = await newUser();
      const artist = await createArtist(alice.client);

      const result = await alice.client
        .from("artists")
        .update(values)
        .eq("id", artist.id);

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses inserting or deleting a DJ through the API", async () => {
      const alice = await newUser();
      const artist = await createArtist(alice.client);

      const inserted = await alice.client.from("artists").insert({ name: newName("DJ") });
      const deleted = await alice.client.from("artists").delete().eq("id", artist.id);

      expect([inserted.error?.code, deleted.error?.code]).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });
  });

  it("keeps a DJ and their edits when the creator deletes their account", async () => {
    const alice = await createTestUser();
    await createProfile(alice);
    const artist = await createArtist(alice.client);
    await alice.client.from("artists").update({ city_id: BERLIN }).eq("id", artist.id);

    await deleteTestUser(alice.userId);

    const [result] = await runSql<Record<string, unknown>>(`
      select
        (select count(*)::int from public.artists where id = '${artist.id}') as artists,
        (select count(*)::int from public.creations where artist_id = '${artist.id}') as creations,
        (select array_agg(edited_by) from public.catalog_edits where entity_id = '${artist.id}') as editors`);
    expect(result).toEqual({ artists: 1, creations: 0, editors: [null] });
  });
});
