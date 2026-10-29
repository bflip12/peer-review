import { z } from "zod";

// The same rules as the checks on public.profiles (migration create_profiles).
const HANDLE_PATTERN = /^[A-Za-z0-9_.]{2,30}$/;
const DISPLAY_NAME_MAX_LENGTH = 50;

/** The profile form: a required handle and an optional display name. */
export const profileSchema = z.object({
  handle: z
    .string()
    .trim()
    .regex(HANDLE_PATTERN, "Use 2 to 30 letters, numbers, underscores (_), or dots (.)."),
  displayName: z
    .string()
    .trim()
    // Counted in characters, as Postgres's char_length does, not UTF-16 units.
    .refine(
      (value) => [...value].length <= DISPLAY_NAME_MAX_LENGTH,
      `Use ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`
    )
    .transform((value) => value || null)
});
