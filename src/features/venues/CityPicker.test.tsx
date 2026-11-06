import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CityPicker } from "./CityPicker";
import type { CityOptionT } from "./venues.types";

const mockKoln: CityOptionT = {
  id: 2886242,
  name: "Köln",
  admin1Name: "North Rhine-Westphalia",
  countryCode: "DE",
  matchedName: "Cologne"
};
const mockKolno: CityOptionT = {
  id: 763166,
  name: "Kolno",
  admin1Name: null,
  countryCode: "PL",
  matchedName: "Kolno"
};

// Stands in for the /api/cities route.
const mockFetch = vi.fn<typeof fetch>();

// The city ID the picker sends with its form, read the way the form's action does.
const getSentCityId = (): FormDataEntryValue | null =>
  new FormData(screen.getByRole<HTMLFormElement>("form", { name: "Venue" })).get(
    "cityId"
  );

describe("CityPicker", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue(Response.json([mockKoln, mockKolno]));
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("does not search under 2 characters", async () => {
    render(
      <form aria-label="Venue">
        <CityPicker label="City" name="cityId" />
      </form>
    );

    await userEvent.type(screen.getByRole("combobox", { name: "City" }), "k");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("option")).toBeNull();
  });

  it("shows matches with the matched name and region, and picks one on click", async () => {
    const onCityChange = vi.fn();
    render(
      <form aria-label="Venue">
        <CityPicker label="City" name="cityId" onCityChange={onCityChange} />
      </form>
    );

    await userEvent.type(screen.getByRole("combobox", { name: "City" }), "Cologne");
    await userEvent.click(
      await screen.findByRole("option", { name: /Köln \(Cologne\)/ })
    );

    expect(mockFetch).toHaveBeenCalledWith("/api/cities?q=Cologne", expect.anything());
    expect(screen.getByRole("combobox", { name: "City" })).toHaveValue("Köln (Cologne)");
    expect(getSentCityId()).toBe("2886242");
    expect(onCityChange).toHaveBeenCalledWith({
      id: 2886242,
      name: "Köln",
      admin1Name: "North Rhine-Westphalia",
      countryCode: "DE"
    });
  });

  it("shows only the country code for a city with no region", async () => {
    render(
      <form aria-label="Venue">
        <CityPicker label="City" name="cityId" />
      </form>
    );

    await userEvent.type(screen.getByRole("combobox", { name: "City" }), "Kol");

    expect(await screen.findByRole("option", { name: "Kolno PL" })).toBeInTheDocument();
  });

  it("picks the highlighted city with the arrow keys and Enter", async () => {
    render(
      <form aria-label="Venue">
        <CityPicker label="City" name="cityId" />
      </form>
    );
    const input = screen.getByRole("combobox", { name: "City" });

    await userEvent.type(input, "Ko");
    await screen.findAllByRole("option");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(input).toHaveValue("Kolno");
    expect(getSentCityId()).toBe("763166");
  });

  it("clears the picked city when the text changes", async () => {
    const onCityChange = vi.fn();
    render(
      <form aria-label="Venue">
        <CityPicker
          label="City"
          name="cityId"
          initialCity={{ id: 1, name: "Berlin", admin1Name: null, countryCode: "DE" }}
          onCityChange={onCityChange}
        />
      </form>
    );

    await userEvent.type(screen.getByRole("combobox", { name: "City" }), "x");

    expect(getSentCityId()).toBe("");
    expect(onCityChange).toHaveBeenCalledWith(null);
  });

  it("says when no city matches", async () => {
    mockFetch.mockResolvedValue(Response.json([]));
    render(
      <form aria-label="Venue">
        <CityPicker label="City" name="cityId" />
      </form>
    );

    await userEvent.type(screen.getByRole("combobox", { name: "City" }), "Zzz");

    await waitFor(() => {
      expect(
        screen.getByText(
          "No city matches. Check the spelling, or try the name in English."
        )
      ).toBeInTheDocument();
    });
  });

  it("shows errors under the field and marks it invalid", () => {
    render(
      <form aria-label="Venue">
        <CityPicker
          label="City"
          name="cityId"
          errors={["Pick the venue's city from the list."]}
        />
      </form>
    );

    expect(screen.getByRole("combobox", { name: "City" })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByText("Pick the venue's city from the list.")).toBeInTheDocument();
  });
});
