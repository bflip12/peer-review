import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SimilarDjs } from "./SimilarDjs";

describe("SimilarDjs", () => {
  it("links each DJ to their page in a new tab, with their city and link sites", () => {
    render(
      <SimilarDjs
        djs={[
          {
            shortId: "j2k3m4n5",
            name: "Rush",
            city: null,
            linkLabels: ["Bandcamp"],
            isExact: false
          }
        ]}
      />
    );

    const link = screen.getByRole("link", { name: "Rush" });
    expect(link).toHaveAttribute("href", "/djs/j2k3m4n5/rush");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("No city yet · Bandcamp")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Already on Peer Review?" })
    ).toBeInTheDocument();
  });
});
