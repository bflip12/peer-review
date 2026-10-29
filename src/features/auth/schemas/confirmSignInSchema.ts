import { z } from "zod";

// Supabase's token hashes are hex today. Letters, digits, `-`, and `_` allow for a change
// of encoding without letting anything else reach the Auth API. 256 is well above any.
const TOKEN_HASH_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

/**
 * The query of a sign-in link, `/auth/confirm?token_hash=...&type=email`. `email` is the
 * one type the email templates in `supabase/templates/` send, for new and returning users.
 */
export const confirmSignInSchema = z.object({
  tokenHash: z.string().regex(TOKEN_HASH_PATTERN),
  type: z.literal("email")
});
