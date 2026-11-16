import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import { getLinkErrorMessage } from "@/features/catalog/utils/getLinkErrorMessage";
import { getLinkFieldName } from "@/features/catalog/utils/getLinkFieldName";
import type { ActionResultT } from "@/lib/actions/actionResult.types";

import type { DjInputT } from "../djs.types";
import { B2B_NAME_MESSAGE } from "../schemas/djSchema";

// SQLSTATEs the DJ writes raise (migrations create_creations_and_catalog_edits,
// create_venues, and create_artists), with the kind or the platform ID in the detail.
const CREATION_CAP = "PR001";
const LINK_HOST = "PR002";
const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
// The index and check the messages below are for (migration create_artists).
const NAME_CITY_INDEX = "artists_name_city_id_key";
const B2B_CHECK = "artists_name_b2b_check";
// The daily DJ cap in check_creation_cap (ADR 0011).
const DJ_CAP = 50;

const CHECK_FIELDS = "Check the fields marked below.";

/** The fields of a Postgres error this function reads. */
export type DatabaseErrorT = { code?: string; details?: string | null; message?: string };

/**
 * The form message for a refusal the DJ form expects, or null for any other error, which
 * the caller throws:
 * - the daily cap: "You've added 50 DJs today. You can add more tomorrow.",
 * - a taken name and city, under the city field. With no city, another DJ with the name
 *   has none either, so this one needs a city (ADR 0011). With a city, a DJ with the name
 *   is already based there,
 * - "b2b" in the name, under the name field,
 * - a link the host check refused, under its field,
 * - a second link on one platform (a write in another tab): a message to reload.
 * The form checks names and links before sending, so those two come back only when the
 * form and the database disagree.
 */
export const getDjWriteFailure = (
  error: DatabaseErrorT,
  { input, platforms }: { input: DjInputT; platforms: LinkPlatformT[] }
): Extract<ActionResultT, { ok: false }> | null => {
  const message = error.message ?? "";
  if (error.code === CREATION_CAP) {
    return {
      ok: false,
      message: `You've added ${DJ_CAP} DJs today. You can add more tomorrow.`
    };
  }
  if (error.code === UNIQUE_VIOLATION && message.includes(NAME_CITY_INDEX)) {
    const cityError =
      input.cityId === null
        ? `Add where they're based. Another DJ called ${input.name} has no city, so a second one needs one.`
        : `There's already a DJ called ${input.name} based there. Use that DJ, or check the city.`;
    return { ok: false, message: CHECK_FIELDS, fieldErrors: { cityId: [cityError] } };
  }
  if (error.code === CHECK_VIOLATION && message.includes(B2B_CHECK)) {
    return {
      ok: false,
      message: CHECK_FIELDS,
      fieldErrors: { name: [B2B_NAME_MESSAGE] }
    };
  }
  if (error.code === LINK_HOST) {
    const platform = platforms.find((candidate) => candidate.id === error.details);
    if (!platform) {
      return null;
    }
    return {
      ok: false,
      message: CHECK_FIELDS,
      fieldErrors: { [getLinkFieldName(platform.id)]: [getLinkErrorMessage(platform)] }
    };
  }
  if (error.code === UNIQUE_VIOLATION) {
    return {
      ok: false,
      message:
        "This DJ changed while you were editing them. Reload the page and try again."
    };
  }
  return null;
};
