import { describe, expect, it } from "vitest";

import { parseColorTokens } from "./parseColorTokens";

describe("parseColorTokens", () => {
  it("returns an empty object for empty CSS", () => {
    const result = parseColorTokens("");

    expect(result).toEqual({});
  });

  it("reads one color token", () => {
    const result = parseColorTokens(":root { --color-text: #191816; }");

    expect(result).toEqual({ "--color-text": "#191816" });
  });

  it("reads tokens across lines and ignores spacing around the colon", () => {
    const css = ":root {\n  --color-page:#F2F0EB;\n  --color-text :  #191816 ;\n}";

    const result = parseColorTokens(css);

    expect(result).toEqual({ "--color-page": "#F2F0EB", "--color-text": "#191816" });
  });

  it("keeps the last value when a token is declared twice", () => {
    const css = "--color-text: #000000; --color-text: #191816;";

    const result = parseColorTokens(css);

    expect(result).toEqual({ "--color-text": "#191816" });
  });

  it("skips tokens that are not colors or that point at another variable", () => {
    const css = [
      "--color-text: #191816;",
      "--color-button-text: var(--color-page);",
      "--space-2: 0.5rem;",
      "--color-short: #FFF;"
    ].join("\n");

    const result = parseColorTokens(css);

    expect(result).toEqual({ "--color-text": "#191816" });
  });

  it("ignores color tokens inside comments", () => {
    const css = "/* --color-old: #123456; */ --color-text: #191816;";

    const result = parseColorTokens(css);

    expect(result).toEqual({ "--color-text": "#191816" });
  });
});
