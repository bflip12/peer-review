import { z } from "zod";

// Auth's sign-in codes are UUIDs (checked against the local stack, 2026-10-30).
const signInCodeSchema = z.uuid();

/**
 * The code from `/auth/callback`'s query, or null when it is missing, malformed, or
 * repeated. Google answers a cancelled sign-in with `error` and no code.
 */
export const getSignInCodeParam = (searchParams: URLSearchParams): string | null => {
  const codes = searchParams.getAll("code");
  if (codes.length !== 1) {
    return null;
  }
  const parsed = signInCodeSchema.safeParse(codes[0]);
  return parsed.success ? parsed.data : null;
};
