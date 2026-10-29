import { describe, expect, it } from "vitest";

// Data functions start with `import "server-only"` and import shared code through `@/`.
// Their *.db.test.ts files run under this config, so both must resolve here.
describe("database test config", () => {
  it("loads server-only modules, which throw outside a server build", async () => {
    const result = import("server-only");

    await expect(result).resolves.toBeDefined();
  });

  it("resolves the @/ path alias to src/", async () => {
    const { getContrastRatio } = await import("@/styles/utils/getContrastRatio");

    const result = getContrastRatio("#000000", "#ffffff");

    expect(result).toBe(21);
  });
});
