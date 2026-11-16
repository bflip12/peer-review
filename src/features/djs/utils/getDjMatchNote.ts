import { getCityLabel } from "@/features/catalog/utils/getCityLabel";

import type { DjMatchT } from "../djs.types";

/**
 * The line under a DJ in the duplicate check, so the user can tell DJs with one name
 * apart: where they're based, then the sites they have links on, joined with " · ".
 * "Chicago, Illinois, US · SoundCloud, Instagram". A DJ with no city says so, since
 * that is what makes a second DJ with the name need one.
 */
export const getDjMatchNote = (match: Pick<DjMatchT, "city" | "linkLabels">): string => {
  const city = match.city
    ? [getCityLabel(match.city).name, getCityLabel(match.city).region]
        .filter(Boolean)
        .join(", ")
    : "No city yet";
  const sites =
    match.linkLabels.length > 0 ? match.linkLabels.join(", ") : "No links yet";
  return `${city} · ${sites}`;
};
