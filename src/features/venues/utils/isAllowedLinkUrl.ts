import type { LinkPlatformT } from "../venues.types";

// The same limits as links_url_check and the host check trigger (migration create_venues).
const URL_PATTERN = /^https?:\/\/\S+$/;
const AUTHORITY_PATTERN = /^https?:\/\/([^/?#]*)/;
const HOST_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const URL_MAX_LENGTH = 500;

/**
 * Whether the database will accept a URL for a platform. Mirrors the host check trigger,
 * so the form refuses what the database would:
 * - an http or https URL with no spaces, at most 500 characters,
 * - no user name before the host ("https://instagram.com@example.com"),
 * - a host (lowercased, without the port or a trailing dot) in the platform's list, where
 *   "*.bandcamp.com" matches any subdomain but not bandcamp.com itself. An empty list
 *   accepts any host with a dot in it.
 */
export const isAllowedLinkUrl = (
  platform: Pick<LinkPlatformT, "allowedHosts">,
  url: string
): boolean => {
  if (!URL_PATTERN.test(url) || [...url].length > URL_MAX_LENGTH) {
    return false;
  }
  const authority = AUTHORITY_PATTERN.exec(url)?.[1] ?? "";
  if (authority.includes("@")) {
    return false;
  }
  const host = authority
    .replace(/:[0-9]*$/, "")
    .toLowerCase()
    .replace(/\.+$/, "");
  if (!HOST_PATTERN.test(host)) {
    return false;
  }
  if (platform.allowedHosts.length === 0) {
    return true;
  }
  return platform.allowedHosts.some((allowed) =>
    allowed.startsWith("*.") ? host.endsWith(allowed.slice(1)) : host === allowed
  );
};
