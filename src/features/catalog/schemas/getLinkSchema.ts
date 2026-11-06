import { z } from "zod";

import type { LinkPlatformT } from "../catalog.types";
import { getLinkErrorMessage } from "../utils/getLinkErrorMessage";
import { isAllowedLinkUrl } from "../utils/isAllowedLinkUrl";
import { normalizeLinkUrl } from "../utils/normalizeLinkUrl";

/**
 * One link field on a venue, DJ, or collective form. Blank is null (no link); anything
 * else is normalized (`https://` added) and checked with the same rules as the database's
 * host check, with the platform's own message when it is refused.
 */
export const getLinkSchema = (
  platform: LinkPlatformT
): z.ZodType<string | null, string> =>
  z
    .string()
    .transform(normalizeLinkUrl)
    .refine((url) => url === null || isAllowedLinkUrl(platform, url), {
      error: getLinkErrorMessage(platform)
    });
