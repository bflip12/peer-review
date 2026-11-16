import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createAnonClient,
  createTestUser,
  deleteTestUser,
  runSql
} from "./utils/testClients.ts";
import {
  createProfile,
  createUserPool,
  createVenue,
  CREATION_CAP,
  newSuffix,
  PERMISSION_DENIED
} from "./utils/venues.ts";

const CHECK_VIOLATION = "23514";

type BrandT = { id: string; name: string };

// A brand name no other test run uses.
const newBrandName = (): string => `Brand ${newSuffix()}`;

const addBrand = async (client: SupabaseClient, name: string): Promise<BrandT> => {
  const result = await client
    .rpc("create_sound_system", { brand_name: name })
    .single<BrandT>();
  if (result.error) {
    throw result.error;
  }
  return result.data;
};

// How many creations rows record a user adding a brand, read as `postgres`.
const countBrandCreations = async (userId: string): Promise<number> => {
  const [row] = await runSql<{ count: number }>(`
    select count(*)::int as count from public.creations
    where created_by = '${userId}' and sound_system_id is not null`);
  return row.count;
};

describe("sound systems", () => {
  const { newUser, track, deleteAll } = createUserPool();

  afterAll(async () => {
    await deleteAll();
  });

  describe("create_sound_system", () => {
    it("adds a trimmed brand with a generated ID and records the caller", async () => {
      const alice = await newUser();
      const name = newBrandName();

      const result = await addBrand(alice.client, `  ${name}  `);

      const [row] = await runSql<{ sort_order: number | null; created_by: string }>(`
        select s.sort_order, c.created_by from public.sound_systems s
        join public.creations c on c.sound_system_id = s.id
        where s.id = '${result.id}'`);
      expect(result.name).toBe(name);
      expect(result.id).toMatch(/^b_[2-9a-hjkmnp-z]{8}$/);
      expect(row).toEqual({ sort_order: null, created_by: alice.userId });
    });

    it("returns the listed brand for a name that differs only in case, spaces, and punctuation", async () => {
      const alice = await newUser();

      const result = await Promise.all([
        addBrand(alice.client, "funktion one"),
        addBrand(alice.client, "D&B Audiotechnik"),
        addBrand(alice.client, "l acoustics")
      ]);

      expect(result).toEqual([
        { id: "funktion_one", name: "Funktion-One" },
        { id: "d_and_b_audiotechnik", name: "d&b audiotechnik" },
        { id: "l_acoustics", name: "L-Acoustics" }
      ]);
      expect(await countBrandCreations(alice.userId)).toBe(0);
    });

    it("returns a user-added brand to the next user who types it", async () => {
      const [alice, bob] = await Promise.all([newUser(), newUser()]);
      const name = newBrandName();
      const added = await addBrand(alice.client, name);

      const result = await addBrand(bob.client, name.toUpperCase());

      expect(result).toEqual(added);
      expect(await countBrandCreations(bob.userId)).toBe(0);
    });

    it.each<[string, string]>([
      ["an empty name", "   "],
      ["punctuation only", "--"],
      ["a name over 50 characters", "a".repeat(51)]
    ])("refuses %s", async (_case, name) => {
      const alice = await newUser();

      const result = await alice.client.rpc("create_sound_system", { brand_name: name });

      expect(result.error?.code).toBe(CHECK_VIOLATION);
    });

    it("refuses the 11th brand in 24 hours, with the kind in the detail", async () => {
      const alice = await newUser();
      for (let index = 0; index < 10; index += 1) {
        await addBrand(alice.client, newBrandName());
      }

      const result = await alice.client.rpc("create_sound_system", {
        brand_name: newBrandName()
      });

      expect([result.error?.code, result.error?.details]).toEqual([
        CREATION_CAP,
        "sound_system"
      ]);
    });

    it("lets a moderator past the cap", async () => {
      const local = await newUser("moderator");
      for (let index = 0; index < 10; index += 1) {
        await addBrand(local.client, newBrandName());
      }

      const result = await local.client.rpc("create_sound_system", {
        brand_name: newBrandName()
      });

      expect(result.error).toBeNull();
    });

    it("refuses a signed-out visitor and a user with no profile", async () => {
      const noProfile = await createTestUser();
      track(noProfile);

      const result = await Promise.all([
        createAnonClient().rpc("create_sound_system", { brand_name: newBrandName() }),
        noProfile.client.rpc("create_sound_system", { brand_name: newBrandName() })
      ]);

      expect(result.map((reply) => reply.error?.code)).toEqual([
        PERMISSION_DENIED,
        PERMISSION_DENIED
      ]);
    });

    it("lets a venue be tagged with a user-added brand", async () => {
      const alice = await newUser();
      const brand = await addBrand(alice.client, newBrandName());

      const venue = await createVenue(alice.client, { sound_system_ids: [brand.id] });

      const [row] = await runSql<{ count: number }>(`
        select count(*)::int as count from public.venue_sound_systems
        where venue_id = '${venue.id}' and sound_system_id = '${brand.id}'`);
      expect(row.count).toBe(1);
    });

    it("keeps a brand when the user who added it deletes their account", async () => {
      const alice = await createTestUser();
      await createProfile(alice);
      const brand = await addBrand(alice.client, newBrandName());

      await deleteTestUser(alice.userId);

      const [row] = await runSql<{ brands: number; creations: number }>(`
        select
          (select count(*)::int from public.sound_systems where id = '${brand.id}') as brands,
          (select count(*)::int from public.creations where sound_system_id = '${brand.id}')
            as creations`);
      expect(row).toEqual({ brands: 1, creations: 0 });
    });
  });

  describe("search_sound_systems", () => {
    let alice: { client: SupabaseClient };

    beforeAll(async () => {
      alice = await newUser();
    });

    const search = async (query: string): Promise<string[]> => {
      const result = await alice.client.rpc("search_sound_systems", { query });
      expect(result.error).toBeNull();
      return ((result.data ?? []) as BrandT[]).map((brand) => brand.name);
    };

    it("puts a brand starting with the query first", async () => {
      const result = await search("funk");

      expect(result[0]).toBe("Funktion-One");
    });

    it("matches ignoring spaces and punctuation", async () => {
      const result = await search("Funktion One");

      expect(result[0]).toBe("Funktion-One");
    });

    it("finds a user-added brand", async () => {
      const name = newBrandName();
      await addBrand(alice.client, name);

      const result = await search(name.toLowerCase());

      expect(result[0]).toBe(name);
    });

    it("returns nothing for an empty query", async () => {
      const result = await search("  ");

      expect(result).toEqual([]);
    });

    it("refuses a signed-out visitor", async () => {
      const result = await createAnonClient().rpc("search_sound_systems", {
        query: "funk"
      });

      expect(result.error?.code).toBe(PERMISSION_DENIED);
    });
  });

  it("refuses adding a brand through the API without the function", async () => {
    const alice = await newUser();

    const result = await alice.client
      .from("sound_systems")
      .insert({ id: "b_22222222", name: newBrandName() });

    expect(result.error?.code).toBe(PERMISSION_DENIED);
  });
});
