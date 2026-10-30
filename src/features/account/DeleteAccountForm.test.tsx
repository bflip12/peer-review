import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FormActionT } from "@/features/auth/auth.types";
import type { ActionResultT } from "@/lib/actions/actionResult.types";

import { DeleteAccountForm } from "./DeleteAccountForm";

// Stands in for the deleteAccount server action.
const mockAction = (result: ActionResultT) =>
  vi.fn<FormActionT>(() => Promise.resolve(result));

describe("DeleteAccountForm", () => {
  it("names the handle to type, with the field empty", () => {
    render(
      <DeleteAccountForm
        handle="dj_rush"
        action={mockAction({ ok: true, data: undefined })}
      />
    );

    const field = screen.getByLabelText("Type your handle to confirm");
    expect(field).toHaveValue("");
    expect(field).toHaveAccessibleDescription("Your handle is dj_rush.");
  });

  it("sends the typed handle to the action", async () => {
    const action = mockAction({ ok: true, data: undefined });
    render(<DeleteAccountForm handle="dj_rush" action={action} />);

    await userEvent.type(screen.getByLabelText("Type your handle to confirm"), "dj_rush");
    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));

    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData)).toEqual({ handle: "dj_rush" });
  });

  it("shows a wrong handle on the field and keeps what was typed", async () => {
    render(
      <DeleteAccountForm
        handle="dj_rush"
        action={mockAction({
          ok: false,
          message: "Your account was not deleted.",
          fieldErrors: { handle: ["That is not your handle."] }
        })}
      />
    );

    await userEvent.type(screen.getByLabelText("Type your handle to confirm"), "dj_rus");
    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));

    const field = screen.getByLabelText("Type your handle to confirm");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your account was not deleted."
    );
    expect(field).toHaveAccessibleDescription(
      "Your handle is dj_rush. That is not your handle."
    );
    expect(field).toHaveValue("dj_rus");
  });
});
