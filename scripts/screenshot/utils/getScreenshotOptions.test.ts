import { describe, expect, it } from "vitest";

import { getScreenshotOptions } from "./getScreenshotOptions.ts";

describe("getScreenshotOptions", () => {
  it("returns the routes, signed out, when no flag is given", () => {
    const result = getScreenshotOptions(["/", "/sign-in"]);

    expect(result).toEqual({ signedInAs: null, routes: ["/", "/sign-in"] });
  });

  it("reads --as=user and --as=new wherever they appear", () => {
    const result = [
      getScreenshotOptions(["--as=user", "/"]),
      getScreenshotOptions(["/welcome", "--as=new"])
    ];

    expect(result).toEqual([
      { signedInAs: "user", routes: ["/"] },
      { signedInAs: "new", routes: ["/welcome"] }
    ]);
  });

  it("returns no routes when only the flag is given, for the route check to report", () => {
    const result = getScreenshotOptions(["--as=user"]);

    expect(result).toEqual({ signedInAs: "user", routes: [] });
  });

  it("refuses another --as value, naming the ones it accepts", () => {
    const result = (): unknown => getScreenshotOptions(["--as=admin", "/"]);

    expect(result).toThrow('Unknown --as value "admin". Use --as=user or --as=new.');
  });

  it("refuses --as given twice", () => {
    const result = (): unknown => getScreenshotOptions(["--as=user", "--as=new", "/"]);

    expect(result).toThrow("Give --as once.");
  });

  it("refuses other flags", () => {
    const result = (): unknown => getScreenshotOptions(["--signed-in", "/"]);

    expect(result).toThrow('Unknown option "--signed-in". The only option is --as.');
  });
});
