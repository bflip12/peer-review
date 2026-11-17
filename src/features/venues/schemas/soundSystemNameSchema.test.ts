import { describe, expect, it } from "vitest";
import { z } from "zod";

import { soundSystemNameSchema } from "./soundSystemNameSchema";

const getErrors = (name: string): string[] => {
  const result = soundSystemNameSchema.safeParse(name);
  return result.success ? [] : z.flattenError(result.error).formErrors;
};

describe("soundSystemNameSchema", () => {
  it("trims the name", () => {
    const result = soundSystemNameSchema.parse("  Pioneer Pro Audio ");

    expect(result).toBe("Pioneer Pro Audio");
  });

  it("refuses an empty name and punctuation only", () => {
    const result = [getErrors(""), getErrors("  -- ")];

    expect(result).toEqual([["Type the brand's name."], ["Type the brand's name."]]);
  });

  it("refuses over 50 characters, counting characters", () => {
    const result = [getErrors("ö".repeat(50)), getErrors("a".repeat(51))];

    expect(result).toEqual([[], ["Use 50 characters or fewer."]]);
  });
});
