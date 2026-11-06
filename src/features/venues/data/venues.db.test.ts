import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import { createAnonClient, runSql } from "../../../../supabase/tests/utils/testClients";
import {
  BERLIN,
  createUserPool,
  KOLN,
  newName
} from "../../../../supabase/tests/utils/venues";
import { getVenueChanges } from "../utils/getVenueChanges";
import type { VenueFormOptionsT, VenueInputT } from "../venues.types";
import { createVenue } from "./createVenue";
import { findSimilarVenues } from "./findSimilarVenues";
import { getCanEditVenue } from "./getCanEditVenue";
import { getVenue } from "./getVenue";
import { getVenueFormOptions } from "./getVenueFormOptions";
import { searchCities } from "./searchCities";
import { updateVenue } from "./updateVenue";

// GeoNames ID of Singapore, a city with no region.
const SINGAPORE = 1880252;

describe("venue data functions", () => {
  const { newUser, deleteAll } = createUserPool();
  let options: VenueFormOptionsT;

  const newClient = async (
    role?: "moderator" | "admin"
  ): Promise<{ client: SupabaseClientT; userId: string }> => {
    const user = await newUser(role);
    return { client: user.client as SupabaseClientT, userId: user.userId };
  };

  const addVenue = async (
    client: SupabaseClientT,
    input: Partial<VenueInputT> = {}
  ): Promise<{ id: string; shortId: string }> => {
    const result = await createVenue(
      client,
      {
        name: input.name ?? newName("Venue"),
        cityId: input.cityId ?? BERLIN,
        links: input.links ?? {},
        soundSystemIds: input.soundSystemIds ?? []
      },
      options.platforms
    );
    if (!result.ok) {
      throw new Error(result.message);
    }
    const [row] = await runSql<{ id: string }>(
      `select id from public.venues where short_id = '${result.data.shortId}'`
    );
    return { id: row.id, shortId: result.data.shortId };
  };

  beforeAll(async () => {
    options = await getVenueFormOptions(createAnonClient() as SupabaseClientT);
  });

  afterAll(async () => {
    await deleteAll();
  });

  describe("getVenueFormOptions", () => {
    it("returns the venue link platforms and every sound system, in form order", () => {
      const result = {
        platforms: options.platforms.map((platform) => platform.id),
        soundSystems: options.soundSystems.map((soundSystem) => soundSystem.id)
      };

      expect(result).toEqual({
        platforms: ["instagram", "resident_advisor", "website"],
        soundSystems: [
          "funktion_one",
          "void_acoustics",
          "l_acoustics",
          "d_and_b_audiotechnik",
          "danley",
          "martin_audio",
          "other"
        ]
      });
    });
  });

  describe("searchCities", () => {
    it("returns the city a name matches, with the matched name", async () => {
      const result = await searchCities(createAnonClient() as SupabaseClientT, "Cologne");

      expect(result[0]).toEqual({
        id: KOLN,
        name: "Köln",
        admin1Name: "North Rhine-Westphalia",
        countryCode: "DE",
        matchedName: "Cologne"
      });
    });

    it("returns null for a city with no region", async () => {
      const result = await searchCities(
        createAnonClient() as SupabaseClientT,
        "Singapore"
      );

      expect(result.find((city) => city.id === SINGAPORE)?.admin1Name).toBeNull();
    });
  });

  describe("createVenue and getVenue", () => {
    it("creates a venue and reads it back with its city, links, and tags in form order", async () => {
      const { client } = await newClient();
      const name = newName("Tresor");

      const venue = await addVenue(client, {
        name,
        links: {
          website: "https://tresorberlin.com",
          instagram: "https://instagram.com/tresorberlin"
        },
        soundSystemIds: ["other", "funktion_one"]
      });
      const result = await getVenue(createAnonClient() as SupabaseClientT, venue.shortId);

      expect(result).toEqual({
        id: venue.id,
        shortId: venue.shortId,
        name,
        city: {
          id: BERLIN,
          name: "Berlin",
          admin1Name: "State of Berlin",
          countryCode: "DE"
        },
        links: [
          {
            platformId: "instagram",
            label: "Instagram",
            url: "https://instagram.com/tresorberlin"
          },
          { platformId: "website", label: "Website", url: "https://tresorberlin.com" }
        ],
        soundSystems: [
          { id: "funktion_one", name: "Funktion-One" },
          { id: "other", name: "Other" }
        ]
      });
    });

    it("returns the cap message at the daily cap", async () => {
      const { client } = await newClient();
      for (let index = 0; index < 10; index += 1) {
        await addVenue(client);
      }

      const result = await createVenue(
        client,
        { name: newName("Venue"), cityId: BERLIN, links: {}, soundSystemIds: [] },
        options.platforms
      );

      expect(result).toEqual({
        ok: false,
        message: "You've added 10 venues today. You can add more tomorrow."
      });
    });

    it("returns null for a short ID no venue has, or one that cannot be a short ID", async () => {
      const anon = createAnonClient() as SupabaseClientT;

      const result = await Promise.all([
        getVenue(anon, "22222222"),
        getVenue(anon, "nope")
      ]);

      expect(result).toEqual([null, null]);
    });

    it("returns null for a hidden venue", async () => {
      const { client } = await newClient();
      const venue = await addVenue(client);
      await runSql(`update public.venues set hidden_at = now() where id = '${venue.id}'`);

      const result = await getVenue(client, venue.shortId);

      expect(result).toBeNull();
    });
  });

  describe("findSimilarVenues", () => {
    // Earlier runs leave venues with names like this one, so only the first row is checked.
    it("finds a venue in the city with a similar name, closest first", async () => {
      const { client } = await newClient();
      const name = newName("Similar");
      const venue = await addVenue(client, { name: `${name} Club` });

      const result = await findSimilarVenues(client, name, BERLIN);

      expect(result[0]).toEqual({ shortId: venue.shortId, name: `${name} Club` });
    });
  });

  describe("getCanEditVenue", () => {
    it("lets the creator edit until another user picks the venue", async () => {
      const creator = await newClient();
      const venue = await addVenue(creator.client);
      const args = { venueId: venue.id, userId: creator.userId };

      const canEditBefore = await getCanEditVenue(creator.client, args);
      await runSql(
        `update public.venues set used_by_others_at = now() where id = '${venue.id}'`
      );
      const canEditAfter = await getCanEditVenue(creator.client, args);

      expect([canEditBefore, canEditAfter]).toEqual([true, false]);
    });

    it("refuses another user and lets a moderator edit", async () => {
      const creator = await newClient();
      const [other, local] = await Promise.all([newClient(), newClient("moderator")]);
      const venue = await addVenue(creator.client);

      const result = await Promise.all([
        getCanEditVenue(other.client, { venueId: venue.id, userId: other.userId }),
        getCanEditVenue(local.client, { venueId: venue.id, userId: local.userId })
      ]);

      expect(result).toEqual([false, true]);
    });

    it("refuses a banned creator", async () => {
      const creator = await newClient();
      const venue = await addVenue(creator.client);
      await runSql(
        `update public.profiles set account_status = 'banned' where id = '${creator.userId}'`
      );

      const canEdit = await getCanEditVenue(creator.client, {
        venueId: venue.id,
        userId: creator.userId
      });

      expect(canEdit).toBe(false);
    });
  });

  describe("updateVenue", () => {
    const current: VenueInputT = {
      name: "Before",
      cityId: BERLIN,
      links: { instagram: "https://instagram.com/a", website: "https://a.example.com" },
      soundSystemIds: ["danley"]
    };
    const next: VenueInputT = {
      name: "After",
      cityId: KOLN,
      links: {
        instagram: "https://instagram.com/b",
        resident_advisor: "https://ra.co/clubs/1"
      },
      soundSystemIds: ["other"]
    };

    it("writes every change, one catalog edit each", async () => {
      const { client } = await newClient();
      const venue = await addVenue(client, current);

      const result = await updateVenue(client, {
        venueId: venue.id,
        changes: getVenueChanges(current, next),
        platforms: options.platforms
      });

      const read = await getVenue(client, venue.shortId);
      const [edits] = await runSql<{ fields: string[] }>(`
        select array_agg(field order by field) as fields from public.catalog_edits
        where entity_id = '${venue.id}'`);
      expect(result).toEqual({ ok: true, data: undefined });
      expect({
        name: read?.name,
        cityId: read?.city.id,
        links: read?.links.map((link) => `${link.platformId} ${link.url}`),
        soundSystems: read?.soundSystems.map((soundSystem) => soundSystem.id)
      }).toEqual({
        name: "After",
        cityId: KOLN,
        links: [
          "instagram https://instagram.com/b",
          "resident_advisor https://ra.co/clubs/1"
        ],
        soundSystems: ["other"]
      });
      expect(edits.fields).toEqual([
        "city_id",
        "instagram",
        "name",
        "resident_advisor",
        "sound_system",
        "sound_system",
        "website"
      ]);
    });

    it("refuses another user and changes nothing", async () => {
      const creator = await newClient();
      const other = await newClient();
      const venue = await addVenue(creator.client, current);

      const result = await updateVenue(other.client, {
        venueId: venue.id,
        changes: getVenueChanges(current, next),
        platforms: options.platforms
      });

      const read = await getVenue(creator.client, venue.shortId);
      expect(result).toEqual({
        ok: false,
        message:
          "You can no longer edit this venue. Someone else has picked it, so locals keep it up to date."
      });
      expect(read?.name).toBe("Before");
    });

    it("refuses a link change from another user", async () => {
      const creator = await newClient();
      const other = await newClient();
      const venue = await addVenue(creator.client, current);

      const result = await updateVenue(other.client, {
        venueId: venue.id,
        changes: getVenueChanges(current, {
          ...current,
          links: { instagram: "https://instagram.com/c" }
        }),
        platforms: options.platforms
      });

      expect(result.ok).toBe(false);
    });
  });
});
