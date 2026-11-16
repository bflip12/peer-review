import { describe, expect, it } from "vitest";

import { getNextOptionIndex } from "./getNextOptionIndex";

describe("getNextOptionIndex", () => {
  it("returns -1 for an empty list", () => {
    const result = getNextOptionIndex(-1, { count: 0, key: "ArrowDown" });

    expect(result).toBe(-1);
  });

  it("goes down from none to the first option", () => {
    const result = getNextOptionIndex(-1, { count: 3, key: "ArrowDown" });

    expect(result).toBe(0);
  });

  it("goes up from none to the last option", () => {
    const result = getNextOptionIndex(-1, { count: 3, key: "ArrowUp" });

    expect(result).toBe(2);
  });

  it("moves one step down and up", () => {
    const result = [
      getNextOptionIndex(0, { count: 3, key: "ArrowDown" }),
      getNextOptionIndex(2, { count: 3, key: "ArrowUp" })
    ];

    expect(result).toEqual([1, 1]);
  });

  it("wraps at both ends", () => {
    const result = [
      getNextOptionIndex(2, { count: 3, key: "ArrowDown" }),
      getNextOptionIndex(0, { count: 3, key: "ArrowUp" })
    ];

    expect(result).toEqual([0, 2]);
  });

  it("starts over when the list got shorter than the highlight", () => {
    const result = [
      getNextOptionIndex(5, { count: 2, key: "ArrowDown" }),
      getNextOptionIndex(5, { count: 2, key: "ArrowUp" })
    ];

    expect(result).toEqual([0, 1]);
  });

  it("handles a single option", () => {
    const result = [
      getNextOptionIndex(0, { count: 1, key: "ArrowDown" }),
      getNextOptionIndex(0, { count: 1, key: "ArrowUp" })
    ];

    expect(result).toEqual([0, 0]);
  });
});
