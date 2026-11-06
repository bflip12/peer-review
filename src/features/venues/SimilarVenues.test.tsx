import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SimilarVenues } from "./SimilarVenues";

const mockBerlin = {
  id: 2950159,
  name: "Berlin",
  admin1Name: "State of Berlin",
  countryCode: "DE"
};

// Stands in for the /api/venues/similar route.
const mockFetch = vi.fn<typeof fetch>();

describe("SimilarVenues", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("shows nothing and does not search without a city", () => {
    const { container } = render(<SimilarVenues name="Tresor" city={null} />);

    expect(container).toBeEmptyDOMElement();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("lists similar venues in the city, each linking to its page in a new tab", async () => {
    mockFetch.mockResolvedValue(
      Response.json([{ shortId: "a2b3c4d5", name: "Tresor Club" }])
    );
    render(<SimilarVenues name=" Tresor " city={mockBerlin} />);

    const link = await screen.findByRole("link", { name: "Tresor Club" });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/venues/similar?q=Tresor&cityId=2950159",
      expect.anything()
    );
    expect(link).toHaveAttribute("href", "/venues/a2b3c4d5/tresor-club-berlin");
    expect(link).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("region", { name: "Already on Peer Review?" })
    ).toBeInTheDocument();
  });
});
