import type { LinkPlatformT } from "../catalog.types";
import { getLinkFieldName } from "./getLinkFieldName";

/**
 * The link fields of a venue, DJ, or collective form from its FormData, one per platform,
 * keyed by input name (`link_instagram`). A missing field, or a File (the forms have no
 * file input), reads as an empty string, so the schema sees no link.
 */
export const getLinkFormFields = (
  formData: FormData,
  platforms: LinkPlatformT[]
): Record<string, string> => {
  const fields: Record<string, string> = {};
  for (const platform of platforms) {
    const fieldName = getLinkFieldName(platform.id);
    const value = formData.get(fieldName);
    fields[fieldName] = typeof value === "string" ? value : "";
  }
  return fields;
};
