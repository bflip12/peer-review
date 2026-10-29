const COMMENT = /\/\*[\s\S]*?\*\//g;
const COLOR_TOKEN = /(--color-[\w-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi;

/**
 * Reads the `--color-*` custom properties set to a six-digit hex value from a CSS file.
 *
 * Tokens that point at another variable (`var(--color-page)`) are left out: the contrast
 * test checks the token they point at. A token declared twice keeps its last value, as
 * the browser would within one rule.
 */
export const parseColorTokens = (css: string): Record<string, string> => {
  const withoutComments = css.replace(COMMENT, "");

  return Object.fromEntries(
    Array.from(withoutComments.matchAll(COLOR_TOKEN), ([, name, value]) => [name, value])
  );
};
