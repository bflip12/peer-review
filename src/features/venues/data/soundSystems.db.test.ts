import { afterAll, describe, expect, it } from "vitest";

import type { SupabaseClientT } from "@/lib/supabase/supabase.types";

import { runSql } from "../../../../supabase/tests/utils/testClients";
import { createUserPool, newSuffix } from "../../../../supabase/tests/utils/venues";
import { createSoundSystem } from "./createSoundSystem";
import { searchSoundSystems } from "./searchSoundSystems";

describe("sound system data functions", () => {
  const { newUser, deleteAll } = createUserPool();

  const newClient = async (): Promise<SupabaseClientT> =>
    (await newUser()).client as SupabaseClientT;

  afterAll(async () => {
    await deleteAll();
  });

  describe("createSoundSystem", () => {
    it("adds a brand and returns it", async () => {
      const client = await newClient();
      const name = `Brand ${newSuffix()}`;

      const result = await createSoundSystem(client, name);

      expect(result.ok && result.data.name).toBe(name);
    });

    it("returns the listed brand for a near-identical name", async () => {
      const client = await newClient();

      const result = await createSoundSystem(client, "funktion one");

      expect(result).toEqual({
        ok: true,
        data: { id: "funktion_one", name: "Funktion-One" }
      });
    });

    it("returns the cap message at the daily cap", async () => {
      const client = await newClient();
      for (let index = 0; index < 10; index += 1) {
        await createSoundSystem(client, `Brand ${newSuffix()}`);
      }

      const result = await createSoundSystem(client, `Brand ${newSuffix()}`);

      expect(result).toEqual({
        ok: false,
        message: "You've added 10 sound systems today. You can add more tomorrow."
      });
    });
  });

  describe("searchSoundSystems", () => {
    it("finds a brand starting with the query first", async () => {
      const client = await newClient();

      const result = await searchSoundSystems(client, "funk");

      expect(result[0]).toEqual({ id: "funktion_one", name: "Funktion-One" });
    });

    it("finds a brand a user added", async () => {
      const client = await newClient();
      const name = `Brand ${newSuffix()}`;
      const added = await createSoundSystem(client, name);

      const result = await searchSoundSystems(client, name);

      const [row] = await runSql<{ id: string }>(
        `select id from public.sound_systems where name = '${name}'`
      );
      expect(added.ok).toBe(true);
      expect(result[0]).toEqual({ id: row.id, name });
    });
  });
});
