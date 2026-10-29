import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getContrastRatio } from "./utils/getContrastRatio";
import { parseColorTokens } from "./utils/parseColorTokens";

// WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for the borders of form controls (1.4.11).
const TEXT_MINIMUM = 4.5;
const CONTROL_MINIMUM = 3;

/** Each foreground the app draws on each background it can sit on. */
const TEXT_PAIRS = [
  ["--color-text", "--color-page"],
  ["--color-text", "--color-field"],
  ["--color-text-muted", "--color-page"],
  ["--color-text-muted", "--color-field"],
  ["--color-danger", "--color-page"],
  ["--color-danger", "--color-field"],
  // Button text: --color-button-text is --color-page on a --color-text fill.
  ["--color-page", "--color-text"]
] as const;

const CONTROL_PAIRS = [
  ["--color-control-border", "--color-page"],
  ["--color-control-border", "--color-field"]
] as const;

const tokens = parseColorTokens(readFileSync(join(__dirname, "tokens.css"), "utf8"));

const getToken = (name: string): string => {
  const value = tokens[name];
  if (!value) {
    throw new Error(`${name} is missing from tokens.css or is not a six-digit hex color`);
  }
  return value;
};

describe("tokens.css", () => {
  describe("text contrast", () => {
    it.each(TEXT_PAIRS)("%s on %s reaches 4.5:1", (foreground, background) => {
      const result = getContrastRatio(getToken(foreground), getToken(background));

      expect(result).toBeGreaterThanOrEqual(TEXT_MINIMUM);
    });
  });

  describe("form control contrast", () => {
    it.each(CONTROL_PAIRS)("%s on %s reaches 3:1", (foreground, background) => {
      const result = getContrastRatio(getToken(foreground), getToken(background));

      expect(result).toBeGreaterThanOrEqual(CONTROL_MINIMUM);
    });
  });
});
