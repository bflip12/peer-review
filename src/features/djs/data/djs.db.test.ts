import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import { getLinkPlatforms } from "@/features/catalog/data/getLinkPlatforms";
import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import { createAnonClient, runSql } from "../../../../supabase/tests/utils/testClients";
import {
  BERLIN,
  createUserPool,
  KOLN,
  newName,
  newSuffix
} from "../../../../supabase/tests/utils/venues";
import type { DjInputT } from "../djs.types";
import { getDjChanges } from "../utils/getDjChanges";
import { createDj } from "./createDj";
import { findSimilarDjs } from "./findSimilarDjs";
import { getCanEditDj } from "./getCanEditDj";
import { getDj } from "./getDj";
import { updateDj } from "./updateDj";

const NO_LONGER_EDITABLE =
  "You can no longer edit this DJ. Someone else has picked them, so locals keep them up to date.";

describe("DJ data functions", () => {
  const { newUser, deleteAll } = createUserPool();
  let platforms: LinkPlatformT[];

  const newClient = async (
    role?: "moderator" | "admin"
  ): Promise<{ client: SupabaseClientT; userId: string }> => {
    const user = await newUser(role);
    return { client: user.client as SupabaseClientT, userId: user.userId };
  };

  const addDj = async (
    client: SupabaseClientT,
    input: Partial<DjInputT> = {}
  ): Promise<{ id: string; shortId: string }> => {
    const result = await createDj(
      client,
      {
        name: input.name ?? newName("DJ"),
        cityId: input.cityId ?? null,
        links: input.links ?? {}
      },
      platforms
    );
    if (!result.ok) {
      throw new Error(result.message);
    }
    const [row] = await runSql<{ id: string }>(
      `select id from public.artists where short_id = '${result.data.shortId}'`
    );
    return { id: row.id, shortId: result.data.shortId };
  };

  beforeAll(async () => {
    platforms = await getLinkPlatforms(createAnonClient() as SupabaseClientT, "artist");
  });

  afterAll(async () => {
    await deleteAll();
  });

  describe("getLinkPlatforms", () => {
    it("returns the DJ link platforms in form order", () => {
      expect(platforms.map((platform) => platform.id)).toEqual([
        "instagram",
        "resident_advisor",
        "soundcloud",
        "bandcamp",
        "website"
      ]);
    });
  });

  describe("createDj and getDj", () => {
    it("creates a DJ and reads them back with their city and links in form order", async () => {
      const { client } = await newClient();
      const name = newName("DJ Rush");

      const dj = await addDj(client, {
        name,
        cityId: KOLN,
        links: {
          website: "https://djrush.com",
          bandcamp: "https://djrush.bandcamp.com"
        }
      });

      const result = await getDj(createAnonClient() as SupabaseClientT, dj.shortId);
      expect(result).toEqual({
        id: dj.id,
        shortId: dj.shortId,
        name,
        city: {
          id: KOLN,
          name: "Köln",
          admin1Name: "North Rhine-Westphalia",
          countryCode: "DE"
        },
        links: [
          {
            platformId: "bandcamp",
            label: "Bandcamp",
            url: "https://djrush.bandcamp.com"
          },
          { platformId: "website", label: "Website", url: "https://djrush.com" }
        ]
      });
    });

    it("reads a DJ with no city as a null city", async () => {
      const { client } = await newClient();

      const dj = await addDj(client);

      const result = await getDj(client, dj.shortId);
      expect(result?.city).toBeNull();
    });

    it("asks for a city when another DJ with the name has none", async () => {
      const { client } = await newClient();
      const name = newName("DJ Rush");
      await addDj(client, { name });

      const result = await createDj(client, { name, cityId: null, links: {} }, platforms);

      expect(result).toEqual({
        ok: false,
        message: "Check the fields marked below.",
        fieldErrors: {
          cityId: [
            `Add where they're based. Another DJ called ${name} has no city, so a second one needs one.`
          ]
        }
      });
    });

    it("says a DJ with the name is already based in the city", async () => {
      const { client } = await newClient();
      const name = newName("DJ Rush");
      await addDj(client, { name, cityId: BERLIN });

      const result = await createDj(
        client,
        { name, cityId: BERLIN, links: {} },
        platforms
      );

      expect(result).toEqual({
        ok: false,
        message: "Check the fields marked below.",
        fieldErrors: {
          cityId: [
            `There's already a DJ called ${name} based there. Use that DJ, or check the city.`
          ]
        }
      });
    });

    it("returns null for a short ID no DJ has, or one that cannot be a short ID", async () => {
      const anon = createAnonClient() as SupabaseClientT;

      const result = await Promise.all([getDj(anon, "22222222"), getDj(anon, "ab'c")]);

      expect(result).toEqual([null, null]);
    });

    it("returns null for a hidden DJ", async () => {
      const { client } = await newClient();
      const dj = await addDj(client);
      await runSql(`update public.artists set hidden_at = now() where id = '${dj.id}'`);

      const result = await getDj(client, dj.shortId);

      expect(result).toBeNull();
    });
  });

  describe("findSimilarDjs", () => {
    it("returns exact matches in any city, then near matches, with cities and link labels", async () => {
      const { client } = await newClient();
      const suffix = newSuffix();
      const exact = await addDj(client, {
        name: `DJ Rush ${suffix}`,
        cityId: KOLN,
        links: {
          soundcloud: "https://soundcloud.com/djrush",
          instagram: "https://instagram.com/djrush"
        }
      });
      const near = await addDj(client, { name: `Rush ${suffix}` });

      const result = await findSimilarDjs(client, {
        query: `dj rush ${suffix}`,
        cityId: BERLIN,
        platforms
      });

      expect(
        result.filter((dj) => [exact.shortId, near.shortId].includes(dj.shortId))
      ).toEqual([
        {
          shortId: exact.shortId,
          name: `DJ Rush ${suffix}`,
          city: {
            id: KOLN,
            name: "Köln",
            admin1Name: "North Rhine-Westphalia",
            countryCode: "DE"
          },
          linkLabels: ["Instagram", "SoundCloud"],
          isExact: true
        },
        {
          shortId: near.shortId,
          name: `Rush ${suffix}`,
          city: null,
          linkLabels: [],
          isExact: false
        }
      ]);
    });
  });

  describe("getCanEditDj", () => {
    it("lets the creator edit until another user picks the DJ", async () => {
      const { client, userId } = await newClient();
      const dj = await addDj(client);

      const canEditBefore = await getCanEditDj(client, { artistId: dj.id, userId });
      await runSql(
        `update public.artists set used_by_others_at = now() where id = '${dj.id}'`
      );
      const canEditAfter = await getCanEditDj(client, { artistId: dj.id, userId });

      expect([canEditBefore, canEditAfter]).toEqual([true, false]);
    });

    it("refuses another user and lets a moderator edit", async () => {
      const creator = await newClient();
      const other = await newClient();
      const moderator = await newClient("moderator");
      const dj = await addDj(creator.client);

      const result = await Promise.all([
        getCanEditDj(other.client, { artistId: dj.id, userId: other.userId }),
        getCanEditDj(moderator.client, { artistId: dj.id, userId: moderator.userId })
      ]);

      expect(result).toEqual([false, true]);
    });
  });

  describe("updateDj", () => {
    const current: DjInputT = {
      name: "Before",
      cityId: null,
      links: { soundcloud: "https://soundcloud.com/a", website: "https://a.example.com" }
    };

    it("writes every change, one catalog edit each", async () => {
      const { client } = await newClient();
      const before = { ...current, name: newName("Before") };
      const next: DjInputT = {
        name: newName("After"),
        cityId: KOLN,
        links: {
          soundcloud: "https://soundcloud.com/b",
          bandcamp: "https://b.bandcamp.com"
        }
      };
      const dj = await addDj(client, before);

      const result = await updateDj(client, {
        artistId: dj.id,
        input: next,
        changes: getDjChanges(before, next),
        platforms
      });

      const read = await getDj(client, dj.shortId);
      const [edits] = await runSql<{ fields: string[] }>(`
        select array_agg(field order by field) as fields from public.catalog_edits
        where entity_id = '${dj.id}'`);
      expect(result).toEqual({ ok: true, data: undefined });
      expect({
        name: read?.name,
        cityId: read?.city?.id,
        links: read?.links.map((link) => `${link.platformId} ${link.url}`)
      }).toEqual({
        name: next.name,
        cityId: KOLN,
        links: ["soundcloud https://soundcloud.com/b", "bandcamp https://b.bandcamp.com"]
      });
      expect(edits.fields).toEqual([
        "bandcamp",
        "city_id",
        "name",
        "soundcloud",
        "website"
      ]);
    });

    it("asks for a city when a rename takes the name of a DJ with no city", async () => {
      const { client } = await newClient();
      const taken = newName("DJ Rush");
      await addDj(client, { name: taken });
      const before = { ...current, name: newName("Before"), links: {} };
      const next = { ...before, name: taken };
      const dj = await addDj(client, before);

      const result = await updateDj(client, {
        artistId: dj.id,
        input: next,
        changes: getDjChanges(before, next),
        platforms
      });

      expect(result).toEqual({
        ok: false,
        message: "Check the fields marked below.",
        fieldErrors: {
          cityId: [
            `Add where they're based. Another DJ called ${taken} has no city, so a second one needs one.`
          ]
        }
      });
    });

    it("refuses another user and changes nothing", async () => {
      const creator = await newClient();
      const other = await newClient();
      const before = { ...current, name: newName("Before") };
      const next = { ...before, name: newName("After") };
      const dj = await addDj(creator.client, before);

      const result = await updateDj(other.client, {
        artistId: dj.id,
        input: next,
        changes: getDjChanges(before, next),
        platforms
      });

      const read = await getDj(creator.client, dj.shortId);
      expect(result).toEqual({ ok: false, message: NO_LONGER_EDITABLE });
      expect(read?.name).toBe(before.name);
    });

    it("refuses a link change from another user", async () => {
      const creator = await newClient();
      const other = await newClient();
      const before = { ...current, name: newName("Before") };
      const dj = await addDj(creator.client, before);
      const next = { ...before, links: { soundcloud: "https://soundcloud.com/c" } };

      const result = await updateDj(other.client, {
        artistId: dj.id,
        input: next,
        changes: getDjChanges(before, next),
        platforms
      });

      expect(result).toEqual({ ok: false, message: NO_LONGER_EDITABLE });
    });
  });
});
