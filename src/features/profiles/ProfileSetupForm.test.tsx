import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FormActionT } from "@/features/auth/auth.types";
import type { ActionResultT } from "@/lib/actions/actionResult.types";

import { ProfileSetupForm } from "./ProfileSetupForm";

// Stands in for the saveNewProfile server action.
const mockAction = (result: ActionResultT) =>
  vi.fn<FormActionT>(() => Promise.resolve(result));

describe("ProfileSetupForm", () => {
  it("starts with both fields empty", () => {
    render(<ProfileSetupForm action={mockAction({ ok: true, data: undefined })} />);

    expect(screen.getByLabelText("Handle")).toHaveValue("");
    expect(screen.getByLabelText("Display name (optional)")).toHaveValue("");
  });

  it("sends the handle and display name to the action", async () => {
    const action = mockAction({ ok: true, data: undefined });
    render(<ProfileSetupForm action={action} />);

    await userEvent.type(screen.getByLabelText("Handle"), "dj_rush");
    await userEvent.type(screen.getByLabelText("Display name (optional)"), "Rush");
    await userEvent.click(screen.getByRole("button", { name: "Create profile" }));

    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData)).toEqual({
      handle: "dj_rush",
      displayName: "Rush"
    });
  });

  it("shows a taken handle on the handle field and keeps both values", async () => {
    render(
      <ProfileSetupForm
        action={mockAction({
          ok: false,
          message: "Choose another handle.",
          fieldErrors: { handle: ["That handle is taken."] }
        })}
      />
    );

    await userEvent.type(screen.getByLabelText("Handle"), "dj_rush");
    await userEvent.type(screen.getByLabelText("Display name (optional)"), "Rush");
    await userEvent.click(screen.getByRole("button", { name: "Create profile" }));

    const handle = screen.getByLabelText("Handle");
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose another handle.");
    expect(handle).toHaveAccessibleDescription(
      "2 to 30 letters, numbers, underscores (_), or dots (.). Shown as @handle. That handle is taken."
    );
    expect(handle).toHaveValue("dj_rush");
    expect(screen.getByLabelText("Display name (optional)")).toHaveValue("Rush");
  });
});
