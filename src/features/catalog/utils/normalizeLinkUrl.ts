// A scheme and "//" at the start, such as "https://". Checking for the slashes too means
// "instagram.com:443/name" counts as having no scheme.
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * A pasted link as it is saved: trimmed, with `https://` added when no scheme was typed,
 * so "instagram.com/tresorberlin" works. Blank input is null, meaning no link. A link
 * with another scheme is kept as typed, so the host check refuses it.
 */
export const normalizeLinkUrl = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  return SCHEME_PATTERN.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/\//, "")}`;
};
