import { z } from "zod";

/** The delete account form: the user types their handle to confirm, with or without @. */
export const deleteAccountSchema = z.object({
  handle: z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, ""))
    .refine((value) => value.length > 0, "Type your handle.")
});
