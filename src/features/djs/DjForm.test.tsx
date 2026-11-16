import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LinkPlatformT } from "@/features/catalog/catalog.types";
import type { ActionResultT } from "@/lib/actions/actionResult.types";

import type { DjFormActionT } from "./DjForm";
import { DjForm } from "./DjForm";
import type { DjMatchT } from "./djs.types";

const mockPlatforms: LinkPlatformT[] = [
  { id: "soundcloud", label: "SoundCloud", allowedHosts: ["soundcloud.com"] },
  { id: "website", label: "Website", allowedHosts: [] }
];
const mockChicago = {
  id: 4887398,
  name: "Chicago",
  admin1Name: "Illinois",
  countryCode: "US"
};
const mockExactWithCity: DjMatchT = {
  shortId: "a2b3c4d5",
  name: "DJ Rush",
  city: mockChicago,
  linkLabels: ["SoundCloud"],
  isExact: true
};
const mockExactNoCity: DjMatchT = {
  shortId: "e6f7g8h9",
  name: "DJ Rush",
  city: null,
  linkLabels: [],
  isExact: true
};
const mockNear: DjMatchT = {
  shortId: "j2k3m4n5",
  name: "Rush",
  city: null,
  linkLabels: [],
  isExact: false
};

const CITY_HELP = "Not where you saw them. Check their RA or Instagram if unsure.";
const TYPING_HINT = "Type at least 2 letters, then pick the city from the list.";

// Stands in for the addDj and saveDjEdits server actions.
const mockAction = (result: ActionResultT) =>
  vi.fn<DjFormActionT>(() => Promise.resolve(result));

// Stands in for the /api/djs/similar and /api/cities routes.
const mockFetch = vi.fn<typeof fetch>();

const renderNewForm = (): void => {
  render(
    <DjForm
      action={mockAction({ ok: true, data: undefined })}
      platforms={mockPlatforms}
      submitLabel="Add DJ"
    />
  );
};

describe("DjForm", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("starts empty when adding, with an optional city and a link field per platform", () => {
    renderNewForm();

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
    const city = screen.getByRole("combobox", { name: "Where they're based" });
    expect(city).toHaveValue("");
    expect(city).toHaveAccessibleDescription(`Optional. ${CITY_HELP} ${TYPING_HINT}`);
    expect(screen.getByRole("textbox", { name: "SoundCloud" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Website" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add DJ" })).toBeInTheDocument();
  });

  it("searches for the typed name, trimmed", async () => {
    renderNewForm();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), " DJ Rush ");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/djs/similar?q=DJ+Rush",
        expect.anything()
      );
    });
  });

  it("shows DJs with the same name, and keeps the city optional when they all have one", async () => {
    mockFetch.mockResolvedValue(Response.json([mockExactWithCity]));
    renderNewForm();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "DJ Rush");

    expect(
      await screen.findByRole("region", { name: "There's already a DJ called DJ Rush." })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add as a new DJ" })).toBeInTheDocument();
    const city = screen.getByRole("combobox", { name: "Where they're based" });
    expect(city).not.toHaveAttribute("aria-required");
  });

  it("requires a city when a DJ with the same name has none", async () => {
    mockFetch.mockResolvedValue(Response.json([mockExactWithCity, mockExactNoCity]));
    renderNewForm();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "DJ Rush");

    expect(
      await screen.findByRole("region", {
        name: "There are already 2 DJs called DJ Rush."
      })
    ).toBeInTheDocument();
    const city = screen.getByRole("combobox", { name: "Where they're based" });
    expect(city).toHaveAttribute("aria-required", "true");
    expect(city).toHaveAccessibleDescription(
      `Needed, because another DJ called DJ Rush has no city. ${CITY_HELP} ${TYPING_HINT}`
    );
  });

  it("lists DJs with a similar name apart, and keeps the button and city as they were", async () => {
    mockFetch.mockResolvedValue(Response.json([mockNear]));
    renderNewForm();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "DJ Rush");

    expect(
      await screen.findByRole("region", { name: "Already on Peer Review?" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /already a DJ called/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Add DJ" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Where they're based" })
    ).not.toHaveAttribute("aria-required");
  });

  it("starts with the DJ's values when editing, sends them unchanged, and does not search", async () => {
    const action = mockAction({ ok: true, data: undefined });
    render(
      <DjForm
        action={action}
        platforms={mockPlatforms}
        submitLabel="Save DJ"
        initialValues={{
          name: "DJ Rush",
          city: mockChicago,
          links: { soundcloud: "https://soundcloud.com/djrush" }
        }}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Save DJ" }));

    expect(Object.fromEntries(action.mock.calls[0][1])).toEqual({
      name: "DJ Rush",
      cityId: "4887398",
      link_soundcloud: "https://soundcloud.com/djrush",
      link_website: ""
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends an empty city for a DJ with no city", async () => {
    const action = mockAction({ ok: true, data: undefined });
    render(
      <DjForm
        action={action}
        platforms={mockPlatforms}
        submitLabel="Save DJ"
        initialValues={{ name: "DJ Rush", city: null, links: {} }}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Save DJ" }));

    expect(action.mock.calls[0][1].get("cityId")).toBe("");
  });

  it("shows each error under its field and keeps what was typed", async () => {
    render(
      <DjForm
        action={mockAction({
          ok: false,
          message: "Check the fields marked below.",
          fieldErrors: {
            cityId: [
              "Add where they're based. Another DJ called DJ Rush has no city, so a second one needs one."
            ]
          }
        })}
        platforms={mockPlatforms}
        submitLabel="Add DJ"
      />
    );

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "DJ Rush");
    await userEvent.click(screen.getByRole("button", { name: "Add DJ" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Check the fields marked below."
    );
    expect(
      screen.getByRole("combobox", { name: "Where they're based" })
    ).toHaveAccessibleDescription(
      `Optional. ${CITY_HELP} ${TYPING_HINT} Add where they're based. Another DJ called DJ Rush has no city, so a second one needs one.`
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("DJ Rush");
  });
});
