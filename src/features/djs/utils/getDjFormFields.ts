import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import { getLinkFormFields } from "@/features/catalog/utils/getLinkFormFields";

// FormData.get returns a File for a file input. The DJ form has none, so a File is
// treated as an empty field rather than trusted.
const toText = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value : "";

/**
 * The DJ form's fields from its FormData, as `getDjSchema` reads them: the name, the
 * city ID (empty when no city is picked), and a link field per platform. Extra fields
 * sent to the action are ignored.
 */
export const getDjFormFields = (
  formData: FormData,
  platforms: LinkPlatformT[]
): Record<string, string> => ({
  name: toText(formData.get("name")),
  cityId: toText(formData.get("cityId")),
  ...getLinkFormFields(formData, platforms)
});
