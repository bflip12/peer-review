import type { ActionResultT } from "@/lib/actions/actionResult.types";

import type { LinkPlatformT } from "../venues.types";
import { getLinkErrorMessage } from "./getLinkErrorMessage";
import { getLinkFieldName } from "./getLinkFieldName";

// SQLSTATEs the venue triggers raise (migrations create_creations_and_catalog_edits and
// create_venues), with the kind or the platform ID in the detail.
const CREATION_CAP = "PR001";
const LINK_HOST = "PR002";
// Postgres "unique violation": a second link on one platform, after a write in another tab.
const UNIQUE_VIOLATION = "23505";
// The daily venue cap in check_creation_cap (ADR 0011).
const VENUE_CAP = 10;

/** The fields of a Postgres error this function reads. */
export type DatabaseErrorT = { code?: string; details?: string | null };

/**
 * The form message for a refusal the venue form expects, or null for any other error,
 * which the caller throws:
 * - the daily cap: "You've added 10 venues today. You can add more tomorrow.",
 * - a link the host check refused: the link's own message, under its field,
 * - a second link on one platform: a message to reload the page.
 * The form checks links before sending, so the host check refuses one only when the form
 * and the database disagree.
 */
export const getVenueWriteFailure = (
  error: DatabaseErrorT,
  platforms: LinkPlatformT[]
): Extract<ActionResultT, { ok: false }> | null => {
  if (error.code === CREATION_CAP) {
    return {
      ok: false,
      message: `You've added ${VENUE_CAP} venues today. You can add more tomorrow.`
    };
  }
  if (error.code === LINK_HOST) {
    const platform = platforms.find((candidate) => candidate.id === error.details);
    if (!platform) {
      return null;
    }
    return {
      ok: false,
      message: "Check the fields marked below.",
      fieldErrors: { [getLinkFieldName(platform.id)]: [getLinkErrorMessage(platform)] }
    };
  }
  if (error.code === UNIQUE_VIOLATION) {
    return {
      ok: false,
      message:
        "This venue changed while you were editing it. Reload the page and try again."
    };
  }
  return null;
};
