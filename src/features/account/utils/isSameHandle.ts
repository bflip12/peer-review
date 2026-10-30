/**
 * Whether a typed handle is the user's handle. Ignores case, as the unique index on
 * handles does (`lower(handle)`), so "DJ_Rush" confirms for @dj_rush.
 */
export const isSameHandle = (typed: string, handle: string): boolean =>
  typed.toLowerCase() === handle.toLowerCase();
