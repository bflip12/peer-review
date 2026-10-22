// @vitest-environment node
import { describe, expect, it } from "vitest";

import { getScreenshotTargets } from "./getScreenshotTargets";

const mockBaseUrl = "http://localhost:3000";

describe("getScreenshotTargets", () => {
  it("returns the URL and file name for a single route", () => {
    const result = getScreenshotTargets(["/"], mockBaseUrl);

    expect(result).toEqual([{ route: "/", url: "http://localhost:3000/", name: "home" }]);
  });

  it("keeps the order of several routes", () => {
    const result = getScreenshotTargets(["/venues", "/"], mockBaseUrl);

    expect(result).toEqual([
      { route: "/venues", url: "http://localhost:3000/venues", name: "venues" },
      { route: "/", url: "http://localhost:3000/", name: "home" }
    ]);
  });

  it("captures a repeated route once, including one with surrounding whitespace", () => {
    const result = getScreenshotTargets(["/", " / ", "/"], mockBaseUrl);

    expect(result).toEqual([{ route: "/", url: "http://localhost:3000/", name: "home" }]);
  });

  it("refuses an empty list or a list of blank routes", () => {
    const result = [[], ["", "  "]].map(
      (routes) => () => getScreenshotTargets(routes, mockBaseUrl)
    );

    result.forEach((run) =>
      expect(run).toThrow("Give at least one route, for example: npm run screenshot -- /")
    );
  });

  it("refuses a route without a leading slash, and a full URL", () => {
    const result = ["venues", "http://localhost:3000/"].map(
      (route) => () => getScreenshotTargets([route], mockBaseUrl)
    );

    expect(result[0]).toThrow('Route "venues" must start with /.');
    expect(result[1]).toThrow('Route "http://localhost:3000/" must start with /.');
  });

  it("refuses two different routes that would save to the same file", () => {
    const run = (): unknown => getScreenshotTargets(["/a/b", "/a-b"], mockBaseUrl);

    expect(run).toThrow("Routes /a/b and /a-b would both save as a-b.");
  });
});
