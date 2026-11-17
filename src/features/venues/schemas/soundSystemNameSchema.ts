import { z } from "zod";

import { foldBrand } from "../utils/foldBrand";

// The same limit as sound_systems_name_length_check (migration user_added_sound_systems).
const NAME_MAX_LENGTH = 50;

/**
 * A brand name a user adds: trimmed, at most 50 characters, and not only spaces and
 * punctuation, the same rules as the checks on `sound_systems`.
 */
export const soundSystemNameSchema = z
  .string()
  .trim()
  .refine((name) => foldBrand(name) !== "", "Type the brand's name.")
  // Counted in characters, as Postgres's char_length does, not UTF-16 units.
  .refine(
    (name) => [...name].length <= NAME_MAX_LENGTH,
    `Use ${NAME_MAX_LENGTH} characters or fewer.`
  );
