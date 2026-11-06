import { z } from "zod";

import { getLinkSchema } from "@/features/catalog/schemas/getLinkSchema";
import { getLinkFieldName } from "@/features/catalog/utils/getLinkFieldName";

import type { VenueFormOptionsT, VenueInputT } from "../venues.types";

// The same limit as venues_name_check (migration create_venues).
const NAME_MAX_LENGTH = 100;

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter the venue's name.")
  // Counted in characters, as Postgres's char_length does, not UTF-16 units.
  .refine(
    (value) => [...value].length <= NAME_MAX_LENGTH,
    `Use ${NAME_MAX_LENGTH} characters or fewer.`
  );

const cityIdSchema = z.coerce
  .number({ error: "Pick the venue's city from the list." })
  .int("Pick the venue's city from the list.")
  .positive("Pick the venue's city from the list.");

/**
 * The venue form, for adding and editing. Built from the form's options, so a link field
 * exists for each platform venues offer and a sound system ID outside the list is refused.
 * The fields are flat, keyed by the input names, so each error lands under its field:
 * `name`, `cityId`, `link_<platform>` (`getLinkFieldName`), and `soundSystemIds`.
 * Links are checked with the same rules as the database's host check.
 */
export const getVenueSchema = ({
  platforms,
  soundSystems
}: VenueFormOptionsT): z.ZodType<VenueInputT, Record<string, unknown>> => {
  const soundSystemIds = new Set(soundSystems.map((soundSystem) => soundSystem.id));
  const shape: Record<string, z.ZodType> = {
    name: nameSchema,
    cityId: cityIdSchema,
    soundSystemIds: z
      .array(z.string())
      .refine((ids) => ids.every((id) => soundSystemIds.has(id)), {
        error: "Pick sound systems from the list."
      })
      .transform((ids) => [...new Set(ids)])
  };
  for (const platform of platforms) {
    shape[getLinkFieldName(platform.id)] = getLinkSchema(platform);
  }
  return z.object(shape).transform((values): VenueInputT => {
    const links: Record<string, string> = {};
    for (const platform of platforms) {
      const url = values[getLinkFieldName(platform.id)];
      if (typeof url === "string") {
        links[platform.id] = url;
      }
    }
    return {
      name: values.name as string,
      cityId: values.cityId as number,
      links,
      soundSystemIds: values.soundSystemIds as string[]
    };
  });
};
