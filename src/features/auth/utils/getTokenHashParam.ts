import { confirmSignInSchema } from "../schemas/confirmSignInSchema";

/**
 * The token hash from a sign-in link's query, or null when the link is cut off or not a
 * sign-in link. Repeated parameters count as malformed.
 */
export const getTokenHashParam = (
  searchParams: Record<string, string | string[] | undefined>
): string | null => {
  const parsed = confirmSignInSchema.safeParse({
    tokenHash: searchParams.token_hash,
    type: searchParams.type
  });
  return parsed.success ? parsed.data.tokenHash : null;
};
