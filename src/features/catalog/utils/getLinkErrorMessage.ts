import type { LinkPlatformT } from "../catalog.types";

// Labels read with "an": "an Instagram link".
const VOWEL_PATTERN = /^[aeiou]/i;

/**
 * The error under a link field whose URL the platform refuses, built from the platform's
 * label and first listed host: "Paste an Instagram link, such as instagram.com/name."
 * A wildcard host shows its subdomain form, "name.bandcamp.com", and Bandcamp adds where
 * a custom domain goes, since the field refuses one. A platform with no host list (the
 * website) asks for a full link.
 */
export const getLinkErrorMessage = (platform: LinkPlatformT): string => {
  const [firstHost] = platform.allowedHosts;
  if (!firstHost) {
    return "Paste a full link, such as https://example.com.";
  }
  const article = VOWEL_PATTERN.test(platform.label) ? "an" : "a";
  const example = firstHost.startsWith("*.")
    ? `name${firstHost.slice(1)}`
    : `${firstHost.replace(/^www\./, "")}/name`;
  const message = `Paste ${article} ${platform.label} link, such as ${example}.`;
  if (platform.id === "bandcamp") {
    return `${message} Using your own domain? Paste your ${example} address, or add it as your website.`;
  }
  return message;
};
