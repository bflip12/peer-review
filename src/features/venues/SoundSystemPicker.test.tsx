import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionResultT } from "@/lib/actions/actionResult.types";

import type { AddSoundSystemT } from "./SoundSystemPicker";
import { SoundSystemPicker } from "./SoundSystemPicker";
import type { SoundSystemT } from "./venues.types";

const mockFunktionOne: SoundSystemT = { id: "funktion_one", name: "Funktion-One" };
const mockDanley: SoundSystemT = { id: "danley", name: "Danley" };
const mockPioneer: SoundSystemT = { id: "b_k3m9p2q7", name: "Pioneer Pro Audio" };

// Stands in for the /api/sound-systems route.
const mockFetch = vi.fn<typeof fetch>();

// Stands in for the addSoundSystem server action.
const mockAdd = (result: ActionResultT<SoundSystemT>) =>
  vi.fn<AddSoundSystemT>(() => Promise.resolve(result));

// The brand IDs the field sends with its form, read the way the form's action does.
const getSentIds = (): FormDataEntryValue[] =>
  new FormData(screen.getByRole<HTMLFormElement>("form", { name: "Venue" })).getAll(
    "soundSystemIds"
  );

const renderPicker = (
  addSoundSystem: AddSoundSystemT,
  initialSoundSystems: SoundSystemT[] = []
): void => {
  render(
    <form aria-label="Venue">
      <SoundSystemPicker
        label="Brands"
        name="soundSystemIds"
        addSoundSystem={addSoundSystem}
        initialSoundSystems={initialSoundSystems}
      />
    </form>
  );
};

describe("SoundSystemPicker", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue(Response.json([mockFunktionOne]));
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  it("starts with the venue's brands as tags and sends their IDs", () => {
    renderPicker(mockAdd({ ok: true, data: mockPioneer }), [mockDanley]);

    expect(screen.getByRole("list", { name: "Brands: picked" })).toHaveTextContent(
      "Danley"
    );
    expect(getSentIds()).toEqual(["danley"]);
  });

  it("picks a brand from the search, then clears the field", async () => {
    renderPicker(mockAdd({ ok: true, data: mockPioneer }));
    const input = screen.getByRole("combobox", { name: "Brands" });

    await userEvent.type(input, "funk");
    await userEvent.click(await screen.findByRole("option", { name: "Funktion-One" }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/sound-systems?q=funk",
      expect.anything()
    );
    expect(getSentIds()).toEqual(["funktion_one"]);
    expect(input).toHaveValue("");
  });

  it("removes a picked brand", async () => {
    renderPicker(mockAdd({ ok: true, data: mockPioneer }), [mockDanley, mockFunktionOne]);

    await userEvent.click(screen.getByRole("button", { name: "Remove Danley" }));

    expect(getSentIds()).toEqual(["funktion_one"]);
  });

  it("adds a brand nothing matches with the keyboard, and picks the returned brand", async () => {
    mockFetch.mockResolvedValue(Response.json([]));
    const add = mockAdd({ ok: true, data: mockPioneer });
    renderPicker(add);

    await userEvent.type(
      screen.getByRole("combobox", { name: "Brands" }),
      "Pioneer Pro Audio"
    );
    await screen.findByRole("option", { name: "Add “Pioneer Pro Audio”" });
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(add).toHaveBeenCalledWith("Pioneer Pro Audio");
    expect(
      await screen.findByRole("button", { name: "Remove Pioneer Pro Audio" })
    ).toBeVisible();
    expect(getSentIds()).toEqual(["b_k3m9p2q7"]);
  });

  it("does not offer to add a name that matches a listed brand", async () => {
    renderPicker(mockAdd({ ok: true, data: mockPioneer }));

    await userEvent.type(
      screen.getByRole("combobox", { name: "Brands" }),
      "funktion one"
    );
    await screen.findByRole("option", { name: "Funktion-One" });

    expect(screen.queryByRole("option", { name: /^Add/ })).toBeNull();
  });

  it("shows the cap message when adding is refused, and picks nothing", async () => {
    mockFetch.mockResolvedValue(Response.json([]));
    renderPicker(
      mockAdd({
        ok: false,
        message: "You've added 10 sound systems today. You can add more tomorrow."
      })
    );

    await userEvent.type(screen.getByRole("combobox", { name: "Brands" }), "Alcons");
    await userEvent.click(await screen.findByRole("option", { name: "Add “Alcons”" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You've added 10 sound systems today. You can add more tomorrow."
    );
    expect(getSentIds()).toEqual([]);
  });
});
