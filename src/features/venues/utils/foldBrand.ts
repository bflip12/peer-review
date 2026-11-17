// Combining marks left after splitting accented letters apart.
const COMBINING_MARKS = /\p{M}+/gu;
// Spaces and punctuation, which the duplicate check ignores. Symbols such as "&" count.
const SPACES_AND_PUNCTUATION = /[\s\p{P}\p{S}]+/gu;

/**
 * A brand name as the duplicate check compares it: lowercase, without accents, spaces, or
 * punctuation, so "Funktion One" and "funktion-one" are both "funktionone". Mirrors
 * `private.fold_brand` in the database (ADR 0026), which decides; this copy only picks
 * which row the search field offers.
 */
export const foldBrand = (name: string): string =>
  name
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(SPACES_AND_PUNCTUATION, "");
