import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DjMatchT } from "./djs.types";
import { ExistingDjs } from "./ExistingDjs";

const mockRush: DjMatchT = {
  shortId: "a2b3c4d5",
  name: "DJ Rush",
  city: { id: 4887398, name: "Chicago", admin1Name: "Illinois", countryCode: "US" },
  linkLabels: ["SoundCloud", "Instagram"],
  isExact: true
};

describe("ExistingDjs", () => {
  it("names the DJ, shows their city and link sites, and links Use this DJ to their page", () => {
    render(<ExistingDjs djs={[mockRush]} />);

    expect(
      screen.getByRole("heading", { name: "There's already a DJ called DJ Rush." })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Chicago, Illinois, US · SoundCloud, Instagram")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Use this DJ: DJ Rush, Chicago, Illinois, US · SoundCloud, Instagram"
      })
    ).toHaveAttribute("href", "/djs/a2b3c4d5/dj-rush");
    expect(screen.getByText("Different person?")).toBeInTheDocument();
  });

  it("counts DJs with the name when there are several", () => {
    render(
      <ExistingDjs
        djs={[mockRush, { ...mockRush, shortId: "e6f7g8h9", city: null, linkLabels: [] }]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "There are already 2 DJs called DJ Rush." })
    ).toBeInTheDocument();
    expect(screen.getByText("No city yet · No links yet")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^Use this DJ/ })).toHaveLength(2);
  });
});
