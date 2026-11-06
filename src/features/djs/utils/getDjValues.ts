import type { DjInputT, DjT } from "../djs.types";

/** A DJ's editable values, in the shape the form sends, for `getDjChanges`. */
export const getDjValues = (dj: DjT): DjInputT => ({
  name: dj.name,
  cityId: dj.city?.id ?? null,
  links: Object.fromEntries(dj.links.map((link) => [link.platformId, link.url]))
});
