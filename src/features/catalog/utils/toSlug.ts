// Combining marks left after splitting accented letters apart: "é" becomes "e" and "́".
const COMBINING_MARKS = /\p{M}+/gu;
const NOT_LETTER_OR_DIGIT = /[^\p{L}\p{N}]+/gu;

/**
 * The readable part of a URL built from names: lowercase, accents dropped, and every run
 * of other characters turned into one hyphen. Letters from other scripts are kept, so a
 * name in Cyrillic or Japanese still gives a slug. Never stored: the short ID finds the
 * row, and a slug that no longer matches redirects (`docs/DATA_MODEL.md`, URLs).
 */
export const toSlug = (parts: string[]): string =>
  parts
    .join(" ")
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(NOT_LETTER_OR_DIGIT, "-")
    .replace(/^-+|-+$/g, "");
