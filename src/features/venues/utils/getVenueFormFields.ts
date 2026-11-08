import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import { getLinkFormFields } from "@/features/catalog/utils/getLinkFormFields";

// FormData.get returns a File for a file input. The venue form has none, so a File is
// treated as an empty field rather than trusted.
const toText = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value : "";

/**
 * The venue form's fields from its FormData, as `getVenueSchema` reads them: text fields
 * as strings (empty when missing), a link field per platform, and every checked sound
 * system. Reads only the fields the schema knows, so extra fields sent to the action are
 * ignored.
 */
export const getVenueFormFields = (
  formData: FormData,
  platforms: LinkPlatformT[]
): Record<string, unknown> => {
  return {
    name: toText(formData.get("name")),
    cityId: toText(formData.get("cityId")),
    soundSystemIds: formData.getAll("soundSystemIds").map(toText),
    ...getLinkFormFields(formData, platforms)
  };
};
