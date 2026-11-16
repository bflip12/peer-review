import { z } from "zod";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import { getLinkSchema } from "@/features/catalog/schemas/getLinkSchema";
import { getLinkFieldName } from "@/features/catalog/utils/getLinkFieldName";

import type { DjInputT } from "../djs.types";

// The same limit as artists_name_check (migration create_artists).
const NAME_MAX_LENGTH = 100;
// The same rule as artists_name_b2b_check: b2b sets are lineup slots, not DJs.
const B2B_PATTERN = /b2b/i;

/** The message for a name containing "b2b", shared with the database refusal. */
export const B2B_NAME_MESSAGE =
  'Add each DJ on their own. A b2b set is added on the night\'s lineup, with "b2b with".';

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter the DJ's name.")
  // Counted in characters, as Postgres's char_length does, not UTF-16 units.
  .refine(
    (value) => [...value].length <= NAME_MAX_LENGTH,
    `Use ${NAME_MAX_LENGTH} characters or fewer.`
  )
  .refine((value) => !B2B_PATTERN.test(value), B2B_NAME_MESSAGE);

const CITY_MESSAGE = "Pick where they're based from the list, or leave it empty.";

const cityIdSchema = z
  .string()
  .trim()
  .transform((value, context): number | null => {
    if (!value) {
      return null;
    }
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
      context.addIssue({ code: "custom", message: CITY_MESSAGE });
      return z.NEVER;
    }
    return id;
  });

/**
 * The DJ form, for adding and editing. Built from the link platforms DJs offer, so a link
 * field exists for each. The fields are flat, keyed by the input names, so each error
 * lands under its field: `name`, `cityId`, and `link_<platform>`.
 * - The name is refused with "b2b" in it, as the database refuses it.
 * - The city is optional; empty means not known. Whether a city is required (another DJ
 *   with the name has none) is left to the database's unique index, which the action
 *   turns into a message under the field (`getDjWriteFailure`).
 */
export const getDjSchema = (
  platforms: LinkPlatformT[]
): z.ZodType<DjInputT, Record<string, unknown>> => {
  const shape: Record<string, z.ZodType> = { name: nameSchema, cityId: cityIdSchema };
  for (const platform of platforms) {
    shape[getLinkFieldName(platform.id)] = getLinkSchema(platform);
  }
  return z.object(shape).transform((values): DjInputT => {
    const links: Record<string, string> = {};
    for (const platform of platforms) {
      const url = values[getLinkFieldName(platform.id)];
      if (typeof url === "string") {
        links[platform.id] = url;
      }
    }
    return {
      name: values.name as string,
      cityId: values.cityId as number | null,
      links
    };
  });
};
