import { describe, expect, it } from "vitest";

import { assertLocalBaseUrl } from "./assertLocalBaseUrl.ts";

describe("assertLocalBaseUrl", () => {
  it("accepts localhost and 127.0.0.1 on any port", () => {
    const result = ["http://localhost:3000", "http://127.0.0.1:4000/"].map((url) => {
      assertLocalBaseUrl(url);
      return url;
    });

    expect(result).toHaveLength(2);
  });

  it("refuses any other host, since signing in uses the local stack's service key", () => {
    const result = (): void => {
      assertLocalBaseUrl("https://www.peerreview.club");
    };

    expect(result).toThrow(
      "--as signs in on the local Supabase stack, so it only works against localhost. " +
        "The base URL is https://www.peerreview.club."
    );
  });
});
