import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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
  createVenue,
  CREATION_CAP,
  KOLN,
  LINK_HOST,
  newName,
  PERMISSION_DENIED,
  readEdits,
  readVenue,
  type RoleT,
  type VenueIdsT
} from "./utils/venues.ts";

describe("venues", () => {
  const { newUser, track, deleteAll } = createUserPool();

  afterAll(async () => {
    await deleteAll();
  });

  describe("create_venue", () => {
    it("creates the venue with its links and tags, and records the caller as creator", async () => {
      const alice = await newUser();
      const name = newName("Tresor");

      const venue = await createVenue(alice.client, {
        name,
        links: { instagram: "https://www.instagram.com/tresorberlin" },
        sound_system_ids: ["funktion_one", "funktion_one", "other"]
      });

      const [row] = await runSql<Record<string, unknown>>(`
        select v.name, v.city_id, v.short_id, c.created_by,
          (select array_agg(l.platform_id || ' ' || l.url) from public.links l
            where l.venue_id = v.id) as links,
          (select array_agg(t.sound_system_id order by t.sound_system_id)
            from public.venue_sound_systems t where t.venue_id = v.id) as tags
        from public.venues v join public.creations c on c.venue_id = v.id
        where v.id = '${venue.id}'`);
      expect(row).toEqual({
        name,
        city_id: BERLIN,
        short_id: venue.short_id,
        created_by: alice.userId,
        links: ["instagram https://www.instagram.com/tresorberlin"],
        tags: ["funktion_one", "other"]
      });
    });

    it("gives the venue an 8-character short ID without look-alike characters", async () => {
      const alice = await newUser();

      const venue = await createVenue(alice.client);

      expect(venue.short_id).toMatch(/^[2-9a-hjkmnp-z]{8}$/);
    });

    it("writes no catalog edits for the creation", async () => {
      const alice = await newUser();

      const venue = await createVenue(alice.client, {
        links: { website: "https://example.com" },
        sound_system_ids: ["danley"]
      });

      expect(await readEdits(venue.id)).toEqual([]);
    });

    it("refuses a signed-out visitor", async () => {
      const result = await createAnonClient().rpc("create_venue", {
        name: newName("Venue"),
        city_id: BERLIN
      });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses a user with no profile", async () => {
      const noProfile = await createTestUser();
      track(noProfile);

      const result = await noProfile.client.rpc("create_venue", {
        name: newName("Venue"),
        city_id: BERLIN
      });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses a banned user", async () => {
      const banned = await newUser();
      await runSql(
        `update public.profiles set account_status = 'banned' where id = '${banned.userId}'`
      );

      const result = await banned.client.rpc("create_venue", {
        name: newName("Venue"),
        city_id: BERLIN
      });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses the 11th venue in 24 hours, with the kind in the detail", async () => {
      const alice = await newUser();
      for (let i = 0; i < 10; i += 1) {
        await createVenue(alice.client);
      }

      const result = await alice.client.rpc("create_venue", {
        name: newName("Venue"),
        city_id: BERLIN
      });

      expect([result.error?.code, result.error?.details]).toEqual([
        CREATION_CAP,
        "venue"
      ]);
    });

    it.each<[string, Record<string, string>, string]>([
      [
        "a host the platform does not accept",
        { instagram: "https://example.com/a" },
        "instagram"
      ],
      [
        "a user name before the host",
        { instagram: "https://instagram.com@example.com/a" },
        "instagram"
      ],
      [
        "a platform venues do not offer",
        { soundcloud: "https://soundcloud.com/a" },
        "soundcloud"
      ],
      [
        "the old Resident Advisor domain",
        { resident_advisor: "https://residentadvisor.net/a" },
        "resident_advisor"
      ]
    ])(
      "refuses %s, with the platform in the detail, and saves nothing",
      async (_case, links, platform) => {
        const alice = await newUser();
        const name = newName("Refused");

        const result = await alice.client.rpc("create_venue", {
          name,
          city_id: BERLIN,
          links
        });

        const [saved] = await runSql<{ count: string }>(
          `select count(*) from public.venues where name = '${name}'`
        );
        expect([result.error?.code, result.error?.details, saved.count]).toEqual([
          LINK_HOST,
          platform,
          "0"
        ]);
      }
    );

    it.each<[string, Record<string, string>]>([
      ["www and a path", { instagram: "https://www.instagram.com/tresorberlin" }],
      [
        "no www, a port, and a query",
        { resident_advisor: "https://ra.co:443/clubs/5031?x=1" }
      ],
      ["an uppercase host", { instagram: "https://Instagram.COM/tresorberlin" }],
      ["any host for a website", { website: "http://tresorberlin.com" }]
    ])("accepts a link with %s", async (_case, links) => {
      const alice = await newUser();

      const venue = await createVenue(alice.client, { links });

      expect(venue.short_id).toHaveLength(8);
    });
  });

  describe("reading", () => {
    let alice: TestUserT;
    let admin: TestUserT;
    let shown: VenueIdsT;
    let hidden: VenueIdsT;

    beforeAll(async () => {
      [alice, admin] = await Promise.all([newUser(), newUser("admin")]);
      const links = { website: "https://example.com" };
      const sound_system_ids = ["void_acoustics"];
      shown = await createVenue(alice.client, { links, sound_system_ids });
      hidden = await createVenue(alice.client, { links, sound_system_ids });
      await runSql(
        `update public.venues set hidden_at = now() where id = '${hidden.id}'`
      );
    });

    const readAll = async (
      client: SupabaseClient
    ): Promise<{ venues: string[]; links: string[]; tags: string[] }> => {
      const ids = [shown.id, hidden.id];
      const [venues, links, tags] = await Promise.all([
        client.from("venues").select("id").in("id", ids),
        client.from("links").select("venue_id").in("venue_id", ids),
        client.from("venue_sound_systems").select("venue_id").in("venue_id", ids)
      ]);
      expect([venues.error, links.error, tags.error]).toEqual([null, null, null]);
      return {
        venues: (venues.data ?? []).map((row) => row.id as string).sort(),
        links: (links.data ?? []).map((row) => row.venue_id as string).sort(),
        tags: (tags.data ?? []).map((row) => row.venue_id as string).sort()
      };
    };

    it.each<[string, () => SupabaseClient]>([
      ["a signed-out visitor", () => createAnonClient()],
      ["a signed-in user", () => alice.client]
    ])(
      "shows %s venues, links, and tags, except a hidden venue's",
      async (_role, getClient) => {
        const result = await readAll(getClient());

        expect(result).toEqual({
          venues: [shown.id],
          links: [shown.id],
          tags: [shown.id]
        });
      }
    );

    it("shows an admin hidden venues too", async () => {
      const result = await readAll(admin.client);

      const both = [shown.id, hidden.id].sort();
      expect(result).toEqual({ venues: both, links: both, tags: both });
    });
  });

  describe("editing a venue's name and city", () => {
    it("lets the creator change the name and city, and records each change", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client, { name: "Before", city_id: BERLIN });

      const result = await alice.client
        .from("venues")
        .update({ name: "After", city_id: KOLN })
        .eq("id", venue.id)
        .select("id");

      expect(result.error).toBeNull();
      expect(await readVenue(venue.id)).toEqual({ name: "After", city_id: KOLN });
      expect(await readEdits(venue.id)).toEqual([
        { field: "city_id", old_value: BERLIN, new_value: KOLN, edited_by: alice.userId },
        {
          field: "name",
          old_value: "Before",
          new_value: "After",
          edited_by: alice.userId
        }
      ]);
    });

    it("records nothing when the values do not change", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client, { name: "Same" });

      await alice.client.from("venues").update({ name: "Same" }).eq("id", venue.id);

      expect(await readEdits(venue.id)).toEqual([]);
    });

    it.each<[string, (venueId: string, creator: TestUserT) => Promise<TestUserT>]>([
      ["another user", async () => newUser()],
      [
        "the creator after another user picked the venue",
        async (venueId, creator) => {
          await runSql(
            `update public.venues set used_by_others_at = now() where id = '${venueId}'`
          );
          return creator;
        }
      ],
      [
        "a banned creator",
        async (_venueId, creator) => {
          await runSql(
            `update public.profiles set account_status = 'banned' where id = '${creator.userId}'`
          );
          return creator;
        }
      ]
    ])("changes nothing for %s", async (_role, getEditor) => {
      const creator = await newUser();
      const venue = await createVenue(creator.client, { name: "Kept" });
      const editor = await getEditor(venue.id, creator);

      const result = await editor.client
        .from("venues")
        .update({ name: "Changed" })
        .eq("id", venue.id)
        .select("id");

      expect(result.data).toEqual([]);
      expect(await readVenue(venue.id)).toEqual({ name: "Kept", city_id: BERLIN });
    });

    it.each<[RoleT]>([["moderator"], ["admin"]])(
      "lets a %s edit a venue someone else created and another user picked",
      async (role) => {
        const alice = await newUser();
        const local = await newUser(role);
        const venue = await createVenue(alice.client, { name: "Before" });
        await runSql(
          `update public.venues set used_by_others_at = now() where id = '${venue.id}'`
        );

        await local.client.from("venues").update({ name: "After" }).eq("id", venue.id);

        expect(await readEdits(venue.id)).toEqual([
          {
            field: "name",
            old_value: "Before",
            new_value: "After",
            edited_by: local.userId
          }
        ]);
      }
    );

    it("changes nothing for a signed-out visitor", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client, { name: "Kept" });

      const result = await createAnonClient()
        .from("venues")
        .update({ name: "Changed" })
        .eq("id", venue.id);

      expect(result.error?.code).toBe(PERMISSION_DENIED);
      expect(await readVenue(venue.id)).toEqual({ name: "Kept", city_id: BERLIN });
    });

    it.each<[string, Record<string, unknown>]>([
      ["short_id", { short_id: "22222222" }],
      ["hidden_at", { hidden_at: new Date().toISOString() }],
      ["used_by_others_at", { used_by_others_at: new Date().toISOString() }],
      ["merged_into_id", { merged_into_id: randomUUID() }],
      ["created_at", { created_at: new Date(0).toISOString() }]
    ])("refuses the creator writing %s", async (_column, values) => {
      const alice = await newUser();
      const venue = await createVenue(alice.client);

      const result = await alice.client.from("venues").update(values).eq("id", venue.id);

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });

    it("refuses inserting or deleting a venue through the API", async () => {
      const alice = await newUser();
      const venue = await createVenue(alice.client);

      const inserted = await alice.client
        .from("venues")
        .insert({ name: newName("Venue"), city_id: BERLIN });
      const deleted = await alice.client.from("venues").delete().eq("id", venue.id);

      expect([inserted.error?.code, deleted.error?.code]).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });
  });

  it("keeps a venue and its edits when the creator deletes their account", async () => {
    const alice = await createTestUser();
    await createProfile(alice);
    const venue = await createVenue(alice.client, { name: "Before" });
    await alice.client.from("venues").update({ name: "After" }).eq("id", venue.id);

    await deleteTestUser(alice.userId);

    const [result] = await runSql<Record<string, unknown>>(`
      select
        (select count(*)::int from public.venues where id = '${venue.id}') as venues,
        (select count(*)::int from public.creations where venue_id = '${venue.id}') as creations,
        (select array_agg(edited_by) from public.catalog_edits where entity_id = '${venue.id}') as editors`);
    expect(result).toEqual({ venues: 1, creations: 0, editors: [null] });
  });
});
