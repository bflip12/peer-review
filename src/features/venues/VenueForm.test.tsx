import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionResultT } from "@/lib/actions/actionResult.types";

import type { VenueFormActionT } from "./VenueForm";
import { VenueForm } from "./VenueForm";
import type { VenueFormOptionsT } from "./venues.types";

const mockOptions: VenueFormOptionsT = {
  platforms: [
    { id: "instagram", label: "Instagram", allowedHosts: ["instagram.com"] },
    { id: "website", label: "Website", allowedHosts: [] }
  ],
  soundSystems: [
    { id: "funktion_one", name: "Funktion-One" },
    { id: "other", name: "Other" }
  ]
};

const mockValues = {
  name: "Tresor",
  city: { id: 2950159, name: "Berlin", admin1Name: "State of Berlin", countryCode: "DE" },
  links: { instagram: "https://instagram.com/tresorberlin" },
  soundSystemIds: ["funktion_one"]
};

// Stands in for the addVenue and saveVenueEdits server actions.
const mockAction = (result: ActionResultT) =>
  vi.fn<VenueFormActionT>(() => Promise.resolve(result));

// Stands in for the autocomplete routes, which these tests do not exercise.
const mockFetch = vi.fn<typeof fetch>(() => Promise.resolve(Response.json([])));

describe("VenueForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts empty when adding, with a link field per platform and a checkbox per brand", () => {
    render(
      <VenueForm
        action={mockAction({ ok: true, data: undefined })}
        options={mockOptions}
        submitLabel="Add venue"
      />
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "City" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Instagram" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "Website" })).toHaveValue("");
    expect(
      screen.getAllByRole("checkbox").map((box) => box.getAttribute("value"))
    ).toEqual(["funktion_one", "other"]);
  });

  it("starts with the venue's values when editing, and sends them unchanged", async () => {
    const action = mockAction({ ok: true, data: undefined });
    render(
      <VenueForm
        action={action}
        options={mockOptions}
        submitLabel="Save venue"
        initialValues={mockValues}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Save venue" }));

    const formData = action.mock.calls[0][1];
    expect({
      ...Object.fromEntries(formData),
      soundSystemIds: formData.getAll("soundSystemIds")
    }).toEqual({
      name: "Tresor",
      cityId: "2950159",
      link_instagram: "https://instagram.com/tresorberlin",
      link_website: "",
      soundSystemIds: ["funktion_one"]
    });
  });

  it("shows each error under its field and keeps what was typed", async () => {
    render(
      <VenueForm
        action={mockAction({
          ok: false,
          message: "Check the fields marked below.",
          fieldErrors: {
            name: ["Enter the venue's name."],
            link_instagram: ["Paste an Instagram link, such as instagram.com/name."]
          }
        })}
        options={mockOptions}
        submitLabel="Add venue"
      />
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: "Instagram" }),
      "example.com"
    );
    await userEvent.click(screen.getByRole("button", { name: "Add venue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Check the fields marked below."
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription(
      "As the venue writes it, without the city. Enter the venue's name."
    );
    expect(
      screen.getByRole("textbox", { name: "Instagram" })
    ).toHaveAccessibleDescription("Paste an Instagram link, such as instagram.com/name.");
    expect(screen.getByRole("textbox", { name: "Instagram" })).toHaveValue("example.com");
  });

  it("shows the cap message for the form", async () => {
    render(
      <VenueForm
        action={mockAction({
          ok: false,
          message: "You've added 10 venues today. You can add more tomorrow."
        })}
        options={mockOptions}
        submitLabel="Add venue"
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Add venue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You've added 10 venues today. You can add more tomorrow."
    );
  });
});
