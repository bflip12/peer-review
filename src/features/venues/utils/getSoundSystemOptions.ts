import type { SoundSystemT } from "../venues.types";
import { foldBrand } from "./foldBrand";

/**
 * A row in the sound system field's list.
 *
 * - "brand": a listed brand, which picking adds as a tag
 * - "add": the typed name, which picking adds to the shared list first (ADR 0026)
 */
export type SoundSystemOptionT =
  { kind: "brand"; brand: SoundSystemT } | { kind: "add"; name: string };

/**
 * The rows the sound system field shows for a search: the brands found, minus those the
 * venue already has, then "Add …" for the typed name. "Add …" is left out when the name
 * is blank, only punctuation, or folds to a brand found or already picked, since the
 * database would return that brand anyway.
 */
export const getSoundSystemOptions = ({
  results,
  selected,
  query
}: {
  results: SoundSystemT[];
  selected: SoundSystemT[];
  query: string;
}): SoundSystemOptionT[] => {
  const selectedIds = new Set(selected.map((brand) => brand.id));
  const options: SoundSystemOptionT[] = results
    .filter((brand) => !selectedIds.has(brand.id))
    .map((brand) => ({ kind: "brand", brand }));
  const name = query.trim();
  const folded = foldBrand(name);
  const isListed = [...results, ...selected].some(
    (brand) => foldBrand(brand.name) === folded
  );
  if (folded && !isListed) {
    options.push({ kind: "add", name });
  }
  return options;
};
